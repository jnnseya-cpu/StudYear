'use client';

import { useEffect, useState } from 'react';
import { SUBJECTS, TOPICS, RESOURCE_TYPES, STUDY_LEVELS, REFERRAL, INFLUENCER } from '@studyear/shared';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type Session = { name: string; email: string; role: string };

const SECTIONS = [
  ['dashboard', 'Dashboard', '⌂'],
  ['users', 'Users', '👥'],
  ['tutor-applications', 'Tutor applications', '🎓'],
  ['blog', 'Blog', '✍️'],
  ['content', 'Content', '📚'],
  ['revenue', 'Revenue & billing', '💷'],
  ['ai-costs', 'AI costs', '⚡'],
  ['analytics', 'Analytics', '📈'],
  ['fraud', 'Fraud', '🛡'],
  ['support', 'Support', '🎧'],
  ['inbox', 'Contact inbox', '✉️'],
  ['settings', 'Settings', '⚙️'],
] as const;
type SectionId = (typeof SECTIONS)[number][0];

/** Dashboard management cards — as-is from the production admin, each routed to its sidebar section. */
const MANAGE_CARDS: { title: string; desc: string; to: SectionId }[] = [
  { title: 'User Management', desc: 'View, edit, and manage user wallets and roles.', to: 'users' },
  { title: 'Tutor Management', desc: 'Review tutor applications and manage tutor profiles.', to: 'tutor-applications' },
  { title: 'School Management', desc: 'Review and approve new school partner accounts.', to: 'users' },
  { title: 'Support Tools', desc: "Access support features like 'View as User' to assist customers.", to: 'support' },
  { title: 'Contact inbox & email test', desc: 'View contact form messages and send a test email.', to: 'inbox' },
  { title: 'Blog', desc: 'Create posts, publish to the public site, and view read counts.', to: 'blog' },
  { title: 'Content Management', desc: 'Manage subjects, topics, and moderate generated content.', to: 'content' },
  { title: 'Growth Partner Programme', desc: 'Approve influencers, review referrals, and monitor commission caps.', to: 'revenue' },
  { title: 'Revenue & billing', desc: 'Stripe gross, payments, discount codes, and ACU ledger.', to: 'revenue' },
  { title: 'Analytics & Reporting', desc: 'View generation volumes and student engagement metrics.', to: 'analytics' },
  { title: 'System & AI Settings', desc: 'Control AI rate limits, feature flags, and other global settings.', to: 'settings' },
  { title: 'Fraud Monitoring', desc: 'Review accounts flagged for suspicious activity.', to: 'fraud' },
];

const ROLE_OPTIONS = ['STUDENT', 'PARENT', 'PRIVATE_TUTOR', 'SCHOOL_ADMIN', 'SCHOOL_TUTOR', 'TEACHER', 'ADMIN'];
const SUB_OPTIONS = ['Child Free', 'Student Access', 'Student Premium', 'Student Premium+', 'Student Max',
  'Parent View', 'Parent Pro', 'Parent Pro+', 'Parent Elite', 'School staff', 'Admin'];

type AdminUser = { name: string; email: string; role: string; sub: string; acus: number; parent?: string; school?: string };

/**
 * Mirrors the production user base's shape (roles, subscriptions, test fixtures) with
 * personal emails MASKED — this preview ships in a public static bundle, so real
 * customer addresses stay in the secure backend admin only (see repo policy: no PII).
 */
const USERS_SEED: AdminUser[] = [
  { name: 'L_mams', email: 'l_m***@yahoo.co.uk', role: 'PARENT', sub: 'Child Free', acus: 100 },
  { name: 'M Ahmar', email: 'ahm***@gmail.com', role: 'STUDENT', sub: 'Student Premium', acus: 700 },
  { name: 'p.e.leguzo', email: 'p.e***@gmail.com', role: 'STUDENT', sub: 'Child Free', acus: 100 },
  { name: 'stephan.ph', email: 'st.***@gmail.com', role: 'STUDENT', sub: 'Child Free', acus: 100 },
  { name: 'malgos_m', email: 'mal***@yahoo.ca', role: 'STUDENT', sub: 'Child Free', acus: 100 },
  { name: 'newprivateteacher', email: 'new***@gmail.com', role: 'PRIVATE_TUTOR', sub: 'Child Free', acus: 0 },
  { name: 'N/A', email: 'test.schooladmin@local.test', role: 'SCHOOL_ADMIN', sub: 'Child Free', acus: 0 },
  { name: 'l.a.tate', email: 'l.a***@gmail.com', role: 'STUDENT', sub: 'Child Free', acus: 100 },
  { name: 'yassine-ysm', email: 'yas***@hotmail.com', role: 'STUDENT', sub: 'Child Free', acus: 100 },
  { name: 'Joden N Ngolu', email: 'jod***@gmail.com', role: 'STUDENT', sub: 'Student Premium+', acus: 1650 },
  { name: 'dnelson', email: 'dne***@laurelstreetres.com', role: 'STUDENT', sub: 'Child Free', acus: 100 },
  { name: 'Jessie Odia', email: 'jes***@gmail.com', role: 'STUDENT', sub: 'Student Premium+', acus: 1650 },
  { name: 'N/A', email: 'private.tutor@local.test', role: 'PRIVATE_TUTOR', sub: 'Child Free', acus: 0 },
  { name: 'Olga Malafu', email: 'mal***@gmail.com', role: 'STUDENT', sub: 'Student Max', acus: 2750 },
  { name: 'Justin NSEYA', email: 'jnn***@gmail.com', role: 'PARENT', sub: 'Parent Elite', acus: 3900 },
  { name: 'Joden Nseya', email: 'jod***@gmail.com', role: 'STUDENT', sub: 'Student Premium+', acus: 1650 },
  { name: 'glorygracia', email: 'glo***@yahoo.fr', role: 'PARENT', sub: 'Child Free', acus: 100 },
  { name: 'Tutor', email: 'test.tutor@local.test', role: 'PRIVATE_TUTOR', sub: 'Child Free', acus: 0 },
  { name: 'promie43slaying', email: 'pro***@gmail.com', role: 'STUDENT', sub: 'Student Premium', acus: 700 },
  { name: 'dee', email: 'kda***@gmail.com', role: 'STUDENT', sub: 'Student Premium', acus: 700 },
  { name: 'Joshua N', email: 'mis***@gmail.com', role: 'STUDENT', sub: 'Student Premium+', acus: 1650 },
  { name: 'Paul KOKO (New Student Test)', email: 'testnewstudent@***', role: 'SCHOOL_TUTOR', sub: 'School staff', acus: 0 },
  { name: 'newschooltesting', email: 'new***@gmail.com', role: 'SCHOOL_ADMIN', sub: 'Child Free', acus: 0 },
  { name: 'Newparent-test', email: 'Newparent-test@***', role: 'PARENT', sub: 'Parent Pro+', acus: 1650 },
  { name: 'Platform Admin (test)', email: 'admin@studyear.com', role: 'ADMIN', sub: 'Admin', acus: 0 },
  { name: 'salomon_lutumba', email: 'sal***@yahoo.co.uk', role: 'PARENT', sub: 'Parent Elite', acus: 3900 },
  { name: 'jnbankwa', email: 'jnb***@gmail.com', role: 'STUDENT', sub: 'Child Free', acus: 100 },
  { name: 'schoolteacher', email: 'schoolteacher@***', role: 'SCHOOL_TUTOR', sub: 'Child Free', acus: 0 },
  { name: 'StudYear Admin', email: 'admin@revisionrocket.com', role: 'admin', sub: 'Child Free', acus: 0 },
  { name: 'Mark Harris', email: 'test.student@local.test', role: 'STUDENT', sub: 'Student Premium+', acus: 1650 },
  { name: 'N/A', email: 'test.parent@local.test', role: 'PARENT', sub: 'Parent Pro+', acus: 1650 },
  { name: 'N/A', email: 'test.teacher@local.test', role: 'SCHOOL_TUTOR', sub: 'Child Free', acus: 0 },
  { name: 'Naomie Test Account', email: 'nao***@gmail.com', role: 'STUDENT', sub: 'Student Premium+', acus: 1650 },
];

type TutorApp = { name: string; email: string; subjects: string; rate: string; fee: string; status: 'Pending' | 'Approved' | 'Rejected' };
const APPS_SEED: TutorApp[] = [
  { name: 'newprivateteacher', email: 'newprivateteacher@gmail.com', subjects: '—', rate: '£32/hr', fee: 'Unpaid', status: 'Approved' },
  { name: 'N/A', email: 'private.tutor@local.test', subjects: 'GCSE Math · Math', rate: '£32/hr', fee: 'Unpaid', status: 'Approved' },
  { name: 'Tutor', email: 'test.tutor@local.test', subjects: 'Full Stack Developer · physics', rate: '£32/hr', fee: 'Unpaid', status: 'Approved' },
];

