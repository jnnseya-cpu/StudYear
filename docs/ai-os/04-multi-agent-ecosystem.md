# PART 4 · The Multi-Agent Ecosystem — Enterprise AI Workforce

> **Scope.** This document defines StudYear's *enterprise* agent workforce and the **Core AI
> Agents** catalogue that runs the business. These **complement** the six named tenant-layer
> domain agents — **Sentinel.ai** (platform), **Principia.ai** (school), **Pedagogue.ai**
> (teacher), **Mentor.ai** (student), **Concierge.ai** (parent), **Matchmaker.ai** (tutor) —
> defined in `docs/architecture/14-ai-agent-blueprint.md`. Domain agents own a *tenant persona*;
> enterprise agents own a *business function* that spans all tenants.
>
> **Ground truth.** Every agent runs on the multi-provider **Model Router** (Anthropic Claude /
> Google Gemini / OpenAI — capability routing + failover + data residency). Every autonomous
> action is metered against the **ACU Wallet** (prepaid AI Credit Units, per-action cost, hard
> stop at zero, school shared pools) and written to the immutable audit log
> (`docs/ai-os/06-security-compliance.md`). Self-managing/ops agents live in
> `docs/ai-os/05-self-managing-platform.md`; runtime topology in
> `docs/ai-os/10-production-architecture.md` and `docs/architecture/14-ai-agent-blueprint.md`.

The design borrows only **proven** patterns: OpenAI/Anthropic **supervisor–worker** and
**tool-use** contracts, Anthropic's **orchestrator–worker** and evaluator–optimizer loops,
Palantir **ontology-grounded** agents (act on typed business objects, not free text),
ServiceNow agentic **workflow** orchestration, Stripe **Radar** risk scoring, and
CrowdStrike/Cloudflare autonomous SOC triage.

---

## 1. Workforce topology

```
                      ┌───────────────────────────────────────────┐
                      │   CHIEF OF STAFF (Supervisor / Router)     │
                      │   goal decomposition · agent selection ·   │
                      │   budget (ACU) · HITL gates · audit        │
                      └───────┬───────────────────────────┬────────┘
        ┌─────────────────────┤                           ├───────────────────────┐
        ▼                     ▼                           ▼                       ▼
  ┌───────────┐        ┌───────────┐               ┌───────────┐           ┌───────────┐
  │ EXECUTIVE │        │  PRODUCT  │               │ENGINEERING│           │  QUALITY  │
  │ CEO/COO/  │        │ Architect │               │ FE/BE/API │           │ QA/Test/  │
  │ CFO/CTO/  │        │ UX/Journey│               │ Infra/DB  │           │ Perf      │
  │ CMO/CRO   │        │ Feature   │               │           │           │           │
  └───────────┘        └───────────┘               └───────────┘           └───────────┘
        ▼                     ▼                           ▼                       ▼
  ┌───────────┐        ┌───────────┐               ┌───────────┐           ┌───────────┐
  │CYBERSEC   │        │  REVENUE  │               │ CUSTOMER  │           │COMPLIANCE │
  │Threat/SOC │        │Sales/Price│               │Support/   │           │GDPR/AML/  │
  │Fraud/Vuln │        │Monetise   │               │Success/   │           │KYC/Reg    │
  │Identity   │        │           │               │Retention  │           │           │
  └───────────┘        └───────────┘               └───────────┘           └───────────┘
                      Shared memory (vector DB + RAG) · Event backbone (Redis) ·
                      Ontology (typed business objects) · Model Router · ACU ledger
```

Two planes:

- **Enterprise workforce (this doc §2)** — categorized "C-suite + department" agents that
  *govern, plan and review*. They set policy, budgets, and priorities; they rarely touch
  production directly.
- **Core AI Agents (§3)** — the *operational* agents that execute recurring business
  workflows end-to-end. These are the workhorses with concrete triggers, tools and SLAs.

---

## 2. Enterprise agent categories

Each member is a **role-scoped agent**: a system prompt persona + a bounded toolset + a data
scope + an autonomy tier (`A0`–`A3`, see §4.4). Executive agents operate at `A1` (recommend,
human approves); most department agents at `A2` (act within guardrails); none at `A3` without
a signed policy.

