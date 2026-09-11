# StudYear — Production Readiness

Owner decision (2026-09-11): **keep the Vercel + Firebase Functions
architecture.** This is *not* a Firebase App Hosting project and must not be
migrated to one without a deliberate, separately-scoped re-platform. This
document is the honest source of truth for what is production-ready, what is
not, and who has to do the remaining work. It follows the standing rule: **no
false readiness, no cosmetic fixes.**

Cross-references: `docs/RUNBOOK.md` (incident/DR), `docs/ENGINEERING-DIRECTIVE.md`
(how changes are made), `docs/GROWTH-STACK.md` (customer-acquisition inventory).

---

## 1. Architecture (the source of truth)

| Layer | What | Where |
|---|---|---|
| Frontend (production) | Next.js **static export** (`apps/web`), no SSR/server headers relied on for content | Vercel project `stud-year-web` → **https://www.studyear.com/** (Hostinger DNS) |
| Frontend (backup) | Same static export, `PAGES_BASE_PATH=/StudYear` | GitHub Pages `gh-pages` → https://jnnseya-cpu.github.io/StudYear/ (auto-deploys on push via `.github/workflows/deploy-os.yml`) |
| Backend | Firebase **Cloud Functions v2** (europe-west2), Firestore, Auth (email/password), Storage | Firebase project `revision-rocket-4nuir` |
| Frontend→backend switch | `apps/web/public/firebase-config.json` (public identifiers) + `apiBase` for Functions | committed |

Single source per config domain (audited 2026-09-11): one `apps/web/next.config.mjs`,
one `backend/firebase.json` + `.firebaserc`, one `apps/web/vercel.json`, one
root `package-lock.json`. Build artifacts (`.next/`, `apps/web/out/`,
`backend/functions/lib/`) are gitignored and untracked. **There are no
duplicate or conflicting configs to remove.**

## 2. Build & verify (deterministic)

```bash
npm install                                   # clean, no ERESOLVE/peer errors
# Web (what Vercel/Pages serve):
STATIC_EXPORT=1 PAGES_BASE_PATH=/StudYear npm run build --workspace apps/web
# Backend typecheck:
cd backend/functions && npx tsc --noEmit
# Full e2e + 150+ page crawl (CI: .github/workflows/verify.yml):
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node tests/run.mjs
```

Verified 2026-09-11: web build passes; backend `tsc` clean; deps aligned
(Next 14.2.35 · React 18.3.1 deduped · TypeScript 5.6 · Node ≥20, Functions 22).
The full e2e suite runs green in **GitHub Actions**; it cannot complete inside a
network-restricted sandbox because webfonts stall `networkidle` (a sandbox
artifact, not a product fault). The 150+ page crawl runs clean locally.

## 3. Pre-launch readiness gate (do before any paid traffic)

The funnel is **code-complete**; it only earns money if the runtime secrets are
actually set. Prove it — don't assume it. The admin-only readiness probe exists
for exactly this:

```bash
curl -s https://europe-west2-revision-rocket-4nuir.cloudfunctions.net/health \
  -H "Authorization: Bearer <admin-id-token>" | jq .readiness
# readiness.ready must be true (ai + stripe + stripeWebhook all loaded)
```

Then, on production: one real **sign-up → smallest top-up → ACUs credited → AI
action**, and confirm one ops-alert email actually lands.

## 4. Status by domain — honest

| Domain | State | Owner action required |
|---|---|---|
| Repo hygiene / configs | ✅ clean, single-source | — |
| Dependencies / build | ✅ aligned, deterministic | — |
| Backend code (auth, ACU ledger, aiProxy, Stripe checkout+webhook, referrals, backups, alerting) | ✅ code-complete & typechecked | Deploy via "Deploy Backend (Firebase)" workflow; set secrets |
| Firestore/Storage security rules | ✅ production-grade in code (tenant isolation, consent gates, no self-elevation, default-deny) | **Run the Firebase Rules simulator** in console (cannot be done from sandbox) |
| Payments (Stripe) | ✅ wired (dynamic Checkout + idempotent webhook) | Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`; register webhook endpoint in Stripe |
| AI (aiProxy) | ✅ enforced (ACU tariff, caps, failover, timeouts) | Set at least one of `OPENAI_/ANTHROPIC_/GEMINI_API_KEY` |
| E2E encryption | ✅ present (`e2e.js` + TweetNaCl, loaded in `guard.js`) | — |
| Conversion tracking | ✅ Meta Pixel + GTM live; GA4/Ads wired but dormant | Paste real `GA4`/`ADS` IDs in `consent.js` |
| PWA / mobile | ✅ manifest + service worker + mobile shell | Native wrapper only after §3 passes |
| Monitoring / backup / rollback | ✅ `alertOwner`, `dailyBackup`, RUNBOOK | Set SMTP + `BACKUP_BUCKET`; do one restore + rollback drill |
| App Check (endpoint attestation) | ⚠️ off | Enable reCAPTCHA-v3 App Check in console |
| Load / capacity | ⚠️ tool exists (`tests/load/loadtest.mjs`), not run on prod | Run it; set a GCP billing budget alert; tune `aiProxy maxInstances` |
| Independent penetration test | ⚠️ not done | Commission one before claiming "hardened" |
| Legal (privacy/terms/DPA/DPIA) | ⚠️ self-authored | Solicitor pass; add ICO/company number; prepare schools DPA/DPIA |
| Social proof / testimonials | ⚠️ `proof.json` empty (honest) | Add 2–3 real, permissioned pilots/quotes |

## 5. What is deliberately NOT claimed

- **Not "hacker-impenetrable."** No system is. The posture above is strong;
  the honest gaps are App Check and an external pen test.
- **Not verified live from here.** The sandbox blocks `studyear.com` and
  `cloudfunctions.net` (403) and holds no Firebase/Vercel credentials, so live
  deployment and runtime checks are owner actions.
- **"Dummy data" is not blanket-removed.** The `/demo/` sandbox and seeded
  consoles are an intentional owner feature ("preserve & enhance"). The
  genuinely misleading items were already fixed (fake "LIVE" hero counters
  removed; demo tutors relabelled "preview — register interest").

## 6. Owner action checklist (the short path to published)

1. Set Functions secrets (Stripe ×2, at least one AI key, SMTP, `BACKUP_BUCKET`) and deploy the backend.
2. Hit `/health` → confirm `readiness.ready === true`.
3. Run one real purchase → ACU → AI on production; confirm an alert email lands.
4. Run the Rules simulator; run the load test; set a GCP billing budget alert.
5. Enable App Check; commission a penetration test.
6. Solicitor pass on legal + ICO/company number + schools DPA/DPIA.
7. Send real social handles + 2–3 proof quotes → the last SEO/E-E-A-T + proof items close.

Until 1–3 are done, the platform is **deployable but not proven live** — that is
the honest line between "code-ready" and "production-ready."
