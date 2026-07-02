# PART 4 · BitriPay Integration Gateway

> **Status:** Planned addition **alongside** the live Stripe integration. Stripe remains the primary, production gateway for checkout, subscriptions and ACU packs. BitriPay is added as a **second rail** behind the same unified Payments abstraction — it is additive, never a replacement.
>
> **Cross-references:** [`13-monetisation.md`](./13-monetisation.md) (pricing, ACU economics) · [`12-api-specification.md`](./12-api-specification.md) (canonical API envelope, auth) · [`06-security-compliance.md`](./06-security-compliance.md) (PCI scope, secrets vault, audit log).

---

## 1. Why BitriPay, and where it fits

Stripe covers card-first, subscription-heavy flows in card-mature markets. BitriPay extends StudYear into **alternative payment methods (APMs)** and **emerging-market rails** that Stripe covers weakly or not at all: **mobile money, QR, bank transfer, and local wallets**. It also gives StudYear a native **marketplace settlement / escrow engine** for the tutor marketplace, plus **commission split** primitives that fit the multi-tenant school model.

| StudYear money surface | Today (Stripe) | With BitriPay added |
|---|---|---|
| ACU pack purchases (student/parent/school) | Stripe Checkout | + QR / mobile money / wallet / bank transfer |
| Subscriptions (parent, school SaaS tiers) | Stripe Billing | Stripe stays primary; BitriPay for APM-only regions |
| Tuition payments (parent → school) | Stripe | + local bank transfer, mobile money |
| **Tutor marketplace** (parent → tutor) | Manual / Stripe Connect (partial) | **BitriPay escrow + commission split** |
| Payment links (ad-hoc invoices, tutors, schools) | Stripe Payment Links | **BitriPay Payment Links** |

**Routing rule of thumb:** the unified Payments abstraction (§9) chooses the gateway by `(currency, country, method, use_case)`. Card + subscription in supported regions → Stripe. APM / escrow / commission split → BitriPay. Both write to the same ledger and emit the same internal events.

---

## 2. Merchant Integration Portal

The portal is the self-service surface where a **merchant** (a School tenant, a Private Tutor, or the StudYear platform itself as a master merchant) manages its BitriPay integration.

### 2.1 Capabilities

| Area | Function | Notes |
|---|---|---|
| **API keys** | Generate, rotate, revoke, scope keys | Publishable (`pk_`) + secret (`sk_`) pairs; per-environment; least-privilege scopes |
| **Webhooks** | Register endpoints, choose events, view delivery log, replay | Per-endpoint signing secret (`whsec_`); auto-disable after N consecutive failures |
| **Sandbox mode** | Full API against test data; test cards/MoMo/QR | No real settlement; separate keys (`sk_test_…`) |
| **Production / live mode** | Real settlement; gated behind completed KYC/KYB | Toggle only unlocks after onboarding status = `verified` |
| **Environments** | Strict isolation of `test` vs `live` objects | An object created in test can never resolve in live |

### 2.2 API key model

```
pk_test_…   publishable, test      → client-side (QR render, hosted fields token exchange)
sk_test_…   secret, test           → server-side only, full test API
pk_live_…   publishable, live      → gated on KYC=verified
sk_live_…   secret, live           → gated on KYC=verified, stored in credential vault
```

- Secret keys are **never** returned after creation — shown once, then only a last-4 fingerprint. Storage in the platform credential vault ([`06-security-compliance.md`](./06-security-compliance.md) §Secrets).
- **Scopes:** `payments:read`, `payments:write`, `refunds:write`, `payouts:read`, `links:write`, `webhooks:manage`. Marketplace sub-merchants get restricted scopes.
- **Rotation:** create-new-then-revoke-old with an overlap window; rotation events are audit-logged and can fire a webhook.

### 2.3 Webhook management

- Merchant registers 1..N HTTPS endpoints, subscribes each to event types (§7.1).
- Each endpoint has its own `whsec_`. Delivery is **at-least-once**; receivers MUST be idempotent on `event.id`.
- Dashboard shows per-event delivery attempts, response codes, latency, and a **Replay** button.
- Auto-disable after 20 consecutive `>= 400` responses over 24h; re-enable is manual and audit-logged.

---

## 3. Merchant onboarding (KYC / KYB)

Onboarding gates **live mode** and settlement. It reuses the platform identity stack ([`09-third-party-connectors.md`](./09-third-party-connectors.md) §KYC/KYB — Persona / Sumsub / Veriff) so BitriPay does not re-implement verification.

| Merchant type | Required | Verification path |
|---|---|---|
| **School (tenant)** | KYB: legal entity, registration number, UBO/beneficial owners, bank account, authorised signatory | Sumsub/Persona KYB → BitriPay merchant record |
| **Private Tutor** | KYC: government ID, selfie liveness, tax ID, payout account | Persona/Veriff KYC |
| **Platform (master)** | Full KYB, PCI attestation | Handled once at platform level |