### 2.1 Executive (strategy & cross-functional trade-offs)

| Agent | Purpose | Primary signals | Typical outputs |
|---|---|---|---|
| **CEO Agent** | Synthesize company state into strategy; arbitrate cross-department conflicts | KPI tree (NRR, CAC, ACU margin, mastery gains), OKR progress | Weekly strategy brief, OKR re-prioritization, escalation resolutions |
| **COO Agent** | Operational cadence, SLA health, resource allocation across departments | Ops dashboards, incident MTTR, queue depths | Capacity plans, runbook approvals, cross-team unblock actions |
| **CFO Agent** | Unit economics, ACU cost accounting, cash & burn, pricing guardrails | Stripe revenue, ACU cost/margin per action, forecast | Budget envelopes per agent, margin alerts, pricing sign-off |
| **CTO Agent** | Architecture direction, model-provider strategy, tech-debt & reliability posture | SLOs, error budgets, provider cost/latency, incident trends | ADRs, Model Router policy changes, build-vs-buy calls |
| **CMO Agent** | Growth strategy, positioning, channel mix, brand safety | CAC/LTV by channel, funnel, campaign ROAS | Campaign portfolio, messaging guardrails, GTM plans |
| **CRO Agent** | Revenue architecture across Sales/Pricing/Retention; forecast accuracy | Pipeline, win-rate, churn, expansion, ACU consumption | Revenue forecast, comp/incentive logic, quota + segment strategy |

**Pattern:** the Executive tier is an Anthropic-style **evaluator/optimizer** council — it
critiques plans produced by lower tiers and sets the objective function; it does not ship code
or move money without HITL.

### 2.2 Product

| Agent | Purpose | Inputs | Outputs |
|---|---|---|---|
| **Product Architect Agent** | Turn strategy + usage into a prioritized roadmap grounded in the ontology | KPI tree, feature telemetry, support themes | RICE-scored roadmap, PRDs, capability gaps |
| **UX Agent** | Detect friction; propose flows/copy; guard accessibility (WCAG 2.2 AA) | Session replays, funnel drop-off, a11y scans | UX diagnoses, wireframe specs, copy variants |
| **Journey Agent** | Model lifecycle journeys per persona (Assess→Plan→Learn→Improve) | Event backbone, cohort transitions | Journey maps, activation/retention interventions |
| **Feature Agent** | Spec individual features to buildable acceptance criteria + flags | PRD, API surface, DB schema | Feature specs, test criteria, LaunchDarkly-style flag plan |

### 2.3 Engineering

| Agent | Purpose | Inputs | Outputs |
|---|---|---|---|
| **Frontend Agent** | Next.js UI implementation, component reuse, perf budgets (Core Web Vitals) | Feature spec, design tokens, telemetry | PRs (React/Next.js), Lighthouse-gated changes |
| **Backend Agent** | Node.js/PHP service logic, business rules, ACU metering hooks | Feature spec, API contract | Service PRs, migrations, metering instrumentation |
| **Infrastructure Agent** | IaC, tenant sub-domain provisioning, Redis/queue capacity | Load metrics, cost signals | Terraform/IaC PRs, scaling changes (→ `05`) |
| **API Agent** | Design/version REST + webhook contracts; backward-compat gates | OpenAPI specs, consumer usage | Versioned API defs, deprecation plans, SDK stubs |
| **Database Agent** | MariaDB schema, composite-key tenant sharding, query/index tuning | Slow-query logs, growth forecast | Schema migrations, index plans, shard rebalancing proposals |

**Guardrail:** Engineering agents open **PRs only** — no direct-to-`main`. Merge/deploy is
owned by the **Release Management Agent** (`05 §5`) behind progressive delivery + human gate.

### 2.4 Quality

