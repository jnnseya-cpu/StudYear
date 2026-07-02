# 10 — Permissions & RBAC

How the ecosystem enforces "the right persona can do the right thing in the right scope."
The model combines **role-based** access (what a role can do) with **relationship-based**
scoping (which rows a role can touch). Both are required — role without scope would let one
teacher grade another teacher's class.

## 1. The access equation

```
   ALLOW  ⇔   role grants the action        (RBAC)
          ∧   AND the target is in scope     (ReBAC / relationship)
          ∧   AND tenant policy permits it   (policy engine)
          ∧   AND tenant_id matches          (tenancy invariant)
```

A request is authorized only if **all four** hold. Deny by default.

## 2. Roles

| Role | Tier / tenant | Core grants |
|---|---|---|
| **Global Admin** | platform-wide | provision tenants, platform billing, cross-tenant support (audited) |
| **Tenant Admin** | one tenant | manage users/roles/policy/config/fees within the tenant |
| **Teacher** | school tenant | manage own classes, author content, grade, attendance, report |
| **Tutor** | platform / company tenant | offerings, availability, sessions, feedback, earnings |
| **Student** | school / platform | consume content, submit work, join sessions, message |
| **Parent** | platform (household) | monitor dependents, book, pay, approve, message |

A single **Membership** may carry multiple RoleAssignments; the effective permissions are
the union, always intersected with scope and policy.

## 3. Scope: relationship-derived, not ambient

| Persona | Scope is derived from | Can touch |
|---|---|---|
| Global Admin | (none — platform) | anything, audited |
| Tenant Admin | `tenant_id` | everything in that tenant |
| Teacher | `Enrollment` in owned `Class` | that class's students, content, grades |
| Tutor | confirmed `Booking` | booked student's shared context only |
| Student | self | own records; own cohort forums |
| Parent | `Guardianship` | dependents' records only |

**Key rule:** a parent's read scope is *exactly* the union of their guardianship edges —
never broader. A tutor sees a booked student's *shared learning context*, not the full
institutional record.

## 4. Action-level matrix (representative)

Legend: **✓** allowed in scope · **A** allowed, audited · **–** denied

| Action | G.Admin | T.Admin | Teacher | Tutor | Student | Parent |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Provision tenant | ✓ | – | – | – | – | – |
| Manage users/roles | A | ✓ | – | – | – | – |
| Edit tenant policy | ✓ | ✓ | – | – | – | – |
| Author assignment | – | – | ✓ | ✓ | – | – |
| Post grade / write mastery | – | – | ✓ | ✓ | – | – |
| Submit work | – | – | – | – | ✓ | – |
| Mark attendance | – | – | ✓ | ✓ | – | – |
| Publish offering/availability | – | – | ✓(office hrs) | ✓ | – | – |
| Create booking (buyer) | – | – | – | – | ✓* | ✓ |
| Pay invoice | – | – | – | – | – | ✓ |
| Receive payout | – | – | – | ✓ | – | – |
| Read child's records | A | ✓ | ✓(own class) | ✓(booked) | self | ✓ |
| Impersonate user | A | A(in tenant) | – | – | – | – |
| Read audit log | ✓ | ✓(own tenant) | – | – | – | – |

`✓*` a student may self-initiate a booking only when guardianship policy allows (see §5).

## 5. Guardianship as an access modifier

Guardianship doesn't just grant the parent read access — it **modifies the student's own
permissions** based on `controller_level`, which Tenant Admin policy configures:

| controller_level | Student can… | Parent must… |
|---|---|---|
| **full** (younger) | consume/learn only | approve bookings, spend, and comms |
| **shared** (mid) | self-serve with limits | approve spend above threshold |
| **observer** (older) | self-serve fully | receives visibility only |

The same `AuthZ` check reads `controller_level` to decide whether a student action needs a
parent-approval step — the guardianship edge is a live input to authorization, not just a
reporting link.

## 6. Enforcement points

1. **Tenancy filter (data plane):** every query is scoped to `tenant_id` (RLS / scoped
   repository). A missing/mismatched tenant is a hard deny, not an empty result.
2. **RBAC gate (service layer):** the role must grant the action verb.
3. **ReBAC scope check (service layer):** the target row must be reachable via the persona's
   defining relationship (enrollment / booking / guardianship / self).
4. **Policy evaluation (policy engine):** tenant policy may further restrict (e.g. comms
   rules, spend thresholds, consent requirements).
5. **Audit sink:** privileged and cross-scope actions append an `AuditEvent`.

## 7. Why both RBAC and ReBAC

- **RBAC alone** can't distinguish two teachers, two parents, or two tutors — role is
  identical, scope differs. Relationship-based scoping supplies the "which rows."
- **ReBAC alone** can't express "admins may configure policy" cleanly. Role supplies the
  "which verbs."
- Together, plus the tenancy invariant and policy engine, they realize the safety
  boundaries in `07 §5` and the model invariants in `09 §7`.

This closes the architecture reference. Return to the [overview](00-overview.md) or the
[system matrix](07-system-matrix.md) for the big picture.
