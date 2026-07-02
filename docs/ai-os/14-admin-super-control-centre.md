# PART 4 · The Admin Super Control Centre

> **Scope.** The Admin Super Control Centre (module 20, *Admin Control Panel*) is the single pane of glass through which the **Platform Admin** operates StudYear as a business and as a regulated data processor. It sits above every tenant, every role, and every engine. It is the human counterpart to **Sentinel.ai**, the platform-level supervisory agent (see `docs/ai-os/04-multi-agent-ecosystem.md`).
>
> This document specifies each control-centre section using a fixed schema: **What it shows · Admin actions · AI agent assist · Permissions · Audit requirements**. It then specifies four cross-cutting surfaces — the Admin KPI Dashboard, the Moderation/Abuse Queue, the Refunds/Credits Workflow, and the AI-Safety Monitoring Panel.
>
> Related: `docs/ai-os/10-production-architecture.md` (tenancy, data plane), `docs/ai-os/13-monetisation.md` (ACU economics, plans), `docs/ai-os/04-multi-agent-ecosystem.md` (agent contracts).

---

## 0. Design principles (proven patterns only)

| Principle | Source pattern | How it applies to StudYear |
|---|---|---|
| **Read-mostly, action-gated** | Stripe Dashboard, AWS Console | 95% of admin work is observation; every mutating action passes through a typed action + reason + audit event. |
| **Break-glass, not god-mode** | Google SRE, Netflix | No standing super-user access to tenant PII. Elevated access is time-boxed, reason-required, and dual-logged. |
| **Everything is an event** | Segment, Datadog | Every admin action emits an immutable audit event to the Audit Logs module (18). |
| **Agent proposes, admin disposes** | GitHub Copilot, Intercom Fin | Sentinel.ai drafts decisions (approve, refund, suspend); a human confirms anything irreversible or money-moving. |
| **Tenant isolation by default** | Salesforce, Shopify Plus | Admin views are cross-tenant; admin *writes* into a tenant require explicit tenant context + justification. |
| **Least privilege + RBAC/ABAC** | Okta, AWS IAM | Admin roles are decomposed (see §12); nobody holds all scopes. |

**Global guarantees enforced on every screen**
- **Hard ACU stop at zero** is never overridable silently; only an explicit, audited credit grant changes a balance.
- **Minor-safety**: student accounts are treated as belonging to minors by default; PII exposure to admins is redacted unless break-glass is invoked.
- **Money + credits are double-entry**: no balance is mutated except via a ledgered transaction (see §5).

---

## 0b. Admin console navigation (resolved IA — directive)

The console's information architecture, **on top of everything specified below**:

| # | Nav section | Maps to |
|---|---|---|
| 1 | **Dashboard** | KPI dashboard (§KPI) — usage, revenue, ACU consumption, growth |
| 2 | **Users** | identity control (§1) — students, parents, teachers, schools, tutors, orgs |
| 3 | **Tutor applications** | approval queue: identity + DBS evidence → approve/reject (§1, venture brief §10.2) |
| 4 | **Blog** | AI-powered blog console — SY-A22 drafts → review → publish (`../product/marketing-engine.md`) |
| 5 | **Content** | content library, moderation queue, verification scores (§6/§Moderation) |
| 6 | **Revenue & billing** | payments, subscriptions, plans, ACU packs, refunds/credits (§3/§5/§7) |
| 7 | **AI costs** | per-tool/provider inference cost, margin-band watch (66–100%, commercial-model §1), thinking-budget telemetry |
| 8 | **Analytics** | platform analytics — engagement, cohort adoption, funnel, SEO first-page share (SY-A24) |
| 9 | **Fraud** | Sentinel/SY-A20 queues — ACU abuse, payment anomalies, growth-programme fraud signals |
| 10 | **Support** | ticket queues with agent-drafted replies (§6) |
| 11 | **Contact inbox** | inbound email/contact-form messages ("Talk to our team" B2B route included) |
| 12 | **Settings** | platform config: policy, taxonomy, pricing console, discount codes (§12b commercial-model), feature limits, RBAC |

