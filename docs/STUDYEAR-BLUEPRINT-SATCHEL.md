# StudYear Blueprint — Extract, Improve and Surpass Satchel One

> Canonical product strategy derived from the Satchel One / Satchel Pulse deep dive.
> Companion to `docs/COMPETITIVE-SATCHEL-ONE.md` (the feature-by-feature research teardown).
> This document is the vision + roadmap we build from.

## Executive conclusion

Satchel One is no longer simply a homework platform. It has evolved from **Show My Homework** into a combined learning management platform, classroom management suite, parent engagement app, behaviour management system, school MIS, attendance/assessment/exams platform, safeguarding & welfare record, and AI-assisted teacher productivity tool. Its real advantage is not a single feature — it is that every function is built around **one student record, one school structure, one login and one connected workflow**.

StudYear should not reproduce Satchel screen by screen. It should extract its strongest operating principles and combine them with StudYear's existing AI tutoring, diagnostics, academic recovery, predictive grades and parent intelligence, to become:

> **The AI Education Operating System that connects learning, school operations, intervention, family engagement and academic outcomes in one intelligent platform.**

Core promise: **Every student understood. Every risk detected. Every intervention coordinated. Every family informed. Every outcome improved.**

---

## Satchel's six connected layers (what we're matching)

1. **Classroom execution** — homework, quizzes, spelling tests, lesson plans, submissions, marking, feedback, timetables, seating, classroom attendance.
2. **Student management** — the operational student record: personal info, class/group membership, academic records, behaviour, attendance, detentions, assessments, welfare notes, guardian contacts, documents, exam arrangements.
3. **School operations** — admissions, academic structures, rooms, departments, courses, staff records, cover/absence, exams, messaging, permissions, data migration, reporting, DfE census.
4. **Parent & student engagement** — homework notifications, to-do lists, timetables, attendance, behaviour points, detentions, documents, notices, grades, teacher comments, announcements.
5. **Safeguarding & inclusion** — welfare notes, medical, SEND, EHCP attachments, care plans, staff-only records, visibility controls, view tracking, notifications.
6. **AI assistance** — Satchel's "Sidekick" is mostly teacher productivity (homework/quiz/spelling generation, Bloom's differentiation, lesson plans). **This is the layer StudYear already beats and must extend into a full agentic operating layer.**

---

## What Satchel does particularly well (keep this discipline)

- **It solves real daily school problems first** — set homework, take attendance, record behaviour, share documents, manage detentions, organise seating. Operational discipline before AI ambition.
- **It connects parents without overwhelming teachers** — most updates are generated *by the workflow itself* (homework issued, mark received, point added, detention scheduled), not written by hand each time.
- **Modular, phased adoption** — schools can start with classroom modules and grow into the full MIS.
- **The student record is a shared operational foundation** — homework, seating, welfare, attendance, behaviour, assessment are not separate databases.
- **Visible accountability** — parent document-view tracking, user-activity auditing, behaviour/attendance/homework reporting, historical grade-scheme preservation.
- **It integrates rather than forcing replacement** — keep Google Classroom / Teams / existing MIS at first.

## Satchel limitations StudYear can exploit

1. **AI is a content generator, not an operating layer** — StudYear coordinates diagnosis → learning → planning → assessment → intervention → parent guidance → teacher workload → school performance → cost governance.
2. **Limited visible student personalisation** — StudYear keeps a continuously-updated individual learning model.
3. **Limited recovery-plan orchestration** — StudYear's Personal Recovery Plan becomes a school-wide intervention engine.
4. **Limited predictive intelligence** — predicted grades, target-probability, deadline/attendance/topic/burnout/dropout risk, intervention-impact forecasting.
5. **No AI cost governance** — StudYear's ACU model gives budgets, allowances, wallets, cost-per-outcome, provider routing, hard caps.
6. **No employability/future-readiness layer** — connect academic data to skills, careers, apprenticeships, university pathways, portfolios.
7. **Limited low-connectivity design** — StudYear can own WhatsApp/SMS/voice/offline/Mobile-Money for international reach.

---

## Module-by-module extraction (Satchel capability → StudYear improvement)