| Agent | Purpose | Inputs | Outputs |
|---|---|---|---|
| **QA Agent** | Generate + maintain test suites; enforce coverage & golden-set evals | PRs, specs, eval datasets | Unit/integration/E2E tests, eval reports |
| **Testing Agent** | Orchestrate CI test runs, flaky-test quarantine, contract tests | CI events, historical failures | Pass/fail gates, flake reports, quarantine list |
| **Performance Agent** | Load/soak testing, latency budgets, N+1 & regression detection | k6/Locust runs, APM traces | Perf regressions, budget breaches (blocks release) |

### 2.5 Cybersecurity (autonomous SOC — CrowdStrike/Cloudflare pattern)

| Agent | Purpose | Inputs | Outputs |
|---|---|---|---|
| **Threat Hunter Agent** | Proactive hypothesis-driven hunting across telemetry | EDR/WAF logs, auth events, threat intel | Hunt findings, IOCs, detections-as-code |
| **SOC Agent** | Tier-1/2 alert triage, correlation, auto-containment of low-risk | SIEM alerts, event backbone | Enriched incidents, containment actions, escalations |
| **Fraud Agent** | Account/payment/exam-integrity fraud (works with Fraud Detection core, §3) | Behavioral signals, Stripe Radar, device fingerprints | Risk scores, blocks, case files |
| **Vulnerability Agent** | Continuous dependency/CVE scanning, SAST/DAST triage, prioritization | SBOM, scanner output, EPSS/CVSS | Ranked vuln backlog, patch PRs (→ Auto-Repair, `05`) |
| **Identity Agent** | IAM hygiene, RBAC drift, anomalous privilege use, MFA posture | IAM logs, RBAC matrix (`docs/architecture/10-permissions-rbac`) | Access reviews, JIT grants, revocations |

### 2.6 Revenue

| Agent | Purpose | Inputs | Outputs |
|---|---|---|---|
| **Sales Agent** | Lead qualification, outreach drafting, pipeline hygiene | CRM, product-qualified-lead signals | Scored leads, sequenced outreach, forecast inputs |
| **Pricing Agent** | Price/packaging experiments, ACU pack economics, discount guardrails | Elasticity data, margin, competitor prices | Price recommendations (CFO sign-off), test designs |
| **Monetisation Agent** | Expansion, ACU top-up nudges, cross/upsell, paywall placement | ACU burn-down, usage tiers, feature gating | In-product offers, expansion plays, packaging changes |

### 2.7 Customer

| Agent | Purpose | Inputs | Outputs |
|---|---|---|---|
| **Support Agent** | Resolve tickets via RAG over KB + ontology (deflection) | Tickets, KB, account context | Resolutions, macros, KB gap tickets |
| **Success Agent** | Drive activation/adoption of the five engines per account | Health score, usage depth, milestones | Playbooks, QBR briefs, at-risk flags |
| **Retention Agent** | Predict + prevent churn (Sentinel churn model, `14 §1.1`) | Churn signals, ACU depletion, engagement decay | Save offers, interventions, win-back sequences |

### 2.8 Compliance

| Agent | Purpose | Inputs | Outputs |
|---|---|---|---|
| **GDPR Agent** | DSAR handling, consent, minor-data residency, retention/erasure | Consent ledger, data map, DSAR queue | DSAR fulfilment, RoPA updates, retention enforcement |
| **AML Agent** | Transaction monitoring, sanctions screening on payment flows | Stripe/BitriPay events, sanctions lists | SAR candidates, holds, monitoring reports |
| **KYC Agent** | Identity/eligibility verification for schools, tutors, parents/payers | Onboarding docs, verification providers | Verification decisions, EDD escalations |
| **Regulatory Agent** | Horizon-scan EdTech/child-safety/AI regs; map controls | Reg feeds, control inventory | Change alerts, gap analyses, control mappings |

> Compliance agents are **advisory + gate-only**: they can *block* a workflow (hard stop) but
> cannot *approve* high-risk regulated actions autonomously — those route to a human DPO/MLRO.
> See `docs/ai-os/06-security-compliance.md`.

---

## 3. Core AI Agents catalogue (operational workforce)

Full specs for the 15 workhorse agents. All share the common contract in §4. **APIs used**
lists internal services (`svc:*`), the **Model Router** (`router`), and external providers.

### 3.1 Onboarding Agent

