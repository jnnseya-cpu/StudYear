# STUDYEAR — Deep Platform Extraction & AI/ML Upgrade Blueprint

| | |
|---|---|
| **Prepared by** | Senior AI-Agent OS Product Development Analysis |
| **Source** | Live audit of studyear.com (homepage, How It Works, About, Terms of Service, Privacy Policy, app shell) — **2 July 2026** |
| **Status** | **Part A** = extraction of the platform as it exists and operates today · **Part B** = full AI-agent / machine-learning upgrade architecture |

> **Relationship to the rest of this repo:** Part A is the formal companion to the
> [authoritative product spec](studyear-product-spec.md) (same ground truth, report form).
> Part B aligns with the target blueprints in [`docs/architecture/14–15`](../architecture/14-ai-agent-blueprint.md)
> and the [AI-OS document set](../ai-os/README.md).

---

## Part A — Platform extraction (as it exists today)

### A1. What StudYear is (confirmed positioning)

StudYear is a **UK AI-Powered Education Operating System** — an "academic command centre"
that unifies diagnostics, AI tutoring, study planning, assignment review, and live progress
intelligence into **one closed-loop system**, serving **four public-facing roles**
(Students, Parents, Schools, Tutors) **plus a platform Admin layer.**

**Core positioning statements** (verbatim in meaning):

- *"Turn data into better grades"* — data-first, outcome-measured.
- *"A closed-loop system — not a loose collection of apps. Assess, plan, execute, and
  measure in one continuous flow."*
- *"Not another content library — an AI-powered operating system for academic success."*
- **Diagnostic-first philosophy:** understand where the student is before prescribing anything.
- **Market coverage:** GCSE, A-Level, and University undergraduate levels.
- **Compliance posture:** GDPR-conscious design, governed by the laws of England and Wales.

**Confirmed operating loop (the 4-phase engine):**

| # | Phase | What happens |
|---|---|---|
| 1 | **ASSESS** | ingest academic data + confidence signals → baseline + risk profile + personal diagnostic report |
| 2 | **PLAN** | AI generates prioritised, week-by-week study plans aligned to exam timelines; tells the student *what* to revise AND *how* |
| 3 | **LEARN / EXECUTE** | AI tools (lessons, flashcards, quizzes, essay feedback, 24/7 AI Tutor); **every action consumes ACUs** |
| 4 | **IMPROVE** | real-time dashboard updates; predicted grades continuously refined; plans adapt automatically as mastery moves |

**Confirmed technology & commercial stack:**

| Layer | Confirmed detail |
|---|---|
| Hosting / backend | **Firebase** (cloud hosting) |
| AI providers | **Google + OpenAI** (multi-provider, DPAs in place, **no-training clauses**) |
| Payments | **Stripe** (**card data never stored on StudYear servers**) |
| Billing model | **ACU (AI Credit Unit)** — strictly prepaid wallet, no overdraft, per-action metering, packs purchased via Checkout, balance always visible in top nav, non-refundable |
| Analytics | **Google Tag Manager** |
| Live platform telemetry | public live counters: student accounts, partner organisations, resources shared, profiles created (refreshed every few minutes) |
| App shell | `/create` route loads a client-side app (*"Launching your learning experience..."*) — **SPA behind auth** |

**Confirmed platform-wide capability set** — the 12 advertised modules: AI Tutor · Smart
Diagnostics · Study Plans · Grade Prediction · Assignment Review · Visual Charts · Past
Papers · School Command Centre · Parent Dashboard · Tutor Marketplace · Interactive Lessons ·
Recovery Plans — **plus** quizzes, flashcards, a shared **Resource Library** (Find Resources /
contribute-to-library licensing in the ToS), and a **Create studio**.

### A2. Role-by-role extraction

> **Legend:** ✅ = explicitly confirmed on the live platform · ◆ = necessarily implied by
> confirmed features (a senior PM's reconstruction of what must exist behind the login for
> the confirmed features to function)

#### A2.1 Student — *"Study smarter, not harder"*

**Confirmed features & actions:**

