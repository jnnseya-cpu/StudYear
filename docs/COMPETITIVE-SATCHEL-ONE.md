# Deep Dive: Satchel One → StudYear feature extraction

**Purpose.** A complete teardown of **Satchel One** (formerly *Show My Homework* / SMHW, by Team Satchel) and its sister SEL product **Satchel Pulse**, mapped feature-by-feature to **what StudYear already has, what's missing, and exactly how to build the gaps** into our stack (static Next export, Firebase `revision-rocket-4nuir`, roles: student / parent / teacher / school / tutor / admin / LA).

**Scope note.** Satchel One is a *school-first MIS/homework/behaviour platform*. StudYear is an *AI-native, all-stage learning OS* (EYFS → degree) that also serves private tutors and parents directly. So the goal is **not** to clone an MIS — it's to lift the proven school-operations mechanics Satchel nails (homework loop, behaviour, gradebook, parental comms, wellbeing screening) and fuse them with StudYear's AI + multi-stage + tutor/parent strengths.

> Research caveat: Satchel's own domains block automated fetching, so the underlying research was reconstructed from indexed help-centre/product pages and third-party reviews. Exact UI labels should be confirmed against the live product before we copy wording. Two naming traps: **Satchel Pulse ≠ Satchel One** (separate SEL/survey product), and the emotive "student speaks up → connects to a trusted adult / 60-sec weekly 5-question ARACY check-in" workflow is **Linewize/Smoothwall Pulse (Qoria)**, a *different vendor* — do not attribute it to Satchel.

Legend for the "StudYear today" column: ✅ have it · 🟡 partial · ❌ gap.

---

## 0. Executive summary — the extraction list (ranked)

**Tier 1 — highest value, build first (school-ops parity + clear StudYear AI twist):**
1. **Homework loop** — teacher *sets* work to a class → student *submits online* (text + file) → teacher *marks/comments* → parent *sees it*. This is Satchel's core and StudYear's biggest structural gap (we have makers/exam-builder but no set→submit→mark→notify loop). §1
2. **Gradebook / MarkBook** — auto row per assignment, submission status (submitted/late/not), grades against a **marking scheme**, bulk edit, student + parent visibility. §3
3. **Behaviour & rewards engine** — positive/negative points, custom reasons, **badges**, house points, live in-lesson awarding, parent notification. §2
4. **Detention register + sanctions engine** — auto-trigger consequences from behaviour thresholds, schedule, mark attendance, notify parents. §2
5. **Announcements / notice board + school→parent messaging** (email/SMS) with **read receipts** and targeted audiences. §5
6. **Student 360° report** — one PDF aggregating homework, behaviour, attendance, grades, targets, notes for parents' evening. §3
7. **Engagement / at-risk analytics** — login recency + submission rates surfacing disengaged students, with one-tap "remind" (already partly in our school console). §4

**Tier 2 — differentiators where our AI wins:**
8. **Wellbeing / SEL screener** (CASEL-style, age-banded, slider UI, auto-tiering → AI-recommended interventions). §6
9. **Seating plans** with data overlays (behaviour/SEND/attainment on each seat). §2
10. **Welfare / safeguarding notes** (private/shared, never visible to student/parent, attachable docs). §2
11. **Timetable** as the spine that homework/attendance hang off. §7
12. **Flightpaths & termly targets** (auto-fill termly targets from an end-of-year target) — fuse with our attainment engine. §3
13. **Custom/self-serve surveys** for students/staff/parents (climate, feedback), anonymous, dashboarded. §6

**Tier 3 — platform hardening / land-grab:**
14. **Granular RBAC** (per-area × View/Create/Edit/Delete) across consoles. §7
15. **SSO** (Google / Microsoft) + auto-provision. §7
16. **Scheduled reports** (email a report daily/weekly/monthly). §4
17. **A live cross-school/tutor resource marketplace** — Satchel *killed* theirs (replaced by AI). This is now an open lane StudYear could own (community + AI, not either/or). §7

**Where StudYear already beats Satchel today:** AI-native content (our SYAI tutor, makers, exam builder, course generator, deep-marked diagnostic) vs their single "Sidekick" generator; **all key stages incl. primary + post-16 + degree + adult**; a **direct-to-parent AI advisor**; a **private-tutor marketplace & workspace**; a **student-facing revision/independent-study suite** (comprehension, spelling dictation, Maths Heroes, etc.). Satchel is teacher/admin-first; we're learner-first *and* school-capable — keep that edge.

