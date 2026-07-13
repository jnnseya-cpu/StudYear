import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);

async function fresh(seedRole,seedEmail){
  const ctx=await browser.newContext({serviceWorkers:'block'});
  const p=await ctx.newPage();
  p.on('pageerror',e=>results.push('JSERR — '+e.message));
  await p.addInitScript(({role,email})=>{
    if(localStorage.getItem('sy-rec-seeded')){ if(role)localStorage.setItem('sy-session',JSON.stringify({role,name:'V',email})); return; }
    localStorage.setItem('sy-rec-seeded','1');
    const day=o=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10)};
    const iso=o=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString()};
    localStorage.setItem('sy-users',JSON.stringify([
      {email:'head@rec.test',role:'school',name:'Head'},
      {email:'mrk@rec.test',role:'teacher',name:'Mr K'},
      {email:'out@rec.test',role:'teacher',name:'Ms Out'},
      {email:'mum@rec.test',role:'parent',name:'Mum'},
      {email:'kid@rec.test',role:'student',name:'Kid Example'}]));
    localStorage.setItem('sy-u:head@rec.test:schoolCode',JSON.stringify('RECSCH'));
    localStorage.setItem('sy-school:RECSCH:name',JSON.stringify('Record High'));
    localStorage.setItem('sy-school:RECSCH:roster',JSON.stringify([{email:'kid@rec.test',name:'Kid Example',cohort:'10A',year:'Year 10'}]));
    localStorage.setItem('sy-school:RECSCH:staff',JSON.stringify([
      {email:'mrk@rec.test',name:'Mr K',cohorts:['Year 10']},
      {email:'out@rec.test',name:'Ms Out',cohorts:['Year 13']}]));
    localStorage.setItem('sy-u:mrk@rec.test:teacherProfile',JSON.stringify({schoolCode:'RECSCH'}));
    localStorage.setItem('sy-u:mum@rec.test:children',JSON.stringify([{email:'kid@rec.test',name:'Kid Example'}]));
    localStorage.setItem('sy-u:kid@rec.test:profile',JSON.stringify({name:'Kid Example',level:'GCSE',subjects:[{s:'Mathematics',target:8},{s:'Physics',target:7}]}));
    localStorage.setItem('sy-u:kid@rec.test:schoolLink',JSON.stringify({code:'RECSCH',name:'Record High'}));
    const q=[];for(let j=0;j<10;j++)q.push({t:day(-(20-j*2)),subj:j%2?'Physics':'Mathematics',title:'q'+j,pct:44+j*3});
    localStorage.setItem('sy-u:kid@rec.test:quizzes',JSON.stringify(q));
    const acts=[];for(let j=0;j<12;j++)acts.push({k:['lesson','quiz','resource'][j%3],t:'Event '+j,d:'',when:iso(-j)});
    localStorage.setItem('sy-u:kid@rec.test:activity',JSON.stringify(acts));
    localStorage.setItem('sy-u:kid@rec.test:streak',JSON.stringify({days:[day(-1),day(-2),day(-3),day(-4),day(-5)],best:9}));
    if(role)localStorage.setItem('sy-session',JSON.stringify({role,name:'V',email}));
  },{role:seedRole,email:seedEmail});
  return {ctx,p};
}
/* keep one storage across contexts */
let state=null;
async function withState(p){ if(state) await p.addInitScript(st=>{for(const [k,v] of Object.entries(st))localStorage.setItem(k,v)},state); }
async function grabState(p){ state=await p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o}); }