| | Feature | Detail |
|---|---|---|
| ✅ | Onboarding diagnostic | declares subjects, current grades, study level, confidence levels → AI generates a personal diagnostic report (**free at signup — "Start My Free Assessment"**) |
| ✅ | AI Tutor | 24/7 conversational support with diagrams, quizzes, step-by-step explanations |
| ✅ | Adaptive Study Plans | week-by-week priorities that reshuffle as mastery improves; exam-timeline-aligned |
| ✅ | Interactive Lessons | AI-generated lessons/courses (**"generating a course" is a named ACU-consuming action**) |
| ✅ | Flashcards & Quizzes | generated on demand; **every quiz taken updates mastery metrics in real time** |
| ✅ | Assignment Review | submit essays/written answers → predicted grade, structured feedback, educational visuals |
| ✅ | Grade Prediction | continuously refined predicted grades per subject |
| ✅ | Past Papers | exam-question practice (**exam questions are a named AI-input type in the Privacy Policy**) |
| ✅ | Recovery Plans | remediation pathways when performance slips |
| ✅ | Visual Learning Tools | charts, graphs, diagrams generated from the student's own data |
| ✅ | Progress dashboard | real-time; single workspace *"built around your grades"* |
| ✅ | ACU Wallet | top-up via Checkout, balance in nav bar, per-action debits, AI features disabled at zero balance |
| ✅ | Resource Library | search shared resources; voluntarily contribute under a broader licence |
| ✅ | Profile & account | profile management (study level, subjects), settings, data-deletion rights |
| ◆ | Tutor booking | session/booking access to marketplace tutors (the Tutor "session pipeline" requires a student-side booking action) |
| ◆ | Topic-level mastery map | required for *"pinpoint weak topics before they become grade shocks"* |

**Student journey:** Sign up → free diagnostic → baseline + risk profile → AI roadmap →
execute with AI tools (ACU-metered) → dashboard adapts → predicted grades converge on
targets.

#### A2.2 Parent — *"Clarity without micromanaging"*

| | Feature | Detail |
|---|---|---|
| ✅ | Parent Dashboard | live progress of the child (**not end-of-term surprises**) |
| ✅ | Risk alerts | early-warning signals (*"see momentum and risk early — not just a report card surprise"*) |
| ✅ | Intervention insights | what to do about a flagged risk, *"so you support your child with confidence"* |
| ✅ | First-class registered role | **confirmed in Privacy Policy role selection** |
| ◆ | Parent↔student linking/consent flow | required for any child-data visibility **under GDPR** |
| ◆ | Wallet funding of the child's ACUs | prepaid model + minor users makes parent-funded wallets **structurally necessary** |
| ◆ | Adherence & trajectory visibility | study-plan adherence and predicted-grade trajectory — the data the dashboard is built from |

#### A2.3 School (Leadership / Institution) — *"Executive academic operations"*

| | Feature | Detail |
|---|---|---|
| ✅ | School Command Centre | dedicated institutional workspace |
| ✅ | Cohort health maps | visual health of year groups/classes |
| ✅ | At-risk intelligence | identify who needs help **without waiting for end-of-term reports** |
| ✅ | Staff deployment | allocate teaching staff against cohort need |
| ✅ | Shared ACU pools | institution-level prepaid AI budget shared across the organisation |
| ✅ | Partner-organisation construct | schools counted as **"Partner organisations"** in live platform metrics |
| ✅ | B2B contact route | *"Talk to our team"* |
| ◆ | Organisation admin | seat/roster management, teacher & student invitations, class/cohort structure (required for cohort maps and staff deployment to render) |
| ◆ | ACU pool governance | allocation, caps, and consumption audit per class/teacher/student (**Privacy Policy confirms ACU consumption is monitored and audited per account**) |
| ◆ | Exportable leadership reporting | executive framing implies **board/Ofsted-ready** outputs |

#### A2.4 School Teacher (staff inside a School org)

> The public site **sells to leadership**; teachers operate **inside** the School Command
> Centre. Extraction of the teacher plane (all reconstruction — no standalone marketed
> surface):

| | Feature | Detail |
|---|---|---|
| ◆ | Class-level dashboards | the class is the unit between "cohort health map" and individual student |
| ◆ | Assignment set/review workflow | uses the confirmed Assignment Review engine — **AI pre-marking, predicted grades, structured feedback → teacher moderation** |
| ◆ | Generation suite access | same suite (lessons, quizzes, flashcards, visuals, past papers), drawing on the school's **shared ACU pool** |
| ◆ | At-risk flags + recovery assignment | for their own students; assign recovery plans |
| ◆ | Deployable resource | teachers are the objects of the staff-deployment module — leadership assigns them to at-risk cohorts |
| ◆ | Library contribution | contribute teaching materials to the shared Resource Library |

#### A2.5 Private Tutor — *"Professional command centre"*