### Homework / task management  *(Satchel: mature)*
- **Assignment Command Centre** with a controlled lifecycle: Draft → Approved → Scheduled → Issued → Viewed → Started → In progress → Draft submitted → Final submitted → AI pre-reviewed → Teacher reviewed → Returned → Resubmitted → Completed → Intervention required → Archived.
- **Creation fields:** title, subject, curriculum, key stage/year, topic, objective, prior knowledge, difficulty, Bloom's level, est. time, issue/due dates, submission format, rubric, max score, resources, accessibility, differentiation level, AI-permitted flag, parent visibility, student group, individual overrides.
- **StudYear improvement:** don't just issue homework — auto-calculate prerequisite readiness, too-easy/too-hard, deadline conflicts, available study time, workload excess, alignment to recovery plan, likely predicted-grade impact, deadline-miss risk.
- **AI pre-submission coaching** (clarify question, step plan, lesson recap, vocab support, practice question, draft check, citation/grammar/rubric alignment, missing-section detection) — *coach toward completion, never complete it*.

### Task workload analytics  *(Satchel: Task Insights, count + est. duration)*
- **Academic Load Intelligence** — a **Student Academic Load Index** from assignment count, est./actual completion time, subject complexity, revision load, upcoming exams, processing speed, SEND, attainment, wellbeing (consented), missed work, travel, extracurriculars, teacher urgency.
- Dashboards for student (due today/week, hours, start time, at-risk tasks, best sequence), parent (workload, deadline exposure, burnout warning, recommended action), teacher (overloaded/under-assigned students, likely-late, poor completion, actual-vs-estimated, AI-reliance), leadership (dept consistency, completion rates, subjects generating overdue work, marking backlog, homework↔attainment link).

### Behaviour management  *(Satchel: points/badges/leaderboards/houses/sanctions)*
- **AI Behaviour, Engagement & Intervention Engine** — not a punishment ledger.
- Positive & concern event categories; rich event fields (student, category, time, location, lesson, staff, severity, witnesses, action, parent visibility, evidence, follow-up owner, review date, resolution, appeal).
- **AI pattern detection:** subject-specific decline, time-of-day clustering, behaviour after attendance drop, homework-failure→disruption, possible bullying, sanctioned-but-unsupported students, inconsistent staff application, disproportionality across groups, students never praised, pre-exam deterioration.
- **Intervention-first model:** Signal → context review → intervention recommendation → **human decision** → follow-up → outcome measurement. (AI recommends, never auto-disciplines.)

### Detentions & sanctions  *(Satchel: detention register + escalation)*
- **Intervention & Resolution Centre** (broader than "detentions"): academic catch-up, homework session, restorative meeting, reflection, attendance intervention, mentoring, parent meeting, wellbeing session, supervised study, community contribution, formal detention, internal isolation, external referral.
- Full intervention record + **automated escalation rules** (e.g. 3 missed assignments/14 days → tutor intervention; safeguarding keyword → DSL alert; missed detention → SLT review; 4 weeks clear → positive recovery badge).

### Seating plans  *(Satchel: data-informed drag-drop)*
- **Smart Classroom Mapper** with room designer, photos, preferred name/pronunciation, SEND/medical/vision/hearing indicators, behaviour compatibility, attainment, participation, language needs, peer-support, safeguarding restrictions, temporary adjustments.
- **AI seating recommendations** with **explanations** ("placed at front due to recorded visual-support requirement"); **human approval mandatory**.

### Attendance & punctuality  *(Satchel: registers + trends)*
- **Attendance Intelligence** — session/lesson/club/remote/exam/trip/detention/tutor registers; full statutory + custom code set; parent absence-reporting with evidence upload & challenge.
- **AI attendance agent** detects Monday/Friday patterns, subject avoidance, first-period lateness, post-incident decline, sibling patterns, sudden drops, persistent-absence thresholds, missing reasons, welfare-check needs, positive recovery.
- **Intervention orchestration** *prepares* (never auto-sends without policy): first-absence notice, missing-reason request, concern letter, meeting invite, improvement plan, weekly summary, escalation pack, LA referral package.