### Admin account privileges (directive)

- **Free unlimited AI:** the Platform Admin account uses **all AI features without ACU
  limits** — admin usage is unmetered against any wallet, but still **cost-logged** to the
  AI-costs section (internal platform cost, visible, never billed) and still audited per
  action. Unlimited applies to *usage*; it never bypasses safety guardrails or audit.
- **Editable account & profile pictures:** the admin can edit **their own account
  picture/profile picture**, and can **edit any user's account/profile picture** (e.g.
  moderation of inappropriate images) — every such edit is an audited action with the
  prior image retained in the audit trail.

## 1. Users, Students, Parents, Teachers, Tutors (Identity Control)

**What it shows**
- Unified people directory across all tenants: role(s), tenant(s), status (active/pending/suspended/dormant/deleted), MFA state, last login, linked parent/child edges, plan, ACU balance snapshot.
- Minor flag, guardian-consent state, verification level (email, phone, school-verified, ID-verified for tutors).
- Session & device list; risk score from Sentinel.ai (velocity, geo, sharing signals).

**Admin actions**
| Action | Reversible? | Confirmation | Money/credit impact |
|---|---|---|---|
| View profile (redacted) | — | none | no |
| Break-glass full PII view | — | reason + 15-min TTL | no |
| Reset MFA / force logout | yes | single | no |
| Suspend / reinstate | yes | reason | pauses billing |
| Merge duplicate accounts | hard | dual-control | ledger reconcile |
| Impersonate (support session) | yes | reason + consent flag + banner | read-only by default |
| Delete / anonymise (GDPR) | hard | dual-control + 30-day soft window | see §9 |
| Re-parent child ↔ guardian | yes | reason | no |

**AI agent assist — Sentinel.ai / Admin Control Agent**
- Flags likely duplicate or fraudulent accounts, credential-sharing, and abnormal minor↔adult linkages.
- Drafts suspension rationale; suggests reinstatement when risk decays.
- Never impersonates or views un-redacted PII on its own; it operates on hashed/feature vectors.

**Permissions:** `identity.read`, `identity.pii.breakglass`, `identity.write`, `identity.impersonate`, `identity.delete` (each independently grantable).

**Audit:** every view of un-redacted PII, impersonation start/stop, suspension, merge, and deletion is a discrete event with actor, target, tenant, reason, before/after hash, and TTL. Impersonation sessions record a full action transcript.

---

## 2. Businesses / Schools / Organisations & Tutor Onboarding (Tenant Control)

**What it shows**
- Tenant registry: sub-domain, tenant type (School / Organisation / Independent Tutor), shard, plan, seat counts (teachers/students), shared ACU pool balance, verification docs, contract dates, admission status.
- Approval queue for **new school & tutor accounts** with submitted evidence (DfE/URN or national school ID, tutor DBS/ID/qualifications, org registration number).
- Adoption funnel per tenant: invited → activated → weekly-active seats.

**Admin actions**
| Action | Notes |
|---|---|
| **Approve / reject school account** | Requires verification checklist complete; rejection carries a reason code returned to applicant. |
| **Approve / reject tutor account** | Gated on ID + safeguarding checks (DBS/equivalent) for anyone working with minors. |
| Provision / decommission sub-domain & shard | dual-control; triggers infra workflow (see `10-production-architecture.md`). |
| Set / change plan & seat entitlements | flows to Billing (§5). |
| Configure shared ACU pool & allocation policy | see §4. |
| Suspend tenant (non-payment / abuse) | freezes writes, preserves data, notifies owner. |
| Assign Customer Success owner | routing only. |