| | Feature | Detail |
|---|---|---|
| ✅ | Tutor Marketplace listings | public discoverable profile |
| ✅ | Session pipeline | booking/engagement management from **enquiry → delivered session** |
| ✅ | AI teaching tools | same generation suite applied to tutoring practice |
| ✅ | Earnings | income tracking; *"built for independent educators"* |
| ◆ | Payouts via Stripe | Stripe is the confirmed processor; marketplace earnings require **Connect-style payout rails** |
| ◆ | Student roster w/ shared intelligence | per-student diagnostic/mastery visibility — the platform's shared-intelligence promise applied to tutoring |
| ◆ | Ratings & discovery placement | reputation and search placement within Find Resources / marketplace discovery |

#### A2.6 Platform Admin (StudYear operator plane)

> Not marketed publicly — reconstructed from confirmed legal/commercial mechanics:

| | Capability | Evidence trail |
|---|---|---|
| ◆ | User & role administration across all five personas; **suspension/termination powers** | ToS §6: immediate termination rights |
| ◆ | **ACU economy console**: pack pricing management, per-feature ACU cost tables, wallet audit, fraud prevention | *"we reserve the right to change pricing of packs and ACU cost of features at any time"* — these are **admin-configurable parameters**; billing-integrity monitoring confirmed |
| ◆ | **AI provider routing & DPA management** | Google/OpenAI multi-provider with no-training guarantees |
| ◆ | Content/library moderation | malicious-upload and scraping prohibitions in ToS require enforcement tooling |
| ◆ | Partner-organisation provisioning + shared-pool setup | the "partner organisations" tier |
| ◆ | Platform telemetry | the live public counters are fed from an internal metrics service |
| ◆ | GDPR operations | access, rectification, deletion requests; **retention schedules for AI logs and transactions** |

### A3. The ACU economy (confirmed mechanics)

| Rule | Detail |
|---|---|
| **Model** | strictly prepaid; **zero balance = AI features hard-disabled**; no overdraft/credit |
| **Metering** | every AI action has a defined ACU cost, **debited at initiation** |
| **Purchase** | credit packs via Checkout (Stripe); balance surfaced in top navigation |
| **Refunds** | all pack purchases **final and non-refundable, including on termination** |
| **Institutional** | shared ACU pools for schools |
| **Governance** | consumption **monitored and audited per account** for billing integrity and fraud prevention |
| **Rationale** | *"No surprise bills, ever"* — usage transparency as a trust feature |

> **Product insight:** ACU is simultaneously the **monetisation engine**, the **rate
> limiter**, the **cost-of-inference hedge**, and the **behavioural telemetry stream**.
> Every ACU debit is a **labelled event of learning intent** — the single richest ML
> training signal the platform owns.

### A4. Confirmed data model (from Privacy Policy)

| Category | Contents |
|---|---|
| **Account & Profile** | name, email, role, study level, subjects |
| **AI Inputs** | exam questions, written answers, summarisation topics, tutor queries |
| **Usage & Transactional** | feature interactions, AI request logs, ACU transactions |
| **Payment** | tokenised via Stripe only |
| **Technical** | IP, browser, device |
| **Guarantees** | no data sale · AI providers **contractually barred from training on user content** · encryption + access controls · retention tied to account life + legal audit windows |

### A5. Gap analysis (what the current platform does NOT yet do)

| # | Gap |
|---|---|
| 1 | **AI acts on request, not on its own initiative** — the loop is closed but **human-cranked** |
| 2 | Grade prediction exists but **no causal intervention modelling** (what action moves the grade most per ACU spent) |
| 3 | **Teacher plane is thin** relative to the leadership plane |
| 4 | No **spaced-repetition / forgetting-curve** science surfaced |
| 5 | No **multimodal ingestion** advertised (handwritten work, voice, whiteboard photos) |
| 6 | Marketplace has **no visible AI matching layer** (tutor↔student pairing appears manual/search-driven) |
| 7 | **Single-student intelligence**; no confirmed cross-cohort/national benchmarking ML |
| 8 | **Wellbeing/burnout signals absent** — risk is defined academically only |

---

*(Further Part A sections follow as extracted; Part B follows.)*

---

## Part B — The upgrade: StudYear 2.0 as a multi-agent AI-OS

> **Design thesis:** convert StudYear from an **AI-tool vending machine** (user requests →
> AI responds → ACU debited) into a **proactive agentic operating system** where a mesh of
> persistent, role-scoped AI agents **observes, predicts, plans, intervenes, and reports** —
> with ML models as the shared intelligence substrate and **ACUs metering agent labour.**

### B1. Target architecture

