import { chromium } from 'playwright-core';
const B = process.env.SY_BASE || 'http://localhost:8137/StudYear';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const results = []; const ok = (n, c) => results.push((c ? 'PASS' : 'FAIL') + ' — ' + n);
const page = await browser.newPage();
page.on('pageerror', e => results.push('JSERR — ' + e.message));

await page.addInitScript(() => {
  localStorage.setItem('sy-session', JSON.stringify({ role: 'student', name: 'T', email: 't@t.test' }));
  localStorage.setItem('sy-u:t@t.test:wallet', JSON.stringify({ acus: 500, plan: 'student_premium', month: new Date().toISOString().slice(0, 7), planExpires: new Date(Date.now() + 20 * 864e5).toISOString() }));
});
await page.goto(B + '/study/', { waitUntil: 'networkidle' });

// The item-memory API is global (classic inline script)
ok('item-memory functions exist', await page.evaluate(() => typeof window.noteReviewItem === 'function' && typeof window.dueReviewItems === 'function' && typeof window.startItemReview === 'function'));

// Miss a question -> it enters the deck and is due now
await page.evaluate(() => { window.noteReviewItem({ q: 'What is 2+2?', o: ['4', '5', '3'], a: 0, exp: 'It is four.' }, 'Maths', false); });
let d1 = await page.evaluate(() => { const d = window.dueReviewItems(); return { n: d.length, q: d[0] && d[0].q, hasOpts: !!(d[0] && d[0].o && d[0].o.length === 3), interval: d[0] && d[0].interval }; });
if (d1.n !== 1) results.push('FAIL — miss did not enter the deck: ' + d1.n); else ok('missed question stored, due now, with its options', d1.q === 'What is 2+2?' && d1.hasOpts && d1.interval === 1);

// Recall it correctly -> interval grows, no longer due now
await page.evaluate(() => { window.noteReviewItem({ q: 'What is 2+2?', o: ['4', '5', '3'], a: 0, exp: 'It is four.' }, 'Maths', true); });
let d2 = await page.evaluate(() => window.dueReviewItems().length);
ok('recall pushes the item into the future (not due now)', d2 === 0);

// A correct answer for a NEVER-missed item must not add anything
await page.evaluate(() => { window.noteReviewItem({ q: 'Capital of France?', o: ['Paris', 'Rome'], a: 0 }, 'Geography', true); });
let total = await page.evaluate(() => { try { return Object.keys(JSON.parse(localStorage.getItem('sy-u:t@t.test:reviewItems') || '{}')).length; } catch (e) { return -1; } });
ok('a correct-first item is NOT tracked (deck stays weakness-only)', total === 1);

// Flashcard misses feed the SAME deck as recall cards
await page.evaluate(() => { window.noteReviewCard('Define: ionic bond', 'Electrostatic attraction between oppositely charged ions', 'Chemistry', false); });
let card = await page.evaluate(() => window.dueReviewItems().some(x => x.kind === 'card' && /ionic bond/.test(x.front || '')));
ok('flashcard miss enters the deck as a recall card', card);

// Miss two questions -> Smart review tab shows the missed-items deck CTA
await page.evaluate(() => {
  window.noteReviewItem({ q: 'What is 2+2?', o: ['4', '5', '3'], a: 0, exp: 'It is four.' }, 'Maths', false);
  window.noteReviewItem({ q: 'H2O is?', o: ['Water', 'Salt'], a: 0, exp: 'Water.' }, 'Science', false);
  window.showTab('smartreview');
});
await page.waitForTimeout(150);
let rv = await page.evaluate(() => {
  const m = document.getElementById('review-mount');
  return { text: /you missed/i.test(m.innerHTML), btn: !!document.getElementById('rv-items'), tabOnlyOne: document.querySelectorAll('#tab-smartreview.on').length === 1 && document.querySelectorAll('#tab-review.on').length === 0 };
});
ok('Smart review surfaces the missed-questions deck', rv.text && rv.btn);
ok('Smart review and Assignment review no longer collide (only smartreview active)', rv.tabOnlyOne);

// Start the item review -> the modal serves the actual missed question
let diag = await page.evaluate(() => ({ due: window.dueReviewItems().length, mountHtml: (document.getElementById('review-mount') || {}).innerHTML ? (document.getElementById('review-mount').innerHTML.slice(0, 200)) : 'EMPTY', hasBtn: !!document.getElementById('rv-items') }));
if (!diag.hasBtn) results.push('FAIL — #rv-items missing (due=' + diag.due + ') mount=' + diag.mountHtml);
if (diag.hasBtn) {
  await page.evaluate(() => window.startItemReview());
  await page.waitForTimeout(150);
  let modalHasQ = await page.evaluate(() => { const b = document.getElementById('modal-body'); return document.getElementById('modal').classList.contains('on') && (/2\+2/.test(b.innerText) || /H2O/.test(b.innerText) || /ionic bond/.test(b.innerText)); });
  ok('Review serves an actual missed item (question or card), not a fresh one', modalHasQ);
}

await browser.close();
const bad = results.filter(r => /^(FAIL|JSERR)/.test(r));
for (const r of results) console.log(r);
if (bad.length) process.exit(1);
console.log('REVIEW-MEMORY TEST PASS');
