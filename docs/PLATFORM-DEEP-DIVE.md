# StudYear — Platform Deep Dive & Roadmap to Category-Defining

*Prepared 2026-11-05. A whole-platform audit across six dimensions (architecture &
data integrity, feature & curriculum coverage, AI & pedagogy, UX & accessibility,
security & child-data compliance, and competitive/market positioning). Findings are
evidence-backed with `file:line` references. This is the single source of truth for
turning StudYear into the most powerful platform of its kind.*

---

## 0. Executive verdict

**StudYear is a genuinely ambitious, unusually broad, mostly-real all-in-one AI
education platform — held back by one foundational flaw, one serious security hole,
and a credibility gap (curriculum depth + proven efficacy) that stands between it and
market leadership. None of these is fatal; all are fixable on a clear timeline.**

The honest state today:

- **Breadth is a real asset.** 30 student tools, six working role surfaces
  (student/parent/teacher/school/tutor + authority/employer/college), and a ~2,350-line
  backend. Several engines are *fully real*, not demos: SM‑2 spaced repetition, the exam
  simulator, an 11‑mode AI tutor, the SkillRush fluency engine, the maker suite, and the
  school "AI agents." No persona is a stub.
- **The engineering is disciplined where it counts.** Server‑authoritative ACU metering,
  HMAC‑verified Stripe webhooks, an E2E‑encrypted sync contract, consent gating that
  genuinely excludes children from tracking, and a careful, non‑removable AI safety
  preamble.
- **But three things block "most powerful of its kind":**
  1. **A foundational data-model flaw** (local‑vs‑cloud account duality) that caused every
     "data gone / wrong / not synced" problem this week and will keep doing so until the
     server is the single source of truth. *(This is the root cause the week's firefighting
     kept hitting.)*
  2. **A standing P0 security hole**: admin authority is an email allow‑list with a
     verification‑exempt address, reachable through normal public sign‑up — a latent full
     admin takeover.
  3. **A credibility gap**: thin verified curriculum depth (only 17 subjects structured,
     6 at A‑level, no stored past papers, no verified primary), an AI layer with no
     grounding (RAG) and no eval set, and **zero independent efficacy evidence** — the
     single sharpest gap versus the market.

**Launch readiness: still NO‑GO for public launch** until the P0 security fix, the
data‑integrity unification, and verifiable parental consent are in. A *restricted,
invite‑only pilot* is reachable quickly once those three land.

---

## 1. What StudYear is (one paragraph)

A UK AI education platform spanning EYFS → A‑level → university, serving students,
parents, teachers, schools/MATs and tutors on one connected academic record, monetised
through subscription plans plus a transparent pay‑per‑use "ACU" (AI Credit Unit) wallet.
The real app is a set of static, vanilla‑JS pages in `apps/web/public/` with shared
behaviour injected by `guard.js`/`cloud.js`/`ai.js`/`billing.js`; the backend is Firebase
Functions (Cloud Run gen2, europe‑west2, project `revision-rocket-4nuir`) with Firestore,
Auth and Storage. Production is `www.studyear.com` (static export) with a GitHub Pages
mirror; the repo is **public**.

---

## 2. Dimension findings

### 2.1 Architecture & Data Integrity — *the root cause*

**The single most important fact:** StudYear does **not** have one source of truth for
identity or user data. It has two half‑connected stores — a per‑account `localStorage`
namespace (`guard.js` `window.SY`) and Firebase Auth/Firestore — reconciled only
partially, opportunistically, and only when the device holds a cloud token *and* the
backend is reachable.

Consequences seen first‑hand this week:
- A device can run an account that **looks** logged in but has no cloud token (a
  "local‑only session"); it shows stale local data and never syncs. The UI even says
  "⚠ Your code isn't shared across devices yet."
- The same account shows **different numbers** in admin (server) vs the device (local) —
  e.g. a student at 619 ACUs on the server, 19 on their device.
- Data "disappears" when the session/namespace context changes (the study plan lives in a
  different namespace than the one currently loaded).
- Admin "create account" failed silently when the cross‑origin call dropped → the account
  was never created server‑side → "can't be found."

**Why calls drop:** gen2 functions scale to zero; a cold first hit can fail cross‑origin
with no CORS header → "Failed to fetch." The same‑origin `/gapi` proxy that would make this
reliable is **not live** on production (`/gapi/fn/health` returns the app 404), so the
browser must reach `cloudfunctions.net` directly. We added client‑side retry (ai.js, the
key vault, and the central `cloud.js api()`), which masks cold starts but does not fix the
root.

