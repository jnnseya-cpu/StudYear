# PART 4 · Third-Party Connector Ecosystem

> **Purpose:** StudYear's plug-and-play integration layer — every external capability (payments, identity, comms, AI models, cloud) enters the OS through a **uniform Connector framework**, never via ad-hoc code sprinkled through domains.
>
> **Cross-references:** [`08-bitripay-gateway.md`](./08-bitripay-gateway.md) (payments deep-dive) · [`12-api-specification.md`](./12-api-specification.md) (API envelope, auth) · [`06-security-compliance.md`](./06-security-compliance.md) (secrets vault, data residency, minor-data rules) · [`13-monetisation.md`](./13-monetisation.md) (ACU, billing).

---

## 1. Connector / Integration framework

Every third party is wrapped by a **Connector**: a versioned adapter implementing a shared interface. Domains (ACU Wallet, Roadmap, Learning Tools, Progress Intelligence, Diagnostic) call **capabilities**, never vendors. Swapping SendGrid→Brevo or OpenAI→Claude is a config change, not a code change.

```
   OS Domains  ─────►  Capability Interfaces  ─────►  Connector Adapters  ─────►  Vendor APIs
 (five engines)      (Payments, Email, KYC,          (StripeAdapter,           (Stripe, Persona,
                      ModelRouter, Storage…)           PersonaAdapter…)          OpenAI, R2 …)
```

### 1.1 Core components

| Component | Role |
|---|---|
| **Adapter pattern** | Each vendor implements a capability interface (`EmailProvider`, `KycProvider`, `PaymentProvider`, `ModelProvider`, `StorageProvider`…). Domains depend on the interface only. |
| **Credential vault** | All API keys/secrets stored encrypted (KMS-backed), per-tenant where applicable, rotated, never in code/env-plaintext. Access is audit-logged. See [`06-security-compliance.md`](./06-security-compliance.md). |
| **Webhook engine** | One inbound router: verifies signatures (HMAC/JWT), de-dupes on event id, normalizes to internal events, retries downstream, dead-letters failures. |
| **Rate-limit handling** | Per-connector token-bucket + concurrency caps; respects vendor `Retry-After`; sheds/queues when saturated. |
| **Retry + resilience** | Idempotency keys on writes; exponential backoff + jitter; circuit breaker per connector; timeouts; fallback to alternate provider where a capability has >1 vendor. |
| **Observability** | Per-connector latency, error rate, cost, quota metrics; health surfaced to Platform Admin. |
| **Config registry** | Declares active vendor per capability per tenant/region, plus routing rules (e.g. Model Router, Payments routing). |

### 1.2 Capability interface (shape)

```ts
interface Connector<TReq, TRes> {
  id: string;                 // "stripe", "persona", "openai"
  capability: Capability;     // "payments" | "kyc" | "email" | "model" | ...
  call(op: string, req: TReq, ctx: CallCtx): Promise<TRes>;   // ctx: tenant, idempotencyKey, traceId
  verifyWebhook(raw: Buffer, headers: Headers): WebhookEvent;
  health(): Promise<HealthStatus>;
}
```

### 1.3 Non-negotiables (apply to every connector)
- **Money + identity flows:** signed webhooks, idempotency keys, audit logging, PCI/PII-aware handling.
- **Minor data:** Students are often minors — connectors touching student PII must honour consent, data-minimisation and residency rules ([`06-security-compliance.md`](./06-security-compliance.md)).
- **Multi-provider by default** where a capability is business-critical (payments, AI models, email).

---

## 2. Master connector table

