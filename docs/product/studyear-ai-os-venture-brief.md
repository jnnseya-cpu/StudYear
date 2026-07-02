# StudYear AI-OS — Flagship Venture Brief

> **StudYear AI-OS is the flagship education venture of the portfolio:** an AI-native
> operating system for exam preparation that replaces the static, content-warehouse model
> of incumbent revision platforms with a **continuously learning, multi-agent workforce
> operating on a live model of every student's knowledge.**

## The incumbent generation (and what it cannot do)

The UK revision market has been anchored for over a decade by **first-generation
platforms** — Get Revising, BBC Bitesize, Seneca, Physics & Maths Tutor and their peers.
The archetype, exemplified by Get Revising, is a **static study planner bolted onto a large
user-generated content library**, with cloze-deletion self-testing and a forum community.

These platforms **proved the demand**: millions of GCSE and A-Level students, whole-school
adoptions, and strong teacher distribution. What they cannot do is **know the student**:

- they do **not model mastery**,
- they do **not replan** when a student falls behind,
- they **cannot mark a written answer** against a real mark scheme,
- and they offer **parents and private tutors almost nothing.**

## The opposite premise

StudYear AI-OS is built on the opposite premise: **every feature is an agent acting on a
shared learner state.**

| Substrate component | What it does |
|---|---|
| **Knowledge Tracing Engine** | maintains a mastery vector across **every specification point of every exam-board syllabus** |
| **Spaced-repetition scheduler** | forgetting-curve modelling decides **what each student should touch today** |
| **Examiner Agent** | marks written answers — **including essays** — against genuine mark schemes with **assessment-objective breakdowns** |
| **Grade prediction model** | a live, **defensible** predicted grade for every stakeholder, **with counterfactuals** |

Around this substrate sit **six role-scoped surfaces**: Student, Teacher, School/Trust,
Parent, Private Tutor and Platform Admin — **the last three being personas the incumbent
generation never seriously monetised.**

## The commercial thesis

- **A five-sided revenue architecture:** student premium subscriptions · parent insight
  subscriptions · per-seat school and multi-academy-trust licences · a private-tutor
  marketplace with take-rate economics · and **ACU-metered AI consumption** that keeps unit
  economics healthy as inference usage scales.
- **BitriPay as the native payment rail** — unlocking the **UK/EU–DRC diaspora corridor**
  and positioning StudYear for a **francophone-Africa expansion** (Exétat, TENAFEP,
  BEPC/WAEC corridors) **where no adaptive-revision incumbent exists.**
- **Portfolio leverage:** the agent runtime, ACU billing engine, RBAC/Zero-Trust fabric and
  BitriPay integration are **shared NSEYA X-EXECUTE assets**, compressing build cost and
  time-to-market.

## Positioning statement

> **Where the last generation gave students a library and a calendar, StudYear AI-OS gives
> every student a personal examiner, tutor and strategist — and gives every teacher,
> parent, school and tutor a live window into exactly what each child knows, forgets and
> needs next.**

## 2. Market context & competitive teardown

### 2.1 The incumbent archetype: Get Revising, fully extracted

The definitive feature inventory across every persona it serves — **the baseline StudYear
AI-OS is engineered to surpass.** *(Full four-pass audit:
[`../competitors/get-revising-audit.md`](../competitors/get-revising-audit.md).)*

**Student capabilities (primary persona)**

| Capability cluster | What the platform delivers today | Structural limitation |
|---|---|---|
| **Study planning** | timetable builder: exams by subject/level/board/date; colour-coding; subject weighting; automatic breaks; blocked-out unavailable time; printable PDF wall chart; deadline reminders | **One-shot and static.** No replanning on missed sessions or performance drops; no link to actual mastery |
| **Planner-to-content link** | clicking a scheduled slot surfaces topic resources for that session | suggestion by **tag matching, not diagnosed knowledge gap** |
| **Content library** | 400,000+ community resources tagged by subject/level/board; past-paper finder; search ranked by teacher/user ratings | **unverified UGC** of highly variable quality; no alignment scoring against specification points |
| **Creation suite** | revision notes with progressive condensing, flashcards, revision cards, mindmaps (node/connection editor), quizzes, crosswords, quizsearch hybrids; **cross-format auto-generation** from one source | **template transformation, not intelligent generation**; no ingestion of photos, PDFs, class materials |
| **Self-testing** | cloze-deletion "smart test": strips selected keywords, varies removals across attempts, times the student, benchmarks against peers; any resource testable | **recognition-level testing only.** No free-text/essay marking, no misconception diagnosis, no adaptive difficulty |
| **Community** | study groups per subject; Ask Q&A with tagging, email notification, up/down voting; threads; peer messaging; abuse reporting | **human-speed answers**, unmoderated quality, safeguarding by reactive report only |
| **Progress** | topic tick-off, completion sense of achievement | **self-declared completion, not measured mastery** |