| Field | Spec |
|---|---|
| **Purpose** | Convert signups into activated tenants; provision sub-domain, seed ACU trial pool, run first Diagnostic. |
| **Inputs** | Signup payload, role (School/Teacher/Tutor/Student/Parent), KYC status, referral source |
| **Outputs** | Provisioned tenant (composite-key shard + sub-domain), welcome journey, first-roadmap trigger, activation score |
| **Permissions** | `tenant:create`, `acu:grant(trial)`, `email:send`, `read:diagnostic` — **no** billing, **no** prod deploy |
| **Triggers** | `signup.completed` event; invite acceptance; sales-assisted provisioning |
| **Workflow** | Validate → KYC gate → provision shard/sub-domain → grant trial ACU → send activation journey → schedule Diagnostic → emit `tenant.activated` |
| **Escalation** | KYC fail → **KYC Agent**; provisioning error → **Infrastructure Agent** + on-call; abuse pattern → **Fraud Agent** |
| **APIs used** | `svc:provisioning`, `svc:acu-ledger`, `svc:diagnostic`, Stripe (setup), `router` |
| **Business value** | Time-to-value ↓, activation rate ↑, zero-touch onboarding at tenant scale |

### 3.2 Compliance Agent

| Field | Spec |
|---|---|
| **Purpose** | Enforce GDPR/child-safety/AML/KYC controls across every workflow as a policy gate. |
| **Inputs** | Consent ledger, data-residency map, DSAR queue, payment events, regulatory feed |
| **Outputs** | Allow/deny gate decisions, DSAR fulfilment, retention enforcement, audit artifacts |
| **Permissions** | `policy:evaluate`, `workflow:halt`, `data:erase(approved)`, `read:audit` — cannot approve high-risk regulated actions |
| **Triggers** | Any high-risk action, `dsar.opened`, payment/onboarding events, scheduled retention sweeps |
| **Workflow** | Intercept action → evaluate policy-as-code (OPA-style) → allow / redact / **hard-stop** → log decision → escalate if regulated |
| **Escalation** | Regulated/edge cases → human DPO/MLRO; AML hit → **AML Agent** → MLRO; minor-data egress → block + CTO |
| **APIs used** | `svc:policy-engine`, `svc:consent`, `svc:audit`, sanctions/verification providers, `router` |
| **Business value** | Regulatory risk ↓, trust with schools/parents ↑, audit-ready by construction |

### 3.3 Risk Agent

| Field | Spec |
|---|---|
| **Purpose** | Continuously score account, financial, academic-integrity and platform risk; feed decisions. |
| **Inputs** | Behavioral events, ACU burn anomalies, payment history, dispute/chargeback data |
| **Outputs** | Risk scores + reason codes, holds, step-up-auth requirements, watchlist entries |
| **Permissions** | `risk:score`, `auth:stepup`, `flag:raise`, `read:events` — cannot seize funds |
| **Triggers** | Stream on event backbone; pre-transaction hooks; nightly batch recompute |
| **Workflow** | Ingest signals → feature store → model + rules → score → route (allow/step-up/hold/deny) → log reason codes |
| **Escalation** | High score → **Fraud Agent**; payment risk → **Payment Agent** hold + human review |
| **APIs used** | `svc:feature-store`, `svc:risk-model`, Stripe Radar, `router` |
| **Business value** | Loss rate ↓, chargebacks ↓, safe automation of the long tail |

### 3.4 Revenue Agent

| Field | Spec |
|---|---|
| **Purpose** | Maximize net revenue retention: expansion, ACU replenishment, churn-save orchestration. |
| **Inputs** | Usage depth, ACU burn-down, plan/tier, health score, renewal calendar |
| **Outputs** | Expansion plays, top-up nudges, renewal actions, forecast contributions |
| **Permissions** | `offer:create`, `nudge:send`, `read:billing` — pricing changes require **Pricing Agent** + CFO |
| **Triggers** | ACU pool < threshold, renewal window, usage-tier crossing, health-score drop |
| **Workflow** | Detect signal → select play (bandit-optimized) → personalize via `router` → deliver in-product/email → attribute outcome |
| **Escalation** | Churn-risk → **Retention Agent**; billing dispute → **Customer Support**; pricing edge → **Pricing Agent** |
| **APIs used** | `svc:billing`, `svc:acu-ledger`, `svc:messaging`, `router` |
| **Business value** | NRR ↑, ACU replenishment rate ↑, expansion revenue ↑ |

