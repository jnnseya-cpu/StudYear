/**
 * @studyear/shared — the single source of truth for cross-surface contracts.
 * Every value here traces to docs/ (see docs/REQUIREMENTS-MANDATE.md):
 *  - ACU tariff & plans  → docs/product/commercial-model.md
 *  - margin band         → commercial-model §1 (66%–100%, resolved directive)
 *  - roles / personas    → docs/architecture/10, product spec §4
 *  - agent registry      → docs/product/studyear-ai-os-venture-brief.md §4
 */

// ---------------------------------------------------------------- roles ----
export const ROLES = [
  'student',
  'parent',
  'teacher',
  'school_admin',
  'tutor',
  'platform_admin',
] as const;
export type Role = (typeof ROLES)[number];

// ------------------------------------------------------ study levels -------
/**
 * UK-wide study levels — the controlled vocabulary every surface lists
 * (docs/architecture/12-reference-data.md). Covers England/Wales/NI and
 * Scottish qualifications plus IB, BTEC and open categories.
 */
export const STUDY_LEVELS = [
  'Primary School',
  'Years 7-9 (KS3)',
  'GCSE',
  'IGCSE',
  'National 5',
  'BTEC National',
  'AS',
  'A2/A-level',
  'Scottish Highers',
  'Scottish Advanced Highers',
  'International Baccalaureate',
  'University',
  'Fun',
  'Other',
  'All Levels',
] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];

/** UK-wide subject list — union of the provided catalogue and existing platform subjects. */
export const SUBJECTS = [
  'Accounting',
  'Biology',
  'Business Studies',
  'Chemistry',
  'Computer Science',
  'Computing',
  'Economics',
  'English',
  'English Language',
  'English Literature',
  'French',
  'Fun',
  'Geography',
  'Government & Politics',
  'Health & Social Care',
  'History',
  'ICT',
  'Law',
  'Mathematics',
  'Media Studies',
  'Music',
  'Other',
  'Philosophy',
  'Physical Education',
  'Physics',
  'Psychology',
  'Religious Studies',
  'Science',
  'Sociology',
  'Spanish',
] as const;
export type Subject = (typeof SUBJECTS)[number];

/** Exam boards served UK-wide (incl. NI's CCEA, Scotland's SQA, and international CIE). */
export const EXAM_BOARDS = ['AQA', 'CCEA', 'CIE', 'Edexcel', 'ICAAE', 'OCR', 'SQA', 'WJEC', 'Other'] as const;
export type ExamBoard = (typeof EXAM_BOARDS)[number];

/** Curriculum topic taxonomy — the provided catalogue, searchable across resources. */
export const TOPICS = [
  'America - 19th and 20th century',
  'An Inspector Calls',
  'Approaches',
  'Attachment',
  'Biological molecules, organic chemistry and biochemistry',
  'British monarchy - Tudors and Stuarts',
  'Case studies',
  'Cells, tissues and organs',
  'Cellular processes and structure',
  'Christianity',
  'Crime and deviance',
  'Criminal law',
  'DNA, genetics and evolution',
  'Education',
  'Energy',
  'Ethics',
  'Families and households',
  'Grammar and vocabulary',
  'Human, animal and plant physiology',
  'Medicine through time (OCR History A)',
  'Memory',
  'Modern Britain - 19th century onwards',
  'Natural hazards',
  'Philosophy',
  'Religion and beliefs',
  'Research methods and techniques',
  'Russia - 19th and 20th century',
  'The Cold War',
  'WWII and Nazi Germany 1939-1945',
] as const;
export type Topic = (typeof TOPICS)[number];

