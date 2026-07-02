# PART 4 · AI-Agent Command Centres

Every StudYear user type receives an **AI-Agent Command Centre** — a personal control
surface fronted by their **named agent** (Sentinel · Principia · Pedagogue · Mentor ·
Concierge · Matchmaker) and powered by **seven standard sub-agents**. The named agent is
the *persona and orchestrator*; the seven sub-agents are the *shared capability spine*
tuned per role. This mirrors proven patterns from enterprise "AI teammate" suites (Microsoft
Copilot's agent stack, Salesforce Agentforce, Palantir AIP) — a consistent multi-agent
chassis, role-specialised skills, and human-in-the-loop for high-impact actions.

> Siblings: users defined in `02-user-ecosystem.md`; event fabric & Model Router in
> `04-multi-agent-ecosystem.md` and `docs/architecture/14-ai-agent-blueprint.md`; RBAC in
> `docs/architecture/10-permissions-rbac.md`; ACU economics in
> `docs/architecture/07-system-matrix.md`.

**Ground truth carried throughout:** closed loop **Assess → Plan → Learn → Improve**; five
engines (Diagnostic, AI Study Roadmap, AI Learning Tools, Progress Intelligence, **ACU
Wallet**); **prepaid ACUs, per-action cost, AI stops at zero**; schools share an ACU pool;
Stripe live, BitriPay planned; multi-provider Model Router (Anthropic/Google/OpenAI).

---

## 1. The seven standard sub-agents

Every Command Centre ships the same seven sub-agents. They read the shared kernel (mastery,
ledgers, events) as ground truth and write back as first-class domain data (`14 §0.2`).

| # | Sub-agent | Mandate | Reads | Emits |
|---|---|---|---|---|
| 1 | **Personal AI Chief of Staff** | Planning, scheduling, prioritisation, decision support, workflow orchestration, opportunity ID, risk alerts | Calendar, tasks, roadmap, events, goals | Plans, agendas, nudges, risk flags, delegated task calls |
| 2 | **AI Analyst** | Data analysis, reporting, insights, forecasting, recommendations | Mastery maps, ledgers, cohort metrics, ACU spend | Dashboards, reports, forecasts, ranked recommendations |
| 3 | **AI Research Agent** | Market / competitor / industry intelligence, opportunity discovery | External sources (via governed retrieval), catalogue, benchmarks | Briefings, comparables, opportunity lists |
| 4 | **AI Automation Agent** | Process automation, workflow execution, task delegation | Triggers, playbooks, connected systems | Executed actions, webhooks, batch jobs |
| 5 | **AI Growth Agent** | Revenue growth, acquisition, retention, profit/outcome optimisation | Funnel, engagement, churn signals, outcome deltas | Growth plays, campaigns, retention nudges |
| 6 | **AI Security Agent** | Threat/access monitoring, fraud/anomaly detection | Auth logs, transaction graphs, access patterns | Anomaly alerts, blocks (proposed), audit entries |
| 7 | **AI Knowledge Agent** | Knowledge / learning / memory management, org intelligence | Vector DB + RAG corpus, notes, past interactions | Retrieved knowledge, summaries, institutional memory |

**Autonomy tiers (used in every table below):**
- **Auto** — the agent executes without asking (low-risk, reversible, budget-bounded).
- **Recommend** — the agent proposes; a human confirms (money, grades, external comms,
  high ACU cost).
- **Blocked/Escalate** — the agent must route to a higher role or Sentinel (safety, legal,
  cross-tenant).

**ACU accounting:** each Command Centre action debits the actor's wallet (schools: shared
pool). Costs below are **relative bands** — *nil* (metadata/cached), *low* (1 unit-class,
short LLM/classify), *med* (multi-step reasoning / generation), *high* (long-context,
multimodal, or agentic multi-tool runs). Exact prices live in the ACU price book
(`07-system-matrix.md`). **At zero balance, all non-nil actions pause.**

