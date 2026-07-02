# PART 4 · Monetisation Model

> **Scope note.** This document defines StudYear's complete revenue architecture. It PRESERVES the existing ACU economics (prepaid AI Credit Units, per-action cost, hard stop at zero, school shared pool) and all roles, and ADDS the enterprise monetisation layer. Payments run on **Stripe (live today)** with **BitriPay as a planned additional gateway** — Stripe is not replaced. See the vision in `docs/ai-os/00-executive-vision.md`, the gaps in `docs/ai-os/01-market-gap-analysis.md`, and the agents in `docs/architecture/14`. All prices below are illustrative reference tiers for design, not final list prices.

---

## 1. Revenue Architecture Overview

StudYear runs **eleven interlocking revenue streams** — a diversified stack no single-product competitor can match. The design principle mirrors the platform economics of Snowflake (metered usage), Stripe (transaction rails), and ServiceNow (enterprise subscription + expansion).

| # | Stream | Model | Primary payer |
|---|---|---|---|
| 1 | Subscriptions | Recurring per role/tier | All roles |
| 2 | ACU / AI-credit system | Prepaid, metered per action | Student, School, Tutor |
| 3 | Marketplace commission | % of tutor booking | Private Tutor |
| 4 | Transaction fees | % + fixed per payment | All transacting parties |
| 5 | API usage fees | Metered per call | Partners, enterprise |
| 6 | Merchant / partner fees | Listing + placement | Merchants, publishers |
| 7 | Premium automation | Add-on subscription | School, Tutor |
| 8 | Data-intelligence | Aggregated, anonymised insights | Publishers, districts |
| 9 | White-label licensing | Per-tenant licence + rev-share | Enterprise, resellers |
| 10 | Enterprise plans | Custom contract | Districts, chains |
| 11 | BitriPay gateway (planned) | Gateway spread on volume | Platform |

---

## 2. Subscription Plans (per role / tier)

Freemium entry (proven by Notion, Slack, Zoom) seeds the flywheel; paid tiers monetise depth. **Every paid tier includes a monthly ACU allowance**; heavy use is topped up via ACU packs (§4).

### 2.1 Student

| Tier | Price (illustrative) | Includes | Monthly ACU |
|---|---|---|---|
| Free | £0 | Diagnostic taster, limited tools | 50 ACU |
| Plus | £7.99/mo | Full roadmap, all AI Learning Tools, Mentor.ai | 500 ACU |
| Pro | £14.99/mo | Everything + predicted grades, priority routing | 1,500 ACU |

### 2.2 Parent

| Tier | Price | Includes | Monthly ACU |
|---|---|---|---|
| Free | £0 | Basic progress view | 20 ACU |
| Family | £9.99/mo | Concierge.ai summaries + translation, up to 3 children | 400 ACU |

### 2.3 Private Tutor

| Tier | Price | Includes | Monthly ACU |
|---|---|---|---|
| Starter | £0 + commission | Marketplace listing, basic tools | 100 ACU |
| Professional | £19.99/mo | Matchmaker.ai, reduced commission, scheduling | 1,000 ACU |
| Studio | £49.99/mo | Multi-student, analytics, lowest commission | 3,000 ACU |

### 2.4 School (per-seat + platform fee)

| Tier | Platform fee | Per-student/mo | Includes | Shared ACU pool |
|---|---|---|---|---|
| Core | £299/mo | £2.50 | LMS + engines, Principia.ai, Pedagogue.ai | 25,000 ACU |
| Advanced | £799/mo | £3.50 | + Progress Intelligence, sub-domain, SSO | 75,000 ACU |
| Enterprise | Custom | Custom | + white-label option, data residency, SLA | Custom pool |

### 2.5 Platform Admin

Internal role — not a paid subscription; governs Sentinel.ai and the streams below.

---

## 3. Transaction, API, Marketplace & Partner Fees

