# STUDYEAR 2.0 — The World's First AI Education Command Operating System

**Owner specification (2026-07) — preserved verbatim in intent; each block mapped to shipped/pending status.**

## Strategic positioning
StudYear is no longer a collection of AI learning tools. It is the **intelligence, intervention and
accountability infrastructure** connecting the entire education ecosystem. It detects what holds every
learner back, determines the best intervention, coordinates the people responsible, measures whether the
intervention worked and continuously improves the learner's pathway.

**Core promise:** *One learner. One verified academic profile. One coordinated support system.
Zero child left invisible.*

Connected stakeholders: students · parents/guardians · school teachers · school leadership · private
tutors · local authorities · education partners · employers & universities. Every stakeholder sees only
what their role permits; the AI agents operate behind the scenes as one coordinated intelligence system.

## 1 · The StudYear Intelligence Core
- **1.1 Learner Intelligence Graph™** — a continuously evolving profile: knowledge, missing prerequisites,
  misconceptions, strengths/weaknesses, speed, retention, confidence, consistency, assessments, assignment
  quality, attendance, intervention history, teacher/tutor/parent observations, career interests,
  accessibility needs, preferred formats, behaviour/engagement. *Shipped as the Student Record + Learning
  Model (record.js) — the graph deepens with the Firebase backend.* Not "weak in algebra" but "incomplete
  fractions, negative numbers and equation balancing."
- **1.2 Academic Digital Twin™** — simulates trajectory, best-value interventions, required study, exam
  readiness, workload sustainability, absence impact, grade scenarios. *Shipped in outline (predicted
  grades, model trends, school digital twin); full scenario simulation lands with the backend ML.*
- **1.3 Agent Orchestrator™** — one orchestrator, 20 specialist agents (Diagnostic, Teaching, Curriculum,
  Assessment, Misconception, Study Planning, Retention, Motivation, Intervention, Assignment Coach,
  Teacher Copilot, Parent Advisor, Tutor Copilot, Safeguarding Signal, Attendance, SEND Support,
  Career & Pathway, School Improvement, LA Intelligence, Evidence & Impact) sharing context through the
  graph under permission control. *Agent registry exists in @studyear/shared; permissioned data flows
  shipped (records/access/audit).*

## 2 · Student Command Centre
- **2.1 Today's Winning Plan™** — on sign-in: what to do today, why, how long, expected impact, minimum
  and stretch. The OS decides the best next action. *SHIPPED (study workspace).* 
- **2.2 Mastery Map™** — curriculum-wide states: Not assessed · Emerging · Developing · Secure · Mastered ·
  At risk of forgetting; zoom qualification→skill; every weak concept has a recovery route. *SHIPPED at
  subject level (My Progress states); skill-level zoom lands with the graph backend.*
- **2.3 Misconception Destroyer™** — analyse → identify misconception → trace prerequisite → re-explain →
  corrective practice → retest → confirm removal; distinguishes knowledge gap, misreading, calculation
  error, weak reasoning, exam technique, vocabulary, rushing, confidence, memory.
- **2.4 Socratic AI Tutor™** — modes: Teach me · Guide me · Question me · Challenge me · Revise with me ·
  Examine me · Explain my mistake · Help me start · Check my reasoning · Oral practice · Visual ·
  Real-world. Records reasoning, not just answers. *SHIPPED (tutor mode selector).* 
- **2.5 AI Whiteboard Classroom™** — step-by-step equations, diagrams, animations, photo interpretation,
  error highlighting, simulations; speak/type/draw/upload/stylus.
- **2.6 Adaptive Practice Engine™** — every question selected for a reason (mastery, errors, recency,
  confidence, weighting, forgetting, priority, speed, upcoming assessments); 12 question types.
  *Core shipped in SkillRush fact engine + adaptive quizzes.*