### 3.5 Pricing Agent

| Field | Spec |
|---|---|
| **Purpose** | Optimize ACU pack pricing/packaging and per-action costs while protecting margin. |
| **Inputs** | Price-elasticity data, per-action ACU cost, provider cost/latency, competitor pricing |
| **Outputs** | Price/packaging recommendations, experiment designs, discount guardrails |
| **Permissions** | `experiment:create`, `read:cost` — **all live price changes require CFO Agent + human sign-off** |
| **Triggers** | Margin drift alert, provider cost change (Model Router), quarterly review, new-pack proposal |
| **Workflow** | Measure elasticity → simulate margin → design A/B → recommend → **HITL approve** → monitor → roll back on margin breach |
| **Escalation** | Margin breach → CFO Agent; anomalous elasticity → data review |
| **APIs used** | `svc:pricing`, `svc:cost-analytics`, `svc:experiments`, `router` |
| **Business value** | Gross margin protected, willingness-to-pay captured, ACU economics stay positive |

### 3.6 Customer Support Agent

| Field | Spec |
|---|---|
| **Purpose** | Deflect and resolve support tickets with grounded RAG; escalate cleanly. |
| **Inputs** | Ticket text, account/ontology context, KB + RAG cache, prior interactions |
| **Outputs** | Resolutions, suggested replies, KB-gap tickets, CSAT signal |
| **Permissions** | `ticket:respond`, `kb:read`, `account:read`, limited `action:safe` (e.g. resend email) — no refunds/data deletion |
| **Triggers** | `ticket.created`, in-app help, chat escalation |
| **Workflow** | Classify intent → retrieve (RAG) → draft grounded answer → confidence check → auto-send (high) / human-assist (low) → learn |
| **Escalation** | Low confidence / refund / legal → human queue; billing → **Payment Agent**; bug → **Bug Detection Agent** (`05`) |
| **APIs used** | `svc:tickets`, vector DB + RAG cache, `svc:knowledge`, `router` |
| **Business value** | Deflection ↑, first-response time ↓, support cost/ticket ↓ |

### 3.7 Marketing Agent

| Field | Spec |
|---|---|
| **Purpose** | Plan/produce/optimize multi-channel campaigns within brand-safety guardrails. |
| **Inputs** | Segment/cohort data, channel performance, content templates, CMO guardrails |
| **Outputs** | Campaign variants, content drafts, budget allocations, ROAS reports |
| **Permissions** | `campaign:draft`, `segment:read`, `spend:propose` — spend commit needs human/CMO gate |
| **Triggers** | Launch calendar, cohort formation, ROAS drift, seasonal (exam) windows |
| **Workflow** | Segment → generate content (`router`) → brand-safety eval → allocate budget (bandit) → launch (gated) → measure → iterate |
| **Escalation** | Brand-safety flag → CMO Agent; overspend → CFO Agent |
| **APIs used** | `svc:cdp`, `svc:campaigns`, ad/email providers, `router` |
| **Business value** | CAC ↓, ROAS ↑, faster campaign cycle time |

### 3.8 Data Intelligence Agent

| Field | Spec |
|---|---|
| **Purpose** | Turn the event backbone into governed metrics, cohorts and insights for all agents. |
| **Inputs** | Event streams, warehouse tables, ontology, metric definitions |
| **Outputs** | Trusted KPI tree, cohort defs, anomaly alerts, self-serve answers |
| **Permissions** | `warehouse:read`, `metric:publish`, `insight:emit` — read-mostly, no prod writes |
| **Triggers** | Scheduled model refresh, ad-hoc query, anomaly detection, agent data requests |
| **Workflow** | Ingest → model (dbt-style) → validate (contracts/tests) → publish metrics → serve NL queries → alert on anomalies |
| **Escalation** | Data-quality breach → **Database Agent**; metric dispute → CEO/CFO Agent |
| **APIs used** | `svc:warehouse`, `svc:metrics`, `svc:semantic-layer`, `router` |
| **Business value** | Single source of truth, faster decisions, every agent grounded on the same numbers |