**AI agent assist — Sentinel.ai + Principia.ai/Matchmaker.ai handoff**
- Auto-validates submitted documents (URN format, expiry dates, DBS certificate number checksums) and scores application completeness.
- **Matchmaker.ai** cross-checks tutor credentials and prior dispute history before approval.
- Flags tenants whose usage or refund patterns deviate from cohort norms (churn / fraud early warning).

**Permissions:** `tenant.read`, `tenant.approve`, `tenant.provision`, `tenant.plan.write`, `tenant.suspend`.

**Audit:** approval/rejection decisions store the full evidence snapshot, checklist state, agent recommendation, and human decider. Safeguarding-relevant checks are retained per compliance schedule (§9) even after tenant deletion.

---

## 3. Transactions, Payments & Payment APIs (Stripe live + BitriPay planned)

**What it shows**
- Global payments ledger: charges, refunds, chargebacks, disputes, payouts (tutor marketplace), subscription invoices, one-off ACU pack purchases.
- Provider health: **Stripe** (live) and **BitriPay** (planned) connector status, webhook lag, signature-verification failures, retry backlog.
- Per-transaction trace: intent → gateway → webhook → ledger → ACU credit fulfilment.
- Failed/at-risk payments, dunning state, involuntary churn cohort.

**Admin actions**
| Action | Guardrails |
|---|---|
| Inspect a payment end-to-end | read; PAN never stored/shown (PCI, see §10 PRR in `15`) |
| Trigger manual retry / replay webhook | idempotency-keyed |
| Issue refund (full/partial) | routes to §7 workflow |
| Respond to dispute / submit evidence | dual-control for >£X |
| Toggle payment provider / failover Stripe↔BitriPay | dual-control, feature-flag |
| Reconcile ledger vs gateway | read-write on ledger only via adjustment entries |

**AI agent assist — Sentinel.ai**
- Detects webhook gaps (charge succeeded but ACU never credited) and drafts a reconciliation entry.
- Fraud-scores transactions (BIN velocity, mismatched geo, ACU-then-refund abuse) and recommends holds.
- Predicts involuntary churn and proposes dunning sequences.

**Permissions:** `payments.read`, `payments.refund`, `payments.dispute`, `payments.provider.config`, `ledger.adjust`.

**Audit:** every refund, dispute action, provider toggle, and ledger adjustment is logged with amount, currency, provider ref, reason, and dual-control approver. Card data handling is out-of-scope (delegated to Stripe/BitriPay vaults) and this is asserted in audit metadata.

---

## 4. ACU Economics (Wallet, Top-ups, Deductions, Refunds, Cost, Fraud, School Pools)

> The **ACU Wallet** (engine 5, module 13) is the metering and monetisation substrate. Admin has full economic visibility here. Cost model detail lives in `docs/ai-os/13-monetisation.md`; this section is the *operational control* surface.

**What it shows**
- Global ACU supply view: total outstanding balances (a liability), issued vs consumed, breakage, average balance by plan/role.
- Per-account & per-tenant wallet: current balance, low-balance/at-zero state, top-up history, deduction stream by action type, refund/adjustment history.
- **Per-action cost table** (the price list) — the ACU cost of each metered action, versioned.
- **Shared school pools**: pool balance, per-teacher/per-student allocation caps, burn-down rate, projected exhaustion date.
- Fraud/abuse signals: ACU farming, refund-cycling, pool draining, prompt-spam.

**Per-action ACU cost table (illustrative, versioned & admin-editable)**

| Action | Engine / module | ACU cost (v-tag) | Fraud sensitivity |
|---|---|---|---|
| Diagnostic assessment run | Diagnostic Engine | high | medium |
| AI Tutor message (per turn) | AI Tutor / Mentor.ai | low–medium | high (spam) |
| Study plan generation | Study Planner | medium | low |
| Assignment review pass | Assignment Review | medium | medium |
| Resource generation (worksheet/quiz) | Resource Generator | medium–high | medium |
| Progress report synthesis | Progress Dashboard | medium | low |
| Bulk class resource pack | Teacher Workspace | high (pooled) | high (drain) |

