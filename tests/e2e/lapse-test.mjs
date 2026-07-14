import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);
const ctx=await browser.newContext({serviceWorkers:'block'});
const p=await ctx.newPage();
p.on('pageerror',e=>results.push('JSERR — '+e.message));
await p.addInitScript(()=>{
  localStorage.setItem('sy-session',JSON.stringify({role:'student',name:'L',email:'lapse@t.test'}));
  localStorage.setItem('sy-u:lapse@t.test:wallet',JSON.stringify({
    acus:340,plan:'student_premium',month:'2026-06',
    planExpires:new Date(Date.now()-3*864e5).toISOString()}));
});
await p.goto(B+'/study/',{waitUntil:'networkidle'});
await p.waitForTimeout(300);
const w=await p.evaluate(()=>SY.get('wallet',null));
ok('Lapsed paid plan reverts to the free account on any console', w&&w.plan==='child_free'&&!w.planExpires);
ok('Purchased ACUs remain after the fallback', w&&w.acus===340);
ok('The lapse is logged to the account', await p.evaluate(()=>
  (SY.get('activity',[])||[]).some(a=>/reverted to the free account/.test(a.t))));
/* an active plan is untouched */
const ctx2=await browser.newContext({serviceWorkers:'block'});
const p2=await ctx2.newPage();
p2.on('pageerror',e=>results.push('JSERR — '+e.message));
await p2.addInitScript(()=>{
  localStorage.setItem('sy-session',JSON.stringify({role:'student',name:'A',email:'active@t.test'}));
  localStorage.setItem('sy-u:active@t.test:wallet',JSON.stringify({
    acus:700,plan:'student_premium',month:new Date().toISOString().slice(0,7),
    planExpires:new Date(Date.now()+20*864e5).toISOString()}));
});
await p2.goto(B+'/study/',{waitUntil:'networkidle'});
ok('Active paid plan is untouched', await p2.evaluate(()=>SY.get('wallet',null).plan==='student_premium'));
for(const r of results)console.log(r);
await browser.close();