type Post = { title: string; slug: string; status: 'Published' | 'Draft'; clicks: number };
const POSTS_SEED: Post[] = [
  { title: "Unlocking Every Child's Potential: How StudYear Creates Equal Chances", slug: 'unlocking-every-childs-potential-how-studyear-creates-equal-chances', status: 'Published', clicks: 7 },
  { title: 'StudYear: The AI Academic Command Center Unifying Education for a Smarter Future', slug: 'studyear-the-ai-academic-command-center-unifying-education-for-a-smarter-future', status: 'Published', clicks: 9 },
  { title: "Unlock Your Child's Full Potential: StudYear's AI-Powered Personalized Learning", slug: 'unlock-your-childs-full-potential-studyears-ai-powered-personalized-learning', status: 'Published', clicks: 7 },
  { title: 'Navigating University Routes: How StudYear Empowers Students & Parents', slug: 'navigating-university-routes-how-studyear-empowers-students-parents', status: 'Published', clicks: 12 },
  { title: 'The Cold War: A World Divided and the Legacy It Left Behind', slug: 'the-cold-war-a-world-divided-and-the-legacy-it-left-behind', status: 'Published', clicks: 13 },
  { title: 'The Power of Testing: Why Experimentation Drives Growth & Success', slug: 'the-power-of-testing-why-experimentation-drives-growth-success', status: 'Published', clicks: 5 },
];

/** Recent ACU debits — as-is from the ledger (emails masked for the public bundle). */
const ACU_DEBITS = [
  { name: 'M Ahmar', email: 'ahm***@gmail.com', feature: 'AI COURSE GENERATOR', acus: -15, date: '7/2/2026' },
  { name: 'M Ahmar', email: 'ahm***@gmail.com', feature: 'AI COURSE GENERATOR', acus: -15, date: '7/2/2026' },
  { name: 'M Ahmar', email: 'ahm***@gmail.com', feature: 'AI COURSE GENERATOR', acus: -30, date: '7/2/2026' },
  { name: 'M Ahmar', email: 'ahm***@gmail.com', feature: 'AI COURSE GENERATOR', acus: -30, date: '7/2/2026' },
  { name: 'M Ahmar', email: 'ahm***@gmail.com', feature: 'AI COURSE GENERATOR', acus: -30, date: '7/2/2026' },
  { name: 'M Ahmar', email: 'ahm***@gmail.com', feature: 'AI EXPLANATION', acus: -5, date: '7/2/2026' },
  { name: 'Joshua N', email: 'mis***@gmail.com', feature: 'AI QUIZ GENERATION', acus: -10, date: '7/2/2026' },
  { name: 'Joshua N', email: 'mis***@gmail.com', feature: 'AI QUIZ GENERATION', acus: -10, date: '7/2/2026' },
  { name: 'Joshua N', email: 'mis***@gmail.com', feature: 'AI QUIZ GENERATION', acus: -10, date: '7/2/2026' },
  { name: 'Joshua N', email: 'mis***@gmail.com', feature: 'AI QUIZ GENERATION', acus: -10, date: '7/2/2026' },
  { name: 'Joshua N', email: 'mis***@gmail.com', feature: 'AI QUIZ GENERATION', acus: -10, date: '7/2/2026' },
];

/** Recent rows from aiUsageLogs — representative as-is subset (emails masked). */
const AI_LOGS = [
  { name: 'Jessie Nseya', email: 'jns***@gmail.com', model: 'gpt-4-turbo', acus: 25, api: '£0.0157', usd: '$0.0199', val: '£0.25', status: 'success', ms: 11961, date: '16/06/2026, 16:08:38' },
  { name: 'Mark Harris', email: 'test.student@local.test', model: 'gpt-4o', acus: 30, api: '£0.0136', usd: '$0.0173', val: '£0.30', status: 'success', ms: 15776, date: '04/06/2026, 10:49:51' },
  { name: 'Mark Harris', email: 'test.student@local.test', model: 'gpt-4o', acus: 30, api: '£0.0183', usd: '$0.0231', val: '£0.30', status: 'success', ms: 16906, date: '04/06/2026, 10:49:01' },
  { name: 'Joden Nseya', email: 'jod***@gmail.com', model: 'gpt-4-turbo', acus: 0, api: '£0.0001', usd: '$0.0001', val: '£0.00', status: 'failed', ms: 13, date: '03/06/2026, 05:59:23' },
  { name: 'Paul KOKO (New Student Test)', email: 'tes***@gmail.com', model: 'gpt-4-turbo', acus: 0, api: '£0.0001', usd: '$0.0002', val: '£0.00', status: 'failed', ms: 7, date: '26/05/2026, 15:36:23' },
  { name: 'Mark Harris', email: 'test.student@local.test', model: 'gpt-4-turbo', acus: 15, api: '£0.0110', usd: '$0.0140', val: '£0.15', status: 'success', ms: 4322, date: '26/05/2026, 15:04:13' },
  { name: 'Joden N Ngolu', email: 'jod***@gmail.com', model: 'gpt-4o', acus: 25, api: '£0.0068', usd: '$0.0085', val: '£0.25', status: 'success', ms: 9050, date: '18/05/2026, 18:26:56' },
  { name: 'Joden N Ngolu', email: 'jod***@gmail.com', model: 'gpt-4o', acus: 10, api: '£0.0035', usd: '$0.0044', val: '£0.10', status: 'success', ms: 7402, date: '18/05/2026, 18:26:27' },
  { name: 'Joden N Ngolu', email: 'jod***@gmail.com', model: 'gpt-4-turbo', acus: 15, api: '£0.0106', usd: '$0.0134', val: '£0.15', status: 'success', ms: 7454, date: '18/05/2026, 15:01:24' },
  { name: 'N/A', email: 'test.teacher@local.test', model: 'gpt-4-turbo', acus: 0, api: '£0.0001', usd: '$0.0001', val: '£0.00', status: 'failed', ms: 43, date: '18/05/2026, 15:00:26' },
  { name: 'Joden N Ngolu', email: 'jod***@gmail.com', model: 'gpt-4o', acus: 30, api: '£0.0154', usd: '$0.0195', val: '£0.30', status: 'success', ms: 14323, date: '18/05/2026, 14:59:19' },
  { name: 'Mark Harris', email: 'test.student@local.test', model: 'gpt-4o', acus: 10, api: '£0.0032', usd: '$0.0041', val: '£0.10', status: 'success', ms: 8508, date: '15/05/2026, 21:56:10' },
  { name: 'Mark Harris', email: 'test.student@local.test', model: 'gpt-4o', acus: 25, api: '£0.0077', usd: '$0.0098', val: '£0.25', status: 'success', ms: 10793, date: '15/05/2026, 21:55:24' },
  { name: 'Mark Harris', email: 'test.student@local.test', model: 'gpt-4o', acus: 30, api: '£0.0145', usd: '$0.0183', val: '£0.30', status: 'success', ms: 17758, date: '15/05/2026, 21:45:39' },
  { name: 'Joshua N', email: 'mis***@gmail.com', model: 'gpt-4o', acus: 25, api: '£0.0081', usd: '$0.0102', val: '£0.25', status: 'success', ms: 15910, date: '15/05/2026, 19:39:09' },
  { name: 'Joshua N', email: 'mis***@gmail.com', model: 'gpt-4o', acus: 10, api: '£0.0032', usd: '$0.0041', val: '£0.10', status: 'success', ms: 6948, date: '15/05/2026, 19:38:29' },
  { name: 'Joshua N', email: 'mis***@gmail.com', model: 'gpt-4-turbo', acus: 0, api: '£0.0131', usd: '$0.0166', val: '£0.00', status: 'success', ms: 4945, date: '14/05/2026, 18:54:19' },
  { name: 'Joshua N', email: 'mis***@gmail.com', model: 'gpt-4o', acus: 25, api: '£0.0073', usd: '$0.0093', val: '£0.25', status: 'success', ms: 14521, date: '14/05/2026, 18:53:54' },
  { name: 'Mark Harris', email: 'test.student@local.test', model: 'gpt-4o', acus: 30, api: '£0.0212', usd: '$0.0268', val: '£0.30', status: 'success', ms: 30960, date: '13/05/2026, 20:22:57' },
  { name: 'Jessie Odia', email: 'jes***@gmail.com', model: 'gpt-4o', acus: 30, api: '£0.0148', usd: '$0.0188', val: '£0.30', status: 'success', ms: 15459, date: '10/05/2026, 18:16:03' },
  { name: 'Jessie Nseya', email: 'jns***@gmail.com', model: 'gpt-4-turbo', acus: 0, api: '£0.0068', usd: '$0.0086', val: '£0.00', status: 'success', ms: 2899, date: '10/05/2026, 18:05:26' },
  { name: 'Joden N Ngolu', email: 'jod***@gmail.com', model: 'gpt-4-turbo', acus: 0, api: '£0.0000', usd: '$0.0000', val: '£0.00', status: 'success', ms: 4275, date: '08/05/2026, 16:09:49' },
];

type Pipe = { title: string; url: string; subject: string; level: string; topic: string; license: string; attribution: string; status: string };
type Code = { code: string; type: string; value: string; until: string; used: string; status: string };
const CODES_SEED: Code[] = [{ code: 'TEST_CODE', type: 'Fixed £', value: '£5', until: '13/06/2026', used: '0/1', status: 'Active' }];

const ECON_DISCLAIMER = 'Stripe totals come from successful Checkout payments logged in Firestore. Estimated AI spend uses token-based provider list prices (USD) × a fixed USD→GBP hint — verify against OpenAI / Google Cloud invoices. ACU £ value assumes the Entry pack (£5 / 500 ACU). Older logs may show £0 API cost until new requests run after this update.';

