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

## 3A. StudYear-enhanced agents (first-class core catalogue entries)

Three catalogue members are **specialised extensions** of the generic agents above, tuned to
StudYear's ACU economics, minor-data reality, and the Admin Super Control Centre. They inherit
the generic agent's contract and add StudYear-specific signals, actions and escalations.

### 3A.1 Admin Intelligence Agent — *extends Admin Control (§3.15); complements Sentinel.ai*

| Field | Spec |
|---|---|
| **Purpose** | Surface what matters to the operator: unusual usage, failed payments, inactive accounts, fraud risk, and high-value growth opportunities — into the **Admin Super Control Centre**. |
| **Inputs** | Cross-tenant event backbone, ACU burn/anomaly signals, Stripe/BitriPay failure webhooks, login/activity recency, fraud & risk scores, expansion signals |
| **Outputs** | Prioritized "what needs attention" feed, anomaly alerts (usage/payment/inactivity), fraud-risk flags, ranked growth opportunities, drill-down cards |
| **Permissions** | `analytics:cross-tenant(read, admin-signed)`, `alert:emit`, `insight:rank` — **read-only intelligence**; any action goes via Admin Control Agent with MFA |
| **Triggers** | Continuous stream + scheduled sweeps; ACU-anomaly, payment-failure, inactivity-threshold, fraud-score spike, expansion-signal events |
| **Workflow** | Ingest signals → detect anomalies (usage/payment/inactivity) → correlate with fraud/risk & growth models → score + rank → publish to Control Centre → suggest next action (deferred to human/Admin Control) |
| **Escalation** | Fraud risk → **Fraud Detection Agent**; failed payments → **Payment Agent** dunning; churn-shaped inactivity → **Revenue Agent**; platform anomaly → **Sentinel.ai** / System Health (`05`) |
| **APIs used** | `svc:warehouse`, `svc:metrics`, `svc:fraud-model`, Stripe/BitriPay, `svc:acu-ledger`, `router` |
| **Business value** | Operator sees the 5 things that matter each morning, not 500 dashboards; faster intervention on revenue leaks, fraud and growth |

### 3A.2 Revenue Agent (ACU-economics build) — *extends Revenue (§3.4) + Pricing (§3.5)*

| Field | Spec |
|---|---|
| **Purpose** | Own ACU-wallet economics end-to-end: track ACU consumption, subscription conversion and churn risk, and recommend **Dynamic Pricing** actions. |
| **Inputs** | Per-action ACU consumption, wallet balances & burn-rate, trial→paid conversion funnel, subscription tier, churn signals, provider cost via Model Router, elasticity data |
| **Outputs** | ACU top-up nudges (pre hard-stop-at-zero), conversion plays, churn-risk scores, **dynamic pricing recommendations** (to Dynamic Pricing engine), NRR forecast inputs |
| **Permissions** | `acu:read`, `offer:create`, `nudge:send`, `pricing:recommend` — **live price changes require CFO Agent + human sign-off**; cannot alter wallet balances |
| **Triggers** | ACU pool nearing zero / hard-stop risk, trial expiry, renewal window, usage-tier crossing, provider cost change, churn-signal event |
| **Workflow** | Meter ACU burn per tenant/pool → predict depletion & churn → if depletion imminent, nudge top-up (avoid hard stop) → for conversion, trigger play → feed elasticity + cost to Dynamic Pricing → recommend price/pack (HITL) → attribute outcome |
| **Escalation** | Confirmed churn risk → **Retention Agent**; margin/elasticity edge → **Pricing Agent** + CFO; billing dispute → **Payment Agent** |
| **APIs used** | `svc:acu-ledger`, `svc:billing`, `svc:pricing` (Dynamic Pricing engine), `svc:messaging`, Stripe/BitriPay, `router` |
| **Business value** | ACU replenishment before hard-stop-at-zero protects UX and revenue; conversion ↑, churn ↓, price captures willingness-to-pay while margin holds |

### 3A.3 Compliance Agent (minor-safeguarding build) — *extends Compliance (§3.2) + GDPR/KYC (§2.8)*

