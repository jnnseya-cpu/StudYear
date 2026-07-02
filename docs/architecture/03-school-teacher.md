# 03 — Persona Teardown: School / Teacher

> **The Institutional Engine.** A robust enterprise workspace built for **managing
> classroom operations, maintaining compliance, delivering instruction, and executing
> grading workflows at scale.** The curriculum-bound instructor who moves a whole roster
> along a syllabus and reports outcomes up to parents and admins. Operates *inside a
> school/district tenant.*

## 1. Role summary

| | |
|---|---|
| **Tenant scope** | School / district tenant |
| **Primary jobs** | Plan → deliver → assess → grade → report; flag who's falling behind; stay compliant |
| **Reads** | roster, curriculum, submissions, mastery, class analytics |
| **Writes** | courses, lessons, assignments, grades, feedback, attendance, announcements |
| **Kernel services** | Content & Assessment, Learning Records, Scheduling, Communication, Analytics |

## 2. Core features & functionalities

### 2.1 Smart Attendance Ledger
A digital register with support for **geo-fencing, QR-code check-ins, or quick manual
entries** to track classroom attendance.

*Architecture:* attendance is an append-only event stream keyed to `(class, session,
student)`. Multiple capture modes (geo-fence, QR, manual) are pluggable *sources* that all
emit the same `attendance_marked` event, so downstream consumers (parent portal, early-
intervention dashboard, compliance export) never care how a mark was captured.

### 2.2 Dynamic Lesson Planner & Syllabus Builder
A structured module to **attach digital assets, align assignments directly to regional
learning objectives, and publish tasks to students.**

*Architecture:* lessons and assignments carry tags against the **regional learning-objective
taxonomy** — the same taxonomy tutors and the AI study sandbox tag against. Alignment to
standards is therefore not a report artifact but a data property, which is what makes
compliance export (2.6 / §3) a query rather than a manual rebuild.

### 2.3 Omnichannel Evaluation & Grading Engine
An advanced digital grading sheet supporting **custom rubrics, audio/video feedback clips,
and bulk score updates.**

*Architecture:* `assignment → submission → grade`. Rubrics are structured; feedback can be
text or media (media lands in Files, linked to the grade). Bulk updates are transactional
and each writes **Learning Records mastery** on the aligned objective — one grade, one
mastery write, all channels consistent.

### 2.4 Early Behavioral Intervention Dashboard
An automated warning system **analyzing attendance, engagement metrics, and grades to flag
students falling behind.**

*Architecture:* Analytics joins the attendance stream, activity events, and mastery to
compute at-risk state against Admin-configured thresholds. A flag emits an event — the
**origin of the closed loop**: it becomes a parent alert, which drives a tutor booking,
whose outcome returns to the *same* mastery record the teacher sees.

### 2.5 Virtual Classroom Orchestration
Native integration with **major live video tools, chat spaces, and real-time interactive
digital whiteboards.**

*Architecture:* real-time media is a **pluggable provider** orchestrated by the platform
(the same session-orchestration the tutor surface uses); chat and whiteboard artifacts and
recordings persist to Files/Communication, linked to the lesson.

## 3. Actions & micro-workflows

| Action | Flow | Services touched |
|---|---|---|
| **Deploy a pop quiz** — instantly push a quiz to an entire cohort with **auto-grading rules applied for multiple-choice** | author → target class → publish → auto-grade MCQ → mastery updates | Content & Assessment, Learning Records, Notifications |
| **Export compliant records** — export academic records & performance metrics **to formats required by regional education authorities** | select scope → generate standards-aligned export → audit entry | Analytics, Files, Audit |
| **Priority announcement** — publish a classroom-wide announcement that **immediately alerts both students and their parents** | compose → fan out to cohort + linked guardians | Communication, Notifications |
| **Mark attendance** | QR / geo-fence / manual capture → `attendance_marked` → parent visibility + intervention dashboard | Scheduling, Analytics |
| **Book a conference** | publish office hours → parent books slot → session scheduled | Scheduling & Booking, Communication |

## 4. Teacher vs. Tutor (formal vs. supplemental)

| Dimension | Teacher | Tutor |
|---|---|---|
| Binding | curriculum + fixed roster | on-demand booking |
| Channel | formal (institution) | supplemental (marketplace) |
| Availability | office hours | marketplace offerings |
| Paid by | institution (employment) | parent/student (per session/package) |
| Writes mastery | ✓ | ✓ (same records) |
| Compliance export | ✓ (regional authorities) | — |

## 5. Connection to the rest of the ecosystem
The teacher **originates** the demand signal — a grade, a missing assignment, an
intervention flag — that Analytics turns into a parent alert, which drives a tutor booking.
The tutor's work then updates the *same* mastery the teacher sees. The teacher both starts
and benefits from the closed loop, while the compliance/attendance machinery keeps the
institution audit-ready. See [System Matrix](07-system-matrix.md).