type Msg = { date: string; name: string; email: string; type: string; body: string; status: 'NEW' | 'READ' | 'REPLIED' };
/** Contact inbox — as-is (17 submissions incl. spam rows), emails masked for the public bundle. */
const MSGS_SEED: Msg[] = [
  { date: '16/06/2026, 22:24:44', name: 'TiyrENbvULulORDVvdeAcBx', email: 'vic***@cabotwrenn.com', type: 'support', body: 'bQKOeVZAzmgJMQrOskPg', status: 'NEW' },
  { date: '16/06/2026, 21:11:27', name: 'OdbUtqsPUbSyiHnalTdOWeG', email: 'hma***@centerfield.com', type: 'support', body: 'HlwzPgJPIqJKnNiDOAlIFADd', status: 'NEW' },
  { date: '16/06/2026, 19:37:06', name: 'daPuynegRLAIRhoAXPGP', email: 'kca***@gmail.com', type: 'support', body: 'esnTQXvknYyYRQtGSdtuF', status: 'NEW' },
  { date: '16/06/2026, 18:03:06', name: 'yHacZDhLCgxcCjxT', email: 'hsm***@aol.com', type: 'support', body: 'cPNjayFeiSyhSzKtkGfw', status: 'NEW' },
  { date: '14/06/2026, 21:01:08', name: 'LokJPyKmdHHXjSqgXamQZ', email: 'ccn***@gmail.com', type: 'support', body: 'xyerZgEkCjdjbRqxH', status: 'NEW' },
  { date: '13/06/2026, 02:41:18', name: 'OYofgRTasCOaFaZd', email: 'gra***@yahoo.com', type: 'support', body: 'aNhoNSjqyJYwVCLi', status: 'NEW' },
  { date: '12/06/2026, 12:07:49', name: 'qtTeDtojDztwDHHmVdVqIw', email: 'daw***@protonmail.com', type: 'support', body: 'eOjczJqTMhkIciAPpAec', status: 'NEW' },
  { date: '12/06/2026, 07:41:49', name: 'RQQqXKDGYQjvWYewSEsNBI', email: 'wal***@aol.com', type: 'support', body: 'kWNZSJWHAXQdtWoXjkInwvR', status: 'READ' },
  { date: '12/06/2026, 02:20:00', name: 'twLFGqzCdKIMIoTjJAjEkSE', email: 'ste***@gmail.com', type: 'support', body: 'uQecUuBSNafVmbulyNOyBk', status: 'READ' },
  { date: '11/06/2026, 18:21:59', name: 'Mark Harris', email: 'jnb***@gmail.com', type: 'billing', body: 'Hello , I cannot pay', status: 'READ' },
  { date: '11/06/2026, 18:04:56', name: 'M Ahmar', email: 'ahm***@gmail.com', type: 'support', body: 'testing', status: 'READ' },
  { date: '04/06/2026, 11:34:34', name: 'Justin Matin', email: 'jnb***@gmail.com', type: 'support', body: 'I want to test this', status: 'READ' },
  { date: '24/05/2026, 09:41:14', name: 'New Student Test', email: 'jnb***@gmail.com', type: 'support', body: 'I would like to find out the top up process', status: 'NEW' },
  { date: '22/05/2026, 11:34:57', name: 'M Ahmar', email: 'ahm***@gmail.com', type: 'support', body: 'test', status: 'REPLIED' },
  { date: '22/05/2026, 11:26:38', name: 'Mark Harris', email: 'jnb***@gmail.com', type: 'support', body: 'I would like to get in touch with you', status: 'NEW' },
  { date: '20/05/2026, 10:38:36', name: 'Marick Papa', email: 'inf***@tunakula.com', type: 'partnership', body: 'I want to work with you and my school is ready for a demo', status: 'READ' },
  { date: '15/05/2026, 22:15:42', name: 'Just Ongre', email: 'inf***@jnseya.co.uk', type: 'billing', body: 'I need free ACUs please', status: 'NEW' },
];

function store<T>(k: string, d: T): T {
  try { return (JSON.parse(localStorage.getItem('sy-admin-' + k) ?? 'null') as T) ?? d; } catch { return d; }
}
function save(k: string, v: unknown) { localStorage.setItem('sy-admin-' + k, JSON.stringify(v)); }

const roleConsole = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('student')) return 'student';
  if (r.includes('parent')) return 'parent';
  if (r.includes('school_admin') || r === 'school') return 'school';
  if (r.includes('tutor') && !r.includes('school')) return 'tutor';
  if (r.includes('school_tutor') || r.includes('teacher')) return 'teacher';
  if (r.includes('admin')) return 'admin';
  return 'student';
};

