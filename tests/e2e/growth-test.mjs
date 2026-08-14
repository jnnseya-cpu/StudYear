import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const growthJs = readFileSync(join(root, 'apps/web/public/growth.js'), 'utf8');

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const fails = [];

async function fresh(role) {
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.setContent('<!doctype html><html><head></head><body><div id="growth-root"></div></body></html>');
  await page.evaluate((r) => {
    window.SY = { session: { role: r, email: 'admin@studyear.test', name: 'StudYear' } };
    window.SYCloud = {
      leadsList: () => Promise.resolve({ ok: true, items: [
        { id: 'a1', email: 'jane.smith@example.com', source: 'free-gcse-maths', subject: 'GCSE Maths', grade: '5', ref: null, contacted: false, createdAt: '2026-08-10T09:00:00.000Z' },
        { id: 'b2', email: 'tom@example.co.uk', source: 'free', subject: 'A-Level Biology', grade: 'B', ref: 'X1', contacted: true, createdAt: '2026-08-11T09:00:00.000Z' }
      ], counts: { total: 2, notContacted: 1, bySource: { 'free-gcse-maths': 1, 'free': 1 }, bySubject: {} } }),
      leadMark: (ids) => { window.__marked = ids; return Promise.resolve(true); }
    };
  }, role);
  await page.evaluate(growthJs);
  await page.waitForTimeout(120);
  return page;
}

// --- Partner (tutor): 10 tools, no owner-only tools ---
let page = await fresh('tutor');
let partner = await page.evaluate(() => ({
  tiles: document.querySelectorAll('.sy-g-tile').length,
  hasCalendar: !!document.querySelector('.sy-g-tile[data-tool="calendar"]'),
  hasLeads: !!document.querySelector('.sy-g-tile[data-tool="leads"]'),
  toolsApi: window.SYGrowth && window.SYGrowth.tools && window.SYGrowth.tools.length
}));
if (partner.tiles !== 10) fails.push('partner should see 10 tools, saw ' + partner.tiles);
if (partner.hasCalendar || partner.hasLeads) fails.push('owner-only tools leaked into a partner console');
// partner standard tool still meters
await page.evaluate(() => { window.SYAI = { canAfford: () => true, balance: () => 100, ask: (s, u, o) => { window.__opts = o; return Promise.resolve('1. Post\n2. Post\n3. Post'); }, render: (t) => '<p>' + t + '</p>' }; });
await page.click('.sy-g-tile[data-tool="email"]');
await page.fill('[data-k="goal"]', 'fill summer course');
await page.click('.sy-g-run');
await page.waitForTimeout(200);
let pOpts = await page.evaluate(() => window.__opts);
if (!pOpts || pOpts.acus !== 2) fails.push('partner email tool not metered acus:2 -> ' + JSON.stringify(pOpts));
await page.close();

// --- Admin: 12 tools incl. calendar + leads ---
page = await fresh('admin');
let admin = await page.evaluate(() => ({
  tiles: document.querySelectorAll('.sy-g-tile').length,
  hasCalendar: !!document.querySelector('.sy-g-tile[data-tool="calendar"]'),
  hasLeads: !!document.querySelector('.sy-g-tile[data-tool="leads"]')
}));
if (admin.tiles !== 12) fails.push('admin should see 12 tools, saw ' + admin.tiles);
if (!admin.hasCalendar || !admin.hasLeads) fails.push('owner-only tools missing in admin');

// Calendar tool: metered acus:2 + label
await page.evaluate(() => { window.SYAI = { canAfford: () => true, balance: () => 100, ask: (s, u, o) => { window.__opts = o; return Promise.resolve('HOOK: x\nSCRIPT: film\nCAPTION: studyear.com/free'); }, render: (t) => '<p>' + t + '</p>' }; });
await page.click('.sy-g-tile[data-tool="calendar"]');
await page.waitForTimeout(80);
await page.click('.sy-g-panel .sy-g-run');
await page.waitForTimeout(200);
let cOpts = await page.evaluate(() => window.__opts);
if (!cOpts || cOpts.acus !== 2) fails.push('calendar not metered acus:2 -> ' + JSON.stringify(cOpts));
if (!cOpts || !/content calendar/i.test(cOpts.label || '')) fails.push('calendar label wrong -> ' + JSON.stringify(cOpts && cOpts.label));

// Leads tool: masked list (no raw email leak), draft metered acus:3, mark sends only not-contacted id
await page.click('.sy-g-tile[data-tool="leads"]');
await page.waitForTimeout(300);
let leadsView = await page.evaluate(() => ({
  html: document.querySelector('#sy-g-leads').innerHTML,
  count: /2 captured leads/.test(document.querySelector('#sy-g-leads').innerHTML),
  raw: /jane\.smith@example\.com/.test(document.querySelector('#sy-g-leads').innerHTML),
  masked: /@example\.com/.test(document.querySelector('#sy-g-leads').innerHTML)
}));
if (!leadsView.count) fails.push('captured lead count not shown');
if (leadsView.raw) fails.push('RAW EMAIL LEAKED on-screen (PII mandate breach)');
if (!leadsView.masked) fails.push('masked emails not rendered');
await page.click('.sy-g-panel .sy-g-draft');
await page.waitForTimeout(200);
let dOpts = await page.evaluate(() => window.__opts);
if (!dOpts || dOpts.acus !== 3) fails.push('nurture draft not metered acus:3 -> ' + JSON.stringify(dOpts));
if (!dOpts || !/nurture/i.test(dOpts.label || '')) fails.push('nurture label wrong');
await page.click('.sy-g-panel .sy-g-mark');
await page.waitForTimeout(150);
let marked = await page.evaluate(() => window.__marked);
if (!Array.isArray(marked) || marked.join(',') !== 'a1') fails.push('mark-contacted sent wrong ids: ' + JSON.stringify(marked));
await page.close();

await browser.close();
if (fails.length) { console.error('FAIL growth-test:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('GROWTH TEST PASS — partner 10 tools (metered), admin 12 incl. calendar (acus:2) + leads (masked, nurture acus:3, mark ids), no PII leak.');