**Onboarding state machine:**

```
draft → info_submitted → kyc_pending → (needs_review ⇄ additional_docs) → verified → live_enabled
                                     ↘ rejected
```

- Minors are **never** merchants. A Student who is a minor can only *pay* (funded by a Parent/School wallet); the merchant of record is always the School or Tutor. See role model in shared ground truth.
- `verified` unlocks `pk_live_`/`sk_live_` and settlement schedule assignment.
- All transitions audit-logged with actor, timestamp, evidence reference.

---

## 4. Payment Services

All payment methods converge on a single **PaymentIntent**-style object (`payment`), so the OS code path is method-agnostic. `payment.method` selects the rail.

| Method | `method` value | Flow shape | Typical StudYear use |
|---|---|---|---|
| **QR payment** | `qr` | Server creates payment → returns QR payload/URL → client renders → payer scans in bank/wallet app → async confirm via webhook | In-person tuition, school kiosk ACU top-up |
| **Wallet payment** | `wallet` | Redirect/deeplink to wallet → approve → webhook | Parent wallet, local e-wallets |
| **Card payment** | `card` | Hosted fields / redirect → 3DS if required → auth+capture | ACU packs where Stripe unavailable |
| **Bank transfer** | `bank_transfer` | Virtual account / reference number issued → payer pushes funds → reconciliation matches ref → webhook | Tuition, large school ACU pool top-ups |
| **Mobile money** | `mobile_money` | STK push / USSD to MSISDN → payer PIN-confirms → webhook | Emerging-market ACU + tuition |
| **Payment link** | (any, via link) | Hosted checkout page bundling ≥1 methods | Ad-hoc tutor invoices, one-off fees |

Common properties: **idempotency key** on create, **HMAC-signed** webhook on state change, immutable ledger entry on `succeeded`, ACU credit only fires on confirmed `succeeded` (never on `created`).

---

## 5. REST API — concrete endpoints

Base: `https://api.bitripay.com/v1` · Auth: `Authorization: Bearer sk_live_…` · JSON. Envelope follows the platform convention in [`12-api-specification.md`](./12-api-specification.md).

### 5.1 Create a payment

```http
POST /v1/payments
Authorization: Bearer sk_live_…
Idempotency-Key: idem_9f3a1c7b-...-ACU-order-88213
Content-Type: application/json

{
  "amount": 4999,
  "currency": "USD",
  "method": "mobile_money",
  "capture": true,
  "customer": { "ref": "usr_2931", "email": "parent@example.com", "msisdn": "+2547..." },
  "metadata": {
    "use_case": "acu_pack",
    "tenant_id": "school_kappa",
    "acu_pack_id": "pack_5000",
    "wallet_target": "school_pool"
  },
  "statement_descriptor": "STUDYEAR ACU",
  "return_url": "https://kappa.studyear.app/wallet/callback"
}
```

```json
201 Created
{
  "id": "pay_01HGB...",
  "object": "payment",
  "status": "processing",
  "amount": 4999,
  "currency": "USD",
  "method": "mobile_money",
  "next_action": { "type": "stk_push", "msisdn": "+2547...", "expires_at": "2026-07-02T10:12:00Z" },
  "livemode": true,
  "created": "2026-07-02T10:07:00Z"
}
```

`status` lifecycle: `requires_action → processing → succeeded | failed | canceled`. ACU credit is applied by the OS **only** on the `payment.succeeded` webhook, keyed by `metadata.acu_pack_id` + idempotency.

### 5.2 Create a payment link

```http
POST /v1/payment_links
Idempotency-Key: idem_link_tutor_7781

{
  "line_items": [
    { "name": "Maths tutoring · 4 sessions", "amount": 8000, "currency": "USD", "quantity": 1 }
  ],
  "methods": ["card", "mobile_money", "bank_transfer", "qr"],
  "use_case": "tutor_marketplace",
  "commission_split": {
    "platform_bps": 1500,
    "sub_merchant": "mch_tutor_5521"
  },
  "escrow": { "enabled": true, "release": "on_confirmation" },
  "expires_at": "2026-07-09T00:00:00Z"
}
```

```json
201 Created
{
  "id": "link_01HGB...",
  "url": "https://pay.bitripay.com/l/9tK2xQ",
  "status": "active",
  "escrow": { "enabled": true, "release": "on_confirmation" }
}
```

### 5.3 Refund

```http
POST /v1/payments/pay_01HGB.../refunds
Idempotency-Key: idem_refund_pay_01HGB_full

{ "amount": 4999, "reason": "requested_by_customer", "reverse_acu": true }
```