### Timetables  *(Satchel: display layer from MIS, Meet links)*
- Student/teacher/room/parent/intervention/exam/club/cover timetables + remote lesson links + revision & tutor sessions.
- Intelligent features: clash detection, room-capacity & teacher-availability validation, travel-time & SEND transition allowance, workload distribution, high-focus lesson placement, auto intervention scheduling, revision blocks, parent-meeting scheduling.
- **Personal Daily Command Centre** per student (today's lessons, equipment, homework due, revision priorities, attendance, room changes, cover info, live links, transport, interventions, suggested study block, predicted completion time).

### Assessment & grade schemes  *(Satchel: configurable schemes, history preserved)*
- Separate: assessment definition → instance → grade scheme → rubric → student attempt → teacher judgement → AI analysis → moderation → published result → historical version (never rewrite past results — Satchel's key design principle).
- Assessment types (baseline, diagnostic, formative, summative, mock, end-of-topic, coursework, practical, oral, project, controlled, teacher judgement, standardised, external) and grade schemes (9–1, A*–G, %, PMD, Emerging/Developing/Secure/Mastery, university, school-specific, international, standards-based). **Reuse StudYear's superior multi-stage `SY.attainment` engine.**
- **StudYear interpretation layer:** knowledge-gap diagnosis, misconception ID, predicted-grade movement, curriculum coverage, confidence, intervention recommendation, recovery-plan update, comparative progress, question-level analysis, skill mastery, teacher-vs-AI evidence, reliability warnings.

### Examination management  *(Satchel: full Exams module)*
- **Exam Operations Centre** — pre-exam (board config, qualification catalogue, entries, tiers, predicted-grade validation, statements of entry, access arrangements, rooms, invigilators, clash resolution, mocks, revision plans), exam day (check-in, QR/ID verify, room attendance, incident reporting, script tracking, invigilator checklist, live command dashboard), post-exam (result import, predicted-vs-actual, cohort/subject/question analysis, review-of-marking, appeals, resits, parent letters, next-step recommendations).
- **AI Examination Readiness Score** (mastery, practice-paper completion, revision consistency, attendance, assignment completion, topic risk, predicted grade, confidence, time remaining, technique, burnout) → Ready / Nearly ready / At risk / Critical.

### Welfare, safeguarding & SEND  *(Satchel: Welfare Notes, staff-only)*
- **Student Support Vault** — separate connected record types (safeguarding concern, welfare observation, medical, SEND, EHCP, IEP, pastoral, counselling, family circumstance, risk assessment, accessibility adjustment, support strategy, external-agency).
- **Tiered visibility** (classroom-adjustment-only → teacher summary → pastoral → SENCO → DSL/deputy → medical → SLT → named-staff → legal hold → emergency access).
- **Safety controls:** every view logged, versioned, no silent deletion, restricted/watermarked export, retention policies, consent & lawful-basis records, emergency-override logging, sensitive-field encryption, **no sensitive data to third-party AI unless contractually approved**.
- **AI restrictions:** may summarise authorised info, flag overdue actions, remind designated staff, surface strategies, detect missing follow-up, highlight conflicting adjustments. **Must not** diagnose, close safeguarding decisions, accuse, auto-contact authorities, expose confidential info, or make autonomous disciplinary decisions.

### Documents  *(Satchel: share + view tracking)*
- **Document & Consent Centre** — letters, reports, policies, permission/consent forms, trip docs, results, plans (attendance/behaviour/EHCP/care), invoices, admissions, certificates, student work, minutes.
- Add what Satchel underemphasises: **e-signature, parent acknowledgement, deadlines, reminders, expiry, version history, translation, text-to-speech, mobile scan/OCR, field extraction, approval workflow, consent withdrawal, bulk generation, template library.** Status lifecycle: Draft → Under review → Approved → Published → Viewed → Acknowledged → Signed → Rejected → Expired → Withdrawn → Archived.

### Notices, announcements & messaging  *(Satchel: Notice Board + Messaging)*
- **Unified Communications Hub** — in-app, push, email, SMS, WhatsApp, voice call, automated voice message, portals, printed letter, emergency broadcast.
- Audience targeting (whole-school → year → class → subject → house → club → intervention/attendance-risk group → parent group → individual → department → custom dynamic group).
- **Communication intelligence** pre-send checks (reading level, tone, translation need, missing date/location, conflicting info, sensitive info, wrong recipients, duplicate, over-frequency, required action/deadline).
- Outcome tracking (delivered → opened → read → acknowledged → clicked → responded → form completed → consent given → payment completed → failed → escalated).
- **Low-connectivity advantage:** WhatsApp-first, SMS fallback, low-data mode, voice-note notices, voice translation, offline queueing, missed-call callback, printed QR notices, local languages.

### Admissions  *(Satchel: applicant → student workflow)*
- **Admissions & Enrolment OS** — enquiry (prospect, source, tour/open-day, follow-up, requirements, siblings, marketing consent), application (form, identity/address, previous school, medical, SEND declaration, docs, references, eligibility, fee), decision (review queue, scoring, interview, assessment, conditional/unconditional offer, waiting list, decline, appeal, deadlines), enrolment (acceptance, contract, consent, payment, accounts, class allocation, options, timetable, baseline diagnostic, transition plan).
- **AI advantage:** applicant-doc checklist, missing-info reminders, transition-risk profile, baseline diagnostic schedule, onboarding plan, parent orientation, first-30-day support. **Human decision retained.**

### Cover & staff absence  *(Satchel: Cover module)*
- **Staff Continuity Centre** — absence request/report → line-manager review → HR reason → timetable identifies affected lessons → identify qualified available staff → assign → share resources → update students → record completion → cost/workload reporting.
- **AI Cover Optimiser** (availability, expertise, year-group experience, workload, contract limits, location, safeguarding clearance, SEND familiarity, class continuity, cost, fair distribution).
- **Continuity Lesson Pack** when no cover available (objective, teacher/student instructions, resources, differentiated activities, quiz, answers, homework, SEND adjustments) — **department approval before release**.

### Integrations  *(Satchel: Google/Microsoft/MIS/SSO/CSV)*
- **Integration Hub** across learning platforms (Google Classroom, Teams, Moodle, Canvas, Blackboard, Brightspace, Schoology), MIS (SIMS, Arbor, Bromcom, iSAMS, Wonde, Groupcall, ScholarPack, Integris, SEEMiS), productivity (Workspace, 365, OneDrive, SharePoint, Drive, Zoom, Meet, Teams), identity (Google/Microsoft Entra/Apple SSO, SAML, OAuth, SCIM, magic links, parent OTP, student QR, passkeys), payments (Stripe, Direct Debit, GoCardless, PayPal, Mobile Money, bank transfer, cash reconciliation, vouchers).
- **Principle: a canonical education data model** — external systems map into StudYear's internal entities so we never depend on one MIS provider.

### Mobile  *(Satchel: role apps)*
- Role-specific home screens on one shared platform (student, parent, teacher, school leader) — see Dashboards below.

### Roles & permissions  *(Satchel: granular + auditing)*
- Platform / school / family role taxonomy; permission dimensions: View, Create, Edit, Delete, Approve, Publish, Export, Share, Assign, Close, Reopen, Override, Access AI, View sensitive data, Manage permissions, Impersonate-with-audit, Cross-school access, Historical access.

### Student 360  *(Satchel: connected records)*
- **Student 360 Command Centre** — one profile, tabs: Overview, Academic progress, Knowledge mastery, Predicted grades, Assignments, Assessments, Attendance, Behaviour, Interventions, Wellbeing, SEND & adjustments, Safeguarding, Timetable, Examinations, Documents, Communications, Parent engagement, AI usage, Verified Study Hours, Audit trail.
- **AI-generated student briefing:** current position, main risks, recommended action (student/teacher/parent/school, with deadline + expected impact).

---

## StudYear AI agent structure (the moat)

1. Learning Diagnostic Agent · 2. Curriculum Mapping Agent · 3. Assignment Architect · 4. Academic Load Agent · 5. Teacher Marking Agent (first-pass; **teacher approval mandatory**) · 6. Attendance Intervention Agent · 7. Behaviour & Engagement Agent · 8. Parent Advisor Agent · 9. Safeguarding Workflow Agent (strict controls) · 10. SEND Adjustment Agent · 11. Examination Readiness Agent · 12. School Operations Agent (missing registers, cover gaps, unresolved incidents, unread critical docs, timetable clashes, overdue entries) · 13. Communications Agent · 14. AI Cost Governor (ACUs, provider costs, model selection, caps, budget alerts, cost-per-student, margin protection).

---

## Product & commercial packaging

**Products:** StudYear **Learn** (student) · **Family** (parent) · **Teach** (teacher) · **School** (MIS) · **Trust** (MAT) · **Authority** (LA).

**Bundles:** Learning Platform (homework, AI resources, learning, parent dashboard, timetables, basic assessment) → Classroom Pro (attendance, behaviour, seating, detentions/interventions, advanced teacher analytics) → School MIS (admissions, records, staff, structure, docs, comms, cover, permissions, reporting) → Intelligence (predicted grades, intervention engine, AI briefing, load optimisation, risk prediction, Parent Advisor) → Exams → Trust & Authority. **ACUs stay separate from subscription access** for cost control.

---

## Implementation roadmap

**Phase 1 — Close the classroom gap (makes StudYear a daily school platform):** Assignment Command Centre · teacher assignment builder · student to-do list · submission & marking · teacher–student task comments · parent assignment visibility · timetables · basic notices · documents · homework analytics.

**Phase 2 — School engagement layer:** attendance · behaviour · rewards/badges · interventions · parent notifications · Student 360 · seating plans · parent acknowledgements · communication centre · teacher mobile workflows.

**Phase 3 — School operating system:** admissions · academic structure · staff directory · cover/absence · assessment · grade schemes · exams · roles/permissions · audit logs · MIS integrations.

**Phase 4 — Activate the AI moat:** Academic Load, Attendance Intervention, Behaviour Pattern, Exam Readiness, SEND Adjustment agents · Parent Advisor · School Operations Agent · Intervention Outcome Engine · AI Cost Governor · Trust-wide intelligence.

**Phase 5 — International expansion:** WhatsApp parent interface · SMS fallback · low-data mode · voice AI · local languages · Mobile Money · offline study packs · regional curriculum engine · government reporting adapters · NGO/community deployment.

---

## Priority feature matrix

| Priority | Feature | Satchel | StudYear improvement |
|---|---|---|---|
| Critical | Homework management | Mature | Adaptive & diagnostic assignments |
| Critical | Parent visibility | Strong | AI Parent Advisor & action plans |
| Critical | Attendance | Strong | Predictive attendance intervention |
| Critical | Assessment | Operational | Mastery & predicted-grade intelligence |
| Critical | Student 360 | Connected records | AI-generated intervention command centre |
| High | Behaviour | Points & sanctions | Contextual intervention-first engine |
| High | Seating | Data-informed | AI-assisted explainable placement |
| High | Documents | Share + view tracking | Signatures, consent & workflow |
| High | Communications | Notices & email | Omnichannel & multilingual |
| High | Exams | End-to-end admin | Readiness prediction & result action plans |
| High | Cover | Staff matching | AI continuity & workload optimisation |
| High | Welfare | Secure notes | Controlled safeguarding workflows |
| Medium | Admissions | Applicant→student | Diagnostic onboarding & transition plans |
| Medium | MIS | Full cloud MIS | AI-native education OS |
| Differentiator | AI | Content generation | Multi-agent education orchestration |
| Differentiator | AI economics | Not prominent | ACU & margin-governance engine |
| Differentiator | Connectivity | Conventional app | WhatsApp, voice, SMS & offline |

---

## Data model foundation (canonical entities)

**Organisation:** organisations, trusts, schools, campuses, departments, academicYears, terms, subjects, courses, yearGroups, groups, rooms, houses.
**People:** users, students, guardians, staff, contacts, userRoles, permissions, memberships.
**Learning:** curriculumFrameworks, curriculumObjectives, lessons, resources, assignments, assignmentVariants, submissions, comments, rubrics, feedback, quizzes, questions, attempts, masteryRecords, studySessions.
**Assessment:** assessmentTypes, assessments, gradeSchemes, gradeSchemeVersions, grades, predictions, moderationRecords, resultPublications.
**Operations:** timetables, timetableEvents, attendanceSessions, attendanceMarks, staffAbsences, coverAssignments, examinations, examinationEntries, examinationRooms, examinationIncidents.
**Student support:** behaviourEvents, rewards, badges, incidents, interventions, sanctions, welfareNotes, safeguardingCases, sendProfiles, adjustments, carePlans.
**Communication:** notices, messages, messageRecipients, notificationPreferences, deliveryLogs, documents, acknowledgements, consents, signatures.
**AI & commercial:** aiAgents, aiRuns, aiRecommendations, acuWallets, acuTransactions, modelCosts, budgets, subscriptions, invoices, payments.
**Governance:** auditLogs, accessLogs, dataExports, consentRecords, retentionPolicies, securityIncidents, integrationLogs.

---

*Sources: Satchel One & Satchel Pulse product/help-centre pages (teamsatchel.com, help.satchelone.com, satchelpulse.com), UK G-Cloud Digital Marketplace listing, Google Play, and edtechimpact reviews. Vendor domains block automated fetching, so confirm exact UI labels against the live product before copying wording.*