**ACU/financial integrity:** the ledger side is good — append‑only `acuTransactions`,
`walletBalance = Σ deltas`, idempotent credits, HMAC‑verified webhooks, server‑side
enforcement and debit‑on‑success. The weakness was on **credit**: most grant paths were
client‑only. We fixed the admin grant (now `adjustAcus` → ledger) and made the admin list
read the real balance — but **student top‑ups, plan‑assignment grants, referral and
national‑win credits still need to route through the server ledger**.

> **Framing for the owner:** everything that went wrong this week is one root cause — the
> platform stores user data on the device and only loosely syncs it. The fix isn't more
> patches; it's making the server the single source of truth for identity, money (ACUs),
> and learning data.

### 2.2 Feature & Curriculum Coverage

**Breadth is genuinely broad and mostly real.** Fully‑real engines include spaced
repetition (SM‑2, `study/index.html:6085‑6118`), the exam simulator, the 11‑mode AI tutor
(`:2965‑2984`), the maker suite, SkillRush's 14‑skill fluency engine, improvement‑based
leagues, and the school AI agents. The course generator is honest — it grounds on a verified
spec when it has one, uses AI otherwise, and shows a truthful "No verified outline" card.

**The defining weakness is verified curriculum *depth*:**
- Only **17 subjects** have hand‑authored verified spec outlines (`CURRICULUM`,
  `study/index.html:4855‑5009`): **15 GCSE**, **only 6 A‑level** (Bio, Phys, Geog, Maths,
  Economics, Psychology). Everything else falls to live‑AI generation.
- Outlines are **AQA‑shaped**; no stored per‑board (Edexcel/OCR/WJEC/CIE/SQA) divergence,
  despite 9 boards being selectable.
- **No stored past‑paper / mark‑scheme corpus** — "Past papers" is external links only
  (`renderPapers:2826`). Market leaders (Save My Exams, PMT, Seneca) have question‑level
  banks with mark schemes and autograding.
- **No verified primary (EYFS/KS1/KS2) curriculum** — deliberately AI‑only; SkillRush
  covers fluency but not the knowledge curriculum.
- Thin: tutor marketplace (discovery only; booking/payouts/DBS unbuilt), live classroom
  (Jitsi iframe only), MIS/SSO (config stubs), parent↔child consent linking.

### 2.3 AI & Pedagogy Engine

**Verdict: a well‑engineered heuristic study app with a thin, prompt‑only AI layer — not
an adaptive engine in the research sense.** There is genuine (simplified) spaced repetition
and a thorough grade‑mapping layer, but **no knowledge tracing, no item calibration, no
knowledge graph, no misconception library, no content verification, and no eval set.**

- "Mastery" = accuracy mean minus a recency penalty (`:5742‑5757`); the diagnostic is
  9 MCQ + 1 written across up to 24 subjects, and mastery is **60% the student's own
  confidence slider** + 40% accuracy (`:3640‑3645`) — a confidence survey with a token quiz.
- **Grounding is the Achilles' heel:** cheapest‑tier models only
  (`gpt‑4o‑mini`/`haiku`/`flash`, `index.ts:759‑763`) with **no RAG**; the lesson prompt
  literally asks the model to invent spec codes ("AQA 4.4.1 style where known",
  `:4690‑4691`); generated MCQ answer keys are **never verified**, so a wrong key becomes
  ground truth and poisons mastery, predicted grade and the review queue.
- Real bright spots: a genuine SM‑2 scheduler (but *lapse‑only* — correct answers are never
  scheduled for retention, `:6088`); a thoughtful tutor prompt layer with SVG diagram
  rendering; a non‑removable server safety preamble (`index.ts:981‑982`).
- A silent bug: the server clamps output to 2048 tokens (`index.ts:798`) but lessons request
  3000 (`:4696`) → lessons truncate, sometimes dropping the end quiz.

### 2.4 UX & Accessibility

**Strong engineering under the hood** (cross‑device recovery, local‑only self‑heal banner,
mature PWA update strategy, age‑correct attainment language, an adaptive dyslexia/SEN
"Learning Profile"). Weaknesses concentrate in **the youngest‑user journeys** and
**assistive‑tech parity**:

- **P0 — No parent‑creates‑child flow.** A parent can only *link* an existing child via an
  8‑digit code; there is no way to *create* a child account. A 5–10‑year‑old cannot
  self‑register an email/password account — yet that's the only origination path. Incoherent
  for an EYFS→KS2 product.
- **P0 — Adult billing language leaks into the kids workspace.** Primary children see
  toasts like "Not enough ACUs — Top up in My account → Plans & top‑up" (`:1378`, `:4245`).
  "ACUs/top‑up/subscribe/wallet" shown to 7‑year‑olds.