| Field | Spec |
|---|---|
| **Purpose** | Enforce child-data and safeguarding obligations: GDPR requests, minor-data handling, consent flows, and school safeguarding duties — **students are often minors; consent flows through parent/guardian**. |
| **Inputs** | DSAR queue, age/eligibility signals, parental-consent ledger (guardianship link), data-residency map, safeguarding policy, school DPA terms, disclosure/incident reports |
| **Outputs** | Allow/deny gate decisions on minor-data actions, DSAR fulfilment, consent-state enforcement, safeguarding escalations, audit artifacts, residency enforcement |
| **Permissions** | `policy:evaluate`, `workflow:halt`, `consent:enforce`, `data:erase(approved)` — **cannot approve** high-risk regulated/safeguarding actions; those route to human DPO/DSL |
| **Triggers** | Any action on minor data, `dsar.opened`, consent grant/withdraw (parent), age-gate crossing, safeguarding-signal event, retention sweep |
| **Workflow** | Intercept action → resolve subject age & guardianship → verify parental consent state → evaluate policy-as-code → allow / redact / **hard-stop** → on safeguarding signal, escalate immediately → log decision + reason code |
| **Escalation** | Safeguarding concern → human **Designated Safeguarding Lead** + DPO (immediate); AML/payment → **AML Agent** → MLRO; minor-data egress attempt → block + CTO Agent |
| **APIs used** | `svc:policy-engine`, `svc:consent` (guardianship graph), `svc:audit`, age/identity verification providers, `router` |
| **Business value** | Trust with schools & parents (safeguarding is non-negotiable), regulatory exposure ↓ on minor data, consent auditable by construction |

### 3A.4 Student Success Agent — *specialisation of Mentor.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Watch each student's progress daily and recommend exactly what to study next, keeping the Assess→Plan→Learn→Improve loop moving. |
| **Inputs** | Daily mastery/progress telemetry, AI Study Roadmap state, Diagnostic results, engagement recency, upcoming deadlines/exams, ACU balance |
| **Outputs** | "Study next" recommendation, updated daily plan, progress nudges, roadmap re-sequencing suggestions to Mentor.ai |
| **Permissions** | `student:read(progress, roadmap)`, `recommend:action`, `nudge:send` — student-scoped; no grade changes; parental-consent-gated for minors |
| **Triggers** | Daily scheduled sweep, session completion, mastery-change event, plan-drift detection |
| **Workflow** | Ingest progress → compare to roadmap targets → detect drift/next-best-topic → generate ranked "study next" (ACU-priced per action) → deliver via Mentor.ai → track follow-through |
| **Escalation** | Persistent inactivity → **Motivation Agent** + Concierge.ai (parent); systemic weakness → **Weakness Detection Agent**; exam near + off-track → **Exam Readiness Agent** |
| **APIs used** | `svc:progress-intelligence`, `svc:roadmap`, `svc:acu-ledger`, `svc:messaging`, `router` |
| **Business value** | Daily "what next" removes decision friction, sustains the learning loop, drives engagement & mastery gains |

### 3A.5 Weakness Detection Agent — *specialisation of Mentor.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Identify repeated mistakes and knowledge gaps, then create targeted recovery tasks. |
| **Inputs** | Per-question attempt history, error patterns, topic mastery vectors, misconception signals, Diagnostic + practice results |
| **Outputs** | Ranked weakness list with root-cause tags, generated recovery/remediation tasks, mastery-gap alerts to roadmap |
| **Permissions** | `student:read(attempts, mastery)`, `task:create(recovery)`, `recommend:action` — student-scoped; consent-gated for minors |
| **Triggers** | Repeated-error threshold, low mastery on a topic, post-assessment analysis, Student Success handoff |
| **Workflow** | Cluster errors → classify misconception/root cause → prioritize by impact × exam-relevance → generate recovery tasks (ACU-priced) → inject into roadmap → verify improvement on retry |
| **Escalation** | Fundamental prerequisite gap → Pedagogue.ai (teacher); stalled recovery → **Exam Readiness** / **Assignment Coach**; motivation collapse → **Motivation Agent** |
| **APIs used** | `svc:learning-tools`, `svc:progress-intelligence`, `svc:roadmap`, `svc:acu-ledger`, `router` |
| **Business value** | Turns mistakes into targeted practice, closes gaps before they compound, raises pass rates |

