import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const js = readFileSync(join(root, 'apps/web/public/nextsteps.js'), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const fails = [];

await page.goto('about:blank');
await page.setContent('<!doctype html><html><head></head><body><div id="nextsteps-root"></div></body></html>');
await page.evaluate(js);
await page.waitForTimeout(120);

// Renders, defaults to GCSE, has situations + buttons
let r = await page.evaluate(() => {
  const h = document.getElementById('nextsteps-root');
  return { reassure: /breathe/i.test(h.innerHTML), gcseOn: !!h.querySelector('.ns-tab.on[data-stage="gcse"]'), sit: h.querySelectorAll('#ns-sit .ns-chk').length, go: !!h.querySelector('#ns-go'), plan: !!h.querySelector('#ns-plan'), routes: window.SYNext && window.SYNext.routes.length };
});
if (!r.reassure) fails.push('reassurance banner missing');
if (!r.gcseOn) fails.push('GCSE tab not default-selected');
if (!(r.sit >= 4)) fails.push('GCSE situations missing: ' + r.sit);
if (!r.go || !r.plan) fails.push('action buttons missing');
if (!(r.routes >= 12)) fails.push('routes catalogue too small: ' + r.routes);

// GCSE: pick English/Maths -> shows a resit route (primary) with an official link + support helpline
await page.evaluate(() => { document.querySelector('#ns-sit input[value="english_maths"]').checked = true; });
await page.click('#ns-go');
await page.waitForTimeout(150);
let g = await page.evaluate(() => {
  const box = document.getElementById('ns-results');
  return { hasResit: /Resit GCSE English/i.test(box.innerHTML), primary: !!box.querySelector('.ns-card.primary'), gov: /gov\.uk/.test(box.innerHTML), helpline: /0800 100 900/.test(box.innerHTML), doFirst: /Do first:/i.test(box.innerHTML), extLinks: box.querySelectorAll('a.ns-link[target="_blank"][rel~="noopener"]').length };
});
if (!g.hasResit) fails.push('GCSE resit route not shown for english_maths');
if (!g.primary) fails.push('no primary "start here" route');
if (!g.gov || !g.helpline) fails.push('official links / helpline missing');
if (!g.doFirst) fails.push('"Do first" action missing');
if (!(g.extLinks >= 3)) fails.push('too few external route links: ' + g.extLinks);

// Switch to A-Level: Clearing appears
await page.evaluate(() => { document.querySelector('.ns-tab[data-stage="alevel"]').click(); });
await page.waitForTimeout(80);
await page.evaluate(() => { const c = document.querySelector('#ns-sit input[value="no_place"]'); if (c) c.checked = true; });
await page.click('#ns-go');
await page.waitForTimeout(120);
let a = await page.evaluate(() => /UCAS Clearing/i.test(document.getElementById('ns-results').innerHTML) && /ucas\.com/.test(document.getElementById('ns-results').innerHTML));
if (!a) fails.push('A-Level Clearing route/link not shown for no_place');

// AI plan: metered acus:2 + label; then fallback path
await page.evaluate(() => { window.SYAI = { ask: (s, u, o) => { window.__opts = o; return Promise.resolve('YOUR NEXT 7 DAYS\n1. Call admissions.'); } }; });
await page.click('#ns-plan');
await page.waitForTimeout(200);
let pl = await page.evaluate(() => ({ text: document.getElementById('ns-out').textContent, opts: window.__opts }));
if (!/Call admissions/.test(pl.text)) fails.push('AI plan not shown');
if (!pl.opts || pl.opts.acus !== 2) fails.push('plan not metered acus:2 -> ' + JSON.stringify(pl.opts));
if (!pl.opts || !/next-steps/i.test(pl.opts.label || '')) fails.push('plan label wrong');

await page.evaluate(() => { delete window.SYAI; window.SYNext.__x = 1; });
// force offline fallback by making ensureAI fail: remove SYAI and block ai.js load isn't trivial; instead call plan again — ensureAI tries to inject ai.js (404 here) -> fallback
await page.click('#ns-plan');
await page.waitForTimeout(500);
let fb = await page.evaluate(() => document.getElementById('ns-out').textContent);
if (!/NEXT 7 DAYS/i.test(fb) || !/0800 100 900/.test(fb)) fails.push('fallback plan missing/incomplete: ' + fb.slice(0, 80));

await browser.close();
if (fails.length) { console.error('FAIL nextsteps-test:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('NEXTSTEPS TEST PASS — GCSE+A-Level routes with official links + helpline, primary ordering, metered AI plan (acus:2), deterministic fallback.');