- **P0 — No screen‑reader live regions** for feedback almost anywhere (the correct pattern
  exists in one file but isn't applied); no skip links; OS reduced‑motion ignored (an
  infinite twinkling star runs for the youngest users).
- Other: dead under‑13 consent branch + stale hardcoded DOB cap (`auth/index.html:78,241`);
  employer/college orphaned in mobile nav; 42px tap targets; no ARIA on tab systems.

### 2.5 Security, Privacy & Child Compliance

**Disciplined code, but a serious new P0 and real compliance gaps.**

- **P0 — Latent admin takeover.** `requireAdmin` (`index.ts:1349‑1359`) grants admin to any
  Firebase identity whose email is in `ADMIN_EMAILS`, and **skips email verification** for
  `ADMIN_VERIFY_EXEMPT` (`admin@studyear.com`) — all committed in the **public** repo, with
  no Firebase custom claims anywhere. If `admin@studyear.com` isn't already registered in
  Firebase Auth, an attacker can sign it up via the open public sign‑up, get a token, and
  pass `requireAdmin` with no inbox — yielding every user's PII, account deletion,
  `grantAcus ±1,000,000`, and write access to the API‑key vault. **Verify today that
  `admin@studyear.com` is already claimed, then fix properly.**
- **P1 — XSS → token‑theft chain.** CSP ships `'unsafe-inline'` (`csp.mjs:16`), auth tokens
  live in `localStorage` (`cloud.js:180‑187`), and `innerHTML` appears **821 times across
  117 files**. The team is mostly careful (escaping in admin, in the AI renderer), but a
  single unescaped **cross‑account** field (a child‑set name/photo rendered in a
  parent/teacher/admin view) becomes stored XSS → full token theft.
- **P1 — Children's Code / GDPR gaps:** parental consent is a self‑ticked checkbox (no age
  assurance, no verified guardian); the weekly **marketing newsletter is default‑on and
  includes children** with credit‑incentive content; GDPR erasure (`selfDelete`) misses PII
  in `contactInbox`, `links`, gift/stripe/referral/market/audit collections.
- **Genuinely strong:** server‑authoritative ACU meter, denial‑of‑wallet controls, Stripe
  webhook hardening, E2E sync contract, analytics hard‑blocked for students, DOB bucketed to
  an age band (raw DOB not persisted).

### 2.6 Competitive & Market Positioning

StudYear competes in four markets at once; no single competitor spans all of them — that's
both the opportunity and the credibility risk.

- **The walls:** *free* incumbents already inside schools — Seneca (~96% of UK secondary),
  Dr Frost (~half), Sparx (>half) — reset consumer price expectations to £0. In schools,
  procurement is defended by **proven evidence + relationships**: Sparx has its own RCT +
  Cambridge/RAND studies; Up Learn offers an outcome guarantee; even Third Space's EEF RCT
  (a null result) is *published*. MagicSchool is all‑in on the teacher persona and winning
  it (4–5M users, ~$105M raised).
- **The signal:** the "AI adaptive platform" archetype has struggled to monetise —
  Century Tech shows ~£16.5M cumulative losses; GoStudent was revalued below $1bn. And
  **engagement is the real battleground, not features** — Khan Academy admits only ~15% of
  students with Khanmigo access actually use it.
- **Where StudYear genuinely differentiates:** (1) one connected academic record spanning
  EYFS→university × every role — nobody else does this; (2) AI course/lesson generation +
  examiner‑grade marking; (3) a transparent pay‑per‑use ACU wallet with family top‑ups and
  "Fund a Student" gifting (novel); (4) AI‑native, not retrofitted.
- **Where it's behind:** brand/distribution, **proven efficacy (the decisive gap)**,
  curriculum depth/fidelity, school procurement machinery + named references, MIS/Classroom
  integration proof, and engagement/retention data.

---

## 3. The through‑line

Five of the six dimensions point at the **same two root problems**, and the market
analysis explains why fixing them matters:

1. **No single source of truth** (architecture) → vanishing ACUs, lost plans, "can't find
   account," numbers that disagree (data integrity), *and* it blocks the server‑side learner
   model a real adaptive engine needs (pedagogy) *and* the cohort analytics schools buy
   (market).
2. **Depth & proof deficit** (curriculum + AI grounding + no eval set + no efficacy evidence)
   → the exact thing that separates "broad and clever" from "trusted and bought" in UK
   edtech.

Everything else (security P0, child‑safety UX, compliance) are must‑fix gates for a product
used by children, independent of the above.

---

## 4. Prioritized roadmap

