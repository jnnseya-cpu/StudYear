# PART 4 · The Complete User Ecosystem

StudYear is an **AI-powered Education Operating System** running the closed learning
loop **Assess → Plan → Learn → Improve** on five engines (Diagnostic, AI Study
Roadmap, AI Learning Tools, Progress Intelligence, **ACU Wallet**). This document is the
canonical map of **who** the OS serves. It preserves the six platform roles defined in
`docs/architecture/01-personas.md` and `10-permissions-rbac.md` (Platform Admin,
Student, Parent, School, School Teacher, Private Tutor) and **extends** the picture with
the wider partner, marketplace, and regulatory actors that surround them.

> Siblings: agent behaviour is specified in `03-ai-command-centres.md`; the
> multi-agent event fabric in `04-multi-agent-ecosystem.md`; RBAC in
> `docs/architecture/10-permissions-rbac.md`; tenancy/data model in
> `docs/architecture/08-technical-architecture.md` and `09-data-model.md`.

---

## 1. Ecosystem at a glance

Users fall into three concentric rings. Ground-truth roles (the six with first-class
accounts, named agents, and ACU wallets) sit in the **core**. Around them sits a
**marketplace / partner ring** of commercial actors, and an outer **governance /
integration ring** of oversight and technical partners.

| Ring | User types | First-class account? | Named agent | Holds an ACU wallet? |
|---|---|---|---|---|
| **Core (ground truth)** | Platform Admin, Student, Parent, School/Principal, School Teacher, Private Tutor | Yes | Sentinel · Mentor · Concierge · Principia · Pedagogue · Matchmaker | Yes (schools = shared pool) |
| **Marketplace / partner** | Partner organisations, Merchants, Service providers, Developers | Yes (partner-tier) | Inherits Sentinel-governed sandbox | Partner wallet (billed, not free) |
| **Governance / integration** | Regulators / auditors, Third-party API partners | Scoped / read-only | None (mediated by Sentinel) | No (metered, contract-billed) |

**ACU rule of the realm (do not contradict):** ACUs are **prepaid AI Credit Units**. Every
AI action has a **per-action cost**; **AI stops at zero**. Individuals hold personal
wallets; **schools hold a shared ACU pool** allocated across teachers and students.
Partners are billed against a commercial ACU meter; core learners are never charged for
another user's consumption.

---

## 2. Core user types (ground truth)

### 2.1 Student — *the learner at the centre*
- **Who they are:** the atomic unit of value; every other role converges on them
  (`01 §1`). Self-enrolled (household tenant) or roster-enrolled (school tenant).
- **What they need:** know what to study next, understand *why* they got something wrong,
  see measurable progress, and stay motivated without overwhelm.
- **What they can do:** take Diagnostics, follow an AI Study Roadmap, use AI Learning
  Tools (explainers, practice, flashcards, past-paper drills — `docs/architecture/11`),
  view their Progress Intelligence, spend their personal ACU wallet.
- **Data they see:** *only their own* mastery map, roadmap, attempts, and wallet balance.
  Never another student's data; never school-admin or billing internals.
- **How ACUs apply:** personal prepaid wallet (top-up by self or parent, or granted from a
  school pool). Each Learning-Tool call, Diagnostic scoring, and Mentor interaction debits
  it; **at zero, generative AI pauses** while non-AI content (saved notes, static
  resources) stays available.
- **Named agent:** **Mentor.ai** — private coach and study companion.
- **Relates to:** *guardian-of* edge → Parent; *taught-by* → Teacher/Tutor;
  *provisioned-by* → School or Admin.

### 2.2 Parent / Guardian — *the sponsor and co-pilot*
- **Who they are:** the household account holder and, usually, the payer. Attaches to one
  or more students via the guardianship edge (`01 §1b`).
- **What they need:** confidence their child is progressing, early warning of struggle,
  spend control, and low-effort ways to help.
- **What they can do:** fund/top-up ACU wallets, view child progress digests, book Private
  Tutors, set spend caps and study guardrails, approve high-cost actions.
- **Data they see:** their child's progress summaries, roadmap headlines, attendance (if
  schooled), wallet ledger, tutor bookings/invoices. **Not** raw item-level answers unless
  the child/age-policy permits; never other households.