### 3.9 Operations Agent

| Field | Spec |
|---|---|
| **Purpose** | Keep business workflows flowing: SLA monitoring, queue balancing, exception handling. |
| **Inputs** | Workflow/queue telemetry, SLA targets, task backlog, resource availability |
| **Outputs** | Rebalanced queues, SLA-breach interventions, ops digests |
| **Permissions** | `workflow:reprioritize`, `queue:rebalance`, `task:reassign` — within ops scope |
| **Triggers** | SLA-at-risk alert, queue-depth threshold, scheduled cadence |
| **Workflow** | Monitor SLAs → detect risk → rebalance/reassign → notify owner → verify recovery → log |
| **Escalation** | Capacity shortfall → **Infrastructure Agent** (`05`); systemic breach → COO Agent |
| **APIs used** | `svc:workflow`, `svc:queues`, Redis, `router` |
| **Business value** | SLA adherence ↑, manual coordination ↓, predictable operations |

### 3.10 Fraud Detection Agent

| Field | Spec |
|---|---|
| **Purpose** | Detect/prevent account-takeover, payment fraud, exam-integrity abuse, ACU gaming. |
| **Inputs** | Device fingerprints, velocity, Stripe Radar, behavioral biometrics, proctoring signals |
| **Outputs** | Fraud scores, blocks/holds, case files, model feedback labels |
| **Permissions** | `block:account`, `hold:payment`, `challenge:issue`, `read:events` — reversible actions; irreversible needs human |
| **Triggers** | Real-time transaction hook, login anomaly, exam-session signal, ACU-abuse pattern |
| **Workflow** | Score in-line → challenge/hold/block by tier → open case → human review for high-impact → feed labels back |
| **Escalation** | Confirmed fraud → **AML Agent** + human; ATO → **Identity Agent**; disputes → **Payment Agent** |
| **APIs used** | `svc:fraud-model`, Stripe Radar, `svc:proctoring`, `router` |
| **Business value** | Fraud loss ↓, exam credibility ↑, platform trust preserved |

### 3.11 Payment Agent

| Field | Spec |
|---|---|
| **Purpose** | Orchestrate billing across **Stripe (live)** and **BitriPay (planned)**; ACU top-ups, dunning, reconciliation. |
| **Inputs** | Checkout events, invoices, ACU purchase intents, webhooks, dispute events |
| **Outputs** | Charges, ACU credits to ledger, dunning sequences, reconciliation reports |
| **Permissions** | `payment:capture`, `acu:credit`, `dunning:run` — refunds > threshold need human; **provider-abstracted** (no lock-in) |
| **Triggers** | ACU purchase, subscription renewal, failed-payment webhook, provider selection by residency |
| **Workflow** | Route to provider (Stripe/BitriPay by policy) → capture → credit ACU ledger → on fail run dunning → reconcile → emit events |
| **Escalation** | Chargeback → **Fraud Agent** + AML; reconciliation mismatch → CFO Agent |
| **APIs used** | Stripe, BitriPay (planned), `svc:acu-ledger`, `svc:billing`, `router` |
| **Business value** | Payment success rate ↑, involuntary churn ↓, provider resilience, clean books |

### 3.12 API Integration Agent