*(Numeric values are governed in `13-monetisation.md`; the admin edits them here through a versioned, effective-dated price list.)*

**Admin actions**

> **Universal grant & plan authority:** the Platform Admin can grant **free ACUs to any
> user in any category** (student, parent, teacher, school, tutor, organisation) and can
> **change any user's subscription model** (upgrade, downgrade, switch plan family, comp a
> plan). Both are first-class, audited actions — a grant is a ledgered goodwill entry, a
> plan change is an entitlement event (see §5 "force plan change") — never a silent DB edit.

| Action | Guardrails | Ledgered? |
|---|---|---|
| Manual top-up / grant goodwill credit — **any user, any category** | reason + cap + dual-control above threshold | yes (double-entry) |
| Change / comp a user's subscription model | entitlement event; effective-dated; dual-control for revenue-negative bulk changes | plan-change event |
| Deduct / claw back (abuse correction) | reason + dual-control | yes |
| Refund ACU to money or re-credit | ties to §7 | yes |
| Edit per-action cost (new version) | effective-dated, cannot backdate applied usage | price-list version event |
| Set pool allocation & caps | per tenant | config event |
| Freeze wallet (fraud hold) | reason; blocks deductions AND top-ups | yes |
| Configure hard-stop / low-balance thresholds | global + tenant override | config event |

**Fraud checks (Sentinel.ai economic guardrails)**
- **Velocity**: abnormal ACU burn per minute → soft throttle then hold.
- **Top-up-then-refund cycling**: repeated small top-ups reversed → flag + freeze.
- **Pool draining**: single seat consuming a disproportionate share of a school pool → cap + alert to Principia.ai.
- **Zero-cost exploitation**: attempts to trigger metered actions that bypass deduction → block + incident.

**AI agent assist — Sentinel.ai (economic guardian)**
- Reconciles issued vs consumed ACU nightly; surfaces breakage and leakage.
- Recommends goodwill credits sized to incident severity; drafts the ledger entry for human approval.
- Forecasts pool exhaustion and nudges the School Command Centre before a hard stop hits a classroom mid-lesson.

**Permissions:** `acu.read`, `acu.grant`, `acu.clawback`, `acu.pricelist.write`, `acu.pool.config`, `acu.freeze`.

**Audit:** the ACU ledger is **append-only, double-entry**. Every grant/deduction/refund/price-change/freeze is an immutable entry with actor, reason, amount, resulting balance, and (for grants) money-source or goodwill classification. Price-list changes are versioned and never retroactively reprice consumed ACU.

---

## 5. Plans, Pricing & Billing Control

**What it shows**
- Plan catalogue (Student/Parent/School/Tutor tiers), ACU pack SKUs, add-ons, promo codes, entitlements matrix, tax/VAT config by region.
- Subscription roster: MRR/ARR contribution, trials, upgrades/downgrades, cancellations, dunning.
- Mapping of plan → seat entitlements → included ACU allowance → overage behaviour.

**Admin actions:** create/version plans & packs; set prices and included-ACU; issue promo/discount codes; grant trial extensions; force plan change; manage tax settings. Money-moving changes are dual-controlled and effective-dated.

**AI agent assist — Sentinel.ai:** proposes pricing experiments, flags plans with negative unit economics (ACU cost > revenue), and identifies upsell candidates. Recommendations only; pricing changes are human-committed.

**Permissions:** `billing.plan.read`, `billing.plan.write`, `billing.promo.write`.

**Audit:** plan/price/promo mutations versioned with before/after and approver. Cross-reference `13-monetisation.md`.

---

## 6. Support Tickets, Announcements & Comms

**What it shows**
- Support queue (SLA timers, priority, tenant, role, linked incidents), CSAT, backlog age, first-response/resolution metrics.
- Announcement/broadcast console (targeting by role/tenant/plan/cohort), scheduled vs sent, delivery/open rates.
- Notification health (module 15): channel status (email/in-app/push), bounce/complaint rates.