- **2.7 Verified Mastery™** — evidence across initial understanding, independent application, delayed
  recall, transfer, exam-style performance ("Mastered and verified — demonstrated across three
  assessments over 21 days").
- **2.8 Assignment Integrity Coach™** — authorship & learning-evidence system; Originality and
  Understanding Passport™.
- **2.9 Examination War Room™** — readiness score, topic risk, question exposure, time strategy,
  countdown, past-paper schedule, weakest-mark recovery, technique drills, sleep guidance, mocks,
  final-24h plan.
- **2.10 Focus & Study Environment Agent™** — focus modes, Pomodoro, verified study time, breaks,
  audio/offline. *Verified Study Hours™ proposition.*
- **2.11 Motivation without manipulation** — reward recovery, consistency, reasoning, improvement,
  retention — never raw engagement. *SHIPPED across SkillRush/achievements economy.*
- **2.12 Life, career & university readiness** — Future Readiness Score™ alongside academics.
  *Career Passport shipped; score formalisation pending.*

## 3 · Parent Academic Command Centre
- **3.1 Three-Minute Parent Brief™** — improved/declined/why/school actions/parent actions/don't-worry/
  intervention-needed. *SHIPPED (weekly briefing enhanced).* 
- **3.2 Parent Action Cards™** — ask this tonight · praise this · check this assignment · discuss this
  career · approve this intervention · contact teacher · book tutor · review balance · no action required.
  *SHIPPED.*
- **3.3 Family Learning Agreement™** — expectations, device windows, rewards, rest, check-ins — without
  surveillance. *Curfew/quiet-hours shipped; full agreement pending.*
- **3.4 Parent intervention approval** — reason, expected outcome, duration, cost, owner, review date,
  evidence. *Approval flow pending backend.*
- **3.5 Sibling & family dashboard** — one view, no inappropriate comparisons. *Multi-child shipped.*
- **3.6 Parent–school–tutor coordination room** — shared objective, actions, observations, evidence,
  close/escalate. *War room + shared records shipped; unified room pending.*

## 4 · School Teacher Copilot
- **4.1 Tomorrow's Teaching Brief™** — prerequisites mastered, likely strugglers, common misconceptions,
  groups, explanations, extension/quiet-support lists, SEND adaptations, starter, exit ticket. *SHIPPED.*
- **4.2 Live Classroom Intelligence™** — understanding signals, wrong answers, confidence, silent
  questions, participation; teacher controls AI interaction.
- **4.3 One-click differentiation** — foundation/core/advanced/SEND/EAL/dyslexia/visual/audio/
  reduced-language/challenge/homework/tutor versions; teacher approval retained.
- **4.4 Teacher Resource Studio** — all resources informed by the actual class mastery/misconception
  profile (the differentiator over generic generators). *Lesson builder + exam builder shipped, profile-
  informed via records.*
- **4.5 Assessment & feedback engine** — scan, rubric-mark, moderate, misconceptions, individual
  feedback, recovery activities, cohort comparison, teacher approval before release. Feedback must be
  actionable.
- **4.6 Workload Elimination Agent™** — reports, parent updates, formatting, seating, notes, tracking,
  documentation, cover, translation; measurable time returned. *Parent-update generator + exports shipped.*
- **4.7 Professional development coach** — supportive, never punitive; teacher controls sharing.

## 5 · Private Tutor Operating System
- **5.1 Business command centre** — onboarding→payments→evidence→leads. *Largely shipped.*
- **5.2 Pre-Session Intelligence Brief** — recap, work done/missed, school performance, forgotten
  concepts, objective, questions, resources, parent concerns, barriers. *SHIPPED.*
- **5.3 Post-session automation** — summary, evidence, gaps, homework, parent update, next plan; tutor
  approves before release.
- **5.4 Tutor Quality Passport™** — verified identity/qualifications/safeguarding/outcomes; ranked by
  verified learner impact adjusted for starting point — never by ratings or ad spend. *Marketplace +
  admin approval shipped; impact-adjusted ranking pending outcomes data.*
- **5.5 Intelligent matching** — gaps, style, language, SEND experience, compatibility, budget, outcomes
  with similar learners.
- **5.6 Tutor Scale Mode** — groups, bootcamps, masterclasses, cohorts, clinics; StudYear manages
  grouping, diagnostics, pathways, reporting.

## 6 · School Leadership Operating System
- **6.1 School Academic Digital Twin™** — simulate grade trajectories, attendance impact, interventions,
  staffing, coverage, risks, readiness; leaders ask what-if questions. *Shipped in outline (School Brain +
  benchmark + improvement engine); simulation Q&A pending backend.*
- **6.2 School Improvement Command Centre** — every red flag has owner, action, deadline, evidence,
  review date, escalation rule. *Improvement plan engine shipped; ownership workflow pending.*
- **6.3 Intervention Marketplace™** — approved interventions with eligibility, cost, participation,
  outcomes, cost-per-improvement, provider quality. *War room + LA programmes shipped; marketplace pending.*

*Every "pending" item slots into seams already built: the Learner record (record.js), the agents registry
(@studyear/shared), the E2EE data layer, the backend functions and the intake hub.*

- **6.4 Curriculum Assurance Engine** — compares intended vs taught vs assessed vs mastered curriculum;
  finds uncovered/repeated content, weak sequencing, assessment imbalance, missing prerequisites, cohort
  gaps, teacher-support needs. *Coverage intake shipped; full four-way comparison pending backend.*
- **6.5 Evidence & Inspection Room** — one-click packs: intent, implementation, outcomes, intervention
  impact, attendance actions, SEND adaptations, disadvantaged support, parent engagement, safeguarding,
  CPD, improvement progress — linked to source data with a full audit trail. *Evidence-pack exports +
  Ofsted upload shipped; source-linking pending.*
- **6.6 Education Financial Intelligence** — intervention budgets, pupil-level funding, tutoring spend,
  ACU consumption, cost per learner / per mastery gain / per attendance improvement, provider comparison,
  forecasting, alerts. *ACU command shipped; cost-per-outcome pending.*

## 7 · Local Authority Education Intelligence OS
- **7.1 Population-Level Education Observatory™** — privacy-controlled intelligence across schools,
  wards, neighbourhoods, age groups, subjects, vulnerable cohorts, attendance, exclusions, SEND demand,
  attainment, destinations, provision — risk visible before annual data confirms it. *LA console
  benchmarking shipped; geographic layers pending.*
- **7.2 Early Warning Radar™** — rising persistent absence, transition failure, subject decline, SEND
  assessment demand, unsuitable provision, post-16 dropout risk, tutoring shortages, digital exclusion,
  enrichment inequality, capacity pressure. **No serious action taken solely by an algorithm** — StudYear
  surfaces evidence, confidence levels and recommended human review.
- **7.3 Child Support Coordination Record** — for authorised cases: needs, provision, responsible teams,
  interventions, family engagement, school/provider actions, review dates, outcomes, escalations.
  Permissions granular, time-limited, fully audited. *Student record + access/audit engine is the seam.*
- **7.4 Provision & Capacity Planner** — forecast school places, alternative provision, SEND support,
  tutoring, specialist staff, transport, post-16 pathways, holiday programmes, family services; test
  scenarios before committing budgets.
- **7.5 Local Education Marketplace** — approved tutors, mentors, training, alternative provision,
  careers, enrichment, SEND specialists, holiday and youth programmes — evaluated on reach, quality,
  cost and verified impact.
- **7.6 Funding Impact Engine™** — track public investment from allocation to outcome: who received
  support, what was delivered, verified participation, what changed, cost, best providers, underserved
  groups, continue/expand/stop. *Turns StudYear into an education investment accountability platform;
  LA programmes/funding flows shipped as the seam.*

## 8 · Cross-Ecosystem Power Features
- **8.1 Universal Intervention Workflow™** — Detect → Verify → Prioritise → Assign → Deliver → Measure →
  Review → Close/Escalate, across academic gaps, attendance, assignments, exam readiness, tutoring,
  transition, careers, parent engagement. *War-room + records pipeline is the seam.*
- **8.2 Learner Passport™** — portable, consent-controlled continuity across organisations: verified
  achievements, mastery evidence, preferences, intervention history, accessibility needs, portfolio,
  career interests. Organisations see only role-minimum data. *E2EE record + Career Passport are the seams.*
- **8.3 Voice-first & multilingual** — voice/text/image/document/video/handwriting/audio; real-time
  translation of parent messages, explanations, reports, sessions, LA communications. Distinguish
  translating language from simplifying difficulty. *FR pack + read-aloud/voice shipped in SkillRush.*
- **8.4 Offline & low-bandwidth** — downloadable lessons, later sync, compressed media, audio-only,
  shared devices, printable QR resources, SMS reminders, device-free classroom assessment connected to
  the mastery graph. *PWA + printable sheets shipped as seams.*
- **8.5 Evidence Engine™** — every AI recommendation shows evidence used, confidence, reasoning summary,
  data freshness, alternatives, human-approval status and post-implementation outcome. No black boxes.
- **8.6 Human Authority Controls** — AI recommends; humans approve sensitive actions; teachers control
  teaching; parents control home permissions; schools control policy; authorities control statutory
  decisions; students can challenge their data; every major action auditable. **AI strengthens human
  education — it never replaces teachers, parents or professional judgement.**

## 9 · Safety, Privacy and Trust as Product Features
- **9.1 Child-Safe AI Gateway** — age-appropriate responses, harmful-content filtering, anti-grooming,
  restricted adult contact, safe search, escalation rules, crisis-language detection, no advertising to
  children, no sale of learner data, transparent AI-use logs. *Bot defences + AI usage logs shipped.*
- **9.2 Granular Consent Centre** — what data exists, why, who accesses it, for how long, which agents
  use it, how to revoke, how to correct. *Consent flags + record grants + E2EE shipped as the seams.*
- **9.3 Fairness & Bias Monitor** — continuous testing across gender, ethnicity, disability, language,
  socioeconomic status, school type, geography. **A low predicted grade must trigger support — never
  reduced expectations.** *Equity Engine shipped as the seam.*
- **9.4 Explainable predictions** — never "Dropout risk: High" alone; always the signals, the confidence
  and "teacher review required". *Learning-model confidence grades shipped in this spirit.*
