import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nurtureJs = readFileSync(join(root, 'apps/web/public/nurture.js'), 'utf8');

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const fails = [];

await page.goto('about:blank');
await page.setContent('<!doctype html><html><head></head><body><div id="nurture-root"></div></body></html>');
await page.evaluate(() => {
  window.SY = { session: { email: 'admin@studyear.test' }, get: (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } }, set: () => {} };
  // Stub the cloud bridge with two captured leads so the leads pane + CSV path exercise.
  window.SYCloud = {
    leadsList: () => Promise.resolve({ ok: true, items: [
      { id: 'a1', email: 'jane.smith@example.com', source: 'free-gcse-maths', subject: 'GCSE Maths', grade: '5', ref: null, contacted: false, createdAt: '2026-08-10T09:00:00.000Z' },
      { id: 'b2', email: 'tom@example.co.uk', source: 'free', subject: 'A-Level Biology', grade: 'B', ref: 'X1', contacted: true, createdAt: '2026-08-11T09:00:00.000Z' }
    ], counts: { total: 2, notContacted: 1, bySource: { 'free-gcse-maths': 1, 'free': 1 }, bySubject: { 'GCSE Maths': 1, 'A-Level Biology': 1 } } }),
    leadMark: (ids) => { window.__marked = ids; return Promise.resolve(true); }
  };
});
await page.evaluate(nurtureJs);
await page.waitForTimeout(700); // allow waitCloud auto-load

const r = await page.evaluate(() => {
  const h = document.getElementById('nurture-root');
  return {
    heading: /Lifecycle .{0,8}nurture agent/i.test(h.innerHTML),
    chips: h.querySelectorAll('.nu-chip').length,
    gen: !!h.querySelector('#nu-gen'),
    segs: window.SYNurture && window.SYNurture.segments && window.SYNurture.segments.length,
    leadsShown: /2 captured leads/.test(h.innerHTML),
    masked: /j•••@example\.com|ja•••@example\.com/.test(h.innerHTML),
    rawEmailLeaked: /jane\.smith@example\.com/.test(h.innerHTML),
    csvBtn: !!h.querySelector('#nu-csv'),
    markBtn: !!h.querySelector('#nu-mark')
  };
});
if (!r.heading) fails.push('missing heading');
if (!(r.chips >= 5)) fails.push('expected >=5 segment chips, got ' + r.chips);
if (!r.gen) fails.push('missing draft button');
if (!(r.segs >= 5)) fails.push('segments API wrong: ' + r.segs);
if (!r.leadsShown) fails.push('captured leads count not rendered');
if (!r.masked) fails.push('emails not masked in list');
if (r.rawEmailLeaked) fails.push('RAW EMAIL LEAKED into on-screen list (PII mandate breach)');
if (!r.csvBtn || !r.markBtn) fails.push('leads action buttons missing');

// Switch segment (click 3rd chip) then draft with a stubbed AI -> metered acus:3 + label
await page.evaluate(() => { document.querySelectorAll('.nu-chip')[2].click(); });
await page.evaluate(() => {
  window.SYAI = { ask: (sys, user, opts) => { window.__lastOpts = opts; window.__userPrompt = user; return Promise.resolve('=== EMAIL 1 (day 1) ===\nSUBJECT: Do this one thing\nBODY: Hi {{first_name}}, welcome back.\nCTA: Open my free plan → studyear.com/free'); } };
});
await page.click('#nu-gen');
await page.waitForTimeout(300);
const ai = await page.evaluate(() => ({ text: document.getElementById('nu-out').textContent, opts: window.__lastOpts, up: window.__userPrompt }));
if (!/welcome back/.test(ai.text)) fails.push('AI sequence not shown');
if (!ai.opts || ai.opts.acus !== 3) fails.push('nurture not metered at acus:3 -> ' + JSON.stringify(ai.opts));
if (!ai.opts || !/nurture/i.test(ai.opts.label || '')) fails.push('AI label missing/wrong');
if (!/signed up|got started|SEGMENT:/i.test(ai.up || '')) fails.push('user prompt did not reflect selected segment');

// Fallback path: remove SYAI, regenerate -> deterministic sequence with merge field + CTA
await page.evaluate(() => { delete window.SYAI; });
await page.evaluate(() => { document.querySelector('[data-re]') && document.querySelector('[data-re]').click(); });
await page.waitForTimeout(400);
const fb = await page.evaluate(() => document.getElementById('nu-out').textContent);
if (!/EMAIL 1/.test(fb) || !/\{\{first_name\}\}/.test(fb)) fails.push('fallback missing structure/merge field: ' + fb.slice(0, 100));

// Mark all contacted -> only the not-contacted id sent
await page.click('#nu-mark');
await page.waitForTimeout(200);
const marked = await page.evaluate(() => window.__marked);
if (!Array.isArray(marked) || marked.join(',') !== 'a1') fails.push('mark-contacted sent wrong ids: ' + JSON.stringify(marked));

await browser.close();
if (fails.length) { console.error('FAIL nurture-test:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('NURTURE TEST PASS — render, masked leads, metered AI (acus:3), fallback, mark-contacted all OK.');