`reverse_acu: true` instructs the OS to claw back unspent ACUs granted by the original payment (partial reversal if some ACUs already consumed — see [`13-monetisation.md`](./13-monetisation.md) refund policy). Refunds are audit-logged and emit `refund.succeeded`.

### 5.4 Disputes / chargebacks

```http
GET  /v1/disputes/dp_01HGB...
POST /v1/disputes/dp_01HGB.../evidence     # submit receipts, session logs, delivery proof
POST /v1/disputes/dp_01HGB.../accept       # concede
```

Dispute lifecycle: `needs_response → under_review → won | lost`. On `dispute.created` the OS **freezes** any related escrow release and flags the transaction in monitoring (§8).

### 5.5 Payouts / settlement

```http
GET /v1/settlements?merchant=mch_tutor_5521&status=paid
GET /v1/balance?merchant=mch_tutor_5521       # available, pending, in_escrow
```

---

## 6. Webhook payload + HMAC signature verification

BitriPay signs every webhook. Signature scheme mirrors Stripe's proven model (timestamped HMAC-SHA256) to keep verification code familiar.

**Header:**

```
BitriPay-Signature: t=1751450820,v1=5f8d...c3a
```

**Payload:**

```json
{
  "id": "evt_01HGB...",
  "type": "payment.succeeded",
  "livemode": true,
  "created": 1751450820,
  "data": {
    "object": {
      "id": "pay_01HGB...",
      "object": "payment",
      "status": "succeeded",
      "amount": 4999,
      "currency": "USD",
      "method": "mobile_money",
      "metadata": { "use_case": "acu_pack", "tenant_id": "school_kappa", "acu_pack_id": "pack_5000" }
    }
  }
}
```

**Verification (Node.js — server-side, constant-time compare):**

```js
import crypto from "crypto";

function verifyBitriPay(rawBody, header, secret, toleranceSec = 300) {
  const parts = Object.fromEntries(header.split(",").map(kv => kv.split("=")));
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  const ok = crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) <= toleranceSec;
  if (!ok || !fresh) throw new Error("invalid_signature");
  return true; // then de-dupe on event.id before acting
}
```

**Rules (apply to every money webhook — Stripe and BitriPay alike):**
1. Verify signature on the **raw** body before JSON parse.
2. Reject events older than the tolerance window (replay defence).
3. **Idempotency:** persist `event.id`; ignore duplicates.
4. Act, then `200`. Non-2xx triggers retry with backoff.
5. Every handled event writes an entry to the immutable audit log.

---

## 7. Events & the OS event bus

### 7.1 BitriPay event types (subscribable)

`payment.created`, `payment.processing`, `payment.succeeded`, `payment.failed`, `payment.canceled`, `payment_link.completed`, `refund.succeeded`, `refund.failed`, `dispute.created`, `dispute.updated`, `dispute.closed`, `payout.paid`, `settlement.created`, `merchant.verified`, `apikey.rotated`.

### 7.2 Mapping to internal OS events

| Gateway event | Internal event | OS action |
|---|---|---|
| `payment.succeeded` (acu_pack) | `wallet.acu.credit` | Credit ACU pack to student/parent/school pool |
| `payment.succeeded` (tuition) | `billing.tuition.paid` | Mark invoice paid, receipt |
| `payment.succeeded` (subscription) | `billing.sub.activated` | Provision tier (usually Stripe path) |
| `refund.succeeded` (reverse_acu) | `wallet.acu.debit` | Claw back unspent ACUs |
| `dispute.created` | `risk.escrow.freeze` | Freeze escrow, alert admin |
| `settlement.created` | `finance.settlement.recorded` | Post to ledger |

---

## 8. Revenue Management, Settlement & Escrow

### 8.1 Fee, revenue share & commission split

- **Fee management:** each merchant/use_case has a fee schedule (`percent_bps + fixed`). Platform take on marketplace is expressed as `commission_split.platform_bps`.
- **Revenue sharing:** for schools reselling ACU access, a configurable split routes a slice to the school and the remainder to the platform master merchant.
- **Commission split (marketplace):** on a `pay_…` with `commission_split`, BitriPay splits at settlement — `platform_bps` to platform, remainder (minus BitriPay fee) to the sub-merchant (tutor).

### 8.2 Settlement engine

- Batches confirmed payments per merchant on a **settlement schedule** (`daily`, `weekly`, or `on_confirmation` for escrow).
- Nets refunds, disputes-lost, and fees; produces an immutable `settlement` object with line-item breakdown reconcilable against the OS ledger.
- Emits `settlement.created` / `payout.paid`.

### 8.3 Escrow flow — tutor marketplace

