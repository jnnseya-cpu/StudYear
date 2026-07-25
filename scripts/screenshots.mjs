/**
 * Capture a screenshot of every StudYear surface — as admin AND as each user
 * role — from the built static export. Runs in CI (clean Chromium), writes PNGs
 * + an index.html gallery to screenshots/, which the workflow uploads as an
 * artifact. Uses the SAME seeding as the e2e suites so the shots are realistic.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SY_OUT || join(ROOT, 'apps/web/out');
/* Commit into the repo so GitHub renders the gallery inline in the browser
   (README.md with relative images) — no artifact download needed. */
const SHOTS = join(ROOT, 'docs/screenshots');
mkdirSync(SHOTS, { recursive: true });
const PORT = 8321;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.ico':'image/x-icon' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/StudYear')) p = p.slice(9);
  if (!p) p = '/'; if (p.endsWith('/')) p += 'index.html';
  let f = join(OUT, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) f = join(OUT, p + '.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(PORT, r));
const B = `http://localhost:${PORT}/StudYear`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const shots = [];

async function ctx(seed) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const pg = await c.newPage();
  pg.__err = null; pg.on('pageerror', e => { if (!pg.__err) pg.__err = e.message; });
  if (seed) await pg.addInitScript(seed);
  return { c, pg };
}
async function snap(pg, id, title) {
  try { await pg.screenshot({ path: join(SHOTS, id + '.png'), fullPage: true }); shots.push({ id, title, ok: !pg.__err, err: pg.__err }); }
  catch (e) { shots.push({ id, title, ok: false, err: e.message }); }
  process.stdout.write((pg.__err ? 'WARN ' : 'OK   ') + id + '\n');
}
async function demo(pg, role, mode) {
  await pg.goto(B + '/demo/', { waitUntil: 'networkidle' });
  await pg.click(`#card-${role} button[data-m="${mode}"]`);
  await pg.waitForURL(u => !/\/demo\//.test(u.pathname), { timeout: 15000 });
  await pg.waitForLoadState('networkidle'); await pg.waitForTimeout(900);
}
async function tab(pg, t) { try { await pg.evaluate(x => window.showTab && window.showTab(x), t); await pg.waitForTimeout(800); } catch (e) {} }

/* ---------------- PUBLIC ---------------- */
{
  const { c, pg } = await ctx();
  await pg.goto(B + '/landing.html', { waitUntil: 'networkidle' }).catch(()=>{}); await pg.waitForTimeout(700); await snap(pg, '01-public-landing', 'Landing page');
  await pg.goto(B + '/demo/', { waitUntil: 'networkidle' }).catch(()=>{}); await pg.waitForTimeout(700); await snap(pg, '02-public-demo-hub', 'Demo hub (all roles)');
  await pg.goto(B + '/auth/?role=student', { waitUntil: 'networkidle' }).catch(()=>{}); await pg.waitForTimeout(700); await snap(pg, '03-public-signin', 'Sign in — Student');
  await c.close();
}

/* ---------------- STUDENT (study hub, demo loaded) ---------------- */
{
  const { c, pg } = await ctx();
  try {
    await demo(pg, 'student', 'loaded');
    const tabs = [['today','Today'],['mastery','Mastery'],['path','Adaptive Path'],['explain','Explain My Mistake'],['leagues','Fair Leagues'],['examsim','Exam Simulator'],['review','Smart Review'],['wins','Achievements'],['create','Create Tools'],['search','Find Resources'],['progress','Progress']];
    let i = 10;
    for (const [t, label] of tabs) { await tab(pg, t); await snap(pg, (i++) + '-student-' + t, 'Student · ' + label); }
  } catch (e) { shots.push({ id: 'student', title: 'Student', ok: false, err: e.message }); }
  await c.close();
}

/* ---------------- ADMIN (seeded like admin-test) ---------------- */
{
  const NOW = '2026-01-01T00:00:00.000Z';
  const seed = (now) => { try {
    localStorage.setItem('sy-session', JSON.stringify({ role:'admin', name:'Ops', email:'admin@studyear.com' }));
    localStorage.setItem('sy-users', JSON.stringify([
      { email:'admin@studyear.com', role:'admin', name:'Platform Admin', created:now },
      { email:'emily@customer.example', role:'student', name:'Emily C', created:now },
      { email:'marcus@customer.example', role:'parent', name:'Marcus C', created:now },
      { email:'tandi@customer.example', role:'tutor', name:'Tandi T', created:now }]));
    localStorage.setItem('sy-u:emily@customer.example:wallet', JSON.stringify({ acus:700, plan:'student_premium' }));
    localStorage.setItem('sy-u:emily@customer.example:activity', JSON.stringify([
      { k:'billing', t:'Assignment review: Macbeth — 60 ACUs', d:'640 ACUs remaining.', when:now },
      { k:'lesson', t:'Interactive lesson: Quadratics', d:'GCSE', when:now },
      { k:'quiz', t:'Physics checkpoint', d:'72%', when:now }]));
    localStorage.setItem('sy-tutors', JSON.stringify([{ id:'tu1', email:'tandi@customer.example', name:'Tandi T', head:'Maths tutor', rate:38, subjects:'Maths, Physics' }]));
    localStorage.setItem('sy-ai-usage', JSON.stringify([
      { email:'emily@customer.example', name:'Emily C', provider:'openai', model:'gpt-4o', ms:9050, ok:true, gbp:0.0068, when:now },
      { email:'emily@customer.example', name:'Emily C', provider:'openai', model:'gpt-4o', ms:13, ok:false, gbp:0.0001, when:now }]));
    localStorage.setItem('sy-inbox', JSON.stringify([
      { from:'Marick Papa', email:'info@partner.example', type:'partnership', body:'I want a demo for my school', status:'NEW', when:now }]));
  } catch (e) {} };
  const { c, pg } = await ctx(() => {});
  await pg.addInitScript(seed, NOW);
  await pg.goto(B + '/admin/', { waitUntil: 'networkidle' }).catch(()=>{}); await pg.waitForTimeout(1200);
  await snap(pg, '30-admin-dashboard', 'Admin · Dashboard');
  const mods = [['users','Users'],['tutors','Tutors'],['schools','Schools'],['content','Content'],['revenue','Revenue & Stripe'],['ai','AI usage log'],['inbox','Contact inbox'],['analytics','Analytics'],['settings','Settings'],['fraud','Fraud'],['support','Support'],['growth','Growth']];
  let i = 31;
  for (const [m, label] of mods) {
    try { await pg.click(`[data-go="${m}"]`, { timeout: 3000 }); await pg.waitForTimeout(700); } catch (e) {}
    await snap(pg, (i++) + '-admin-' + m, 'Admin · ' + label);
  }
  await c.close();
}

/* ---------------- OTHER CONSOLES (demo loaded) ---------------- */
{
  const roles = [['parent','Parent command centre'],['teacher','Teacher console'],['school','School console'],['tutor','Tutor console'],['authority','Local Authority console']];
  let i = 50;
  for (const [role, label] of roles) {
    const { c, pg } = await ctx();
    try { await demo(pg, role, 'loaded'); await snap(pg, (i++) + '-console-' + role, label); }
    catch (e) { shots.push({ id: role, title: label, ok: false, err: e.message }); process.stdout.write('FAIL ' + role + ' :: ' + e.message + '\n'); }
    await c.close();
  }
}

await browser.close(); server.close();

/* gallery */
const okN = shots.filter(s => s.ok).length;
const rows = shots.map(s => `<figure class="${s.ok?'ok':'warn'}"><figcaption>${s.ok?'✓':'⚠'} ${s.title}${s.err?` <span class="e">(${s.err.replace(/</g,'&lt;')})</span>`:''}</figcaption><img loading="lazy" src="${s.id}.png"></figure>`).join('\n');
writeFileSync(join(SHOTS, 'index.html'),
`<!doctype html><meta charset=utf8><title>StudYear — component screenshots</title>
<style>body{font:15px system-ui;margin:24px;background:#0b1220;color:#e8eef8}h1{font-weight:600}
.sum{margin:8px 0 20px;color:#9fb0c8}figure{margin:0 0 28px;border:1px solid #24324a;border-radius:12px;overflow:hidden;background:#0f1830}
figcaption{padding:10px 14px;font-weight:600}.ok figcaption{color:#7ad18c}.warn figcaption{color:#e0b23f}.e{font-weight:400;color:#c98}
img{display:block;width:100%;border-top:1px solid #24324a}</style>
<h1>StudYear — every component, as admin &amp; every user role</h1>
<div class="sum">${okN}/${shots.length} rendered cleanly · generated from the production static export</div>
${rows}`);
writeFileSync(join(SHOTS, 'manifest.json'), JSON.stringify(shots, null, 2));

/* Markdown gallery — GitHub renders this inline when you open the folder,
   so every screenshot is viewable in the browser with no download. */
const groups = [
  ['Public pages', s => s.id.includes('public')],
  ['Student — study hub (all modules)', s => s.id.includes('student')],
  ['Admin console (all modules)', s => s.id.includes('admin')],
  ['Other role consoles', s => s.id.includes('console')],
];
let md = `# StudYear — component screenshots\n\n**${okN}/${shots.length} components rendered cleanly** (zero page errors), captured from the production static export as admin and as every user role. Regenerated automatically on every push.\n`;
for (const [name, pred] of groups) {
  const g = shots.filter(pred);
  if (!g.length) continue;
  md += `\n## ${name}\n\n`;
  for (const s of g) md += `### ${s.ok ? '✓' : '⚠'} ${s.title}\n\n![${s.title}](${s.id}.png)\n\n`;
}
writeFileSync(join(SHOTS, 'README.md'), md);
process.stdout.write(`\nSCREENSHOTS: ${okN}/${shots.length} clean · wrote ${SHOTS}/README.md\n`);
if (okN === 0) process.exit(1);
