# 00 — Macro Architecture: The Edu-OS Thesis

## 1. The systemic problem

Education technology is fragmented along the seams of the learning journey:

- **LMS / SIS** products serve the *institution* but ignore private tutoring.
- **Marketplaces** connect learners to *tutors* but have no relationship with the school.
- **Parent apps** report grades but can't act on them (book help, pay, approve).
- **Student apps** gamify practice but are disconnected from the actual curriculum.

The learner sits at the center of all four, yet the four never share a substrate. The
result is duplicated identity, siloed progress data, broken hand-offs, and no single
system that can reason about a learner holistically.

## 2. The thesis: one kernel, five surfaces

Studyear treats education as an **operating system**. Like an OS, it exposes a small,
stable **kernel** of shared services, and many **user-space surfaces** (the personas)
that compose those services differently.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PERSONA SURFACES (user-space)                   │
│                                                                        │
│   Admin      School/Teacher      Tutor       Student       Parent      │
│    │              │                │            │             │        │
└────┼──────────────┼────────────────┼────────────┼─────────────┼────────┘
     │              │                │            │             │
┌────┴──────────────┴────────────────┴────────────┴─────────────┴────────┐
│                         THE EDU-OS KERNEL                               │
│                                                                        │
│  Identity &   Learning     Scheduling &   Content &    Commerce &      │
│  Tenancy      Records      Booking        Assessment   Billing         │
│                                                                        │
│  Communication & Notifications   │   Analytics & Insight   │  Files    │
├────────────────────────────────────────────────────────────────────────┤
│              PLATFORM SERVICES (auth, events, storage, jobs)           │
└────────────────────────────────────────────────────────────────────────┘
```

**Design consequence:** a student's mastery of "quadratic equations" is a single fact in
the Learning Records service. The teacher who taught it, the tutor hired to reinforce it,
the parent who monitors it, and the admin who audits it all read/write the *same* fact
through different lenses and permissions. No re-entry, no reconciliation.

## 3. Architectural layers

### 3.1 Platform services (foundation)
Auth, an event bus, object storage, background jobs, search, and the multi-tenant data
plane. Everything above is built on these primitives. See `08-technical-architecture.md`.

### 3.2 The kernel (shared domain services)

| Kernel service | Owns | Consumed by |
|---|---|---|
| **Identity & Tenancy** | users, roles, tenants, households, relationships | all |
| **Learning Records** | enrollments, mastery, progress, transcripts | all |
| **Scheduling & Booking** | calendars, sessions, availability, bookings | teacher, tutor, student, parent |
| **Content & Assessment** | courses, lessons, assignments, quizzes, submissions, grades | teacher, tutor, student |
| **Commerce & Billing** | plans, subscriptions, invoices, payouts, wallets | admin, tutor, parent |
| **Communication** | threads, announcements, in-session chat/video signaling | all |
| **Analytics & Insight** | dashboards, reports, alerts, at-risk detection | all |
| **Files & Media** | uploads, recordings, resources | all |

### 3.3 Persona surfaces (user-space)
Each persona composes kernel services into a coherent product. The same booking service
powers a tutor publishing availability and a parent booking a session — the *surface*
differs, the *service* does not.

## 4. Multi-tenancy as a first principle

Studyear is **multi-tenant by construction**. A *tenant* is an isolated operating context
— typically a school, a district, a tutoring company, or a franchise. Data, branding,
policy, and billing are tenant-scoped. Individual tutors and independent parents operate
in a shared **"platform" tenant**.

Key invariants:
- Every domain row carries a `tenant_id`; the data plane enforces isolation (see `08`).
- **Identity is global, membership is tenant-scoped.** One human = one Studyear identity,
  which can hold roles in multiple tenants (e.g. a person is a teacher in School A and a
  parent in the platform tenant).
- **Admin is a two-tier role:** *Global Admin* (Studyear operator) and *Tenant Admin*
  (institution operator) share a surface but differ in scope.

## 5. The "closed loop" — why all five must coexist

The platform's defensibility is the **feedback loop** between the personas:

1. **Teacher** records that a student is weak in a topic → Learning Records.
2. **Analytics** flags the student as "at-risk" on that topic → alert.
3. **Parent** receives the alert, searches for help → Booking + Marketplace.
4. **Tutor** is discovered, booked, and paid → Scheduling + Commerce.
5. **Tutor** teaches, updates mastery on the *same* topic → Learning Records.
6. **Teacher** and **Parent** both see the improvement → Analytics.
7. **Admin** sees engagement, revenue, and outcomes lift → platform health.

No single-persona product can close this loop. That closure is the product.

## 6. Non-goals / boundaries

- Studyear is not a general video-conferencing tool — it *orchestrates* sessions and may
  embed a provider, but real-time media is a pluggable dependency.
- It is not an accounting suite — Commerce integrates with payment/payout processors
  rather than reimplementing ledgers of record.
- Persona surfaces are opinionated but the kernel is the contract; new surfaces (e.g. a
  future "Counselor" or "District Superintendent" persona) attach without kernel changes.

See the [persona teardowns](01-personas.md) next for the micro-level view.
