# PART 4 · Production Architecture

> **Scope:** End-to-end production architecture for **StudYear** — the AI-powered Education OS running the loop **Assess → Plan → Learn/Execute → Improve**. This document is the authoritative source for how the transactional core, the async AI-compute plane, tenant isolation, and the commercial (ACU + payments) subsystems fit together.
>
> **Cross-references:** `docs/ai-os/06-security-compliance.md` (security & GDPR controls), `docs/ai-os/08-bitripay-gateway.md` (BitriPay integration), `docs/architecture/09` (canonical data model), `docs/architecture/15` (deployment & environments). Schema in `docs/ai-os/11-database-schema-erd.md`; APIs in `docs/ai-os/12-api-specification.md`.

---

## 1. Architectural Principles

| # | Principle | Consequence in StudYear |
|---|-----------|--------------------------|
| P1 | **Tenant isolation is non-negotiable** | Every row, cache key, queue message, vector namespace, and log line carries `tenant_id`. No query executes without a tenant scope. |
| P2 | **Transactional core stays fast** | Synchronous request path never blocks on an LLM. All AI compute is dispatched to async workers; the API returns a job handle or cached result. |
| P3 | **AI is failover-safe** | The Model Router treats providers (Claude / Gemini / OpenAI) as interchangeable behind a capability contract with automatic failover and residency pinning. |
| P4 | **Money is auditable & idempotent** | ACU debits, Stripe/BitriPay events, and grade changes are append-only, idempotent, and fully audited. Hard stop at ACU = 0. |
| P5 | **Minors first** | Students are often minors; parent/guardian linkage, consent, and data-minimisation gate every student-facing action (see `06-security-compliance.md`). |
| P6 | **Proven building blocks only** | Stripe, Cloudflare, Redis/Redpanda, pgvector/Pinecone, MariaDB Galera, OpenTelemetry. No bespoke infrastructure where a proven pattern exists. |

---

## 2. Layered Architecture Diagram

```
                                   ┌────────────────────────────────────────────┐
                                   │            END USERS (per role)             │
     student · parent · school · school-teacher · private-tutor · platform-admin │
                                   └───────────────┬────────────────────────────┘
                                                   │  https://{tenant}.studyear.app
                            ┌──────────────────────▼──────────────────────┐
   EDGE / CDN              │   Cloudflare: WAF · DDoS · TLS · Bot mgmt ·   │
                          │   geo-routing (data residency) · rate-limit    │
                           └──────────────────────┬──────────────────────┘
                            ┌──────────────────────▼──────────────────────┐
   PRESENTATION            │  Next.js (App Router, RSC, edge middleware)  │
                          │  sub-domain → tenant resolution · SSR/ISR      │
                           └──────────────────────┬──────────────────────┘
                            ┌──────────────────────▼──────────────────────┐
   API GATEWAY             │  Kong/Envoy: authN (JWT) · tenant scope ·    │
                          │  RBAC · rate-limit · idempotency · versioning  │
                           └───┬───────────────┬───────────────┬──────────┘
        ┌──────────────────────┘               │               └───────────────────────┐
┌───────▼────────┐   ┌──────────────────▼────────────────┐   ┌──────────▼───────────┐
│ TRANSACTIONAL   │   │        EVENT BUS / QUEUES          │   │   AI ORCHESTRATION    │
│ CORE            │   │  Redis Streams (hot) + Redpanda    │   │   LAYER (control)     │
│ Node.js + PHP   │──▶│  (durable log) · outbox pattern    │──▶│  Agent supervisor     │
│ services        │   │                                    │   │  Sentinel/Principia/  │
│ · Users/RBAC    │   └───────┬───────────────┬────────────┘   │  Pedagogue/Mentor/    │
│ · Academic      │           │               │                │  Concierge/Matchmaker │
│ · ACU/Billing   │           │               │                └───────┬──────────────┘
│ · Bookings      │           │               │                        │
│ · Notifications │           │               ▼                        ▼
└───────┬─────────┘           │       ┌────────────────┐      ┌─────────────────────┐
        │                     │       │ WEBHOOK ENGINE │      │  AI COMPUTE PLANE    │
        │                     │       │ signed egress  │      │  FastAPI LLM workers │
        │                     │       │ + ingress verif│      │  · RAG pipeline      │
        │                     │       └────────────────┘      │  · RAG/result cache  │
        │                     │                               │  · Model Router      │
        │                     ▼                               └───┬─────────────┬────┘
┌───────▼───────────────────────────────┐                        │             │
│  DATA LAYER                            │                ┌───────▼──────┐ ┌────▼─────────┐
│  MariaDB Galera cluster                │◀───────────────│ Vector DB    │ │ Model providers
│  · shard by tenant_id                  │  agent memory  │ pgvector /   │ │ Claude·Gemini
│  · composite PK (tenant_id, id)        │  write-back    │ Pinecone     │ │ OpenAI (egress)
│  Redis (cache/session) · S3 (blobs)    │                │ per-tenant NS│ └──────────────┘
└────────────────────────────────────────┘               └──────────────┘

  OBSERVABILITY (all layers): OpenTelemetry traces · Prometheus metrics · Loki logs · Sentry errors
  AUDIT (all writes): append-only audit_events · immutable · tenant-scoped
```