### 3A.6 Exam Readiness Agent — *specialisation of Mentor.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Predict exam risk ahead of time and build a **7 / 14 / 30-day rescue plan** to close the gap. |
| **Inputs** | Exam date/spec, current vs required mastery, weakness list, historical pace, available study time, ACU budget |
| **Outputs** | Exam-risk score + confidence, tiered **7/14/30-day rescue plan**, daily targets, readiness trajectory |
| **Permissions** | `student:read(mastery, schedule)`, `plan:create`, `recommend:action`, `nudge:send` — student-scoped; consent-gated for minors |
| **Triggers** | Exam within window, readiness-risk threshold crossed, weakness-list update, teacher/parent request |
| **Workflow** | Forecast readiness vs exam target → compute risk → select horizon (7/14/30d by time remaining) → generate prioritized rescue plan (ACU-priced) → schedule daily targets → re-forecast + adapt daily |
| **Escalation** | High risk + short runway → alert Concierge.ai (parent) + Pedagogue.ai (teacher); ACU depletion risk → **Revenue Agent** top-up nudge; motivation risk → **Motivation Agent** |
| **APIs used** | `svc:forecasting`, `svc:progress-intelligence`, `svc:roadmap`, `svc:acu-ledger`, `router` |
| **Business value** | Early warning + a concrete rescue plan converts at-risk students to passes; a headline retention/outcome driver |

### 3A.7 Motivation Agent — *specialisation of Mentor.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Sustain momentum: encouragement, streak reminders, and early **burnout warnings**. |
| **Inputs** | Engagement/streak data, session cadence & duration, sentiment/effort signals, milestone events, over-study/fatigue indicators |
| **Outputs** | Encouragement messages, streak reminders, milestone celebrations, **burnout warnings** (to student + parent), pacing suggestions |
| **Permissions** | `student:read(engagement)`, `nudge:send`, `alert:emit` — student-scoped; parental-consent + safeguarding-gated for minors; frequency-capped |
| **Triggers** | Streak-at-risk, milestone reached, inactivity gap, over-study/fatigue pattern, low-effort trend |
| **Workflow** | Detect momentum/fatigue signal → choose tone/message (bandit-optimized, ACU-priced) → deliver via Mentor.ai (frequency-capped) → on burnout signal, warn + suggest rest + notify parent → measure lift |
| **Escalation** | Sustained disengagement → **Student Success** + Concierge.ai; wellbeing/safeguarding signal → **Compliance Agent (§3A.3)** + human DSL; churn-shaped drop → Retention Agent |
| **APIs used** | `svc:engagement`, `svc:messaging`, `svc:acu-ledger`, `router` |
| **Business value** | Higher retention & daily active use, prevents burnout-driven churn, protects wellbeing (trust with parents) |

### 3A.8 Assignment Coach Agent — *specialisation of Mentor.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Review submitted work, predict the likely grade, and give concrete improvement steps before final submission. |
| **Inputs** | Draft/submitted work, assignment rubric/spec, subject mastery context, prior feedback, exam-board criteria |
| **Outputs** | Predicted grade + confidence, rubric-mapped feedback, prioritized improvement steps, revised-draft guidance |
| **Permissions** | `student:read(work, rubric)`, `feedback:create`, `recommend:action` — student-scoped; **advisory only, never submits or self-grades officially**; consent-gated for minors |
| **Triggers** | Draft submitted for review, assignment deadline approaching, student request, teacher-enabled coaching |
| **Workflow** | Parse work vs rubric → predict grade (calibrated) → map gaps to rubric criteria → generate ranked improvement steps (ACU-priced) → deliver via Mentor.ai → re-score on revision |
| **Escalation** | Academic-integrity/plagiarism signal → Pedagogue.ai (teacher) + **Fraud Detection Agent**; predicted fail → **Exam Readiness** + parent alert |
| **APIs used** | `svc:learning-tools`, `svc:grading-model`, `svc:progress-intelligence`, `svc:acu-ledger`, `router` |
| **Business value** | Faster, rubric-aligned feedback lifts grades, reduces teacher marking load, differentiates the learning experience |

