# 01 — The Five Personas & Their Relationships

The ecosystem is defined not just by five actors, but by the **directed relationships**
between them. This document is the map; the per-persona files (`02`–`06`) are the territory.

## 1. The persona graph

```
                         ┌───────────────────────┐
                         │  GLOBAL / TENANT ADMIN │
                         │  (governs everything)  │
                         └───────────┬───────────┘
             provisions / governs    │    monitors / bills
        ┌───────────────┬────────────┼────────────┬───────────────┐
        ▼               ▼            ▼             ▼               ▼
  ┌───────────┐  ┌───────────┐               ┌───────────┐  ┌───────────┐
  │  SCHOOL / │  │   TUTOR   │               │  STUDENT  │  │  PARENT   │
  │  TEACHER  │  │           │               │           │  │           │
  └─────┬─────┘  └─────┬─────┘               └─────┬─────┘  └─────┬─────┘
        │ teaches      │ tutors                    │              │
        │ assesses     │ (booked by parent/student)│  guardian-of │
        └──────────────┴───────────────────────────┴──────────────┘
                          all converge on the LEARNER
```

## 1b. Provisioning topology (who the kernel spawns)

The relationship graph above shows *interactions*; this tree shows the **provisioning
hierarchy** — how the Admin kernel spawns tenants and how members attach beneath them:

```
                    [ GLOBAL / TENANT ADMIN ]   ← the core OS kernel
                    /          |          \
                   /           |           \
            [SCHOOLS]      [STUDENTS]   [PRIVATE TUTORS]
                |              |  \
           [TEACHERS]         |   \
                              |    [PARENTS]
```

- **Admin → Schools / Students / Private Tutors:** the three provisioned member-types.
- **Schools → Teachers:** teachers exist *within* a school tenant.
- **Students → Parents:** the guardianship edge attaches a parent to a student's household.

Independent tutors and households sit in the shared **platform tenant**; schools/districts
are their own tenants (`02 §2.1`, `08 §1`).

## 2. Persona definitions

### 2.1 Global / Tenant Admin
The **operator**. Two tiers sharing one surface:
- **Global Admin** — Studyear staff. Provisions tenants, sets platform policy, owns
  platform revenue, and can impersonate for support.
- **Tenant Admin** — an institution's administrator (principal, ops manager, franchise
  owner). Governs users, curriculum, policy, and billing *within their tenant only*.

Mindset: *"Keep the ecosystem healthy, compliant, and solvent."*

### 2.2 School / Teacher
The **formal instructor**, bound to a curriculum and a roster. Operates inside a tenant
(a school/district). Delivers lessons, assigns and grades work, and reports outcomes
up to parents and admins.

Mindset: *"Move my whole class along the curriculum and flag who needs help."*

### 2.3 Tutor
The **supplemental instructor**, discovered and booked on demand. May be independent
(platform tenant) or employed by a tutoring-company tenant. Publishes offerings and
availability, gets matched to demand, teaches 1:1 or small-group, and gets paid.

Mindset: *"Fill my calendar with the right students and get paid reliably."*

### 2.4 Student
The **learner** — the gravitational center of the system. Consumes both formal (teacher)
and supplemental (tutor) learning, submits work, tracks mastery, and seeks help.

Mindset: *"Know what to do next, do it, and see myself improving."*

### 2.5 Parent
The **sponsor & supervisor**. Holds a household of one or more student dependents.
Monitors progress, communicates with teachers/tutors, pays for services, and approves
activity (bookings, spend, permissions).

Mindset: *"Is my child on track, and what should I do about it?"*

## 3. The relationships (edges) that matter

| Edge | Nature | Kernel service that models it |
|---|---|---|
| Admin → Tenant | provisions, configures, bills | Identity & Tenancy, Commerce |
| Admin → any user | governs, supports, impersonates | Identity & Tenancy |
| Teacher → Student | enrollment (class roster) | Learning Records |
| Teacher → Parent | reporting / conferencing | Communication, Analytics |
| Tutor ↔ Student | booking (session) | Scheduling & Booking |
| Parent → Student | guardianship (household) | Identity & Tenancy |
| Parent → Tutor | discovery, booking, payment | Booking, Commerce |
| Parent → Teacher | communication, approvals | Communication |
| Student → Content | consumption, submission | Content & Assessment |

## 4. The linchpin relationships

Two relationships are structurally special because they let one identity span contexts:

1. **Guardianship (Parent → Student).** A parent *acts on behalf of* a dependent. Below a
   configurable age/policy threshold the parent is the account's controller (approvals,
   spend, comms); above it, the student self-serves with parental visibility. This edge is
   what lets an alert from a *teacher* trigger a booking by a *parent* for a *tutor* — the
   closed loop from `00-overview.md`.

2. **Multi-role identity (one human, many hats).** The same person can be a *teacher* in
   their school tenant and a *parent* in their household. The surface a user sees is a
   function of `(active tenant, active role)`, chosen via a context switcher. This avoids
   duplicate accounts and keeps the closed loop intact across contexts.

## 5. Shared vs. persona-specific capabilities

Some capabilities are **universal** (every persona has them, scoped differently); others
are **persona-specific**. This distinction drives the feature teardowns.

| Capability | Admin | Teacher | Tutor | Student | Parent |
|---|:--:|:--:|:--:|:--:|:--:|
| Profile & settings | ✓ | ✓ | ✓ | ✓ | ✓ |
| Messaging | ✓ | ✓ | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Calendar / schedule | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dashboards & insight | ✓ | ✓ | ✓ | ✓ | ✓ |
| Authoring content | — | ✓ | ✓ | — | — |
| Grading | — | ✓ | ✓ | — | — |
| Publishing availability | — | ✓* | ✓ | — | — |
| Booking (as buyer) | — | — | — | ✓ | ✓ |
| Billing / payouts | ✓ | — | ✓ | — | ✓ |
| Governance / policy | ✓ | — | — | — | — |
| Guardianship | — | — | — | — | ✓ |

`✓* ` teachers publish *office-hours* availability, not marketplace offerings.

Proceed to the persona teardowns, starting with [Global / Tenant Admin](02-global-tenant-admin.md).
