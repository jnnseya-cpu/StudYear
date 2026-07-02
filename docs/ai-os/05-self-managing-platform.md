# PART 4 · The Self-Managing Platform — Autonomous Operations Layer

> **Scope.** The tier of agents that keeps StudYear *up, correct, fast, cheap and safe* without
> a human in the middle of every incident. Six operations agents form a closed **self-healing
> control loop**: **System Health**, **Bug Detection**, **Auto-Repair**, **Infrastructure
> Optimisation**, **Release Management**, and **AI Governance**. They complement the enterprise
> workforce (`docs/ai-os/04-multi-agent-ecosystem.md`) and the tenant domain agent
> **Sentinel.ai** (`docs/architecture/14-ai-agent-blueprint.md`).
>
> **Ground truth.** Every autonomous action is **metered against the ACU Wallet** (per-action
> cost, hard stop at zero), **RBAC-checked**, and written to the **immutable audit log**
> (`docs/ai-os/06-security-compliance.md`). Runtime topology (Next.js edge, Node.js/PHP
> services, FastAPI/LLM workers, Redis queues, MariaDB composite-key shards, vector DB + RAG,
> Model Router) is defined in `docs/ai-os/10-production-architecture.md`.

**Proven patterns only.** Google **SRE** (SLOs, error budgets, toil elimination), **progressive
delivery** (canary, blue-green, feature flags — LaunchDarkly/Argo Rollouts), **automated
rollback**, **AIOps** anomaly detection & correlation (ServiceNow/Datadog/Dynatrace), Netflix
**chaos engineering**, and Google **change-is-the-#1-cause-of-outages** discipline (guard the
deploy path first).

---

## 1. The self-healing control loop

A MAPE-K loop (IBM autonomic computing — the canonical self-managing pattern): **Monitor →
Analyze → Plan → Execute**, over shared **Knowledge**. Each agent owns a phase or an action
class; the loop is bounded, budgeted and auditable.

```
              ┌──────────────────────── KNOWLEDGE ────────────────────────┐
              │  SLOs · error budgets · topology · deploy history ·        │
              │  runbooks (as code) · ontology · audit log · ACU ledger    │
              └───────────────┬───────────────────────────┬───────────────┘
                              │                           │
   ┌─────────── MONITOR ──────┴──────┐        ┌───────────┴──── ANALYZE ─────────┐
   │  System Health Agent            │        │  Bug Detection Agent             │
   │  uptime · latency · errors ·    │───────▶│  defects · regressions · anomaly │
   │  saturation · failures          │ signal │  correlation · root-cause        │
   └─────────────────────────────────┘        └───────────────┬──────────────────┘
                              ▲                                │ diagnosis
                              │ verify                         ▼
   ┌─────────── EXECUTE ──────┴──────┐        ┌───────────── PLAN ───────────────┐
   │  Auto-Repair Agent              │◀───────│  choose remedy:                  │
   │  restart · rollback · patch ·   │  plan  │  rollback | scale | patch |      │
   │  scale · failover · redeploy    │        │  flag-off | failover             │
   └──────────────┬──────────────────┘        └──────────────────────────────────┘
                  │                    ┌──────────────────────────────────────────┐
   Infra Optimisation Agent (cost/perf)│  Release Mgmt Agent (safe change path)   │
   Governance Agent (AI policy/guardrails, wraps every EXECUTE with a HITL gate)  │
                  └──────────────────────────────────────────────────────────────┘
                          ▲ escalate to human on gate / low confidence / blast-radius
```

**Loop invariants:** (1) every EXECUTE action is **reversible-first** (prefer rollback/flag-off
over forward-fix); (2) actions above a **blast-radius or ACU threshold** require a HITL gate;
(3) an action that does not **verify recovery** within its window auto-escalates; (4) all four
phases append to the audit log with reason codes.

---

## 2. System Health Agent