Grouped into four phases. Effort is rough engineering time, not calendar time.

### Phase 0 — Gates & quick wins (days → 2 weeks)
*Nothing ships to the public until these are done.*

| # | Item | Dimension | Effort |
|---|------|-----------|--------|
| 0.1 | **Close the admin‑takeover.** Remove `ADMIN_VERIFY_EXEMPT`; require `email_verified` for all admins; move admin to a Firebase **custom claim** (`admin:true`) set via an Admin‑SDK script; scrub committed admin emails to secrets. **First: confirm `admin@studyear.com` is already claimed in Auth.** | Security P0 | 1–2 d |
| 0.2 | **Verify generated answer keys** (cheap second‑pass solve/self‑consistency) before a quiz scores a student — stops wrong keys poisoning mastery/predicted grade/review. | AI P0 | 3–5 d |
| 0.3 | **Remove the fabricated‑spec‑code instruction** and **fix the lesson token clamp** (2048 vs 3000; chunk the quiz call). | AI P0 | 1–2 d |
| 0.4 | **Get adult billing language out of the kids workspace** — age‑branch "ACU/top‑up" → "ask a grown‑up," route the link to the parent, not child checkout. | UX/Child P0 | 2–3 d |
| 0.5 | **Exclude children from the default‑on newsletter**; **add screen‑reader live regions** to auth errors + all toasts (pattern already exists in one file). | Compliance + a11y P0 | 2–3 d |
| 0.6 | De‑weight self‑reported confidence in the diagnostic (accuracy‑dominant, only when ≥3 items measured). | AI P0 | 1 d |

### Phase 1 — The foundation (2–6 weeks)
*Make the platform trustworthy. This is the structural work that ends the week's class of bugs.*

| # | Item | Dimension | Effort |
|---|------|-----------|--------|
| 1.1 | **Unify identity & make data server‑authoritative.** Kill the "local‑only session" illusion: require a successful cloud auth + initial sync before showing per‑account data; otherwise an explicit, unmistakable offline mode that never presents stale numbers as current. | Architecture P0 | 2–3 wk |
| 1.2 | **Route ALL ACU credits through the server ledger** — student top‑ups via Stripe→webhook; plan assignment auto‑grants the plan's ACUs server‑side (monthly‑idempotent); referral/national‑win via server endpoints. Client wallet becomes pure display. | Data integrity P0 | 1–2 wk |
| 1.3 | **Sync the full per‑account dataset** (plan, profile, mastery, progress) as server‑authoritative, not best‑effort device storage. | Architecture P0 | 1–2 wk |
| 1.4 | **Reliability:** get the same‑origin `/gapi` proxy live on production (or move the domain onto the Vercel deployment that serves `vercel.json`); add `minInstances:1` to the hot functions. Maintain a cached wallet balance (trigger/transaction) so admin/stats don't sum the whole ledger. | Architecture P1 | 3–5 d |
| 1.5 | **Verifiable parental consent for under‑13** via the existing guardianship model + a **parent‑creates‑child onboarding flow** (parent provisions the child, no child email, lands in the kids workspace). | Compliance + UX P0/P1 | 1–2 wk |
| 1.6 | **Complete GDPR erasure** across `contactInbox`, `links`, gift/stripe/referral/market/audit PII; run a documented deletion drill. | Compliance P1 | 3–5 d |
| 1.7 | **Kill the XSS→token‑theft chain:** nonce/hash CSP to drop `'unsafe-inline'`; move tokens out of `localStorage`; add a lint forbidding `innerHTML` with non‑escaped interpolation and sweep cross‑account render paths first. | Security P1 | 1–2 wk |

### Phase 2 — Depth, adaptivity & proof (1–3 months)
*Turn "broad and clever" into "trusted and bought."*

| # | Item | Dimension | Effort |
|---|------|-----------|--------|
| 2.1 | **Curriculum grounding (RAG):** index real board specs, topic lists, and (where licensable) past‑paper/mark‑scheme structure; retrieve into lesson/quiz/marking prompts and cite. Biggest single lift to trustworthiness. | AI/Curriculum P1 | 4–8 wk |
| 2.2 | **Real past‑paper + mark‑scheme corpus** (replace external links) and **expand verified A‑level** beyond 6 subjects + **board‑specific** specs. | Curriculum P0/P1 | ongoing content |
| 2.3 | **Verified primary (EYFS/KS1/KS2) curriculum** structures. | Curriculum P0 | ongoing content |
| 2.4 | **Per‑skill Bayesian Knowledge Tracing** (lightweight, client‑side) → principled mastery probability + "ready to advance" gate; **full‑coverage spaced repetition** (schedule correct items, not just lapses). | Pedagogy P1 | 3–4 wk |
| 2.5 | **Quality‑tiered model routing** — high‑stakes marking/examiner/predicted‑grade to a frontier model; flashcards/summaries stay cheap. **Mark‑scheme‑anchored marking** (AO weightings/band descriptors). | AI P1 | 1–2 wk |
| 2.6 | **Stand up an eval set** (gold items per key stage) + nightly run → a measured accuracy/hallucination rate you can quote. | AI P0 | 1–2 wk |
| 2.7 | **A calibrated, reusable item bank** (persist generated items, log responses, Elo‑style difficulty) — requires a privacy‑preserving server response store. | Pedagogy P1 | 4–6 wk |