---

## 2. Student Command Centre — **Mentor.ai**
*Mindset: "What do I study next, and why did I get that wrong?"*

**What it does:** turns the learner's mastery map into a daily plan, explains errors,
generates targeted practice, and keeps motivation and pace healthy — the private study
companion of the Assess→Plan→Learn→Improve loop.

**Data it sees:** *only this student's* mastery map, roadmap, attempts, notes, and wallet.
No peers, no admin/billing internals.

| Sub-agent (as tuned for Student) | Does | ACU |
|---|---|---|
| Chief of Staff | Builds the daily/weekly study plan, reschedules around missed sessions, flags "exam in 9 days, weak on X" | low |
| Analyst | Explains *why* an answer was wrong; shows mastery trend & predicted grade | low–med |
| Research | Finds the best worked examples / past-paper items for the current gap | low |
| Automation | Auto-generates flashcards, spaced-repetition queue, drill sets | med |
| Growth (→ *motivation*) | Streaks, next-best-goal, "you're 2 topics from a grade jump" nudges | low |
| Security | Flags account anomalies to Sentinel; enforces safe-content guardrails | nil |
| Knowledge | Personal memory: recalls past mistakes, saved notes, prior explanations (RAG) | low |

| Decision | Auto | Recommend | Blocked |
|---|---|---|---|
| Reorder today's tasks | ✔ | | |
| Generate practice from a weak topic | ✔ (within cap) | | |
| Spend above session ACU cap | | ✔ (parent approval) | |
| Change subjects / drop a course | | ✔ | |
| Contact a tutor / share data | | | ✔ (parent/consent) |

**Automations controlled:** spaced-repetition scheduling, auto-drill on new weak topics,
pre-exam intensification, low-balance warning before AI pauses.

---

## 3. Parent Command Centre — **Concierge.ai**
*Mindset: "Is my child progressing, and how do I help without micromanaging?"*

**What it does:** synthesises each child's progress into plain-language digests, manages ACU
funding and spend caps, brokers tutor bookings, and surfaces early-warning signals.

**Data it sees:** children's progress summaries, roadmap headlines, attendance (if
schooled), wallet ledgers, tutor bookings/invoices. Raw item-level answers only if
child/age policy permits; never other households.

| Sub-agent (Parent) | Does | ACU |
|---|---|---|
| Chief of Staff | Weekly family digest; "book a tutor for algebra?" prompts; approval queue | low |
| Analyst | Progress-vs-goal, spend-vs-budget, "struggling in 2 subjects" insight | low |
| Research | Matches & compares Private Tutors / resources for a specific gap | low–med |
| Automation | Auto-top-up on low balance (capped), recurring digest delivery | nil–low |
| Growth (→ *outcomes/value*) | Retention/renewal prompts, ROI of tutoring, sibling plan bundling | low |
| Security | Fraud/anomaly alerts on wallet & top-ups; spend-cap enforcement | nil |
| Knowledge | Family history: past tutors, what worked, prior reports (RAG) | low |

| Decision | Auto | Recommend | Blocked |
|---|---|---|---|
| Deliver weekly digest | ✔ | | |
| Auto-top-up within preset cap | ✔ | | |
| Book/pay a tutor | | ✔ | |
| Raise a child's spend cap | | ✔ | |
| Approve child high-cost AI action | | ✔ | |
| Access another household's data | | | ✔ |

**Automations controlled:** capped auto-top-up (Stripe; BitriPay planned), digest cadence,
spend caps, approval routing for above-threshold child actions.

---

## 4. Teacher Command Centre — **Pedagogue.ai**
*Mindset: "Who's falling behind, and what do I put in front of them tomorrow?"*

**What it does:** cuts admin, surfaces at-risk students early, differentiates material at
class scale, and drafts defensible assessments/grades — all against the **school shared ACU
pool** within teacher budgets.