export default function AdminConsole() {
  const [session, setSession] = useState<Session | null>(null);
  const [sec, setSec] = useState<SectionId>('dashboard');
  const [toast, setToast] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [apps, setApps] = useState<TutorApp[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tickets, setTickets] = useState<{ id: string; who: string; topic: string; status: string }[]>([]);
  const [flags, setFlags] = useState<{ who: string; rule: string; status: string }[]>([]);
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [pipeline, setPipeline] = useState<Pipe[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [openMsg, setOpenMsg] = useState<number | null>(null);
  const [impQuery, setImpQuery] = useState('');
  const [impUid, setImpUid] = useState('');
  const [impReason, setImpReason] = useState('');

  useEffect(() => {
    let s: Session | null = null;
    try { s = JSON.parse(localStorage.getItem('sy-session') ?? 'null'); } catch {}
    const here = encodeURIComponent(window.location.pathname);
    if (!s?.role) { window.location.replace(`${BASE}/auth/?role=admin&next=${here}`); return; }
    if (s.role !== 'admin') { window.location.replace(`${BASE}/auth/?role=admin&mismatch=${encodeURIComponent(s.role)}&next=${here}`); return; }
    setSession(s);
    setUsers(store('users', USERS_SEED));
    setApps(store('tutor-apps-v2', APPS_SEED));
    setPosts(store('posts', POSTS_SEED));
    setTickets(store('tickets', [
      { id: 'T-1042', who: 'amara@example.com', topic: 'Planner rebuilt but sessions missing', status: 'open' },
      { id: 'T-1041', who: 'okafor.family@example.com', topic: 'Add third child to family wallet', status: 'open' },
      { id: 'T-1039', who: 'daniel.k@example.com', topic: 'Payout date question', status: 'resolved' },
    ]));
    setFlags(store('flags', [] as { who: string; rule: string; status: string }[]));
    setPipeline(store('pipeline', [] as Pipe[]));
    setCodes(store('codes', CODES_SEED));
    setMsgs(store('inbox', MSGS_SEED));
    setSettings(store('settings', { maintenance: false, signups: true, aiRateLimit: true, tutorMarketplace: true, referrals: true }));
    const fromHash = () => {
      const h = window.location.hash.replace('#', '') as SectionId;
      if (SECTIONS.some(([id]) => id === h)) setSec(h);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const go = (id: SectionId) => { setSec(id); window.location.hash = id; };
  const ping = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2600); };
  const signOut = () => { localStorage.removeItem('sy-session'); window.location.href = `${BASE}/`; };

  const patchUser = (i: number, patch: Partial<AdminUser>) => {
    const next = users.map((u, j) => (j === i ? { ...u, ...patch } : u));
    setUsers(next); save('users', next);
  };
  const adjustAcus = (i: number) => {
    const v = window.prompt(`Adjust ACU balance for ${users[i].email}`, String(users[i].acus));
    if (v === null) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 0) { ping('Enter a non-negative number'); return; }
    patchUser(i, { acus: n }); ping(`Wallet set to ${n} ACUs`);
  };
  const grantAcus = (i: number) => {
    const v = window.prompt(`Grant free ACUs to ${users[i].email} — amount to add`, '100');
    if (v === null) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n <= 0) { ping('Enter a positive number'); return; }
    patchUser(i, { acus: users[i].acus + n }); ping(`+${n} free ACUs granted (admin grant, logged)`);
  };
  const linkParent = (i: number) => {
    const v = window.prompt('Link parent — enter the parent account email', users[i].parent ?? '');
    if (v === null) return;
    patchUser(i, { parent: v || undefined }); ping(v ? `Linked to parent ${v}` : 'Parent link removed');
  };
  const linkSchool = (i: number) => {
    const v = window.prompt('Link school — enter the school account email', users[i].school ?? '');
    if (v === null) return;
    patchUser(i, { school: v || undefined }); ping(v ? `Linked to school ${v}` : 'School link removed');
  };
  const deleteUser = (i: number) => {
    if (!window.confirm(`Delete ${users[i].email}? This removes the account and its wallet.`)) return;
    const next = users.filter((_, j) => j !== i);
    setUsers(next); save('users', next); setEditing(null); ping('User deleted');
  };

  const setApp = (i: number, status: TutorApp['status']) => {
    const next = apps.map((a, j) => (j === i ? { ...a, status } : a));
    setApps(next); save('tutor-apps-v2', next);
    ping(status === 'Approved' ? 'Approved — tutor dashboard unlocked' : 'Rejected — dashboard access blocked');
  };

  const patchPost = (i: number, patch: Partial<Post>) => {
    const next = posts.map((p, j) => (j === i ? { ...p, ...patch } : p));
    setPosts(next); save('posts', next);
  };
  const deletePost = (i: number) => {
    if (!window.confirm(`Delete “${posts[i].title.slice(0, 40)}…”?`)) return;
    const next = posts.filter((_, j) => j !== i);
    setPosts(next); save('posts', next); ping('Post deleted');
  };

  const setTicket = (i: number, status: string) => {
    const next = tickets.map((t, j) => (j === i ? { ...t, status } : t));
    setTickets(next); save('tickets', next); ping(`Ticket ${next[i].id} → ${status}`);
  };
  const setFlag = (i: number, status: string) => {
    const next = flags.map((f, j) => (j === i ? { ...f, status } : f));
    setFlags(next); save('flags', next); ping(`Flag ${status}`);
  };
  const toggle = (k: string) => {
    const next = { ...settings, [k]: !settings[k] };
    setSettings(next); save('settings', next); ping(`${k} → ${next[k] ? 'on' : 'off'}`);
  };

  if (!session) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#6B7A96', fontFamily: 'system-ui, sans-serif', fontSize: 14, letterSpacing: '.2em', textTransform: 'uppercase' }}>
        Checking your account…
      </main>
    );
  }

  const kpis: [string, string][] = [
    ['Total Students', '38'], ['Active Users', '67'], ['High-Risk Students', '0'], ['Sponsored Students', '0'],
    ['School Partners', '3'], ['Est. AI spend (30d)', '£0.05'], ['Stripe gross (30d)', '£0.00'],
  ];
  const appStats = {
    total: apps.length,
    pending: apps.filter((a) => a.status === 'Pending').length,
    approved: apps.filter((a) => a.status === 'Approved').length,
    rejected: apps.filter((a) => a.status === 'Rejected').length,
  };
  const appsSorted = [...apps].sort((a, b) => (a.status === 'Pending' ? -1 : 0) - (b.status === 'Pending' ? -1 : 0));

  return (
    <div className="adm">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {toast && <div className="toast">{toast}</div>}

      <aside>
        <a className="logo" href={`${BASE}/`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/logo.svg`} alt="" width={30} height={30} />
          Stud<b>Year</b> <span className="tag">ADMIN</span>
        </a>
        <nav>
          {SECTIONS.map(([id, label, icon]) => (
            <button key={id} className={sec === id ? 'on' : ''} onClick={() => go(id)}>
              <span className="ic">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="me">
          <b>{session.name}</b>
          <small>{session.email}</small>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <main>
        {sec === 'dashboard' && (
          <section>
            <h1>Welcome, Admin!</h1>
            <p className="sub">Here is an overview of the platform&apos;s performance.</p>
            <div className="kpis">
              {kpis.map(([k, v]) => (
                <div className="kpi" key={k}><div className="v">{v}</div><div className="k">{k}</div></div>
              ))}
            </div>

            <h2>Platform economics</h2>
            <div className="econ">
              <div className="ecard"><div className="ek">Stripe gross (30d)</div><div className="es">Gross payments recorded</div>
                <div className="ev">£0.00</div><div className="ed">0 payments · <a href="#revenue" onClick={() => go('revenue')}>Billing detail</a></div></div>
              <div className="ecard"><div className="ek">Stripe gross (90d)</div><div className="es">Rolling quarter-style window</div>
                <div className="ev">£0.00</div><div className="ed">0 payments in period</div></div>
              <div className="ecard"><div className="ek">Est. AI API spend (30d)</div><div className="es">Provider-side token estimate</div>
                <div className="ev">£0.05</div><div className="ed">≈ $0.06 USD list-price hint @ 1 USD ≈ 0.79 GBP · <a href="#ai-costs" onClick={() => go('ai-costs')}>Usage log</a></div></div>
              <div className="ecard"><div className="ek">ACUs consumed (30d)</div><div className="es">Debit volume · Entry-pack £ hint</div>
                <div className="ev">85</div><div className="ed">≈ £0.85 · 3 successful AI calls</div></div>
            </div>

            <div className="mgrid">
              {MANAGE_CARDS.map((c) => (
                <div className="mcard" key={c.title}>
                  <h3>{c.title}</h3><p>{c.desc}</p>
                  <button onClick={() => go(c.to)}>Manage</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {sec === 'users' && (
          <section>
            <h1>User Management</h1>
            <p className="sub">View and manage all users on the platform.</p>
            <h2 style={{ marginTop: 0 }}>All Users</h2>
            <p className="note" style={{ marginTop: 0 }}>A real-time list of all registered users from the database.
              Emails are masked in this public preview — full addresses live only in the secure backend admin.</p>
            <div className="tscroll">
            <table>
              <thead><tr><th>Display Name</th><th>Email</th><th>Role</th><th>Subscription</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.email + i} className={editing === i ? 'editing' : ''}>
                    {editing === i ? (
                      <>
                        <td><input defaultValue={u.name} id={`ed-name-${i}`} /></td>
                        <td className="mono">{u.email}</td>
                        <td>
                          <select defaultValue={u.role.toUpperCase()} id={`ed-role-${i}`}>
                            {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                          </select>
                        </td>
                        <td>
                          <select defaultValue={u.sub} id={`ed-sub-${i}`}>
                            {SUB_OPTIONS.map((sname) => <option key={sname}>{sname}</option>)}
                          </select>
                        </td>
                        <td className="acts">
                          <button className="sm" onClick={() => {
                            const name = (document.getElementById(`ed-name-${i}`) as HTMLInputElement).value;
                            const role = (document.getElementById(`ed-role-${i}`) as HTMLSelectElement).value;
                            const sub = (document.getElementById(`ed-sub-${i}`) as HTMLSelectElement).value;
                            patchUser(i, { name, role, sub }); setEditing(null); ping('User updated');
                          }}>Save</button>
                          <button className="sm ghost" onClick={() => setEditing(null)}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{u.name}{u.parent && <small className="lnk">↳ parent: {u.parent}</small>}{u.school && <small className="lnk">↳ school: {u.school}</small>}</td>
                        <td className="mono">{u.email}</td>
                        <td><span className="chip">{u.role}</span></td>
                        <td>{u.sub}<small className="lnk">{u.acus.toLocaleString('en-GB')} ACUs</small></td>
                        <td className="acts">
                          <button className="sm" onClick={() => setEditing(i)}>Edit</button>
                          {u.role.toUpperCase() === 'STUDENT' && (
                            <>
                              <button className="sm ghost" onClick={() => linkParent(i)}>Link Parent</button>
                              <button className="sm ghost" onClick={() => linkSchool(i)}>Link School</button>
                            </>
                          )}
                          <button className="sm ghost" onClick={() => adjustAcus(i)}>Adjust ACUs</button>
                          <button className="sm ghost" onClick={() => grantAcus(i)}>Grant free ACUs</button>
                          <a className="sm btnlink" href={`${BASE}/app/${roleConsole(u.role)}/`}>View as User</a>
                          <button className="sm danger" onClick={() => deleteUser(i)}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {sec === 'tutor-applications' && (
          <section>
            <h1>Tutor applications</h1>
            <p className="sub">Review, approve, or reject private tutor registrations. Tutors cannot access their dashboard until approved.</p>
            <div className="kpis">
              <div className="kpi"><div className="v">{appStats.total}</div><div className="k">Total</div></div>
              <div className="kpi"><div className="v">{appStats.pending}</div><div className="k">Pending</div></div>
              <div className="kpi"><div className="v">{appStats.approved}</div><div className="k">Approved</div></div>
              <div className="kpi"><div className="v">{appStats.rejected}</div><div className="k">Rejected</div></div>
            </div>
            <h2>All applications</h2>
            <p className="note" style={{ marginTop: 0 }}>Sorted by status — pending first. Approve or reject to unlock / block dashboard access.</p>
            <div className="tscroll">
            <table>
              <thead><tr><th>Tutor</th><th>Subjects</th><th>Hourly rate</th><th>Fee paid</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {appsSorted.map((a) => {
                  const i = apps.indexOf(a);
                  return (
                    <tr key={a.email}>
                      <td>{a.name}<small className="lnk">{a.email}</small></td>
                      <td>{a.subjects}</td><td>{a.rate}</td><td>{a.fee}</td>
                      <td><span className={a.status === 'Approved' ? 'ok' : a.status === 'Rejected' ? 'bad' : 'chip'}>{a.status}</span></td>
                      <td className="acts">
                        <button className="sm danger" disabled={a.status === 'Rejected'} onClick={() => setApp(i, 'Rejected')}>Reject</button>
                        <button className="sm" disabled={a.status === 'Approved'} onClick={() => setApp(i, 'Approved')}>
                          {a.status === 'Approved' ? 'Approved' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {sec === 'blog' && (
          <section>
            <h1>Blog</h1>
            <p className="sub">Create drafts, publish to the public blog, and monitor article views (one increment per page load).</p>
            <p>
              <button className="primary" onClick={() => ping('AI post generator runs on the AI gateway — arrives with the backend')}>AI generator</button>{' '}
              <button className="primary ghosted" onClick={() => ping('Draft composer arrives with the backend CMS')}>New post</button>
            </p>
            <h2>All posts</h2>
            <p className="note" style={{ marginTop: 0 }}>Clicks count successful loads of the public article page.</p>
            <div className="tscroll">
            <table>
              <thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Clicks</th><th>Actions</th></tr></thead>
              <tbody>
                {posts.map((p, i) => (
                  <tr key={p.slug}>
                    <td style={{ maxWidth: 260 }}>{p.title}</td>
                    <td className="mono" style={{ maxWidth: 200, wordBreak: 'break-all' }}>{p.slug}</td>
                    <td><span className={p.status === 'Published' ? 'ok' : 'chip'}>{p.status}</span></td>
                    <td>{p.clicks}</td>
                    <td className="acts">
                      <button className="sm ghost" onClick={() => ping('Post editor arrives with the backend CMS')}>Edit</button>
                      <a className="sm btnlink" href={`${BASE}/blog/`}>View live</a>
                      <button className="sm ghost" onClick={() => { patchPost(i, { status: p.status === 'Published' ? 'Draft' : 'Published' }); ping(p.status === 'Published' ? 'Unpublished' : 'Published'); }}>
                        {p.status === 'Published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="sm danger" onClick={() => deletePost(i)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {sec === 'content' && (
          <section>
            <h1>Content Management</h1>
            <p className="sub">Manage subjects, topics, and curate external video resources.</p>
            <h2 style={{ marginTop: 0 }}>Add New Resource</h2>
            <p className="note" style={{ marginTop: 0 }}>Add a new resource to the ingestion pipeline.</p>
            <div className="form2" id="pipe-form">
              <label>Resource Type<select id="pf-type"><option>Videos</option>{RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label>Title<input id="pf-title" placeholder="Title" /></label>
              <label>URL<input id="pf-url" placeholder="https://…" /></label>
              <label>Subject<select id="pf-subj"><option value="">Select subject...</option>{SUBJECTS.map((sname) => <option key={sname}>{sname}</option>)}</select></label>
              <label>Level<select id="pf-level"><option value="">Select level...</option><option>Reception (Primary School)</option>{STUDY_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
              <label>Topic<select id="pf-topic"><option value="">Select topic...</option>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label>License Type<select id="pf-license"><option>Standard YouTube</option><option>Creative Commons</option><option>Owned / original</option></select></label>
              <label>Attribution (if required)<input id="pf-attr" placeholder="Attribution (if required)" /></label>
            </div>
            <button className="primary" onClick={() => {
              const g = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value;
              if (!g('pf-title') || !g('pf-url')) { ping('Add a title and URL first'); return; }
              const next = [...pipeline, { title: g('pf-title'), url: g('pf-url'), subject: g('pf-subj'), level: g('pf-level'), topic: g('pf-topic'), license: g('pf-license'), attribution: g('pf-attr'), status: 'pending' }];
              setPipeline(next); save('pipeline', next);
              (document.getElementById('pf-title') as HTMLInputElement).value = '';
              (document.getElementById('pf-url') as HTMLInputElement).value = '';
              ping('Added to the ingestion pipeline');
            }}>Add to Pipeline</button>

            <h2>Resource Ingestion Pipeline</h2>
            <p className="note" style={{ marginTop: 0 }}>Review and approve curated content.</p>
            {pipeline.length === 0 && <p className="note">No resources in the pipeline yet.</p>}
            {pipeline.map((r, i) => (
              <div className="row" key={r.url + i}>
                <div><b>{r.title}</b><small>{r.url} · {r.subject || '—'} · {r.level || '—'} {r.topic ? '· ' + r.topic : ''} · {r.license}{r.attribution ? ' · ' + r.attribution : ''}</small></div>
                <span className={r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'bad' : 'chip'}>{r.status}</span>
                {r.status === 'pending' && (
                  <span className="acts">
                    <button className="sm" onClick={() => { const n = pipeline.map((x, j) => j === i ? { ...x, status: 'approved' } : x); setPipeline(n); save('pipeline', n); ping('Approved — published to the library'); }}>Approve</button>
                    <button className="sm danger" onClick={() => { const n = pipeline.map((x, j) => j === i ? { ...x, status: 'rejected' } : x); setPipeline(n); save('pipeline', n); ping('Rejected'); }}>Reject</button>
                  </span>
                )}
              </div>
            ))}
            <h2>Vocabulary &amp; moderation</h2>
            <div className="kpis">
              <div className="kpi"><div className="v">{SUBJECTS.length}</div><div className="k">Subjects</div></div>
              <div className="kpi"><div className="v">{TOPICS.length}</div><div className="k">Topics</div></div>
              <div className="kpi"><div className="v">{STUDY_LEVELS.length}</div><div className="k">Levels</div></div>
              <div className="kpi"><div className="v">{RESOURCE_TYPES.length}</div><div className="k">Resource types</div></div>
            </div>
            <p className="note">Vocabularies are governed by the shared contracts in @studyear/shared — edits there roll out platform-wide.</p>
          </section>
        )}

        {sec === 'revenue' && (
          <section>
            <h1>Billing &amp; Revenue</h1>
            <p className="sub">Stripe gross vs estimated AI spend (see disclaimers below). Subscription renewals only appear here when logged as payment rows.</p>

            <h2 style={{ marginTop: 0 }}>Stripe connection</h2>
            <p className="note" style={{ marginTop: 0 }}>Live server env check — confirms checkout keys and webhook secret are set on this deployment.</p>
            <div className="panelw ok-b">
              <b>Stripe API connected</b>
              <small>Live mode: yes. Checkout should work if price IDs match this account.</small>
              <small>Publishable key: set · Secret key: rk_live… (restricted) · Webhook secret: set</small>
              <small className="warn">Restricted key (rk_) detected. Prefer a standard Secret key (sk_) for checkout. If you keep rk_, grant Checkout Sessions, Customers, Prices, Coupons, Promotion codes, and Webhooks in Stripe.</small>
              <button className="sm" onClick={() => ping('Connection re-check runs on the live deployment env')}>Re-check connection</button>
            </div>

            <div className="econ">
              <div className="ecard"><div className="ek">Stripe gross (30d)</div><div className="es">Gross payments recorded</div>
                <div className="ev">£0.00</div><div className="ed">0 payments · Billing detail</div></div>
              <div className="ecard"><div className="ek">Stripe gross (90d)</div><div className="es">Rolling quarter-style window</div>
                <div className="ev">£0.00</div><div className="ed">0 payments in period</div></div>
              <div className="ecard"><div className="ek">Est. AI API spend (30d)</div><div className="es">Provider-side token estimate</div>
                <div className="ev">£0.05</div><div className="ed">≈ $0.06 USD list-price hint @ 1 USD ≈ 0.79 GBP · <a href="#ai-costs" onClick={() => go('ai-costs')}>Usage log</a></div></div>
              <div className="ecard"><div className="ek">ACUs consumed (30d)</div><div className="es">Debit volume · Entry-pack £ hint</div>
                <div className="ev">85</div><div className="ed">≈ £0.85 · 3 successful AI calls</div></div>
              <div className="ecard"><div className="ek">Indicative margin (30d)</div><div className="es">Stripe gross (30d) minus estimated AI spend (GBP hint)</div>
                <div className="ev">£-0.05</div><div className="ed">{ECON_DISCLAIMER}</div></div>
            </div>

            <h2>Recent Payments</h2>
            <p className="note" style={{ marginTop: 0 }}>A log of recent transactions processed via Stripe.</p>
            <table><thead><tr><th>User</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody><tr><td colSpan={3} style={{ color: '#6B7A96', fontStyle: 'italic' }}>No payment history found.</td></tr></tbody></table>

            <h2>Recent ACU Debits</h2>
            <p className="note" style={{ marginTop: 0 }}>High-value AI credit consumptions from the ledger.</p>
            <div className="tscroll">
            <table><thead><tr><th>User</th><th>Feature</th><th>ACUs</th><th>Date</th></tr></thead><tbody>
              {ACU_DEBITS.map((d, i) => (
                <tr key={i}><td>{d.name}<small className="lnk">{d.email}</small></td><td>{d.feature}</td>
                  <td><span className="bad">{d.acus}</span><small className="lnk">No provider £ logged on this debit</small></td><td>{d.date}</td></tr>
              ))}
            </tbody></table>
            </div>

            <h2>Manage Discount Codes</h2>
            <p className="note" style={{ marginTop: 0 }}>Codes sync to Stripe automatically. Share links like /checkout?code=YOUR_CODE so users land with the code ready.</p>
            <div className="panelw">
              <b>How customers use a code</b>
              <small>1. Go to Plans &amp; top-up (/checkout)</small>
              <small>2. Apply the code in the discount box (or open a shared link with ?code=)</small>
              <small>3. Pick a plan — the discount is applied on the Stripe payment screen</small>
            </div>
            <div className="form2">
              <label>New code<input id="dc-code" placeholder="e.g., SUMMER25" /></label>
              <label>Type<select id="dc-type"><option>Percentage off</option><option>Fixed £</option><option>Bonus ACUs</option><option>Free period</option></select></label>
              <label>Value<input id="dc-value" defaultValue="10" /></label>
              <label>Valid until (optional)<input id="dc-until" placeholder="dd/mm/yyyy" /></label>
              <label>Max redemptions (optional)<input id="dc-max" placeholder="e.g., 100" /></label>
            </div>
            <button className="primary" onClick={() => {
              const g = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value;
              const code = g('dc-code').trim().toUpperCase();
              if (!code) { ping('Enter a code name'); return; }
              if (codes.some((c) => c.code === code)) { ping('That code already exists'); return; }
              const type = g('dc-type');
              const value = type === 'Percentage off' ? g('dc-value') + '%' : type === 'Fixed £' ? '£' + g('dc-value') : g('dc-value') + (type === 'Bonus ACUs' ? ' ACUs' : ' days');
              const next = [...codes, { code, type, value, until: g('dc-until') || '—', used: `0/${g('dc-max') || '∞'}`, status: 'Active' }];
              setCodes(next); save('codes', next);
              (document.getElementById('dc-code') as HTMLInputElement).value = '';
              ping(`Code ${code} created — syncs to Stripe when billing backend is live`);
            }}>Create discount code</button>
            <h2>Active codes</h2>
            {codes.map((c, i) => (
              <div className="row" key={c.code}>
                <div><b>{c.code}</b><small>{c.value} · until {c.until} · {c.used} used</small></div>
                <span className={c.status === 'Active' ? 'ok' : 'chip'}>{c.status}</span>
                <span className="acts">
                  <button className="sm ghost" onClick={() => { const n = codes.map((x, j) => j === i ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x); setCodes(n); save('codes', n); ping(c.status === 'Active' ? 'Code deactivated' : 'Code reactivated'); }}>
                    {c.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                </span>
              </div>
            ))}

            <h2>Growth Partner Programme</h2>
            <p className="note">0 influencers approved · referral reward {REFERRAL.rewardAcus} ACUs (valid after {REFERRAL.validAfterDays} days, £{(REFERRAL.minReferredSpendPence / 100).toFixed(0)} min spend) ·
              influencer commission {(INFLUENCER.lifetimeCommissionRate * 100).toFixed(0)}% lifetime, capped £{(INFLUENCER.monthlyCapPence / 100000).toFixed(0)}0k/month.</p>
          </section>
        )}

        {sec === 'ai-costs' && (
          <section>
            <h1>AI usage &amp; API costs</h1>
            <p className="sub">Estimated API spend is shown in GBP (USD list-price hint × 0.79 FX). ACU £ uses the Entry-pack rule (£5 / 500 ACU). Confirm against real vendor invoices.</p>
            <div className="econ">
              <div className="ecard"><div className="ek">Stripe gross (30d)</div><div className="es">Gross payments recorded</div>
                <div className="ev">£0.00</div><div className="ed">0 payments · <a href="#revenue" onClick={() => go('revenue')}>Billing detail</a></div></div>
              <div className="ecard"><div className="ek">Stripe gross (90d)</div><div className="es">Rolling quarter-style window</div>
                <div className="ev">£0.00</div><div className="ed">0 payments in period</div></div>
              <div className="ecard"><div className="ek">Est. AI API spend (30d)</div><div className="es">Provider-side token estimate</div>
                <div className="ev">£0.05</div><div className="ed">≈ $0.06 USD list-price hint @ 1 USD ≈ 0.79 GBP</div></div>
              <div className="ecard"><div className="ek">ACUs consumed (30d)</div><div className="es">Debit volume · Entry-pack £ hint</div>
                <div className="ev">85</div><div className="ed">≈ £0.85 · 3 successful AI calls</div></div>
              <div className="ecard"><div className="ek">Indicative margin (30d)</div><div className="es">Stripe gross (30d) minus estimated AI spend (GBP hint)</div>
                <div className="ev">£-0.05</div><div className="ed">{ECON_DISCLAIMER}</div></div>
            </div>
            <h2>Recent AI requests</h2>
            <p className="note" style={{ marginTop: 0 }}>Latest rows from Firestore aiUsageLogs. Admin accounts are exempt from AI rate limits.</p>
            <div className="tscroll">
            <table>
              <thead><tr><th>User</th><th>Model</th><th>ACUs</th><th>Est. API (£)</th><th>ACU value (£)</th><th>Status</th><th>Latency</th><th>Date</th></tr></thead>
              <tbody>
                {AI_LOGS.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}<small className="lnk">{r.email}</small></td>
                    <td>{r.model}<small className="lnk">openai</small></td>
                    <td>{r.acus}</td>
                    <td>{r.api}<small className="lnk">({r.usd} USD hint)</small></td>
                    <td>{r.val}</td>
                    <td><span className={r.status === 'success' ? 'ok' : 'bad'}>{r.status}</span></td>
                    <td>{r.ms}ms</td><td>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {sec === 'analytics' && (
          <section>
            <h1>Analytics &amp; Reporting</h1>
            <p className="sub">Sign-up trends, returning activity (via last login), and AI usage volume from Firestore.</p>
            <div className="kpis">
              <div className="kpi"><div className="v">67</div><div className="k">Total users</div><div className="ks">Documents in users</div></div>
              <div className="kpi"><div className="v">37</div><div className="k">Returning (30d)</div><div className="ks">Users with lastLoginAt in the last 30 days</div></div>
              <div className="kpi"><div className="v">25</div><div className="k">New sign-ups (30d)</div><div className="ks">Users with createdAt in the last 30 days</div></div>
              <div className="kpi"><div className="v">3</div><div className="k">AI requests logged (30d)</div><div className="ks">Rows in aiUsageLogs</div></div>
            </div>
            <h2>New Users This Year</h2>
            <svg viewBox="0 0 640 150" className="chart" role="img" aria-label="Monthly sign-ups rising from 1 in September to 25 in the last 30 days">
              {[1, 1, 2, 3, 3, 4, 5, 6, 8, 9, 25].map((v, i) => (
                <g key={i}>
                  <rect x={20 + i * 56} y={130 - v * 4.6} width={34} height={v * 4.6} rx={4} fill="#3D8FD1" opacity={i === 10 ? 1 : 0.55} />
                  <text x={37 + i * 56} y={125 - v * 4.6} textAnchor="middle" fontSize="11" fill="#A9CFF2">{v}</text>
                  <text x={37 + i * 56} y={146} textAnchor="middle" fontSize="10" fill="#6B7A96">{['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}</text>
                </g>
              ))}
            </svg>
            <h2>Avg. Study Time / Week (Hours)</h2>
            <svg viewBox="0 0 640 150" className="chart" role="img" aria-label="Average study hours per week from 11 May to 29 June">
              {[4.2, 5.1, 4.8, 5.6, 6.2, 5.9, 6.8, 7.1].map((v, i) => (
                <g key={i}>
                  <rect x={30 + i * 74} y={130 - v * 14} width={42} height={v * 14} rx={4} fill="#3D8FD1" opacity={0.55 + i * 0.05} />
                  <text x={51 + i * 74} y={124 - v * 14} textAnchor="middle" fontSize="11" fill="#A9CFF2">{v}</text>
                  <text x={51 + i * 74} y={146} textAnchor="middle" fontSize="10" fill="#6B7A96">{['11 May', '18 May', '25 May', '1 Jun', '8 Jun', '15 Jun', '22 Jun', '29 Jun'][i]}</text>
                </g>
              ))}
            </svg>
            <h2>Generation volume by feature (30d)</h2>
            <table><thead><tr><th>Feature</th><th>Runs</th><th>ACUs</th></tr></thead><tbody>
              <tr><td>Course generator</td><td>2</td><td>60</td></tr>
              <tr><td>Interactive lessons</td><td>1</td><td>25</td></tr>
              <tr><td>Quiz generation</td><td>0</td><td>0</td></tr>
            </tbody></table>
          </section>
        )}

        {sec === 'fraud' && (
          <section>
            <h1>Fraud Monitoring</h1>
            <p className="sub">Review accounts flagged for suspicious activity.</p>
            <h2 style={{ marginTop: 0 }}>Flagged Accounts</h2>
            <p className="note" style={{ marginTop: 0 }}>These accounts have been flagged by the system for manual review.</p>
            <table>
              <thead><tr><th>User</th><th>Reason for Flag</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {flags.length === 0 && <tr><td colSpan={4} style={{ color: '#6B7A96', fontStyle: 'italic' }}>No flagged users found.</td></tr>}
                {flags.map((f, i) => (
                  <tr key={f.who}>
                    <td>{f.who}</td><td>{f.rule}</td>
                    <td><span className={f.status === 'cleared' ? 'ok' : f.status === 'suspended' ? 'bad' : 'chip'}>{f.status}</span></td>
                    <td className="acts">
                      <button className="sm" onClick={() => setFlag(i, 'cleared')}>Clear</button>
                      <button className="sm danger" onClick={() => setFlag(i, 'suspended')}>Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note">Active rules: one free account per verified parent/device · refund-after-spend review · shared-device clustering · velocity caps on top-ups (admin accounts exempt).</p>
          </section>
        )}

        {sec === 'support' && (
          <section>
            <h1>Support Tools</h1>
            <p className="sub">Access admin-only support features. All actions are logged.</p>
            <h2 style={{ marginTop: 0 }}>View as User</h2>
            <p className="note" style={{ marginTop: 0 }}>Initiate a secure, time-limited impersonation session to assist a user.</p>
            <div className="form2">
              <label>Target user
                <input placeholder="Search by name or email…" value={impQuery} onChange={(e) => {
                  setImpQuery(e.target.value);
                  const hit = users.find((u) => (u.name + u.email).toLowerCase().includes(e.target.value.toLowerCase()));
                  if (hit && e.target.value.length > 2) setImpUid('uid_' + hit.email.replace(/[^a-z0-9]/gi, '').slice(0, 12));
                }} />
              </label>
              <label>User ID (UID) — filled when you pick a user, or paste directly
                <input placeholder="UID" value={impUid} onChange={(e) => setImpUid(e.target.value)} />
              </label>
            </div>
            <label className="wide">Reason for Session
              <input placeholder="e.g., 'Investigating user report of missing study plan...'" value={impReason} onChange={(e) => setImpReason(e.target.value)} style={{ width: '100%', maxWidth: 560 }} />
            </label>
            {impQuery.length > 2 && (
              <p className="note">Matches: {users.filter((u) => (u.name + u.email).toLowerCase().includes(impQuery.toLowerCase())).slice(0, 4).map((u) => `${u.name} (${u.email})`).join(' · ') || 'none'}</p>
            )}
            <button className="primary" onClick={() => {
              if (!impUid) { ping('Pick a target user or paste a UID'); return; }
              if (!impReason.trim()) { ping('A reason is required — all sessions are logged'); return; }
              const hit = users.find((u) => impUid.includes(u.email.replace(/[^a-z0-9]/gi, '').slice(0, 12)));
              ping(`Impersonation session started (logged): ${impUid}`);
              if (hit) setTimeout(() => { window.location.href = `${BASE}/app/${roleConsole(hit.role)}/`; }, 900);
            }}>Start View as User Session</button>

            <h2>Open tickets</h2>
            {tickets.map((t, i) => (
              <div className="row" key={t.id}>
                <div><b>{t.id} — {t.topic}</b><small>{t.who}</small></div>
                <span className={t.status === 'resolved' ? 'ok' : 'chip'}>{t.status}</span>
                {t.status !== 'resolved' && <span className="acts"><button className="sm" onClick={() => setTicket(i, 'resolved')}>Resolve</button></span>}
              </div>
            ))}
          </section>
        )}

        {sec === 'inbox' && (
          <section>
            <h1>Contact inbox</h1>
            <p className="sub">Click a message or email to read the full enquiry. Reply directly from the inbox via SMTP.</p>

            <h2 style={{ marginTop: 0 }}>Email delivery &amp; test</h2>
            <p className="note" style={{ marginTop: 0 }}>Welcome emails, top-up receipts, and contact form notifications all use SMTP. Send a test message to confirm your server can deliver mail.</p>
            <div className="panelw">
              <small>Server env (live): smtp.hostinger.com:465 · user contact@studyear.com · password 11 characters (compare with local — should match exactly)</small>
            </div>
            <div className="panelw err-b">
              <b>SMTP connection failed</b>
              <small>SMTP login rejected (535) — the mailbox username or password is wrong. Use the full email as MAIL_USERNAME (e.g. contact@studyear.com). MAIL_PASSWORD must be the mailbox webmail password (Hostinger → Emails → Manage → reset if unsure), not your hPanel login. After resetting, update Firebase App Hosting env vars and redeploy. If email uses Titan, try MAIL_SMTP_HOST=smtp.titan.email</small>
              <small>· Log in at Hostinger webmail with the same email/password — if that fails, reset the mailbox password in hPanel → Emails.</small>
              <small>· After changing Firebase env vars, trigger a new rollout — old containers keep the previous password until redeployed.</small>
              <small>· Check Server env (live) above: password length must match your mailbox password exactly (often 11 chars for this account).</small>
              <small>· Re-save MAIL_PASSWORD with no spaces or quotes; prefer Firebase Secret Manager for passwords containing @.</small>
              <small>· Try MAIL_SMTP_HOST=smtp.titan.email if your mailbox uses Titan.</small>
              <small>Contact form submissions still appear in Contact inbox.</small>
            </div>
            <div className="form2">
              <label>Send test email to<input defaultValue="contact@studyear.com" id="test-to" /></label>
            </div>
            <p>
              <button className="primary" onClick={() => ping('Test email queues when the SMTP backend is reachable from this deployment')}>Send test email</button>{' '}
              <button className="primary ghosted" onClick={() => ping('Status refresh runs on the live deployment env')}>Refresh status</button>
            </p>

            <h2>Contact inbox</h2>
            <p className="note" style={{ marginTop: 0 }}>Contact form delivers to <b>contact@studyear.com</b> — set in Admin → Settings → Contact inbox email, or via CONTACT_INBOX_EMAIL env var.</p>
            <h2 style={{ fontSize: 15, margin: '18px 0 8px' }}>Submissions</h2>
            <p className="note" style={{ marginTop: 0 }}>{msgs.length} messages — click to open and read (emails masked in this public preview)</p>
            <div className="tscroll">
            <table>
              <thead><tr><th>Date</th><th>From</th><th>Type</th><th>Message</th><th>Status</th></tr></thead>
              <tbody>
                {msgs.map((m, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => {
                    setOpenMsg(openMsg === i ? null : i);
                    if (m.status === 'NEW') { const n = msgs.map((x, j) => j === i ? { ...x, status: 'READ' as const } : x); setMsgs(n); save('inbox', n); }
                  }}>
                    <td style={{ whiteSpace: 'nowrap' }}>{m.date}</td>
                    <td>{m.name}<small className="lnk">{m.email}</small></td>
                    <td><span className="chip">{m.type}</span></td>
                    <td style={{ maxWidth: 260 }}>{openMsg === i ? (
                      <span>{m.body}<br />
                        <button className="sm" style={{ marginTop: 6 }} onClick={(e) => { e.stopPropagation(); const n = msgs.map((x, j) => j === i ? { ...x, status: 'REPLIED' as const } : x); setMsgs(n); save('inbox', n); ping('Reply sends via SMTP once the mail connection is fixed'); }}>Reply</button>
                      </span>
                    ) : (<span>{m.body.slice(0, 26)}{m.body.length > 26 ? '…' : ''}<small className="lnk">Read message →</small></span>)}</td>
                    <td><span className={m.status === 'NEW' ? 'ok' : m.status === 'REPLIED' ? 'chip' : 'bad2'}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {sec === 'settings' && (
          <section>
            <h1>System &amp; AI Settings</h1>
            <p className="sub">Control AI rate limits, feature flags, email delivery, and other global settings.</p>

            <h2 style={{ marginTop: 0 }}>Email delivery &amp; test</h2>
            <div className="panelw">
              <small>Server env (live): smtp.hostinger.com:465 · user contact@studyear.com · password 11 characters (compare with local — should match exactly)</small>
              <small className="warn">SMTP connection failed — login rejected (535). See the full checklist in Contact inbox.</small>
              <span><button className="sm" onClick={() => ping('Test email queues when the SMTP backend is reachable')}>Send test email</button>{' '}
              <button className="sm ghost" onClick={() => go('inbox')}>View contact inbox</button></span>
            </div>

            <h2>Message copy &amp; contact addresses</h2>
            <p className="note" style={{ marginTop: 0 }}>Inbox routing and email templates. Use the Email delivery &amp; test panel above to send a test message.</p>
            <div className="form2">
              <label>Company name (contact page)<input defaultValue="StudYear Ltd." /></label>
              <label>Registered address (contact page)<input defaultValue="123 Learning Lane, London, UK, SW1A 0AA" /></label>
              <label>Support email (displayed)<input defaultValue="contact@studyear.com" /></label>
              <label>Contact inbox email<input defaultValue="contact@studyear.com" /></label>
              <label>Outbound sender (reference)<input defaultValue="noreply@studyear.com" /></label>
              <label>Forgot password — page description<input defaultValue="Enter your email and we'll send you a link to reset your password." /></label>
              <label>Forgot password — success title<input defaultValue="Check your inbox" /></label>
              <label>Forgot password — success message<input defaultValue="If an account exists for that email, we sent a password reset link. Check spam or contact support." /></label>
              <label>Contact form — success title<input defaultValue="Message sent" /></label>
              <label>Contact form — success message<input defaultValue="Thank you for contacting us. We will get back to you shortly." /></label>
              <label>Signup welcome email — subject<input defaultValue="Account created" /></label>
              <label>Signup welcome email — body<input defaultValue="You can now complete your profile." /></label>
            </div>
            <p>
              <button className="primary" onClick={() => ping('Communications copy saved')}>Save communications</button>{' '}
              <button className="primary ghosted" onClick={() => go('inbox')}>View contact inbox</button>
            </p>

            <h2>Feature Flags</h2>
            <p className="note" style={{ marginTop: 0 }}>Globally enable or disable key platform features.</p>
            {[['tutorMarketplace', 'Tutor Marketplace'], ['parentDashboard', 'Parent Dashboard'], ['schoolPortal', 'School Portal'], ['aiFeedbackEngine', 'AI Feedback Engine (Premium)']].map(([k, label]) => (
              <div className="row" key={k}>
                <div><b>{label}</b></div>
                <button className={`tog ${settings[k] !== false ? 'on' : ''}`} onClick={() => toggle(k)} aria-label={`toggle ${label}`}><i /></button>
              </div>
            ))}

            <h2>Pricing &amp; Billing Rules</h2>
            <p className="note" style={{ marginTop: 0 }}>Adjust core financial parameters for the platform.</p>
            <div className="form2">
              <label>ACU Pricing Multiplier<input defaultValue="3" /><small className="hint">User charge = internal AI cost × this multiplier.</small></label>
              <label>Tutor Marketplace Commission (%)<input defaultValue="20" /><small className="hint">The platform&apos;s cut on tutor bookings.</small></label>
            </div>

            <h2>AI Provider Settings</h2>
            <p className="note" style={{ marginTop: 0 }}>Control the AI models and providers in use. Admin accounts have no AI usage limits.</p>
            <div className="form2">
              <label>Default Provider<select defaultValue="OpenAI"><option>OpenAI</option><option>Google Gemini</option><option>Google Vertex AI</option></select></label>
              <label>Fallback Provider<select defaultValue="OpenAI"><option>OpenAI</option><option>Google Gemini</option><option>Google Vertex AI</option></select></label>
              <label>OpenAI — Cost-Effective<input defaultValue="gpt-4-turbo" /></label>
              <label>OpenAI — Performance<input defaultValue="gpt-4o" /></label>
              <label>Google Gemini — Cost-Effective<input defaultValue="gemini-2.5-flash" /></label>
              <label>Google Gemini — Performance<input defaultValue="gemini-2.5-pro" /></label>
              <label>Google Vertex AI — Cost-Effective<input defaultValue="gemini-2.5-flash" /></label>
              <label>Google Vertex AI — Performance<input defaultValue="gemini-2.5-pro" /></label>
            </div>
            <button className="primary" onClick={() => ping('Provider settings apply live once the AI gateway backend is deployed')}>Save AI settings</button>
          </section>
        )}
      </main>
    </div>
  );
}

const CSS = `
  .adm{display:grid;grid-template-columns:236px 1fr;min-height:100vh;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  .adm a{text-decoration:none;color:inherit}
  .adm aside{border-right:1px solid rgba(77,157,224,.14);padding:20px 14px;display:flex;flex-direction:column;gap:18px;
    background:rgba(11,18,32,.6);position:sticky;top:0;height:100vh;overflow-y:auto}
  .adm .logo{font-family:Georgia,serif;font-size:19px;color:#EDF1F8;display:inline-flex;align-items:center;gap:9px;padding:0 8px}
  .adm .logo b{color:#4FA6E0;font-weight:600}
  .adm .tag{font-size:9px;letter-spacing:.2em;border:1px solid rgba(79,166,224,.5);border-radius:4px;padding:2px 5px;color:#5FA8E0}
  .adm nav{display:flex;flex-direction:column;gap:2px}
  .adm nav button{appearance:none;display:flex;align-items:center;gap:11px;background:none;border:none;border-radius:9px;
    color:#AAB6CC;font:500 13.5px inherit;padding:10px 12px;cursor:pointer;text-align:left}
  .adm nav button:hover{color:#EDF1F8;background:rgba(77,157,224,.08)}
  .adm nav button.on{color:#A9CFF2;background:rgba(77,157,224,.14)}
  .adm nav .ic{width:18px;text-align:center}
  .adm .me{margin-top:auto;border-top:1px solid rgba(77,157,224,.14);padding:14px 8px 4px;font-size:12.5px}
  .adm .me b{display:block;color:#EDF1F8}
  .adm .me small{display:block;color:#6B7A96;margin:2px 0 10px;word-break:break-all}
  .adm .me button{appearance:none;background:none;border:1px solid rgba(170,182,204,.3);border-radius:8px;
    color:#AAB6CC;font:600 12px inherit;padding:7px 13px;cursor:pointer}
  .adm .me button:hover{color:#A9CFF2;border-color:#3D8FD1}
  .adm main{padding:34px 38px 70px;max-width:1160px}
  .adm h1{font-family:Georgia,serif;font-weight:500;font-size:30px;letter-spacing:-.01em;margin:0}
  .adm .sub{color:#AAB6CC;font-weight:300;margin:8px 0 24px;font-size:14.5px}
  .adm h2{font-family:Georgia,serif;font-weight:500;font-size:19px;color:#A9CFF2;margin:34px 0 12px}
  .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:8px}
  .kpi{border:1px solid rgba(77,157,224,.14);border-radius:12px;padding:14px 16px;background:rgba(16,27,51,.5)}
  .kpi .v{font-family:Georgia,serif;font-size:26px;color:#A9CFF2;line-height:1.1}
  .kpi .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#6B7A96;margin-top:6px}
  .kpi .ks{font-size:10px;color:#4d5a75;margin-top:3px}
  .form2{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px;margin:14px 0}
  .form2 label,.wide{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6B7A96}
  .form2 input,.form2 select,.wide input{display:block;width:100%;margin-top:5px;background:rgba(6,11,24,.7);
    border:1px solid rgba(170,182,204,.25);border-radius:8px;color:#EDF1F8;font:400 13.5px inherit;padding:9px 11px;
    text-transform:none;letter-spacing:0}
  .form2 .hint{display:block;font-size:11px;color:#4d5a75;margin-top:4px;text-transform:none;letter-spacing:0}
  .wide{margin:8px 0}
  .panelw{border:1px solid rgba(77,157,224,.2);border-radius:12px;padding:14px 18px;background:rgba(16,27,51,.5);
    margin:12px 0;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
  .panelw b{font-size:13.5px;color:#EDF1F8}
  .panelw small{font-size:12px;color:#AAB6CC}
  .panelw.ok-b{border-color:rgba(92,187,123,.4)}
  .panelw.err-b{border-color:rgba(230,103,103,.45);background:rgba(230,103,103,.06)}
  .panelw .warn,.warn{color:#e0b060}
  .bad2{font-size:11.5px;color:#6B7A96}
  .econ{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  .ecard{border:1px solid rgba(77,157,224,.14);border-radius:12px;padding:16px 18px;background:rgba(16,27,51,.5)}
  .ecard .ek{font-size:13px;font-weight:600;color:#EDF1F8}
  .ecard .es{font-size:11.5px;color:#6B7A96;margin:2px 0 10px}
  .ecard .ev{font-family:Georgia,serif;font-size:30px;color:#A9CFF2}
  .ecard .ed{font-size:12px;color:#AAB6CC;margin-top:4px}
  .ecard a{color:#5FA8E0}
  .mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:34px}
  .mcard{border:1px solid rgba(77,157,224,.14);border-radius:12px;padding:16px 18px;background:rgba(16,27,51,.5);display:flex;flex-direction:column}
  .mcard h3{font-size:14px;font-weight:600;margin:0 0 6px}
  .mcard p{font-size:12.5px;color:#AAB6CC;margin:0 0 12px;flex:1}
  .mcard button,.primary{appearance:none;align-self:flex-start;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;
    background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff;font:600 12.5px inherit}
  .primary{margin-top:6px;padding:10px 18px;font-size:13px}
  .primary.ghosted{background:none;border:1px solid rgba(79,166,224,.5);color:#A9CFF2}
  .tscroll{overflow-x:auto}
  .adm table{width:100%;border-collapse:collapse;font-size:13px}
  .adm th{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#6B7A96;text-align:left;
    padding:8px 10px;border-bottom:1px solid rgba(77,157,224,.14);white-space:nowrap}
  .adm td{padding:9px 10px;border-bottom:1px solid rgba(170,182,204,.08);color:#AAB6CC;vertical-align:top}
  .adm td:first-child{color:#EDF1F8}
  .adm td small.lnk{display:block;color:#6B7A96;font-size:11px;margin-top:2px}
  .adm .mono{font-family:ui-monospace,Menlo,monospace;font-size:12px}
  .adm tr.editing{background:rgba(77,157,224,.06)}
  .adm td input,.adm td select{background:rgba(6,11,24,.7);border:1px solid rgba(79,166,224,.4);border-radius:7px;
    color:#EDF1F8;font:400 12.5px inherit;padding:6px 8px;max-width:170px}
  .chip{font-size:11px;border:1px solid rgba(170,182,204,.3);border-radius:20px;padding:3px 10px;color:#AAB6CC;white-space:nowrap}
  .ok{font-size:11.5px;color:#5CBB7B}
  .bad{font-size:11.5px;color:#e66767}
  .row{display:flex;align-items:center;gap:14px;border:1px solid rgba(77,157,224,.14);border-radius:11px;
    padding:13px 16px;margin-bottom:9px;background:rgba(16,27,51,.45)}
  .row>div{flex:1}
  .row b{font-size:13.5px;color:#EDF1F8;display:block}
  .row small{font-size:11.5px;color:#6B7A96}
  .acts{display:flex;gap:6px;flex-wrap:wrap}
  .sm,.btnlink{appearance:none;border:1px solid rgba(79,166,224,.45);background:rgba(77,157,224,.1);color:#A9CFF2;
    font:600 11.5px inherit;border-radius:7px;padding:5px 10px;cursor:pointer;display:inline-block;white-space:nowrap}
  .sm.ghost{border-color:rgba(170,182,204,.3);background:none;color:#AAB6CC}
  .sm.danger{border-color:rgba(230,103,103,.5);background:rgba(230,103,103,.08);color:#f0b3b3}
  .sm:disabled{opacity:.45;cursor:default}
  .note{font-size:12px;color:#6B7A96;font-style:italic;margin-top:12px}
  .chart{width:100%;max-width:680px;border:1px solid rgba(77,157,224,.14);border-radius:12px;background:rgba(16,27,51,.4);padding:6px}
  .tog{appearance:none;width:46px;height:26px;border-radius:20px;border:1px solid rgba(170,182,204,.3);background:rgba(6,11,24,.6);
    position:relative;cursor:pointer;flex:none}
  .tog i{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#6B7A96;transition:all .18s}
  .tog.on{border-color:#3D8FD1;background:rgba(61,143,209,.25)}
  .tog.on i{left:23px;background:#5FA8E0}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#101B33;border:1px solid #3D8FD1;
    border-radius:10px;padding:10px 18px;font-size:13px;color:#A9CFF2;z-index:99}
  @media(max-width:900px){.adm{grid-template-columns:1fr}.adm aside{position:static;height:auto;flex-direction:row;flex-wrap:wrap}
    .adm .me{margin:0;border:0}.mgrid,.econ{grid-template-columns:1fr}}
`;