| # | Capability | Best-proven providers | Connects at (OS surface) | Sends → | Receives ← | Integration type |
|---|---|---|---|---|---|---|
| 1 | **Payments** | **Stripe (live)**, **BitriPay (planned)**, Adyen, Checkout.com, PayPal | ACU packs, tuition, subscriptions, marketplace escrow | amount, currency, method, customer ref, metadata | payment status, refunds, disputes, settlements (webhooks) | REST + signed webhooks |
| 2 | **Banking-as-a-Service / Open Banking** | Plaid, TrueLayer, GoCardless, Stripe Financial Connections | Bank-transfer verification, payout accounts, tuition direct debit | account link request, mandates | account/identity, balances, transaction confirmation | OAuth + webhooks |
| 3 | **KYC / KYB & Identity** | **Persona**, **Sumsub**, **Veriff** | Merchant onboarding (schools, tutors), payout eligibility | ID doc, selfie/liveness, business docs, UBO | verification decision, risk signals | Hosted flow + webhooks |
| 4 | **AML screening** | ComplyAdvantage, Sumsub AML, Refinitiv World-Check | Onboarding + ongoing monitoring of merchants | name, DOB, entity, country | sanctions/PEP/adverse-media hits | REST + ongoing-monitoring webhooks |
| 5 | **Fraud prevention** | Stripe Radar, Sift, Ravelin, SEON | Checkout, ACU top-up, marketplace | txn + device + behaviour signals | risk score, block/allow/review | Inline API + webhooks |
| 6 | **Email** | **SendGrid**, **Brevo**, Postmark, Amazon SES | Transactional (receipts, verification, roadmap digests), notifications | recipient, template id, vars | delivery/open/bounce/spam events | REST + event webhooks |
| 7 | **SMS / WhatsApp / Push** | **Twilio** (SMS + WhatsApp), Twilio Verify, FCM/APNs, OneSignal | OTP, alerts, parent notifications, ACU-low warnings | to, channel, template, vars | delivery status, inbound replies | REST + status webhooks |
| 8 | **Maps** | Google Maps Platform, Mapbox | Tutor discovery, school locations, in-person session geo | address/geo query | geocode, places, distance | REST/SDK |
| 9 | **Logistics** | Shippo, EasyPost, DHL/local | Physical materials/certificates dispatch (optional) | address, parcel | rates, labels, tracking | REST + tracking webhooks |
| 10 | **Accounting** | Xero, QuickBooks, NetSuite | Finance sync of settlements, invoices, revenue | invoices, payments, ledger lines | reconciliation status | REST + webhooks |
| 11 | **Tax** | Stripe Tax, Avalara, TaxJar | Checkout/invoice tax calc, filings | amount, jurisdiction, product tax code | tax rate/amount, reports | REST |
| 12 | **CRM** | **Salesforce**, **HubSpot** | School sales pipeline, parent/tutor lifecycle | contacts, deals, events | enriched records, workflow triggers | REST + webhooks |
| 13 | **Analytics** | PostHog, Amplitude, Mixpanel, GA4 | Product usage, engine funnels, ACU behaviour | events, user/tenant props | cohorts, dashboards, flags | SDK + batch export |
| 14 | **AI model providers** | **Anthropic Claude**, **Google Gemini / Vertex AI**, **OpenAI**, Cohere, Mistral | Model Router → all AI engines (Diagnostic, Roadmap, Tools, RAG) | prompt, context, tools, params | completion, embeddings, tool calls, usage | REST/streaming |
| 15 | **Cloud storage** | **Cloudflare R2**, **Amazon S3**, GCS | User uploads, generated docs, RAG source blobs, backups | object bytes, metadata | signed URLs, objects, events | S3 API + event notifications |
| 16 | **Authentication** | Auth0, Clerk, WorkOS (SSO/SAML), Firebase Auth | Login, SSO for schools, MFA | credentials, SSO assertions | tokens, sessions, JIT users | OAuth/OIDC/SAML |
| 17 | **Document generation** | DocRaptor, PDFMonkey, Carbone, Gotenberg | Receipts, certificates, reports, roadmap PDFs | template + data | rendered PDF/doc | REST |
| 18 | **E-signature** | DocuSign, Dropbox Sign, PandaDoc | School contracts, tutor agreements, consent forms | doc, signers | signed doc, audit trail | REST + webhooks |
| 19 | **Customer support** | Zendesk, Intercom, Freshdesk | In-app help, tickets, parent/school support | user, ticket, context | ticket status, replies | REST + webhooks |
| 20 | **Data enrichment** | Clearbit, People Data Labs, Apollo | School/lead enrichment for sales | domain/email | firmographic/contact data | REST |
| 21 | **Currency exchange / FX** | Open Exchange Rates, Fixer, Wise API | Multi-currency ACU/tuition pricing, display, payouts | base/quote pair | rates, converted amounts | REST (cached) |
| 22 | **Subscription billing** | Stripe Billing, Chargebee, Recurly | Parent/School recurring tiers, dunning, proration | plan, customer, usage | invoices, renewals, churn events | REST + webhooks |
| 23 | **Cloud (infra)** | AWS, Azure, GCP (+ Hostinger MariaDB, Redis) | Hosting, LLM workers, vector DB, queues | workloads, data | compute/storage/managed services | SDK/IaC |
| 24 | **Productivity** | **Google Workspace**, **Microsoft 365** | School data import (rosters), calendar, Drive assignments | roster/calendar/file requests | students, events, documents | OAuth + REST |