**Admin actions:** triage/assign/escalate tickets; canned + AI-drafted replies; open incidents; compose & schedule announcements with role/tenant targeting; roll back a mis-sent broadcast (recall in-app, suppress pending sends).

**AI agent assist — Sentinel.ai / Concierge.ai / Principia.ai:** auto-classifies and routes tickets, drafts replies grounded in the knowledge base and the user's actual account/ACU state, suggests announcement copy, and predicts SLA breaches. Minor-facing comms are policy-checked before send.

**Permissions:** `support.read`, `support.write`, `comms.broadcast`. Broadcasts to minors require `comms.minor.approve`.

**Audit:** ticket actions, impersonation-from-ticket, and every broadcast (audience query, content, sender) are logged. Recalls record scope and reason.

---

## 7. Refunds & Credits Workflow (money + ACU)

**What it shows:** unified refund/credit queue spanning card refunds (Stripe/BitriPay) and ACU credits, with request source (user, support, auto-detected fault), amount, reason code, risk score, and policy eligibility.

**Workflow (state machine)**

| State | Owner | Entry condition | Exit |
|---|---|---|---|
| `requested` | user/support/Sentinel.ai | refund/credit initiated | → triage |
| `triaged` | Sentinel.ai | policy + fraud check applied | → auto-approve / needs-review |
| `needs_review` | admin | above auto-limit or high risk | → approved / rejected |
| `approved` | admin (dual-control > threshold) | decision made | → executing |
| `executing` | system | ledger + gateway calls (idempotent) | → settled / failed |
| `settled` | — | money refunded and/or ACU re-credited | terminal |
| `rejected` | admin | policy fail | terminal + user notice |

**Rules**
- ACU already **consumed** is not auto-refundable; goodwill re-credit is a separate, reasoned grant.
- Card refund and ACU claw-back are transactionally linked when a purchase is reversed (no free ACU on refunded money).
- Auto-approval only under configurable limit *and* low fraud score; everything else is human-gated.

**AI agent assist — Sentinel.ai:** evaluates policy fit, detects refund-abuse patterns (§4), sizes goodwill credits, and drafts the paired money+ACU ledger entries.

**Permissions:** `refund.approve`, `acu.grant`, `refund.policy.write`. **Audit:** each transition logged with actor, amount(s), reason, linked gateway + ledger refs, and approver chain.

---

## 8. Content Moderation & Abuse Queue

**What it shows:** a prioritised queue of flagged content and behaviour — generated resources, tutor profiles/messages, AI Tutor conversations (esp. minor-facing), uploaded files, marketplace listings, reported users. Each item carries: source, classifier scores (safety/toxicity/PII/academic-integrity), reporter, tenant, minor-involved flag, and Sentinel.ai recommended action.

**Queue design (proven: YouTube/Meta trust-&-safety)**
- **Severity lanes:** P0 child-safety (immediate, human-mandatory) → P1 harmful/abuse → P2 policy → P3 quality.
- **SLA per lane**; P0 cannot be auto-actioned and cannot be closed by an agent alone.
- **Double-review** for account termination and any P0.

**Admin actions:** approve/remove content; warn/suspend/terminate user; quarantine a tenant's generated output; escalate to safeguarding/legal; add pattern to blocklist; label for model-eval feedback.

**AI agent assist — Sentinel.ai:** pre-triages, clusters similar reports, redacts PII in the review pane, proposes actions with rationale and confidence. For minor-safety it only *routes and prepares*; a human decides.

**Permissions:** `moderation.read`, `moderation.action`, `moderation.terminate`, `safeguarding.escalate`.

**Audit:** full retention of flagged item, classifier scores, reviewer, decision, and rationale. P0 items follow a stricter, legally-aligned retention and are immutable.

---