- **How ACUs apply:** funds the child's wallet; may hold a household wallet shared across
  siblings. Sets **spend caps and auto-top-up**; approvals gate actions above a threshold.
- **Named agent:** **Concierge.ai** — family success and logistics manager.
- **Relates to:** *guardian-of* → Student; *books/pays* → Tutor; *receives-from* →
  School/Teacher (reports); *billed-by* → Admin.

### 2.3 School Teacher — *the formal instructor*
- **Who they are:** an educator **inside a school tenant**, bound to a curriculum and a
  class roster (`docs/architecture/03`).
- **What they need:** less admin, earlier signal on who's falling behind, differentiated
  material at scale, and defensible grading.
- **What they can do:** assign Diagnostics/roadmaps to classes, review Progress
  Intelligence per student/cohort, generate lesson and assessment materials, draft grades,
  message parents, and draw on the **school's shared ACU pool** within teacher limits.
- **Data they see:** their assigned classes and students (mastery, attempts, attendance),
  cohort analytics, their own material library — scoped to their tenant and roster only.
- **How ACUs apply:** consumes the **school shared pool**; the school sets per-teacher
  budgets/alerts. No personal top-up; overspend is a school-admin decision.
- **Named agent:** **Pedagogue.ai** — teaching co-pilot.
- **Relates to:** *employed-by* → School; *teaches/assesses* → Students; *reports-to* →
  Principal; *informs* → Parents.

### 2.4 School / Principal (Tenant Admin) — *the institution*
- **Who they are:** the institution as a tenant, administered by a principal / ops manager
  / franchise owner (`01 §2.1`, `docs/architecture/02`). Its own sub-domain and shard.
- **What they need:** whole-school outcomes, staff effectiveness, budget control over AI
  spend, compliance, and retention/enrolment health.
- **What they can do:** provision teachers and students, set curriculum/policy, **allocate
  the shared ACU pool** and per-role budgets, view school-wide Progress Intelligence,
  manage billing, and configure integrations (SIS/LMS import).
- **Data they see:** everything **within their tenant** — all rosters, staff analytics,
  aggregate outcomes, full ACU ledger — and nothing in any other tenant.
- **How ACUs apply:** buys and **owns the shared ACU pool**; sets allocation rules,
  per-teacher/per-student caps, alerts, and auto-top-up. School spend stops at pool zero.
- **Named agent:** **Principia.ai** — school operations and outcomes brain.
- **Relates to:** *employs* → Teachers; *enrols* → Students; *reports-to* → Regulators;
  *provisioned/billed-by* → Platform Admin.

### 2.5 Private Tutor — *the independent marketplace educator*
- **Who they are:** an independent instructor in the shared platform tenant, discoverable
  and bookable by parents/students (`docs/architecture/04`).
- **What they need:** a steady pipeline of matched students, scheduling/payment plumbing,
  session prep material, and reputation.
- **What they can do:** publish a profile, accept bookings, run/prepare sessions, view the
  progress of **consented** tutees, generate session material, invoice via Stripe, and
  spend their own ACU wallet.
- **Data they see:** only students who have **granted consent** via a booking (their
  mastery in relevant subjects, session history) — never the full roster of a school,
  never non-tutees.
- **How ACUs apply:** personal professional wallet funds prep/analysis tools; marketplace
  transaction fees are separate from ACU spend.
- **Named agent:** **Matchmaker.ai** — demand-matching and practice-growth agent.
- **Relates to:** *booked-by* → Parent/Student; *tutors* → Students (consented);
  *governed/paid-out-by* → Platform Admin marketplace.

### 2.6 Platform Admin / Operator — *the OS kernel*
- **Who they are:** StudYear staff operating the OS: global provisioning, policy, trust &
  safety, marketplace integrity, and platform revenue (`01 §2.1`, `docs/architecture/02`).
- **What they need:** platform health, fraud/abuse control, tenant success, model-cost
  governance, and compliance across all tenants.
- **What they can do:** provision/suspend tenants, set global policy and the Model Router
  routing rules (`docs/architecture/14 §0`), monitor cross-tenant health, manage the
  marketplace, run trust & safety, and **impersonate for support** (audited).
