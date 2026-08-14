import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const socialJs = readFileSync(join(root, 'apps/web/public/social.js'), 'utf8');

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const fails = [];

// Case A: no SYAI available -> generate must fall back deterministically
await page.setContent('<div id="social-root"></div>');
await page.addInitScript(() => {
  window.SY = { get: (k) => JSON.parse(localStorage.getItem(k) || 'null'), set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
});
// re-set content after init script by reloading a blank doc
await page.goto('about:blank');
await page.setContent('<!doctype html><html><head></head><body><div id="social-root"></div></body></html>');
await page.evaluate(() => {
  window.SY = { get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
});
await page.evaluate(socialJs);
await page.waitForTimeout(150);

const rendered = await page.evaluate(() => {
  const h = document.getElementById('social-root');
  return { hasHeading: /Social content autopilot/.test(h.innerHTML), hasGen: !!h.querySelector('#so-gen'), hasBatch: !!h.querySelector('#so-batch'), hasCard: /\bcard\b/.test(h.className), today: window.SYSocial && window.SYSocial.today && window.SYSocial.today().t, calLen: window.SYSocial && window.SYSocial.calendar && window.SYSocial.calendar.length };
});
if (!rendered.hasHeading) fails.push('missing heading');
if (!rendered.hasGen || !rendered.hasBatch) fails.push('missing action buttons');
if (!rendered.hasCard) fails.push('mount did not add card class');
if (!rendered.today) fails.push('today() returned nothing');
if (!(rendered.calLen >= 20)) fails.push('calendar too short: ' + rendered.calLen);

// Trigger generate -> with no SYAI, ensureAI injects ai.js (404 in this harness) -> should fall to fallback text
await page.click('#so-gen');
await page.waitForTimeout(1200);
const out = await page.evaluate(() => { const o = document.getElementById('so-out'); return { hidden: o.hidden, text: o.textContent }; });
if (out.hidden) fails.push('output stayed hidden after generate');
if (!out.text || out.text.length < 40) fails.push('fallback produced no usable text: ' + JSON.stringify(out.text));
if (/HOOK|SCRIPT|CAPTION|studyear\.com\/free|Best time/i.test(out.text) === false) fails.push('output missing expected structure/CTA: ' + out.text.slice(0, 120));

// Case B: with a stubbed SYAI.ask, generate should use the AI path and charge acus
await page.evaluate(() => {
  window.SYAI = { ask: (sys, user, opts) => { window.__lastOpts = opts; return Promise.resolve('HOOK: Test\nSCRIPT: film this\nCAPTION: link in bio → studyear.com/free\nHASHTAGS: #gcse\nBEST TIME: 4pm'); } };
});
await page.click('#so-gen');
await page.waitForTimeout(400);
const aiOut = await page.evaluate(() => ({ text: document.getElementById('so-out').textContent, opts: window.__lastOpts }));
if (!/film this/.test(aiOut.text)) fails.push('AI path output not shown');
if (!aiOut.opts || aiOut.opts.acus !== 2) fails.push('AI call not metered at acus:2 -> ' + JSON.stringify(aiOut.opts));
if (!aiOut.opts || !/social/i.test(aiOut.opts.label || '')) fails.push('AI call label missing');

await browser.close();
if (fails.length) { console.error('FAIL social-test:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('SOCIAL TEST PASS — render, fallback, metered AI path all OK. today="' + rendered.today + '" cal=' + rendered.calLen);