### 3A.9 Parent Advisor Agent — *specialisation of Concierge.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Tell parents what to do **without micromanaging** — concrete, low-friction guidance. |
| **Inputs** | Child progress/mastery, plan adherence, risk alerts, weekly-briefing context, prior advice outcomes |
| **Outputs** | Actionable advice ("what to ask, what to do this week"), intervention-mode suggestions, do/don't framing |
| **Permissions** | `child:read(progress, risk)` via guardianship scope only; `recommend:action`; advisory-only |
| **Triggers** | Weekly briefing cycle, new risk alert, parent request, intervention-mode toggle |
| **Workflow** | Read child state → rank 1–3 highest-leverage parent actions → phrase non-micromanaging guidance (ACU-priced) → deliver via Concierge.ai → track follow-through |
| **Escalation** | Persistent risk despite intervention → **Early Warning (§3A.10)** + school/teacher loop; wellbeing signal → Compliance Agent (§3A.3) |
| **APIs used** | `svc:progress-intelligence`, `svc:messaging`, `svc:acu-ledger`, `router` |
| **Business value** | Converts parent anxiety into productive action; deepens family engagement and plan renewal |

### 3A.10 Early Warning Agent — *specialisation of Concierge.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Alert parents when a child is slipping **before grades collapse**. |
| **Inputs** | Adherence trends, mastery decay, missed sessions, confidence drops, predicted-grade movement |
| **Outputs** | Early-warning alerts with cause + trajectory, "what changed" deltas, suggested first response |
| **Permissions** | `child:read(telemetry)` guardianship-scoped; `alert:emit`; frequency-capped to avoid alarm fatigue |
| **Triggers** | Leading-indicator thresholds (adherence slide, streak break patterns, confidence dip) — deliberately ahead of grade events |
| **Workflow** | Monitor leading indicators → detect slip pattern → verify against noise (no false-alarm spam) → alert parent with cause + next step → hand to Parent Advisor (§3A.9) |
| **Escalation** | Multi-signal decline → school Cohort Risk Agent (§3A.14) + teacher; acute pattern → safeguarding path (§3A.3) |
| **APIs used** | `svc:progress-intelligence`, `svc:alerting`, `router` |
| **Business value** | The "intervene before failure" promise made real — the platform's core positioning, delivered to the guardian |

### 3A.11 Family Support Agent — *specialisation of Concierge.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Recommend **home routines, revision windows, and emotional-support actions**. |
| **Inputs** | Child's study patterns/chronotype, family calendar constraints, burnout-risk indicator, confidence tracker |
| **Outputs** | Home routine suggestions, optimal revision windows, emotional-support actions, environment tips |
| **Permissions** | `child:read(patterns)` guardianship-scoped; `recommend:action`; advisory-only, never contacts the child directly |
| **Triggers** | Weekly cycle, burnout-risk change, exam-period start, parent request |
| **Workflow** | Analyze when the child actually studies best → fit revision windows to family constraints → pair with emotional-support guidance (ACU-priced) → deliver via Concierge.ai |
| **Escalation** | Burnout indicator sustained → Motivation Agent (§3A.7) + Early Warning (§3A.10); wellbeing concern → §3A.3 |
| **APIs used** | `svc:progress-intelligence`, `svc:scheduling`, `router` |
| **Business value** | Extends the OS into the home; differentiator no gradebook-viewer competitor offers |

### 3A.12 ACU Control Agent — *specialisation of Concierge.ai; wallet-advisory*