---

## 3. Per-category notes

### 3.1 Payments — multi-rail
**Why:** monetise ACU packs, tuition, subscriptions, marketplace. **Where:** unified Payments abstraction ([`08-bitripay-gateway.md`](./08-bitripay-gateway.md)). **Data:** amount/currency/method/metadata out; status/refund/dispute/settlement webhooks in. **Providers:** Stripe (live, card + subscriptions), BitriPay (planned, APM + escrow + commission split), Adyen/Checkout.com for enterprise-scale card acquiring, PayPal for consumer wallet reach. All share signed webhooks + idempotency + one ledger.

### 3.2 Banking-as-a-Service / Open Banking
**Why:** verify bank accounts, run direct-debit tuition, confirm bank transfers, provision tutor payout accounts. **Where:** onboarding + tuition + payouts. **Providers:** Plaid (US/CA), TrueLayer (UK/EU), GoCardless (recurring bank debit), Stripe Financial Connections. **Data:** account link/mandate out; verified identity, balances, confirmation of funds in.

### 3.3 KYC / KYB & Identity
**Why:** merchants (schools, tutors) must be verified before live payments/payouts; students who are minors are **never** merchants. **Where:** BitriPay/Stripe merchant onboarding gate. **Providers:** Persona (config-driven flows), Sumsub (strong KYB + AML bundle), Veriff (liveness). **Data:** ID/selfie/business docs out; pass/fail + risk signals in via webhook → drives onboarding state machine ([`08-bitripay-gateway.md`](./08-bitripay-gateway.md) §3).

### 3.4 AML screening
**Why:** sanctions/PEP/adverse-media compliance at onboarding + continuously. **Where:** merchant lifecycle + high-value transaction review. **Providers:** ComplyAdvantage, Sumsub AML, Refinitiv World-Check. **Data:** entity identifiers out; hit lists + ongoing-monitoring alerts in.

### 3.5 Fraud prevention
**Why:** protect ACU top-ups, marketplace escrow, checkout from fraud/abuse. **Where:** inline at payment create + marketplace actions. **Providers:** Stripe Radar (native to Stripe), Sift/Ravelin/SEON (cross-gateway). **Data:** transaction + device + behavioural signals out; risk score + decision in → can force review or block before ACU credit.

### 3.6 Email
**Why:** receipts, email verification, roadmap digests, ACU-low/settlement notices. **Where:** Notifications service. **Providers:** SendGrid (primary), Brevo (alt / EU), Postmark/SES fallback. **Data:** recipient + template + vars out; delivery/bounce/open/spam events in. Minor-aware: parent email for minor-facing comms.

### 3.7 SMS / WhatsApp / Push
**Why:** OTP/2FA, urgent alerts, parent notifications, ACU-low warnings. **Where:** Auth (Twilio Verify) + Notifications. **Providers:** Twilio (SMS + WhatsApp + Verify), FCM/APNs + OneSignal for push. **Data:** recipient + channel + template out; delivery + inbound replies in.

### 3.8 Maps / Logistics
**Maps** (Google Maps / Mapbox): tutor discovery, in-person session geo, school locations. **Logistics** (Shippo/EasyPost): optional physical certificate/material dispatch — rates, labels, tracking webhooks.

### 3.9 Accounting / Tax
**Accounting** (Xero/QuickBooks/NetSuite): sync settlements, invoices, ledger lines for finance close; reconcile against internal ledger. **Tax** (Stripe Tax/Avalara/TaxJar): jurisdiction-correct tax on checkout/invoices, filing reports. Product tax codes assigned per SKU (ACU pack, subscription, tuition).

### 3.10 CRM
**Why:** manage School sales pipeline and parent/tutor lifecycle. **Providers:** Salesforce (enterprise schools/districts), HubSpot (SMB + marketing). **Data:** contacts/deals/lifecycle events out; enriched records + workflow triggers in. Feeds from data enrichment (§3.15).

### 3.11 Analytics
**Why:** measure the Assess→Plan→Learn→Improve loop, engine funnels, ACU consumption behaviour. **Providers:** PostHog (self-host option, product analytics + flags), Amplitude/Mixpanel, GA4 for web. **Data:** events + user/tenant props out; cohorts/funnels/flags in. Student PII minimised/pseudonymised.

