# Growth stack — the single record

The authoritative inventory of StudYear's customer-acquisition code. **Read
this before building anything "growth" — it exists to stop the same capability
being rebuilt under a new name.** If you add, merge, or remove a growth module,
update this file in the same commit.

## Principle

There is **one** AI-marketing engine: `growth.js`. New marketing capabilities
become **tools inside it**, not new top-level modules. The only separate growth
pieces are the referral card (`invite.js`) and the backend endpoints that feed
them.

## Modules

| File | Global | Job | Mounted in | Notes |
|------|--------|-----|-----------|-------|
| `apps/web/public/growth.js` | `SYGrowth` | The AI Growth Engine — the single marketing surface. 10 role-adaptive tools for partners; +2 owner-only tools in the admin mount. | tutor, school, employer, college, authority, **admin** | Mounts into `#growth-root`. Role from `SY.session.role`. |
| `apps/web/public/invite.js` | `SYInvite` | Referral / invite card (personal invite link + share + join stats). | account, study, parent | Mounts into `#invite-root`. Distinct from the engine — this is the referral loop UI. |

`reach.js` (`SYReach`) is **not** a growth module — it is the accessibility /
international / teacher-quick-bar layer. Don't confuse it with marketing.

## `growth.js` tools

**Partner tools (all consoles, role-adaptive):**
1. Social media post generator · 2. Advert creator · 3. Email campaign
generator · 4. Landing page builder (downloadable HTML) · 5. Hashtag generator
· 6. Video script generator · 7. Performance recommendations · 8. Audience
optimisation · 9. Campaign analytics (computes CTR/CPC/CPM/CPA/ROAS locally,
then AI reads) · 10. Best posting time.

**Owner-only tools (appear only when `SY.session.role === 'admin'`):**
- **📅 Content calendar** — a rolling 28-idea acquisition calendar (every angle
  points at `studyear.com/free`); AI-writes today's short-video script or a
  7-day batch. *(Absorbed the former `social.js`.)*
- **✉️ Captured leads & nurture** — loads the captured free-tool leads from the
  secure backend, shows segment counts, **masks emails on-screen** (PII
  mandate), exports a **mail-merge CSV** (full addresses, admin's machine
  only), marks leads contacted, and AI-drafts a lifecycle email sequence for a
  chosen segment. *(Absorbed the former `nurture.js`.)*

Every tool routes through `SYAI.ask` and is **metered in ACUs** (gated on
balance, charged on success only — no free passes). Costs: most 1–2 ACUs;
landing page 3; content calendar 2; nurture draft 3.

## Backend (Firebase Functions, `backend/functions/src/index.ts`)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `lead` | public (honeypot + email check) | Capture an email from the free tools → `leads/{sha1(email)}`. |
| `refcode` | user | The signed-in user's invite code + join stats. |
| `register` (ref path) | user | On a referred join, credits both sides 50 ACUs (idempotent, capped). |
| `adminLeads` | admin | The captured-lead feed + segment counts for the leads tool. |
| `adminLeadMark` | admin | Flag leads contacted. |

Client bridge (`cloud.js` → `SYCloud`): `lead`, `refCode`, `leadsList`,
`leadMark`. All degrade to `null`/`false` offline so the UI never dead-ends.

## Off-code growth assets

- **Programmatic SEO**: `scripts/gen-free.mjs` generates 22 `/free/<subject>/`
  ranking pages from the one wedge tool at `apps/web/public/free/index.html`.
- **Blog**: `apps/web/public/blog/posts.json` (committed source) + build-time
  per-post pages via `scripts/gen-blog.mjs`.
- **Sitemap**: `apps/web/public/sitemap.xml` (BLOG + FREE blocks).

## History (why this file exists)

Four "growth agents" were built in sequence: (1) programmatic SEO pages,
(2) referral loop + lead capture, (3) `social.js` content autopilot,
(4) `nurture.js` lifecycle emails. #3 and #4 duplicated tools `growth.js`
already had (social/video/email). On **2026-08-14** they were consolidated:
their genuinely-new parts (the content calendar and the captured-lead feed)
became the two owner-only tools in `growth.js`, and the standalone modules +
their tests were deleted. Service worker: v109.

## Owner-side dependencies (not code)

- The `adminLeads`/`adminLeadMark` feed only returns real leads once the
  Firebase backend is redeployed. The tools still draft/export without it.
- Submit `sitemap.xml` to Google Search Console + Bing for the SEO pages to
  index.