/** Resource types — the provided catalogue; every type is searchable and creatable. */
export const RESOURCE_TYPES = [
  'Advantages and disadvantages table',
  'Audio',
  'Causes and effects table',
  'Character analysis',
  'Compare and contrast table',
  'Crossword',
  'Document',
  'Flashcards',
  'Grid',
  'Image',
  'Mindmap',
  'Multi-tool',
  'Other',
  'Presentation',
  'Quiz',
  'Quizsearch',
  'Revision Cards',
  'Revision Notes',
  'SWOT analysis',
  'Spreadsheet',
  'Timeline',
  'Video',
  'Web Page',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

// ------------------------------------------------------- agent registry ----
/** SY-A01..A21 — stable IDs referenced in tickets, billing events and audit logs. */
export enum AgentId {
  Planner = 'SY-A01',
  Tutor = 'SY-A02',
  ContentForge = 'SY-A03',
  Examiner = 'SY-A04',
  Motivation = 'SY-A05',
  ClassCockpit = 'SY-A06',
  Assignment = 'SY-A07',
  Reporting = 'SY-A08',
  CohortAnalytics = 'SY-A09',
  EarlyWarning = 'SY-A10',
  FamilyDigest = 'SY-A11',
  Escalation = 'SY-A12',
  TutorWorkspace = 'SY-A13',
  SessionPrep = 'SY-A14',
  MarketplaceMatch = 'SY-A15',
  Moderation = 'SY-A16',
  ContentVerification = 'SY-A17',
  Taxonomy = 'SY-A18',
  Integrity = 'SY-A19',
  FraudBillingOps = 'SY-A20',
  Profile = 'SY-A21',
}

// ------------------------------------------------------------ ACU economy ----
/** £1 = 100 ACUs (commercial-model §1). */
export const ACU_PER_POUND = 100;

/**
 * Margin band (final, resolved): every paid product operates inside 66%–100% margin.
 * Cost trigger: act when variable cost exceeds 34% of realised revenue.
 */
export const MARGIN = {
  FLOOR: 0.66,
  CEILING: 1.0,
  /** provider inference + payment fees + hosting allocation, as share of revenue */
  COST_TRIGGER: 0.34,
} as const;

/** Stripe UK card fee model (commercial-model, market anchor). */
export const STRIPE_UK_FEE = { percent: 0.015, fixedPence: 20 } as const;

/** ACU cost per activity — commercial-model §5 (19 metered activities). */
export const ACU_TARIFF = {
  quick_explanation: 5,
  homework_help: 8,
  tutor_session_short: 15,
  tutor_session_deep: 25,
  quiz_generation: 10,
  flashcards: 12,
  topic_summary: 12,
  formula_sheet: 15,
  mind_map: 18,
  study_planner: 20,
  academic_diagnostic: 25,
  diagnostic_results: 15,
  recovery_plan: 25,
  interactive_lesson: 25,
  course_generator: 15, // owner ruling 2026-07: 15 ACUs per course, no premium plan required
  predicted_grade: 20,
  assignment_review: 60,
  paper_analysis: 50,
  visual_tools: 40,
} as const;
export type MeteredActivity = keyof typeof ACU_TARIFF;

// ---------------------------------------------------------------- plans ----
export interface Plan {
  id: string;
  audience: Role | 'school';
  label: string;
  monthlyPence: number;
  acus: number;
  positioning?: string;
}

/** Student plans — commercial-model §2 (monthly only). */
export const STUDENT_PLANS: Plan[] = [
  { id: 'child_free', audience: 'student', label: 'Child Free', monthlyPence: 0, acus: 100, positioning: 'Start learning safely.' }, // 100 ACUs per MONTH (Child Free only — never added to paid plans)
  { id: 'student_access', audience: 'student', label: 'Student Access', monthlyPence: 500, acus: 500, positioning: 'A full week of AI-supported study.' },
  { id: 'student_premium', audience: 'student', label: 'Student Premium', monthlyPence: 1000, acus: 700, positioning: 'Unlock every premium learning tool.' },
  { id: 'student_premium_plus', audience: 'student', label: 'Student Premium+', monthlyPence: 2000, acus: 1650, positioning: 'Built for serious exam terms.' },
  { id: 'student_max', audience: 'student', label: 'Student Max', monthlyPence: 3000, acus: 2750, positioning: 'For students who use StudYear daily.' },
];

/** Parent plans — commercial-model §3. */
export const PARENT_PLANS: Plan[] = [
  { id: 'parent_view', audience: 'parent', label: 'Parent View', monthlyPence: 500, acus: 300 },
  { id: 'parent_pro', audience: 'parent', label: 'Parent Pro', monthlyPence: 1000, acus: 700 },
  { id: 'parent_pro_plus', audience: 'parent', label: 'Parent Pro+', monthlyPence: 2000, acus: 1650 },
  { id: 'parent_elite', audience: 'parent', label: 'Parent Elite', monthlyPence: 3900, acus: 3900 },
];

/** School plans + extra bundles — commercial-model §10. */
export const SCHOOL_PLANS: Plan[] = [
  { id: 'school_small', audience: 'school', label: 'Small School', monthlyPence: 9900, acus: 10_000 },
  { id: 'school_medium', audience: 'school', label: 'Medium School', monthlyPence: 19_900, acus: 22_000 },
  { id: 'school_large', audience: 'school', label: 'Large School', monthlyPence: 39_900, acus: 48_000 },
];

/** ACU top-ups — commercial-model §4. */
export const TOPUPS = [
  // Packs are deliberately ~85–90 ACUs/£ — BELOW every plan's per-pound value,
  // so subscriptions are always the best deal and packs are the flexible top-up.
  { id: 'mini_boost', pence: 300, acus: 250 },
  { id: 'core_boost', pence: 500, acus: 450 },
  { id: 'growth_boost', pence: 1000, acus: 900 },
  { id: 'exam_boost', pence: 2000, acus: 1800 },
  { id: 'power_boost', pence: 3000, acus: 2600 },
] as const;

// ------------------------------------------------------------ free tier ----
/** Free-plan rules — commercial-model §6 (incl. resolved directive: no tutor access). */
export const FREE_TIER = {
  /** owner ruling 2026-07: Child Free grants 100 ACUs every month (this plan only — not stacked on paid subscriptions) */
  acusPerMonth: 100,
  rolloverDays: 90,
  tutorMarketplaceAccess: false, // free accounts can never book tutors / receive tutor-triggered AI
  assignmentReview: false,
  cashOut: false,
  onePerVerifiedParentOrDevice: true,
} as const;

// --------------------------------------------------- growth & discounts ----
/** Growth Partner Programme (operative) — growth-partner-programme.md. */
export const REFERRAL = {
  rewardAcus: 250,
  minReferredSpendPence: 1000, // £10
  validAfterDays: 14, // payment must clear and remain valid
  welcomeAcus: 100,
  monthlyCapAcus: 1000,
} as const;

export const INFLUENCER = {
  lifetimeCommissionRate: 0.01, // 1% of net eligible revenue
  monthlyCapPence: 1_000_000, // £10,000
  perCustomerLifetimeCapPence: 2_000_000, // £20,000
} as const;

/** ACU expiry rules — commercial-model §11. */
export const ACU_EXPIRY_DAYS = { bonus: 60, referral: 90, free: 90 } as const;

/** Admin discount codes — commercial-model §12b. */
export interface DiscountCode {
  code: string;
  benefit:
    | { type: 'percent_off'; value: number }
    | { type: 'fixed_off_pence'; value: number }
    | { type: 'bonus_acus'; value: number }
    | { type: 'free_period'; planId: string; days: number }
    | { type: 'plan_upgrade'; planId: string };
  startsAt: string; // ISO
  endsAt: string;
  maxRedemptions: number;
  perUserLimit: number;
  eligibleAudiences: Role[];
  eligibleProductIds: string[] | 'all';
  newUsersOnly: boolean;
  minSpendPence?: number;
  status: 'draft' | 'active' | 'paused' | 'exhausted' | 'expired';
}

// -------------------------------------------------------------- tenancy ----
/** Sub-domain per tenant: schoolname.studyear.com (architecture/13 §0). */
export interface Tenant {
  id: string;
  type: 'school' | 'district' | 'tutoring_company' | 'platform';
  subdomain: string;
  sharedAcuPool?: { balance: number; allocations: Record<string, number> };
}

/** Consent is the hard gate on every cross-persona data view (venture brief §7/§10). */
export interface ConsentGrant {
  id: string;
  grantorUserId: string; // parent/guardian or adult student
  granteeUserId: string; // e.g. tutor
  studentUserId: string;
  scope: 'mastery_view' | 'diagnostic_view' | 'progress_view';
  revocable: true;
  expiresAt?: string;
}

// ------------------------------------------------------- end-to-end crypto ----
/** E2EE envelope — the ONLY shape the sync backend accepts for personal data.
 *  Sealed client-side with the account's data key (XSalsa20-Poly1305);
 *  the data key itself travels only wrapped by a password-derived key. */
export interface E2EEnvelope {
  __e2e: 1;
  v: 1;
  n: string; // base64 nonce (24 bytes)
  c: string; // base64 ciphertext+tag
}

/** Account key record as synced: NO device wrap, ever. */
export interface E2EKeyRecord {
  v: 1;
  salt: string;           // base64 PBKDF2 salt (16 bytes)
  wrapPw: { n: string; c: string }; // data key wrapped by PBKDF2(password, salt)
}

export const E2E = {
  VERSION: 1 as const,
  KDF: 'PBKDF2-SHA256' as const,
  KDF_ITERATIONS: 150000,
  CIPHER: 'XSalsa20-Poly1305' as const,
} as const;

export function isE2EEnvelope(v: unknown): v is E2EEnvelope {
  return !!v && typeof v === 'object' && (v as E2EEnvelope).__e2e === 1
    && typeof (v as E2EEnvelope).n === 'string' && typeof (v as E2EEnvelope).c === 'string';
}

/* ---------------- Growth Partner Programme (owner terms, 2026-07-15) ------
   Open to every user via individual signup (/partners/). Tier is set by
   TOTAL followers across all social platforms (YouTube included):
   - partner_1pct   : ≥10,000 followers → 1% of referred customers' spending,
                      lifetime, capped at £20,000 income per referred user
   - partner_quarter: 5,000–9,999 followers → 0.25% on the same terms
   - referrer       : everyone else → 250 ACUs per new customer who signs up
                      with their code (validity rules per commercial model) */
export const PARTNER_PROGRAMME = {
  TIERS: [
    { id: 'partner_1pct', minFollowers: 10000, commissionPct: 1 },
    { id: 'partner_quarter', minFollowers: 5000, commissionPct: 0.25 },
    { id: 'referrer', minFollowers: 0, referralAcus: 250 },
  ],
  LIFETIME_CAP_GBP_PER_REFERRED_USER: 20000,
} as const;

export function partnerTier(followers: number) {
  return PARTNER_PROGRAMME.TIERS.find((t) => followers >= t.minFollowers)!;
}