| Field | Spec |
|---|---|
| **Purpose** | Advise **when to top up ACUs and which tools give best value** for this child. |
| **Inputs** | Wallet balance + burn rate, per-tool ACU cost & outcome lift (mastery gained per ACU), upcoming plan demands (exam countdown) |
| **Outputs** | Top-up timing advice, best-value tool recommendations, projected depletion warnings, pack-size suggestions |
| **Permissions** | `wallet:read` (family scope), `recommend:action`; **never auto-purchases** — parent approves all spend |
| **Triggers** | Low-balance threshold, burn-rate spike, exam-period approach, pack promotion relevance |
| **Workflow** | Project depletion vs upcoming plan → rank tools by outcome-per-ACU for this child → recommend timing + pack (advice is free/cheap; purchases via Stripe/BitriPay) → learn from outcomes |
| **Escalation** | Suspected ACU waste/abuse patterns → Revenue Agent (§3A.2); affordability signals → suggest school-pool or plan alternatives, never pressure |
| **APIs used** | `svc:acu-ledger`, `svc:monetisation`, `svc:progress-intelligence`, `router` |
| **Business value** | Trustworthy spend guidance raises top-up conversion AND parent trust — value-honest monetisation |

### 3A.13 School Improvement Agent — *specialisation of Principia.ai*

| Field | Spec |
|---|---|
| **Purpose** | Identify **underperforming cohorts** and recommend interventions. |
| **Inputs** | Cohort health map, mastery distributions by class/year/subject, intervention history & outcomes |
| **Outputs** | Underperformance diagnoses (cohort × subject × topic), ranked intervention recommendations, expected-impact estimates |
| **Permissions** | `tenant:read(cohort-analytics)` school-scoped, aggregate-first; `recommend:action` |
| **Triggers** | Term checkpoints, cohort-metric threshold breach, leadership request |
| **Workflow** | Scan cohort health map → isolate underperformance drivers (topic, teaching gap, engagement) → match to intervention playbook with evidence → deliver to School Command Centre |
| **Escalation** | Cross-cohort systemic issue → Executive Report Agent (§3A.16); individual students → Cohort Risk Agent (§3A.14) |
| **APIs used** | `svc:cohort-analytics`, `svc:intervention-tracking`, `router` |
| **Business value** | Turns the school dashboard from reporting into an improvement engine; drives school-plan renewal |

### 3A.14 Cohort Risk Agent — *specialisation of Principia.ai*

| Field | Spec |
|---|---|
| **Purpose** | Flag **students likely to miss target grades**. |
| **Inputs** | Per-student predicted vs target grades, adherence/engagement, mastery trajectories, attendance-like activity |
| **Outputs** | At-risk student lists (ranked by gap × trajectory), risk drivers per student, suggested owner (teacher/tutor) |
| **Permissions** | `tenant:read(student-risk)` school-scoped; safeguarding-gated detail access; `alert:emit` |
| **Triggers** | Weekly risk sweep, predicted-grade drop events, pre-report/pre-exam checkpoints |
| **Workflow** | Compare predicted vs target per student → rank by miss-probability and recoverability → attach drivers → route to Staff Deployment (§3A.15) + teacher workspaces + (consented) parent alerts |
| **Escalation** | Safeguarding-style academic alert → designated safeguarding lead workflow (§3A.3); cluster risk → School Improvement (§3A.13) |
| **APIs used** | `svc:progress-intelligence`, `svc:cohort-analytics`, `svc:alerting`, `router` |
| **Business value** | Institutional early-warning — catches slipping students **before reports or exams**, the school's core buy-reason |

### 3A.15 Staff Deployment Agent — *specialisation of Principia.ai*

| Field | Spec |
|---|---|
| **Purpose** | Recommend **where teachers/tutors should focus**. |
| **Inputs** | At-risk lists (§3A.14), teacher workload dashboard, tutor availability, intervention capacity, timetable constraints |
| **Outputs** | Deployment recommendations (who → which students/topics → when), workload-balance warnings, tutor-referral suggestions |
| **Permissions** | `tenant:read(workload, risk)` school-scoped; `recommend:action` — deployment decisions stay human |
| **Triggers** | New risk-sweep output, workload imbalance detected, staff absence, intervention cycle planning |
| **Workflow** | Match intervention demand (risk × topic) to supply (staff skill × capacity) → optimize assignment within workload caps → propose to leadership → track intervention outcomes |
| **Escalation** | Demand exceeds staff capacity → recommend vetted marketplace tutors (Matchmaker.ai); chronic overload → Executive Report (§3A.16) |
| **APIs used** | `svc:cohort-analytics`, `svc:scheduling`, `svc:marketplace`, `router` |
| **Business value** | Highest-leverage use of scarce teaching time; connects school demand to marketplace supply |

