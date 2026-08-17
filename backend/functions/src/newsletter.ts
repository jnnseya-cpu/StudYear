/**
 * Newsletter content + tokens — the pure, side-effect-free half of the weekly
 * newsletter (no firebase-admin, no network), so it can be unit-tested in
 * isolation. The scheduled send, unsubscribe endpoint and admin controls live
 * in index.ts and import from here.
 *
 * Single source of truth for: the site base URL, the feature catalogue, the
 * unsubscribe-token scheme, and the ISO-week key used for idempotency.
 */
import { createHmac, timingSafeEqual } from 'crypto';

export const SITE = 'https://www.studyear.com';

function nlSecret() { return process.env.NEWSLETTER_SECRET || process.env.STRIPE_WEBHOOK_SECRET || 'studyear-newsletter-v1'; }
export function unsubToken(uid: string) { return createHmac('sha256', nlSecret()).update('unsub:' + uid).digest('hex').slice(0, 32); }
export function verifyUnsub(uid: string, token: string) {
  const a = Buffer.from(unsubToken(uid), 'utf8'); const b = Buffer.from(String(token || ''), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** ISO-8601 week key, e.g. "2026-W33". Stable within a Mon–Sun week. */
export function isoWeekKey(d: Date) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yStart.getTime()) / 86400000) + 1) / 7);
  return t.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

/** The feature catalogue — every item is a real, resolvable page on the site. */
export const NL_FEATURES: Array<{ t: string; d: string; href: string; cta: string }> = [
  { t: 'Free predicted grade in 60 seconds', d: 'No sign-up: enter a recent mark and your exam date, get a predicted grade and a personalised revision plan.', href: '/free/', cta: 'Try the free tool' },
  { t: 'Your AI tutor — teaches the method', d: 'Stuck on a topic? The AI tutor walks you through it step by step instead of just handing over answers.', href: '/app/', cta: 'Open your console' },
  { t: 'A revision plan that adapts to you', d: 'Week-by-week, subject-by-subject, built around your exam dates and where you actually are.', href: '/free/', cta: 'Build my plan' },
  { t: 'Free GCSE Maths plan & predicted grade', d: 'One of 22 subject tools — instant plan and grade for GCSE Maths.', href: '/free/gcse-maths/', cta: 'Open GCSE Maths' },
  { t: 'Free A-Level Biology plan & predicted grade', d: 'Predicted grade and a targeted plan for A-Level Biology in a minute.', href: '/free/alevel-biology/', cta: 'Open A-Level Biology' },
  { t: 'Flashcards & quizzes from any topic', d: 'Turn a topic into active-recall flashcards and a quiz in seconds — the revision that actually works.', href: '/app/', cta: 'Make flashcards' },
  { t: 'Instant essay & answer feedback', d: 'Get examiner-style feedback with specific targets, so you know exactly what lifts your grade.', href: '/app/', cta: 'Mark my work' },
  { t: 'Parents: a heartbeat, not an autopsy', d: 'The parent dashboard flags where your child needs help early — before it shows up on a report card.', href: '/app/', cta: 'See the parent view' },
  { t: 'Past papers & exam practice', d: 'Practise with real exam-style questions and track your predicted grade as it moves.', href: '/app/', cta: 'Start practising' },
  { t: 'Future-Readiness — spot risk early', d: 'How StudYear supports the NEET review: early identification and support, explained.', href: '/blog/', cta: 'Read on the blog' },
  { t: 'For schools & trusts', d: 'A whole-school platform your families can use free — plus government-aligned Future-Readiness tools.', href: '/app/', cta: 'Explore for schools' },
  { t: 'Invite a friend — you both get credits', d: 'Share StudYear with a classmate or another parent and you each earn free AI credits.', href: '/account/', cta: 'Get my invite link' },
  { t: 'Study tips & guides on the blog', d: 'Revision science, exam technique and subject guides — new articles every week.', href: '/blog/', cta: 'Read the blog' },
  { t: 'Manage your plan & credits', d: 'Check your ACU balance, top up, or upgrade — free tier includes 100 ACUs every 3 months.', href: '/account/', cta: 'Open my account' },
];
const NL_INTROS = [
  'Here are a few things in StudYear worth two minutes of your week.',
  'Your weekly nudge — small steps, better grades. Here is what to try next.',
  'Exam season rewards consistency. Here is this week’s pick from StudYear.',
  'A fresh set of tools to move your grades this week.',
];

