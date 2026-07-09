import { AgentId, PARENT_PLANS, SCHOOL_PLANS, STUDENT_PLANS, type MeteredActivity, type Plan } from '@studyear/shared';

/**
 * Per-category account/console definitions. Each console slug is its own
 * statically-exported route under /app/<slug>/ — accounts and dashboards are
 * fully separated per user category.
 */

export type Module = {
  agent: AgentId;
  label: string;
  desc: string;
  tariff?: MeteredActivity;
  /** deep-link (relative to BASE) to the real tool this module launches */
  href?: string;
};

export type Persona = {
  slug: string;
  label: string;
  strap: string;
  /** matching per-category dashboard route under /dashboards/<slug>/ ('' = chooser) */
  dashboard: string;
  /** the real functional workspace/console for this category (relative to BASE);
   *  this is where the primary "open" CTA sends the account, not the analytics-only dashboard */
  workspace?: string;
  /** label for the primary workspace CTA (defaults to "Open my <label> dashboard") */
  workspaceCta?: string;
  /** demo signed-in identity, until Firebase auth lands */
  account: { name: string; detail: string };
  modules: Module[];
  plans?: Plan[];
};

export const PERSONAS: Persona[] = [
  {
    slug: 'student',
    label: 'Student',
    strap: 'Study smarter, not harder.',
    dashboard: 'student',
    workspace: 'study',
    workspaceCta: 'Open my study workspace',
    account: { name: 'Amara O.', detail: 'Year 11 · Student Premium' },
    plans: STUDENT_PLANS,
    modules: [
      { agent: AgentId.Examiner, label: 'Academic Diagnostic', desc: 'Start here — your compulsory baseline right after your profile. Finds exactly what you know, forget and need next.', tariff: 'academic_diagnostic', href: 'study/#diag' },
      { agent: AgentId.Examiner, label: 'Diagnostic Results', desc: 'Your baseline per subject — the point every StudYear tool personalises from.', tariff: 'diagnostic_results', href: 'study/#diag-results' },
      { agent: AgentId.Planner, label: 'Personal Recovery Plan', desc: 'Built from your diagnostic — the exact sessions that close your gaps.', href: 'study/#recovery' },
      { agent: AgentId.Planner, label: 'Study Planner', desc: 'A personalised plan in under 5 minutes — weak topics weighted heaviest.', tariff: 'study_planner', href: 'study/' },
      { agent: AgentId.Tutor, label: 'AI Tutor', desc: 'Homework & exam help, 24/7. Teaches the method, never just the answer.', tariff: 'homework_help', href: 'study/' },
      { agent: AgentId.ContentForge, label: 'Resource Maker', desc: 'Flashcards, quizzes, notes, mindmaps — generated or your own.', tariff: 'flashcards', href: 'study/' },
      { agent: AgentId.Examiner, label: 'Predicted Grade', desc: 'Live grade trajectory with confidence band vs your target.', tariff: 'predicted_grade', href: 'dashboards/student/' },
      { agent: AgentId.Motivation, label: 'Streaks & Points', desc: 'Momentum you can see — streaks, points, mastery per subject.', href: 'account/achievements/' },
      { agent: AgentId.Tutor, label: 'Live Classroom', desc: 'Join a live video lesson when your teacher or tutor invites you.', href: 'live/' },
      { agent: AgentId.Planner, label: 'Career Passport', desc: 'Career Pathway AI — university, apprenticeships and local routes matched to you, from Year 5.', href: 'career/' },
      { agent: AgentId.Motivation, label: 'SkillRush™', desc: 'The 5-minute daily fluency workout — coins, XP, streaks and class leagues.', href: 'skillrush/' },
    ],
  },
  {
    slug: 'parent',
    label: 'Parent',
    strap: 'Clarity without micromanaging.',
    dashboard: 'parent',
    workspace: 'parent',
    workspaceCta: 'Open my Parent Command Centre',
    account: { name: 'Mrs. Okafor', detail: '3 children linked · Parent Pro' },
    plans: PARENT_PLANS,
    modules: [
      { agent: AgentId.FamilyDigest, label: 'Family Digest', desc: 'Weekly plain-English summary of every child’s momentum.', href: 'parent/' },
      { agent: AgentId.EarlyWarning, label: 'Risk Alerts', desc: 'Alerts fire before grades collapse — not after.', href: 'parent/' },
      { agent: AgentId.Escalation, label: 'Book Support', desc: 'One tap from an alert to a vetted tutor session.', tariff: 'tutor_session_short', href: 'tutors/' },
      { agent: AgentId.Reporting, label: 'Progress Reports', desc: 'The same mastery record their teachers see.', tariff: 'diagnostic_results', href: 'parent/' },
    ],
  },
  {
    slug: 'teacher',
    label: 'Teacher',
    strap: 'Intervene weeks before mocks.',
    dashboard: 'teacher',
    workspace: 'teacher',
    workspaceCta: 'Open my Teacher Command Centre',
    account: { name: 'Mr. Hughes', detail: 'Chemistry · Yr 11 Set 2 · 28 students' },
    modules: [
      { agent: AgentId.ClassCockpit, label: 'Take the Register', desc: 'Mark present, late, authorised or absent — feeds attendance recovery.', href: 'teacher/attendance/' },
      { agent: AgentId.ClassCockpit, label: 'Class Cockpit', desc: 'Mastery heatmap: students × spec topics, flagged at-risk.', href: 'teacher/analytics/' },
      { agent: AgentId.Assignment, label: 'Assignment Review', desc: 'AI pre-marks against the mark scheme; you approve.', tariff: 'assignment_review', href: 'teacher/assignments/' },
      { agent: AgentId.ContentForge, label: 'Lesson Content', desc: 'Interactive lessons and quizzes aligned to your board.', tariff: 'interactive_lesson', href: 'teacher/lessonbuilder/' },
      { agent: AgentId.ContentForge, label: 'Teach Live', desc: 'Start a live video lesson and brief at-risk learners.', href: 'teacher/classroom/' },
      { agent: AgentId.Reporting, label: 'Parent Reporting', desc: 'Evidence-backed reports generated, not typed.', href: 'teacher/communications/' },
    ],
  },
  {
    slug: 'school',
    label: 'School',
    strap: 'Whole-cohort intelligence.',
    dashboard: 'school',
    workspace: 'school',
    workspaceCta: 'Open my School Command Centre',
    account: { name: 'Elmwood High', detail: 'Medium School · 412 seats' },
    plans: SCHOOL_PLANS,
    modules: [
      { agent: AgentId.CohortAnalytics, label: 'Cohort Health Map', desc: 'Predicted vs target by department, year and class.', href: 'school/' },
      { agent: AgentId.EarlyWarning, label: 'Early-Warning Board', desc: 'Every at-risk student, ranked by intervention urgency.', href: 'school/' },
      { agent: AgentId.Taxonomy, label: 'Curriculum Coverage', desc: 'Spec coverage and pace across every teaching group.', href: 'school/' },
      { agent: AgentId.FraudBillingOps, label: 'Shared ACU Pool', desc: 'One pool, per-department allocations, zero surprise bills.', href: 'school/settings/' },
    ],
  },
  {
    slug: 'tutor',
    label: 'Tutor',
    strap: 'Teach more, admin less.',
    dashboard: 'tutor',
    workspace: 'tutor',
    workspaceCta: 'Open my Tutor Command Centre',
    account: { name: 'Daniel K.', detail: 'Maths & Physics · DBS verified' },
    modules: [
      { agent: AgentId.MarketplaceMatch, label: 'Get Booked', desc: 'Publish availability & offerings; matched to demand.', href: 'tutor/pipeline/' },
      { agent: AgentId.SessionPrep, label: 'Session Prep', desc: 'Arrive knowing exactly what the student got wrong last week.', tariff: 'paper_analysis', href: 'tutor/assistant/' },
      { agent: AgentId.TutorWorkspace, label: 'Tutor Workspace', desc: 'Notes, consent-scoped mastery views, session history.', href: 'tutor/' },
      { agent: AgentId.Reporting, label: 'Earnings', desc: 'Pipeline, payouts and repeat-booking analytics.', href: 'tutor/earnings/' },
    ],
  },
  {
    slug: 'admin',
    label: 'Admin',
    strap: 'Run the platform, end to end.',
    dashboard: '',
    workspace: 'admin',
    workspaceCta: 'Open the Admin Console',
    account: { name: 'Platform Ops', detail: 'Internal · least-privilege' },
    modules: [
      { agent: AgentId.FraudBillingOps, label: 'Billing Ops', desc: 'Wallets, invoices, refunds and payment operations.', href: 'admin/' },
      { agent: AgentId.Moderation, label: 'Moderation', desc: 'Content and marketplace safety queues.', href: 'admin/' },
      { agent: AgentId.ContentVerification, label: 'Content Verification', desc: 'Board-alignment checks on generated material.', href: 'admin/' },
      { agent: AgentId.Integrity, label: 'Integrity', desc: 'Academic-integrity signals across submissions.', href: 'admin/' },
    ],
  },
];

export const CONSOLE_SLUGS = PERSONAS.map((p) => p.slug);