/* ---- 1. school opens the record: model, plan, strategy, full trail ---- */
let {ctx,p}=await fresh('school','head@rec.test');
await p.goto(B+'/school/students/',{waitUntil:'networkidle'});
ok('School: roster lists the child with risk + evidence', /Kid Example/.test(await p.evaluate(()=>document.body.innerText)));
await p.click('.kid');await p.waitForTimeout(300);
const t=await p.evaluate(()=>document.body.innerText);
ok('Record: learning model rendered (style/rhythm/pace/consistency)', /Learning model/.test(t)&&/Study style & model/i.test(t)&&/rhythm/i.test(t));
ok('Record: subject trajectories with trend arrows', /Mathematics \d+% [↗↘→]/.test(t));
ok('Record: individual plan generated (2 weeks)', /Individual plan/.test(t)&&/Week 2/.test(t));
ok('Record: improvement strategy present', /improvement strategy/i.test(t)&&/Close the/.test(t));
ok('Record: complete OS trail listed', /Complete OS record/.test(t)&&/12 events/.test(t));
ok('Record: opened as senior leadership + logged notice', /senior leadership/.test(t)&&/access logged/.test(t));
/* push the plan to the child */
await p.click('#rec-push-plan');await p.waitForTimeout(200);
const kidPlan=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:kid@rec.test:plan')));
ok('Record: plan pushes into the child planner', !!(kidPlan&&kidPlan.plan&&kidPlan.plan.length===2));
await grabState(p);await ctx.close();

/* ---- 2. cohort teacher allowed; outside-cohort teacher denied ---- */
({ctx,p}=await fresh(null));await withState(p);
await p.addInitScript(()=>localStorage.setItem('sy-session',JSON.stringify({role:'teacher',name:'Mr K',email:'mrk@rec.test'})));
await p.goto(B+'/teacher/students/',{waitUntil:'networkidle'});
ok('Teacher (cohort): sees the child', /Kid Example/.test(await p.evaluate(()=>document.body.innerText)));
await p.click('.kid');await p.waitForTimeout(300);
ok('Teacher (cohort): record opens as cohort teacher', /cohort teacher/.test(await p.evaluate(()=>document.body.innerText)));
await grabState(p);await ctx.close();

({ctx,p}=await fresh(null));await withState(p);
await p.addInitScript(()=>{
  localStorage.setItem('sy-session',JSON.stringify({role:'teacher',name:'Ms Out',email:'out@rec.test'}));
  localStorage.setItem('sy-u:out@rec.test:teacherProfile',JSON.stringify({schoolCode:'RECSCH'}));
});
await p.goto(B+'/teacher/students/',{waitUntil:'networkidle'});
ok('Teacher (outside cohort): child filtered out of their list',
  !/Kid Example/.test(await p.evaluate(()=>document.getElementById('roster').innerText)));
ok('Access engine denies outside-cohort teacher directly',
  await p.evaluate(()=>SYRecord.access('RECSCH','kid@rec.test','out@rec.test','teacher').allowed===false));
await grabState(p);await ctx.close();

/* ---- 3. parent: denied before grant, allowed after ---- */
({ctx,p}=await fresh(null));await withState(p);
await p.addInitScript(()=>localStorage.setItem('sy-session',JSON.stringify({role:'parent',name:'Mum',email:'mum@rec.test'})));
await p.goto(B+'/parent/',{waitUntil:'networkidle'});await p.waitForTimeout(400);
ok('Parent: school-record card hidden before the school grants access',
  await p.evaluate(()=>document.getElementById('pc-schoolrec').style.display==='none'));
await p.evaluate(()=>SYRecord.setParentGrant('RECSCH','kid@rec.test',true,'head@rec.test'));
await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(400);
const pt=await p.evaluate(()=>document.body.innerText);
ok('Parent: card appears after grant with model + strategy', /School record & learning model/.test(pt)&&/Study style/i.test(pt)&&/school-granted and logged/.test(pt));
/* audit log captured all viewers */
const log=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-school:RECSCH:recordLog')||'[]'));
ok('Audit log records school, teacher and parent opens', ['school','teacher','parent'].every(r=>log.some(l=>l.role===r)));
await ctx.close();

for(const r of results)console.log(r);
await browser.close();
