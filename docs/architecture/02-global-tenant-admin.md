# 02 — Persona Teardown: Global / Tenant Administrator

> **The Core OS Kernel.** The **root system orchestrator** — it controls configuration,
> multi-tenant billing, structural master data, and deep system compliance. Two tiers share
> one surface: **Global Admin** (Studyear operator, platform-wide scope) and **Tenant
> Admin** (institution operator, single-tenant scope).

## 1. Role summary

| | |
|---|---|
| **Tenant scope** | Global Admin: all tenants. Tenant Admin: exactly one tenant |
| **Primary jobs** | Provision → configure master data → govern access → monitor & audit → orchestrate payments |
| **Reads** | everything in scope (audited) |
| **Writes** | tenants, master data, roles/permissions, policy, payment config |
| **Kernel services** | Identity & Tenancy, Commerce & Billing, Analytics/Audit, Communication |

## 2. Core features & functionalities

### 2.1 Multi-Tenant Institutional Onboarding
Provision **distinct digital spaces for entire school districts, individual private schools,
and independent tutoring agencies.**

*Architecture:* onboarding writes the tenant root and seeds default roles, policy, and
billing config transactionally, then emits `tenant.created` for downstream setup jobs. The
tenant `type` (district / school / tutoring-agency / platform) selects the appropriate
defaults — district tenants nest schools; independent tutors and households live in the
shared platform tenant (`08 §1`).

### 2.2 Global Academic Architecture Engine
Configuration for the academic *frame* every other persona operates within:
- **Regional curriculum settings** — GCSE, IB, K-12, French Baccalauréat, …
- **Grading scales** — GPA, percentages, alphanumeric.
- **Holiday / term calendars.**

*Architecture:* these are versioned, tenant-scoped `PolicyConfig`/`Curriculum` documents
(`09 §2–3`) consumed by kernel services at decision points. The chosen curriculum defines
the **LearningObjective taxonomy** that teachers, tutors, and the revision-resource sandbox
all tag against — so "aligned to GCSE" is a data property, not a report artifact.

### 2.3 Role-Based Access Control (RBAC)
Highly granular permission control **mapping roles to specific system data blocks** — e.g.
hiding financial details from standard teachers while granting them to billing admins.

*Architecture:* the access equation is `role-grants-action ∧ target-in-scope ∧
policy-permits ∧ tenant-matches` (`10 §1`). Admin edits `Role`/`RoleAssignment` and the
data-block grants that gate sensitive surfaces (e.g. finances). Identity is global,
membership is tenant-scoped, and a membership may hold multiple roles — the union is always
intersected with scope and policy (`10 §2`).

### 2.4 Audit Logging & System Compliance
A **tamper-evident log** capturing all database actions, critical profile updates, score
alterations, and payment-processing steps for legal compliance.

*Architecture:* every privileged/cross-scope mutation appends an immutable `AuditEvent`
(`09 §6`) — including **score alterations/regrades** and each payment step. Support
**impersonation** (Global Admin) is itself audited. Tamper-evidence is achieved by
append-only storage with hash-chaining so any edit to history is detectable.

### 2.5 Unified Payment & Gateway Orchestration
System configuration for processing **school tuition, platform subscription fees, and
marketplace commissions for private tutors.**

*Architecture:* Commerce separates three money flows behind one configuration surface:
*platform billing* (Studyear ↔ tenant subscriptions), *in-tenant tuition/fees*
(household ↔ institution), and *marketplace* (household ↔ tutor, minus commission). Admin
governs the config and commission/fee rules; external processors move the money and are the
ledger of record (`08 §6`).

## 3. Actions & micro-workflows

| Action | Flow | Services touched |
|---|---|---|
| **Bulk structural sync** — automated **CSV/API** import of **5,000 students assigned to class cohorts instantly** | upload/API → validate → create memberships + enrollments in bulk → dispatch invites | Identity & Tenancy, Files, Learning Records |
| **System-wide override** — switch the school to **"Remote/Online Learning Mode"** during an emergency | policy override → version bump → propagate to all surfaces (sessions default to virtual, etc.) | Policy engine, Scheduling, Communication |
| **Content moderation** — flag, investigate, and moderate inappropriate content/communication **reported by automated AI sentiment filters** | AI filter flags → admin review queue → action (redact/suspend) → audit entry | Communication, Analytics, Audit |
| **Provision a tenant** | intake → create tenant → seed roles/policy/plan → invite Tenant Admin | Identity & Tenancy, Commerce |
| **Configure academic frame** | set curriculum/grading scale/calendar → version → propagate | Global Academic Architecture Engine |

## 4. Two tiers, one surface

| Concern | Global Admin | Tenant Admin |
|---|---|---|
| Scope | all tenants | one tenant |
| Provision tenants | ✓ | — |
| Platform subscription pricing & commissions | ✓ | — |
| Academic architecture (curriculum/scale/calendar) | ✓ (any) | ✓ (own) |
| RBAC / data-block grants | ✓ (any) | ✓ (own) |
| Tuition/fee config | oversight | owns own |
| Impersonation | ✓ (audited) | ✓ within tenant (audited) |
| Audit log access | all | own tenant |

## 5. Connection to the rest of the ecosystem
Admin never delivers learning — it is the **kernel that sets the frame** everyone else acts
within. Its curriculum, grading, calendar, RBAC, and payment decisions are read by the
teacher, tutor, student, and parent surfaces at runtime; its audit log records every
consequential action across all of them; and its payment orchestration is what settles the
tutor payouts that close the loop (`07`). See the [System Matrix](07-system-matrix.md).