```
┌────────────────────────── EXPERIENCE PLANE ──────────────────────────┐
│  Student App · Parent App · Teacher Workspace · School Command       │
│  Centre · Tutor Command Centre · Platform Admin Console              │
├────────────────────────── AGENT MESH (LangGraph-style) ──────────────┤
│  ORCHESTRATOR (per-tenant supervisor, policy + budget aware)         │
│  Role agents (B2) · Function agents (B3) · Guardian/Safety agent     │
├────────────────────────── ML MODEL LAYER ────────────────────────────┤
│  Knowledge-Tracing · Grade-Forecast · Risk EWS · Recommender ·       │
│  Forgetting-Curve Scheduler · Matching · ACU-ROI Optimiser ·         │
│  Content Quality Ranker · Anomaly/Fraud                              │
├────────────────────────── DATA & EVENT SPINE ────────────────────────┤
│  Learning Record Store (xAPI events) · Mastery Graph (topic-level    │
│  knowledge graph per exam board spec) · Feature Store · ACU Ledger   │
├────────────────────────── PLATFORM SERVICES ─────────────────────────┤
│  Model Router (Google/OpenAI/others, cost-latency-quality routing)   │
│  RAG over syllabus + past papers + mark schemes · Stripe/Connect ·   │
│  RBAC + Zero-Trust · GDPR/AADC compliance engine · Observability     │
└──────────────────────────────────────────────────────────────────────┘
```

Five planes: **Experience** (the six role surfaces) → **Agent Mesh** (orchestrator + role/
function agents + guardian) → **ML Model Layer** (the shared intelligence substrate) →
**Data & Event Spine** (xAPI learning records, the per-exam-board mastery graph, feature
store, ACU ledger) → **Platform Services** (model routing, RAG over syllabus/past-papers/
mark-schemes, payments, zero-trust, compliance, observability).

**Two foundational upgrades everything else stands on:**

1. **Curriculum Knowledge Graph** — every GCSE/A-Level/university topic mapped to exam-board
   specifications, mark schemes, and past-paper questions. Diagnostics, plans, predictions,
   and content generation all **anchor to graph nodes instead of free text.**
2. **Learning Record Store** — every quiz answer, tutor exchange, essay submission, and ACU
   debit becomes a **standardised event** feeding the ML layer. **This is the moat.**

### B2. Role Agents (persistent, one per user, memory-bearing)

| Agent | Serves | Core behaviours |
|---|---|---|
| **Study Companion Agent** | Student | Owns the student's mastery graph; runs daily: reprioritises the plan, schedules **spaced-repetition reviews at forgetting-curve inflection points**, drafts tonight's session, initiates check-ins (*"You avoided Electrolysis three times — 15-minute rescue lesson?"*), detects frustration/burnout from interaction patterns and adjusts load |
| **Family Insight Agent** | Parent | Translates telemetry into weekly plain-language briefings; pushes risk alerts with a **concrete recommended action** (*"Maths momentum dropped 22% in two weeks; a marketplace tutor slot Thursday would target the two failing topics"*); answers parent questions conversationally (*"How is Amara really doing in Chemistry?"*) |
| **Classroom Copilot Agent** | Teacher | Auto pre-marks submissions against mark schemes with **teacher-moderated confidence scores**; generates differentiated lesson variants (**3 ability tiers**) from one prompt; produces the **"Monday briefing"**: who slipped, who's coasting, who's ready to be stretched; drafts parent communications for approval |
| **Institution Intelligence Agent** | School leadership | Continuously recomputes cohort health; **simulates staff-deployment scenarios** (*"moving Ms Patel's intervention hours to Year 11 set 3 projects +0.4 grades average"*); **forecasts results day 6 months out with confidence bands**; auto-drafts governor/Ofsted-ready progress narratives; manages shared ACU pool allocation with **per-class ROI reporting** |
| **Tutor Practice Agent** | Private tutor | Fills the pipeline (AI matching — B3); prepares **pre-session briefs from the student's live mastery graph**; generates session plans + follow-up homework; drafts parent progress reports; tracks earnings, **forecasts income, suggests rate/niche optimisation** |
| **Platform Sentinel Agent** | Admin | Watches **ACU-economy health (margin per feature vs inference cost)**, reroutes model traffic on cost/quality drift, flags fraud/abuse anomalies, monitors AI-output quality via **automated evals**, executes GDPR retention/deletion schedules |

### B3. Function Agents (shared services callable by any role agent)