| Field | Spec |
|---|---|
| **Purpose** | Continuous observability + detection of uptime, latency, error and saturation degradations across every tier and tenant shard. |
| **Signals monitored** | Uptime/availability, p50/p95/p99 latency, error rate (5xx, exceptions), **saturation** (CPU/mem/queue depth/DB connections) — the **Four Golden Signals** + Redis queue lag, LLM-worker timeouts, Model Router provider health, per-tenant shard health |
| **Actions taken** | Raise/clear alerts, open incidents, correlate multi-signal events, page on-call, trigger Bug Detection analysis, feed error-budget burn |
| **Autonomy level** | **A2** — autonomous detection/alerting/incident creation; no remediation (hands off to Auto-Repair) |
| **Guardrails** | Alert on **symptoms + SLO burn**, not raw thresholds (reduces noise/toil); dedup + correlate before paging; rate-limit alerts; ACU-metered analysis calls |
| **Escalation** | SLO fast-burn → page on-call + Auto-Repair; provider outage → Model Router failover + CTO Agent; security-shaped anomaly → **SOC Agent** (`04 §2.5`) |

**Pattern:** Golden-Signals + SLO burn-rate alerting (Google SRE) — alert on user-facing pain
and budget consumption, not every CPU spike.

---

## 3. Bug Detection Agent

| Field | Spec |
|---|---|
| **Purpose** | Detect bugs, defects and regressions in production and pre-prod; localize root cause for remediation. |
| **Signals monitored** | Exception/stack-trace streams, error-rate deltas post-deploy, log anomalies, **regression** vs golden-set evals, contract-test failures, user-reported defects (from Support Agent), latency/behavior drift |
| **Actions taken** | Cluster + dedup errors, correlate to **recent change** (deploy/flag/config), rank by severity × blast radius, produce root-cause hypothesis + candidate fix, file typed defect, hand to Auto-Repair |
| **Autonomy level** | **A2** — autonomous diagnosis + defect filing; no code merge |
| **Guardrails** | Every diagnosis grounded in evidence (traces/diffs), not speculation; confidence score gates auto vs human; regression check against golden set before proposing fix |
| **Escalation** | Low-confidence root cause → Engineering agents (`04 §2.3`); security bug → **Vulnerability Agent**; data-corruption → **Database Agent** + freeze |

**Pattern:** change-correlation first (most incidents follow a change) + AIOps anomaly
clustering; regression gating via golden-set evals shared with `04 §4.5`.

---

## 4. Auto-Repair Agent

| Field | Spec |
|---|---|
| **Purpose** | Execute remediation — restart, rollback, patch, scale, failover, redeploy — to restore SLOs with minimum blast radius. |
| **Signals monitored** | Incident + diagnosis from Health/Bug agents, deploy history, flag state, current SLO/error-budget position |
| **Actions taken** | **Reversible-first ladder:** (1) retry/restart → (2) feature-flag off → (3) **auto-rollback** to last-good → (4) scale out / shed load → (5) provider failover → (6) apply verified patch + redeploy (canary) |
| **Autonomy level** | **A2** for reversible actions (restart, flag-off, rollback, scale); **A3 requires HITL** for forward-fix patches touching data or irreversible changes |
| **Guardrails** | Prefer rollback over forward-fix; **blast-radius cap** (start at one shard/canary); **idempotent** actions with keys; **ACU budget** per repair; **verify recovery** in window or auto-revert + escalate; never repair during an active governance freeze |
| **Escalation** | Repair fails to verify → page on-call + Release Management freeze; irreversible/data action → **HITL gate**; repeated flaps → Infra Optimisation + CTO Agent |

**Pattern:** automated rollback + progressive re-deploy (Argo Rollouts / Spinnaker);
"reversible-first" mirrors Google SRE's rollback-over-debug-in-prod stance.

---

## 5. Infrastructure Optimisation Agent

