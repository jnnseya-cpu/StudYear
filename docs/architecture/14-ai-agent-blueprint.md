# 14 — PART 2: The Next-Gen AI-Agent & ML Academic OS

The overhaul that turns Studyear from a **system of record** into an **autonomous,
intelligence-driven Agent OS**: a tier of distinct, specialized AI agents — one per tenant
layer — that observe the event backbone (`08 §3`), reason, and act. Each agent maps to a
PART 1 module (`13`) and a business persona (`02`–`06`).

## 0. Foundation: the multi-provider model layer

**The OS runs on three frontier providers — Anthropic Claude, Google Gemini, and OpenAI —
behind a single abstraction.** No agent binds to a vendor; a **Model Router** selects the
right model per task, with automatic failover and cost/latency awareness.

```
   Agents (Sentinel · Principia · …)               ← reason & act on events
        │  capability request (task, context, constraints)
        ▼
   ┌──────────────── MODEL ROUTER ────────────────┐
   │  policy: capability × cost × latency × data-  │
   │  residency → pick provider/model + failover   │
   └───┬───────────────┬───────────────────┬───────┘
       ▼               ▼                    ▼
   Anthropic         Google              OpenAI
   Claude            Gemini              GPT
       └───────────────┴───────────────────┘
                 unified tool-use / structured-output contract
```

### 0.1 Routing policy (capability-first, not vendor-first)

| Workload shape | Routed to (capability) | Rationale |
|---|---|---|
| Deep reasoning, long-context agents, tool orchestration | frontier reasoning tier (e.g. Claude Opus) | reliability on multi-step agentic tasks |
| High-volume, low-latency classify/extract/summarize | fast/cheap tier (e.g. Claude Haiku / small models) | cost at scale |
| Large multimodal / very-long-context ingestion | long-context multimodal tier (e.g. Gemini) | context window & media |
| Broad ecosystem / embeddings / specific strengths | provider best-of-breed (e.g. OpenAI) | task fit |

Routing is **policy-driven config**, so the mapping evolves without touching agent code.
Independent providers also give **resilience** (failover on outage/rate-limit) and
**negotiating leverage**.

### 0.2 Cross-cutting AI platform concerns
- **Provider abstraction:** one internal interface for chat, tool-use, and structured output;
  provider-specific adapters normalize differences.
- **Data governance:** the Router enforces data-residency/GDPR (`13 §1.3`) — e.g. minor data
  never leaves an approved provider/region; PII redaction before egress.
- **Safety & evals:** every agent action passes guardrails; a golden-set eval harness gates
  model/prompt changes; high-impact actions require human-in-the-loop (see per-agent notes).
- **Observability & cost:** per-tenant token/cost accounting; full prompt/response audit
  (`09 §6`) for compliance and debugging.
- **Grounding:** agents read the shared kernel (mastery, ledgers, events) as ground truth
  and **write back as first-class domain data** — the AI tier never becomes a silo (`08 §5`).

---

## 1. Autonomous Super Admin Agent — "Sentinel.ai"

