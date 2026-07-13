import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);

async function fresh(){
  const ctx=await browser.newContext();
  const p=await ctx.newPage();
  p.on('pageerror',e=>results.push('JSERR — '+e.message));
  return {ctx,p};
}
async function launchDemo(p,role,mode){
  await p.goto(B+'/demo/',{waitUntil:'networkidle'});
  await p.click('#card-'+role+' button[data-m="'+mode+'"]');
  await p.waitForURL(u=>!/\/demo\//.test(u.pathname),{timeout:8000});
  await p.waitForLoadState('networkidle');
}

/* ---- 0. landing CTAs ---- */
let {ctx,p}=await fresh();
await p.goto(B+'/landing.html',{waitUntil:'domcontentloaded'});
ok('Landing: "Test our demo" replaces "Talk to our team"',
  await p.evaluate(()=>{const a=[...document.querySelectorAll('a')];return a.some(x=>/Test our demo/i.test(x.textContent)&&/demo\/$/.test(x.getAttribute('href')))&&!a.some(x=>/Talk to our team/i.test(x.textContent))}));
ok('Landing: "Book a school demo" links to the school demo',
  await p.evaluate(()=>[...document.querySelectorAll('a')].some(x=>/Book a school demo/i.test(x.textContent)&&/demo\/\?role=school/.test(x.getAttribute('href')))));

/* ---- 1. demo page + school highlight ---- */
await p.goto(B+'/demo/?role=school',{waitUntil:'networkidle'});
ok('Demo page shows all 7 role cards', await p.locator('#grid .card').count()===7);
ok('Demo page states no live AI / no spend', /never call live AI/.test(await p.locator('.safe').innerText()));
ok('?role=school highlights the school card', await p.evaluate(()=>document.getElementById('card-school').classList.contains('hot')));
await ctx.close();

/* ---- 2. student fully loaded: data present, live AI OFF even with a key configured ---- */
({ctx,p}=await fresh());
await p.addInitScript(()=>{try{localStorage.setItem('sy-ai-live',JSON.stringify({provider:'gemini',key:'FAKE'}))}catch(e){}});
await launchDemo(p,'student','loaded');
ok('Student loaded lands on the study workspace', /\/study\//.test(p.url()));
const sess=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-session')));
ok('Session flagged demo', sess&&sess.demo===true&&sess.role==='student');
const wal=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:student@demo.studyear:wallet')));
ok('Loaded student on Student Max with 2750 ACUs', wal&&wal.plan==='student_max'&&wal.acus===2750);
ok('SYAI refuses live calls for demo sessions (key configured but ready()=false)',
  await p.evaluate(()=>window.SYAI&&window.SYAI.ready()===false));
ok('Loaded student has quizzes + streak + resources',
  await p.evaluate(()=>{const g=k=>JSON.parse(localStorage.getItem('sy-u:student@demo.studyear:'+k)||'null');
    return g('quizzes').length===8&&g('streak').days.length===14&&g('mine').length===2&&g('points')>0}));
await ctx.close();

/* ---- 3. empty student: clean slate ---- */
({ctx,p}=await fresh());
await launchDemo(p,'student','empty');
ok('Empty student lands on study with its own account', /\/study\//.test(p.url()));
ok('Empty account namespace is clean',
  await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('sy-session'));
    return s.email==='student.new@demo.studyear'&&!localStorage.getItem('sy-u:student.new@demo.studyear:quizzes')}));
await ctx.close();

/* ---- 4. parent fully loaded: child linked with live data ---- */
({ctx,p}=await fresh());
await launchDemo(p,'parent','loaded');
ok('Parent loaded lands on the parent command centre', /\/parent\//.test(p.url()));
await p.waitForTimeout(400);
const ptext=await p.evaluate(()=>document.body.innerText);
ok('Parent sees the linked child (Emily)', /Emily/.test(ptext));
ok('Parent shows 1 linked', /1 linked/.test(await p.evaluate(()=>{const e=document.getElementById('linked-count');return e?e.textContent:''})));
await ctx.close();

/* ---- 5. teacher fully loaded: school link + pool on assistant ---- */
({ctx,p}=await fresh());
await launchDemo(p,'teacher','loaded');
ok('Teacher loaded lands on the teacher console', /\/teacher\//.test(p.url()));
await p.waitForTimeout(500);
ok('Teacher console monitors 6 students', /monitoring for 6 students/.test(await p.evaluate(()=>document.body.innerText)));
await p.goto(B+'/teacher/assistant/',{waitUntil:'networkidle'});
const tnote=await p.locator('#exam-pool-note').innerText();
ok('Teacher exam builder runs on the demo school pool', /Riverside Academy \(Demo\)/.test(tnote)&&/5,000|5000/.test(tnote));
await ctx.close();

/* ---- 6. school / authority / tutor / admin all open ---- */
for(const [role,path] of [['school','/school/'],['authority','/authority/'],['tutor','/tutor/'],['admin','/admin/']]){
  ({ctx,p}=await fresh());
  await launchDemo(p,role,'loaded');
  ok(role+' loaded lands on '+path, p.url().includes(path));
  await p.waitForTimeout(300);
  const t=await p.evaluate(()=>document.body.innerText.length);
  ok(role+' console renders content', t>500);
  await ctx.close();
}

for(const r of results)console.log(r);
await browser.close();
