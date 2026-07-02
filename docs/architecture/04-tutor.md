# 04 — Persona Teardown: Tutor

> **The Supplemental Instruction Layer.** The on-demand instructor discovered and booked
> to reinforce, remediate, or accelerate a specific student on a specific topic. May be
> independent (platform tenant) or employed by a tutoring-company tenant.
>
> *This teardown is drafted from the platform architecture; refine against the incoming
> Tutor persona spec.*

## 1. Role summary

| | |
|---|---|
| **Tenant scope** | Platform tenant (independent) or tutoring-company tenant (employed) |
| **Primary jobs** | Publish → get discovered → get booked → teach → get paid → build reputation |
| **Reads** | bookings, student context (shared), earnings |
| **Writes** | offerings, availability, session notes/feedback, mastery updates |
| **Kernel services** | Scheduling & Booking, Commerce & Billing, Content & Assessment, Learning Records, Communication |

## 2. Core features & functionalities

### 2.1 Profile, Offerings & Marketplace Presence
A public tutor profile: subjects, levels, credentials, rates, reviews, and packaged
offerings (single session, multi-session package, group class).

*Architecture:* offerings are commerce SKUs with topic tags against the shared curriculum
taxonomy, which is what makes a tutor *discoverable for the exact topic* a teacher flagged.

### 2.2 Availability & Booking
Publish calendar availability; receive and confirm bookings (parent- or student-initiated);
manage reschedules and cancellations under policy.

*Architecture:* the **same Scheduling/Booking service** that powers teacher office hours
and parent conference booking. Availability + booking rules + timezone handling live once,
in the kernel.

### 2.3 Live Session Delivery & Tools
Run 1:1 or small-group sessions (embedded video/whiteboard), share resources, and optionally
record.

*Architecture:* real-time media is a pluggable provider orchestrated by the platform;
recordings and shared resources land in Files, linked to the session.

### 2.4 Post-Session Feedback & Mastery Write-Back
Produce the **lesson-by-lesson feedback summary** the parent reads after a paid session,
and update the student's mastery on the topics covered.

*Architecture:* structured feedback is a first-class artifact linked to the session; mastery
updates write to **Learning Records** — the *same* record the teacher and parent read. This
write-back is what closes the loop.

### 2.5 Earnings, Payouts & Reputation
Track bookings, earnings, and payouts; manage the payout method; accrue reviews and ratings
that feed marketplace ranking.

*Architecture:* Commerce holds the booking → invoice → payout chain, including **milestone
escrow** (funds released on verified package completion — the parent-side control from `06`).
Payouts route to the individual tutor or the employing tenant per employment model.

## 3. Actions & micro-workflows

| Action | Flow | Services touched |
|---|---|---|
| **Publish an offering** | define subject/level/rate/package → topic-tag → list on marketplace | Commerce, Content taxonomy |
| **Accept a booking** | receive request → confirm → session on both calendars → payment authorized/escrowed | Scheduling & Booking, Commerce |
| **Teach & record** | launch session → whiteboard/screen-share → optional recording to Files | Sessions, Files |
| **Submit feedback** | post structured lesson feedback → update mastery → notify parent | Communication, Learning Records, Notifications |
| **Get paid** | package completion verified → escrow released → payout | Commerce |

## 4. Independent vs. employed tutor

| Concern | Independent (platform tenant) | Employed (company tenant) |
|---|---|---|
| Discovery | own marketplace profile | via company + platform |
| Pricing | self-set | company-set/governed |
| Payout | direct to tutor | to company, then internal |
| Policy | platform defaults | company Tenant Admin policy |

## 5. Connection to the rest of the ecosystem
The tutor is the **demand fulfiller** in the closed loop: a teacher's flag → a parent's
alert → a booking here → teaching → mastery write-back that the teacher and parent both
observe. Because the tutor tags against the same curriculum taxonomy and writes the same
mastery records, supplemental learning is *measured against* formal learning rather than
running parallel to it. See [System Matrix](07-system-matrix.md).
