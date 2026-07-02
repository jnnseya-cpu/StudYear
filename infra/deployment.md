# StudYear Deployment Topology (resolved directive)

> **Frontend on Vercel · Backend + shared data on Firebase · Domain hosted at Hostinger.**
> This is the operative split; it reconciles the disclosed as-is stack (Firebase, Stripe —
> `docs/product/studyear-product-spec.md §3b`) with the delivery plan.

## 1. The split

| Plane | Where | What lives there |
|---|---|---|
| **Frontend** | **Vercel** (`apps/web`) | Next.js 14 — cinematic landing (`/`), authenticated app shell (`/app`), role-scoped surfaces; region `lhr1` (London) |
| **Backend** | **Firebase** (`backend/`) | Auth, Firestore (system of record), Storage (uploads), Functions (`europe-west2`) — the API at `api.studyear.com` |
| **Shared** | **Firebase + `packages/shared`** | Firestore is the shared data plane; `@studyear/shared` is the shared *contract* package (roles, agent IDs, ACU tariffs, plans, margin rules) consumed by both planes |
| **Domain / DNS** | **Hostinger** | `studyear.com` zone — records point at Vercel + Firebase (see `hostinger-dns.md`) |

```
                     Hostinger DNS (studyear.com zone)
                    ┌───────────────┬──────────────────┐
        @ / www / *.studyear.com    api.studyear.com   │
                    ▼                       ▼           │
              VERCEL (frontend)      FIREBASE (backend) │
              Next.js 14, lhr1       Functions europe-west2
                    │                       │
                    └──── @studyear/shared ─┘   (one contract package)
                                │
                    Firestore · Auth · Storage  (shared data plane)
```

## 2. Stabilisation checklist

**Frontend (Vercel)**
- [x] `apps/web` scaffold: Next 14 App Router, landing at `/` (static rewrite), app shell at `/app`
- [x] Security headers (frame-deny, nosniff, referrer-policy)
- [ ] Vercel project linked to repo; production branch = `main`; preview per PR
- [ ] Env vars: `NEXT_PUBLIC_API_BASE`, Firebase web config (public keys only)
- [ ] Wildcard domain `*.studyear.com` added for tenant sub-domains

**Backend (Firebase)**
- [x] `firebase.json` + emulator suite (auth/functions/firestore/storage) for local dev
- [x] Firestore rules encoding: tenant isolation, guardianship/consent gates, derived-only
      wallets, deny-by-default
- [x] Functions skeleton: `health`, `acuAuthorize` (tariff + free-tier gates + hard stop),
      `stripeWebhook` (stub), `redeemCode` (stub)
- [ ] Firebase project `studyear-platform` provisioned; blaze plan; budget alerts
- [ ] Stripe webhook secret + signature verification + idempotency keys
- [ ] AI Gateway egress config (provider keys server-side only, deep-thinking defaults)

**Stability rules (both planes)**
- Clients never write balances, mastery, plans, bookings, or audit — **server-only paths**.
- Every metered action debits ACUs **at initiation**; insufficient balance → `402` +
  top-up path, never overdraft (commercial-model §11).
- Margin telemetry: each Function logs estimated provider cost per action so the
  **66%–100% band** (commercial-model §1) is observable per feature.
- Deploys: frontend and backend deploy independently; contracts change only via
  `packages/shared` PRs touching both sides.

## 3. Environments

| Env | Frontend | Backend | Notes |
|---|---|---|---|
| local | `next dev` | Firebase emulators | full offline loop |
| preview | Vercel preview URL per PR | `studyear-staging` project | seeded fixtures |
| production | `studyear.com` via Hostinger DNS | `studyear-platform` | budget + error alerting |
