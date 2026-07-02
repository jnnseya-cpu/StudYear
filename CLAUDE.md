# Claude working notes — StudYear

## Deployment (owner's current decision, 2026-07)

- **Publishing from GitHub Pages for now**: the live site is
  https://jnnseya-cpu.github.io/StudYear/, served from the `gh-pages` branch,
  which `.github/workflows/deploy-os.yml` rebuilds and republishes on every push.
  Treat Pages as the production surface until further notice.
- **Vercel and Firebase come later**: the remaining steps in
  `infra/go-live-guide.md` (Part 2 Vercel frontend, Part 3 Firebase backend)
  are deliberately deferred by the owner — do not treat them as pending work,
  and do not push the owner to complete them.

## Practical consequences

- Static-export constraints apply to anything shipped now: no rewrites, no
  server headers, `PAGES_BASE_PATH=/StudYear` — use relative links between
  surfaces (see `apps/web/next.config.mjs`).
- Verify changes against the export build:
  `STATIC_EXPORT=1 PAGES_BASE_PATH=/StudYear npm run build --workspace apps/web`.
- Public pages must not expose internal commercial mechanics (e.g. the margin
  band / top-up / referral fine-print was removed from the plans section on request).