### 3A.16 Executive Report Agent — *specialisation of Principia.ai*

| Field | Spec |
|---|---|
| **Purpose** | Produce **weekly headteacher/governor reports** automatically. |
| **Inputs** | School-wide analytics, department dashboards, intervention tracking, risk deltas, ACU-pool utilisation |
| **Outputs** | Governor/headteacher-ready weekly report (narrative + evidence tables + trends), export-ready formats |
| **Permissions** | `tenant:read(all-analytics)` school-scoped, aggregate-only in governor outputs; `report:generate` |
| **Triggers** | Weekly cycle, term/board meeting calendar, on-demand leadership request |
| **Workflow** | Aggregate week's deltas → select material changes (not noise) → draft narrative grounded in real records → attach evidence → deliver via Reports & Exports (module 16) |
| **Escalation** | Findings needing action → routed to School Improvement (§3A.13); compliance-relevant items → Compliance Agent (§3A.3) |
| **APIs used** | `svc:cohort-analytics`, `svc:reporting`, `router` |
| **Business value** | Hours of leadership reporting automated weekly; makes the platform visible at governor level (retention anchor) |

### 3A.17 Funding Impact Agent — *specialisation of Principia.ai*

| Field | Spec |
|---|---|
| **Purpose** | Show **progress evidence for premium, intervention, or catch-up programmes** (e.g. Pupil Premium). |
| **Inputs** | Programme cohort definitions, intervention tracking, before/after mastery + predicted-grade movement, spend records |
| **Outputs** | Funding-impact evidence packs (cohort progress vs baseline, per-programme), audit-ready documentation |
| **Permissions** | `tenant:read(programme-cohorts)` school-scoped; aggregate/anonymised outputs for external submission |
| **Triggers** | Funding-reporting deadlines, programme end, auditor/leadership request |
| **Workflow** | Define programme cohort baseline → track intervention exposure → measure mastery/grade movement vs comparison → compile evidence pack with methodology notes → export |
| **Escalation** | Programme showing no impact → School Improvement (§3A.13) for redesign; data gaps → flag to admin |
| **APIs used** | `svc:cohort-analytics`, `svc:intervention-tracking`, `svc:reporting`, `router` |
| **Business value** | Turns funding compliance from burden into proof-of-value; a procurement-winning feature for UK schools |

### 3A.18 Lesson Planning Agent — *specialisation of Pedagogue.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Create **differentiated lessons by student ability** for a teacher's actual class. |
| **Inputs** | Class mastery distribution, topic weakness map, curriculum objectives, prior lesson outcomes |
| **Outputs** | Tiered lesson plans (remedial / core / enrichment), attached resources, pacing suggestions |
| **Permissions** | `class:read(mastery)` roster-scoped; `content:draft` — plans are drafts, teacher publishes |
| **Triggers** | Teacher request, new topic in scheme of work, post-assessment mastery shift |
| **Workflow** | Read class distribution → cluster by ability on the topic → generate tiered plan (ACU-priced from teacher/school pool) → attach generated resources → teacher review & publish |
| **Escalation** | Whole-class gap detected → Classroom Insight Agent (§3A.21); persistent low tier → Intervention Agent (§3A.20) |
| **APIs used** | `svc:learning-tools`, `svc:cohort-analytics`, `svc:acu-ledger`, `router` |
| **Business value** | Hours of differentiation work per week automated; the core Pedagogue.ai promise operationalised |

### 3A.19 Marking Assistant Agent — *specialisation of Pedagogue.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Support **feedback, rubric marking, and improvement advice**; teacher keeps final approval. |
| **Inputs** | Submissions (incl. multimodal/handwritten), rubric/mark scheme, class context, prior feedback style |
| **Outputs** | Rubric-aligned mark suggestions + confidence, drafted personalised feedback, improvement steps |
| **Permissions** | `submission:read` roster-scoped; `grade:suggest` — **never posts a final grade**; human-approval gate mandatory |
| **Triggers** | New submissions in the marking queue, teacher batch-marking session |
| **Workflow** | Parse submission vs rubric → suggest mark + evidence-linked comments → queue for teacher approval → on approval, grade posts and mastery updates |
| **Escalation** | Integrity/plagiarism signal → Fraud Detection Agent + teacher; systematic misconception → Classroom Insight (§3A.21) |
| **APIs used** | `svc:grading-model`, `svc:learning-tools`, `router` |
| **Business value** | Cuts marking load dramatically while keeping consistency and teacher authority |