**Data it sees:** assigned classes/students (mastery, attempts, attendance), cohort
analytics, own material library. Tenant- and roster-scoped only.

| Sub-agent (Teacher) | Does | ACU |
|---|---|---|
| Chief of Staff | Lesson-prep queue, grading backlog triage, "3 students need intervention" alerts | low |
| Analyst | Cohort mastery heatmaps, item-analysis, predicted-outcome flags | med |
| Research | Curriculum-aligned resources, exemplar tasks, misconception banks | low–med |
| Automation | Auto-generate differentiated worksheets/quizzes; draft grades & feedback | med–high |
| Growth (→ *outcomes*) | Cohort improvement plays, engagement-lift tactics | low |
| Security | Flags integrity issues (plagiarism/anomalous attempts) to review | low |
| Knowledge | School curriculum + this teacher's material memory (RAG) | low |

| Decision | Auto | Recommend | Blocked |
|---|---|---|---|
| Draft lesson/assessment material | ✔ (within budget) | | |
| Flag at-risk students | ✔ | | |
| Publish a grade to record | | ✔ (teacher confirms) | |
| Send message to parents | | ✔ | |
| Spend beyond per-teacher pool budget | | | ✔ (school-admin) |
| Access another teacher's class | | | ✔ |

**Automations controlled:** differentiated-material generation, grading drafts, intervention
alerts, cohort progress reports. **Grades and parent comms are always Recommend, never
Auto** (defensibility, `14` teacher notes).

---

## 5. School Command Centre — **Principia.ai**
*Mindset: "Whole-school outcomes, staff effectiveness, and AI budget under control."*

**What it does:** the institution's operations-and-outcomes brain — whole-school analytics,
ACU pool allocation, staff/enrolment health, compliance, and integrations.

**Data it sees:** everything **within the tenant** — all rosters, staff analytics, aggregate
outcomes, full ACU ledger. Nothing cross-tenant.

| Sub-agent (School) | Does | ACU |
|---|---|---|
| Chief of Staff | Term planning, staffing/roster orchestration, board-report prep | med |
| Analyst | School-wide outcome dashboards, cohort/teacher benchmarking, forecasts | med–high |
| Research | Peer-school benchmarks, curriculum/exam-board updates, funding opportunities | med |
| Automation | SIS/LMS roster sync, pool re-allocation, bulk provisioning | low–med |
| Growth (→ *enrolment/retention*) | Enrolment funnel, attrition risk, programme ROI | med |
| Security | Access governance, exam-integrity monitoring, pool-fraud detection | low |
| Knowledge | Institutional memory: policies, past cohorts, staff records (RAG) | low |

| Decision | Auto | Recommend | Blocked |
|---|---|---|---|
| Rebalance ACU pool within policy | ✔ | | |
| Provision/suspend a teacher or student | | ✔ | |
| Buy additional ACU pool / change plan | | ✔ | |
| Publish school-wide report to board | | ✔ | |
| Change safeguarding/curriculum policy | | ✔ | |
| Access another tenant | | | ✔ (Sentinel only) |

**Automations controlled:** roster sync, per-role budget caps & alerts, auto-top-up of the
pool (capped), scheduled outcome reporting, at-risk-student escalation to teachers.

---

## 6. Tutor Command Centre — **Matchmaker.ai**
*Mindset: "Fill my calendar with matched students, prep fast, keep my reputation."*

**What it does:** matches demand, prepares sessions from consented tutee data, handles
scheduling/invoicing, and grows the tutor's independent practice.

**Data it sees:** only **consented** tutees (relevant-subject mastery, session history),
own listings/bookings/payouts. Never a school roster; never non-tutees.