| Field | Spec |
|---|---|
| **Purpose** | Manage inbound/outbound integrations (schools' SIS/LMS, providers, webhooks) with contract safety. |
| **Inputs** | OpenAPI/contract specs, partner endpoints, webhook payloads, rate limits |
| **Outputs** | Adapters/mappings, healthy connections, ret/backoff policies, deprecation notices |
| **Permissions** | `integration:configure`, `webhook:manage`, `secret:read(scoped)` — no schema-breaking changes without API Agent |
| **Triggers** | New integration request, contract change, webhook failure, partner outage |
| **Workflow** | Discover contract → generate adapter → validate (contract tests) → deploy connector → monitor → auto-retry/backoff |
| **Escalation** | Breaking change → **API Agent**; partner outage → **Operations Agent**; auth failure → **Identity Agent** |
| **APIs used** | Partner SIS/LMS APIs, `svc:integration-hub`, `router` |
| **Business value** | Faster school onboarding, resilient integrations, less custom glue code |

### 3.13 Workflow Automation Agent

| Field | Spec |
|---|---|
| **Purpose** | Compose multi-step, multi-agent business processes (ServiceNow-style orchestration). |
| **Inputs** | Process definitions, trigger events, agent capability registry, SLA targets |
| **Outputs** | Orchestrated runs, state transitions, compensation on failure, run traces |
| **Permissions** | `workflow:execute`, `agent:invoke`, `state:transition` — bounded to registered processes |
| **Triggers** | Event match, schedule, manual kickoff, upstream agent handoff |
| **Workflow** | Resolve process graph → dispatch steps to agents → checkpoint state → on failure compensate (saga) → complete + audit |
| **Escalation** | Stuck/looping run → **Operations Agent**; policy block → **Compliance Agent** |
| **APIs used** | `svc:workflow-engine`, `svc:agent-registry`, Redis, `router` |
| **Business value** | Straight-through processing, fewer handoffs, auditable end-to-end automation |

### 3.14 Predictive Growth Agent

| Field | Spec |
|---|---|
| **Purpose** | Forecast demand, activation, expansion and churn; recommend growth levers. |
| **Inputs** | Historical cohorts, seasonality (exam cycles), funnel, macro signals |
| **Outputs** | Forecasts + confidence, lever recommendations, scenario simulations |
| **Permissions** | `forecast:publish`, `warehouse:read`, `recommend:action` — recommend-only (A1) |
| **Triggers** | Weekly forecast cycle, plan input requests, significant metric shift |
| **Workflow** | Assemble features → forecast (time-series/ML) → simulate scenarios → recommend levers → hand to Revenue/Marketing → track error |
| **Escalation** | Forecast miss beyond band → Data Intelligence review; strategy shift → CEO/CRO Agent |
| **APIs used** | `svc:warehouse`, `svc:forecasting`, `svc:experiments`, `router` |
| **Business value** | Better planning, capital efficiency, proactive growth vs reactive |

### 3.15 Admin Control Agent

| Field | Spec |
|---|---|
| **Purpose** | The human operator's control plane: policy, kill-switches, budget envelopes, overrides across all agents. |
| **Inputs** | Admin commands, policy definitions, ACU budgets, autonomy-tier settings, audit stream |
| **Outputs** | Policy pushes, agent pause/resume, budget changes, override records |
| **Permissions** | `agent:govern`, `killswitch:trigger`, `budget:set`, `autonomy:set` — **Platform Admin only**, MFA + dual-control on high-impact |
| **Triggers** | Admin action, policy violation alert, budget breach, incident declaration |
| **Workflow** | Authenticate (MFA) → validate command → apply policy/budget/override → propagate → confirm → immutable audit |
| **Escalation** | Conflicting directives → CEO Agent arbitration; security event → **SOC Agent** |
| **APIs used** | `svc:agent-registry`, `svc:policy-engine`, `svc:acu-ledger`, `svc:audit` |
| **Business value** | Human control retained, safe autonomy, single governance surface (ties to AI Governance Agent, `05 §6`) |

---

## 4. Orchestration model

### 4.1 Supervisor / router (Chief of Staff)

Anthropic/OpenAI **orchestrator–worker** pattern. The Chief of Staff supervisor:

1. **Decomposes** a goal into typed sub-tasks against the **ontology** (Palantir pattern —
   agents act on `Tenant`, `Invoice`, `Roadmap`, `ACUPool` objects, never raw text).
2. **Selects** worker agents from the capability registry (skill × data-scope × cost).
3. **Allocates an ACU budget** per run; refuses to dispatch if the tenant/pool would breach
   the **hard stop at zero**.
4. **Routes** each worker's model call through the **Model Router** (capability + failover +
   residency).