| Stream | Illustrative rate | Notes |
|---|---|---|
| **Marketplace commission** | 15% (Starter) → 10% (Pro) → 7% (Studio) | Tutor bookings; tier reduces the cut (Airbnb/Uber take-rate model) |
| **Transaction fee** | 1.5% + £0.20 | On payments processed via Stripe rails; disclosed at checkout |
| **API usage** | £0.002–£0.02 per call, tiered | Partner/enterprise access to engines; metered like Stripe/Twilio |
| **Merchant / partner fees** | £99/mo listing + placement CPM | Publishers, revision-guide sellers, exam-board partners |
| **Premium automation add-on** | £29–£99/mo | Advanced Pedagogue.ai / Principia.ai automations |
| **BitriPay gateway (planned)** | Gateway spread on routed volume | Adds gateway margin alongside Stripe; Stripe remains live |

---

## 4. The ACU / AI-Credit System

The **ACU Wallet** is the core AI-economics engine and is preserved exactly. It converts every AI action into a **prepaid, metered, positive-margin unit** — the usage-based model of Snowflake credits and AWS metering, applied to education AI.

### 4.1 Rules (unchanged)

- **Prepaid.** Users/schools buy ACU in advance.
- **Per-action cost.** Every AI action debits a fixed ACU amount (see §4.3).
- **Hard stop at zero.** When the balance hits zero, AI features **stop** until topped up. No overdraft, no surprise bill, no runaway inference loss.
- **School shared pool.** A school funds one pool; teachers and students draw from it under admin-set allocations and caps.
- **Routed cost awareness.** The Model Router's provider choice (Claude/Gemini/OpenAI) affects real inference cost; ACU pricing holds a stable margin band above blended cost via RAG-cache reuse.

### 4.2 ACU Packs (top-up)

| Pack | ACU | Price | Effective £/1k ACU |
|---|---|---|---|
| Starter | 1,000 | £5 | £5.00 |
| Standard | 5,000 | £20 | £4.00 |
| Value | 15,000 | £50 | £3.33 |
| School Bulk | 100,000 | £280 | £2.80 |
| District | 1,000,000+ | Custom | Volume |

Larger packs lower unit price to reward prepayment and commitment (the volume-discount curve of cloud credits).

### 4.3 ACU Cost-Per-Action Table (illustrative)

| AI action | Engine / agent | ACU cost | Rationale |
|---|---|---|---|
| Diagnostic placement test (full) | Diagnostic Engine | 40 | Heavy multi-step reasoning |
| Roadmap generation / full re-plan | AI Study Roadmap · Mentor.ai | 25 | Sequenced planning over knowledge graph |
| AI tutor message (turn) | AI Learning Tools · Mentor.ai | 3 | RAG-grounded chat turn |
| Quiz generation (10 Q) | AI Learning Tools | 8 | Generation + grounding |
| Flashcard set (20) | AI Learning Tools | 5 | Generation |
| Summary (per document) | AI Learning Tools | 4 | Retrieval + synthesis |
| Essay feedback (per essay) | AI Learning Tools | 12 | Long-context semantic analysis |
| Diagram generation | AI Learning Tools | 6 | Structured visual synthesis |
| Past-paper walkthrough | AI Learning Tools | 10 | Multi-step worked solution |
| Semantic grading (per script) | Pedagogue.ai | 9 | Rubric-aligned assessment |
| Lesson plan draft | Pedagogue.ai | 15 | Structured generation |
| Timetable optimisation run | Principia.ai | 60 | Constraint solving at scale |
| Budget optimisation run | Principia.ai | 45 | Financial modelling |
| Parent summary + translation | Concierge.ai | 5 | Summarise + translate |
| Tutor match run | Matchmaker.ai | 7 | Deficit-based matching |
| Predicted-grade recompute | Progress Intelligence | 6 | Model inference over history |
| Risk-alert scan (per learner) | Progress Intelligence | 2 | Lightweight scoring |

Prices are tuned so that the blended ACU revenue per action stays comfortably above router-blended inference cost, protecting gross margin as model prices move.

---

## 5. Data-Intelligence & White-Label Revenue

