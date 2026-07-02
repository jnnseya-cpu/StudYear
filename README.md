# Studyear — The Educational Operating System (Edu-OS)

> **⚖️ Governing rule — the [Preservation & Enhancement Mandate](docs/REQUIREMENTS-MANDATE.md):**
> everything in this corpus **must be implemented**; nothing may be removed; changes may
> only improve and enhance — from the very start to the very end. The mandate doc carries
> the full requirements-traceability index and conflict-resolution protocol.

Studyear is a **multi-tenant educational ecosystem** that unifies formal institutional
learning (schools & teachers) with supplemental private learning (tutors), and closes
the loop with the foundational support network (students & parents) — all under an
enterprise administrative umbrella (global / tenant admin).

Where most products serve one slice of the education journey, Studyear is architected as
an **All-in-One Edu-OS**: a shared kernel of identity, data, scheduling, content,
commerce, and communication on top of which each of the five personas gets a purpose-built
surface.

## The Five Personas

| Persona | Role in the ecosystem | Primary jobs-to-be-done |
|---|---|---|
| **Global / Tenant Admin** | Operates the platform & each institution | Provision tenants, govern users, configure policy, monitor health, run billing |
| **School / Teacher** | Delivers formal, curriculum-bound instruction | Manage classes, deliver lessons, assess, grade, report to parents |
| **Tutor** | Delivers supplemental, on-demand instruction | Publish availability & offerings, get discovered/booked, teach 1:1, get paid |
| **Student** | Consumes learning across both channels | Attend, learn, submit work, track progress, get help |
| **Parent** | Sponsors & supervises the learner | Oversee progress, communicate, pay, approve, book support |

## Repository Layout

```
docs/architecture/
├── 00-overview.md              Macro architecture: the Edu-OS thesis & layers
├── 01-personas.md              The five personas and the relationships between them
├── 02-global-tenant-admin.md   Feature teardown — Admin
├── 03-school-teacher.md        Feature teardown — School / Teacher
├── 04-tutor.md                 Feature teardown — Tutor
├── 05-student.md               Feature teardown — Student
├── 06-parent.md                Feature teardown — Parent
├── 07-system-matrix.md         Cross-persona interaction & business-logic matrix
├── 08-technical-architecture.md  Multi-tenancy, services, data flows, integrations
├── 09-data-model.md            Core entities and relationships
├── 10-permissions-rbac.md      Roles, scopes, and the permission model
├── 11-revision-resources.md    Module: the "create a revision resource" study toolset
├── 12-reference-data.md        Controlled vocabularies (Level, Subject, Board, Topic, Resource Type)
├── 13-platform-decomposition.md  PART 1: technical module decomposition (concrete stack)
├── 14-ai-agent-blueprint.md    PART 2: next-gen AI-agent & ML tier (named agents, model router)
└── 15-implementation-blueprint.md  PART 3: layered runtime, MariaDB partitioning, async AI engine
```

### PART 4 — The AI Infrastructure Operating System (`docs/ai-os/`)

The enterprise transformation: preserving everything above, it re-frames Studyear as a
production-grade, multi-tenant **AI-OS**. See [`docs/ai-os/README.md`](docs/ai-os/README.md)
for the full developer-ready document set (AI Command Centres, enterprise multi-agent
ecosystem, cybersecurity, data intelligence, BitriPay gateway, connectors, ERD, API specs,
monetisation, security/compliance, and the build roadmap).

## How to read this

- Start with **`00-overview.md`** for the systemic (macro) picture.
- Read **`01-personas.md`** to understand who acts and how they relate.
- Dive into any **persona teardown (`02`–`06`)** for the micro-level feature map.
- Use **`07-system-matrix.md`** to see how an action by one persona ripples across the others.
- Use **`08`–`10`** for the engineering foundation (tenancy, data, and access control).

> This is a living architecture reference. It is intentionally implementation-agnostic at
> the persona layer and opinionated at the platform layer, so product and engineering can
> evolve surfaces without re-litigating the kernel.
