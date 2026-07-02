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

## 4. Agent Registry

**Twenty-one named agents constitute the launch workforce.** Each is registered in the
LangGraph orchestrator with declared tools, guardrails, escalation paths and an **ACU cost
class**. **IDs are stable** and referenced throughout engineering tickets, billing events
and audit logs.

| ID | Agent | Persona(s) | Mandate | Class | Billing |
|---|---|---|---|---|---|
| **SY-A01** | Planner Agent | Student | builds and **continuously replans** the study timetable from mastery gaps, forgetting curves, exam dates, energy patterns and life constraints; **nightly rebalance; instant replan** on missed sessions or shock results | Orchestrator | Standard |
| **SY-A02** | Tutor Agent | Student | Socratic, syllabus-grounded tutoring; **diagnoses the misconception behind an error** via the knowledge trace; never dumps answers; **adapts explanation style to the learner profile** | Reasoning | Premium |
| **SY-A03** | Content Forge Agent | Student / Teacher | ingests typed notes, **photos of textbook pages, PDFs, slides** → flashcards, mindmaps, quizzes, cloze tests, condensed notes, **audio summaries** — auto-tagged to specification points | Generation | Standard |
| **SY-A04** | Examiner Agent | Student / Teacher | marks free-text and essay answers **against genuine mark schemes**; marks per assessment objective, model improvements, predicted-mark commentary **in the examiner's register** | Reasoning | Premium |
| **SY-A05** | Motivation Agent | Student | streaks, pacing, **burnout detection from behavioural telemetry**; wellbeing-aware nudges; **celebrates mastery gains rather than raw hours** | Lightweight | Included |
| **SY-A06** | Class Cockpit Agent | Teacher | live class **heatmap of mastery per specification point**; collective weaknesses; **one-click interventions** | Analytics | Seat |
| **SY-A07** | Assignment Agent | Teacher | **differentiated homework per student** from gap profiles; auto-marks; streams results to cockpit + learner state | Orchestrator | Seat |
| **SY-A08** | Reporting Agent | Teacher / School | drafts parent reports, predicted-grade commentary, intervention lists, **inspection-ready progress evidence** from live data | Generation | Seat |
| **SY-A09** | Cohort Analytics Agent | School / Trust | predicted-grade distributions vs targets, **Progress 8 modelling**, department benchmarking, **intervention ROI simulation** | Analytics | Enterprise |
| **SY-A10** | Early-Warning Agent | School / Trust | flags at-risk students **weeks before mocks** from disengagement, mastery decay, behavioural drift; **routes to pastoral workflows** | Analytics | Enterprise |
| **SY-A11** | Family Digest Agent | Parent | weekly plain-language digest: what was studied, mastery movement, predicted grades, **one concrete way to help this week**; **multilingual (English/French first)** | Generation | Parent tier |
| **SY-A12** | Escalation Agent | Parent / School | alerts on disengagement, wellbeing flags, sustained decline — **consent-governed routing between home and school** | Lightweight | Parent tier |
| **SY-A13** | Tutor Workspace Agent | Private tutor | client roster, **consent-governed shared mastery view** of each tutee, between-session assignments, progress tracking | Orchestrator | Tutor tier |
| **SY-A14** | Session Prep Agent | Private tutor | lesson plan per session from the tutee's **live gap profile**, prior session notes, upcoming exam weightings | Generation | Tutor tier |
| **SY-A15** | Marketplace Match Agent | Private tutor / Parent | matches on **subject × board × gap profile × availability × budget**; manages **BitriPay escrow and payout** | Orchestrator | Take-rate |
| **SY-A16** | Moderation Agent | Admin | **proactive detection + report triage**: bullying, grooming, self-harm signals; human-escalation queue, full audit trail | Safety | Platform |
| **SY-A17** | Content Verification Agent | Admin | scores every community resource for **factual accuracy and specification alignment before it can rank**; quarantines unverified material | Reasoning | Platform |
| **SY-A18** | Taxonomy Agent | Admin | auto-tags legacy + new content to **board × subject × topic × specification point**; maintains the ontology as boards revise | Lightweight | Platform |
| **SY-A19** | Integrity Agent | Admin / Teacher | detects **AI-misuse and plagiarism** with **calibrated, evidence-based reports rather than accusatory scores** | Analytics | Platform |
| **SY-A20** | Fraud & Billing Ops Agent | Admin | payment anomaly detection, chargeback defence, **ACU abuse throttling**, marketplace payout compliance | Analytics | Platform |
| **SY-A21** | Profile Agent | **All personas (substrate)** | maintains each student's **Learner Profile Vector** from behavioural telemetry (pace, format effectiveness, error taxonomy, cognitive load tolerance, engagement chronotype, confidence calibration, language profile); **serves the profile to every other agent**; drives the within-session / across-session / cohort adaptation loops | Analytics | Platform |