---

## 1. Homework / assignments engine  ❌ biggest gap

### What Satchel does
- **Seven task types:** (1) **Assignment** (submit in class / online / 3rd-party), (2) **Classwork** (in-lesson), (3) **Flexible task** (optional, no submission, "completion date"), (4) **Quiz** (auto-marked MCQ), (5) **Spelling test** (audio, auto-marked, EN/DE/ES/FR), (6) **Differentiated task** ("trays" = tiered levels the student self-selects), (7) **Class test** (revision reminder + resources, no submission).
- **Set-task flow:** pick class group(s) (advanced search by name/subject/year → push to many classes at once), description (typed or AI), issue date, due date, attachments (computer/Google Drive/OneDrive), web links, **submission method**, marking scheme, optional timetable link → Publish (drafts supported).
- **Submission methods:** *Online via Satchel* (auto status: Submitted / Submitted-late / Not-submitted; teacher notified) · *Hand in class* (manual statuses) · *No submission / redirect* (mark entered manually).
- **Online submission (student):** built-in word processor **+** file attachments (incl. Google/OneDrive live docs the teacher can annotate); "save as draft & continue later".
- **Quizzes:** per-question timer, 1 or 3 attempts (best kept), question randomisation, instant results, **"Quiz Comprehension"** = per-question % wrong across the class.
- **Spelling tests:** spoken word (replay unlimited), 3 attempts, hint on 3rd (reveals letters), optional context sentence.
- **To-do list** (Upcoming / Past / Overdue, tick to complete, "hide completed") + **School Calendar** (every task, filter by date/teacher/subject/year/type) + a public homework-calendar search.
- **Resources** = internal library of past tasks (reuse/edit/delete, share drafts across a department).
- **Comments** on a task: student↔teacher two-way; **parent sees the thread read-only**.

### StudYear today
- 🟡 We have the *content* pieces (SYMakers: flashcards/quiz/notes/mindmap/summary/essay/diagram/worksheet; SYExam paper builder; AI course generator; interactive lesson; comprehension; spelling **dictation** test — arguably better than theirs). ✅ our quizzes/spelling already auto-mark and are AI-generated.
- ❌ **No teacher→class "set homework" → student "submit" → teacher "mark" → parent "sees" loop.** No assignment object, no submission object, no gradebook, no due/late status, no to-do list fed by teacher-set work.
- 🟡 We have an assignment-*review* (student uploads their own work for AI marking) but not teacher-assigned homework.

