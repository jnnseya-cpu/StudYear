# StudYear — Authoritative Product Specification (as-is)

> **Source of truth for what StudYear *actually is today*** — extracted from the public site,
> terms, privacy policy, and known OS logic. This is distinct from the aspirational
> enterprise **AI-OS transformation** in [`docs/ai-os/`](../ai-os/README.md) (PART 4), which
> *adds to* — never removes — what is documented here.
>
> Where the architecture docs (`docs/architecture/`) describe an idealized ecosystem, this
> file records the **real product's positioning, engine, wallet economics, and roles**, so
> every downstream design stays grounded.

## 0. The pedagogical thesis (first principle)

> **We all go to the same school, the same lessons, the same lectures — but with different
> styles of understanding and different speeds of understanding.** The platform must
> therefore use **machine learning and behavioural learning to personalise learning for
> each individual — and improve everyone, very quickly.**

This is the root requirement every feature serves. Its implications:

1. **The classroom is uniform; the learner is not.** Same teacher, same lecture, same
   syllabus — yet each student arrives with a different starting point, learning style
   (visual / verbal / game-based / audio), pace, confidence, energy pattern, and
   forgetting curve. A platform that delivers the same experience to everyone reproduces
   the classroom's limitation instead of fixing it.
2. **ML personalises the *what*:** knowledge tracing establishes what each student
   actually knows (per topic, per spec point); weak-topic detection, adaptive quizzes,
   and the study-plan optimiser deliver the right material at the right difficulty next
   (ML layer — `§5a`; knowledge-tracing/forgetting-curve engines — the extraction report
   Part B).
3. **Behavioural learning personalises the *how* and *when*:** best-time-to-study,
   session-length tolerance, format preference (flashcards vs lessons vs voice), streak
   and motivation patterns, burnout signals — every interaction teaches the platform how
   this specific student learns best (behavioural intelligence — `docs/ai-os/07`;
   Motivation/Family-Support agents — `docs/ai-os/04 §3A`).
4. **"Improve everyone very quickly" is the success criterion.** Personalisation is not a
   luxury feature; it is the mechanism by which every learner — fast or slow, visual or
   verbal — converges on their target grade sooner than uniform instruction allows. The
   metric is mastery-gain per study hour, for *every* student, not the average
   (success metrics — extraction report B8).

*In one line: the school delivers the same lesson to all; StudYear delivers a different
path through it to each — and measures that every path is getting faster.*

## 1. Core purpose

StudYear positions itself as **"The UK's AI-Powered Education OS"** — an Education
Operating System that connects diagnostics, AI tutoring, study planning, assignment review,
live progress, parents, schools, teachers, and tutors in **one academic command centre.**
The product philosophy is explicitly **anti-fragmentation**: *"a closed-loop system — not a
loose collection of apps"* — assess, plan, execute, and measure in **one continuous flow**:

```
        ┌──────────────────────────────────────────────┐
        │   ASSESS  →  PLAN  →  LEARN  →  IMPROVE  ──┐   │
        └───────────────────────────────────────────┘   │
                        ▲                                │
                        └────────────────────────────────┘
```

It is **not just a learning app** — it is an **academic intelligence OS.**

## 2. The system engine (5 cores)

| # | Engine | What it does |
|---|---|---|
| 1 | **Diagnostic Engine** (Assess) | Analyses subjects, current grades, and confidence levels to identify strengths/weaknesses and generate a **personal diagnostic report** — baseline, weak topics, risk profile. |
| 2 | **AI Study Roadmap** (Plan) | Creates personalised **week-by-week** study plans **prioritising the highest-grade-impact topics** — telling students not just *what* to revise but *how*. |
| 3 | **AI Learning Tools** (Learn) | Students execute with interactive lessons, flashcards, quizzes, **instant essay feedback**, and a **24/7 AI Tutor** — plus topic summaries, diagrams, charts, past-paper support, revision resources. **Each action consumes ACU balance.** |
| 4 | **Progress Intelligence** (Improve) | Dashboard updates **in real time with every quiz and lesson** — tracking mastery and adherence, **constantly refining predicted grades and adapting the plan**; risk alerts. |
| 5 | **ACU Wallet System** | AI features consume prepaid **AI Credit Units (ACUs)**. When ACUs hit zero, **AI features stop** until the wallet is topped up. |

The five engines *are* the Assess→Plan→Learn→Improve loop: Diagnostic = Assess, Roadmap =
Plan, Learning Tools = Learn, Progress Intelligence = Improve — with the ACU Wallet metering
the AI compute that powers all four.

## 2b. Platform-level capability inventory (publicly confirmed)

**Marquee capability strip** (homepage cards): AI Tutor · Smart Diagnostics · Study Plans ·
Grade Prediction · Assignment Review · Visual Charts · Past Papers · School Command Centre ·
Parent Dashboard · Tutor Marketplace · Interactive Lessons · Recovery Plans.

**The six flagship modules**, as described on-site:

| Flagship module | On-site description |
|---|---|
| **AI Tutor** | 24/7 conversational support with diagrams, quizzes, and step-by-step explanations |
| **Diagnostic Engine** | pinpointing weak topics **before they become grade shocks** |
| **Adaptive Study Plans** | week-by-week priorities that **shift as mastery improves** |
| **Assignment Review** | predicted grades, structured feedback, and educational visuals |
| **Visual Learning Tools** | charts, graphs, and diagrams **generated from your data** |
| **Progress Intelligence** | real-time dashboards **for students, families, and leaders** |

### 2b.1 The content layer (UGC / resource-sharing)

StudYear is **not only consumption** — it has a UGC/resource-sharing marketplace dimension:

- **Create studio** (`/create`) and a **Find Resources** search surface (`/search`) sit in
  the primary navigation.
- A **shared platform library**: the Terms reference resources users *"voluntarily
  contribute to the shared platform library"* under a **broader licence** than private
  content.