5. **Aggregates** results, runs an evaluator pass, and either returns or re-plans (bounded
   retries, saga-style compensation on failure).

**Router vs orchestrator:** simple, single-domain requests use a lightweight **router**
(classify → one agent). Multi-step/cross-department goals use the full **orchestrator** with
checkpointing. This mirrors OpenAI's routing-vs-orchestration guidance — don't pay
orchestration overhead for one-shot tasks.

### 4.2 Shared memory

| Layer | Store | Purpose |
|---|---|---|
| **Working memory** | Redis (per-run) | Task state, checkpoints, handoff payloads |
| **Semantic memory** | Vector DB + RAG cache | Grounded knowledge, prior resolutions, embeddings |
| **Ontology / system of record** | MariaDB (composite-key sharded) | Typed business objects — the ground truth agents read *and write back* |
| **Episodic / audit** | Append-only log | Every action, decision, reason code, ACU cost — immutable (`06`) |

Memory is **tenant-scoped by composite key**; no agent reads across tenant boundaries without
a Platform-Admin-signed cross-tenant scope. Minor data never leaves an approved provider/region.

### 4.3 Tool-use contract

Every agent tool declaration is **typed, permissioned, metered and audited**:

```jsonc
{
  "tool": "acu.credit",
  "scope": "tenant:{{tenant_id}}",          // composite-key bound
  "permission": "acu:credit",                // checked against RBAC (10-permissions-rbac)
  "side_effect": "reversible|irreversible",  // irreversible ⇒ HITL required
  "acu_cost": 3,                             // metered pre-execution; hard-stop at 0
  "idempotency_key": "…",                    // safe retries (saga)
  "audit": "required",                       // reason code + inputs/outputs logged
  "hitl_gate": "auto|approve|dual_control"   // by autonomy tier + side_effect
}
```

Contract rules: (a) **pre-flight ACU check** — no call proceeds if it would breach zero;
(b) **irreversible ⇒ human gate**; (c) **idempotency keys** on every mutating call for safe
retry; (d) **structured output** validated against schema before it flows downstream
(Anthropic structured-output contract); (e) **least privilege** — tools are the only way an
agent affects the world, and each is RBAC-checked.

### 4.4 Autonomy tiers & human-in-the-loop gates

| Tier | Name | Behavior | Example |
|---|---|---|---|
| **A0** | Observe | Read + report only | Data Intelligence, Predictive Growth |
| **A1** | Recommend | Proposes; human approves | Executive tier, Pricing (live), Marketing spend |
| **A2** | Act-in-bounds | Autonomous within guardrails + budget; reversible only | Support, Onboarding, Operations, Payment (small) |
| **A3** | Act-broad | Autonomous incl. some irreversible; signed policy + dual-control | none default; opt-in per policy via Admin Control |

**HITL gate triggers (any one forces a human):** irreversible side-effect · spend/refund above
threshold · regulated action (GDPR/AML/KYC) · low model confidence · policy conflict · ACU
budget breach · security/fraud high-risk. Gates route to the correct human role (DPO, MLRO,
CFO, Platform Admin) with full context and reason codes.

### 4.5 Reliability patterns (proven)

- **Evaluator–optimizer loop** (Anthropic): generator agent + critic agent before high-impact
  output ships.
- **Saga / compensation**: multi-step workflows roll back cleanly on partial failure.
- **Circuit breakers + failover**: Model Router trips on provider outage/rate-limit.
- **Golden-set evals gate** every prompt/model change (shared with `05` release gates).
- **Cost & token accounting** per run, per tenant, per agent → CFO Agent + ACU ledger.

---

## 5. Cross-references

- Tenant domain agents & Model Router foundation — `docs/architecture/14-ai-agent-blueprint.md`
- Security, audit, policy-as-code, DPO/MLRO gates — `docs/ai-os/06-security-compliance.md`
- Self-managing ops agents (health/bug/repair/release/governance) — `docs/ai-os/05-self-managing-platform.md`
- Runtime topology, queues, sharding — `docs/ai-os/10-production-architecture.md`
- RBAC & permissions matrix — `docs/architecture/10-permissions-rbac.md`