- **Data they see:** cross-tenant **operational metadata and aggregates** by default; raw
  learner content only via audited, consent/legal-based impersonation. PII minimisation and
  data-residency rules apply (`14 §0.2`).
- **How ACUs apply:** operates the ACU **economy** — pricing, provider cost pass-through,
  fraud on top-ups — but does not consume learner wallets.
- **Named agent:** **Sentinel.ai** — platform guardian and marketplace referee.
- **Relates to:** *governs/provisions* → every other actor; *gatekeeps* → partners,
  developers, API partners; *answers-to* → Regulators.

---

## 3. Marketplace & partner ring

These are commercial, first-class-but-scoped accounts. They operate in a **Sentinel-governed
sandbox**, hold a **billed partner wallet** (never free ACUs), and can never read core
learner PII beyond explicitly consented, purpose-scoped grants.

| User type | Who they are | Primary need | Can do | Data they see | ACU model |
|---|---|---|---|---|---|
| **Partner organisation** | Districts, exam boards, publishers, NGOs, EdTech resellers integrating StudYear at scale | Deploy StudYear to a population; co-branded programmes; outcome reporting | Provision sub-tenants under contract, push approved curriculum/content, view **aggregate anonymised** outcomes | Contracted aggregate dashboards; no individual PII unless separately consented | Contract-metered ACU allotment; overage billed |
| **Merchant** | Sellers of learning goods/services in the StudYear marketplace (course packs, hardware, tutoring bundles) | Reach learners/parents; transact safely | List offers, fulfil orders, receive Stripe/BitriPay-planned payouts | Their own listings, orders, payout ledger; buyer contact only per order | No learning ACUs; pays marketplace + optional AI-merchandising ACU meter |
| **Service provider** | Assessment vendors, content graders, translation, accessibility, support BPOs | Deliver a contracted service into the loop | Fulfil scoped tasks (e.g. score an assessment type, localise content) via API/console | Only the task payloads routed to them, minimised & often pseudonymised | Metered per service call against provider wallet |
| **Developer** | Independent devs / ISVs building on StudYear APIs & the agent SDK | Build apps/integrations; monetise | Create apps in the sandbox, request scopes, publish to the marketplace after review | Sandbox/synthetic data pre-approval; live data only under granted OAuth scopes | Sandbox ACUs free-tier-capped; production billed to the developer or their tenant |

**Governance:** every partner-ring actor is onboarded, scope-reviewed, rate-limited, and
continuously monitored by **Sentinel.ai** (fraud, review manipulation, off-platform
solicitation, credential sharing — `docs/architecture/14 §1.2`). Scopes follow least
privilege (`10-permissions-rbac.md`).

---

## 4. Governance & integration ring

| User type | Who they are | Primary need | Can do | Data they see | ACU / billing |
|---|---|---|---|---|---|
| **Regulator / Auditor** | Data-protection authorities, education inspectorates, safeguarding bodies, financial auditors | Verify compliance, safeguarding, and financial integrity | Read scoped audit trails, DSAR exports, model-decision logs; request evidence packs | **Read-only**, purpose-scoped, time-boxed views; full prompt/response audit (`09 §6`) on legal basis | No ACUs; access is logged and free-of-charge under legal obligation |
| **Third-party API partner** | SIS/LMS (roster sync), payment (Stripe live; **BitriPay planned**), identity/SSO, model providers (Anthropic/Google/OpenAI via the Model Router) | Reliable, secure, contracted data exchange | Exchange data over versioned APIs/webhooks within granted scopes | Only the fields their integration contract defines; PII redaction before egress (`14 §0.2`) | Metered/contract-billed; provider LLM cost flows into ACU pricing, not partner wallets |

Regulators and API partners have **no named agent**; all their interactions are **mediated
by Sentinel.ai**, which enforces residency (minors' data never leaves an approved
provider/region), redaction, and rate/scope limits.

---

## 5. Ecosystem relationship map