> Union note (per the [mandate](../REQUIREMENTS-MANDATE.md)): **SY-A01–A21 is the canonical
> launch registry.** The earlier rosters — 14-agent (`studyear-product-spec.md §5c`),
> 25 enhanced (`../ai-os/04 §3A`), 18-build-list (Get Revising audit §5) — map into these
> IDs as capabilities and sub-behaviours; anything not covered by an SY-ID remains in the
> build queue as a post-launch specialisation. All agents run through the
> [AI Gateway](../architecture/14-ai-agent-blueprint.md) (§0.0) in deep-thinking mode.

## 5. Machine Learning Substrate

**Five ML systems form the substrate every agent stands on.** They are the defensible moat:
each **compounds with usage data the incumbent generation never collected.**

### 5.1 Knowledge Tracing Engine (KTE)

A **transformer-based deep knowledge tracing model (SAINT-class)** maintains, per student, a
**mastery probability over every specification point of every supported exam board.** Every
interaction — flashcard response, quiz item, marked essay, tutor exchange, assignment
result — updates the vector. The KTE exposes **mastery, uncertainty and learning-velocity**
estimates to all agents — the ground truth behind heatmaps, planning and prediction.

- **Cold start:** priors from year group, course, school baseline data + an adaptive
  placement diagnostic; **converges within the first two study weeks.**
- **Granularity:** specification-point level (**thousands of nodes per subject**), rolled up
  to topic and paper level for human-facing views.

### 5.2 Memory & Scheduling Model (FSRS-class)

A **per-item, per-student forgetting-curve model** predicts retention decay and computes the
optimal review moment. The Planner Agent consumes its outputs so **the timetable stops being
a calendar and becomes a retention strategy**: *"review electrolysis today because you are
48 hours from forgetting it"* rather than *"Chemistry, Tuesday, 4pm."*

### 5.3 Grade Prediction Model (GPM)