- This is the live counterpart to the Content Library module (`§5b` #17) and the
  revision-resources architecture (`docs/architecture/11`); the contribute-under-licence
  mechanic is the legal basis for cross-user resource sharing.

### 2b.2 Target market

**GCSE and A-Level students through to university undergraduates**, with the platform
**adapting to level** — matching the level-scoped Subject taxonomy in
`docs/architecture/12` (school/FE set vs the University subject set).

## 3. ACU Wallet economics (the monetisation backbone)

The service runs on a **strictly prepaid** AI Credit Unit model:

- **Positive balance required** to use AI features — **no overdraft or credit facility.**
- **Per-action debits:** each AI feature has an associated ACU cost, **debited on use.**
- **Packs:** ACUs are purchased in packs; **all purchases are final and non-refundable.**
- **Top-up UX:** the wallet is topped up from a **Checkout page**; the balance is **always
  visible in the top navigation bar.**
- **Hard stop at zero:** when the balance reaches zero, AI features are disabled until
  top-up — a clean, usage-based gate (no silent overage).
- **Where it plugs in:** every AI Learning Tool (`§2.3`) and AI-driven engine action checks
  and decrements the wallet; balances, top-ups, deductions, refunds policy, and usage logs
  are admin-managed (`§4`) — goodwill *re-credits* remain an audited admin action even
  though customer purchases themselves are non-refundable.
- **Shared pools:** schools can operate a **shared ACU pool** across their cohort (`§4`).
- This is the concrete instance of the "AI credit / ACU system" the AI-OS monetisation model
  (PART 4) builds on.

## 3b. Disclosed stack, legal posture & live telemetry (as-is)

| Concern | Disclosed state |
|---|---|
| **Payments** | Stripe |
| **Cloud hosting** | **Firebase** |
| **AI service providers** | **Google and OpenAI**, under data-processing agreements that **prohibit training on user content** |
| **Governing law** | England and Wales |
| **Privacy posture** | GDPR-conscious, AI-native workflows, live progress sync |

> **As-is vs. target architecture:** the MariaDB/Hostinger multi-tenant decomposition in
> `docs/architecture/13`/`15` and the three-provider Model Router (adding Anthropic Claude)
> in `docs/architecture/14` are the **target blueprint**, not the disclosed current state.
> Today's disclosed platform is Firebase-hosted with Google + OpenAI as AI providers. Any
> migration plan must treat this section as the starting point.

**Live homepage telemetry** (live totals refreshed every few minutes — social proof via
real data, and a signal the platform is **early-stage in adoption**):

| Metric | Value |
|---|---|
| Student accounts | 38 |
| Partner organisations | 3 |
| Resources shared | 155 |
| Profiles created | 67 |

## 4. Roles — real feature extraction

> **Sourcing:** every publicly reachable surface of studyear.com was reviewed — homepage,
> How It Works, About, Terms, Privacy. In-app surfaces (`/create`, `/search`, dashboards)
> are client-rendered behind authentication and show only a loading state to an
> unauthenticated crawl. What follows is therefore (a) features **directly evidenced** on
> the public site (flagged "publicly confirmed"), plus (b) a **functional reconstruction**
> of per-role surfaces that the public evidence implies. Treat as high-fidelity, not
> verbatim UI.

### 4.1 Platform Admin — controls the whole OS

| Area | Responsibilities |
|---|---|
| **Manage users** | students, parents, schools, teachers, tutors, staff, partner organisations |
| **Roles & permissions** | decide what each role can see, edit, approve, create, purchase, assign, export, delete |
| **Manage ACUs** | top-ups, balances, deductions, refunds policy, usage logs, fraud checks, pricing, **feature cost per action**; **grant free ACUs to any user in any category** |
| **Manage subscriptions (per user)** | **change any user's subscription model** — upgrade, downgrade, switch, or comp a plan (audited) |
| **Manage AI tools** | enable/disable tools, set ACU cost, monitor usage, review errors, **control prompts, safety rules, output quality** |
| **Content library** | shared resources, uploaded files, generated resources, public/private visibility, **moderation** |
| **Manage schools** | approve school accounts, create school admin, assign teachers, manage **shared ACU pool**, cohort analytics |
| **Manage tutors** | approve profiles, marketplace listing, verification, earnings, bookings, complaints, ratings |
| **Manage payments** | **Stripe** transactions, failed payments, invoices, plans, subscriptions, **ACU packs** |
| **Manage compliance** | GDPR, privacy, AI usage logs, data-deletion requests, audit trails, account security |
| **Manage reporting** | export platform usage, revenue, ACU consumption, active users, resources created, student growth, school adoption |

**Data collected (privacy basis):** profile data, AI inputs, usage data, ACU transactions,
payment processing via **Stripe**, and technical/security data.

**Admin console reconstruction (from legal & billing text).** Nothing about the internal
admin console is publicly exposed — correctly so — but the Terms/Privacy text implies it
must contain:

| Implied capability | Evidence trail |
|---|---|
| User/role management & moderation, with power to **suspend or terminate accounts immediately** for Terms breaches | Terms enforcement clause |
| **ACU economy administration** — pricing/feature-cost configuration panel | right to change ACU pack pricing and per-feature ACU costs **at any time** |
| **Audit-log & fraud-review tooling** | usage/transaction logging for billing, fraud prevention, service improvement |
| **Metrics service** feeding the live homepage counters | live totals refreshed every few minutes |
| **Shared-library moderation** | contributed-resources licence terms |
| **Data-rights operations** | account deletion requests, subject to retention policies |
| **Org-account provisioning** | the partner-organisation tier ("3 partner organisations") |

> **Payments note:** the **live** payment processor is **Stripe**. **BitriPay** (requested in
> the AI-OS master prompt) is a *planned additional* gateway documented in
> [`docs/ai-os/`](../ai-os/README.md) — it augments, not replaces, Stripe.

### 4.2 Student — the main learning user

| Area | Responsibilities |
|---|---|
| **Create profile** | year group, subjects, target grades, current grades, exam board, confidence level |
| **Run diagnostic** | identify weak topics, strengths, learning gaps, risk areas (Diagnostic Engine, `§2.1`) |
| **Personal study plan** | weekly roadmap, priority topics, revision tasks, exam countdown (AI Study Roadmap, `§2.2`) |
| **AI tutor** | ask questions 24/7; step-by-step explanations, diagrams, examples, quizzes |
| **Create learning resources** | flashcards, quizzes, topic summaries, formula sheets, mind maps, essay plans, interactive lessons |
| **Assignment review** | upload/write answers → feedback, **predicted grade**, improvement advice, structure comments |
| **Track progress** | mastery score, study hours, completed tasks, predicted-grade movement, weak-area recovery |
| **Use ACUs** | every AI action consumes credits; balance visible, topped up when low (`§3`) |

The student *is* the Assess→Plan→Learn→Improve loop in first person: diagnostic → roadmap →
AI tutor + resource creation → progress tracking, all metered by ACUs.

**Publicly-confirmed Student Command Centre feature inventory** (full list):

| Group | Features |
|---|---|
| **Profile & academics** | student profile · academic level · subjects · exam board · target grades · current grades |
| **Assess** | weak-topic detection · AI diagnostic test · confidence score · mistake tracking · mastery score |
| **Plan** | study planner · recovery plan · revision timetable · study streaks |
| **Learn (AI tools)** | AI tutor · interactive lessons · flashcards · quizzes · past papers · AI-generated notes · topic summaries · formula sheets · mind maps · essay plans · practice questions |
| **Assignment & feedback** | assignment review · predicted grade · instant feedback |
| **Improve / track** | progress dashboard · visual graphs/charts · saved resources |
| **Economics** | ACU wallet · premium tools |

*(Source: StudYear public site — AI tutor, personalised plans, quizzes, flashcards, instant
feedback, diagnostics, assignment review, grade prediction, visual charts, past papers,
interactive lessons, and recovery plans are publicly confirmed.)*

**Student journey & action surface** — tagline: *"Study smarter, not harder."* Directly
evidenced: AI tutor, personalised plans, quizzes, flashcards, and instant feedback **in one
workspace built around the student's grades.** The journey below is consistent with public
evidence; items not marked ✦ are design inference (reconstruction):

| Stage | Surface & actions | Evidence notes |
|---|---|---|
| **Onboarding** | role selection at signup → profile capture; registration collects **name, email, selected role, study level, subjects** ✦; entry CTA is a **free personalised AI diagnostic report** ✦ | registration fields + CTA public |
| **Diagnostic** | baseline assessment ingesting academic data + confidence signals → **diagnostic report** → weak-topic map | engine confirmed (`§2.1`) |
| **Planner** | adaptive weekly schedule, exam-timeline-aligned, automated re-prioritisation; **Recovery Plans** imply a distinct remediation flow triggered when a student falls behind or a risk threshold trips ✦ | Recovery Plans on capability strip |
| **Learning studio** (`/create`) | generate interactive lessons/courses, flashcard decks, quizzes; **Privacy Policy confirms inputs** include exam questions, written answers for feedback, topics for summarisation, and AI-tutor queries ✦ — so **summarisation is a confirmed tool** alongside the marketed ones | Privacy Policy |
| **Assignment/essay review** | upload work → structured feedback + predicted grade + **generated educational visuals** ✦ | flagship module |
| **Past papers** | practice bank, presumably AI-marked against mark schemes | strip-confirmed; marking flow inferred |
| **Progress dashboard** | live mastery metrics, predicted grades, charts; **every learning interaction writes back to the mastery model** ✦ | Improve phase |
| **Wallet actions** | view ACU balance (persistent in nav ✦) · top up via **Stripe checkout** ✦ · review consumption history — Privacy Policy confirms **ACU transactions are logged and consumption is monitored and audited for billing and wallet integrity** ✦ | Privacy Policy + Terms |
| **Resource actions** | search the shared library · contribute resources · consume peer/tutor-shared materials ✦ | `/search` + Terms library licence (`§2b.1`) |

### 4.3 Parent — support without micromanaging

| Area | Responsibilities |
|---|---|
| **Link to child** | connect to one or more child profiles |
| **View child dashboard** | progress, weak subjects, study consistency, predicted grade, completed tasks |
| **Risk alerts** | low adherence, confidence drop, weak topic not improving, exam risk |
| **AI parent briefing** | **weekly summary**: what changed, what needs support, what to ask the child |
| **Intervention guidance** | practical advice to help without pressure |
| **Manage payment / ACUs** | buy ACUs, monitor usage, control spend (`§3`) |
| **Family dashboard** | multiple children, different subjects, different risk levels |

The "AI parent briefing" is the real-product seed of the **Concierge.ai** agent (`14 §5`);
risk alerts are Progress Intelligence (`§2.4`) surfaced to the guardian.

**Publicly-confirmed Parent Dashboard feature inventory** (full list — live progress, risk
alerts, intervention insights, and the parent dashboard are publicly confirmed):

| Group | Features |
|---|---|
| **Linking & family** | link child account · family dashboard · multi-child management · parent notes |
| **Visibility** | child progress · weak subjects · study time · plan adherence · completed tasks · missed study sessions · predicted grades |
| **Alerts & insight** | risk alerts · AI recommendations · weekly AI briefing · academic confidence tracker · **burnout risk indicator** |
| **Intervention** | parent intervention mode |
| **Economics** | approve ACU top-ups · buy Premium/Pro plans |

**Parent journey & action surface** — tagline: *"Clarity without micromanaging."* Directly
evidenced: live progress, risk alerts, and intervention insights so parents support their
child with confidence — the promise that parents **see momentum and risk early, not just a
report-card surprise.** Reconstructed surface (design inference consistent with evidence):

| Surface | Actions |
|---|---|
| **Child-account linking** | link one or more children |
| **Parent Dashboard** (read-oriented) | mirrors the child's mastery / plan / predicted grades |
| **Risk-alert notifications** | falling mastery · missed plan items · approaching exams |
| **Intervention suggestions** | recommend a recovery plan, or a **marketplace tutor** |
| **Wallet funding** *(plausible, not publicly stated)* | fund the child's ACU balance — a natural **payer–beneficiary split** in the ACU model |

**Enhanced AI agents (parent layer — specialise Concierge.ai):**

| Agent | Role |
|---|---|
| **Parent Advisor Agent** | tells parents what to do **without micromanaging** |
| **Early Warning Agent** | alerts parents when a child is slipping **before grades collapse** |
| **Family Support Agent** | recommends home routines, revision windows, and emotional-support actions |
| **ACU Control Agent** | advises when to top up ACUs and **which tools give best value** |

### 4.4 School — institutional command centre

| Area | Responsibilities |
|---|---|
| **Account & verification** | create school account, verify organisation |
| **Manage structure** | students, teachers, classes, year groups, subjects, cohorts |
| **Shared ACU pool** | school buys ACUs and **allocates usage** across students/teachers (`§3`) |
| **Cohort intelligence** | weak topics across classes, year groups, and subjects |
| **At-risk detection** | identify students falling behind **before reports or exams** |
| **Staff deployment** | show leaders where teacher/tutor intervention is needed |
| **School dashboard** | learning activity (attendance-like), study adherence, mastery improvement, predicted-grade risk |
| **Resource sharing** | teachers/school create or **approve** learning resources |
| **Reports** | export performance summaries for leadership, parents, intervention meetings |

The shared ACU pool is the institutional twist on `§3`: procurement and allocation sit with
the school, consumption with students/teachers. Cohort intelligence + at-risk detection are
Progress Intelligence (`§2.4`) aggregated to the institution — the seed of **Principia.ai**
and **Sentinel.ai** institutional analytics (`14 §1–2`).

**Publicly-confirmed School Command Centre feature inventory** (cohort health maps, staff
deployment, at-risk intelligence, and shared ACU pools are publicly confirmed):

| Group | Features |
|---|---|
| **Setup & structure** | school admin dashboard · create school profile · invite teachers · invite students · create classes · create year groups · create cohorts · assign subjects · assign teachers |
| **Intelligence** | monitor cohort performance · at-risk student detection · **cohort health map** · school-wide analytics · department dashboards · attendance/engagement insights |
| **Intervention** | intervention tracking · **safeguarding-style academic alerts** · staff/teacher workload dashboard · parent communication support |
| **Economics & reporting** | shared ACU pool · school subscription billing · export reports |

**School journey & action surface** — tagline: *"Executive academic operations."* Directly
evidenced: cohort health maps, staff deployment, at-risk intelligence, and shared ACU pools —
sold on the promise that leaders get **cohort visibility without waiting for end-of-term
reports** to spot who needs help. The homepage's **"3 partner organisations" metric confirms
an organisational account construct exists in production.** Reconstructed command centre:

| Surface | Actions |
|---|---|
| **Institution onboarding** | org account provisioning, seat/roster management |
| **Cohort dashboards** | by year group / subject / class, with **heat-mapped mastery** |
| **At-risk flagging** | flag students with **drill-down to individual diagnostics** |
| **Staff deployment views** | match teacher capacity to at-risk clusters |
| **Shared ACU pool** | org-level wallet with **allocation, quotas, and consumption auditing** across students/staff |
| **Reporting** | exportable reporting for SLT / governors |

**Enhanced AI agents (school layer — specialise Principia.ai):**

| Agent | Role |
|---|---|
| **School Improvement Agent** | identifies underperforming cohorts, recommends interventions |
| **Cohort Risk Agent** | flags students likely to miss target grades |
| **Staff Deployment Agent** | recommends where teachers/tutors should focus |
| **Executive Report Agent** | produces weekly headteacher/governor reports |
| **Funding Impact Agent** | progress evidence for premium/intervention/catch-up programmes |

### 4.5 School Teacher — the learning-intervention operator

| Area | Responsibilities |
|---|---|
| **View caseload** | assigned students / classes |
| **See diagnostics** | diagnostic results and weak topics per student (`§2.1`) |
| **Create AI resources** | quizzes, flashcards, topic summaries, explanations, revision packs |
| **Assign tasks** | set tasks to students |
| **Track** | completion and mastery |
| **Review submissions** | grade/feedback on student work |
| **AI teaching assistant** | generate differentiated explanations, intervention plans, class-level topic recovery |
| **Monitor class risk** | who's behind, who needs attention, who improved |
| **Feedback** | send to students / parents / school leadership |

Framed as an **intervention operator**, not just a grader — the AI teaching assistant is the
real-product seed of **Pedagogue.ai** (`14 §3`): differentiated explanations + intervention
plans + class-level topic recovery.

> **⚠ Positioning finding:** the public site markets **four** roles (students, parents,
> schools, tutors) — **the teacher is not a separately marketed persona.** This implies
> teachers operate as **staff seats inside the School Command Centre** rather than owning a
> standalone product surface. Reconstructed teacher surface: class-level progress views
> scoped by RBAC · assignment of AI-generated lessons/quizzes to classes · **review of AI
> assignment feedback before release** · flagging/actioning at-risk students surfaced by the
> school's intelligence layer · drawing on the **shared ACU pool** for AI teaching tools.
> **If teachers are intended as a first-class persona, this is currently a positioning gap
> on the marketing site.**

**Teacher Workspace feature inventory** (the site references teaching/supporting roles and
school command intelligence):

| Group | Features |
|---|---|
| **Caseload & insight** | teacher dashboard · assigned classes · assigned students · subject performance view · **topic weakness map** · view predicted grades · view mastery by topic · monitor study adherence |
| **Create & assign** | create assignments · generate quizzes · generate flashcards · generate lesson plans · generate intervention plans · create resources · share resources |
| **Review & respond** | review assignments · track homework completion · send feedback · flag students for support |
| **Reporting** | export class reports |

**Enhanced AI agents (teacher layer — specialise Pedagogue.ai):**

| Agent | Role |
|---|---|
| **Lesson Planning Agent** | creates differentiated lessons by student ability |
| **Marking Assistant Agent** | supports feedback, rubric marking, improvement advice |
| **Intervention Agent** | creates targeted support plans for weak students |
| **Classroom Insight Agent** | tells the teacher which topics need reteaching |

### 4.6 Private Tutor — professional command centre

| Area | Responsibilities |
|---|---|
| **Profile & listing** | create tutor profile + marketplace listing |
| **Showcase** | subjects, levels, availability, pricing, experience, ratings |
| **Enquiries** | receive student/parent enquiries |
| **Session pipeline** | leads → bookings → active students → completed sessions |
| **Diagnostic access** | view student diagnostic **where permission is granted** |
| **AI teaching tools** | lesson plans, quizzes, explanations, homework, topic-recovery plans |
| **Track progress** | student progress across sessions |
| **Resource sharing** | share resources with students |
| **Business** | manage earnings, reviews, booking history, performance |

Note the **permissioned diagnostic access** — a tutor sees a student's diagnostic only with
consent, the real-product basis for Matchmaker.ai's privacy-controlled "deficit handoff"
(`14 §6.2`).

**Publicly-confirmed Tutor Command Centre feature inventory** (marketplace listings, session
pipeline, AI teaching tools, and earnings are publicly confirmed):

| Group | Features |
|---|---|
| **Storefront** | tutor profile · marketplace listing · subjects offered · pricing · availability · reviews/testimonials |
| **Pipeline** | session booking · student pipeline · parent enquiries · tutor dashboard |
| **Teaching** | AI teaching tools · lesson preparation · resource generation · session notes · progress tracking |
| **Business** | earnings dashboard · payment history · ACU usage |
| **Trust** | tutor verification · document upload · **safeguarding/compliance checks** |

**Tutor journey & action surface** — tagline: *"Professional command centre."* Directly
evidenced: marketplace listings, session pipeline, AI teaching tools, and earnings — **built
for independent educators.** Reconstructed surface:

| Surface | Actions |
|---|---|
| **Marketplace profile/listing** | public listing: subjects, levels, rates; discovery by students/parents |
| **Session pipeline** | enquiry → booking → session → follow-up — a **lightweight CRM** |
| **AI teaching tools** | lesson/quiz/flashcard generation **reused from the student studio**, applied to tutees |
| **Tutee progress** | visibility across sessions |
| **Earnings & payouts** | earnings dashboard; **Stripe Connect would be the natural rail** (only Stripe generally is confirmed) |
| **Resource publishing** | publish into the shared library **as a lead-generation channel** |

**Enhanced AI agents (tutor layer — specialise Matchmaker.ai):**

| Agent | Role |
|---|---|
| **Tutor Growth Agent** | improves listing, pricing, and conversion |
| **Session Prep Agent** | generates lesson plans before each session |
| **Student Progress Agent** | tracks each student, recommends next tutoring focus |
| **Revenue Agent (tutor)** | monitors earnings, bookings, cancellations, growth opportunities |

## 5a. Machine Learning Layer — the proprietary learning-intelligence engine

StudYear's defensible core: **every quiz, assignment, tutor session, weak topic, missed
study session, parent action, and teacher intervention becomes intelligence.** The named
model portfolio:

| # | Model | Predicts / learns | Primary consumers |
|---|---|---|---|
| 1 | **Grade prediction** | predicted grade per subject vs target | student, parent, teacher, school |
| 2 | **Topic mastery** | mastery state per (student, topic) | all engines; the core signal |
| 3 | **Drop-off / churn risk** | account disengagement & cancellation risk | admin, Revenue Agent, Sentinel.ai |
| 4 | **Study adherence prediction** | will the student follow this week's plan | Study Roadmap, Mentor.ai, parents |
| 5 | **Burnout risk** | over-study / fatigue trajectory | Motivation Agent, Family Support, parents |
| 6 | **Student confidence** | confidence level per subject/topic | diagnostics, briefings, teachers |
| 7 | **Best-time-to-study** | optimal personal study windows | planner, Family Support Agent |
| 8 | **Question difficulty** | calibrated item difficulty | quiz generation, adaptive testing |
| 9 | **Tutor matching** | student↔tutor fit & expected lift | Matchmaker.ai, marketplace |
| 10 | **Intervention effectiveness** | which interventions work for whom | teachers, School Improvement Agent |
| 11 | **ACU consumption prediction** | wallet burn & depletion timing | ACU Control Agent, admin, Revenue |
| 12 | **School cohort risk** | cohort-level target-miss probability | Cohort Risk Agent, school leaders |
| 13 | **Parent engagement** | guardian responsiveness & channel fit | Concierge.ai, Early Warning Agent |

*Architecture:* these models live in the AI compute layer (`docs/architecture/15`), trained
on the event stream and feature store of the data-intelligence layer
(`docs/ai-os/07-data-intelligence-layer.md`), and are consumed by the enhanced agents
(`docs/ai-os/04-multi-agent-ecosystem.md §3A`). The flywheel: more interactions → better
models → better interventions → better outcomes → more usage.

## 5e. Personalisation Engine — "one classroom, a thousand curricula" (v1.1)

> The doctrinal heart of the blueprint, formalising the pedagogical thesis (`§0`): **the
> teacher teaches once; the OS consolidates a thousand different ways.**

### The Learner Profile Vector (LPV)

Seven **behaviourally-inferred** dimensions per student:

| # | Dimension | Captures |
|---|---|---|
| 1 | **Pace profile** | speed of understanding per topic family |
| 2 | **Format effectiveness** | which format actually works — measured **per-student, per-topic**, empirically |
| 3 | **Error taxonomy** | the *kinds* of mistakes this student makes |
| 4 | **Cognitive load tolerance** | how much intensity per session before quality drops |
| 5 | **Engagement chronotype** | when this student genuinely studies best |
| 6 | **Confidence calibration** | gap between self-assessed and actual mastery |
| 7 | **Language profile** | English / French (the francophone-corridor dimension) |

**All learned from behavioural telemetry** — response latency, hesitation, retries,
abandonment points, session rhythm — **never from questionnaires**: zero extra effort from
the student.

### Three adaptation loops ("improve everyone very quickly" as an engineering property)

| Loop | Timescale | Behaviour |
|---|---|---|
| **Within-session** | seconds | difficulty and format shift in real time |
| **Across-session** | days | the Planner gives two classmates with identical timetables **entirely different plans** |
| **Across-cohort** | weeks | the teacher's Cockpit shows not just *what* the class doesn't know, but **how differently they learn** |

### Closing principle

**Catch-up compression** for slower starters; **stretch material** for fast movers — *the
floor and the ceiling rise together, because nobody is served the average student's
experience.*

### Registry addition — SY-A21 Profile Agent

The **Profile Agent (SY-A21)** joins the registry as **substrate serving all personas** —
it owns the LPV and feeds every other agent. The blueprint agent registry now stands at
**twenty-one agents**; per the [mandate](../REQUIREMENTS-MANDATE.md), this unions with the
14-agent roster (`§5c`), the 25 enhanced agents (`../ai-os/04 §3A`), and the 18-agent build
list (Get Revising audit §5).

> **Deliberate framing choice:** *format effectiveness* is defined as a per-student,
> per-topic **empirical measurement** rather than "learning styles" — achieving the
> personalisation goal while staying aligned with the education-research evidence base.
> This wording survives scrutiny from any headteacher or edtech-literate investor.

## 5b. The 20 key platform modules

The product decomposes into these modules (build/refine targets); each maps to engines
(`§2`), roles (`§4`), and the architecture docs:

| # | Module | # | Module |
|---|---|---|---|
| 1 | User & Role Management | 11 | Teacher Workspace |
| 2 | Student Academic Profile | 12 | Tutor Marketplace |
| 3 | Diagnostic Engine | 13 | ACU Wallet & Billing |
| 4 | AI Tutor | 14 | Stripe Checkout |
| 5 | Study Planner | 15 | Notifications & Alerts |
| 6 | Assignment Review | 16 | Reports & Exports |
| 7 | Resource Generator | 17 | Content Library |
| 8 | Progress Dashboard | 18 | Audit Logs |
| 9 | Parent Command Centre | 19 | GDPR / Data Management |
| 10 | School Command Centre | 20 | Admin Control Panel |

> **Loop wording:** StudYear states the operating logic as **Assess → Plan → Execute →
> Improve** (a.k.a. Assess→Plan→Learn→Improve): it ingests academic data + confidence
> signals, builds prioritised study schedules and interventions, then **updates mastery
> metrics from every interaction so plans adapt in real time.**

## 5c. AI Agent OS Architecture — the specialist agent roster

StudYear should be built around **specialist agents**:

| Agent | Domain | Maps to |
|---|---|---|
| **Student Tutor Agent** | 24/7 AI tutoring | Mentor.ai / AI Tutor module |
| **Diagnostic Agent** | baseline & gap detection | Diagnostic Engine (`§2.1`) |
| **Study Planner Agent** | weekly roadmaps | AI Study Roadmap (`§2.2`) |
| **Assignment Review Agent** | feedback + grade prediction | Assignment Coach (§3A.8) |
| **Grade Prediction Agent** | predicted grades | ML model #1 (`§5a`) |
| **Parent Advisor Agent** | guardian guidance | §3A.9 |
| **Teacher Assistant Agent** | educator copilot | Pedagogue.ai family (§3A.18–21) |
| **School Intelligence Agent** | cohort/institutional analytics | Principia.ai family (§3A.13–17) |
| **Tutor Marketplace Agent** | matching & tutor growth | Matchmaker.ai family (§3A.22–25) |
| **Resource Generator Agent** | AI learning-resource creation | Resource Generator module |
| **Safeguarding/Compliance Agent** | GDPR, child data, consent | §3A.3 |
| **ACU Billing Agent** | wallet metering & billing | ACU Wallet (`§3`) |
| **Retention Agent** | churn prevention | Revenue/churn models |
| **Admin Control Agent** | platform governance | Admin Intelligence (§3A.1) |

**Every agent MUST have (governance invariants):**

1. **Clear permissions** — scoped grants, no ambient authority
2. **Audit trail** — every action logged, immutable
3. **Cost tracking** — ACU/compute metering per action
4. **Human approval where needed** — HITL gates on consequential actions
5. **Explainable recommendations** — every suggestion carries its "why"
6. **Data access limits by role** — reads bounded by the requester's role scope

*(These six invariants are enforced by the orchestration contract in
`docs/ai-os/04-multi-agent-ecosystem.md §4` and the AI Governance Agent in
`docs/ai-os/05-self-managing-platform.md`.)*

## 5d. Strategic upgrade — the strongest version

> **A full AI Academic Operating System where students improve, parents understand,
> teachers intervene earlier, schools manage performance, tutors grow revenue, and admins
> control the entire education intelligence layer.**

Punchy positioning:

> **"StudYear — the command centre that turns academic chaos into measurable progress."**

## 6. Positioning

> **"The AI academic operating system that turns student data into personalised learning
> action, connects parents and schools around live progress, and gives tutors and teachers
> the tools to intervene before failure happens."**

StudYear is publicly positioned as a **UK AI-powered Education OS** unifying diagnostics, AI
tutoring, study planning, assignment review, progress tracking, parent dashboards, school
command centres, and tutor-marketplace workflows.

---

*Note: the section numbering (`§5b`, `§6`) reflects incremental extraction; the prior
"How this grounds the rest of the docs" guidance still applies below.*

## 4a. Live Admin Dashboard (as-is extraction — actual console)

The production admin dashboard, verbatim ("Welcome, Admin! Here is an overview of the
platform's performance."):

**Overview tiles:** Total Students **38** · Active Users **67** · **High-Risk Students 0** ·
**Sponsored Students 0** · School Partners **3** · Est. AI spend (30d) **£0.05** · Stripe
gross (30d) **£0.00**.

**Platform economics panels:** Stripe gross 30d/90d (payment counts, billing detail link) ·
Est. AI API spend 30d (*provider-side token estimate*, ≈$0.06 USD list-price hint @ 1 USD ≈
0.79 GBP, usage log) · **ACUs consumed (30d): 85 ≈ £0.85 · 3 successful AI calls** (debit
volume with entry-pack £ hint).

**Management cards (12):**

| Card | Function |
|---|---|
| User Management | view, edit, manage **user wallets and roles** |
| Tutor Management | review tutor applications, manage profiles |
| School Management | review/approve new school partner accounts |
| Support Tools | incl. **"View as User"** to assist customers |
| Contact inbox & email test | contact-form messages + test email send |
| Blog | create posts, **publish to the public site**, view read counts |
| Content Management | manage subjects/topics, moderate generated content |
| **Growth Partner Programme** | approve influencers, review referrals, **monitor commission caps** |
| Revenue & billing | Stripe gross, payments, **discount codes**, ACU ledger |
| Analytics & Reporting | generation volumes, student engagement |
| System & AI Settings | **AI rate limits, feature flags**, global settings |
| Fraud Monitoring | review accounts flagged for suspicious activity |

**Confirmed-in-production notes:** the ACU ledger, discount codes, Growth Partner
Programme (with commission caps), impersonation ("View as User"), AI cost telemetry with
margin hints, and **Sponsored Students** (a sponsorship construct not previously
extracted — likely the bridge to local-authority/diaspora funding) all exist in the live
console. The unit economics on display (85 ACUs ≈ £0.85 revenue-equivalent vs £0.05 AI
spend ≈ **94% margin**) already sit inside the 66–100% band.

### 4a.1 User Management screen (as-is structural extraction)

> *Extracted from the live console's real-time user list. **Raw user rows (names/emails)
> are deliberately NOT persisted here** — personal data stays out of this repo per the
> platform's own GDPR posture; only the system structure and anonymised findings are
> recorded.*

**Production role enum (observed):** `STUDENT` · `PARENT` · `PRIVATE_TUTOR` ·
`SCHOOL_ADMIN` · `SCHOOL_TUTOR` (the school-teacher role) · `ADMIN`.

**Production subscription labels (observed):** Child Free · Student Premium · Student
Premium+ · Student Max · Parent Pro+ · Parent Elite · **School staff** · Admin — matching
the commercial model's tiers (Student Access not observed in the sample but specced).

**Per-row admin actions:** Edit · **Adjust ACUs** · **View as User** · Delete — and for
STUDENT rows additionally **Link Parent** and **Link School** (guardianship and school
membership are admin-linkable edges, confirming the identity-graph design in
`../architecture/01`/`09`).

**Data-quality findings (actionable engineering backlog):**

| Finding | Evidence pattern | Fix mapped to |
|---|---|---|
| **Duplicate accounts** | same email appearing up to 4× with different role/case | identity merge tooling (`../architecture/02 §2.2`), unique-email constraint |
| **Inconsistent role casing** | `STUDENT` vs `student`, `ADMIN` vs `admin`, `tutor` vs `PRIVATE_TUTOR` | canonical role enum (`@studyear/shared` ROLES) + migration |
| **Test data in production** | `*@local.test` accounts, "test" display names mixed with real users | environment separation (`infra/deployment.md §3`), seeded fixtures in staging only |
| **Empty identity row** | one row with no display name and no email | write-time validation + cleanup job |
| **Missing display names** | many `N/A` display names | onboarding profile completion prompt |
| **Legacy domain artefact** | an admin account on a `revisionrocket.com` address | **prior product name "Revision Rocket"** — historical note; consolidate admin identities |

### 4a.2 Tutor Applications screen (as-is structural extraction)

> *Same PII policy: structure only, no personal rows persisted.*

**Workflow (confirmed in production):** review → **approve or reject** private-tutor
registrations; **tutors cannot access their dashboard until approved.** Status counters:
Total / Pending / Approved / Rejected; list sorted **pending-first.**

**Application fields:** tutor identity · **Subjects** · **Hourly rate** (observed £32/hr
across rows — likely a default) · **Fee paid** (the £10 onboarding fee from
[`commercial-model.md §9`](commercial-model.md)) · Status · Actions (Reject / Approve).

**Findings (engineering backlog):**

| Finding | Evidence | Fix mapped to |
|---|---|---|
| **Subjects are free text** | entries like "Full Stack Developer / physics" alongside "GCSE Math" | bind the subject field to the taxonomy (`../architecture/12 §2`) with level+board scoping |
| **Onboarding fee not enforced** | rows **Approved while Fee paid = Unpaid** | gate approval (or dashboard unlock) on fee settlement per commercial model §9 — or explicitly waive for early supply-side seeding, as an admin decision |
| **Uniform default rate** | £32/hr on all rows | tutor-set pricing at application (venture brief §4 SY-A13/A15) |
| **No vetting evidence fields yet** | no DBS/ID columns visible | verification + DBS-evidence capture before transacting (venture brief §10.2) |

### 4a.3 Blog console (as-is — the AI blog is live)

**Confirmed in production:** an **"AI generator"** button (the founding directive #19 /
SY-A22 foundation already exists) · draft → **publish to the public blog** → **Unpublish /
Delete / Edit / View live** lifecycle · **view tracking**: one increment per successful
public page load ("Clicks").

**Published posts observed (public content, safe to record):**

| Title | Clicks |
|---|---|
| Unlocking Every Child's Potential: How StudYear Creates Equal Chances | 7 |
| StudYear: The AI Academic Command Center Unifying Education for a Smarter Future | 9 |
| Unlock Your Child's Full Potential: StudYear's AI-Powered Personalized Learning | 7 |
| Navigating University Routes: How StudYear Empowers Students & Parents | 11 |
| **The Cold War: A World Divided and the Legacy It Left Behind** | 13 |
| The Power of Testing: Why Experimentation Drives Growth & Success | 5 |

**Notes:** slugs are SEO-friendly; the mix is brand-marketing + **curriculum content** (The
Cold War — a Topic from the `12 §4` taxonomy — is the top performer at 13 clicks),
validating the SY-A22/SY-A24 strategy that **topic-level educational content outdraws brand
content** (`marketing-engine.md`). Backlog: read-time/uniques (clicks ≠ readers), CTA
conversion tracking per post, and the SERP-gap feed from SY-A24.

### 4a.4 Content Management (as-is — resource ingestion pipeline)

**Confirmed in production:** manage subjects, topics, and **curate external video
resources** via an **ingestion pipeline** — add → review → approve before content goes
live (the SY-A17 verification-before-ranking pattern, already present as a human workflow).

**Add New Resource form fields:**

| Field | Observed detail |
|---|---|
| Resource Type | dropdown — **Videos** observed (the `12 §5` media family) |
| Title / URL | external link curation (YouTube first) |
| **Subject** | dropdown starting at **Accounting** — bound to the Subject taxonomy (`../architecture/12 §2`), unlike the free-text tutor subjects (§4a.2 finding) |
| **Level** | dropdown starting at **"Reception (Primary School)"** — production levels are **finer-grained than the marketing enum**: year-level granularity within Primary (Reception, presumably Y1–Y6…) |
| Topic | topic binding (`12 §4`) |
| **License Type** | "Standard YouTube" observed — licensing captured at ingestion |
| Attribution | free text, "if required" |

**Notes:** the licence + attribution fields show content-rights hygiene is built in from the
start (cf. exam-board licensing risk, venture brief §15). The **Reception** value extends
the Level vocabulary (`12 §1`) with sub-Primary granularity — recorded as an enhancement to
that enum. Pipeline currently empty — curation is early.

### 4a.5 Revenue & Billing screen (as-is)

**Stripe connection:** live but on a **restricted key (`rk_live…`)** with webhook secret
set; console warns to prefer a standard `sk_` for Checkout or grant the rk_ scopes
(Checkout Sessions, Customers, Prices, Coupons, Promotion codes, Webhooks). **Operational
finding:** key scoping needs resolving before payment volume.

**Economics panels:** Stripe gross 30d/90d (£0.00, no payments yet) · Est. AI API spend 30d
(£0.05, token-based provider list prices USD × fixed USD→GBP hint, with an explicit
"verify against OpenAI / Google Cloud invoices" caveat) · ACUs consumed 85 ≈ £0.85 ·
**Indicative margin (30d): £−0.05** — the margin instrumentation exists and currently reads
negative purely because revenue is £0. ACU £ value assumes the **Entry pack £5/500 ACUs**
(consistent with £1 = 100 ACUs).

**Live ACU debit ledger — tariff confirmation.** Observed feature debits match the
commercial-model §5 tariff **exactly**:

| Live feature label | Observed debit | Spec (`commercial-model §5`) |
|---|---|---|
| AI COURSE GENERATOR | −30 | course_generator 30 ✅ |
| AI INTERACTIVE LESSON | −25 | interactive_lesson 25 ✅ |
| AI QUIZ GENERATION | −10 | quiz_generation 10 ✅ |
| AI EXPLANATION | −5 | quick_explanation 5 ✅ |

**Backlog finding:** every debit shows *"No provider £ logged on this debit"* — per-action
provider-cost telemetry isn't captured yet, which is required for the 66–100% margin
band to be observable per feature (`infra/deployment.md` stability rules).

**Discount codes (live — §12b confirmed in production):** codes **sync to Stripe
automatically**; shareable links `/checkout?code=YOUR_CODE`; create form (code, type
percentage/£ off, value, optional valid-until, optional max redemptions); active-code list
with usage counters (e.g. `0/1 used`) and Deactivate. The §12b spec's remaining deltas:
per-user limits, audience/product eligibility, bonus-ACU benefit type, margin-band check.

### 4a.6 AI Usage & API Costs screen (as-is — `aiUsageLogs`)

**Per-request logging exists in production:** user · feature (ACU debit) · **model** ·
est. API cost £ (+ USD list-price hint, FX 0.79) · ACU £ value (Entry-pack rule £5/500) ·
**status (success/failed)** · **latency (ms)** · timestamp.

**Observed operational truths (~100 rows, May–Jul 2026):**

| Truth | Evidence |
|---|---|
| **Provider mix is OpenAI-only in practice** | every row `openai`, models **gpt-4o** and **gpt-4-turbo** — despite the disclosed Google+OpenAI DPA pair, live traffic is single-provider → the AI Gateway/provider-switching directive (`../architecture/14 §0.0`) is not yet realised |
| **Real per-action margin is healthy** | e.g. 25-ACU actions (£0.25) cost £0.006–£0.016 → **93–97% margin**, inside the 66–100% band |
| **Fast-fail is not billed** | failed rows at 3–43ms charge 0 ACUs ✅ |
| **⚠ Margin leak: unbilled successes** | multiple **success** rows with **0 ACUs charged but real API cost** (e.g. £0.0127, £0.0123, £0.0131) — AI work delivered free; either unmetered features or a metering bug. **Backlog: every successful AI call must map to a tariff debit** (commercial-model §11 "no unlimited AI") |
| **Latency profile** | successful generations 3–31s (deep work); the 11–18s median matches deep-thinking-style generation |
| **Cost-join gap** | the ACU debit ledger (§4a.5) shows "no provider £ logged" while `aiUsageLogs` *does* hold cost — the two ledgers need joining for per-feature margin observability |

### 4a.7 Analytics & Reporting screen (as-is)

**KPIs:** Total users **67** · Returning (30d, via `lastLoginAt`) **37** · New sign-ups
(30d, via `createdAt`) **25** · AI requests logged (30d) **4**.

**Charts live in production:** *New Users This Year* (monthly line, **Sept 2025 → Jul 2026**
— dating the platform's launch to ~Sept 2025; y-axis 0–28) · *Avg. Study Time / Week
(Hours)* (weekly line, May–Jun window; y-axis 0–4h).

**Footer legal line confirms:** **© 2026 StudYear Ltd.** — a UK limited company; use
subject to Terms, Privacy, Disclaimer, Cookies.

### 4a.8 Fraud Monitoring screen (as-is)

System-flagged accounts queue for **manual review**: columns User · **Reason for Flag** ·
Status · Actions. Currently empty (no flagged users) — the queue exists ahead of volume,
ready for the Sentinel/SY-A20 signal feeds (growth-programme §7 anti-fraud signals).

### 4a.9 Support Tools screen (as-is — audited impersonation)

**"View as User"** is implemented exactly to the audited-impersonation spec (`02 §2.4`,
`ai-os/14 §0` break-glass pattern):

- **secure, time-limited impersonation session**
- target user by search or explicit UID
- **Reason for Session is a required field** (e.g. "Investigating user report of missing
  study plan…")
- banner: **"All actions are logged."**

This is the strongest governance signal in the live console — reason-required, time-boxed,
logged impersonation was designed in from the start.

### 4a.10 Contact Inbox & email delivery (as-is)

**Email stack confirmed:** SMTP via **`smtp.hostinger.com:465`**, mailbox
`contact@studyear.com` — **Hostinger hosts email as well as DNS**; welcome emails, top-up
receipts and contact-form notifications all ride SMTP; the app runs on **Firebase App
Hosting** (env vars + container **rollouts** explicitly referenced — confirming the
deployment split directive's Firebase backend).

**⚠ Active incident (as captured):** **SMTP login rejected (535)** — email delivery down.
Console's own remediation: use full email as `MAIL_USERNAME`; `MAIL_PASSWORD` = mailbox
webmail password (not hPanel); after changing Firebase env vars **trigger a new rollout**
(old containers keep the previous password); prefer **Firebase Secret Manager** for
passwords containing `@`; try `MAIL_SMTP_HOST=smtp.titan.email` if the mailbox uses Titan.
Contact-form submissions still land in the inbox regardless.

**Inbox structure:** 17 messages · types **support / billing / partnership** · statuses
**NEW / READ / REPLIED** · reply directly from the inbox via SMTP · delivery address
configurable (Admin → Settings or `CONTACT_INBOX_EMAIL`).

**Findings (no PII persisted):**

| Finding | Evidence pattern | Action |
|---|---|---|
| **⚠ Contact-form bot spam** | ~half the inbox is random-string names/bodies | add CAPTCHA/honeypot + rate limiting; spam-classify into a separate queue (SY-A16-adjacent) |
| **Real payment friction** | a billing message: *"Hello, I cannot pay"* | aligns with the Stripe rk_ key scoping finding (§4a.5) — checkout path needs verification |
| **Live B2B demand** | a partnership message: *"my school is ready for a demo"* | route to the school-pilot motion (GTM §12.1) — leads are already arriving inbound |
| **Free-ACU requests** | *"I need free ACUs please"* | the admin goodwill-grant path exists (§4.1); needs a policy + canned response |

### 4a.11 System & AI Settings screen (as-is — the config plane)

**Feature flags (live, globally toggleable):** Tutor Marketplace · Parent Dashboard ·
School Portal · AI Feedback Engine (Premium).

**Pricing & Billing Rules (live):**

| Setting | Live value | Significance |
|---|---|---|
| **ACU Pricing Multiplier** | **3** — "User charge = internal AI cost × this multiplier" | **the 66% margin rule is already implemented**: cost = ⅓ of charge ≈ 33.3% ≈ **66.7% margin**, precisely the band floor (`commercial-model §1`) — enforced as a single admin-tunable parameter |
| **Tutor Marketplace Commission** | **20%** | **⚠ discrepancy:** commercial model §9 says **15%** per lesson; live config says 20% (admin-adjustable). Resolve which governs — the config plane makes either a one-field change |

**AI Provider Settings (live):**

| Slot | Value |
|---|---|
| Default provider | **OpenAI** |
| Fallback provider | **OpenAI** (fallback not yet diversified) |
| OpenAI models | cost-effective **gpt-4-turbo** · performance **gpt-4o** |
| Google Gemini models | cost-effective **gemini-2.5-flash** · performance **gemini-2.5-pro** |
| Google Vertex AI models | cost-effective **gemini-2.5-flash** · performance **gemini-2.5-pro** |

> **Gateway status:** the **provider-switchable AI gateway exists in production config** —
> default/fallback provider selection + per-provider cost/performance model tiers across
> OpenAI, Gemini, and Vertex — but both slots currently point at OpenAI (matching the
> OpenAI-only `aiUsageLogs`, §4a.6). Completing the directive (`../architecture/14 §0.0`)
> means: diversify the fallback, add Anthropic Claude as a provider, and enforce
> deep-thinking mode per call.

**Communications settings (live):** configurable message copy (forgot-password, contact
form, **signup welcome email** subject/body) · company identity **StudYear Ltd.**, listed
address "123 Learning Lane, London SW1A 0AA" (**placeholder address — replace before
compliance review**) · sender `noreply@studyear.com` (`MAIL_FROM_ADDRESS`) · support/inbox
`contact@studyear.com`.

**Site footer (as-is page map):** StudYear — *"an AI-powered academic command centre,
unifying student data, learning, teaching, and communication in one intelligent
platform."* · **Platform:** How It Works · Create · Find Resources · **Company:** About
Us · Contact · Blog · **Legal:** Terms · Privacy · Disclaimer · Cookies.

## 4b. Senior-PM observations (teardown synthesis)

Four findings stand out from the full public teardown:

1. **The closed loop is the genuine moat.** Versus content libraries and single-point AI
   tutors, the differentiator is the **write-back from every learning action into the
   mastery model**, which then mutates the plan and the predicted grade — and the marketing
   states it explicitly. (This validates the single-fact mastery thesis that anchors
   `docs/architecture/00`/`07`.)

2. **The ACU model is unusually disciplined for edtech** — strictly prepaid, no overdraft,
   non-refundable. Commercially clean, but two watch-items:
   - **UK consumer-rights friction** around non-refundability;
   - **conversion drop at the "balance hit zero mid-revision" moment.**
   The obvious next moves: **auto-top-up** and a **parent-funded wallet** (the
   payer–beneficiary split already reconstructed in §4.3 and designed in
   `docs/ai-os/` — ACU Control Agent, family wallet scope).

3. **The liability posture is well-drafted:** grade predictions are framed as **estimates,
   not guarantees**, and users are **solely responsible for verifying AI outputs** before
   submitting academic work — the right academic-integrity stance.

4. **The two most visible gaps** between the four marketed command centres and a full
   six-role operating system: the **teacher-persona absence** (§4.5 finding) and the **thin
   public detail on tutor payout mechanics** (§4.6 — Stripe Connect inferred, not stated).

**Recommended next actions (product):** ship auto-top-up + parent-funded wallets to close
the zero-balance drop; decide the teacher-persona question (staff-seat vs first-class) and
align the marketing site; publish tutor payout mechanics (rail, schedule, fees) to
strengthen marketplace supply trust.

## 5. How this grounds the rest of the docs

- The **architecture** docs (`docs/architecture/`) generalise this into a kernel + persona
  model; the **mastery/closed-loop** thesis there is literally this product's Assess→Improve
  loop plus Progress Intelligence.
- The **AI-OS** docs (`docs/ai-os/`) transform this into enterprise infrastructure **without
  removing** any engine, role, or the ACU economics — ACU becomes the metering layer for the
  expanded agent workforce.
