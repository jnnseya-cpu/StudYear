# PART 4 · The Developer Build Roadmap

> **Scope.** This is the phased, dependency-ordered build plan for the StudYear AI-OS, from first usable product to global scale. Each phase specifies: **required modules** (from the 20-module list), **APIs/connectors**, **user flows**, **AI agents activated**, **technical milestones**, and **commercial objectives**. It closes with a **Production Readiness Review (PRR)** checklist and a **dependency-ordered sequence**, plus a **capability-by-phase matrix**.
>
> Loop under construction: **Assess → Plan → Learn/Execute → Improve.** Five engines: Diagnostic; AI Study Roadmap; AI Learning Tools; Progress Intelligence; ACU Wallet.
>
> Related: `docs/ai-os/04-multi-agent-ecosystem.md` (agents), `docs/ai-os/10-production-architecture.md` (stack/tenancy), `docs/ai-os/13-monetisation.md` (ACU/plans), `docs/ai-os/14-admin-super-control-centre.md` (admin).

---

## 0. The 20 modules (build reference)

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
| 9 | Parent Command Centre | 19 | GDPR/Data Management |
| 10 | School Command Centre | 20 | Admin Control Panel |

**Six named agents:** Sentinel.ai (platform), Principia.ai (school), Pedagogue.ai (teacher), Mentor.ai (student), Concierge.ai (parent), Matchmaker.ai (tutor).

---

## 1. Phase overview

| Phase | Theme | Primary buyer | Exit gate |
|---|---|---|---|
| **P1 · MVP** | Prove the core loop for one student, one payer | Individual student/parent | The loop works end-to-end and is billable |
| **P2 · Beta** | Retention, quality, safety, first real cohorts | Students + private tutors | Retention + safety proven with real users |
| **P3 · Commercial Launch** | Monetise at scale, GA reliability | Consumers + individual tutors | SLA + unit economics hold under real load |
| **P4 · Enterprise** | Multi-tenant schools, admin, compliance | Schools / MATs / orgs | A school runs fully self-serve + compliant |
| **P5 · Global Scale** | Multi-region, marketplace liquidity, extensibility | International + partners | Multi-region SLA + marketplace liquidity |

**Non-negotiables present from P1:** ACU metering + hard stop, Audit Logs, basic GDPR (consent, deletion), least-privilege auth, minor-safety defaults. These are *foundational*, not deferred to a "compliance phase."

---

## 2. Phase 1 · MVP

**Goal:** a single student can be *assessed → planned → taught → improved*, with every AI action metered in ACU and paid for.

| Aspect | Detail |
|---|---|
| **Required modules** | 1 User & Role Mgmt · 2 Student Profile · 3 Diagnostic Engine · 4 AI Tutor · 5 Study Planner · 8 Progress Dashboard · 13 ACU Wallet & Billing · 14 Stripe Checkout · 15 Notifications · 18 Audit Logs · 19 GDPR (baseline) |
| **APIs/connectors** | Stripe (live checkout + webhooks); Model Router → single primary provider (Anthropic Claude) with one fallback; Redis job queue; email provider |
| **User flows** | Sign up (student/parent, minor-consent) → run diagnostic → receive AI study roadmap → chat with AI Tutor → see progress → buy ACU pack / hit hard stop at zero → top up |
| **AI agents activated** | **Mentor.ai** (student), **Sentinel.ai** (metering, safety, audit — minimal) |
| **Technical milestones** | MariaDB schema + single-tenant (sharding-ready); FastAPI LLM workers behind Redis; ACU deduction is transactional & idempotent; hard-stop-at-zero enforced server-side; append-only audit log; Stripe webhook → ACU credit fulfilment reconciled |
| **Commercial objective** | First paid loop; validate ACU pricing vs per-action model cost; establish CAC/activation baseline |

**Definition of done:** a paying user completes the full loop; no AI action executes without an ACU deduction; every money + ACU movement is auditable; account deletion works.

---

## 3. Phase 2 · Beta

**Goal:** make the loop *good and safe* for real cohorts; introduce learning tools, assignment review, and the first tutor supply.

| Aspect | Detail |
|---|---|
| **Required modules** | + 6 Assignment Review · 7 Resource Generator · 9 Parent Command Centre · 12 Tutor Marketplace (basic) · 16 Reports & Exports · 17 Content Library |
| **APIs/connectors** | Vector DB + RAG (grounded tutoring/resources); Model Router multi-provider (Claude + Gemini + OpenAI) with cost/latency routing; push/in-app notifications; file storage for uploads |
| **User flows** | Parent links to child → views progress + controls ACU spend · student submits assignment → AI review + feedback · generate worksheet/quiz · find & book a tutor (basic) · tutor delivers session |
| **AI agents activated** | + **Concierge.ai** (parent), + **Matchmaker.ai** (tutor matching), Mentor.ai expanded, Sentinel.ai output-quality sampling on |
| **Technical milestones** | RAG grounding + citation; content-safety classifiers on all minor-facing output; model-eval harness (correctness/safety/pedagogy) in CI; per-action ACU cost table versioned; feature flags; observability (golden signals + tracing) |
| **Commercial objective** | Prove retention (WAU/MAU stickiness) and learning outcomes; seed tutor supply; validate ACU consumption per active user; NPS/CSAT baseline |