Guards platform health and marketplace integrity for the [Super Admin module](13-platform-decomposition.md#1-super-admin--platform-owner-module) (persona `02`).

### 1.1 Intelligent SaaS Churn Prediction
ML over platform usage signals — **declining teacher logins, delayed tuition collections**,
engagement decay — to flag schools **at risk of abandoning the platform up to 60 days before
contract expiration.**

*Blueprint:*
- **Features:** login frequency/trend, active-seat ratio, grading/attendance cadence, invoice
  latency, support-ticket sentiment, feature adoption — all derivable from existing events.
- **Model:** a churn classifier (gradient-boosted / survival model) producing a risk score +
  contributing factors; time-series decay features power the 60-day horizon.
- **Action loop:** risk crossing threshold → `churn.risk_flagged` → Sentinel drafts a
  retention play (outreach, success-manager task, targeted enablement) for human approval.
- **Provider:** ML models do scoring; an LLM (frontier tier) generates the human-readable
  "why at risk + recommended play" narrative.

### 1.2 Dynamic Marketplace Fraud Prevention
Anomaly detection over **tutor↔parent transactions**, flagging **review manipulation,
off-platform payment solicitation, and credential sharing.**

*Blueprint:*
- **Signals:** transaction graphs, review velocity/cluster patterns, message-content flags
  (off-platform payment cues), device/session fingerprints, escrow-bypass attempts.
- **Model:** unsupervised anomaly detection + a supervised classifier on labeled abuse; an
  LLM scans message content for solicitation/credential-sharing intent (multimodal where
  needed) under strict privacy routing (`0.2`).
- **Action loop:** anomaly → hold escrow / queue for trust-and-safety review → audited
  decision (`13 §1.2`). High-severity auto-holds; borderline cases escalate to humans.

---

## 2. Institutional Optimizer Agent — "Principia.ai"

Optimizes institutional operations for the [School Management module](13-platform-decomposition.md#2-school-management--principal-dashboard-module) (persona `02` + School).

### 2.1 Generative Timetable Synthesis
Where traditional timetable software fails on edge cases, a **Reinforcement-Learning** model
builds **optimal multi-variable timetables in minutes** — balancing **teacher preferences,
room resources, student subject selections, and substitution allocations** on unexpected
absences.

*Blueprint:*
- **Formulation:** constraint-satisfaction + optimization (RL / metaheuristics) over the
  `(teacher, class, room, time)` space from the Timetable Master Engine (`13 §2.3`).
- **Objectives:** hard constraints (no double-booking, room capacity, statutory hours) +
  soft objectives (teacher preference, minimized gaps, balanced load).
- **Live re-solve:** on `staff.absent`, Principia re-optimizes only the affected sub-graph and
  proposes substitutions in seconds — the substitution flow in `13 §2.1`.
- **Provider:** the solver is ML/optimization; an LLM explains trade-offs ("moved Yr-10 Chem
  to Room B to honor Mr. Okafor's preference; cost: one extra gap Thursday") for the principal.

### 2.2 Predictive Institutional Budgeting
**Time-series forecasting** over historic spend, utility costs, enrollment changes, and **fee
defaults** to deliver **predictive financial risk modeling** for upcoming fiscal terms.

*Blueprint:*
- **Models:** time-series forecasters (seasonality-aware) for revenue (tuition, defaults) and
  cost (utilities, staffing, inventory `13 §2.5`); scenario simulation for enrollment swings.
- **Output:** projected balance, cash-flow risk windows, and default-risk cohorts feeding the
  Institutional Financials view (`13 §2.5`).
- **Action loop:** forecast risk → Principia drafts mitigations (fee-plan offers, cost
  deferrals) for admin approval; LLM narrates the forecast and assumptions.

---

## 3. Copilot for Educators — "Pedagogue.ai"

Augments the [Teacher Interface](13-platform-decomposition.md#3-school-teacher-interface-module) (persona `03`).

### 3.1 Automated Differentiated Lesson Planning
A generative agent builds **multi-tier lesson plans from real-time classroom performance**.
If **30% of the class fails a specific algebraic concept**, it auto-structures a **remedial
sub-plan** for those students *and* an **enrichment unit** for advanced ones.

*Blueprint:* reads per-topic `Mastery` distribution (`12 §4`) for the class → clusters
students by gap → generates tiered plans grounded in the curriculum objectives, for teacher
review. Frontier-tier LLM for generation; writes plans back as first-class `Lesson`/
`Assignment` drafts.

### 3.2 Multimodal Semantic Grading Assistant
An NLP model that **reads handwritten, open-ended responses** (not just MCQ), giving
**consistent, rubric-aligned grade suggestions + personalized constructive feedback**,
leaving the teacher **final oversight/approval**.

*Blueprint:* multimodal ingestion (handwriting → text) via the long-context multimodal tier
(`0.1`); rubric-aligned scoring + feedback drafted, queued in the grading workflow (`03 §2.3`)
as **suggestions requiring human approval** before the grade posts and mastery updates.

---

## 4. Student Hyper-Personalization Agent — "Mentor.ai"

Powers the [Student Hub](13-platform-decomposition.md#4-student-hub-module) (persona `05`).

### 4.1 Cognitive Knowledge-Graph Engine
A persistent agent tracing the student's **cognitive footprint**. A roadblock in advanced
physics is **mapped back to an underlying misconception in foundational trigonometry**, and
**micro-lessons** are surfaced to patch that specific gap.

*Blueprint:* a per-student knowledge graph over the `Topic`/`LearningObjective` DAG (`12 §4`)
with prerequisite edges; error signals propagate to likely root-cause prerequisites; the
agent surfaces targeted micro-lessons/resources (`11`). This is the deepest expression of the
single-fact mastery model — the graph *is* the student's mastery, reasoned over.

### 4.2 Contextual Generative Study Formats
Instantly transform static syllabi/notes into **dynamic flashcards, mock quizzes, or
structured interactive audio** for the commute.

*Blueprint:* the `11 §2.2` sandbox generation path, now agent-driven and format-flexible
(incl. audio synthesis); outputs are topic-tagged so testable formats still write mastery
(`11 §3.2`).

### 4.3 Early Academic Risk Interventions
A classifier cross-referencing **attendance, homework completion speed, and emotional tone in
communications** to flag **burnout / academic-failure risk**, auto-generating a **proactive
support ticket for guidance counselors.**

*Blueprint:* multi-signal risk model; tone analysis under strict privacy routing (`0.2`);
threshold → `student.risk_flagged` → counselor ticket. (Introduces a **Counselor** actor —
attaches as a new surface over the existing kernel, `00 §6`.)

---

## 5. Parent Liaison Agent — "Concierge.ai"

Serves the [Parent Portal](13-platform-decomposition.md#5-parent-portal-module) (persona `06`).

### 5.1 Automated Semantic Progress Summaries
An LLM synthesizes quantitative academic data into **clear, actionable bullet points** —
e.g. *"Alex is excelling in chemistry but has missed three homework submissions in history
this week"* — instead of raw grade sheets.

*Blueprint:* reads the child's mastery/grade/attendance projections (`06 §2.2`), summarizes
per household child; grounded strictly in real records (no fabrication), narrated at a
frontier reasoning tier.

### 5.2 Multilingual Localization Pipeline
Translates **all broadcasts, report cards, and behavioral notes into the parent's preferred
native language**, removing linguistic barriers to involvement.

*Blueprint:* localization service over Communication content, driven by the parent's locale
(`13 §1.3`); routed to the provider with the best target-language quality (`0.1`), with
glossary control for academic terms.

---

## 6. Tutor Match & Optimization Agent — "Matchmaker.ai"

Optimizes the [Tutor Marketplace](13-platform-decomposition.md#6-private-tutor-marketplace--classroom-module) (persona `04`).

### 6.1 Psychometric Learning-Style Matching
A **bidirectional recommendation algorithm** pairing students with tutors on **complementary
behavioral data, learning speeds, and historical teaching-success rates** — not crude
zip-code/price filters.

*Blueprint:* learn student and tutor embeddings from interaction/outcome history; rank by
predicted fit *and* topic match (`12 §4`); bidirectional so both sides' constraints count.
Outcomes (post-tutoring mastery lift) feed back as training signal — a closing loop.

### 6.2 Automated Pedagogical Deficit Handoff
On booking, an authorized agent **summarizes the student's institutional performance gaps
(strict privacy controls)** to give the tutor a **day-one blueprint** of what to address.

*Blueprint:* on `booking.confirmed`, generate a scoped gap-summary from the student's mastery
— **only the shared context the tutor is entitled to** (`07 §5`, `10 §3`), privacy-routed
(`0.2`), audited. This is the AI expression of the closed loop's "sync workspace" step
(`07 §2b`).

---

### Agent ↔ layer summary

| Agent | Layer / persona | Quantitative core | LLM role |
|---|---|---|---|
| **Sentinel.ai** | Super Admin `02` | churn + fraud/anomaly models | risk narratives, content intent |
| **Principia.ai** | School Mgmt `02` | RL timetabling, time-series budgeting | trade-off explanation |
| **Pedagogue.ai** | Teacher `03` | performance clustering | plan generation, semantic grading |
| **Mentor.ai** | Student `05` | knowledge graph, risk classifier | study-format generation, tutoring |
| **Concierge.ai** | Parent `06` | — | summarization, translation |
| **Matchmaker.ai** | Tutor `04` | recommendation/embeddings | scoped deficit handoff |

All six ride the same event backbone and the multi-provider Model Router (`§0`); the physical
compute that hosts them is specified in [PART 3 — Implementation Blueprint](15-implementation-blueprint.md).
