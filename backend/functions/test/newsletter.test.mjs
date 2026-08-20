/**
 * Unit tests for the pure newsletter logic (src/newsletter.ts). Run with
 * `npm test` in backend/functions — it builds first, then executes this against
 * the compiled output. No firebase-admin, no network: this covers the ISO-week
 * key (idempotency), the unsubscribe-token scheme (round-trip + tamper), the
 * weekly rotation, and the rendered email (hyperlink count, personal
 * unsubscribe link, escaping, no template leaks).
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const m = await import(join(here, '..', 'lib', 'backend', 'functions', 'src', 'newsletter.js'));
const fails = [];

const a = m.isoWeekKey(new Date('2026-08-17T00:00:00Z')); // Monday
const b = m.isoWeekKey(new Date('2026-08-23T23:00:00Z')); // Sunday, same ISO week
const c = m.isoWeekKey(new Date('2026-08-24T00:00:00Z')); // next Monday
if (a !== b) fails.push('weekKey not stable within a week: ' + a + ' vs ' + b);
if (a === c) fails.push('weekKey did not advance across weeks: ' + a);
if (!/^\d{4}-W\d{2}$/.test(a)) fails.push('weekKey format wrong: ' + a);

const uid = 'user_abc123';
const t = m.unsubToken(uid);
if (!m.verifyUnsub(uid, t)) fails.push('valid token rejected');
if (m.verifyUnsub(uid, t + 'x')) fails.push('tampered token accepted');
if (m.verifyUnsub('other', t)) fails.push('token accepted for wrong uid');
if (m.verifyUnsub(uid, '')) fails.push('empty token accepted');

const w1 = m.nlIssue('2026-W10'), w2 = m.nlIssue('2026-W11');
if (!w1.subject.startsWith('StudYear weekly:')) fails.push('subject prefix wrong');
if (w1.picks.length < 5) fails.push('too few picks');
if (!w1.picks.some((p) => p.href === '/free/')) fails.push('free tool not in issue');
if (w1.picks[0].href === w2.picks[0].href && w1.subject === w2.subject) fails.push('consecutive weeks identical (no rotation)');

const r = m.nlRender('2026-W33', uid);
const links = (r.html.match(/href="/g) || []).length;
if (links < 8) fails.push('too few hyperlinks in email: ' + links);
if (!r.html.includes('/unsubscribe?u=' + uid + '&t=' + t)) fails.push('personal unsubscribe link missing/incorrect');
if (!r.unsubUrl.includes('/unsubscribe?u=' + uid)) fails.push('unsubUrl missing');
if (r.html.includes('${') || r.html.includes('undefined')) fails.push('template leftover/undefined in html');
if (!r.html.includes('https://www.studyear.com/free/')) fails.push('free tool absolute link missing');
if (!r.text.includes('Unsubscribe: https://www.studyear.com/gapi/fn/unsubscribe')) fails.push('text unsubscribe missing/incorrect');
for (const f of m.NL_FEATURES) if (!/^\/(free|app|blog|account)\//.test(f.href) && f.href !== '/') fails.push('suspicious href: ' + f.href);

if (fails.length) { console.error('FAIL newsletter.test:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('newsletter.test PASS — weekKey ' + a + ', token round-trip+tamper, rotation, ' + links + ' hyperlinks, personal unsubscribe, no template leaks.');