### 3A.20 Intervention Agent — *specialisation of Pedagogue.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Create **targeted support plans for weak students**. |
| **Inputs** | Flagged students (teacher or Cohort Risk §3A.14), per-topic mastery gaps, intervention-effectiveness history |
| **Outputs** | Individual support plans (topics, tasks, cadence, checkpoints), progress-tracking hooks |
| **Permissions** | `student:read(mastery)` roster-scoped; `plan:draft`; consent-aware when parents are looped in |
| **Triggers** | Teacher flags a student, risk-sweep referral, failed checkpoint on an existing plan |
| **Workflow** | Diagnose gap roots (via knowledge graph) → select intervention pattern with best evidence for this profile → draft plan with checkpoints → teacher approves → track & adapt |
| **Escalation** | No progress after N checkpoints → recommend tutor referral (Staff Deployment §3A.15 / Matchmaker.ai); wellbeing signal → §3A.3 |
| **APIs used** | `svc:progress-intelligence`, `svc:intervention-tracking`, `svc:acu-ledger`, `router` |
| **Business value** | Standardises effective intervention; feeds the intervention-effectiveness model flywheel |

### 3A.21 Classroom Insight Agent — *specialisation of Pedagogue.ai*

| Field | Spec |
|---|---|
| **Purpose** | Tell the teacher **which topics need reteaching**. |
| **Inputs** | Class-level mastery by topic, quiz/assignment error patterns, question-difficulty calibration |
| **Outputs** | Reteach recommendations (topic, evidence, affected students), misconception summaries |
| **Permissions** | `class:read(analytics)` roster-scoped; advisory-only |
| **Triggers** | Post-assessment analysis, weekly class sweep, teacher query |
| **Workflow** | Separate "hard question" from "class-wide gap" (difficulty-calibrated) → identify misconception patterns → rank reteach priorities → deliver to teacher dashboard |
| **Escalation** | Gap spans multiple classes → School Improvement (§3A.13); single-student outliers → Intervention (§3A.20) |
| **APIs used** | `svc:cohort-analytics`, `svc:assessment`, `router` |
| **Business value** | Reteaching aimed at real gaps, not guesses — measurable class-level mastery lift |

### 3A.22 Tutor Growth Agent — *specialisation of Matchmaker.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Improve a tutor's **listing, pricing, and conversion**. |
| **Inputs** | Listing content & views→enquiry→booking funnel, marketplace comparables, review sentiment, demand by (Level, Subject, Topic) |
| **Outputs** | Listing improvement suggestions, pricing recommendations vs market, conversion diagnostics |
| **Permissions** | `tutor:read(own listing, own funnel)`, aggregate market reads only; `recommend:action` |
| **Triggers** | Funnel underperformance, market demand shift, tutor request, new-tutor onboarding |
| **Workflow** | Benchmark listing vs high-converting peers (aggregate) → diagnose funnel stage losses → recommend copy/pricing/availability changes → measure post-change lift |
| **Escalation** | Suspected review manipulation → Fraud Detection Agent + Sentinel.ai; systematic under-demand → suggest subject/level expansion |
| **APIs used** | `svc:marketplace`, `svc:monetisation`, `router` |
| **Business value** | Higher tutor earnings → tutor retention → deeper marketplace supply (take-rate compounding) |

### 3A.23 Session Prep Agent — *specialisation of Matchmaker.ai; ACU-metered*