### Build in StudYear
- New Firestore collections: `assignments/{id}` (owner=teacher/tutor, classId, type, title, body, issuedAt, dueAt, submitMethod, markingSchemeId, attachments[]) and `submissions/{assignmentId}/{studentUid}` (status, text, files[], grade, feedback, markedAt). Reuse the existing **school roster / class** structures and the **/directory** link graph so a teacher's class = linked students.
- **Task types map to what we already generate:** Quiz & Spelling reuse our existing engines; "Assignment/Classwork/Class test" are containers + attachments; **Differentiated "trays"** map beautifully onto our `SY.attainment`/`stageStyle` — auto-generate 3 tiers with AI. Add a **Flexible task** (no submission).
- **Student surface:** add a **"Homework / To-Do"** tab to the student study hub (Upcoming/Past/Overdue) — this also finally gives the student dashboard a real teacher-driven to-do list.
- **Submission:** text box + file upload to Firebase Storage (we already have `SYCloud.upload`). Auto status from `dueAt`.
- **AI twist (our edge):** on submit, offer the student an **instant AI self-check** before final submit; on the teacher side, **AI-assisted marking** (draft feedback + suggested grade the teacher approves) — we already have deep-marking from the diagnostic Q10 work.
- **Comments:** reuse the pop-up tutor chat styling; parent read-only mirrors Satchel.
- **Priority: Tier 1 (#1).** This is the backbone that makes StudYear usable as a school homework platform.

---

## 2. Behaviour, rewards, detentions, seating, welfare  ❌ mostly gaps

### What Satchel does
- **Behaviour points:** positive & negative, **custom reasons** each carrying a point value, award to one/many students in a click, award *while marking*, running tally, sortable leaderboards; per-student breakdown with delete. (No public house-league — a noted gap vs ClassDojo.)
- **Badges:** fully custom (name + icon), awarded manually, counted/reported, shown to student & parent.
- **Detentions / Detention Register:** set with reason + type (type auto-fills duration + location), instant parent/student notification, **mark attendance** (all/individual), **reschedule absentees to next slot** (auto-populates a new detention), advanced-notice lead-time rules.
- **Sanctions engine:** rules ("N negative points / repeated behaviour") → **pending recommendations** (severity + student) that staff review/edit/apply → feed detentions. Human-in-the-loop.
- **On Call:** in-lesson "Send alert" per student → push + web "Priority Alerts" to the on-call team → assign → resolve → summary email.
- **Seating plans:** build from class data, drag-drop/swap, copy layout across classes, sort to bring an inclusion group to the front, **overlay behaviour points / SEND / assessment data on each seat**, surface **welfare notes via an "i" icon**, export/print.
- **Welfare Notes:** central store of medical/behaviour/safeguarding/SEND info; **private or shared-with-named-staff; never visible to students/parents**; attach EHCP/care plans; surfaced on profile + seating + reports.
- **Reasons are shared** between Behaviour and Detentions for reporting consistency; where an MIS is connected these import from it.

### StudYear today
- ✅ School Command Centre has behaviour/wellbeing/safeguarding *intake* and equity engine (from the school-record work), and per-child private record with permissioned access.
- 🟡 We have safeguarding **flags** in the school intake grid, but not a live **welfare-notes** object with private/shared visibility + doc attach.
- ❌ No live **behaviour points / badges** system, ❌ no **detention register**, ❌ no **sanctions auto-trigger**, ❌ no **on-call**, ❌ no **seating plans**.
- ✅ We already have **SkillRush/Maths Heroes/Number Rock Stars** gamification (trophies, points) — the *reward primitives* exist and can be repurposed for a behaviour/house-points economy.

### Build in StudYear
- `behaviour/{schoolId}/events/{id}` (studentUid, teacherUid, reasonId, points±, badgeId?, note, at). Config: `behaviourReasons`, `badges` (name+emoji/icon), `houses`. Teacher awards from the class roster grid (multi-select) — we already render roster grids in the school console.
- **Badges/points → reuse our gamification UI** (tiles, trophy styling) and push a parent notification via the existing notification/log channel.
- **Detentions:** `detentions/{id}` (studentUid, reasonId, typeId→duration+location, when, status), auto-notify via `SY.log`/parent link, attendance marking, reschedule-to-next-slot helper.
- **Sanctions engine:** a small rules table (`if negativePoints in window ≥ N → recommend detention`) producing a **recommendations** queue in the teacher/school console — pairs perfectly with our existing "intervention" auto-feed. **AI twist:** AI suggests the *support* (not just the sanction) — a restorative action + a Parent Action Card.
- **Seating plans:** a canvas/grid editor (we already draw QR canvases; a drag-drop desk grid is similar). Overlay the data we already hold (SEND flag, reading age, wellbeing, attainment from `SY.attainment`). Export via our existing office/PDF export.
- **Welfare notes:** `welfare/{schoolId}/{studentUid}/notes` with `visibility: private|shared[]`, doc attach to Storage, **hard rule: never in the student/parent namespace** (respect our E2EE + permission model). Surface on the per-child record and seating plan.
- **Priority: Behaviour+badges+detentions = Tier 1 (#3, #4). Seating + welfare = Tier 2 (#9, #10).**

---

## 3. Assessment / MarkBook / gradebook / targets  ❌/🟡

### What Satchel does
- **Homework Gradebook (formative):** auto row per task; statuses (Submitted/Late/Not); grade against a **Marking Scheme** (admin-defined free-text grade lists — A*–U, 9–1, RAG, mastery bands, %); **bulk update**; comments; student + parent see it via "Results".
- **Assessment module (summative MIS):** spreadsheet-style sheets; **assessment sets** = time periods (one result per type per set → history preserved, no overwrite); **grade schemes with numeric values** (grades → points for analysis); **targets vs actual**; **flightpaths** (can be a % not a full level); **"Create Termly Targets" auto-fills per-pupil termly targets from the end-of-year/KS target**; **report cards auto-sent to parents** (incl. KS1/KS2 teacher assessment); **lock/hide columns**; per-assessment **"View only"** and **"Hidden"** (excluded from all sheets/exports) governance flags.
- **Student 360° report:** custom PDF aggregating homework, behaviour, detentions, attendance, pastoral notes, **current/target grades** — for parents' evening / Ofsted.
- Auto-marked quizzes/spelling/online submissions flow in automatically.

### StudYear today
- ✅ We have a **world-class attainment engine** (`SY.attainment` — correct national framework per stage EYFS→degree: ELG, WTS/EXS/GDS, KS2 scaled scores, GCSE 9–1, A-level, BTEC, IB, degree classes, etc.) — *stronger and more multi-stage than Satchel's free-text schemes.* ✅ current/target grades in profile & everywhere. ✅ predicted grade with AI. ✅ progress tracking + diagnostics baseline.
- ❌ No **gradebook** tied to assigned work (because no assignment loop yet — see §1). ❌ No **assessment sets / flightpaths / termly-target auto-fill**. ❌ No **Student 360° single-PDF**.

### Build in StudYear
- **Gradebook** falls out of §1 (`submissions` grades) — render a class × assignment matrix in the teacher/school console with bulk edit; parent/student read via existing dashboards.
- **Marking schemes** = a tiny config, but *prefer our attainment engine*: let a teacher grade against the correct national scale for the student's stage automatically (a real advantage — Satchel makes admins hand-build scales).
- **Flightpaths / termly targets:** add `targets/{studentUid}` with `endOfYearTarget` + auto-derived `termlyTargets[]` (linear or AI-shaped from baseline). Plot against our existing baseline→now→100% bar. **AI twist:** AI explains the flightpath and what moving up one band needs (we already do this in predicted-grade).
- **Student 360° PDF:** we already have office/PDF export across the OS — assemble one report from data we already hold (attainment, diagnostics, activity, attendance register, spelling record, behaviour once built). High-value, low-effort once §1–2 exist.
- **Priority: Student 360° = Tier 1 (#6). Gradebook = Tier 1 (rides on #1/#2). Flightpaths = Tier 2 (#12).**

---

## 4. Analytics / insights / reporting  🟡 strong already

### What Satchel does
- **4-tier engagement analytics:** task → class → student → whole-school. Task Insights (submission pie, who hasn't viewed/submitted, **one-tap reminder that also notifies parents**), Class Insights (submission rate per task across the year, top/bottom 5 students, **logins in last 7 days + "remind those who haven't"**), whole-school Reports.
- **Reports catalogue:** School Overview (tasks set, filter teacher/subject/class/year), Homework Frequency (week-by-week, date picker), Issued/Submissions, Student progress, **Student 360°**, Tutors' Report, **User Activity** (last login for every staff/student/parent), Behaviour, Detentions, Attendance, Seating.
- **Delivery:** filter → **schedule (daily/weekly/monthly email)** → export XLS / PDF. Data-governance: "Hidden" excluded from exports.
- **SLT KPIs & trends** with drill-down to individual incidents; **at-risk = engagement-based** (login recency, submission/view rates) — *not ML predictive*. Their only predictive bit is target-vs-predicted-grade.

### StudYear today
- ✅ School Command Centre = "AI Academic Intelligence" (dashboard, equity engine SEND/PP, girls/boys gap, curriculum %, wellbeing, safeguarding counts) — already SLT-grade and **AI-analysed**, arguably ahead of Satchel's static charts. ✅ LA console. ✅ admin analytics/AI-cost.
- 🟡 Engagement/at-risk exists in spirit (intervention auto-feed) but not the **login-recency + submission-rate "remind" loop** (needs §1).
- ❌ No **scheduled-report email**. 🟡 exports exist (office/PDF) but not scheduled.

### Build in StudYear
- Once §1 exists, add **engagement tiles** (submission rate, last-login, non-submitters with one-tap AI-written reminder to student+parent) to the class view. We already surface login/activity in the record.
- **Scheduled reports:** a Cloud Function (we have Functions) that emails a rendered report on a cron — reuse our existing report renderers. Tier 3 (#16).
- **Keep our AI edge:** our analytics should *explain and recommend* (we already do), not just chart. That's the wedge vs Satchel.
- **Priority: engagement/at-risk loop = Tier 1 (#7, rides on #1). Scheduled email = Tier 3 (#16).**

---

## 5. Parental engagement & communications  🟡/❌

### What Satchel does
- **Parent app/portal:** one view per child of homework/to-do, behaviour (points, badges, who awarded & why), **attendance** (today vs timetable, last-30-days sessions, YTD %/punctuality), timetable, detentions, comments, announcements; **multi-child incl. across different schools** (switch by avatar); real-time.
- **Account linking:** **Parent Code** (from school letter OR child's app Settings→Parent Code OR web). **Expires after 3 months. One code makes up to 5 guardian accounts.** One code per child (multi-school = multiple codes on one account). Bulk generation/distribution by admin. Welcome pack.
- **Notifications:** per-user email (daily digest / weekly digest / new events) + push (all). New homework, deadline reminders, feedback, behaviour, events; overdue nudges.
- **Announcements / Notice board:** broadcast to targeted audiences (class/reg/year/whole-school, multi-select), attachments, **scheduling + recurrence** (repeat weekly/fortnightly), **read receipts (open counts)**, staff-only notices. Teacher scope = own classes+; admin = anyone; non-teaching staff can't send.
- **Messaging module (MIS):** targeted **email + SMS** (SMS via school's GOV.UK Notify), merge fields, reusable templates, attachments, school logo, **custom reply-to**, full audit history.
- **Two-way limit:** parents are **read-only** on homework comment threads; **no parent→teacher in-app messaging** (a widely-noted weakness). **No documented translation/multi-language** and **no offline** (both gaps).
- **Engagement analytics:** task/class parent-login stats (a case study cites 29%→60% parent access after adding comms).

### StudYear today
- ✅ Parent dashboard ("Command Centre / Parent Elite") with AI Parent Advisor, child linking via **code + QR** (we just rebuilt this: backend `/directory`, cross-device, inline reconnect, QR-to-URL scan). ✅ multi-child. ✅ Parent Action Cards.
- 🟡 Our linking is code/QR like theirs but **we should copy the good policies**: code expiry, N-accounts-per-code, bulk generation, welcome pack.
- ❌ No **announcements/notice board** with targeting + read receipts. ❌ No school→parent **email/SMS messaging**. 🟡 notifications exist as in-app logs; no email/push digests.
- ✅ **We can beat their #1 weakness:** add **two-way parent↔teacher/tutor messaging** (they refuse to) and **multi-language** (they lack) — both natural with our AI (auto-translate messages).

### Build in StudYear
- **Announcements:** `announcements/{schoolId}/{id}` (audience filter, body, attachments, scheduledAt, recurrence, readBy[]) → render on student/parent dashboards + push notification; read-receipt = `readBy` count. Teacher/tutor scoped to their linked learners.
- **Messaging:** school→parent email via a Cloud Function (Firebase can send email); SMS optional later. **AI twist:** compose-with-AI + **auto-translate to the family's language** (kills two Satchel gaps at once).
- **Beat them on two-way:** allow parent→teacher/tutor threaded messages (moderated), which Satchel deliberately won't do.
- **Copy their linking policies:** add code **expiry**, **up-to-5 guardians per code**, **admin bulk code generation + printable welcome pack** (we already generate parent codes + QR).
- **Digests:** daily/weekly email digest Cloud Function; per-user toggles (mirror their "Manage notifications").
- **Priority: Announcements + messaging = Tier 1 (#5). Linking-policy polish = Tier 2. Two-way + translate = our differentiator, Tier 2.**

---

## 6. Wellbeing & SEL — *Satchel Pulse* (separate product)  ❌ big opportunity

### What Satchel Pulse does (CASEL-based SEL/climate platform)
- **Universal SEL screener ("Skills"):** two sources per student — **self-assessment** + **teacher screener** (with rubric); **age-banded** wording (K-2 / 3-5 / 6-8 / 9-12); **slider/scale UI** with visual "don't rush" pacing; whole class <30 min; **read-aloud + 40+ languages**.
- **CASEL competencies:** self-awareness, self-management, social awareness, relationship skills, responsible decision-making — each with **sub-skills**; results **auto-tier** students (MTSS Tier 1/2/3) and **auto-group** by weakest sub-skill.
- **SEL library:** hundreds of CASEL-aligned lessons/interventions/self-studies; **results deep-link to pre-filtered resources**; **dynamic, editable intervention plans**; strategies tailored to how the student self-scored.
- **Dashboards:** student→class→grade→school→district rollups; real-time; **at-risk cohorts surfaced earlier than attendance/behaviour**; multi-year trends; auto-disaggregation (equity gaps).
- **Surveys / Perceptions + Culture & Climate:** drag-build or template library (SEL/attendance/climate/any topic); target by school/grade/role; **anonymous**; 5–10 min; read-aloud + 40+ langs; visual dashboards; stakeholder voice (students/staff/families).
- **Staff wellbeing / Wellbeing Tracker:** surveys staff + students + parents ("connection, recognition, participation" as early disengagement signals); automated cadence.
- **AI:** **sentiment analysis of free-text** + **positive-action suggestions**. **Psychometrics:** documented 7-step survey methodology (validity/reliability). **Compliance:** FERPA/COPPA, Student Privacy Pledge.
- Safeguarding = **preventative flagging only** (not case management — that's Welfare Notes in Satchel One).

### StudYear today
- 🟡 School console has **wellbeing check-in score** and safeguarding counts; per-child record has wellbeing. ❌ No **student SEL self-screener**, ❌ no **CASEL competency model + auto-tiering**, ❌ no **SEL intervention library**, ❌ no **custom survey builder**, ❌ no **staff/parent climate surveys**.
- ✅ We have AI + an intervention/recovery-plan engine + stage-appropriate content — perfectly positioned to do the *"screen → auto-recommend intervention"* loop **better** than Satchel because ours can auto-generate the intervention, not just link a static one.

### Build in StudYear
- **SEL screener:** `wellbeing/{studentUid}/screens/{at}` — age-banded question bank (reuse our stage detection), slider UI (we built slider UIs in the diagnostic), self + teacher sources. Score → 5 CASEL competencies + sub-skills → **tier** (1/2/3).
- **AI intervention (our wedge):** instead of a static library, **AI generates a tailored SEL activity/plan** from the low sub-skills + stage — reuse `SYAI` + `stageStyle`. Optionally seed a small starter library.
- **Wellbeing dashboards:** roll up student→class→year→school in the school console (we already roll up equity data); trend over time; at-risk surfacing feeds the existing intervention queue.
- **Survey builder:** `surveys/{id}` (audience, questions, anonymous flag) for students/staff/parents; **AI sentiment + action suggestions** on free-text (we have AI); dashboard the results. Anonymous + small-group suppression.
- **Staff & parent climate surveys** for the school/LA consoles — strong SLT/LA selling point.
- **Priority: SEL screener + AI intervention = Tier 2 (#8). Surveys = Tier 2 (#13).** (High differentiation; do after the Tier-1 school-ops loop.)

---

## 7. Platform layer — timetable, MIS, SSO, RBAC, mobile, marketplace, pricing  🟡

### What Satchel does
- **Timetable:** display layer *imported from MIS* (or Timetabler), up to 3 weeks ahead; own + colleague + student timetables; print; **registers are generated from the core timetable**; cover/curriculum edits outside the core don't sync (a limitation).
- **MIS integration:** Groupcall/**XoD** + **Wonde**; syncs rosters/staff/groups/timetable; **attendance write-back is instant Satchel→MIS but polled MIS→Satchel (7/9/13/14/16h)**; can't overwrite a legitimate mark with "N"; DfE codes + custom codes; becoming a full **cloud MIS** (census, custom fields, 6th-form courses).
- **SSO:** O365, Google, RM Unify, AD — concurrently; **auto-provisions accounts but not roles** (safety gate).
- **RBAC:** role = set of **permissions**; each permission = one area × **View/Create/Edit/Delete**; every staff member needs a role; "Behaviour Manager" style roles.
- **Mobile:** one native app for **students + parents** (not staff); push for grades/comments/announcements/behaviour/detentions; multi-child switch; **no offline**.
- **Marketplace:** **Community Resources (cross-school) was RETIRED** — replaced by free unlimited **Sidekick AI** + an internal Resources library.
- **AI "Sidekick":** generates self-grading quizzes/spelling/homework, **Bloom's-taxonomy differentiation** by age/subject, lesson planner; **teacher must approve generated content before creating** (guardrail); free/unlimited.
- **Pricing:** school-purchased, **base + à-la-carte add-ons** ("pay for what you use"); MATs from **£2/pupil/yr**; MIS discounts to displace SIMS; separate **parent-paid "Satchel One Plus"** (custom colour theme; Extra = tick child's to-dos; Premium = direct support).
- **Hosting/security:** AWS, ≥99% uptime, DBS-checked staff, GDPR SAR/RTBF, anonymise data within 28 days of termination.
- **Accessibility:** under-documented publicly (a gap).

### StudYear today
- ✅ Firebase Auth (email/pw) + our own cross-device link/QR; ✅ granular-ish role model (student/parent/teacher/school/tutor/admin/LA) + E2EE; ✅ admin console + LA console; ✅ PWA (offline-capable — **beats their "no offline"**); ✅ our own **AI suite >> Sidekick**; ✅ tutor marketplace/reviews.
- ❌ No **timetable**; ❌ no **MIS import** (SIMS/Arbor/Wonde); 🟡 SSO is email/pw only (no Google/Microsoft SSO yet); 🟡 RBAC is role-based but not per-area View/Create/Edit/Delete.
- ✅ **Marketplace opening:** Satchel killed cross-school resource sharing — StudYear could run a **community + AI resource marketplace** (tutors/teachers publish; AI also generates) as a genuine differentiator, tying into our existing tutor marketplace.

### Build in StudYear
- **Timetable:** `timetable/{schoolId or studentUid}` (periods, day, subject, room, teacher); hang homework + a lightweight register off it. Manual entry first; CSV import later. Tier 2 (#11).
- **MIS/CSV import:** start with **CSV roster/timetable import** (we already import in admin bulk migration) before any Wonde/Groupcall work. Note their write-back constraints as design guidance.
- **SSO:** add Google + Microsoft via Firebase Auth providers (we route auth through the `/gapi` proxy already) — auto-provision, don't auto-role. Tier 3 (#15).
- **RBAC:** extend our role model to **per-area permissions (View/Create/Edit/Delete)** for the school console (behaviour, attendance, welfare, reports). Tier 3 (#14).
- **Resource marketplace:** let teachers/tutors publish makers/exam-papers/assignments to a shared, searchable library (moderated), *plus* AI generation — own the lane Satchel abandoned. Ties to tutor marketplace + `SYMakers`. Tier 3 (#17).
- **Copy their commercial ideas:** modular **base + add-on** pricing; a **parent-paid "Plus"** tier (we already have plans/ACUs + billing.js); MAT/LA multi-school pricing.
- **Keep/di­fferentiate:** we already win on offline PWA, AI depth, all-stage, and direct-to-learner/parent/tutor reach.

---

## 8. Their AI ("Sidekick") vs ours — we're ahead, stay ahead
- Sidekick = one generator (quiz/spelling/homework, Bloom's differentiation, approve-before-create). **StudYear already has more:** SYAI tutor (Socratic modes), 8-tool maker suite, exam-paper builder, AI course generator, interactive lessons, deep-marked diagnostic, comprehension & reasoning, spelling dictation + tips, predicted-grade analysis, parent AI advisor, teaching/pre-session briefs.
- **Adopt one guardrail from them:** the explicit **"review & approve AI-generated content before it's set"** confirmation for teacher-set homework (trust + safety) — cheap, worth copying.
- **Adopt their differentiation framing:** label AI-generated tiered work by **Bloom's level** and by our **stage attainment bands** — a nice pedagogical signal we can add to makers/assignments.

---

## Consolidated build order (recommended)

1. **Homework loop** (set → submit → mark → notify) + **To-Do** for students + **Gradebook** — §1, §3. *Unlocks §4 engagement + §3 Student 360°.*
2. **Behaviour points + badges + parent notify**, then **Detention register + sanctions engine** — §2.
3. **Announcements / notice board + school→parent messaging** (AI-composed, auto-translated, read receipts) — §5.
4. **Student 360° PDF** + **engagement/at-risk "remind" loop** — §3, §4.
5. **Seating plans** (data overlays) + **Welfare notes** (private/shared) — §2.
6. **SEL wellbeing screener → AI intervention** + **survey builder** (student/staff/parent, anonymous) — §6.
7. **Flightpaths / termly targets** fused with `SY.attainment`; **timetable** spine — §3, §7.
8. **Platform hardening:** per-area RBAC, Google/MS SSO, scheduled report emails, CSV MIS import, **community+AI resource marketplace** — §7, §4.

**Guiding principle:** copy Satchel's *operational mechanics* (the loops, the objects, the notifications, the reports), but make every one of them **AI-native, multi-stage, and learner/parent/tutor-facing** — that's the combination Satchel can't match.

---

*Sources: Satchel One & Satchel Pulse help-centre and product pages (help.satchelone.com, teamsatchel.com, satchelpulse.com), edtechimpact/Capterra reviews, UK G-Cloud listing, and school parent guides — gathered via web research (the vendor domains block automated fetching, so confirm exact UI labels against the live product before copying wording).*