```
Parent pays ──► BitriPay authorises & captures
                     │
                     ▼
             ┌───────────────┐   funds held, NOT yet tutor's
             │    ESCROW      │   balance.in_escrow += amount
             └───────┬───────┘
                     │  session delivered → confirmation
        ┌────────────┼─────────────────────────────┐
        │            │                              │
  on_confirmation    │ dispute.created         auto-release
   (parent confirms) │ (freeze)                (T+X, no dispute)
        │            ▼                              │
        │      hold / evidence / resolve            │
        ▼            │ won→release  lost→refund      ▼
   ┌──────────────────────────────────────────────────┐
   │ SETTLEMENT: split                                 │
   │   platform_bps → platform master merchant         │
   │   remainder − BitriPay fee → tutor sub-merchant   │
   └──────────────────────────────────────────────────┘
        │
        ▼
   payout.paid → tutor payout account
```

Escrow release triggers: `on_confirmation` (parent/school confirms delivery), `auto-release` after a configurable no-dispute window, or admin override. A `dispute.created` **always** freezes release until resolution.

---

## 9. Coexistence with Stripe — Unified Payments abstraction

BitriPay never touches OS business logic directly. Both gateways sit behind a single **`PaymentProvider`** interface; the OS speaks one internal language.

```
        OS domains: ACU Wallet · Tuition · Marketplace · Subscriptions
                                  │
                     ┌────────────▼─────────────┐
                     │     Payments Service      │   (unified abstraction)
                     │  route(currency,country,  │
                     │        method,use_case)   │
                     │  + idempotency + ledger    │
                     │  + normalized webhooks     │
                     └───────┬───────────┬────────┘
                             │           │
                   ┌─────────▼──┐   ┌────▼─────────┐
                   │ StripeAdapter│  │BitriPayAdapter│
                   └─────────┬──┘   └────┬─────────┘
                             │           │
                         Stripe API   BitriPay API
```

**`PaymentProvider` interface (shared contract):**

```ts
interface PaymentProvider {
  createPayment(req: CreatePaymentReq): Promise<Payment>;      // maps to Stripe PaymentIntent | BitriPay payment
  createPaymentLink(req: CreateLinkReq): Promise<PaymentLink>;
  refund(paymentId: string, req: RefundReq): Promise<Refund>;
  getBalance(merchantId?: string): Promise<Balance>;
  verifyWebhook(raw: Buffer, sigHeader: string, secret: string): WebhookEvent; // both use timestamped HMAC-SHA256
  normalizeEvent(evt: WebhookEvent): InternalEvent;            // → wallet.acu.credit, billing.*, risk.*
}
```

**Routing policy (decision order):**

| Condition | Provider |
|---|---|
| Subscription/recurring, region Stripe-supported | **Stripe** |
| Card, region Stripe-supported | **Stripe** |
| Method ∈ {mobile_money, qr, bank_transfer, local wallet} | **BitriPay** |
| Marketplace escrow / commission split | **BitriPay** |
| Fallback if primary provider `unavailable` | route to the other if method supported |

**Invariants across both providers:**
- One **canonical ledger**; every `succeeded`/`refund`/`settlement` posts identically regardless of gateway.
- One **idempotency** discipline (`Idempotency-Key` on create; `event.id` de-dupe on webhooks).
- One **audit log** schema (actor, object, provider, amount, correlation id).
- **PCI:** card PANs never traverse StudYear servers — hosted fields/redirect only, on both gateways ([`06-security-compliance.md`](./06-security-compliance.md) PCI scope).
- Reconciliation job compares provider settlements vs internal ledger nightly; mismatches raise `finance.reconcile.exception`.

---

## 10. Where BitriPay plugs into the OS

| OS surface | Integration | Provider preference |
|---|---|---|
| **ACU pack purchases** | `payment.succeeded(acu_pack)` → `wallet.acu.credit`; hard-stop-at-zero unaffected — credit only on confirmed success | Stripe (card regions) · BitriPay (APM regions) |
| **School shared ACU pool** | Large `bank_transfer` top-ups → credit tenant pool | BitriPay |
| **Tuition (parent → school)** | Invoice → payment / payment link | Either; BitriPay for local rails |
| **Tutor marketplace** | Escrow + commission split + tutor payouts | **BitriPay** (native escrow) |
| **Subscriptions** | Parent/School SaaS tiers | **Stripe** primary; BitriPay APM-only |
| **Ad-hoc invoices** | Payment links | Either |

**Developer Centre (recap):** SDKs (server + client), API docs, sandbox + test fixtures (test MoMo MSISDNs, test QR, test cards), a webhook simulator, and a **plugin-ready** adapter so BitriPay registers into the connector framework in [`09-third-party-connectors.md`](./09-third-party-connectors.md) with zero changes to OS domain code.