| Field | Spec |
|---|---|
| **Purpose** | Generate **lesson plans before each session**, grounded in the booked student's actual gaps. |
| **Inputs** | Booking context, permissioned student diagnostic/mastery (deficit handoff), prior session notes, tutor's resource vault |
| **Outputs** | Pre-session lesson plan, suggested resources, "what changed since last session" brief |
| **Permissions** | `student:read(shared-context)` **only for booked, consented students**; `content:draft` |
| **Triggers** | T-24h before each booked session; post-booking (first-session prep) |
| **Workflow** | Pull permissioned gap summary → review last session's notes/outcomes → draft targeted plan from tutor's vault + generated material (ACU-priced) → tutor adjusts |
| **Escalation** | Consent absent → prep from tutor-visible data only, flag to tutor; gap outside tutor's specialism → suggest referral |
| **APIs used** | `svc:booking`, `svc:progress-intelligence` (scoped), `svc:learning-tools`, `svc:acu-ledger`, `router` |
| **Business value** | Every session starts targeted (day-one blueprint, every time); visibly better outcomes → reviews → bookings |

### 3A.24 Student Progress Agent (tutor-side) — *specialisation of Matchmaker.ai*

| Field | Spec |
|---|---|
| **Purpose** | Track **each tutored student** and recommend the **next tutoring focus**. |
| **Inputs** | Per-student session history, mastery movement on covered topics, package milestones, parent goals |
| **Outputs** | Per-student progress narratives, next-focus recommendations, milestone-completion evidence |
| **Permissions** | `student:read(shared-context)` booked+consented scope; `report:generate` for parent-facing summaries |
| **Triggers** | Post-session, package checkpoint, pre-renewal review |
| **Workflow** | Measure mastery delta on tutored topics → compare vs package milestones → recommend next focus → draft parent-facing progress summary for tutor approval |
| **Escalation** | Stalled progress → suggest approach change or Session Prep re-target; milestone dispute → escrow/dispute workflow |
| **APIs used** | `svc:progress-intelligence` (scoped), `svc:booking`, `svc:reporting`, `router` |
| **Business value** | Evidence-backed renewals and milestone releases; the mastery write-back loop made visible to the payer |

### 3A.25 Revenue Agent (tutor-side) — *specialisation of Matchmaker.ai*

| Field | Spec |
|---|---|
| **Purpose** | Monitor a tutor's **earnings, bookings, cancellations, and growth opportunities**. |
| **Inputs** | Earnings/payout history, booking pipeline & cancellation patterns, utilisation vs availability, seasonal demand |
| **Outputs** | Earnings analytics, cancellation-pattern warnings, utilisation recommendations, growth opportunities (group sessions, packages, new levels) |
| **Permissions** | `tutor:read(own earnings, own pipeline)`; `recommend:action`; never touches money movement |
| **Triggers** | Weekly business review, cancellation spike, utilisation drop, seasonal demand windows (exam season) |
| **Workflow** | Analyse pipeline & earnings trends → detect leaks (cancellations, unfilled slots) → recommend fixes + growth plays → track adoption & lift |
| **Escalation** | Payment anomalies → platform Payment Agent (§3.11); persistent cancellation abuse by clients → trust & safety |
| **APIs used** | `svc:monetisation`, `svc:booking`, `svc:payouts`, `router` |
| **Business value** | Treats tutors as businesses, not gig workers — the retention moat for marketplace supply |

> **Relationship to generics.** The three admin agents (§3A.1–§3A.3) do not replace
> §3.2/§3.4/§3.15 — they are the StudYear-tuned deployments the platform actually runs, with the
> ACU-wallet, minor-data and Control-Centre specifics wired in. The generic specs remain the
> reusable contract. The specialisation map: **Mentor.ai** → §3A.4–§3A.8 (student),
> **Concierge.ai** → §3A.9–§3A.12 (parent), **Principia.ai** → §3A.13–§3A.17 (school),
> **Pedagogue.ai** → §3A.18–§3A.21 (teacher), **Matchmaker.ai** → §3A.22–§3A.25 (tutor)
> (`docs/architecture/14-ai-agent-blueprint.md`) — all ACU-metered where they consume AI
> actions and consent/safeguarding-gated wherever minor data is involved. The underlying
> predictive signals come from the 13-model ML layer
> (`docs/product/studyear-product-spec.md §5a`).

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