## 9. Compliance, GDPR & Data Governance

**What it shows:** DSAR/SAR queue (access, rectification, erasure, portability), consent & guardian-consent ledger, data-retention schedules by data class, processing-activity register (RoPA), sub-processor list, breach-incident register, regional data-residency posture, cookie/consent state.

**Admin actions**
| Action | Guardrails |
|---|---|
| Fulfil DSAR (export bundle) | scoped to subject; minor requests via verified guardian |
| Right-to-erasure / anonymise | dual-control; 30-day soft-delete; safeguarding data exempt where lawful |
| Manage consent / withdraw | propagates to agents (halts training/personalisation use) |
| Configure retention schedule | per data class; append-only change log |
| Record & manage breach incident | statutory clock, notification workflow |
| Manage sub-processors & DPAs | version-controlled register |

**AI agent assist — Sentinel.ai:** assembles DSAR bundles across shards, redacts third-party PII, flags data held past retention, and drafts breach-notification timelines. It cannot approve an erasure or breach notification — human + legal sign-off required.

**Permissions:** `gdpr.dsar`, `gdpr.erasure`, `gdpr.retention.config`, `gdpr.breach`, `consent.manage`.

**Audit:** every DSAR, erasure, consent change, and retention edit is logged and itself retained per statutory minimums. Erasure produces a tombstone proving deletion without retaining the erased PII. See `10-production-architecture.md` for storage/residency mechanics.

---

## 10. Agents & Automations Control

**What it shows:** registry of all named agents (Sentinel.ai, Principia.ai, Pedagogue.ai, Mentor.ai, Concierge.ai, Matchmaker.ai) and background automations: version, enabled scopes, tool grants, model-router routing, autonomy level (suggest / act-with-approval / auto), ACU cost per invocation, error/timeout rate, human-override rate.

**Admin actions:** enable/disable an agent or a specific tool globally or per tenant; set autonomy ceiling; pin/rollback agent or prompt version; adjust model-router policy (provider/cost/latency); set per-agent ACU budgets; kill-switch a runaway automation.

**AI agent assist — Sentinel.ai (supervisor of supervisors):** monitors sibling agents for loops, cost spikes, degraded output quality, and policy drift; auto-throttles and pages the admin. It proposes but never grants itself new scopes.

**Permissions:** `agents.read`, `agents.toggle`, `agents.autonomy.write`, `agents.version.write`, `router.config`.

**Audit:** every scope/tool toggle, autonomy change, version pin/rollback, and kill-switch is logged. Agent actions are themselves audited via the multi-agent event bus (`04-multi-agent-ecosystem.md`).

---

## 11. Disputes Management

**What it shows:** consolidated disputes across payments (chargebacks), tutor marketplace (service/quality/refund), and content (IP/appeal) — with state, deadline clock, evidence bundle, counterparty, and monetary/ACU exposure.

**Admin actions:** gather & submit evidence; accept/contest; refund-to-resolve; suspend a tutor pending outcome; record arbitration decision; apply outcome to ACU/money ledger.

**AI agent assist — Sentinel.ai + Matchmaker.ai:** assembles evidence (transaction trail, session logs, ratings), predicts win probability on chargebacks, and recommends contest-vs-refund based on cost. Matchmaker.ai supplies tutor-side context.

**Permissions:** `disputes.read`, `disputes.action`, `tutor.suspend`. **Audit:** evidence bundles, decisions, deadlines, and financial outcomes logged immutably.

---

## 12. Roles & Permissions Administration (RBAC/ABAC)

**What it shows:** admin-role catalogue and scope matrix; who holds which admin scopes; break-glass grants and their TTLs; segregation-of-duties conflicts.

**Decomposed admin roles (least privilege)**

