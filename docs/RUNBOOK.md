# StudYear — Incident Response & Disaster Recovery Runbook

Live operational procedures. Backend = Firebase project `revision-rocket-4nuir`
(europe-west2). Frontend = Vercel (`stud-year-web`) + GitHub Pages backup.
Production branch `claude/continue-from-here-y37pvu`.

## Roles & escalation
- **Incident owner:** the platform owner (admin allowlist: `ADMIN_EMAILS`).
- **Alert channel:** email to `ALERT_TO` (falls back to `MAIL_TO`, then the first
  `ADMIN_EMAILS`). Critical events auto-email via `alertOwner()` (throttled 1/hr/type)
  and are recorded in the `opsAlerts` Firestore collection.

## What alerts fire automatically
| Alert key | Meaning | First action |
|---|---|---|
| `stripe_webhook_fail` | A Stripe webhook errored (credit may be delayed) | Check Stripe dashboard → Webhooks → resend; verify `STRIPE_WEBHOOK_SECRET`. |
| `acu_enforce_error` | ACU enforcement failed **open** (free AI served) | Check Firestore health; if sustained, set `AI_ENFORCE_ACUS=0` only if it's blocking legit users, else investigate. |
| `ai_all_providers_failed` | Every AI provider key failed | Check provider status/keys (`AI_PROVIDER_KEY`/`OPENAI_API_KEY`/…); rotate if quota/expired. |
| `backup_failed` | Daily Firestore export failed | See "Backups" below — check bucket + SA IAM. |

Every `aiProxy` response carries `X-Request-Id` (also in the JSON `rid` and on
`aiUsageLogs`) — quote it from a user report to find the exact log line.

## Common incidents

### AI is down / erroring for everyone
1. Check `ai_all_providers_failed` alerts + Cloud Functions logs (`aiProxy`).
2. Verify provider keys are set and have quota. Rotate the key env + redeploy.
3. Kill switch: `AI_ENFORCE_ACUS=0` only relieves ACU 402s, not provider outages.

### Payments not crediting
1. Stripe Dashboard → Developers → Webhooks: check delivery + signing secret
   matches `STRIPE_WEBHOOK_SECRET`. Use "Resend" for failed events (idempotent —
   safe to resend; each event applies once).
2. Confirm the event id isn't stuck: `stripeEvents/{id}` in Firestore.

### Cost runaway / abuse
- Tighten `AI_DAILY_CAP_FREE` / `AI_DAILY_CALL_CAP`. Enable `AI_REQUIRE_VERIFIED=1`
  (after confirming verification emails work) to stop disposable-email farming.

### Data-subject erasure request (UK GDPR Art.17)
- Self-service: the user's Account → "Delete my account" calls `/selfDelete`.
- Manual: admin console → Users → Delete (`adminUserOp` op=delete). Financial
  ledger rows are retained (legal), unlinked from a live account.

## Backups
- **Automated:** `dailyBackup` scheduled function exports Firestore to
  `gs://<BACKUP_BUCKET or default>/firestore-backups/<YYYY-MM-DD>` at 02:00.
- **One-time setup (owner):** create the bucket; grant the functions SA
  `roles/datastore.importExportAdmin` + object-write on the bucket; set
  `BACKUP_BUCKET`; add a lifecycle rule (e.g. 30-day retention).
- **Verify a backup (do this before launch — a backup never restored is not a backup):**
  ```bash
  gcloud config set project revision-rocket-4nuir
  gcloud firestore export gs://<bucket>/firestore-backups/manual-$(date +%F)   # take one now
  # restore into an ISOLATED test project, never prod:
  gcloud firestore import gs://<bucket>/firestore-backups/<YYYY-MM-DD> --project <TEST_PROJECT>
  # then spot-check record counts + a few known docs.
  ```
- **RPO:** 24h (daily export) — tighten with Firestore PITR if needed.
  **RTO:** ~1h (import + smoke test).

## Rollback
- **Backend:** re-run the "Deploy Backend (Firebase)" GitHub workflow from a
  previous good commit (`git checkout <sha>` → workflow_dispatch), or from Cloud
  Shell: `cd backend && npx firebase-tools deploy --only functions --project revision-rocket-4nuir`.
  Functions are versioned; the last green deploy is the rollback target.
- **Frontend (Vercel):** Vercel Dashboard → Deployments → previous → "Promote to
  Production" (instant, no rebuild). Feature kill-switches: `AI_ENFORCE_ACUS`,
  `AI_REQUIRE_VERIFIED`.
- **Drill (do once before launch):** promote the previous Vercel deploy, confirm
  the site serves, then re-promote current — record the elapsed time.

## Key rotation
- Provider/Stripe/mail keys live in GitHub Actions secrets → re-deploy backend to
  push new values into the Functions runtime. Rotate `STRIPE_WEBHOOK_SECRET` in
  Stripe + secret together.

## Load / performance verification (run before full public launch)
```bash
TARGET_URL="https://www.studyear.com/how-it-works/" CONCURRENCY=50 DURATION=30 node tests/load/loadtest.mjs
```
Targets: critical p95 < 800ms, error rate < 1%, recovery after spike < 5 min.

## Pre-ad-spend readiness gate (do this before any paid campaign)
The funnel is code-complete but only earns money if the runtime secrets are
actually loaded. Prove it — don't assume it:

1. **Readiness probe.** As a platform admin, GET `/health` with your Firebase
   ID token as a bearer:
   ```bash
   curl -s https://europe-west2-revision-rocket-4nuir.cloudfunctions.net/health \
     -H "Authorization: Bearer <admin-id-token>" | jq .readiness
   ```
   `readiness.ready` must be `true`. It reports booleans only (never secret
   values): `ai` (an AI provider key is loaded) + `aiProviders`, `stripe`
   (`STRIPE_SECRET_KEY` set), `stripeWebhook` (`STRIPE_WEBHOOK_SECRET` set),
   `mail`, `backupBucket`. If `ready` is false, a paying visitor hits a 503 on
   AI or a broken checkout — do not spend on ads.
2. **One real end-to-end test on prod:** sign up → buy the smallest top-up →
   confirm ACUs credited → run one AI action. This is the only proof the whole
   chain works.
3. **Confirm an alert lands:** trigger (or wait for) one `opsAlerts` write and
   confirm the email actually reaches ALERT_TO/MAIL_TO. Alerting is silent if
   SMTP isn't really delivering.
4. **Set a GCP billing budget alert** (console: Billing → Budgets & alerts) as
   the runaway backstop — the `AI_DAILY_*` caps and `aiProxy maxInstances:20`
   bound cost, but a budget alert is the last line of defence during a spike.

## Marketing / conversion IDs (where to paste them)
All browser tracking is consent-gated in `apps/web/public/consent.js`. Meta
Pixel and GTM are already set. To measure paid-ad ROI, set the two Google IDs
at the top of that file (they stay dormant while empty — nothing loads or
fires): `GA4` (`G-…` Measurement ID), `ADS` (`AW-…` Google Ads ID) and
`ADS_PURCHASE_LABEL` (the Purchase conversion label). Use these for a direct
gtag install OR configure the same tags inside the GTM container — not both, to
avoid double-counting. The `Purchase` event fires on the real Stripe return, so
it only produces revenue conversions once the Stripe secrets (above) are live.