**The async AI-compute split.** The transactional core (Node.js/PHP behind the API gateway) owns all synchronous, latency-sensitive reads/writes — auth, profile, ACU balance checks, bookings, grade logs. When an action needs an LLM (tutoring reply, diagnostic scoring, resource generation, risk analysis), the core:

1. Validates tenant + RBAC + ACU balance (hard stop if insufficient).
2. Reserves ACU (soft-hold) and writes an `ai_usage_logs` intent row.
3. Publishes a job to Redis Streams (`ai.jobs.{engine}`) and returns `202 Accepted` with a `job_id` (or a cached answer if the RAG/result cache hits).
4. FastAPI LLM workers consume the job, run RAG retrieval, call the Model Router, stream tokens back over WebSocket/SSE, then emit a completion event that finalises the ACU debit and updates mastery.

This keeps p99 of the transactional core under ~150 ms even while LLM calls take seconds.

---

## 3. Frontend (Next.js)

| Concern | Implementation |
|---------|----------------|
| Framework | Next.js App Router, React Server Components, TypeScript |
| Tenant resolution | Edge middleware reads `{tenant}.studyear.app`, resolves `tenant_id` from an edge-cached tenant registry, injects it into request context; unknown sub-domains → marketing shell |
| Rendering | SSR for authed dashboards, ISR for content-library/marketing, streaming for AI-tutor responses (SSE) |
| Auth on client | Short-lived access JWT in memory, refresh token in `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to the tenant sub-domain |
| State | React Query (server cache) + Zustand (UI). No cross-tenant state ever persisted client-side |
| Realtime | WebSocket channel per user for AI-tutor streams, notifications, ACU balance updates |
| Accessibility | WCAG 2.2 AA; minor-safe UI copy; no dark patterns on billing |
| The 20 modules | Each module is a route group under a role-guarded layout; server actions call the API gateway, never the DB directly |

---

## 4. Backend (Node.js / PHP) — Transactional Core

Polyglot core: **Node.js (NestJS/Fastify)** for new event-driven services and realtime; **PHP (Laravel)** retained for the mature billing/admin/reporting surface. Both sit behind the same API gateway and share the MariaDB cluster and Redis.

| Service | Runtime | Owns |
|---------|---------|------|
| `identity-svc` | Node | Users, sessions, JWT issuance, refresh rotation, MFA |
| `rbac-svc` | Node | Roles, permissions, policy evaluation |
| `academic-svc` | Node | Student profiles, subjects/topics, mastery, study plans |
| `assessment-svc` | Node | Diagnostics lifecycle, submissions, grading |
| `marketplace-svc` | Node | Tutor offerings, bookings, sessions |
| `acu-svc` | PHP | ACU wallets, packs, transactions, shared school pools, hard-stop enforcement |
| `billing-svc` | PHP | Subscriptions, invoices, Stripe + BitriPay orchestration |
| `notify-svc` | Node | Notification engine (email/SMS/push/in-app), templating, preferences |
| `admin-svc` | PHP | Admin Control Panel, reports/exports, GDPR request handling |
| `webhook-svc` | Node | Signed webhook egress + third-party ingress verification |

Every service resolves `tenant_id` from the validated JWT/gateway context and applies it as a mandatory predicate. A shared data-access layer refuses any query lacking a tenant scope (fail-closed).

---

## 5. Database (MariaDB Cluster)

### 5.1 Topology
- **MariaDB Galera** synchronous multi-primary cluster (Hostinger managed) for HA within a region.
- **Sharding by `tenant_id`**: tenants are assigned to physical shards via a directory table (`tenant_shard_map`) in a small global control DB. A tenant lives entirely on one shard (no cross-shard tenant), so all its queries and JOINs stay local.
- **Read replicas** per shard for reporting/analytics offload.
- **Composite primary keys**: every tenant-scoped table uses `PRIMARY KEY (tenant_id, id)` so data is physically clustered per tenant, enabling clean partition pruning and cheap per-tenant export/delete (GDPR).

### 5.2 Routing
```
{tenant}.studyear.app
        │ edge middleware → tenant_id
        ▼
  tenant_shard_map (global control DB, edge-cached)
        │ tenant_id → shard_id + dsn
        ▼
  connection pool for shard_id  ──▶  MariaDB Galera (region-pinned for residency)