/** Deterministic weekly issue — rotates the feature window by week number so no
    two consecutive weeks look the same, and the free tool always leads. */
export function nlIssue(weekKey: string) {
  const wn = Number(weekKey.slice(-2)) || 1;
  const intro = NL_INTROS[wn % NL_INTROS.length];
  const start = (wn * 3) % NL_FEATURES.length;
  const picks: typeof NL_FEATURES = [];
  for (let i = 0; i < 5; i++) picks.push(NL_FEATURES[(start + i) % NL_FEATURES.length]);
  if (!picks.some((p) => p.href === '/free/')) picks.unshift(NL_FEATURES[0]);
  const subject = 'StudYear weekly: ' + picks[0].t;
  return { subject, intro, picks };
}

function esc(s: string) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)); }

/** Render the per-recipient email (the unsubscribe link is personal). */
export function nlRender(weekKey: string, uid: string): { subject: string; html: string; text: string; unsubUrl: string } {
  const issue = nlIssue(weekKey);
  const unsub = `${SITE}/unsubscribe?u=${encodeURIComponent(uid)}&t=${unsubToken(uid)}`;
  const B = '#2E6BC4', L = '#4FA6E0';
  const cards = issue.picks.map((f) => {
    const url = SITE + f.href;
    return `<tr><td style="padding:14px 0;border-bottom:1px solid #e6ecf5">` +
      `<a href="${url}" style="color:${B};text-decoration:none;font-size:17px;font-weight:700">${esc(f.t)}</a>` +
      `<div style="color:#42506a;font-size:14px;line-height:1.55;margin:6px 0 10px">${esc(f.d)}</div>` +
      `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${B},${L});color:#fff;text-decoration:none;font-weight:700;border-radius:8px;padding:9px 16px;font-size:14px">${esc(f.cta)} →</a>` +
      `</td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(issue.subject)}</title></head>` +
    `<body style="margin:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 12px"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6ecf5">` +
    `<tr><td style="background:linear-gradient(135deg,#0b3a66,${B});padding:22px 26px"><a href="${SITE}" style="color:#fff;text-decoration:none;font-size:20px;font-weight:800;letter-spacing:.2px">StudYear</a>` +
    `<div style="color:#cfe2fb;font-size:13px;margin-top:3px">Your weekly study boost</div></td></tr>` +
    `<tr><td style="padding:22px 26px 6px"><p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#28344a">${esc(issue.intro)}</p></td></tr>` +
    `<tr><td style="padding:0 26px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table></td></tr>` +
    `<tr><td style="padding:20px 26px"><a href="${SITE}/free/" style="display:inline-block;background:${B};color:#fff;text-decoration:none;font-weight:700;border-radius:10px;padding:13px 22px;font-size:15px">Start free — no sign-up →</a></td></tr>` +
    `<tr><td style="padding:16px 26px 24px;border-top:1px solid #eef2f8;color:#8795ae;font-size:12px;line-height:1.6">` +
    `You’re receiving this because you have a StudYear account. ` +
    `<a href="${unsub}" style="color:${B}">Unsubscribe</a> from the weekly newsletter at any time. ` +
    `&middot; <a href="${SITE}" style="color:${B}">studyear.com</a></td></tr>` +
    `</table></td></tr></table></body></html>`;
  const text = `${issue.intro}\n\n` + issue.picks.map((f) => `• ${f.t}\n  ${f.d}\n  ${SITE}${f.href}`).join('\n\n') +
    `\n\nStart free (no sign-up): ${SITE}/free/\n\nYou're receiving this because you have a StudYear account. Unsubscribe: ${unsub}`;
  return { subject: issue.subject, html, text, unsubUrl: unsub };
}