**Teacher capabilities** — drives planner adoption (deadline reminders as light-touch
homework enforcement); library as supplementary class material and for teaching study
techniques across learning styles; free activity packs and learning kits (KS3/KS4/post-16/
EPQ) licensed for photocopying and school networks/VLEs; creates and rates resources,
feeding search ranking.
*Limitation:* **no class dashboard, no per-student analytics, no differentiated assignment,
no auto-marking, no reporting. The teacher is a distribution channel, not a served
customer.**

**School capabilities** — whole-school exam-prep rollouts; resource libraries on school
networks/VLEs in exchange for promoting the platform (distribution-led B2B2C);
exam-calendar alignment for mocks/trials.
*Limitation:* **no cohort analytics, no MIS integration, no predicted-grade modelling, no
early-warning system, no SSO, no per-seat commercial product at all.**

**Parent capabilities** — a home-schooling weekly timetable: deadline tracking, teacher-set
work visibility, family-life scheduling, manageable chunks.
*Limitation:* **effectively no parent product** — no dashboard, digest, alerts, or
communication channel — **and therefore no parent revenue.**

**Private tutor capabilities** — **none as a first-class persona.** Tutors piggyback on
teacher features. No client roster, shared student view, session tooling, or marketplace.
**An entire revenue side is absent.**

**Platform admin capabilities (inferred)** — taxonomy management (subject × level × board),
rating/ranking, community moderation + abuse reporting, UGC quality control, account
management, content licensing, reminder/notification infrastructure, freemium gating.

### 2.2 The strategic verdict

> **Get Revising is a content warehouse with a calendar.** Its planner cannot adapt, its
> testing cannot understand, its content cannot verify itself, and **four of its six
> stakeholders generate no revenue. Every one of these deficits is an agent in the StudYear
> AI-OS registry.**

### 2.3 Where the market is moving

- **Adaptive platforms** (Seneca, Sparx) proved schools pay for measurable learning gains —
  but remain **quiz-centric**, weak on written-answer assessment and multi-stakeholder value.
- **Generic AI chatbots** capture student homework traffic but are **syllabus-blind,
  mark-scheme-blind, and unsafe as unsupervised minors' products** — creating the opening
  for a **safeguarded, exam-board-grounded agent system.**
- **UK schools** face intervention-budget pressure and **Progress 8 accountability** — a
  platform that predicts outcomes and prescribes interventions **sells to the leadership
  team, not just the classroom.**
- **Francophone Africa** (DRC Exétat/TENAFEP, BEPC and WAEC corridors) has **no adaptive
  revision incumbent**; diaspora families in the UK/EU already fund education at home — a
  corridor **BitriPay is purpose-built to monetise.**

## 3. Product vision & operating principles

StudYear AI-OS is **not a website with AI features.** It is an operating system in which
**every capability is an agent, every agent reads and writes a shared learner state, and
every persona receives a role-scoped surface over the same underlying truth.**

### 3.1 The AI-OS doctrine (NSEYA X-EXECUTE standard)

| Principle | Meaning |
|---|---|
| **One learner state** | a single, versioned, per-student model of mastery, memory, behaviour and wellbeing signals — **no agent acts on stale or private copies of the truth** |
| **Agents, not features** | planning, tutoring, marking, reporting, moderating, matching are autonomous agents **orchestrated by LangGraph**, each with declared tools, guardrails, escalation paths and **ACU cost classes** |
| **Exam-board grounding** | every pedagogical output is **retrieval-grounded in the actual specification, mark scheme and examiner commentary** for the student's board — no generic answers |
| **Safeguarding by design** | minors are the primary users; safety classifiers, human-escalation queues and audit trails are **substrate, not afterthought** — engineered to **KCSIE, UK GDPR and the ICO Age-Appropriate Design Code** |
| **Metered intelligence** | heavy inference (essay marking, deep tutoring, cohort simulation) is **metered in ACUs so margins survive success** |
| **Rail-native payments** | **BitriPay embedded** for subscriptions, marketplace escrow and **diaspora-funded accounts** across UK/EU–DRC corridors |

*(Per the [AI Gateway mandate](../architecture/14-ai-agent-blueprint.md) §0.0: all agent
inference passes through the provider-switchable Gateway in deep-thinking mode.)*

### 3.2 The six surfaces

| Surface | Primary jobs-to-be-done | Headline agents |
|---|---|---|
| **Student** | know what to study today; understand what I got wrong; get exam-grade feedback; stay motivated without burning out | Planner · Tutor · Content Forge · Examiner · Motivation |
| **Teacher** | see what my class actually knows; assign differentiated work in one click; get marking and reporting off my desk | Class Cockpit · Assignment · Reporting |
| **School / Trust** | predict outcomes early; target intervention budgets; evidence progress to governors and inspectors | Cohort Analytics · Early-Warning · Compliance |
| **Parent** | know how my child is really doing and how to help this week — in plain language | Family Digest · Escalation |
| **Private tutor** | win matched clients; walk into every session already knowing the student's gaps; assign and track between sessions | Tutor Workspace · Session Prep · Marketplace Match |
| **Platform admin** | keep content trustworthy, the community safe, and the platform compliant — at scale, **without linear headcount** | Moderation · Content Verification · Taxonomy · Fraud Ops |

---

*(Further sections follow as extracted.)*