| Admin role | Representative scopes | Cannot |
|---|---|---|
| **Read-only Analyst** | `*.read` | mutate anything |
| **Support Agent** | `support.*`, `identity.read`, `identity.impersonate` | move money, edit prices |
| **Trust & Safety** | `moderation.*`, `safeguarding.escalate`, `identity.suspend` | issue refunds, edit plans |
| **Billing Ops** | `payments.*`, `refund.*`, `acu.grant`, `billing.plan.write` | terminate users, view PII un-redacted |
| **Compliance/DPO** | `gdpr.*`, `consent.manage`, `identity.pii.breakglass` | change pricing, toggle agents |
| **Platform Engineer** | `agents.*`, `router.config`, `tenant.provision` | issue refunds, view PII |
| **Super Admin** | grant/revoke roles, dual-control partner | act alone on dual-control items |

**Rules:** segregation of duties enforced (e.g., the requester of a large refund cannot approve it); dual-control required for irreversible/money actions; all elevated access is time-boxed.

**AI agent assist — Sentinel.ai:** detects over-privileged or dormant admin accounts and SoD violations; recommends scope reductions.

**Permissions:** `rbac.manage` (Super Admin only). **Audit:** every grant/revoke, break-glass invocation, and SoD override logged.

---

## 13. System Health, Logs, Alerts & Platform Performance

**What it shows:** service map and SLOs across Next.js edge, Node/PHP API, FastAPI/LLM workers, Redis, MariaDB shards, vector DB/RAG, payment webhooks. Golden signals (latency/traffic/errors/saturation), per-tenant shard health, model-router provider latency/error/cost, queue depths, webhook lag, error-budget burn.

**Admin actions:** acknowledge/route alerts; open incidents & post-mortems; drain/failover a shard or model provider; toggle feature flags; put a tenant in read-only; tail structured logs (PII-redacted) and traces.

**AI agent assist — Sentinel.ai (SRE copilot):** correlates alerts into incidents, does first-pass root-cause from logs/traces, recommends mitigations (provider failover, scale-out, throttle), and drafts the incident timeline.

**Permissions:** `ops.read`, `ops.incident`, `ops.failover`, `flags.write`. **Audit:** incidents, failovers, and flag changes logged; log access to any tenant data is itself audited. See `10-production-architecture.md`.

---

## 14. Admin KPI Dashboard (specification)

**Layout:** top-line tiles → trend charts → cohort/at-risk tables → drill-through. Every metric is filterable by date range, tenant, role, plan, and region, and is drill-through to the underlying records.

| KPI | Definition | Cut-bys | Target/alert |
|---|---|---|---|
| **Platform usage** | DAU/WAU/MAU, sessions, actions/user | role, tenant, engine | WAU/MAU stickiness < X → alert |
| **Revenue** | MRR, ARR, ARPU, expansion, net revenue retention | plan, tenant type | NRR < 100% → alert |
| **ACU consumption** | ACU issued vs consumed, breakage, ACU/active-user, cost/action | engine, tool, tenant | negative unit econ → alert |
| **Active users** | active students/parents/teachers/tutors | role | drop vs 7-day baseline |
| **Resources created** | diagnostics, plans, resources, reviews generated | engine, tenant | — |
| **Student growth** | new/reactivated/churned students, net adds | tenant, cohort | churn spike → alert |
| **School adoption** | schools approved, activated, weekly-active seat % | region | activation < X% → CS action |
| **At-risk cohorts** | students with low engagement + low progress; schools near pool exhaustion; tenants in dunning | risk driver | ranked worklist |

**Cohort/at-risk tables** are actionable worklists: each row links to the relevant control-centre section (e.g., a school near ACU-pool exhaustion links to §4 with a pre-filled top-up/allocation action). Metrics are sourced from the same event stream that feeds Reports & Exports (module 16) — one definition, no dashboard/report drift.

---

## 15. AI-Safety Monitoring Panel

> Governs *how* the AI behaves platform-wide. Complements §8 (what content is produced) and §10 (which agents run).

