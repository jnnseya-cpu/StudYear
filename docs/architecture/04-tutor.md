# 04 — Persona Teardown: Private Tutor

> **The Marketplace & Supplemental Business Layer.** Treated as an **independent business
> management suite** — professional CRM tools, calendar scheduling, and a personal brand
> storefront in one. The on-demand instructor discovered and booked to reinforce, remediate,
> or accelerate a specific student on a specific topic. May be independent (platform tenant)
> or employed by a tutoring-company tenant.

## 1. Role summary

| | |
|---|---|
| **Tenant scope** | Platform tenant (independent) or tutoring-company tenant (employed) |
| **Primary jobs** | Publish brand → get discovered → schedule → teach → track progress → invoice & get paid |
| **Reads** | bookings, booked-student context (shared), earnings, balances |
| **Writes** | storefront, availability, materials, quotes, invoices, feedback, mastery |
| **Kernel services** | Scheduling & Booking, Commerce & Billing, Content & Assessment, Learning Records, Communication, Files |

## 2. Core features & functionalities

### 2.1 Public Marketplace Storefront
A customizable profile displaying **academic qualifications, verified student reviews,
hourly rates, subject specialties, and available intro sessions.**

*Architecture:* the storefront is the tutor's public surface in the marketplace. Subject
specialties are tagged against the shared `(Level, Subject, Exam Board, Topic)` spec tuple
(`12`), which is exactly what makes a tutor **discoverable for the precise specification** a
teacher flagged. Reviews are verified (tied to completed, paid bookings), and intro sessions
are a first-class offering type that lowers the trial barrier.

### 2.2 Dynamic Calendar Scheduling Engine
**Two-way calendar synchronization**: tutors define availability blocks; parents book or
reschedule slots subject to **set cancellation policies.**

*Architecture:* the **same Scheduling/Booking service** that powers teacher office hours and
parent conference booking (`03 §2.5`, `06 §2.5`). Availability blocks, two-way external
calendar sync, timezone handling, and reschedule/cancellation policy live once in the kernel;
a `booking.confirmed` event authorizes/escrows payment in Commerce.

### 2.3 Independent Curriculum Library
A **personal, secure file repository** where tutors **organize, update, and reuse learning
materials across different clients.**

*Architecture:* a tutor-owned space in Files, decoupled from any one tenant's curriculum so
materials travel with the tutor across clients. Materials can be topic-tagged and attached
to sessions or promoted into shareable revision resources (`11`), but the library itself is
the tutor's reusable, private asset base.

### 2.4 Automated Invoicing & Financial Hub
A business backend tracking **billable hours, outstanding client balances, platform service
charges, and monthly payout tracking.**

*Architecture:* Commerce holds the booking → billable-hours → invoice → payout chain,
including **milestone escrow** (funds released on verified package completion — the parent-
side control from `06 §3`) and the **platform commission** the Admin gateway configures
(`02 §2.5`). Payouts route to the individual tutor or the employing company per employment
model. Outstanding balances surface to the parent's unified household ledger (`06 §2.4`).

### 2.5 Progress Mapping & Remediation Tools
**Custom onboarding assessments** to identify learning gaps, plus **milestone tracking** for
long-term clients.

*Architecture:* onboarding assessments write **Mastery** on the diagnosed topics
(`09`/`12 §4`) — the *same* record the teacher writes and the parent reads — so the tutor's
remediation plan is anchored to the shared learning fact, not a private copy. Milestones are
the completion conditions that release escrowed package funds (2.4).

## 3. Actions & micro-workflows

| Action | Flow | Services touched |
|---|---|---|
| **Quote a package** — issue a **personalized, milestone-based tutoring package quote** to a parent after an initial consultation | consult → build package (sessions + milestones + price) → send quote → parent accepts → escrow set up | Commerce (quote/escrow), Communication |
| **Run a session** — launch a **dedicated online learning room with custom whiteboard setups** for a scheduled session | booking → session room (pluggable media + whiteboard) → optional recording to Files | Scheduling & Booking, Sessions, Files |
| **Log feedback** — record **customized post-session feedback notes showing progress against goals** | session completes → structured feedback vs. milestones → mastery update → parent notified | Communication, Learning Records, Notifications |
| **Publish storefront/availability** | edit profile + spec tags + availability blocks → list on marketplace | Commerce, Scheduling, Content taxonomy |
| **Get paid** | milestone/package completion verified → escrow released → payout (net of commission) | Commerce |

## 4. Independent vs. employed tutor

| Concern | Independent (platform tenant) | Employed (company tenant) |
|---|---|---|
| Discovery | own marketplace storefront | via company + platform |
| Pricing | self-set | company-set / governed |
| Curriculum library | personal, portable | may be company-shared |
| Payout | direct to tutor (net commission) | to company, then internal |
| Policy | platform defaults | company Tenant Admin policy |

## 5. Connection to the rest of the ecosystem
The tutor is the **demand fulfiller** in the closed loop (`00 §5`, `07 §4`): a teacher's
topic-level flag → a parent's alert → a booking here → teaching → **mastery write-back** the
teacher and parent both observe. Because the tutor tags against the same spec tuple (`12`)
and writes the same `(student, topic)` mastery row, supplemental learning is *measured
against* formal learning rather than running parallel to it — and the milestone/escrow
mechanics tie payment to demonstrated progress. See the [System Matrix](07-system-matrix.md).