### Phase 3 — Become category‑defining (strategic, parallelisable)

| # | Item | Dimension | Effort |
|---|------|-----------|--------|
| 3.1 | **Evidence program:** run a pre‑registered RCT (even small/exploratory) + pursue an EEF or university partnership. Adopt an **Up Learn‑style outcome guarantee** ("grade up or ACUs back"). *This closes the single sharpest market gap.* | Market P0 | months |
| 3.2 | **MIS/SSO integrations** (Wonde / Google Classroom / SIMS) + **named reference schools** + Ofsted‑ready analytics exports. | Market/Schools P1 | weeks |
| 3.3 | **Full tutor marketplace** (booking, scheduling, payouts, DBS, reviews) and a **native live‑lesson** layer (or a hardened Jitsi integration with scheduling/recording). | Features P1 | weeks |
| 3.4 | **Safeguarding as a sales weapon:** map explicitly to the DfE's 13 Generative AI Product Safety Expectations and publish a conformance statement + third‑party attestation. | Market/Compliance P1 | weeks |
| 3.5 | Misconception library + prerequisite knowledge graph; inject the learner model into the tutor; adaptive (CAT) diagnostic. | Pedagogy P2 | months |

---

## 5. The big bets — how StudYear becomes the most powerful of its kind

The market analysis is unambiguous: you don't win by being "better flashcards than Seneca."
You win on things incumbents structurally *can't* copy quickly. Five defensible bets:

1. **Own the "connected record," not any single tool.** One verified academic profile that
   follows a learner EYFS→university and is simultaneously readable by parent, teacher,
   tutor, school and LA. No competitor spans this. It's a data network effect: defensibility
   grows with every connected role. *This is the wedge — and Phase 1 (one source of truth) is
   what makes it real instead of aspirational.*

2. **Buy credibility fast with published proof.** A pre‑registered RCT + an outcome guarantee
   manufactures the trust that unlocks school/LA procurement, which price alone never will.
   This is the highest‑leverage non‑engineering investment on the list.

3. **Make engagement the product thesis.** Since access ≠ use (Khanmigo's 15%), position the
   behavioural engine + nightly re‑planning + "catch you before you fall behind" recovery as
   the *retention* platform, and publish usage/habit metrics as the headline proof — a number
   incumbents avoid. *Caution: the ACU meter can suppress the daily habit; price/package so a
   child's core daily loop never hits a wall.*

4. **Win the depth lane that matters, then widen.** Pick 2–3 high‑volume subjects (Maths +
   the sciences), ground them in real specs/past papers/mark schemes, and be visibly the
   best there — then let breadth be the "and everything else, AI‑native." Depth buys the
   right to claim breadth.

5. **Be demonstrably the safest all‑in‑one AI platform.** For risk‑averse public buyers,
   provable safeguarding (DfE's 13 expectations, UK GDPR, Children's Code, E2E, "never trains
   on your data") beats being the cleverest. Phase 0/1 compliance work converts directly into
   a sales asset.

---

## 6. Appendix — evidence index

Detailed per‑dimension findings (with full `file:line` evidence and competitor sources) are
in the working notes that produced this document:
- Architecture & data integrity — §2.1 above (authored from this session's direct findings).
- Feature & curriculum inventory, AI & pedagogy, UX & accessibility, security & compliance,
  competitive & market — each from a dedicated deep‑dive pass; key citations are inline above.

Prior security baseline: `launch-audit/FINAL-REPORT.md`, `launch-audit/defects.md`
(this deep dive confirms those and adds the admin‑takeover P0 and the Children's‑Code gaps).

---

*Honesty note: this document is deliberately critical because the goal is "most powerful of
its kind," and flattery doesn't get there. The flip side is equally true — the breadth,
the real engines, the margin discipline, the safety posture and the connected‑record concept
are genuine, hard‑won strengths most competitors lack. The work above is how you convert them
into market leadership.*
