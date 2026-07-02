# 15 — PART 3: Architectural Implementation Blueprint

How to run the PART 1 platform (`13`) and PART 2 agents (`14`) **sustainably on reliable web
infrastructure** — a relational core (**MariaDB**, on structured hosting such as **Hostinger**)
that **balances AI compute load against transactional performance.** The governing principle:
keep the request path fast and transactional; push heavy intelligence off to async workers.

## 1. Layered runtime architecture

```
┌────────────────────────────────────────────────────────┐
│               CLIENT LAYER (Next.js / Web)             │
└───────────────────────────┬────────────────────────────┘
                            │ API Requests
                            ▼
┌────────────────────────────────────────────────────────┐
│           APPLICATION LAYER (Node.js / PHP Engine)      │
└───────────────────────────┬────────────────────────────┘
             Database Reads  ├──────────────────────────┐ Async Vector
                    / Writes │                          │ Jobs
                            ▼                          ▼
┌──────────────────────────────────────────┐ ┌──────────────────────────────────┐
│      DATA STORAGE LAYER (MariaDB Cluster) │ │  AI COMPUTE LAYER (FastAPI / LLM) │
│  - Multi-tenant structured tables,        │ │  - Vector Embeddings & RAG Cache  │
│    strict indexes                         │ │  - Localized Processing Workers   │
│  - Sharded by School ID / Tenant ID for   │ │  - Model Router → Claude/Gemini/  │
│    low latency                            │ │    OpenAI (14 §0)                 │
└──────────────────────────────────────────┘ └──────────────────────────────────┘
```

| Layer | Tech | Responsibility |
|---|---|---|
| **Client** | Next.js / Web | per-persona surfaces (`01`–`06`); sub-domain per tenant (`13 §0`) |
| **Application** | Node.js / PHP | API/BFF, auth, tenant resolution, business logic, event emission |
| **Data storage** | MariaDB cluster | multi-tenant system of record; sharded by tenant (§2) |
| **AI compute** | FastAPI / LLM workers | agents (`14`), embeddings, RAG, localized processing — **async** (§3) |

The two bottom layers are deliberately **separated**: the transactional core never blocks on
AI. They communicate through jobs/events, not synchronous calls on the request path.

## 2. Strategic Database Partitioning (MariaDB)

To prevent cross-tenant leaks **and** ensure low latency:

- **Composite keys prefixed by `tenant_id`.** Every operational table is keyed/partitioned by
  a composite key whose leading component is a unique `tenant_id` (School or Independent-User
  category). This makes tenant isolation a property of the *storage layout*, not just query
  filters — reinforcing the invariant from `08 §1` / `10 §6` at the physical level.
- **Shard by School ID / Tenant ID.** Large tenants (districts/schools) shard onto dedicated
  partitions/nodes so one busy school can't degrade another — the low-latency promise of
  `13 §0`.
- **Strictly optimized indices** for the hot operational paths — **attendance, messaging, and
  grade logs** — the highest-frequency writes/reads in the system. Index design is driven by
  the real access patterns (per-class-per-day attendance, per-thread messaging, per-student
  grade history), not generic defaults.

> **Why physical, not just logical, isolation:** row-level `tenant_id` filtering (logical) is
> the correctness floor; composite-key partitioning + sharding (physical) is the *performance
> and blast-radius* guarantee. Together they satisfy both compliance (`13 §1.3`) and latency.

## 3. Decoupled Asynchronous AI Engine

Heavy generative work — **lesson-plan synthesis (`14 §3.1`), multi-page grading (`14 §3.2`),
timetable calculation (`14 §2.1`)** — must run on **background worker queues** (e.g. Python
**FastAPI** workers behind **Redis** queues), never inline in the web request.

```
 App Layer ──enqueue job──▶ Redis queue ──▶ FastAPI/LLM workers ──▶ Model Router (Claude/Gemini/OpenAI)
     ▲                                             │
     └───────── result event / write-back ─────────┘  (mastery, drafts, tickets, summaries → MariaDB)
```

- **Fast, responsive core:** transactional operations (mark attendance, post message, submit
  work) return immediately; AI outcomes arrive asynchronously via events/notifications.
- **Backpressure & isolation:** queues absorb spikes; AI outages/rate-limits (handled by
  Model Router failover, `14 §0`) never stall the web tier.
- **RAG cache & embeddings:** the AI compute layer maintains vector embeddings + a RAG cache
  (student notes, curriculum, resources) so agents ground on tenant data efficiently; caches
  are tenant-scoped and privacy-routed (`14 §0.2`).
- **Localized processing workers:** honor data-residency/GDPR (`13 §1.3`) by pinning
  processing to approved regions/providers.

## 4. How the three layers uphold the whole architecture

| Goal (from the vision) | Mechanism here |
|---|---|
| **High engagement** | fast Next.js surfaces + async AI that enriches without slowing |
| **Absolute multi-tenant reliability** | composite-key partitioning + per-tenant sharding (§2) |
| **Deep pedagogical efficiency** | decoupled AI engine runs the `14` agents at scale (§3) |
| **Future-proofing** | provider-agnostic Model Router + kernel-over-surfaces (`00 §6`) |

This blueprint creates a **scalable, future-proof framework** — high engagement, absolute
multi-tenant reliability, and deep pedagogical efficiency across the entire ecosystem —
without ever letting AI compute compromise operational performance.

## 5. Further reading
- **Understanding AI-driven Multi-Tenant EdTech Architectures** — practical context on
  engineering automated tools (AI notes, quizzes, personalized study formats, `11`/`14 §4.2`)
  into platform workflows. *(Reference supplied by the product team; add the canonical link
  when available.)*