A **gradient-boosted + transformer ensemble** maps mastery vectors, behavioural signals,
mock results and **historical grade-boundary distributions** to a live predicted grade per
subject with confidence intervals — plus **counterfactuals** (*"two focused hours per week
on Paper 2 organic chemistry moves the central estimate from 6 to 7"*). One underlying
inference powers student motivation, parent digests, teacher reports and school-level
Progress 8 modelling.

### 5.4 Retrieval-Grounded Knowledge Layer (RAG)

Every supported specification, mark scheme, examiner report and past paper is **chunked,
embedded and indexed with board/version metadata.** All pedagogical agents — Tutor,
Examiner, Content Forge, Session Prep — are **contractually grounded: they must cite
retrieved assessment material internally before emitting output**, eliminating syllabus
drift and generic-chatbot error modes. The corpus design **anticipates francophone
extension** (DRC Exétat programmes, BEPC/WAEC syllabi) with the same pipeline.

### 5.5 Safety & Integrity Models

- **Safeguarding classifiers** over community/messaging surfaces tuned for **minors' risk
  signals** (bullying, grooming, self-harm) — conservative thresholds, human review queues,
  **statutory-reporting workflows.**
- **Content-quality models** scoring UGC for factual accuracy and specification alignment
  (feeding **SY-A17**).
- **Integrity models** producing **calibrated, evidence-first** analyses of suspected
  AI-misuse (feeding **SY-A19**) — designed to **inform teacher judgement, never to
  auto-accuse.**

### 5.6 Personalisation Engine — one classroom, a thousand curricula

**The founding premise of StudYear AI-OS:** students in the same school sit through the
same lessons and the same lectures, yet **differ profoundly in how and how fast they
understand.** The classroom cannot personalise the lesson; **the operating system
personalises everything around the lesson. The teacher teaches once — the OS consolidates a
thousand different ways.**

**The Learner Profile Vector (LPV)** — alongside the mastery vector, every student carries a
continuously-updated profile of *how they learn*, **inferred entirely from behaviour — never
from questionnaires:**

| Dimension | Detail |
|---|---|
| **Pace profile** | learning velocity per subject and topic type; exposures a concept typically needs before mastery stabilises; **optimal session length before accuracy decays** |
| **Format effectiveness** | **measured retention lift per content format** (worked examples, flashcards, mindmaps, audio summaries, practice questions, Socratic dialogue) — per student, per topic type; serves **what demonstrably works for this child**, treated as an empirical per-topic measurement to stay aligned with the education-research evidence base |
| **Error taxonomy** | characteristic failure modes — misread questions, procedural slips, conceptual gaps, recall failures, exam-technique losses — **each triggering a different remediation strategy** |
| **Cognitive load tolerance** | how much new material per session before performance drops; **governs chunk size and scaffold density** |
| **Engagement chronotype** | when this student actually learns well (day, time, rhythm) — **from telemetry rather than intention** |
| **Confidence calibration** | gap between self-rated and actual performance — **over-confident → more retrieval testing; under-confident → visible mastery evidence** |
| **Language profile** | EAL and bilingual signals (**English/French first**) — adjusts explanation register **without diluting content** |

**Behavioural telemetry.** The LPV trains on the behavioural exhaust of every interaction:
response latency and hesitation patterns, retry and self-correction behaviour, hint-seeking
depth, abandonment points, session timing and rhythm, format dwell time, and the retention
outcomes that follow. Every signal flows through **`learning.events.v1`** into the profile
trainer; **no additional student effort is ever required to be profiled.**

**Three adaptation loops:**

| Loop | Timescale | Behaviour |
|---|---|---|
| **Within-session** | seconds | difficulty, scaffolding, format adjust in real time — a hesitating student gets a worked example; a cruising student gets a harder variant; a fatiguing student gets a format switch or a break |
| **Across-session** | days | the Planner re-sequences topics, resizes chunks, re-times reviews from the LPV + memory model — **two classmates with identical timetables receive entirely different study plans** |
| **Across-cohort** | weeks | the Class Cockpit shows teachers **not just what the class doesn't know but how differently they learn** — differentiated teaching and grouped interventions from the same single lesson |

**Raising the floor and the ceiling together.** This is how *"improve everyone very
quickly"* becomes an engineering property rather than a slogan: slower-to-start students get
**catch-up compression** (smaller chunks, more retrieval, earlier reviews, targeted
misconception repair) while fast movers get **stretch material and exam-technique
refinement** instead of repetition. **The cohort's mean rises because no student is being
served the average student's experience.**

### The data flywheel

Every marked answer improves the Examiner's calibration; every review improves the memory
model; every cohort improves grade prediction. **The moat is not the models — it is the
exam-board-labelled interaction corpus no competitor is collecting at this granularity.**

## 6. System Architecture

The platform is a **monorepo on the NSEYA X-EXECUTE reference stack**: **Next.js 14** client
surfaces, a **NestJS** service mesh, **PostgreSQL** as the system of record, **Apache
Kafka** as the event backbone, and **LangGraph** as the agent orchestration runtime.

### 6.1 Layered view

| Layer | Technology | Responsibility |
|---|---|---|
| **Experience** | Next.js 14 (App Router, RSC, Edge) | six role-scoped web surfaces + PWA mobile; server components for dashboards; **streaming UI for agent responses**; print/PDF pipeline for timetables and reports |
| **API Gateway** | NestJS gateway + **BFF per surface** | AuthN/Z enforcement, rate limiting, **ACU pre-authorisation checks**, request shaping per persona |
| **Domain services** | NestJS microservices | Identity & Consent · Learner State · Planning · Content · Assessment · Community · Marketplace · Billing · Notifications · Reporting |
| **Agent runtime** | LangGraph on dedicated workers | stateful graphs per agent; tool registry; **guardrail nodes; human-in-the-loop escalation nodes**; checkpointed long-running flows (overnight replans, cohort simulations) |
| **Event backbone** | Apache Kafka | every learning event, agent action, billing tick, safety signal is a **topic-published fact**; consumers: KTE trainer, ACU meter, analytics warehouse, audit store |
| **Data** | PostgreSQL (+ **pgvector**), object storage, warehouse | OLTP system of record; RAG embeddings in pgvector; media in object storage; Kafka-fed warehouse for analytics + training sets |
| **ML serving** | GPU inference pool + model registry | versioned serving of KTE/FSRS/GPM/safety/integrity models; **canary rollout; drift monitoring** |

### 6.2 Kafka topic map (core)

| Topic | Producers | Key consumers |
|---|---|---|
| `learning.events.v1` | all surfaces, Assignment Agent, Examiner Agent | KTE updater, FSRS updater, analytics warehouse |
| `mastery.updates.v1` | KTE service | Planner, Cockpit, Digest, Early-Warning agents |
| `agent.actions.v1` | LangGraph runtime | audit store, **ACU meter**, ops dashboards |
| `billing.acu.v1` | ACU meter | billing service, **BitriPay charge orchestrator**, abuse throttling |
| `safety.signals.v1` | safeguarding classifiers, Moderation Agent | human review queue, Escalation Agent, compliance archive |
| `marketplace.lifecycle.v1` | Marketplace Match Agent, BitriPay webhooks | escrow service, payout ledger, fraud ops |
| `consent.changes.v1` | Identity & Consent service | **every data-reading agent (hard gate)**, audit store |

### 6.3 LangGraph orchestration pattern

Each registry agent is a **versioned LangGraph graph**. Standard shape:

```
intake → consent & RBAC gate → context assembly (learner state + RAG retrieval)
      → reasoning/tool loop → guardrail evaluation → emit + event publication
```

- Safety-relevant agents add a **mandatory human-escalation node.**
- Long-horizon flows (nightly replanning, cohort simulation, marketplace matching) run as
  **checkpointed graphs resumable across worker restarts.**
- **Cross-agent calls occur only through the orchestrator — never peer-to-peer** —
  preserving a single audit and billing chokepoint.

### 6.4 Monorepo layout

| Path | Contents |
|---|---|
| `apps/web` | Next.js 14 — all six surfaces behind role-scoped route groups |
| `apps/gateway` | NestJS API gateway and per-surface BFFs |
| `services/*` | domain microservices (learner-state, planning, assessment, marketplace, billing, …) |
| `agents/*` | LangGraph graphs, **one package per registry ID** (`sy-a01` … `sy-a20`) |
| `ml/*` | training pipelines, evaluation harnesses, model registry manifests |
| `packages/*` | shared contracts: event schemas, RBAC policies, **ACU tariffs**, design system |
| `infra/*` | IaC, Kafka topology, CI/CD, observability |

> **Stack reconciliation** (per the [mandate](../REQUIREMENTS-MANDATE.md)): this NSEYA
> X-EXECUTE reference stack (PostgreSQL/Kafka/NestJS/LangGraph) is the **flagship venture's
> canonical build stack**. Earlier blueprints (MariaDB/Hostinger + Redis/FastAPI in
> `../architecture/13`/`15`; Firebase as disclosed as-is in
> `studyear-product-spec.md §3b`) remain recorded as, respectively, prior target sketches
> and the migration starting point — union preserved, none removed.

## 7. Core Data Model (highlights)

| Aggregate | Key entities | Notes |
|---|---|---|
| **Identity & Consent** | User, Role, Guardianship, ConsentGrant, SchoolLink | Guardianship binds parents to minors; **ConsentGrant is the hard gate on every cross-persona data view** (tutor↔student, parent↔school) |
| **Curriculum** | Board, Qualification, Specification, SpecPoint, Paper, MarkScheme | versioned per exam-board series; **SpecPoint is the atomic unit** the KTE and taxonomy operate on |
| **Learner State** | MasteryVector, MemoryItem, BehaviourSignal, WellbeingFlag, PredictedGrade | **append-only event sourcing via Kafka; point-in-time reconstruction** for audits and model training |
| **Planning** | Plan, StudySlot, Commitment, ReplanEvent | **every replan stores its trigger and rationale — explainability is a product feature** for parents and teachers |
| **Content** | Resource, ResourceVersion, VerificationScore, TagSet | UGC and AI-generated content share one pipeline; **nothing ranks without a VerificationScore** |
| **Assessment** | Attempt, FreeTextSubmission, MarkedResult, AOBreakdown, IntegrityReport | **MarkedResult stores the mark-scheme citation trail for every awarded mark** |
| **Marketplace** | TutorProfile, Engagement, SessionRecord, EscrowLedger, Payout | **double-entry escrow ledger reconciled against BitriPay settlement events** |
| **Billing** | AcuMeterEvent, AcuBalance, Subscription, Invoice | metering is **event-sourced from `agent.actions`; balances are derived, never authored** |

## 8. ACU Billing Model

The **AI Compute Unit (ACU) is the NSEYA X-EXECUTE metering standard**: one normalised unit
of AI work, **priced consistently across the portfolio**, so heavy inference **scales
revenue instead of destroying margin.**

### 8.1 Metering principles

- **Everything metered, not everything charged** — every agent action emits an ACU cost to
  `billing.acu.v1`; subscription tiers include **generous allowances so the meter is
  invisible to most users**; only sustained heavy usage draws down paid packs.
- **Pre-authorisation** — the gateway checks ACU balance/allowance **before dispatching
  Premium-class agent work**; degraded (lighter-model) fallbacks keep free users served.
- **Transparency** — students and schools see plain-language usage (*"12 essays marked this
  week"*), **never raw token counts.**

### 8.2 ACU tariff by agent class

| Agent class | Examples | Indicative ACU/action |
|---|---|---|
| **Lightweight** | motivation nudges, taxonomy tagging, escalation alerts | 0.1 – 0.5 |
| **Standard** | Planner replan, Content Forge generation set | 1 – 3 |
| **Analytics** | Cockpit refresh, early-warning sweep, integrity report | 2 – 6 |
| **Reasoning (Premium)** | Tutor dialogue turn, content verification pass | 3 – 8 |
| **Examiner (Premium)** | full essay marked with AO breakdown | 8 – 15 |
| **Enterprise simulation** | cohort Progress 8 scenario, trust-wide forecast | 25 – 60 |

### 8.3 Allowances and packs

| Tier | Monthly ACU allowance | Top-up mechanism |
|---|---|---|
| **Student Free** | 60 ACUs (degraded models on premium classes) | none — upgrade path |
| **Student Premium** | 600 ACUs | ACU packs via **BitriPay (student or diaspora-funded)** |
| **Parent Insight** | included in child's premium + digest allowance | — |
| **Teacher Seat** | 800 ACUs pooled per seat | school pool top-ups |
| **School / Trust** | pooled per-seat allowance + **enterprise simulation quota** | annual ACU commitments, volume pricing |
| **Tutor Pro** | 1,000 ACUs | packs; **session-prep ACUs billable to engagement** |

### Unit-economics guardrail — the 66% minimum-margin mandate

> **To protect the business margin, a strong 66% minimum margin is MANDATORY across the
> project — the only exemption is a defined free account.**

Operationalised:

- **Margin floor:** every paid product — ACU packs, subscriptions, seats, marketplace
  take-rate, enterprise commitments — must clear **≥ 66% gross margin**. Equivalently, the
  **fully-loaded cost of one ACU never exceeds 34% of its blended realised price**
  (tightened from the earlier 35% cap; per the
  [mandate](../REQUIREMENTS-MANDATE.md), the stricter rule governs).
- **Free-account exemption:** only **defined free accounts** (e.g. Student Free — 60 ACUs
  on degraded models, §8.3) sit outside the margin floor; they are the sanctioned
  acquisition cost, budgeted deliberately, never an accidental margin leak.
- **Enforcement:** tariff changes that would breach the floor are blocked at the pricing
  console (`../ai-os/14` dual-control); the **Fraud & Billing Ops Agent (SY-A20)**
  throttles anomalous consumption patterns **before they become margin events**; the
  Revenue Agent (`../ai-os/04 §3A.2`) monitors blended margin per feature and flags any
  tool whose ACU cost drifts toward the floor.
- **Deep-thinking compatibility:** the AI Gateway's task-scaled thinking budgets
  (`../architecture/14 §0.0`) are the cost lever that keeps universal deep reasoning
  inside the 34% cost cap — budget per action class is tuned so quality stays maximal
  *and* the margin floor holds.

## 9. BitriPay Integration

**BitriPay is the portfolio payment rail.** For StudYear it is **not a checkout widget** —
it is the enabler of two strategic motions: **diaspora-funded education** and **marketplace
escrow.**

### 9.1 Payment surfaces

- **Subscriptions and ACU packs:** card, wallet and **mobile-money** instruments across
  UK/EU and DRC; **smart retries and grace-period logic tuned for family budgets.**
- **Diaspora funding:** a UK/EU relative funds a student account in Kinshasa **in one
  flow** — FX handled on-rail, receipts in **French and English**, **guardianship consent
  enforced before account linkage.**
- **Tutor marketplace escrow:** engagement funds held **on-ledger**, released on session
  confirmation, disputed through a structured flow; **payouts to UK bank or DRC mobile
  money** with KYC/AML on the BitriPay side.
- **School invoicing:** annual per-seat licences and ACU commitments with
  **purchase-order workflows**; DRC private-school segment paid via **BitriPay business
  rails.**

### 9.2 Event contract

BitriPay webhooks (settlement, refund, dispute, payout) publish into
`marketplace.lifecycle.v1` and billing streams; the **escrow ledger and ACU balances
reconcile nightly against rail settlement**, with discrepancies routed to **SY-A20**.
**No service ever mutates a balance outside this event path.**

## 10. Security, Safeguarding & Compliance

**The primary users are minors.** Security posture is therefore **Zero Trust in
architecture and safeguarding-first in product** — engineered as **substrate under every
agent.**

### 10.1 Zero Trust & RBAC fabric (X-EXECUTE standard)

- **Identity-centred perimeter:** every request — **human or agent** — carries a verified
  identity; service-to-service traffic under **mTLS**; agents hold **scoped, short-lived
  credentials issued per graph execution.**
- **RBAC with consent overlay:** role policies (student, teacher, school admin, parent,
  tutor, platform admin) **intersected with explicit ConsentGrants** — a tutor sees a
  tutee's mastery **only while an active, revocable grant exists.**
- **Least-privilege tool registry:** each LangGraph agent may invoke **only its declared
  tools**; violations **halt the graph and alert ops.**
- **Full audit chain:** `agent.actions.v1` provides an **immutable record of every agent
  decision touching a child's data** — inspectable per student, per agent, per day.

### 10.2 Safeguarding regime

- **Proactive classification** across community/messaging surfaces with conservative
  thresholds; human review queues staffed to **statutory-response SLAs**; documented
  escalation to **designated safeguarding leads at partner schools.**
- **Age-appropriate design:** default-private profiles for minors, **no stranger DMs, no
  engagement-bait mechanics**; wellbeing pacing built into the Motivation Agent.
- **Tutor marketplace vetting:** identity verification and **UK DBS-check evidence (or DRC
  equivalent) before any tutor may transact**; sessions logged; **in-platform communication
  only.**

### 10.3 Regulatory alignment

| Regime | Application |
|---|---|
| **UK GDPR / DPA 2018** | lawful bases mapped per data flow; DPIA maintained; school Data Processing Agreements standard; **data minimisation in model training sets** |
| **ICO Age-Appropriate Design Code** | conformance assessment across **all fifteen standards**; high-privacy defaults for under-18s |
| **KCSIE** | safeguarding workflows and school-facing reporting designed to **slot into KCSIE-governed school processes** |
| **DRC data & consumer regimes** | localisation and consent handling for the Kinshasa deployment via the **X-EXECUTE compliance layer shared with BitriPay's EME licence footprint** |
| **AI transparency** | **every agent output labelled as AI-generated**; Examiner marks carry **mark-scheme citation trails**; parents/schools can request **human review of any consequential automated assessment** |

## 11. Monetisation & Pricing Architecture

**Five revenue engines on one substrate.** Indicative launch pricing below; final pricing is
set by the GTM playbook's willingness-to-pay research. *(All paid engines govern to the
[66% minimum-margin mandate](#unit-economics-guardrail--the-66-minimum-margin-mandate),
§8.)*

| Engine | Offer | Indicative price | Notes |
|---|---|---|---|
| **Student Premium** | Examiner Agent, unlimited Tutor Agent, full Content Forge, advanced planner | **£7.99/mo or £59/yr** | free tier retains planner, library, basic testing — **the acquisition engine** |
| **Parent Insight** | Family Digest, predicted grades, escalation alerts, multi-child | **£4.99/mo add-on** | **diaspora-funded variant priced for DRC corridor via BitriPay** |
| **School Seat** | Cockpit, Assignment, Reporting agents; SSO + MIS integration | **£6–9 /student/yr** | trust-level volume bands; enterprise ACU commitments on top |
| **Tutor Pro + Marketplace** | Workspace, Session Prep, matched leads | **£19/mo + 12% take-rate** | escrowed via BitriPay; take-rate on completed engagements |
| **ACU Packs** | metered top-ups for heavy AI usage | **from £4.99 / 100 ACUs** | applies across all tiers; enterprise annual commitments discounted |

### Sequencing logic

> **Free students create the classroom pull that lands school seats; school data credibility
> powers the parent upsell; parent demand seeds the tutor marketplace. Each engine lowers
> the CAC of the next.**

## 12. Go-To-Market Strategy

### 12.1 Phase one — UK beachhead

- **Wedge:** the **Examiner Agent** as the publicly demonstrable capability no incumbent
  offers — **free essay-marking campaigns timed to mock seasons** (November–December,
  February–March).
- **Distribution:** replicate and beat the incumbent teacher-channel model — free teacher
  tooling in exchange for classroom adoption, **but with a real teacher product (Cockpit)
  rather than photocopiable packs.**
- **Birmingham & Black Country anchor:** leverage existing community-education
  relationships for the first whole-school pilots and youth-programme alignment with the
  **UK Youth Guarantee** policy agenda.
- **Proof assets:** **mock-to-final grade-delta case studies** per pilot school;
  inspection-ready progress evidence packs for headteachers.

### 12.2 Phase two — Trust and parent expansion

- **Multi-academy-trust sales motion** with Cohort Analytics and Early-Warning as the
  executive wedge; per-seat commitments with enterprise ACU quotas.
- **Parent Insight launch** into the installed student base; **referral loops from Family
  Digest sharing.**
- **Tutor marketplace opens** in subjects with proven demand density (maths, sciences,
  English).

### 12.3 Phase three — Francophone corridor

- **Kinshasa launch aligned to Exétat preparation cycles**; French-first surfaces;
  curriculum corpus for DRC state programmes ingested **through the same RAG pipeline.**
- **Diaspora-funded accounts as the primary monetisation:** UK/EU relatives fund premium
  access via BitriPay; **pricing localised to corridor purchasing power.**
- **Private-school and church-network partnerships** for institutional distribution;
  **TradeNerve and Scan & Go field infrastructure reused** for on-the-ground presence.

## 13. Delivery Roadmap

Sequential delivery scopes (phase durations to be confirmed in the engineering plan):

| # | Scope |
|---|---|
| **1 — Foundation** | monorepo scaffold; identity/consent; learner-state service; Kafka backbone; **curriculum corpus for three boards**; **KTE v1**; Planner + Content Forge + basic testing |
| **2 — Premium wedge** | **Examiner Agent GA for two subjects**; Tutor Agent beta; **ACU metering + BitriPay subscriptions**; Student Premium launch |
| **3 — School motion** | Cockpit, Assignment, Reporting agents; **SSO + MIS integration**; safeguarding regime full-scope; **first whole-school pilots** |
| **4 — Multi-persona** | Parent Insight; Early-Warning; Integrity Agent; **marketplace alpha with vetted tutors** |
| **5 — Corridor** | **French surfaces; DRC curriculum corpus; diaspora funding flows; Kinshasa pilot schools** |

*(Aligns with GTM phases (§12): scopes 1–2 power the UK beachhead, 3–4 the trust/parent
expansion, 5 the francophone corridor. Union with the earlier five-phase roadmaps —
`deep-platform-extraction-report.md` B7 and `../ai-os/15` — per the
[mandate](../REQUIREMENTS-MANDATE.md).)*

## 14. KPI Framework

| Domain | North-star & guardrail metrics |
|---|---|
| **Learning efficacy** | **mastery gain per study hour** · predicted-vs-actual grade calibration error · retention half-life improvement |
| **Engagement** | weekly active learners · plan adherence rate · sessions ended by completion vs abandonment |
| **Commercial** | free→premium conversion · parent attach rate · school seat renewals · marketplace GMV and take-rate revenue · **ACU gross margin** (governed by the 66% mandate, §8) |
| **Trust & safety** | safeguarding response SLA adherence · verified-content share of top search results · integrity false-positive rate |
| **Platform** | agent action success rate · p95 agent latency · **ACU cost-to-price ratio** · incident-free days |

## 15. Risk Register (top-line)

| Risk | Severity | Mitigation |
|---|---|---|
| **Examiner marking errors damage trust** | High | calibration harness against moderated human marking; **confidence-gated output**; human-review request path; **subject-by-subject GA gates** |
| **Safeguarding incident in community/marketplace** | **Critical** | proactive classification, human queues, vetting, in-platform-only comms, **statutory workflow drills, insurance** |
| **Inference costs outpace revenue** | High | ACU pre-authorisation, class-tiered models, degraded fallbacks, cost-to-price guardrail *(35% at drafting — **tightened to 34% by the 66% margin mandate**, §8)*, SY-A20 throttling |
| **Exam-board content licensing friction** | Medium | licensing negotiations for mark-scheme corpus; **fallback to board-aligned original materials authored in-house**; legal review per board |
| **Incumbent fast-follows with AI features** | Medium | **moat is the labelled interaction corpus + multi-persona architecture**; speed through shared X-EXECUTE runtime |
| **DRC deployment complexity** | Medium | sequenced after UK proof; **BitriPay licence footprint and existing portfolio field operations reused**; local partnerships |

## 16. Appendix A — Incumbent Capability → StudYear Upgrade Matrix

| Incumbent capability (Get Revising archetype) | StudYear AI-OS replacement |
|---|---|
| static one-shot revision timetable with manual subject weighting | **SY-A01 Planner**: mastery- and memory-driven plan, **replanned nightly and on-event, with explainable rationale** |
| cloze-deletion keyword self-tests with peer time benchmarks | **adaptive assessment spanning items to full essays**, marked by **SY-A04** with AO-level breakdowns |
| 400k+ unverified community resources ranked by ratings | **verification-scored content (SY-A17); nothing ranks unverified**; AI + UGC in one quality pipeline |
| manual creation of flashcards, mindmaps, quizzes; template cross-generation | **SY-A03 Content Forge**: photo/PDF/notes ingestion → full multi-format study set, **spec-point tagged** |
| forum Q&A with email notifications and vote-ranking | **SY-A02 Tutor Agent** instant, syllabus-grounded help; **community retained** with proactive moderation (**SY-A16**) |
| teacher role = distribution channel with photocopiable packs | **teacher as served customer**: Cockpit, Assignment, Reporting agents on live class mastery data |
| school role = VLE resource dumps, no analytics | Cohort Analytics, Early-Warning, **Progress 8 modelling, MIS/SSO integration, per-seat commercial product** |
| parent role = a home-schooling timetable page | **Family Digest and Escalation agents; parent subscription; diaspora-funded accounts** |
| private tutor role = non-existent | **Tutor Workspace, Session Prep, vetted Marketplace with BitriPay escrow and take-rate economics** |
| admin = reactive moderation and manual taxonomy | **agentic operations**: proactive safety, auto-verification, auto-taxonomy, integrity and fraud ops |

---

*(Further sections follow as extracted.)*
