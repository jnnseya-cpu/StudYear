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
};

export type Persona = {
  slug: string;
  label: string;
  strap: string;
  /** matching per-category dashboard route under /dashboards/<slug>/ ('' = chooser) */
  dashboard: string;
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
    account: { name: 'Amara O.', detail: 'Year 11 · Student Premium' },
    plans: STUDENT_PLANS,
    modules: [
      { agent: AgentId.Planner, label: 'Study Planner', desc: 'A personalised plan in under 5 minutes — weak topics weighted heaviest.', tariff: 'study_planner' },
      { agent: AgentId.Tutor, label: 'AI Tutor', desc: 'Homework & exam help, 24/7. Teaches the method, never just the answer.', tariff: 'homework_help' },
      { agent: AgentId.Examiner, label: 'Academic Diagnostic', desc: 'Find exactly what you know, forget and need next.', tariff: 'academic_diagnostic' },
      { agent: AgentId.ContentForge, label: 'Resource Maker', desc: 'Flashcards, quizzes, notes, mindmaps — generated or your own.', tariff: 'flashcards' },
      { agent: AgentId.Examiner, label: 'Predicted Grade', desc: 'Live grade trajectory with confidence band vs your target.', tariff: 'predicted_grade' },
      { agent: AgentId.Motivation, label: 'Streaks & Points', desc: 'Momentum you can see — streaks, points, mastery per subject.' },
    ],
  },
  {
    slug: 'parent',
    label: 'Parent',
    strap: 'Clarity without micromanaging.',
    dashboard: 'parent',
    account: { name: 'Mrs. Okafor', detail: '3 children linked · Parent Pro' },
    plans: PARENT_PLANS,
    modules: [
      { agent: AgentId.FamilyDigest, label: 'Family Digest', desc: 'Weekly plain-English summary of every child’s momentum.' },
      { agent: AgentId.EarlyWarning, label: 'Risk Alerts', desc: 'Alerts fire before grades collapse — not after.' },
      { agent: AgentId.Escalation, label: 'Book Support', desc: 'One tap from an alert to a vetted tutor session.', tariff: 'tutor_session_short' },
      { agent: AgentId.Reporting, label: 'Progress Reports', desc: 'The same mastery record their teachers see.', tariff: 'diagnostic_results' },
    ],
  },
  {
    slug: 'teacher',
    label: 'Teacher',
    strap: 'Intervene weeks before mocks.',
    dashboard: 'teacher',
    account: { name: 'Mr. Hughes', detail: 'Chemistry · Yr 11 Set 2 · 28 students' },
    modules: [
      { agent: AgentId.ClassCockpit, label: 'Class Cockpit', desc: 'Mastery heatmap: students × spec topics, flagged at-risk.' },
      { agent: AgentId.Assignment, label: 'Assignment Review', desc: 'AI pre-marks against the mark scheme; you approve.', tariff: 'assignment_review' },
      { agent: AgentId.ContentForge, label: 'Lesson Content', desc: 'Interactive lessons and quizzes aligned to your board.', tariff: 'interactive_lesson' },
      { agent: AgentId.Reporting, label: 'Parent Reporting', desc: 'Evidence-backed reports generated, not typed.' },
    ],
  },
  {
    slug: 'school',
    label: 'School',
    strap: 'Whole-cohort intelligence.',
    dashboard: 'school',
    account: { name: 'Elmwood High', detail: 'Medium School · 412 seats' },
    plans: SCHOOL_PLANS,
    modules: [
      { agent: AgentId.CohortAnalytics, label: 'Cohort Health Map', desc: 'Predicted vs target by department, year and class.' },
      { agent: AgentId.EarlyWarning, label: 'Early-Warning Board', desc: 'Every at-risk student, ranked by intervention urgency.' },
      { agent: AgentId.Taxonomy, label: 'Curriculum Coverage', desc: 'Spec coverage and pace across every teaching group.' },
      { agent: AgentId.FraudBillingOps, label: 'Shared ACU Pool', desc: 'One pool, per-department allocations, zero surprise bills.' },
    ],
  },
  {
    slug: 'tutor',
    label: 'Tutor',
    strap: 'Teach more, admin less.',
    dashboard: 'tutor',
    account: { name: 'Daniel K.', detail: 'Maths & Physics · DBS verified' },
    modules: [
      { agent: AgentId.MarketplaceMatch, label: 'Get Booked', desc: 'Publish availability & offerings; matched to demand.' },
      { agent: AgentId.SessionPrep, label: 'Session Prep', desc: 'Arrive knowing exactly what the student got wrong last week.', tariff: 'paper_analysis' },
      { agent: AgentId.TutorWorkspace, label: 'Tutor Workspace', desc: 'Notes, consent-scoped mastery views, session history.' },
      { agent: AgentId.Reporting, label: 'Earnings', desc: 'Pipeline, payouts and repeat-booking analytics.' },
    ],
  },
  {
    slug: 'admin',
    label: 'Admin',
    strap: 'Run the platform, end to end.',
    dashboard: '',
    account: { name: 'Platform Ops', detail: 'Internal · least-privilege' },
    modules: [
      { agent: AgentId.FraudBillingOps, label: 'Billing Ops', desc: 'Wallets, invoices, refunds and payment operations.' },
      { agent: AgentId.Moderation, label: 'Moderation', desc: 'Content and marketplace safety queues.' },
      { agent: AgentId.ContentVerification, label: 'Content Verification', desc: 'Board-alignment checks on generated material.' },
      { agent: AgentId.Integrity, label: 'Integrity', desc: 'Academic-integrity signals across submissions.' },
    ],
  },
];

export const CONSOLE_SLUGS = PERSONAS.map((p) => p.slug);
