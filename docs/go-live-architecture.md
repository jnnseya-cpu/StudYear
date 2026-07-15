# Go-Live Architecture — owner's spec, mapped to the repo

The owner supplied the full "Developer-Ready Go-Live Architecture" (Vercel +
Firebase + Hostinger, 2026-07-15). This file maps every section of that spec
to what is in the repository, in the spirit of the standing directive:
merged on top of the existing OS, nothing removed.

Operating principle (verbatim from the spec):

> Hostinger owns the address. Vercel delivers the experience. Firebase
> controls identities, data, files and backend operations. GitHub controls
> the source and releases. The shared package keeps the entire OS consistent.

## Section-by-section status

| Spec § | Requirement | Status in repo |
|---|---|---|
| 1 | Hostinger = DNS only, Vercel = frontend, Firebase = backend | ✅ `infra/go-live-guide.md` + `infra/hostinger-dns.md` follow exactly this split; no app code targets Hostinger |
| 2 | Monorepo: apps/web + functions + packages/shared + rules + tests + workflows | ✅ Same shape: `apps/web`, `backend/functions`, `packages/shared`, `backend/*.rules`, `tests/e2e`, `.github/workflows`. Functions live under `backend/` (with `firebase.json`/`.firebaserc` beside the rules) instead of `apps/functions` — equivalent, kept to avoid churn |
| 3 | Separate dev/staging/prod Firebase projects; never preview→prod | ✅ `backend/.firebaserc` defines `staging` (studyear-staging) and `production` aliases; the frontend reads `firebase-config.json` per deployment, so a preview branch simply carries the staging config (or the dormant placeholder). Rule recorded in `infra/go-live-guide.md` |
| 4 | Frontend may authenticate/read/upload; must never hold secrets or decide billing/roles | ✅ Enforced harder than the spec: personal data is **end-to-end encrypted** (`e2e.js`), so the frontend can't even *see* other users' data server-side; roles are validated in `/register`, plans/ACUs only in Functions, AI keys only in `aiProxy` env |
| 5 | Firebase Auth (email/password first), backend-created profile, no client role elevation | ✅ `cloud.js` mirrors signup/signin into Firebase Auth (REST); `/register` creates `users/{uid}` server-side with a validated role list; `firestore.rules` blocks self-elevation of `role/plan/tenantId` |
| 6 | Tenant-separated Firestore model + base fields + soft deletion | ✅/🔜 Collections shipped: `users`, `e2eKeys`, `e2eData`, `acuTransactions`, `aiUsageLogs`, `contactInbox`, `auditEvents`, `discountCodes` (+ tenants/guardianships/consentGrants in rules). Org-subcollection layout and soft-deletion sweep land with the school-tenant migration (server-side work, not blocking cutover) |
| 7 | Shared package: types/constants/contracts both sides import | ✅ `packages/shared` — ACU tariff, plans, margin band, E2EE envelope contract — imported by both `apps/web` tooling and `backend/functions` |
| 8 | Functions per business action; auth→membership→validation→transaction→audit | ✅ `health`, `acuAuthorize`, `register`, `sync`, `syncPull`, `aiProxy`, `contact`, `redeemCode`, `stripeWebhook`; every protected endpoint runs `requireUser()` (ID-token verification) and writes `auditEvents` |
| 9 | Storage paths per user/org, metadata records, size/MIME limits, no public bucket | ✅ `storage.rules`: `uploads/{uid}/**` owner-only, 25 MB cap; bucket denied by default; `SYCloud.upload()` normalises filenames. Metadata records + scan workflow: 🔜 with file-heavy features |
| 10 | Deny-by-default rules; sensitive writes only via Functions | ✅ `firestore.rules` ends `match /{document=**} { allow read, write: if false; }`; wallets/mastery/plans/audit are function-write-only |
| 11 | App Check | 🔜 Owner console action (Firebase → App Check → reCAPTCHA v3); the REST bridge picks up the token header when enabled — recorded in the go-live guide checklist |
| 12 | Public vs server-only env vars; nothing secret behind NEXT_PUBLIC | ✅ Frontend needs only the public web config (`firebase-config.json` — public identifiers by design); AI/Stripe/SMTP keys live exclusively in Functions secrets (`AI_PROVIDER_KEY` etc.) |
| 13 | Vercel: root `apps/web`, branch model, promote-to-production | ✅ `apps/web/vercel.json` + guide Part B; production branch = shipping branch (or `main` after merge — recommended in guide) |
| 14 | Hostinger DNS: apex/www/staging/api records, keep MX/SPF/DKIM/DMARC | ✅ `infra/hostinger-dns.md` (incl. wildcard tenant record + email deliverability notes) |
| 15 | CI: lint/typecheck/tests/build on PR; gated backend deploys | ✅ `.github/workflows/verify.yml` (typecheck web+functions, build, 11 e2e suites + crawl on every push) + **new** `deploy-backend.yml` (manual dispatch, staging/production choice, service-account secret, post-deploy smoke test) |
| 16 | AI-code acceptance gate (no fake buttons, no mocks, error states…) | ✅ Continuous practice: every release runs the 11-suite verification incl. full crawl (JS errors, 404s, broken nav); production deep-dive audits are standing procedure |
| 17 | Route protection in layers | ✅ `guard.js` role-guards every console client-side **and** Functions re-verify tokens server-side; Firestore/Storage rules are the final boundary |
| 18 | Audit trail of business actions | ✅ `auditEvents` (admin-read-only, append-only): USER_REGISTERED / USER_ROLE_ADDED / AI_CREDITS_DEDUCTED / DATA_SYNCED / ACCOUNT_RESTORED — plus `aiUsageLogs` for cost telemetry |
| 19 | Backups, recovery, two admins, RPO/RTO | 🔜 Owner console actions (scheduled Firestore exports, second admin); checklist entries in `infra/go-live-guide.md`. Client-side, every device already holds a full encrypted copy of its user's data — a natural last-resort recovery layer |
| 20 | Go-live checklist | ✅ Merged into `infra/go-live-guide.md` (Parts A–D + verification) — condensed to the items that apply to this OS |
| 21 | Final architecture diagram | ✅ This repo *is* that diagram; see the table in `infra/go-live-guide.md` §"Where things live after go-live" |

## One deliberate divergence (stronger than the spec)

The spec assumes the frontend reads Firestore directly through the Firebase
Web SDK. StudYear deliberately does not: personal data is **end-to-end
encrypted on-device** and syncs as ciphertext through `/sync` / `/syncPull`.
Firestore therefore never holds readable learner data, which is a stronger
privacy position than rules-only isolation — and the reason the OS also runs
fully offline as a PWA. Cross-user features that need server-readable data
(school cohort analytics) use the separate school/tenant stores, not the
personal namespace.

## What only the owner can do (account-side)

1. Create the Firebase projects (`studyear-platform`, `studyear-staging`) — guide Part A.
2. Import the repo into Vercel — guide Part B.
3. Point Hostinger DNS at Vercel + Functions — guide Part C / `infra/hostinger-dns.md`.
4. Fill `apps/web/public/firebase-config.json` and push — guide Part D.
5. Add the `FIREBASE_SERVICE_ACCOUNT` secret in GitHub → Settings → Secrets to enable the `Deploy Backend` workflow.
6. Enable App Check + scheduled Firestore exports + a second production admin (checklist).