### 3.12 AI model providers — Model Router
**Why:** power all five engines (Diagnostic, Roadmap, Learning Tools, Progress Intelligence; ACU meters each call). **Where:** the **multi-provider Model Router** + FastAPI/LLM workers + RAG/vector DB. **Providers:** Anthropic Claude, Google Gemini / Vertex AI, OpenAI (primary trio per stack), Cohere (embeddings/rerank), Mistral (cost/open options). **Data:** prompt + context + tools + params out; completion/embeddings/tool-calls + token usage in. **Usage drives ACU debit** ([`13-monetisation.md`](./13-monetisation.md)); router selects provider by task, cost, latency, availability, with failover.

### 3.13 Cloud storage
**Why:** store uploads, generated docs, RAG source blobs, backups. **Providers:** Cloudflare R2 (zero-egress, primary), Amazon S3 / GCS. **Where:** Learning Tools, Doc-gen, RAG ingestion. **Data:** object bytes + metadata out; signed URLs + object-created events in. Minor uploads scoped + access-controlled.

### 3.14 Authentication
**Why:** login, school SSO (SAML/OIDC), MFA. **Providers:** Auth0/Clerk (app auth), WorkOS (enterprise SSO/SCIM for schools), Firebase Auth. **Data:** credentials/SSO assertions out; tokens/sessions/JIT-provisioned users in. Ties to roles: Admin, Student(minor), Parent, School, Teacher, Tutor.

### 3.15 Document generation / E-signature / Support / Enrichment / FX / Subscription billing
- **Doc generation** (DocRaptor/PDFMonkey/Gotenberg): receipts, certificates, progress reports, roadmap PDFs from template+data.
- **E-signature** (DocuSign/Dropbox Sign): school contracts, tutor agreements, **parental consent** forms — signed doc + audit trail webhook.
- **Customer support** (Zendesk/Intercom): in-app help + tickets for parents/schools.
- **Data enrichment** (Clearbit/PDL/Apollo): firmographic enrichment for school leads → CRM.
- **Currency / FX** (Open Exchange Rates/Fixer/Wise): multi-currency ACU + tuition pricing/display + payouts; rates cached with TTL.
- **Subscription billing** (Stripe Billing primary; Chargebee/Recurly for complex plans): recurring tiers, proration, dunning, churn events.

### 3.16 Cloud (infra) / Productivity
- **Cloud** (AWS/Azure/GCP alongside Hostinger MariaDB + Redis): hosting, LLM workers, vector DB, queues, backups; IaC-managed.
- **Productivity** (Google Workspace / Microsoft 365): OAuth import of school rosters, calendar sync for sessions, Drive/OneDrive assignment files.

---

## 4. Example: adding a connector (webhook path)

Illustrates the uniform inbound path — identical shape for Stripe, BitriPay, Persona, SendGrid, DocuSign, etc.

```
Vendor ──HTTP POST──► /connectors/{id}/webhook
   1. Webhook engine looks up connector + signing secret (credential vault)
   2. connector.verifyWebhook(raw, headers)          # HMAC-SHA256 / JWT, replay-window check
   3. de-dupe on event.id                            # at-least-once → idempotent
   4. connector.normalizeEvent(evt) → InternalEvent  # e.g. payment.succeeded → wallet.acu.credit
   5. publish to OS event bus (retry + DLQ on failure)
   6. audit-log (actor=vendor, object, tenant, traceId)
   7. respond 2xx
```

### 4.1 Outbound call resilience (every write)

```ts
await connector.call("createPayment", req, {
  tenant, traceId,
  idempotencyKey: "idem_...",   // dedupe at vendor + internally
});
// wrapped by: token-bucket rate limiter → timeout → retry(backoff+jitter)
//             → circuit breaker → failover to alt provider (if capability multi-vendor)
```

**Summary of guarantees:** one credential vault, one webhook verifier discipline (signature + replay-window + id de-dupe), one retry/idempotency policy, per-connector rate limiting + circuit breaking, full audit logging on money/identity flows, and provider-agnostic domains so any vendor above is swappable by config. See [`08-bitripay-gateway.md`](./08-bitripay-gateway.md) for the Payments capability in depth and [`06-security-compliance.md`](./06-security-compliance.md) for vault/PII controls.
