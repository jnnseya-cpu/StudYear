# 02 — Persona Teardown: Global / Tenant Admin

> **The Enterprise Administrative Umbrella.** The operator layer that provisions the
> ecosystem, governs its users, encodes its policy, monitors its health, and keeps it
> solvent and compliant. Two tiers share one surface: **Global Admin** (Studyear operator,
> platform-wide scope) and **Tenant Admin** (institution operator, single-tenant scope).
>
> *This teardown is drafted from the platform architecture; refine against the incoming
> Admin persona spec.*

## 1. Role summary

| | |
|---|---|
| **Tenant scope** | Global Admin: all tenants. Tenant Admin: exactly one tenant |
| **Primary jobs** | Provision → govern → configure policy → monitor → bill & report |
| **Reads** | everything in scope (audited) |
| **Writes** | tenants, users, roles, policy, plans, configuration |
| **Kernel services** | Identity & Tenancy, Commerce & Billing, Analytics, Communication |

## 2. Core features & functionalities

### 2.1 Tenant Provisioning & Lifecycle
Create, configure, suspend, and archive tenants (schools, districts, tutoring companies,
franchises). Set branding, domain, locale, and the tenant's plan.

*Architecture:* provisioning writes the tenant root and seeds default roles, policy, and
billing config transactionally, then emits `tenant.created` for downstream setup jobs.

### 2.2 User & Role Governance
Invite, deactivate, and re-role users; manage bulk imports (SIS roster sync); merge
duplicate identities; and resolve the multi-role/multi-tenant identity graph.

*Architecture:* identity is global, membership is tenant-scoped (see `01`/`10`). Admin edits
`membership` and `role_assignment` rows, never the global identity of another human beyond
their scope.

### 2.3 Policy & Configuration Engine
Encode the rules every other persona operates under: guardianship age threshold,
communication rules, grading scales, academic calendar, fee structures, consent
requirements, data-retention and privacy settings.

*Architecture:* policy is a versioned, tenant-scoped config document consumed by kernel
services at decision points — one source of truth, not settings scattered per feature.

### 2.4 Health, Compliance & Audit Monitoring
Operational dashboards (usage, engagement, revenue, outcomes) plus an **immutable audit
log** of privileged actions, and compliance tooling (data export, deletion requests,
consent status).

*Architecture:* Analytics provides tenant-scoped rollups; every privileged mutation writes
an append-only `audit_event`. Support **impersonation** (Global Admin) is itself audited.

### 2.5 Billing, Plans & Payouts Oversight
Manage subscription plans and tenant invoicing (Global Admin); oversee tuition/fee
configuration and tutor payout policy (Tenant Admin); reconcile disputes and refunds.

*Architecture:* Commerce separates *platform billing* (Studyear ↔ tenant) from *in-tenant
commerce* (parent ↔ tutor/institution). Admin governs the config; processors move money.

## 3. Actions & micro-workflows

| Action | Flow | Services touched |
|---|---|---|
| **Provision a school tenant** | intake → create tenant → seed roles/policy/plan → invite Tenant Admin | Identity & Tenancy, Commerce |
| **Bulk-onboard a roster** | upload/SIS sync → validate → create memberships → dispatch invites | Identity & Tenancy, Files |
| **Set guardianship threshold** | edit policy → version bump → propagate to student/parent surfaces | Policy engine |
| **Investigate a dispute** | open audited support session → impersonate → inspect ledger → resolve | Audit, Commerce, Communication |
| **Run a compliance export/deletion** | scoped export or right-to-be-forgotten job → audit entry | Identity & Tenancy, Files, Audit |

## 4. Two tiers, one surface

| Concern | Global Admin | Tenant Admin |
|---|---|---|
| Scope | all tenants | one tenant |
| Provision tenants | ✓ | — |
| Platform plans & pricing | ✓ | — |
| In-tenant users & roles | ✓ (any) | ✓ (own) |
| In-tenant policy | ✓ (any) | ✓ (own) |
| Impersonation | ✓ (audited) | ✓ within tenant (audited) |
| Payout/fee config | oversight | owns own |

## 5. Connection to the rest of the ecosystem
Admin never delivers learning — it sets the frame everyone else acts within. Its policy
decisions (thresholds, calendars, fee rules, comms rules) are read by the teacher, tutor,
student, and parent surfaces at runtime. See [System Matrix](07-system-matrix.md).