```
Data residency: EU tenants pin to EU shards; the shard map records `residency_region`, and both DB routing and the Model Router honour it.

### 5.3 Isolation & partitioning
- Row-level scoping enforced in the data-access layer **and** as a defence-in-depth via per-tenant DB users/views on high-risk tables.
- Large activity tables (`acu_transactions`, `attendance`, `ai_usage_logs`, `messages`) are **range-partitioned by month** within each shard and sub-clustered by `tenant_id` for retention and pruning.
- See `docs/ai-os/11-database-schema-erd.md` for full DDL, indexes, and the ERD.

---

## 6. Authentication & RBAC

### 6.1 AuthN
- OIDC-compatible flows; access token = short-lived JWT (10 min), refresh token rotated on use with reuse-detection.
- JWT claims: `sub` (user_id), `tid` (tenant_id), `role`, `scopes[]`, `residency`, `amr` (MFA state), `jti`.
- MFA (TOTP/WebAuthn) required for School, Tutor payout, and Platform Admin. Minors: no SMS; parent-mediated recovery.
- Service-to-service: mTLS + signed service JWTs.

### 6.2 RBAC (roles → permissions)
Six roles map to permission sets evaluated by `rbac-svc` (deny-by-default). Permissions are `resource:action` (e.g. `student.grade:write`, `acu.wallet:read`). Guardianship and school-membership add **relationship-scoped** grants (a parent may only read their linked children; a teacher only their assigned cohorts).

| Role | Representative scope |
|------|----------------------|
| Platform Admin | Global (cross-tenant) with break-glass + full audit |
| School | All students/teachers/classes within tenant; shared ACU pool admin |
| School Teacher | Assigned cohorts only; assignments, grades, progress |
| Private Tutor | Own offerings, bookings, sessions, linked students |
| Parent | Linked children (read + consent actions); own billing |
| Student (often minor) | Own profile, diagnostics, tutor, plans; consent-gated |

Policy decisions are cached per (user, tenant) with short TTL and invalidated on role/link change.

---

## 7. AI Orchestration Layer

The orchestration layer is the **control plane** for the six named agents. It decomposes a user intent into a plan, selects the agent(s), assembles context (profile + mastery + RAG), enforces ACU/RBAC/residency, dispatches to the compute plane, and reconciles results (mastery update, ACU debit, audit).

| Agent | Engine mapping | Responsibility |
|-------|----------------|----------------|
| **Sentinel** | Progress Intelligence / Safety | Risk detection, safeguarding flags, anomaly & abuse monitoring, `risk.flagged` events |
| **Principia** | AI Study Roadmap | Builds/updates prioritised study plans from diagnostics + mastery + confidence |
| **Pedagogue** | Diagnostic + AI Learning Tools | Scores diagnostics, generates resources, adapts difficulty |
| **Mentor** | AI Tutor | Conversational tutoring, worked solutions, Socratic hints |
| **Concierge** | Notifications / onboarding | User guidance, nudges, summaries for parents/schools |
| **Matchmaker** | Tutor Marketplace | Matches students to tutor offerings, availability, fit scoring |

Orchestration guarantees:
- **ACU pre-flight**: no agent runs without a successful soft-hold on ACU (hard stop at zero; school shared-pool fallback if configured).
- **Deterministic tool contracts**: agents call typed internal tools (read mastery, write plan, log usage) — never raw DB access.
- **Traceable**: every agent step emits an OpenTelemetry span and an `ai_usage_logs` row (prompt hash, tokens, provider, cost, latency).

---

## 8. Agent Memory Layer

Two-tier memory, always tenant-namespaced:

| Tier | Store | Contents | Lifetime |
|------|-------|----------|----------|
| Short-term (working) | Redis (per session) | Conversation window, active plan context, tool results | Session / TTL |
| Long-term (semantic) | Vector DB namespace `{tenant_id}` | Distilled learner facts, misconceptions, mastery deltas, tutor session summaries | Persistent, GDPR-erasable |
| Structured recall | MariaDB (`mastery`, `study_plans`, profile) | Authoritative grades/mastery — the source of truth memory is reconciled against | Persistent |

Write-back path: after an AI session, the orchestrator distils durable facts, embeds them, and upserts into the tenant vector namespace **and** updates `mastery` transactionally. Memory reads are filtered by `tenant_id` + `student_id` at the vector query layer (metadata filter) — cross-tenant retrieval is structurally impossible.

---

## 9. Vector Database & RAG

- **Store:** pgvector (self-managed, EU/US regional instances for residency) with Pinecone as a managed scale-out option; both accessed behind a `retrieval-svc` façade.
- **Namespacing:** one logical namespace per `tenant_id`; every vector carries metadata `{tenant_id, student_id?, subject_id, topic_id, doc_type, residency}`.
- **RAG pipeline:** query → embed → ANN search (tenant-filtered) → rerank → context assembly → Model Router → grounded generation with citations back to `content_library`/`learning_resources`.
- **RAG/result cache:** semantic cache keyed by `(tenant_id, normalized_prompt_hash, model_capability)`; a hit returns instantly and **skips ACU debit for the LLM call** (only cache-serve fee applies), protecting both latency and cost.
- Embeddings are generated by the Model Router's embedding capability with the same residency pinning.

---

## 10. Multi-Provider Model Router

A dedicated service in the AI compute plane that abstracts **Anthropic Claude / Google Gemini / OpenAI** behind capability contracts.

### 10.1 Capability routing
Requests declare a **capability**, not a model: `chat.tutor`, `reasoning.plan`, `scoring.diagnostic`, `generation.resource`, `embedding.text`, `vision.ocr`, `safety.classify`. Each capability has a ranked provider/model policy per tenant residency.

| Capability | Primary | Secondary (failover) | Notes |
|------------|---------|----------------------|-------|
| `chat.tutor` | Claude (Mentor) | Gemini | Streaming; low-latency profile |
| `reasoning.plan` | Claude | OpenAI | Long-context planning for Principia |
| `scoring.diagnostic` | OpenAI | Claude | Structured JSON grading |
| `generation.resource` | Gemini | Claude | Multimodal resource creation |
| `embedding.text` | OpenAI `text-embedding` | Gemini | Must match index's embedding space |
| `safety.classify` | Claude | OpenAI | Sentinel safeguarding |

### 10.2 Failover
- Health checks + circuit breakers per provider; on 5xx/timeout/rate-limit the router retries the next provider in the capability policy with jittered backoff.
- Idempotency keys prevent double-billing on retry.
- **Embedding failover caveat:** the router will only fail over to an embedding model that shares the index's vector space; otherwise it queues rather than corrupt recall.

### 10.3 Data residency
- Each tenant has `residency_region` (from `tenant_shard_map`). The router filters the eligible provider/model list to those with a compliant regional endpoint/DPA before ranking. An EU-pinned tenant never egresses to a non-compliant region even during failover; if no compliant provider is available the job is held and Sentinel raises an operational alert.
- All egress logged (provider, region, token counts, prompt hash — never raw minor PII) to `ai_usage_logs`.

---

## 11. Event-Driven Workflows (Redis queues / event bus)

- **Hot path:** Redis Streams for low-latency job queues (`ai.jobs.*`, `notify.*`) with consumer groups.
- **Durable log:** Redpanda (Kafka API) as the append-only event backbone for domain events (`diagnostic.completed`, `booking.confirmed`, `payment.succeeded`, `acu.depleted`, `session.completed`, `risk.flagged`).
- **Outbox pattern:** services write domain events to an `outbox` table in the same DB transaction as the state change; a relay publishes to the bus — guaranteeing no lost/duplicated events across the transactional/eventing boundary.
- **Consumers:** notification engine, webhook engine, mastery updater, analytics/reporting, audit sink. Each consumer is idempotent (dedupe on `event_id`).

Representative workflow — diagnostic completion:
```
submission → assessment-svc writes grade + outbox(diagnostic.completed)
          → bus → [Principia: rebuild plan] [mastery updater] [Concierge: notify parent]
                  [webhook-svc: signed diagnostic.completed to school integration]
                  [Sentinel: risk scan → maybe risk.flagged]