| Stream | What is sold | Guardrails |
|---|---|---|
| **Data-intelligence** | Aggregated, anonymised outcome/trend insights (e.g. topic-difficulty benchmarks) to publishers and districts | Never per-identifiable-learner; consent + tenant isolation; residency-aware, the Palantir/aggregation-with-governance model |
| **White-label licensing** | Full StudYear-AI-OS under a partner's brand on a dedicated tenant/sub-domain | Per-tenant licence + revenue share; enterprise SLA |
| **Enterprise plans** | Custom contracts for districts and school chains | Volume ACU pools, data residency, dedicated support, SSO |

---

## 6. Marketplace & BitriPay Gateway Revenue

- **Marketplace revenue:** commission (§3) + premium tutor placement + booking transaction fees — a three-layer take-rate on tutor GMV.
- **BitriPay gateway revenue (planned):** once BitriPay is added **alongside** Stripe, StudYear earns a gateway spread on routed payment volume. The platform can route by cost, region, or method while **Stripe remains fully live** as the default rail.

---

## 7. Intelligence Engines That Drive Revenue

Four always-on engines maximise lifetime value and minimise leakage. These are revenue-optimisation systems, distinct from the five product engines.

### 7.1 Dynamic Pricing Engine

- **Function:** adjusts ACU pack pricing, promotional offers, and marketplace take-rates by segment, region, demand, and elasticity — the surge/segmented-pricing logic Uber and Amazon operate.
- **Inputs:** usage velocity, price sensitivity, seasonality (exam cycles), cohort size.
- **Guardrails:** floors protect margin above router-blended inference cost; caps preserve fairness and trust; every change is auditable.

### 7.2 CLV (Customer Lifetime Value) Engine

- **Function:** scores predicted lifetime value per account across all streams (subscription + ACU + marketplace) to prioritise acquisition spend and success attention.
- **Use:** routes high-CLV schools/tutors to white-glove onboarding; informs Dynamic Pricing eligibility; sizes ACU-pool offers.

### 7.3 Churn-Prevention Engine

- **Function:** driven by **Sentinel.ai**, predicts churn from engagement decay, ACU-burn drop-off, and support signals, then triggers save-plays (targeted ACU grants, outreach, tier right-sizing) — the predictive-retention pattern of ServiceNow and SaaS leaders.
- **Signal example:** a school pool depleting far faster/slower than plan flags either upsell opportunity or disengagement risk.

### 7.4 Upsell / Cross-sell Engines

- **Upsell:** detects tier-ceiling behaviour (e.g. a Plus student repeatedly hitting ACU limits, a Core school exhausting its pool) and prompts an upgrade or ACU pack at the moment of value.
- **Cross-sell:** surfaces adjacent streams — a parent to Family tier, a school to premium automation add-ons, a tutor to Studio — using knowledge-graph signals shared across roles.

---

## 8. Worked Revenue Example (single mid-size school)

| Line | Assumption | Monthly value |
|---|---|---|
| Platform fee (Advanced) | Flat | £799 |
| Per-student seats | 400 × £3.50 | £1,400 |
| ACU top-ups beyond pool | ~2 School Bulk packs | £560 |
| Premium automation add-on | Pedagogue.ai advanced | £99 |
| Marketplace commission (staff tutoring) | On £3k GMV @ 10% | £300 |
| **Indicative monthly total** | | **£3,158** |

Multiply across a district (white-label + enterprise pool) and the streams compound — the diversified, expansion-led revenue base described in `docs/ai-os/00-executive-vision.md`.

---

## 9. Why This Model Wins

StudYear monetises **value delivered, not seats occupied**: subscriptions capture baseline access, the ACU Wallet meters AI as a governed utility with a hard floor against inference loss, and the marketplace, API, partner, data, and white-label streams layer expansion revenue on top — all optimised in real time by the Dynamic Pricing, CLV, Churn, and Upsell engines. Because AI cost is metered and capped while router efficiency (RAG cache + multi-provider routing) drives cost-per-action down, **gross margin expands as usage grows** — the compounding SaaS + usage economics that make StudYear more profitable and more scalable than any point competitor. See `docs/ai-os/01-market-gap-analysis.md` for where this displaces incumbent revenue.
