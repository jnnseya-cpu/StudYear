# 08 — Technical Architecture

The engineering foundation beneath the persona surfaces: how multi-tenancy, services, data
flow, and integrations are structured to uphold the invariants declared in `00`–`07`.

## 1. Multi-tenancy model

Studyear is **multi-tenant by construction**. Recommended posture: **shared schema with a
mandatory `tenant_id` discriminator**, enforced at the data-access layer (row-level
security / a scoped repository), with the option to promote large tenants (districts) to
isolated schemas/databases without changing application code.

| Concern | Approach |
|---|---|
| Isolation | every domain row carries `tenant_id`; RLS / scoped repos enforce it |
| Identity | **global** — one human, one identity, many memberships |
| Membership | **tenant-scoped** — `(user, tenant, role)` triples |
| Branding/config/policy | tenant-scoped config documents |
| Billing | platform-billing (Studyear↔tenant) separate from in-tenant commerce |
| Independent users | tutors & households live in a shared **platform tenant** |

**Invariant:** no query crosses `tenant_id` without an explicit, audited platform-admin
scope. This is the single most important safety property.

## 2. Service map (the kernel)

```
              ┌───────────────────────── API / BFF layer ─────────────────────────┐
              │  per-surface Backends-For-Frontend compose kernel services         │
              └───────────────────────────────┬───────────────────────────────────┘
                                               │
   ┌───────────┬───────────┬───────────┬───────┴────┬───────────┬───────────┬───────────┐
   ▼           ▼           ▼            ▼            ▼           ▼           ▼           ▼
Identity &  Learning   Scheduling   Content &    Commerce &  Communi-    Analytics    Files &
Tenancy     Records    & Booking    Assessment   Billing     cation      & Insight     Media
   │           │           │            │            │           │           │           │
   └───────────┴───────────┴──────── EVENT BUS ──────┴───────────┴───────────┴───────────┘
                                               │
              ┌───────────────────────────────┴───────────────────────────────┐
              │  Platform: AuthN/Z · Jobs/queues · Search · Object store · DB  │
              └────────────────────────────────────────────────────────────────┘
```

Each kernel service owns its data and exposes an API; **cross-service reads go through APIs
or the event bus, never direct table access.** Read-models (e.g. the student HUD, the
parent multi-child dashboard) are materialized from events for fast composition.

## 3. Event-driven backbone

Domain services emit events; consumers build projections and trigger workflows. Core events:

| Event | Emitted by | Notable consumers |
|---|---|---|
| `tenant.created` | Identity & Tenancy | provisioning jobs, Commerce |
| `enrollment.changed` | Learning Records | HUD, gradebook, parent dashboard |
| `submission.created` | Content & Assessment | grading queue, teacher/tutor surface |
| `grade.posted` | Content & Assessment | mastery update, notifications, analytics |
| `mastery.updated` | Learning Records | analytics, student trends, parent view |
| `attendance.marked` | Scheduling | intervention dashboard, parent, compliance |
| `risk.flagged` | Analytics | parent alert, tutor suggestions |
| `booking.confirmed` | Scheduling & Booking | calendars, commerce authorization |
| `session.completed` | Scheduling & Booking | feedback prompt, mastery, escrow release |
| `payment.settled` / `payout.released` | Commerce | ledgers, notifications |
| `audit.event` | any privileged action | Audit store |

**Why events:** the closed loop spans many services and personas; an event backbone lets a
teacher's `grade.posted` reach a parent's alert and a tutor's suggestion without those
services being coupled.

## 4. Data flow: the closed loop end-to-end

1. `grade.posted` → Learning Records computes `mastery.updated`.
2. Analytics consumes `mastery.updated`, evaluates thresholds, emits `risk.flagged`.
3. Notifications turns `risk.flagged` into a parent alert (channel per preference).
4. Parent books → `booking.confirmed`; Commerce authorizes/escrows payment.
5. Session runs → `session.completed`; tutor posts feedback + `mastery.updated`.
6. Analytics recomputes; teacher & parent read the improved record; Commerce releases
   escrow → `payout.released`.
7. Admin's outcomes/revenue rollups reflect the whole cycle.

## 5. Real-time & AI dependencies (pluggable)

- **Live sessions** (teacher virtual classroom, tutor sessions, parent conferences): a
  pluggable media provider is orchestrated by Scheduling & Booking; artifacts persist to
  Files. The platform owns scheduling/identity/recording metadata, not the media transport.
- **AI services** (student snap-to-solve, study-sandbox generation, auto-grading assist,
  risk detection): stateless generation/inference behind an internal API, always writing
  results back as first-class, topic-tagged domain data so nothing an AI produces is a silo.

## 6. Integrations

| Integration | Purpose | Boundary |
|---|---|---|
| SIS / roster sync | bulk user & enrollment onboarding | Identity & Tenancy import |
| Payment / payout processor | move money in/out | Commerce integrates; never reimplements ledger-of-record |
| Video/whiteboard provider | real-time media | orchestrated, pluggable |
| Notification transports (email/push/SMS) | fan-out | behind Notification service |
| Regional-authority export formats | compliance | Analytics/Files export adapters |
| Object storage | uploads, recordings, resources | Files service |

## 7. Cross-cutting concerns

- **Security & privacy:** least-privilege (see `10`), tenant isolation, encryption at rest/
  in transit, minor-data protections tied to guardianship, right-to-be-forgotten jobs.
- **Auditability:** append-only audit log for every privileged/cross-scope action,
  including admin impersonation.
- **Observability:** per-tenant health/usage/outcome dashboards; SLOs on the event backbone.
- **Extensibility:** new personas (e.g. Counselor, Superintendent) attach as new surfaces
  over the existing kernel — no kernel change required.

See [Data Model](09-data-model.md) and [Permissions & RBAC](10-permissions-rbac.md).