| Sub-agent (Tutor) | Does | ACU |
|---|---|---|
| Chief of Staff | Booking calendar, session-prep queue, follow-up reminders | low |
| Analyst | Per-tutee progress, session effectiveness, earnings analytics | low–med |
| Research | Local/subject demand signals, competitor rates, exam-syllabus changes | med |
| Automation | Auto-draft session plans/materials, invoice generation, rebooking | med |
| Growth (→ *acquisition/retention*) | Profile optimisation, lead follow-up, package upsell | med |
| Security | Anti-fraud (off-platform solicitation, review manipulation) via Sentinel | low |
| Knowledge | Per-tutee memory: prior sessions, what worked (RAG, consent-scoped) | low |

| Decision | Auto | Recommend | Blocked |
|---|---|---|---|
| Draft a session plan for a booked tutee | ✔ | | |
| Suggest matched leads | ✔ | | |
| Send booking/invoice to a parent | | ✔ | |
| Change published rates/packages | | ✔ | |
| Access a non-consented student | | | ✔ |
| Take payment off-platform | | | ✔ (policy breach) |

**Automations controlled:** availability publishing, lead follow-up, session-material
generation, Stripe invoicing (BitriPay planned), rebooking nudges.

---

## 7. Admin Command Centre — **Sentinel.ai**
*Mindset: "Keep the ecosystem healthy, compliant, solvent, and fraud-free."*

**What it does:** the platform kernel's control tower — tenant success, marketplace
integrity, trust & safety, model-cost governance, and cross-tenant compliance
(`14 §1`).

**Data it sees:** cross-tenant **operational metadata and aggregates** by default; raw
learner content only via audited, consent/legal impersonation with PII minimisation.

| Sub-agent (Admin) | Does | ACU |
|---|---|---|
| Chief of Staff | Ops queue, incident triage, tenant-success playbook orchestration | med |
| Analyst | Platform KPIs, churn prediction (60-day horizon), ACU-cost analytics | high |
| Research | Market/competitor/regulatory intelligence, provider-cost trends | med |
| Automation | Provisioning, policy rollout, Model Router routing updates, batch remediation | med |
| Growth (→ *platform revenue*) | Expansion/retention plays, pricing experiments, upsell to schools | med |
| Security | Marketplace fraud, anomaly detection, credential-sharing, safeguarding escalation | high |
| Knowledge | Cross-tenant institutional memory & policy corpus (RAG) | med |

| Decision | Auto | Recommend | Blocked |
|---|---|---|---|
| Rate-limit / sandbox a suspicious partner | ✔ | | |
| Flag churn-risk school + draft retention play | ✔ (draft) | ✔ (action) | |
| Suspend a tenant / payout hold | | ✔ (human approval) | |
| Change global pricing / routing policy | | ✔ | |
| Impersonate for support | | ✔ (audited, consent/legal) | |
| Bypass audit or residency controls | | | ✔ (never) |

**Automations controlled:** provisioning/suspension workflows, fraud interdiction, Model
Router policy pushes, ACU price/limit enforcement, compliance evidence generation.

---

## 8. Command-Centre design invariants

| Invariant | Rule |
|---|---|
| **Same spine, tuned skin** | All six Command Centres run the same seven sub-agents; only mandates, data scope, and autonomy differ per role. |
| **Data scope = role scope** | A Command Centre can never read beyond its user's `02-user-ecosystem.md` scope; enforced at shard/sub-domain (`08 §1`). |
| **Money & grades = Recommend** | Payments, grade publication, plan changes, and external comms are never Auto — always human-confirmed. |
| **ACU-metered, stops at zero** | Every non-nil action debits the wallet/pool; **AI pauses at zero**, non-AI surfaces stay live. |
| **Sentinel is the referee** | Cross-tenant, safety, legal, and partner/regulator interactions escalate to Sentinel.ai. |
| **Auditable by design** | Every recommendation and action logs full prompt/response for compliance (`09 §6`). |
| **Provider-agnostic** | Sub-agents call the Model Router, never a vendor directly; residency/redaction enforced pre-egress (`14 §0.2`). |

See `04-multi-agent-ecosystem.md` for how these Command Centres coordinate over the shared
event backbone.
