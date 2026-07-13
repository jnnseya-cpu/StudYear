import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);
const ctx=await browser.newContext({serviceWorkers:'block'});
const p=await ctx.newPage();
p.on('pageerror',e=>results.push('JSERR — '+e.message));

await p.addInitScript(()=>{
  if(localStorage.getItem('sy-di-seeded'))return;localStorage.setItem('sy-di-seeded','1');
  const day=o=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10)};
  localStorage.setItem('sy-session',JSON.stringify({role:'school',name:'Head',email:'head@di.test'}));
  localStorage.setItem('sy-users',JSON.stringify([
    {email:'head@di.test',role:'school',name:'Head'},
    {email:'ava@di.test',role:'student',name:'Ava Intake'},
    {email:'ben@di.test',role:'student',name:'Ben Intake'}]));
  localStorage.setItem('sy-u:head@di.test:schoolCode',JSON.stringify('DISCH'));
  localStorage.setItem('sy-school:DISCH:name',JSON.stringify('Intake High'));
  localStorage.setItem('sy-school:DISCH:roster',JSON.stringify([
    {email:'ava@di.test',name:'Ava Intake',cohort:'10A',year:'Year 10'},
    {email:'ben@di.test',name:'Ben Intake',cohort:'10A',year:'Year 10'}]));
  localStorage.setItem('sy-school:DISCH:staff',JSON.stringify([{email:'t1@di.test',name:'T One',role:'Teacher'}]));
  for(const [e,base] of [['ava@di.test',70],['ben@di.test',50]]){
    const q=[];for(let j=0;j<6;j++)q.push({t:day(-(12-j*2)),subj:j%2?'Physics':'Mathematics',title:'q'+j,pct:base+j});
    localStorage.setItem('sy-u:'+e+':quizzes',JSON.stringify(q));
    localStorage.setItem('sy-u:'+e+':profile',JSON.stringify({name:e.split('@')[0],level:'GCSE'}));
    localStorage.setItem('sy-u:'+e+':activity',JSON.stringify([{k:'quiz',t:'x',d:'',when:new Date().toISOString()}]));
  }
});

/* ---- intake hub: enter data through the UI ---- */
await p.goto(B+'/school/data/',{waitUntil:'networkidle'});
ok('Intake hub lists every roster student in the data grid',
  await p.evaluate(()=>document.querySelectorAll('#meta-table tbody tr').length===2));
ok('Every section declares what it feeds',
  await p.evaluate(()=>[...document.querySelectorAll('.feeds')].length>=6&&document.body.innerText.includes('Equity Engine')));
/* flags via grid: Ava = SEND + PP, reading age 11.2 */
await p.evaluate(()=>{
  const tr=[...document.querySelectorAll('#meta-table tbody tr')].find(r=>r.innerText.includes('Ava'));
  tr.querySelector('.tag[data-t="send"]').click();
  tr.querySelector('.tag[data-t="pp"]').click();
  const ra=tr.querySelector('[data-k="readingAge"]');ra.value='11.2';ra.dispatchEvent(new Event('change'));
  const g=tr.querySelector('[data-k="gender"]');g.value='Female';g.dispatchEvent(new Event('change'));
});
const meta=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-school:DISCH:studentMeta')));
ok('Student grid saves flags, reading age and gender', meta['ava@di.test'].send===true&&meta['ava@di.test'].pp===true&&meta['ava@di.test'].readingAge===11.2&&meta['ava@di.test'].gender==='Female');
/* behaviour + wellbeing + safeguarding + workload + coverage */
await p.selectOption('#bh-student','ben@di.test');
await p.selectOption('#bh-kind','serious');
await p.fill('#bh-note','Disruption in P3');
await p.click('#bh-add');
await p.selectOption('#wb-student','ava@di.test');
await p.fill('#wb-score','48');
await p.fill('#wb-note','Needs a check-in');
await p.click('#wb-add');
await p.selectOption('#sg-student','ben@di.test');
await p.fill('#sg-note','Concern raised by form tutor');
await p.click('#sg-add');
await p.evaluate(()=>{const i=document.querySelector('#staff-list input');i.value='42';i.dispatchEvent(new Event('change'))});
await p.fill('#cov-subj','Mathematics');await p.fill('#cov-pct','64');await p.click('#cov-add');
await p.waitForTimeout(200);
ok('Behaviour, wellbeing, safeguarding, workload and coverage all persist',
  await p.evaluate(()=>{
    const g=k=>JSON.parse(localStorage.getItem('sy-school:DISCH:'+k)||'null');
    return g('behaviour').length===1&&g('wellbeing')[0].score===48&&g('safeguard')[0].status==='active'
      &&g('staffMeta')['t1@di.test'].hours===42&&g('curriculumCoverage')['Mathematics']===64;
  }));

/* ---- the console consumes it all ---- */
await p.goto(B+'/school/',{waitUntil:'networkidle'});await p.waitForTimeout(500);
const t=await p.evaluate(()=>document.body.innerText);
ok('Console: safeguarding alert count reflects the intake', await p.locator('#m-safeguard').innerText()==='1');
ok('Console: equity engine shows SEND and Pupil Premium groups from the grid', /SEND \(1\)/.test(t)&&/Disadvantaged \(1\)/.test(t));
ok('Console: girls/boys gap computes from entered gender', /Girls \(1\)/.test(t));
const brain=await p.evaluate(()=>document.body.innerText);
ok('Console: curriculum % comes from coverage input (64%)', /64%\s*\n?\s*Curriculum/i.test(brain));
ok('Console: wellbeing reflects the 48-score check-in', (()=>{const m=brain.match(/(\d+)\s*\n?\s*WELLBEING/);return m&&+m[1]<70})());

/* ---- the child's record shows the intake automatically ---- */
await p.goto(B+'/school/students/?e='+encodeURIComponent('ava@di.test'),{waitUntil:'networkidle'});
await p.waitForTimeout(400);
const rt=await p.evaluate(()=>document.body.innerText);
ok('Record: intake chips auto-fed (SEND, Pupil Premium, reading age, wellbeing)',
  /SEND/.test(rt)&&/Pupil Premium/.test(rt)&&/Reading age 11.2/.test(rt)&&/Wellbeing 48/.test(rt));

for(const r of results)console.log(r);
await browser.close();
