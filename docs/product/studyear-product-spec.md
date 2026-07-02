# StudYear — Authoritative Product Specification (as-is)

> **Source of truth for what StudYear *actually is today*** — extracted from the public site,
> terms, privacy policy, and known OS logic. This is distinct from the aspirational
> enterprise **AI-OS transformation** in [`docs/ai-os/`](../ai-os/README.md) (PART 4), which
> *adds to* — never removes — what is documented here.
>
> Where the architecture docs (`docs/architecture/`) describe an idealized ecosystem, this
> file records the **real product's positioning, engine, wallet economics, and roles**, so
> every downstream design stays grounded.

## 1. Core purpose

StudYear is an **AI-powered Education Operating System** that connects diagnostics, AI
tutoring, study planning, assignment review, live progress, parents, schools, teachers, and
tutors in **one academic command centre.** It is built around a closed loop:

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
| 1 | **Diagnostic Engine** | Finds student baseline: current grades, confidence level, weak topics, strengths, and **risk profile**. |
| 2 | **AI Study Roadmap** | Creates personalised **week-by-week** study plans from weak areas, exam timelines, and grade targets. |
| 3 | **AI Learning Tools** | AI tutor, interactive lessons, quizzes, flashcards, topic summaries, essay feedback, diagrams, charts, past-paper support, revision resources. |
| 4 | **Progress Intelligence** | Tracks quizzes, lessons, **mastery**, adherence, **predicted grades**, risk alerts, and improvement over time. |
| 5 | **ACU Wallet System** | AI features consume prepaid **AI Credit Units (ACUs)**. When ACUs hit zero, **AI features stop** until the wallet is topped up. |

The five engines *are* the Assess→Plan→Learn→Improve loop: Diagnostic = Assess, Roadmap =
Plan, Learning Tools = Learn, Progress Intelligence = Improve — with the ACU Wallet metering
the AI compute that powers all four.

## 3. ACU Wallet economics (the monetisation backbone)

- **Prepaid credits:** AI features draw down ACUs; **cost is per action** (per tool / per
  generation), set by the platform.
- **Hard stop at zero:** when the balance reaches zero, AI features are disabled until
  top-up — a clean, usage-based gate (no silent overage).
- **Where it plugs in:** every AI Learning Tool (`§2.3`) and AI-driven engine action checks
  and decrements the wallet; balances, top-ups, deductions, refunds, and usage logs are
  admin-managed (`§4`).
- **Shared pools:** schools can operate a **shared ACU pool** across their cohort (`§4`).
- This is the concrete instance of the "AI credit / ACU system" the AI-OS monetisation model
  (PART 4) builds on.

## 4. Roles — real feature extraction

> Authenticated dashboards are private; the following is a senior product extraction from
> public positioning, terms, and privacy policy. Treat as high-fidelity, not verbatim UI.

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

## 5. How this grounds the rest of the docs

- The **architecture** docs (`docs/architecture/`) generalise this into a kernel + persona
  model; the **mastery/closed-loop** thesis there is literally this product's Assess→Improve
  loop plus Progress Intelligence.
- The **AI-OS** docs (`docs/ai-os/`) transform this into enterprise infrastructure **without
  removing** any engine, role, or the ACU economics — ACU becomes the metering layer for the
  expanded agent workforce.