**What it shows**
- **Prompt controls:** the active system-prompt/policy version per agent, guardrail rules, jailbreak-attempt rate, blocked-prompt log.
- **Output-quality review:** sampled agent outputs scored for correctness, safety, pedagogy, and hallucination; human-review backlog; eval trend per model version.
- **Tool enable/disable:** master switchboard for every tool each agent can call (retrieval, code exec, resource-gen, email, payments-adjacent), global or per-tenant, with instant kill.
- **ACU cost per tool:** live cost and volume per tool → identifies expensive/abused tools; ties to §4 price list.

| Panel control | What it does | Audit |
|---|---|---|
| Prompt/policy version pin | freeze or roll back an agent's governing prompt | version event |
| Guardrail rule edit | add/adjust safety/refusal rules | rule-change event |
| Output-quality sampling rate | set % of outputs auto-scored + queued for humans | config event |
| Tool toggle (per agent/tenant) | enable/disable/kill a tool | toggle event |
| ACU-cost-per-tool budget | cap spend on a tool; throttle at cap | budget event |
| Red-team / eval trigger | run an eval suite against a model/prompt version before promotion | eval event |

**AI agent assist — Sentinel.ai:** continuously samples and scores outputs, detects quality regressions after a model/prompt change, correlates jailbreak spikes with tools, and recommends disabling a tool or rolling back a prompt. Safety-critical disables can be auto-executed with immediate human notification (fail-safe, not fail-open).

**Permissions:** `aisafety.read`, `aisafety.prompt.write`, `aisafety.tool.toggle`, `aisafety.eval.run`. **Audit:** every prompt change, tool toggle, budget change, and eval run logged with actor, version, and result. Model-eval outcomes feed the Production Readiness Review (`15-build-roadmap.md`).

---

## 16. Cross-cutting audit & permission model (summary)

| Requirement | Rule |
|---|---|
| **Immutability** | Audit events are append-only (WORM), hash-chained, and independently exportable. |
| **Completeness** | Every mutating admin action, PII view, impersonation, and money/ACU movement emits an event — no silent writes. |
| **Attribution** | actor · role · scope used · tenant · target · reason · before/after (hash) · timestamp · dual-control partner. |
| **Segregation of duties** | requester ≠ approver for money/ACU/irreversible actions. |
| **Break-glass** | elevated/PII access is reason-required, time-boxed, and double-logged. |
| **Fail-safe** | safety systems default to disable/hold, never to open, on ambiguity. |
| **Retention** | audit + safeguarding + financial logs retained per statutory schedule (§9), independent of tenant deletion. |

---

### Section → module → agent map (quick reference)

| CC Section | Primary module(s) | Lead agent |
|---|---|---|
| §1 Identity | User & Role Management, Student Academic Profile | Sentinel.ai |
| §2 Tenants | School/Teacher/Tutor modules | Sentinel.ai + Principia/Matchmaker |
| §3 Payments | Stripe Checkout (+BitriPay) | Sentinel.ai |
| §4 ACU economics | ACU Wallet & Billing | Sentinel.ai |
| §5 Plans/pricing | ACU Wallet & Billing | Sentinel.ai |
| §6 Support/comms | Notifications & Alerts | Concierge/Principia/Sentinel |
| §7 Refunds/credits | Billing + Wallet | Sentinel.ai |
| §8 Moderation | Content Library, AI Tutor | Sentinel.ai |
| §9 GDPR | GDPR/Data Management, Audit Logs | Sentinel.ai |
| §10 Agents | Admin Control Panel | Sentinel.ai |
| §11 Disputes | Tutor Marketplace, Billing | Sentinel + Matchmaker |
| §12 RBAC | User & Role Management | Sentinel.ai |
| §13 Ops | (platform infra) | Sentinel.ai |
| §14 KPIs | Reports & Exports | Sentinel.ai |
| §15 AI-safety | Admin Control Panel | Sentinel.ai |

*End of Part 4 · The Admin Super Control Centre.*
