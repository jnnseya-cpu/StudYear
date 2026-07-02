# 05 — Persona Teardown: Student

> **The Primary End-User Workspace.** A high-engagement, hyper-personalized workspace
> engineered to **minimize cognitive friction, maximize active recall, and organize daily
> academic life.** The student is the gravitational center of the ecosystem — every other
> persona ultimately reads from or writes to the student's learning record.

## 1. Role summary

| | |
|---|---|
| **Tenant scope** | Member of a school tenant (via enrollment) and/or platform tenant (via tutoring) |
| **Primary jobs** | Know what to do next → do it → see measurable improvement → get help fast |
| **Reads** | schedule, deadlines, content, grades, feedback, mastery |
| **Writes** | submissions, quiz responses, notes, study artifacts, messages |
| **Kernel services** | Learning Records, Content & Assessment, Scheduling, Communication, Analytics, Files |

## 2. Core features & functionalities

### 2.1 Unified Academic Timeline & HUD
A single **live dashboard** aggregating, in one chronological/priority view:
- class schedules (formal, from the school tenant),
- homework & assignment deadlines,
- upcoming private tutoring sessions (from Booking),
- institutional announcements.

*Architecture:* the HUD is a **read-model** composed from Scheduling, Content &
Assessment, and Communication via the event bus. It is materialized per-student so the
home screen is a single fast query, not a fan-out at render time. Deadlines and sessions
are the same `calendar_item` type with different sources, so "next up" ranks them together.

### 2.2 AI-Powered Study Sandbox
Native tools that turn passive material into active recall:
- upload lecture slides or notes → instantly generate **editable flashcards**,
- **automated progress quizzes** generated from the same source,
- **adaptive fill-in-the-blank** review guides that tighten around weak spots.

*Architecture:* uploads land in Files; an async generation job (LLM-backed) produces study
artifacts linked to the source and to curriculum topics. Because artifacts are
topic-tagged, quiz results **write back into Learning Records mastery** — the sandbox is
not a silo, it feeds the closed loop. The full maker-and-tester toolset (Study Planner,
Flashcards, Revision Cards/Notes, Quizzes, Mindmaps, Crosswords, Quizsearches, Shared
Resources) is specified in [11 — Revision Resources](11-revision-resources.md).

### 2.3 Digital Assignment Portfolio
A secure repository where students **upload digital coursework, execute coding
assignments, or submit multimedia files** directly to teachers or tutors.

*Architecture:* a `submission` belongs to an `assignment` and routes to the assigning
educator (teacher *or* tutor — the portfolio is channel-agnostic). Versioned, timestamped
against the deadline, and immutable once graded (with an audit trail for regrades).

### 2.4 Peer Community Hub & Forums
Cohort-specific micro-communities to **form study teams, trade organized notes, and join
secure peer-to-peer discussion threads.**

*Architecture:* forums are scoped to a `cohort` (class or tutoring group) so visibility
inherits enrollment. Moderation hooks report up to the owning teacher/tutor and Tenant
Admin. Note-sharing is a first-class artifact type, not a raw file dump.

### 2.5 Gamified Retention & Analytics Engine
Visual **telemetry of performance trends across subjects**, plus **focus-tracking modules
that reward consistent study habits.**

*Architecture:* Analytics reads mastery + activity streams and renders per-subject trend
charts; a gamification layer (streaks, goals, rewards) sits on top of the *same* activity
events, so engagement mechanics never diverge from real learning data.

## 3. Actions & micro-workflows

| Action | Flow | Services touched |
|---|---|---|
| **Snap-to-solve** — photograph a handwritten math problem in the mobile app to invoke the integrated AI explanation assistant | image → OCR/vision → step-by-step explanation → optional "practice similar" | Files, AI service, Content, Learning Records (topic tag) |
| **Ask for clarification** — start an async chat thread with an assigned school teacher *or* external private tutor about a graded assignment | thread is linked to the specific submission/grade for context | Communication, Content & Assessment |
| **Submit & test** — submit a final exam file or complete an **auto-proctored digital quiz** directly within the learning window | integrity check → submission/attempt recorded → routed to grader → mastery updated | Content & Assessment, Files, Learning Records |

## 4. How the Student surface connects to the rest of the ecosystem

- A **teacher's** assignment appears on the student's HUD; the student's submission returns
  to the teacher's grading queue.
- A **tutor** booked by a **parent** appears as an upcoming session on the same HUD; the
  session's outcome updates the *same* mastery record the teacher sees.
- Quiz/mastery data drives **Analytics**, which can flag the student as at-risk — the
  trigger that a **parent** acts on to book help (see the closed loop in `00-overview.md`).
- **Guardianship** governs the surface: younger students get a parent-mediated experience
  (approvals, spend, comms visibility); older students self-serve with parental visibility.

See [Parent](06-parent.md) for the governance-and-support counterpart to this surface.