**Definition of done:** target retention + CSAT met with real cohorts; safety classifiers block harmful minor-facing output; model evals gate every prompt/model change; tutor can be paid out.

---

## 4. Phase 3 · Commercial Launch (GA)

**Goal:** open the doors, monetise reliably, hold SLAs and unit economics under real traffic.

| Aspect | Detail |
|---|---|
| **Required modules** | Hardened 1–9, 12–19 · + 20 Admin Control Panel (core: users, refunds, moderation, KPIs) |
| **APIs/connectors** | Stripe billing (subscriptions + ACU packs + dunning); **BitriPay integration begins** (secondary provider, behind flag); analytics/BI export; status page |
| **User flows** | Self-serve plan selection · subscription + ACU pack purchase · dunning/renewal · in-app support tickets · refunds/credits · tutor marketplace booking + reviews at scale |
| **AI agents activated** | Full **Sentinel.ai** (fraud, refunds, moderation, SRE copilot, KPI); all consumer/tutor agents GA |
| **Technical milestones** | Autoscaling LLM workers; DB read replicas + backups tested; provider failover (Claude↔Gemini↔OpenAI) automatic; refunds/credits workflow (money+ACU double-entry); moderation/abuse queue; incident + on-call; DR runbook drafted |
| **Commercial objective** | Scale paid acquisition; positive contribution margin per active user; establish MRR growth + churn/dunning control; publish SLA |

**Definition of done:** GA SLA met under load test; ACU unit economics positive; admin can operate the platform (refunds, moderation, support, KPIs) per `14-admin-super-control-centre.md`; BitriPay live behind flag.

---

## 5. Phase 4 · Enterprise (Schools & Organisations)

**Goal:** a school/MAT/organisation onboards, provisions teachers and students, and runs fully self-serve on shared ACU pools — with compliance and admin control.

| Aspect | Detail |
|---|---|
| **Required modules** | + 10 School Command Centre · 11 Teacher Workspace · full 20 Admin Control Panel (tenant approval, plans/pricing, RBAC, AI-safety panel, disputes) · deepened 19 GDPR + 18 Audit |
| **APIs/connectors** | Sub-domain per tenant + tenant sharding live; SSO/SAML/OIDC + Google/Microsoft; SIS/MIS import (roster); **shared school ACU pools**; safeguarding/ID verification for tutor & school onboarding |
| **User flows** | School applies → admin approves (docs verified) → sub-domain provisioned → bulk teacher/student import → pool funded → teacher generates class resources + assigns → school dashboard of cohorts → at-risk alerts |
| **AI agents activated** | + **Principia.ai** (school), + **Pedagogue.ai** (teacher); Sentinel.ai gains tenant fraud/pool-drain guardrails + full AI-safety monitoring panel |
| **Technical milestones** | Hard tenant isolation + per-tenant shard health; RBAC/ABAC with SoD + break-glass; shared-pool allocation/caps + exhaustion forecasting; DSAR/erasure automation; PCI posture asserted (Stripe/BitriPay vaulting); DR/BCP tested; data-residency controls |
| **Commercial objective** | Land first schools/MATs; seat-based + pool revenue; contract/procurement readiness (security questionnaire, DPA); expansion within multi-academy trusts |

**Definition of done:** a school self-serves end-to-end on an isolated tenant with a shared ACU pool; admin approves tenants and manages pricing/RBAC/AI-safety; GDPR DSAR/erasure automated; DR/BCP drill passed.

---

## 6. Phase 5 · Global Scale

**Goal:** multi-region reliability, marketplace liquidity, localisation, and an extensibility surface for partners.

| Aspect | Detail |
|---|---|
| **Required modules** | All 20 hardened; platform/extensibility layer (public/partner API, webhooks) on top |
| **APIs/connectors** | Multi-region MariaDB + data residency routing; regional model-provider routing; multi-currency + regional tax; BitriPay + Stripe as co-equal providers; partner/public API + webhooks; marketplace payouts across regions |
| **User flows** | Localised onboarding (language/curriculum/currency) · region-pinned data · high-liquidity tutor marketplace (matching, ratings, disputes) · partner integrations via API |
| **AI agents activated** | All six at full autonomy ceilings; Sentinel.ai runs cross-region fraud, cost, and quality supervision; localisation-aware prompts/evals |
| **Technical milestones** | Active-active/multi-region with residency guarantees; global rate limiting + cost governance; per-region model evals; chaos/DR at scale; marketplace anti-fraud + payout compliance; SDK + API versioning |
| **Commercial objective** | International expansion; marketplace take-rate at liquidity; partner ecosystem; efficient scaling (cost/active-user declining) |

