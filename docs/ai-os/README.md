# PART 4 — The StudYear AI Infrastructure Operating System

The enterprise transformation of StudYear: a **production-grade, developer-ready document
set** that re-engineers the platform — preserving every existing engine, role, module,
revenue stream, and the ACU economics — into an autonomous, self-improving, commercially
dominant **AI-OS**.

**Ground rules for the whole set:**
- **Nothing removed.** The as-is product (`../product/studyear-product-spec.md`) — five
  engines, six roles, 20 modules, ACU wallet, Stripe — is the preserved base. This set
  *adds* the enterprise layer.
- **Proven patterns only.** Every recommendation follows infrastructure patterns in
  production at leading companies (Stripe, Cloudflare, Databricks, Anthropic, OpenAI,
  Google, CrowdStrike, ServiceNow, …).
- **Grounded agents.** All AI reads the shared kernel as ground truth and writes back as
  first-class domain data; every agent action is permissioned, audited, ACU-metered,
  explainable, and human-gated where consequential.

## Document map

| # | Document | Covers |
|---|---|---|
| 00 | [Executive Vision](00-executive-vision.md) | what the AI-OS is, why it wins, moats, before/after |
| 01 | [Market Gap Analysis](01-market-gap-analysis.md) | competitor teardown, underserved users, money leaks |
| 02 | [User Ecosystem](02-user-ecosystem.md) | every user type incl. developers, merchants, regulators |
| 03 | [AI Command Centres](03-ai-command-centres.md) | the 7 standard sub-agents × 6 tailored role centres |
| 04 | [Multi-Agent Ecosystem](04-multi-agent-ecosystem.md) | enterprise workforce, 15-agent core catalogue, **25 StudYear-enhanced agents (§3A)**, orchestration |
| 05 | [Self-Managing Platform](05-self-managing-platform.md) | health/bug/repair/optimise/release/governance agents, MAPE-K, SLOs |
| 06 | [Security & Compliance](06-security-compliance.md) | zero trust, anti-hacking, GDPR/child-data, KYC/AML/PCI |
| 07 | [Data Intelligence Layer](07-data-intelligence-layer.md) | lake/warehouse/vector/knowledge-graph/streaming → agents |
| 08 | [BitriPay Gateway](08-bitripay-gateway.md) | the BitriPay API door (alongside live Stripe) |
| 09 | [Third-Party Connectors](09-third-party-connectors.md) | the full plug-and-play connector ecosystem |
| 10 | [Production Architecture](10-production-architecture.md) | full stack: layers, Model Router, DevOps, DR/BCP |
| 11 | [Database Schema & ERD](11-database-schema-erd.md) | developer-ready schema, tenant-sharded, audited |
| 12 | [API Specification](12-api-specification.md) | REST + signed webhooks, auth, rate limits, errors |
| 13 | [Monetisation](13-monetisation.md) | 11 revenue streams, ACU economics, pricing engines |
| 14 | [Admin Super Control Centre](14-admin-super-control-centre.md) | total platform control incl. universal ACU-grant/plan authority |
| 15 | [Build Roadmap](15-build-roadmap.md) | MVP → Beta → Launch → Enterprise → Global, PRR checklist |

## The 25 enhanced agents at a glance (§3A of doc 04)

| Layer | Specialises | Agents |
|---|---|---|
| Admin | Sentinel.ai | Admin Intelligence · Revenue (ACU) · Compliance (safeguarding) |
| Student | Mentor.ai | Student Success · Weakness Detection · Exam Readiness · Motivation · Assignment Coach |
| Parent | Concierge.ai | Parent Advisor · Early Warning · Family Support · ACU Control |
| School | Principia.ai | School Improvement · Cohort Risk · Staff Deployment · Executive Report · Funding Impact |
| Teacher | Pedagogue.ai | Lesson Planning · Marking Assistant · Intervention · Classroom Insight |
| Tutor | Matchmaker.ai | Tutor Growth · Session Prep · Student Progress · Revenue (tutor) |

Predictive signals for all of the above come from the **13-model ML layer**
(`../product/studyear-product-spec.md §5a`), and the canonical 14-agent OS roster with its
six governance invariants is in `../product/studyear-product-spec.md §5c`.

## Reading order

1. **Strategy:** 00 → 01 → 13
2. **Product:** 02 → 03 → 04 (+ the product spec for as-is truth)
3. **Platform:** 10 → 11 → 12 → 07 → 05
4. **Trust & money:** 06 → 08 → 09 → 14
5. **Execution:** 15