| Field | Spec |
|---|---|
| **Purpose** | Right-size compute, storage, bandwidth and cloud/provider spend while holding SLOs. |
| **Signals monitored** | Utilization vs allocation, Redis/queue depth, DB shard load & storage growth, CDN/bandwidth, **Model Router provider cost/latency**, ACU cost-per-action, idle/over-provisioned resources |
| **Actions taken** | Autoscale policies, shard rebalancing proposals, cache/RAG tuning, storage tiering/retention, bandwidth/CDN optimization, model-tier routing shifts (cheap tier for high-volume classify), commitment/reservation recommendations |
| **Autonomy level** | **A2** for reversible scaling within envelope; **A1 (recommend)** for spend-commitments, shard topology, retention changes (CFO/CTO sign-off) |
| **Guardrails** | Never trade below SLO to save cost (SLO is the hard constraint); changes are reversible + rate-limited; **CFO Agent** budget envelope (`04 §2.1`); ACU-metered; capacity headroom floor |
| **Escalation** | Cost anomaly → CFO Agent; capacity risk → Infrastructure Agent (`04 §2.3`); provider cost spike → Model Router policy review + CTO Agent |

**Pattern:** FinOps + SRE capacity planning; optimize cost *subject to* SLO, never at its
expense. Model-tier routing economics tie to `docs/architecture/14 §0.1`.

---

## 6. Release Management Agent

| Field | Spec |
|---|---|
| **Purpose** | Own the safe change path: every deployment ships via progressive delivery with automated gates and rollback. |
| **Signals monitored** | CI status, eval/coverage gates, canary health (Golden Signals on the new version), flag exposure, change calendar/freeze windows, dependency & migration safety |
| **Actions taken** | Gate merges, orchestrate **canary → progressive → full** (or blue-green), run migrations safely, promote on healthy metrics, **auto-rollback on regression**, manage feature flags, publish release notes + audit record |
| **Autonomy level** | **A2** — autonomous promote/rollback within gates; **A1** for schema-breaking migrations & major releases (human approve) |
| **Guardrails** | No direct-to-`main`; **all gates green** (tests, evals, security, perf) before canary; canary bake time + automatic **error-budget check**; freeze windows honored; migrations backward-compatible (expand/contract); dual-control on prod DB changes |
| **Escalation** | Canary regression → Auto-Repair rollback + Bug Detection; gate failure → owning Engineering agent; freeze conflict → COO/CTO Agent |

**Pattern:** progressive delivery (canary/blue-green + flags) with **error-budget-gated
promotion** (DORA/SRE); rollback is the default failure response. Engineering agents (`04 §2.3`)
open PRs; this agent is the only path to production.

---

## 7. AI Governance Agent

| Field | Spec |
|---|---|
| **Purpose** | Govern AI *behaviour* itself: instructions, permissions, policy enforcement, guardrails, and safe autonomy across **all** agents (enterprise, ops, and domain). |
| **Signals monitored** | Agent action stream + reason codes, tool-use vs permission scope (least-privilege drift), prompt/model versions, eval scores & drift, guardrail hits, HITL-gate outcomes, ACU spend per agent, jailbreak/anomalous-output signals |
| **Actions taken** | Enforce policy-as-code on every action, **pause/kill-switch** misbehaving agents, revoke/adjust permissions, require HITL gates, quarantine bad prompt/model versions, gate prompt/model changes on golden-set evals, enforce data-residency (minor data), publish governance reports |
| **Autonomy level** | **A2 to restrict/halt** (fail-safe: it may always stop an agent); **A1/HITL to loosen** any control (Platform Admin + dual-control) |
| **Guardrails** | Governance can only *tighten* autonomously; loosening needs human; separation-of-duties (cannot deploy code); every enforcement immutably logged; ties to **Admin Control Agent** (`04 §3.15`) kill-switches |
| **Escalation** | Policy violation → Admin Control Agent + relevant human (DPO/MLRO/CTO); harmful-output → freeze agent + SOC; permission drift → Identity Agent (`04 §2.5`) |

**Pattern:** policy-as-code (OPA-style) + model/prompt eval gates + kill-switch — the AI-safety
control plane. Cross-references the AI Governance controls in `docs/ai-os/06-security-compliance.md`.

