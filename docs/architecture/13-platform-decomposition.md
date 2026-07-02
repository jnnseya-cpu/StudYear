# 13 — PART 1: Core Platform Technical Decomposition

A **module-by-module, implementation-oriented** decomposition of the Studyear core platform.
Where the persona teardowns (`02`–`06`) describe *who does what and why*, this document
describes *how the platform is structured as a multi-tenant, event-driven OS* on a concrete
stack. It is the bridge between the business architecture and the [next-gen AI-Agent
blueprint (PART 2)](14-ai-agent-blueprint.md).

## 0. Concrete stack & topology

| Concern | Choice (as specified) | Notes |
|---|---|---|
| **Core datastore** | **MariaDB** (Hostinger-hosted) | multi-tenant relational core; shared schema + `tenant_id` (`08 §1`) |
| **Tenant routing** | **sub-domain per tenant** — `schoolname.studyear.com` | wildcard DNS → tenant resolver → scoped context |
| **Model** | multi-tenant, **event-driven** OS for learning | see event backbone (`08 §3`) |
| **Isolation** | row-level `tenant_id` discriminator | promote large tenants to isolated schemas without app change |

```
        [ Core Multi-Tenant Database: MariaDB / Hostinger ]
                              │
   ┌──────────────────────────┼──────────────────────────┐
   ▼                          ▼                          ▼
[ ADMIN ]◄───────────────►[ SCHOOLS ]◄───────────────►[ TEACHERS ]
   │                          │                          │
   └────────────┬─────────────┴─────────────┬────────────┘
                ▼                           ▼
          [ STUDENTS ]◄──────────────►[ PARENTS ]
                ▲                           ▲
                └─────────────┬─────────────┘
                              ▼
                        [ TUTORS ]
```

> **Tenant resolution:** an inbound request to `schoolname.studyear.com` is resolved to a
> `tenant_id` at the edge and injected into the request context; every downstream query is
> scoped by it (`08 §1`, `10 §6`). The platform tenant (independent tutors + households)
> is served from the apex/app domain.

## 1. Super Admin / Platform Owner Module

**The ultimate system orchestrator** — manages global state, SaaS billing, and tenant
isolation. (This is the *platform-owner tier* of the [Admin persona](02-global-tenant-admin.md);
here it is decomposed as a technical module.)

### 1.1 SaaS Tenant Provisioning
Dynamic onboarding of new schools, **sub-domain routing (`schoolname.studyear.com`)**, and
**tiered license management.**

*Decomposition:*
- **Provisioning pipeline:** create tenant row → allocate sub-domain (wildcard DNS + edge
  route) → seed roles/policy/calendar → assign license tier → emit `tenant.created`.
- **Tiered licensing:** a `License`/`Subscription` (`09 §5`) gates feature flags, seat/usage
  limits, and price per tier; enforced at the RBAC/policy layer (`10 §6`).
- **Isolation guarantee:** every provisioned tenant is a hard `tenant_id` boundary in MariaDB.

### 1.2 Global Marketplace Auditing
Monitoring **commission splits, dispute resolutions, and payment payouts** between Private
Tutors, Parents, and the **platform escrow.**

*Decomposition:*
- **Money-flow ledger:** parent payment → platform escrow → (commission split) → tutor payout,
  each step an auditable Commerce event (`08 §3`) writing an append-only `AuditEvent` (`09 §6`).
- **Commission engine:** platform commission % configured per tier/agreement; applied at
  payout, reconciled in the audit view.
- **Dispute resolution:** an audited support workflow (impersonation is itself logged, `02 §2.4`)
  that can hold/refund/release escrow.

### 1.3 Global Configuration & Compliance
System-wide **localization (currency, time zones, local curricula: GCSE, K-12, IB)** and
**GDPR / data-privacy policy enforcement.**

*Decomposition:*
- **Localization config:** currency, timezone, locale, and the active curriculum system are
  tenant-scoped `PolicyConfig` (`09 §2`); curricula resolve to the `(Level, Subject, Exam
  Board, Topic)` vocabularies (`12`).