```

---

## 12. API Gateway

- **Kong/Envoy** in front of all services. Responsibilities: TLS termination, JWT validation, tenant-scope injection, RBAC pre-check, per-tenant + per-route rate limiting, request/response schema validation, **idempotency-key** handling, API versioning (`/v1`), and request tracing headers.
- Rejects any request whose token tenant (`tid`) mismatches the sub-domain-derived tenant — closing the confused-deputy gap.
- Full spec in `docs/ai-os/12-api-specification.md`.

---

## 13. Webhook Engine

- **Egress:** signed outbound webhooks (HMAC-SHA256 over body with per-endpoint secret; `StudYear-Signature` + timestamp; replay window). Events: `payment.succeeded`, `acu.depleted`, `diagnostic.completed`, `risk.flagged`, `booking.confirmed`, `session.completed`. At-least-once delivery with exponential backoff, DLQ, and a redelivery console in Admin.
- **Ingress:** verifies third-party signatures — **Stripe** (`Stripe-Signature`) and **BitriPay** (see `docs/ai-os/08-bitripay-gateway.md`) — before enqueueing; rejects on bad signature or stale timestamp.
- Every delivery attempt is audited and idempotent by `event_id`.

---

## 14. Payment Gateway Layer

| Provider | Status | Use |
|----------|--------|-----|
| **Stripe** | **Live** | Subscriptions/plans, ACU pack purchases, invoices, tutor payouts (Connect), SCA/3DS |
| **BitriPay** | **Planned** | Alternative/regional rails; abstracted behind the same `PaymentProvider` interface — see `docs/ai-os/08-bitripay-gateway.md` |

- Unified `PaymentProvider` interface (`createCheckout`, `capture`, `refund`, `verifyWebhook`) so `billing-svc` is provider-agnostic; adding BitriPay is a new adapter, not a rewrite.
- All money mutations are idempotent (idempotency key = client key or Stripe/BitriPay event id) and append-only in `payments`/`invoices`.
- **ACU coupling:** a settled `payment.succeeded` for an ACU pack triggers a single credited `acu_transactions` row (idempotent on payment id). Hard stop: when a wallet hits zero, `acu.depleted` fires and AI actions are blocked until top-up or shared-pool fallback.

---

## 15. Notification Engine

- Channels: in-app, email, SMS (no SMS to minors), web push. Preference-aware and role-aware (e.g. Parent Command Centre digests).
- Template registry with locale + tenant branding; all sends logged to `notifications` and audited.
- Triggered by domain events (risk flags, ACU low/depleted, booking confirmations, grade posted, diagnostic ready). Rate-limited and deduplicated to avoid nudge fatigue.

---

## 16. Audit Log

- **Append-only `audit_events`** (per tenant, monthly-partitioned). Every state-changing action records `actor_id`, `tenant_id`, `action`, `resource`, `before/after` hash, `ip`, `request_id`, `ts`.
- Immutable at the storage layer (WORM export to object store); tamper-evident via hash-chaining per tenant per day.
- Mandatory for: auth events, RBAC/role changes, grade edits, ACU transactions, payments, GDPR requests, admin actions, AI egress. See `06-security-compliance.md`.

---

## 17. Admin Control Layer

- **Admin Control Panel** (`admin-svc`): tenant provisioning, shard assignment, role/permission management, feature flags, ACU pack catalogue, webhook redelivery, GDPR request processing, reports/exports.
- **Break-glass** cross-tenant access requires elevated MFA, is time-boxed, reason-logged, and generates a high-severity audit + alert.

---

## 18. Security Layer

Defence-in-depth (full detail in `docs/ai-os/06-security-compliance.md`):
- Edge: Cloudflare WAF/DDoS/bot; TLS 1.3 everywhere; HSTS.
- App: input validation, output encoding, CSRF on cookie flows, per-tenant secrets, least-privilege DB users.
- Data: encryption at rest (DB + object store), field-level encryption for sensitive minor PII, KMS-managed keys, tenant-scoped export/erase.
- AI: prompt-injection guards, PII redaction before egress, provider DPAs, Sentinel abuse detection, no training on tenant data.
- Access: deny-by-default RBAC, MFA on privileged roles, mTLS service mesh.

---

## 19. Observability / Monitoring

| Signal | Tooling | Notes |
|--------|---------|-------|
| Traces | OpenTelemetry → Tempo/Jaeger | End-to-end incl. AI job span across core→queue→worker→provider |
| Metrics | Prometheus + Grafana | RED/USE per service; ACU burn rate; provider latency/error; per-tenant SLOs |
| Logs | Loki (structured, tenant-tagged) | No raw minor PII; prompt hashes only |
| Errors | Sentry | Release-tracked, tenant-tagged |
| Product/AI | `ai_usage_logs` warehouse (Snowflake/Databricks) | Cost, tokens, cache hit-rate, mastery lift |

SLOs: transactional core p99 < 150 ms; AI job dispatch < 250 ms; AI first-token < 2 s; 99.9% API availability.

---

## 20. Error Handling

- Consistent error envelope (`code`, `message`, `request_id`, `details`) across all APIs — see `12-api-specification.md` error table.
- Fail-closed on tenant/RBAC/ACU checks; fail-open never for money or safety.
- AI compute: typed failure classes (`provider_unavailable`, `residency_blocked`, `acu_insufficient`, `content_flagged`) surfaced to the client with safe messaging; partial results recoverable via `job_id`.
- Retries only where idempotent; DLQs for poison messages with alerting.

---

## 21. Scalability Logic

- **Horizontal, tenant-sharded:** add shards and rebalance tenants via `tenant_shard_map`; no tenant spans shards, so scaling is linear and blast-radius is one tenant.
- **Stateless services** behind the gateway autoscale on CPU/RPS; LLM workers autoscale on queue depth (Redis Streams lag) independently of the core.
- **Cache tiers:** edge (Cloudflare) → Redis (session/policy/hot rows) → RAG semantic cache — each layer sheds load from the DB and the LLM providers.
- **Backpressure:** ACU pre-flight + queue-depth-based admission control prevent LLM cost/latency blowups; shared school pools smooth spikes.

---

## 22. DevOps / CI-CD

- **IaC:** Terraform (Cloudflare, object store, DB, queues) + Helm/Kompose for service deploys.
- **Pipeline:** PR → lint/typecheck/unit → integration (ephemeral tenant on a test shard) → security scan (SAST/deps/secrets) → build immutable images → deploy to staging → smoke + contract tests → **canary** (single tenant cohort) → progressive rollout.
- **Migrations:** expand/contract pattern, applied per shard with online schema change (gh-ost/pt-osc) to avoid locking hot tables.
- **Secrets:** Vault/KMS; no secrets in images or env files in the repo.
- Feature flags decouple deploy from release; every release tagged in Sentry/traces.

## 23. Disaster Recovery

- **Backups:** per-shard automated snapshots + binlog PITR (retained per residency policy); nightly logical exports to region-matched object storage; vector DB snapshots.
- **Targets:** RPO ≤ 5 min (binlog PITR), RTO ≤ 60 min for a shard restore.
- **Cross-region standby** for critical control DB (`tenant_shard_map`, identity) with promotion runbooks.
- Quarterly restore drills; backups encrypted and residency-pinned.

## 24. Business Continuity

- **Degradation ladder:** if AI providers are all down/residency-blocked → transactional core stays fully available; AI actions queue and surface "processing" state (no ACU charged until served). If a shard is down → only that tenant cohort is affected; status page + targeted comms.
- **Payment continuity:** Stripe outage → queue purchases, reconcile on recovery; BitriPay (when live) provides an alternate rail.
- **Runbooks & on-call:** per-subsystem runbooks (DB failover, provider failover, webhook DLQ drain, ACU reconciliation); incident severities tied to SLOs; comms templates for schools/parents.
- **Safeguarding continuity:** Sentinel risk-flag path is treated as critical — degraded but never disabled; flags persist and alert even when other AI is throttled.

---

*Next: `docs/ai-os/11-database-schema-erd.md` (schema + ERD) and `docs/ai-os/12-api-specification.md` (REST + webhooks).*