---

## 8. Autonomy & guardrail summary

| Agent | Autonomy (default) | Reversible actions (auto) | Requires HITL |
|---|---|---|---|
| System Health | A2 | alert, incident, page, correlate | — |
| Bug Detection | A2 | diagnose, cluster, file defect | — (no code merge) |
| Auto-Repair | A2 | restart, flag-off, rollback, scale, failover | forward-fix patch, data-touching, irreversible |
| Infra Optimisation | A2 / A1 | autoscale in-envelope, cache tune | spend-commit, shard topology, retention |
| Release Management | A2 / A1 | canary promote, auto-rollback, flags | schema-breaking migration, major release |
| AI Governance | A2 (restrict) | pause, kill-switch, revoke perms, quarantine | loosening any control |

**Universal guardrails (all six):** reversible-first · blast-radius caps · idempotency keys ·
ACU pre-flight metering (hard stop at zero) · verify-recovery-or-escalate · immutable audit
with reason codes · honor governance freeze.

---

## 9. SLO & error-budget model

Reliability is a **budget**, not a wish. Targets drive alerting *and* automated actions.

| Service tier | SLI | SLO target | Error budget (30d) | Automated response on burn |
|---|---|---|---|---|
| Core app (Next.js edge) | Availability | 99.9% | ~43m 49s | fast-burn → page + Auto-Repair rollback |
| API / backend (Node/PHP) | Success rate (non-5xx) | 99.9% | ~43m | canary halt + rollback |
| LLM workers (FastAPI) | p95 latency | < 3s | 1% > 3s | Model Router reroute / scale |
| Model Router | Provider availability | 99.95% | ~21m | automatic provider failover |
| Payments (Stripe/BitriPay) | Success rate | 99.95% | ~21m | dunning + Payment Agent + page |
| ACU ledger | Correctness | 100% (zero tolerance) | 0 | freeze writes + escalate (financial) |

**Error-budget policy (SRE):**

- **Budget healthy** → ship fast; Release Management promotes autonomously; higher change velocity.
- **Budget < 50%** → tighten canary bake times; Infra Optimisation holds risky cost cuts.
- **Budget exhausted** → **change freeze** (Release Management blocks non-critical deploys);
  only reliability work + reversible fixes ship until budget recovers. Overrides need CTO Agent
  + human.
- **Burn-rate alerting:** multi-window (fast 1h + slow 6h) to catch acute vs slow burns without
  noise (Google SRE multi-window multi-burn-rate).

**Toil budget:** anything the six agents automate must reduce human toil; residual manual toil
is tracked and fed to the COO Agent (`04 §2.1`) as an OKR.

---

## 10. Incident lifecycle (agent-driven, human-gated)

```
detect (Health) → triage/correlate (Health+Bug) → diagnose/RCA (Bug) →
  remediate reversible-first (Auto-Repair) → verify recovery →
    ├─ recovered → auto-resolve + blameless postmortem draft (Governance logs)
    └─ not recovered / blast-radius / irreversible → HITL gate → on-call human
       → (Release freeze if budget-exhausted) → forward-fix via PR (Eng agents)
       → Release Management canary redeploy → verify → close
```

Every transition is audited; postmortems are **blameless** (SRE) and feed the Knowledge base so
the loop learns. ACU cost of the incident response is attributed and reported to CFO Agent.

---

## 11. Cross-references

- Enterprise + Core AI Agents, orchestration, tool-use contract, autonomy tiers — `docs/ai-os/04-multi-agent-ecosystem.md`
- Security, audit log, policy-as-code, AI governance controls, DPO/MLRO gates — `docs/ai-os/06-security-compliance.md`
- Runtime topology, queues, sharding, Model Router, deploy pipeline — `docs/ai-os/10-production-architecture.md`
- Tenant domain agents (Sentinel.ai et al.) & Model Router foundation — `docs/architecture/14-ai-agent-blueprint.md`