- **GDPR/privacy enforcement:** data-residency, consent (tied to guardianship, `06 §4`),
  retention windows, export, and right-to-be-forgotten jobs (`08 §7`), all audited.
- **Compliance surface:** the tamper-evident audit log (`02 §2.4`) is the system of record
  for regulator-facing evidence.

---

## 2. School Management / Principal Dashboard Module

**The operational command center** for physical or virtual institutional infrastructure —
the school-tenant control plane operated by principals/school admins (the Tenant-Admin tier
of `02`, plus institution-specific operations that reach into the [Teacher](03-school-teacher.md)
surface).

### 2.1 Human Resources & Rostering
Management of **teacher profiles, workloads, substitutions, salary structures, and
department heads.**

*Decomposition:*
- `StaffProfile` + `RoleAssignment` (`09 §2`, `10`) model employment, department, and grants
  (e.g. department-head elevated scope).
- **Workload/substitution** engine tracks teaching load and reassigns classes on absence —
  a substitution rewrites the class's effective teacher for the affected sessions, audited.
- **Salary structures** are institution-financial data, gated from standard teachers by the
  RBAC data-block grants (`02 §2.3`).

### 2.2 Academic Architecture Builder
Creation of **classes, sections, courses, subjects, and physical/virtual room allocations.**

*Decomposition:*
- Builds the `Class`/`Lesson`/`Curriculum` graph (`09 §3`) for the tenant, tagged with the
  `(Level, Subject, Exam Board, Topic)` vocabularies (`12`).
- **Rooms** (physical or virtual) are bookable resources; a virtual room resolves to the
  pluggable session provider (`08 §5`). Room allocation feeds the timetable engine (2.3).

### 2.3 Timetable Master Engine
An **automated conflict-resolution matrix** to schedule weekly blocks, exam periods, and
extracurricular spaces.

*Decomposition:*
- A constraint solver over `(teacher, class, room, time)` producing conflict-free weekly
  timetables; exam periods and extracurriculars are additional constraint sets.
- Output materializes as `CalendarItem`s (`09 §4`) that flow to student HUDs (`05 §2.1`) and
  parent views — the same calendar substrate tutoring bookings use.
- A prime **PART 2 target**: timetabling is an optimization the AI/ML layer (`14`) automates.

### 2.4 Admissions & Student Information System (SIS)
Tracking the **entire student lifecycle**: registration, document verification, transfer
certificates, alumni archiving.

*Decomposition:*
- `Enrollment` lifecycle states (applicant → verified → enrolled → transferred/alumni),
  each transition audited (`09 §6`).
- Bulk intake via the CSV/API sync (`02 §3`); document verification stores artifacts in
  Files with verification status; alumni archiving retires the membership while retaining
  transcript/mastery history.

### 2.5 Institutional Financials
Tracking **fee schedules, invoicing, penalty fees, balance sheets, and inventory
management** (textbooks, lab assets).

*Decomposition:*
- Tuition/fee `Invoice`s (`09 §5`) surface to the parent's unified household ledger
  (`06 §2.4`); penalties are rule-driven line items; balances roll up to institution-level
  financial reporting.
- **Inventory** (textbooks, lab assets) is a tenant asset register — issuance/return tracked,
  optionally linked to a student for accountability.

---

## 3. School Teacher Interface Module

**The frontline engine** for curriculum delivery, behavioral tracking, and performance
logging (technical view of [`03`](03-school-teacher.md)).

- **Digital Roll Call & Attendance** — real-time marking of presence / tardiness / excused
  absence, each emitting `attendance.marked` (`08 §3`) wired directly to parent notifications.
- **Gradebook & Continuous Assessment Matrix** — weight-based calculation across homework /
  quizzes / midterms / finals with **custom grading scales** (the Grading-Scale vocabulary,
  `12 §6`); every grade writes `Mastery` (`09 §7.1`).
- **Curriculum Tracker (Lesson Planner)** — maps live classroom progress against standardized
  national/international **milestones** (the `(Level, Subject, Exam Board, Topic)` objectives,
  `12`).