```
                          ┌─────────────────────────────┐
        governs ▲         │   PLATFORM ADMIN (Sentinel)  │        ▲ answers to
        every ──┼────────►│   OS kernel · marketplace ·  │◄───────┼── REGULATORS /
        actor   │         │   ACU economy · Model Router │        │   AUDITORS (read-only)
                │         └──┬─────────┬─────────┬───────┘        │
   provisions / │            │         │         │                │  metered / scoped
   bills        │   ┌────────┘         │         └────────┐       │
                ▼   ▼                  ▼                  ▼        │
        ┌──────────────┐        ┌────────────┐     ┌────────────┐ │   ┌──────────────────┐
        │ SCHOOL /     │        │  PRIVATE   │     │ PARTNER ·  │ │   │ THIRD-PARTY API  │
        │ PRINCIPAL    │        │  TUTOR     │     │ MERCHANT · │◄┼──►│ PARTNERS         │
        │ (Principia)  │        │ (Matchmaker)│    │ SERVICE ·  │ │   │ SIS·LMS·Stripe·  │
        └──┬─────────┬─┘        └──────┬─────┘     │ DEVELOPER  │ │   │ BitriPay·SSO·LLM │
    employs│         │enrols           │ tutors    └────────────┘ │   └──────────────────┘
           ▼         ▼                 │  (consented)             │
    ┌────────────┐  ┌───────────────────────────────┐            │
    │  TEACHER   │  │           STUDENT             │◄───────────┘
    │(Pedagogue) │─►│          (Mentor)             │   AI actions debit ACUs
    └────────────┘  └───────────────┬───────────────┘
        assesses/reports            │ guardian-of
                                     ▼
                            ┌────────────────┐
                            │    PARENT      │  funds wallet · books tutor
                            │  (Concierge)   │  sets spend caps · approvals
                            └────────────────┘
```

### 5.1 Relationship matrix (row *acts on* column)

| ↓ acts on → | Student | Parent | Teacher | School | Tutor | Admin | Partner ring | Gov ring |
|---|---|---|---|---|---|---|---|---|
| **Student** | self | requests help / consents | submits work | enrolled member | grants consent (book) | subject-of policy | consented buyer | subject-of audit |
| **Parent** | guardian-of, funds | self | receives reports | receives reports | books & pays | billed-by | buys (merchant) | subject-of audit |
| **Teacher** | teaches/assesses | reports to | self / peers | employed-by | — | governed-by | uses (content) | subject-of audit |
| **School** | enrols/provisions | reports to | employs | self (tenant) | — | provisioned/billed-by | contracts (partner) | reports to |
| **Tutor** | tutors (consented) | booked/paid-by | — | — | self | governed/paid-by | lists (merchant) | subject-of audit |
| **Admin** | provisions/protects | provisions/bills | governs | provisions/bills | governs/pays-out | self (kernel) | onboards/gatekeeps | answers-to |
| **Partner ring** | serves (scoped) | sells to | supplies | integrates | lists to | contracts-with | peers | subject-of audit |
| **Gov ring** | protects | protects | inspects | inspects | inspects | oversees | oversees | self |

### 5.2 The one edge that binds them all
Every relationship ultimately serves the **Assess → Plan → Learn → Improve** loop around a
learner. Data flows *inward* to enrich the learner's mastery model and *outward* as scoped,
consented, ACU-metered intelligence — never as an ungoverned silo (`14 §0.2`).

---

## 6. Cross-cutting rules (apply to every user type)

| Rule | Statement |
|---|---|
| **Data scoping** | Every user sees the **minimum** slice their role and consent grant; tenant isolation is enforced at the shard/sub-domain layer (`08 §1`). |
| **Consent gates** | Tutor and partner access to learner data requires an explicit, revocable, purpose-scoped grant. Minors' data carries stricter residency + redaction. |
| **ACU discipline** | Prepaid only; per-action cost; **AI stops at zero**. Schools = shared pool; individuals = personal wallets; partners = billed meters. |
| **Payments** | Wallet top-ups & marketplace payouts via **Stripe (live)**; **BitriPay (planned addition)**. ACUs are the internal unit; currency converts on top-up. |
| **Agent mediation** | Governance/integration actors never touch data directly — **Sentinel.ai** brokers, redacts, and audits every exchange. |
| **Auditability** | All AI actions and cross-tenant accesses are logged with full prompt/response audit for compliance (`09 §6`). |

Continue to `03-ai-command-centres.md` for the AI-Agent Command Centre each of these user
types receives.
