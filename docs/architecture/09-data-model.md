# 09 — Core Data Model

A conceptual (not physical) model of the entities behind the ecosystem. Every domain entity
carries `tenant_id` unless noted as **global**. Relationships are what encode the persona
graph from `01`.

## 1. Entity-relationship overview

```
 User (global) ─┬─< Membership >─ Tenant
                │        │
                │        └─ RoleAssignment ─ Role
                │
                ├─< Guardianship >─ User (dependent/student)
                │
                └─ Profile (per-role)

 Tenant ─┬─ PolicyConfig
         ├─ Curriculum ─< LearningObjective (taxonomy)
         ├─ Class ─┬─< Enrollment >─ User (student)
         │         └─ Lesson ─< Assignment ─< Submission ─ Grade ─▶ Mastery
         ├─ TutorOffering ─ Availability ─< Booking >─ Session ─ Feedback
         ├─ Invoice ─ Payment / Payout / Escrow
         ├─ Thread ─< Message
         ├─ Notification
         ├─ Alert (risk flag)
         └─ AuditEvent
```

## 2. Identity & tenancy

| Entity | Key fields | Notes |
|---|---|---|
| **User** *(global)* | id, name, email, auth refs | one human = one User across all tenants |
| **Tenant** | id, type (school/district/tutoring/platform), branding, plan | isolation root |
| **Membership** | user_id, tenant_id, status | a User's presence in a Tenant |
| **RoleAssignment** | membership_id, role, scope | multi-role: a membership may hold several |
| **Guardianship** | guardian_user_id, dependent_user_id, controller_level | parent↔student edge |
| **PolicyConfig** | tenant_id, version, rules{} | thresholds, calendars, comms/fee rules |

## 3. Learning & content

| Entity | Key fields | Notes |
|---|---|---|
| **Curriculum** | tenant_id, name | container for objectives |
| **LearningObjective** | curriculum_id, code, standard_ref, level | the **shared taxonomy** all channels tag against; `level` per [12](12-reference-data.md) |
| **Class** | tenant_id, curriculum_id, term | a cohort |
| **Enrollment** | class_id, student_user_id, status | roster edge; authorization boundary |
| **Lesson** | class_id, objective_ids[], assets[] | sequenced against calendar |
| **Assignment** | lesson_id/class_id, objective_ids[], type, due_at | teacher- or tutor-authored |
| **Submission** | assignment_id, student_user_id, files[], submitted_at | versioned, deadline-stamped |
| **Grade** | submission_id, rubric_scores{}, feedback_media?, grader_id | may be auto or manual |
| **Mastery** | **student_user_id, objective_id**, level, updated_by, updated_at | **one row per (student, objective); writers = teacher, tutor** |
| **Attendance** | class_id/session_id, student_user_id, mode, marked_at | event stream (QR/geo/manual) |

## 4. Scheduling, booking & sessions

| Entity | Key fields | Notes |
|---|---|---|
| **TutorOffering** | tutor_user_id, objective_ids[], format, price | marketplace SKU |
| **Availability** | owner_user_id, slots[], timezone | shared by tutors & teacher office hours |
| **Booking** | offering_id/host_id, buyer_user_id, student_user_id, slot | parent/student initiated |
| **Session** | booking_id, provider_ref, recording_ref?, status | live delivery |
| **Feedback** | session_id, objective_ids[], summary, media? | the parent-facing post-session summary |
| **CalendarItem** *(read-model)* | source, student_user_id, when, kind | unifies classes, deadlines, sessions for the HUD |

## 5. Commerce

| Entity | Key fields | Notes |
|---|---|---|
| **Plan** *(platform)* | tier, limits, price | Studyear↔tenant billing |
| **Subscription** | tenant_id, plan_id, status | platform billing |
| **Invoice** | payer_user_id (parent) or tenant_id, line_items[], balance | tuition, fees, tutor sessions unified per household |
| **Payment** | invoice_id, method, settled_at | via processor |
| **Escrow / Authorization** | booking_id/package_id, hold, release_condition | milestone funds released on verified completion |
| **Payout** | recipient (tutor or tenant), amount, released_at | employment model determines recipient |

## 6. Communication, insight & audit

| Entity | Key fields | Notes |
|---|---|---|
| **Thread** | scope (parent/child/educator, class, etc.), participants[] | context-scoped messaging |
| **Message** | thread_id, author_id, body, attachments[] | |
| **Announcement** | class_id, audience (students+guardians) | fan-out via Notifications |
| **Notification** | user_id, channel, rule_ref, payload | preference-driven |
| **Alert** | student_user_id, type (risk/missing/conduct), source_event | the closed-loop trigger |
| **AnalyticsRollup** *(read-model)* | scope, metrics{} | class/tenant/outcomes dashboards |
| **AuditEvent** *(append-only)* | actor, action, target, tenant, at | every privileged action, incl. impersonation |

## 7. Model invariants (the ones that matter)

1. **One `Mastery` row per `(student, objective)`** — the single-fact rule; only teachers
   and tutors write it, everyone else reads.
2. **`tenant_id` on every non-global entity** — isolation is structural.
3. **Guardianship is the only source of a parent's read scope** — a parent sees exactly
   their dependents' data, no more.
4. **Enrollment bounds a teacher; booking bounds a tutor** — instructor reach is derived,
   never ambient.
5. **Money never moves without an `Invoice`/`Payout` + processor** — no ad-hoc transfers.
6. **Every privileged mutation emits an `AuditEvent`** — accountability is non-optional.

See [Permissions & RBAC](10-permissions-rbac.md) for how these become enforced access rules.