- **Behavior & Merit Logger** — point-based positive/negative conduct records; a negative note
  emits `conduct_note_added` → parent alert (`06 §2.3`).
- **Direct Communication Hub** — broadcast to a class or open secure, compliant 1:1 parent
  chats (Communication service, scoped `(parent, child, educator)`).

## 4. Student Hub Module

**The central workspace** to maximize engagement, productivity, and outcomes (technical view
of [`05`](05-student.md)).

- **Unified Academic Feed** — timeline of impending assignments, quiz deadlines, timetable
  adjustments, and announcements; the materialized HUD read-model (`05 §2.1`).
- **Virtual Learning Environment (VLE)** — access courseware, download resources, submit
  assignments, take **timed online assessments** (Content & Assessment + Files; timed/auto-
  proctored attempts write mastery).
- **Self-Tracking Grade Analytics** — progress bars of standing per subject **relative to the
  class average** (Analytics projection over the shared mastery/grade data).
- **Peer Collaboration Spaces** — sandboxed forums / group chats **restricted to class
  cohorts** (visibility inherits enrollment, `05 §2.4`).

## 5. Parent Portal Module

**The observation & oversight deck** — transparency, communication, friction-free payments
(technical view of [`06`](06-parent.md)).

- **Multi-Child Dashboard** — one credential, toggle between children **across different
  classes or schools** (household read-model over N guardianship edges, `06 §2.1`).
- **Real-Time Performance Feed** — push alerts for unexcused absence, low marks, or notable
  behavior reports (Notification fan-out on Analytics events, `06 §2.3`).
- **Payment Gateway Integration** — instant bill-pay for tuition, bus transit, lunches, or
  excursions (Commerce + processor; obligations aggregated to the household ledger, `06 §2.4`).
- **PTA Scheduling Interface** — book parent-teacher conference slots against integrated
  availability (the shared Scheduling/Booking service, `06 §2.5`).

---

## 6. Private Tutor Marketplace & Classroom Module

An **independent or school-vetted network** providing targeted remedial or enrichment
education (technical view of [`04`](04-tutor.md)).

- **Independent Profile & Storefront** — verification of **background checks**, certifications,
  subject specializations, ratings, and **self-managed hourly pricing tiers** (marketplace
  profile tagged with the spec tuple, `12`; verification status is audited master data).
- **Interactive Booking Calendar** — sync with **client time zones** for 1-on-1 intensive
  video sessions or **group bootcamps** (shared Scheduling/Booking service, `08 §5`).
- **Independent Escrow Billing** — parent payments **held in escrow until a session is marked
  complete** (Commerce escrow released on `session.completed`, feeding the platform escrow/
  commission audit in `13 §1.2`).
- **Independent Resource Vault** — upload specialized worksheets, past papers, and diagnostic
  tests **independent of the official school curriculum** (tutor-owned Files space, `04 §2.3`;
  optionally topic-tagged to write mastery via diagnostics, `04 §2.5`).

> **School-vetted vs. independent:** a tutor may be surfaced by a school tenant (vetted) or
> operate purely in the platform tenant. Vetting is a verification flag + the tenant edge; the
> classroom/escrow mechanics are identical either way.

---

### Module ↔ persona ↔ blueprint map

| # | PART 1 Module (`13`) | Business persona (`02`–`06`) | AI leverage (`14`) |
|---|---|---|---|
| 1 | Super Admin / Platform Owner | Admin `02` | anomaly/fraud, compliance agents |
| 2 | School Management / Principal | Admin `02` + School | timetable optimization, staffing |
| 3 | School Teacher Interface | Teacher `03` | auto-grading, at-risk prediction |
| 4 | Student Hub | Student `05` | tutor/agent, adaptive study (`11`) |
| 5 | Parent Portal | Parent `06` | proactive insight, next-best-action |
| 6 | Tutor Marketplace & Classroom | Tutor `04` | matching, diagnostics, escrow signals |

All six modules run on the same MariaDB multi-tenant core and event backbone; PART 2 (`14`)
layers an AI-agent & ML tier over these events.