| # | Agent | Specification |
|---|---|---|
| 1 | **Diagnostic Agent** | Replaces the static onboarding assessment with **adaptive testing (CAT/IRT)**: each question chosen by an item-response model to maximise information, **cutting diagnostic length ~60% while increasing precision**; re-runs micro-diagnostics continuously in the background |
| 2 | **Planning Agent** | **Constraint-solver + LLM hybrid**: takes exam dates, mastery gaps, forecasted forgetting, available hours, and **ACU budget** → emits an optimised schedule; **replans nightly** |
| 3 | **Content Forge Agent** | Lessons, quizzes, flashcards, visuals, past-paper-style questions **generated on the knowledge graph, style-matched to the exact exam board**; every item **quality-scored by the Content Ranker model** before delivery |
| 4 | **Examiner Agent** | **Mark-scheme-grounded** essay/answer marking with rubric-cited feedback, model-answer comparison, and calibrated predicted marks — trained against real graded scripts → **published accuracy stats: a trust weapon** |
| 5 | **Intervention Agent** | When the Risk EWS fires: composes the recovery plan, notifies the right humans (parent/teacher/tutor) **with role-appropriate framing**, books the intervention, and **verifies impact two weeks later** |
| 6 | **Matching Agent** | Two-sided marketplace ML: pairs students to tutors on subject-topic gap overlap, availability, learning-style fit, budget, and **historical uplift delivered by that tutor for similar profiles** — tutors **ranked by outcomes, not just reviews** |
| 7 | **Guardian Agent** | Safeguarding + integrity layer: age-appropriate interaction enforcement, **academic-integrity guardrails (feedback-not-ghostwriting modes for assessed work)**, wellbeing signal escalation, and **bias auditing of all ML decisions** |

### B4. ML Model Portfolio (the substrate)

| Model | Technique | Powers |
|---|---|---|
| **Knowledge Tracing** | Deep Knowledge Tracing / Bayesian KT per topic node | True mastery estimation; the upgrade from "quiz scores" to **"probability of exam success per topic"** |
| **Grade Forecaster** | Gradient-boosted survival/regression on LRS features, **retrained per exam season** | Predicted grades with confidence intervals + **trajectory bands (current path vs plan-adherent path)** |
| **Risk Early-Warning System** | Multivariate time-series anomaly detection (engagement velocity, mastery decay, plan adherence, sentiment) | **Flags decline 4–6 weeks before it shows in grades**; feeds parent/teacher/school alerts |
| **Forgetting-Curve Scheduler** | Per-student half-life regression (SuperMemo-class, personalised) | Spaced-repetition timing inside every study plan |
| **ACU-ROI Optimiser** | Contextual bandits | Recommends the next best ACU spend: *"12 ACUs on a Circle Theorems lesson ≈ +0.3 predicted grade — highest-leverage action available"* — **turns the wallet into an investment advisor and directly lifts ARPU** |
| **Tutor-Student Matcher** | Two-tower recommender + **uplift modelling** | Marketplace liquidity and outcome-ranked tutors |
| **Content Quality Ranker** | RLHF-style reward model on completion/mastery-gain/teacher ratings | **Only top-decile generated content ships; the rest regenerates silently** |
| **Cohort Benchmarker** | Federated/aggregate analytics | Schools compare against **national anonymised baselines — a B2B sales weapon no report card offers** |
| **Fraud & Anomaly** | Isolation forests on ACU ledger + auth events | Wallet integrity, account sharing, scraping detection |

### B5. New ACU-metered products this unlocks

| # | Product | Mechanics |
|---|---|---|
| 1 | **Autopilot tiers** | Sell **agent labour, not just tool calls**: Companion-on-Autopilot (daily replanning + proactive nudges) as an **ACU-streaming subscription hybrid** |
| 2 | **Exam War-Room Mode** | 6-week pre-exam intensive: agents run daily mock cycles, weakest-topic triage, and **countdown briefings for the whole family** |
| 3 | **Predicted-vs-Actual Accuracy Guarantee** | Publish Examiner Agent calibration; offer **ACU rebates if predictions miss by a threshold** — converts trust into a feature |
| 4 | **School ROI Dashboard** | Every ACU the institution spends **mapped to measured mastery gain**; renewals become data-driven |
| 5 | **Multimodal ingestion** | Photograph handwritten work → Examiner marks it; voice-note a question to the Tutor; whiteboard-photo → flashcards — **massively widens the input funnel and ACU events per user** |
| 6 | **Recovery-as-a-Service for schools** | Intervention Agent packages for at-risk cohorts, priced from the shared pool, with **verified-impact reporting** |

*(Sections B6+ follow as extracted.)*
