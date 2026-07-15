# Claude working notes — StudYear

## Deployment (owner's current decision, 2026-07-15 — LIVE)

- **Production is https://www.studyear.com/** — the Vercel project
  (`stud-year-web`, root `apps/web`, production branch
  `claude/continue-from-here-y37pvu`) behind Hostinger DNS. Everything is
  based on this domain: canonical tags, sitemap, invite links, docs.
- **Backend is Firebase project `revision-rocket-4nuir`** (europe-west2):
  Auth (email/password), Firestore, Storage, Functions. The frontend switch
  is `apps/web/public/firebase-config.json` (live values committed — public
  identifiers). Backend deploys via the manual "Deploy Backend (Firebase)"
  GitHub workflow (`FIREBASE_SERVICE_ACCOUNT` secret) or `cd backend &&
  firebase deploy`.
- **GitHub Pages stays as the backup frontend**:
  https://jnnseya-cpu.github.io/StudYear/ keeps auto-deploying from
  `gh-pages` via `.github/workflows/deploy-os.yml` on every push.

## Practical consequences

- Static-export constraints apply to anything shipped now: no rewrites, no
  server headers, `PAGES_BASE_PATH=/StudYear` — use relative links between
  surfaces (see `apps/web/next.config.mjs`).
- Verify changes against the export build:
  `STATIC_EXPORT=1 PAGES_BASE_PATH=/StudYear npm run build --workspace apps/web`.
- Public pages must not expose internal commercial mechanics (e.g. the margin
  band / top-up / referral fine-print was removed from the plans section on request).

## Standing owner directives (2026-07)

- **Preserve & enhance**: anything the owner adds or specifies for the OS must never
  be removed — it may only be improved and enhanced (mirrors docs/REQUIREMENTS-MANDATE.md).
- **Admin console mirrors production as-is**: the owner streams real admin screens
  (dashboard, users, tutors, blog, content, billing, AI costs, analytics) — replicate
  them faithfully, but MASK real customer emails/PII in the public static bundle;
  full PII belongs only in the secure backend admin.
- Admin preview accounts are created via invite code (owner has it; hash-gated in auth).
