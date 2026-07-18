/**
 * Level-consistency e2e: a PRIMARY (Year 4 / KS2) student must never be shown
 * GCSE/exam surfaces, and the newly-added modules must not throw on any console.
 * Guards against the recurring "GCSE content for a primary child" class of bug.
 */
import { chromium } from 'playwright-core';
// a crash must surface as a FAIL line the runner counts — never a silent green
process.on('uncaughtException', (e) => { console.log('FAIL — level-test crashed: ' + (e && e.message || e)); process.exit(1); });
process.on('unhandledRejection', (e) => { console.log('FAIL — level-test crashed: ' + (e && e.message || e)); process.exit(1); });
const B = process.env.SY_BASE || 'http://localhost:8137/StudYear';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const results = [];
const ok = (n, c) => results.push((c ? 'PASS' : 'FAIL') + ' — ' + n);
const KS2 = 'Key Stage 2 (Years 3–6 · age 7–11)';

async function page(setup) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => results.push('JSERR — ' + e.message));
  await p.addInitScript(setup);
  return p;
}
const studentInit = (email, level) => `
  localStorage.setItem('sy-session',JSON.stringify({role:'student',name:'Y4',email:'${email}'}));
  localStorage.setItem('sy-u:${email}:profile',JSON.stringify({name:'Y4',level:${JSON.stringify(level)},board:'',subjects:[{s:'Mathematics',current:'Working Towards',target:'Greater Depth'},{s:'English Language',current:'Working Towards',target:'Greater Depth'}]}));
  localStorage.setItem('sy-u:${email}:wallet',JSON.stringify({acus:100,plan:'child_free',month:new Date().toISOString().slice(0,7)}));
`;

/* ---- 1. no runtime errors + primary attainment on the study hub ---- */
{
  const p = await page(studentInit('y4@t.test', KS2));
  await p.goto(B + '/study/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const att = await p.evaluate((lv) => (window.SY && SY.attainment) ? SY.attainment(lv, 62) : null, KS2);
  ok('KS2 attainment returns a KS band (not a GCSE 1–9 grade)',
    !!att && att.system === 'ks2' && /Expected|Greater Depth|Working Towards/.test(att.band) && att.grade == null);
  const bodyTxt = await p.evaluate(() => document.body.innerText);
  // the default study view must not surface exam-board / examiner wording for a primary child
  ok('Study hub (primary) shows no "exam board" wording by default', !/exam board/i.test(bodyTxt));
  await p.context().close();
}

/* ---- 2. SkillRush hides exam-grade skills for a primary child ---- */
{
  const p = await page(studentInit('y4b@t.test', KS2));
  await p.goto(B + '/skillrush/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const skills = await p.evaluate(() => Array.from(document.querySelectorAll('#skills .sk')).map((b) => b.textContent));
  const joined = skills.join(' | ');
  ok('SkillRush (KS2) skill picker excludes Algebra basics', !/algebra/i.test(joined));
  ok('SkillRush (KS2) skill picker excludes Squares & roots', !/squares\s*&\s*roots|squares & roots/i.test(joined));
  ok('SkillRush (KS2) skill picker excludes GCSE formula recall', !/gcse formula/i.test(joined));
  ok('SkillRush (KS2) still offers primary skills (times tables)', /times tables/i.test(joined));
  await p.context().close();
}

/* ---- 3. Profile hides the exam board for primary levels ---- */
{
  const p = await page(studentInit('y4c@t.test', KS2));
  await p.goto(B + '/account/profile/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const boardHidden = await p.evaluate(() => {
    const w = document.getElementById('p-board-wrap');
    return !w || getComputedStyle(w).display === 'none';
  });
  ok('Profile hides the Exam Board field for a KS2 profile', boardHidden);
  await p.context().close();
}

/* ---- 4. primary diagnostic tier + primary recovery topics ---- */
{
  const email = 'y4d@t.test';
  const p = await page(studentInit(email, KS2) + `
    localStorage.setItem('sy-u:${email}:diagnostics',JSON.stringify([{when:new Date().toISOString(),risk:'HIGH',avg:44,list:[
      {s:'Mathematics',mastery:40,target:'Greater Depth'},{s:'English Language',mastery:46,target:'Greater Depth'}],
      weak:[{s:'Mathematics',mastery:40},{s:'English Language',mastery:46}]}]));
  `);
  await p.goto(B + '/study/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  // diagTopics is the single source of recovery/lesson topics — check it is primary
  const topics = await p.evaluate(() => {
    try { return { m: diagTopics('Mathematics'), e: diagTopics('English Literature'), tier: (typeof dgTier === 'function' ? dgTier() : '?') }; }
    catch (e) { return { err: String(e) }; }
  });
  ok('Diagnostic tier resolves to primary for a KS2 profile', topics.tier === 'primary');
  const allTopics = JSON.stringify(topics.m || []) + JSON.stringify(topics.e || []);
  ok('Primary recovery topics contain NO GCSE set texts (An Inspector Calls / Macbeth)',
    !/inspector calls|macbeth|quadratic|photosynthesis|cold war/i.test(allTopics));
  ok('Primary maths topics are primary (place value / times tables / fractions)',
    /place value|times tables|multiplication|fractions|addition/i.test(JSON.stringify(topics.m || [])));
  await p.context().close();
}

/* ---- 5b. Career Passport shows a child explorer, NOT UCAS/university ---- */
{
  const p = await page(studentInit('y4e@t.test', KS2));
  await p.goto(B + '/career/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const h1 = (document.querySelector('h1') || {}).textContent || '';
    const paths = (document.getElementById('paths') || {}).innerText || '';
    const aiCard = document.getElementById('ai-impact-card');
    return { h1, paths, aiHidden: !aiCard || getComputedStyle(aiCard).display === 'none' };
  });
  ok('Career Passport (KS2) uses the Explorer header, not UCAS pathways', /Explorer Passport/i.test(r.h1));
  ok('Career Passport (KS2) shows NO university/UCAS/apprenticeship/salary to a child',
    !/university|ucas|apprentic|degree|£\d|salary/i.test(r.paths));
  ok('Career Passport (KS2) hides the AI-automation-risk analysis', r.aiHidden);
  await p.context().close();
}

/* ---- 5. the new modules load without throwing on every console ---- */
for (const [role, path, email] of [
  ['teacher', '/teacher/', 'tt@t.test'],
  ['school', '/school/', 'sc@t.test'],
  ['parent', '/parent/', 'pa@t.test'],
]) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => { errs.push(e.message); results.push('JSERR — ' + e.message); });
  await p.addInitScript(`localStorage.setItem('sy-session',JSON.stringify({role:'${role}',name:'T',email:'${email}'}));`);
  await p.goto(B + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  ok('Console loads without a runtime error: ' + role, errs.length === 0);
  await ctx.close();
}

for (const r of results) console.log(r);
await browser.close();