**Definition of done:** multi-region SLA + residency proven; marketplace liquid (fill rate/time-to-match targets); partners live on the public API; unit cost per active user trends down with scale.

---

## 7. AI agent activation timeline

| Agent | P1 MVP | P2 Beta | P3 Launch | P4 Enterprise | P5 Global |
|---|---|---|---|---|---|
| **Mentor.ai** (student) | ● core | ● expanded | ● GA | ● | ● |
| **Sentinel.ai** (platform) | ◐ metering/audit | ◐ + quality | ● full | ● + tenant/AI-safety | ● cross-region |
| **Concierge.ai** (parent) | — | ● | ● | ● | ● |
| **Matchmaker.ai** (tutor) | — | ◐ basic | ● | ● + safeguarding | ● global marketplace |
| **Principia.ai** (school) | — | — | — | ● | ● |
| **Pedagogue.ai** (teacher) | — | — | — | ● | ● |

● = active · ◐ = partial · — = not yet. See agent contracts in `04-multi-agent-ecosystem.md`.

---

## 8. Capability-by-phase matrix

| Capability | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Core loop (Assess→Plan→Learn→Improve) | ● | ● | ● | ● | ● |
| ACU metering + hard stop | ● | ● | ● | ● | ● |
| Audit logs (append-only) | ● | ● | ● | ● | ● |
| GDPR consent + deletion | ◐ | ● | ● | ● | ● |
| Diagnostic Engine | ● | ● | ● | ● | ● |
| AI Tutor (RAG-grounded) | ◐ | ● | ● | ● | ● |
| Assignment Review / Resource Gen | — | ● | ● | ● | ● |
| Parent Command Centre | — | ● | ● | ● | ● |
| Tutor Marketplace | — | ◐ | ● | ● | ● (liquid) |
| Stripe billing + packs + dunning | ◐ | ◐ | ● | ● | ● |
| BitriPay | — | — | ◐ flag | ● | ● co-equal |
| Multi-provider model router + failover | — | ● | ● | ● | ● regional |
| Admin Control Panel | — | — | ◐ core | ● full | ● |
| Moderation / abuse queue | — | ◐ | ● | ● | ● |
| Refunds/credits workflow | ◐ manual | ◐ | ● | ● | ● |
| Multi-tenant (sub-domain + sharding) | ready | ready | ready | ● live | ● multi-region |
| SSO/SAML + SIS import | — | — | — | ● | ● |
| Shared school ACU pools | — | — | — | ● | ● |
| RBAC/ABAC + break-glass | ◐ | ◐ | ● | ● | ● |
| AI-safety monitoring panel | — | ◐ evals | ◐ | ● | ● regional |
| DR/BCP tested | — | — | ◐ | ● | ● at scale |
| Multi-region + data residency | — | — | — | ◐ | ● |
| Public/partner API + webhooks | — | — | — | — | ● |

● full · ◐ partial/behind-flag · — not present.

---

## 9. Dependency-ordered build sequence

Build order respects hard prerequisites (a module cannot ship before what it depends on).

```
1.  User & Role Mgmt (1) ─────────────► auth/tenancy foundation for everything
2.  Audit Logs (18) + GDPR baseline (19) ─► must exist before any PII/action write
3.  Student Academic Profile (2) ────────► depends on 1
4.  ACU Wallet & Billing (13) ───────────► metering substrate; depends on 1, 18
5.  Stripe Checkout (14) ────────────────► funds the wallet; depends on 13, 18
6.  Model Router + LLM workers ──────────► infra for all engines
7.  Diagnostic Engine (3) ───────────────► depends on 2, 6, 13 (metered)
8.  Study Planner (5) ───────────────────► consumes diagnostic output
9.  AI Tutor (4) ────────────────────────► depends on 6, 13; RAG in P2
10. Progress Dashboard (8) ──────────────► depends on 2, 3, 5
11. Notifications & Alerts (15) ─────────► cross-cutting; needed by hard-stop/dunning
    ── MVP gate (P1) ──
12. Assignment Review (6) + Resource Generator (7) ─► depend on 4, 6, 17
13. Content Library (17) + Vector DB/RAG ─► grounds 4/6/7
14. Parent Command Centre (9) ───────────► depends on 1, 8, 13
15. Reports & Exports (16) ──────────────► depends on 8, 18
16. Tutor Marketplace (12, basic) ───────► depends on 1, 13, 14
    ── Beta gate (P2) ──
17. Admin Control Panel (20, core) ──────► depends on 1, 13, 14, 18
18. Refunds/credits + Moderation + Dunning ─► depend on 20, 13, 14
19. BitriPay connector (behind flag) ────► depends on 13 payment abstraction
    ── Commercial Launch gate (P3) ──
20. Tenant sharding + sub-domain provisioning ─► depends on 1 (tenancy-ready)
21. School Command Centre (10) + Teacher Workspace (11) ─► depend on 20, tenancy
22. Shared ACU pools ────────────────────► depends on 13, 10
23. SSO/SAML + SIS import ───────────────► depends on 1, 20
24. RBAC/ABAC + break-glass + AI-safety panel ─► depends on 20, 18
25. DSAR/erasure automation + DR/BCP ────► depends on 19, 18
    ── Enterprise gate (P4) ──
26. Multi-region + data residency routing ─► depends on 20, 25
27. Multi-currency/tax + co-equal BitriPay ─► depends on 13, 14
28. Marketplace liquidity + payouts + disputes ─► depends on 12
29. Public/partner API + webhooks + SDK ──► depends on stable internal contracts
    ── Global Scale gate (P5) ──
```

---

## 10. Production Readiness Review (PRR) checklist

> Applied at every phase gate; depth increases by phase. No gate passes with an open **must** item. (Pattern: Google PRR / AWS Well-Architected.)

### Security
- [ ] Least-privilege auth; MFA for admin/staff; secrets in a vault, none in code
- [ ] RBAC/ABAC enforced server-side; SoD + break-glass (P4+)
- [ ] Input validation, rate limiting, WAF; dependency + secret scanning in CI
- [ ] Tenant isolation verified (no cross-tenant read/write) (P4+)
- [ ] Pen test / red-team before GA and before Enterprise

### Compliance & GDPR
- [ ] Lawful basis + consent (incl. **guardian consent for minors**) captured
- [ ] DSAR (access/rectify/erase/port) fulfilable; erasure produces tombstone
- [ ] RoPA + sub-processor register + DPAs current; data-residency honoured (P5)
- [ ] Minor-safety defaults: PII redaction, safeguarding escalation path
- [ ] Retention schedules enforced per data class

### PCI
- [ ] No PAN stored/processed by StudYear; delegated to Stripe/BitriPay vaults
- [ ] SAQ-A scope maintained; provider webhook signatures verified
- [ ] Payment flows audited; refund/chargeback handling ledgered

### Load / scale
- [ ] Load test to N× peak; autoscaling LLM workers + queue backpressure
- [ ] DB sharding/replicas sized; per-tenant hot-shard mitigation (P4+)
- [ ] Model-router provider failover + cost caps under load
- [ ] Graceful degradation on provider outage (ACU never double-charged)

### DR / BCP
- [ ] Backups automated + **restore-tested**; RPO/RTO defined & met
- [ ] Multi-AZ (P3) → multi-region active-active (P5); failover drills
- [ ] Incident runbooks + on-call + status page; post-mortem process

### Observability
- [ ] Golden signals + tracing across web/API/LLM/DB/payments
- [ ] Structured, PII-redacted logs; log access audited
- [ ] SLOs + error budgets; alerting with on-call routing
- [ ] Business telemetry (ACU, revenue, KPIs) matches Reports & Exports definitions

### Data governance
- [ ] Data classification + ownership; access reviews; append-only audit (WORM)
- [ ] Lineage from event → dashboard → report (single source of truth)
- [ ] PII minimisation; encryption at rest + in transit; key rotation

### Model evals
- [ ] Eval suite (correctness/safety/pedagogy/hallucination) gates every prompt/model change in CI
- [ ] Output-quality sampling + human review in production (P2+)
- [ ] Jailbreak/red-team evals; guardrail regression tests
- [ ] Per-tool ACU cost + safety review before enabling a tool (see `14`, AI-safety panel)
- [ ] Localised evals per region/curriculum (P5)

---

## 11. Gate summary (go/no-go per phase)

| Gate | Must-pass PRR sections | Commercial trigger |
|---|---|---|
| **P1 → P2** | Security(core), GDPR(baseline), Model evals(harness), Observability(golden signals) | First paid loop + positive ACU pricing signal |
| **P2 → P3** | + Model evals(prod sampling), Load(initial), Compliance | Retention + CSAT + tutor payout proven |
| **P3 → P4** | + Load(full), DR/BCP(tested), Refunds/moderation ops | GA SLA + positive contribution margin |
| **P4 → P5** | + Security(pen test), Tenant isolation, Data governance(full), RBAC/SoD | First schools live + procurement-ready |
| **P5 → GA-Global** | + Multi-region DR, Residency, Localised evals, PCI(both providers) | Multi-region SLA + marketplace liquidity |

*End of Part 4 · The Developer Build Roadmap.*
