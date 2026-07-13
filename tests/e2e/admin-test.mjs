import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);
const ctx=await browser.newContext({serviceWorkers:'block'});
const p=await ctx.newPage();
p.on('pageerror',e=>results.push('JSERR — '+e.message));
p.on('dialog',d=>d.accept(d.type()==='prompt'?(p._promptAnswer||'+100'):undefined));

const NOW=new Date().toISOString();
await p.addInitScript(now=>{try{
  if(localStorage.getItem('sy-seeded'))return;localStorage.setItem('sy-seeded','1');
  localStorage.setItem('sy-session',JSON.stringify({role:'admin',name:'Ops',email:'admin@studyear.com'}));
  localStorage.setItem('sy-users',JSON.stringify([
    {email:'admin@studyear.com',role:'admin',name:'Platform Admin',created:now},
    {email:'emily@customer.example',role:'student',name:'Emily C',created:now},
    {email:'marcus@customer.example',role:'parent',name:'Marcus C',created:now},
    {email:'tandi@customer.example',role:'tutor',name:'Tandi T',created:now}
  ]));
  localStorage.setItem('sy-u:emily@customer.example:wallet',JSON.stringify({acus:700,plan:'student_premium'}));
  localStorage.setItem('sy-u:emily@customer.example:activity',JSON.stringify([
    {k:'billing',t:'Assignment review: Macbeth — 60 ACUs',d:'640 ACUs remaining.',when:now},
    {k:'billing',t:'Core Boost pack purchased',d:'£5.00 · 500 ACUs added to your wallet.',when:now},
    {k:'lesson',t:'Interactive lesson: Quadratics',d:'GCSE',when:now},
    {k:'quiz',t:'Physics checkpoint',d:'72%',when:now}
  ]));
  localStorage.setItem('sy-u:emily@customer.example:mine',JSON.stringify([{id:'m1',type:'Revision Notes',title:'My quadratics notes',subj:'Mathematics',level:'GCSE',mine:true,body:'<p>x</p>'}]));
  localStorage.setItem('sy-school:SCH9:name',JSON.stringify('Test High'));
  localStorage.setItem('sy-school:SCH9:roster',JSON.stringify([{email:'emily@customer.example',name:'Emily C'}]));
  localStorage.setItem('sy-school:SCH9:staff',JSON.stringify([]));
  localStorage.setItem('sy-school:SCH9:acu',JSON.stringify({balance:100,burn:[]}));
  localStorage.setItem('sy-tutors',JSON.stringify([{id:'tu1',email:'tandi@customer.example',name:'Tandi T',head:'Maths tutor',rate:38,subjects:'Maths, Physics'}]));
  localStorage.setItem('sy-ai-usage',JSON.stringify([
    {email:'emily@customer.example',name:'Emily C',provider:'openai',model:'gpt-4o',ms:9050,ok:true,gbp:0.0068,when:now},
    {email:'emily@customer.example',name:'Emily C',provider:'openai',model:'gpt-4o',ms:13,ok:false,gbp:0.0001,when:now}
  ]));
  localStorage.setItem('sy-inbox',JSON.stringify([
    {from:'Marick Papa',email:'info@partner.example',type:'partnership',body:'I want to work with you and my school is ready for a demo',status:'NEW',when:now},
    {from:'bQKOeVZAzmgJMQrOskPg',email:'vicki@spamco.example',type:'support',body:'xyerZgEkCjdjbRqxH kWNZSJWHAXQdtWoXjkInwvR',status:'NEW',when:now}
  ]));
}catch(e){}},NOW);

await p.goto(B+'/admin/',{waitUntil:'networkidle'});
/* dashboard */
ok('Dashboard: 7 KPI tiles render', await p.locator('#p-dashboard .kpis .stat').count()===7);
ok('Dashboard: total students = 1', await p.locator('#k-students').innerText()==='1');
ok('Dashboard: 12 management modules', await p.locator('#p-dashboard .mods .mod').count()===12);
ok('Dashboard: economics shows Stripe gross £5.00', /£5\.00/.test(await p.locator('#e-gross30').innerText()));
ok('Dashboard: AI spend from usage log', /£0\.0[01]/.test(await p.locator('#e-ai30').innerText()));
ok('Dashboard: ACUs consumed 60', await p.locator('#e-acus').innerText()==='60');

/* users: masked email + edit role/plan */
await p.evaluate(()=>{location.hash='#users'});await p.waitForTimeout(200);
const utext=await p.locator('#u-table').innerText();
ok('Users: customer email is masked', /em•••@c•••\.example/.test(utext)&&!/emily@customer\.example/.test(utext));
ok('Users: full action set for a student', ['Edit','Link Parent','Link School','Adjust ACUs','View as User','Delete'].every(a=>utext.includes(a)));
await p.evaluate(()=>{
  const rows=[...document.querySelectorAll('#u-table tbody tr')];
  const ri=rows.findIndex(r=>r.innerText.includes('Emily'));
  rows[ri].querySelector('button[data-act="edit"]').click();
});
await p.waitForTimeout(200);
await p.selectOption('#ud-plan','student_max');
await p.click('#ud-save');await p.waitForTimeout(200);
const wal=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:emily@customer.example:wallet')));
ok('Users: subscription change persists (→ Student Max)', wal.plan==='student_max');
/* adjust ACUs via prompt (+100) */
p._promptAnswer='+100';
await p.evaluate(()=>{
  const rows=[...document.querySelectorAll('#u-table tbody tr')];
  const ri=rows.findIndex(r=>r.innerText.includes('Emily'));
  rows[ri].querySelector('button[data-act="acus"]').click();
});
await p.waitForTimeout(200);
const wal2=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:emily@customer.example:wallet')));
ok('Users: ACU adjustment applies (700→800)', wal2.acus===800);

/* tutors */
await p.evaluate(()=>{location.hash='#tutors'});await p.waitForTimeout(200);
ok('Tutors: application listed with rate + fee columns', /£38\/hr/.test(await p.locator('#t-table').innerText())&&/Unpaid/.test(await p.locator('#t-table').innerText()));
await p.evaluate(()=>{[...document.querySelectorAll('#t-table button')].find(b=>b.dataset.st==='approved')?.click()});
await p.waitForTimeout(200);
ok('Tutors: approval workflow updates KPIs', await p.locator('#t-approved').innerText()!=='0');

/* content pipeline → student library */
await p.evaluate(()=>{location.hash='#content'});await p.waitForTimeout(200);
await p.fill('#cm-title','Photosynthesis explained (video)');
await p.fill('#cm-url','https://youtube.com/watch?v=demo123');
await p.selectOption('#cm-subj','Biology');
await p.selectOption('#cm-level','GCSE');
await p.click('#cm-add');await p.waitForTimeout(200);
await p.evaluate(()=>{[...document.querySelectorAll('#cm-table button')].find(b=>b.dataset.st==='approved')?.click()});
await p.waitForTimeout(200);
const curated=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-curated')||'[]'));
ok('Content: approved pipeline item publishes to curated store', curated.length===1&&curated[0].title.includes('Photosynthesis'));
ok('Content: user-generated moderation lists the student resource', /My quadratics notes/.test(await p.locator('#c-table').innerText()));

/* revenue */
await p.evaluate(()=>{location.hash='#revenue'});await p.waitForTimeout(200);
ok('Revenue: Stripe status panel present', /Stripe/.test(await p.locator('#stripe-status').innerText()));
ok('Revenue: payment row listed', /£5\.00/.test(await p.locator('#r-pay').innerText()));
ok('Revenue: ACU debit shows feature', /ASSIGNMENT REVIEW/.test(await p.locator('#r-deb').innerText()));
await p.fill('#dc-code','SUMMER25');await p.click('#dc-add');await p.waitForTimeout(150);
ok('Revenue: discount code created with controls', /SUMMER25/.test(await p.locator('#dc-list').innerText())&&/Deactivate/.test(await p.locator('#dc-list').innerText()));

/* AI usage */
await p.evaluate(()=>{location.hash='#ai'});await p.waitForTimeout(200);
const aitext=await p.locator('#ai-table').innerText();
ok('AI usage: request rows with model/latency/status', /gpt-4o/.test(aitext)&&/9050ms/.test(aitext)&&/success/.test(aitext)&&/failed/.test(aitext));

/* inbox: spam quarantined, real message actionable */
await p.evaluate(()=>{location.hash='#inbox'});await p.waitForTimeout(200);
ok('Inbox: real enquiry listed', /Marick Papa/.test(await p.locator('#inbox-table').innerText()));
ok('Inbox: gibberish bot message quarantined', /blocked/.test(await p.locator('#spam-list').innerText())&&!/bQKOeVZ/.test(await p.locator('#inbox-table').innerText()));

/* analytics + settings + fraud */
await p.evaluate(()=>{location.hash='#analytics'});await p.waitForTimeout(300);
ok('Analytics: KPIs + monthly chart render', await p.locator('#an-total').innerText()==='4'&&await p.locator('#a-months div').count()>0);
await p.evaluate(()=>{location.hash='#settings'});await p.waitForTimeout(200);
ok('Settings: production flags present', /Tutor Marketplace/.test(await p.locator('#flag-list').innerText())&&/AI Feedback Engine/.test(await p.locator('#flag-list').innerText()));
await p.fill('#pr-mult','4');await p.click('#set-save');await p.waitForTimeout(150);
ok('Settings: pricing rules persist', (await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-pricing')))).mult===4);
ok('Settings: provider models editable', await p.evaluate(()=>!!document.querySelector('[data-pm="openai_perf"]').value));
await p.evaluate(()=>{location.hash='#fraud'});await p.waitForTimeout(200);
await p.evaluate(()=>{
  const s=document.getElementById('f-user');
  const i=[...s.options].findIndex(o=>/Emily/.test(o.textContent));s.value=String(i);
});
await p.fill('#f-reason','Rapid duplicate signups from one device');
await p.click('#f-add');await p.waitForTimeout(150);
ok('Fraud: flagged account appears with reason + status', /Rapid duplicate signups/.test(await p.locator('#f-table').innerText()));

/* support: reason required + logged */
await p.evaluate(()=>{location.hash='#support'});await p.waitForTimeout(200);
await p.click('#sup-view');await p.waitForTimeout(200);
ok('Support: impersonation blocked without a reason', /\/admin\//.test(p.url()));
await p.fill('#sup-reason','Investigating a missing study plan report');
await p.evaluate(()=>{
  const sel=document.getElementById('sup-user');
  const i=[...sel.options].findIndex(o=>/Emily/.test(o.textContent));if(i>=0)sel.value=String(i);
  sel.dispatchEvent(new Event('change'));
});
await p.click('#sup-view');
await p.waitForURL(u=>/\/study\//.test(u.pathname),{timeout:8000}).catch(()=>{});
ok('Support: session starts into the user console', /\/study\//.test(p.url()));
const slog=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-support-log')||'[]'));
ok('Support: session logged with reason', slog.length===1&&/missing study plan/.test(slog[0].reason));

/* contact form: bot protections + posts to inbox */
const p2=await ctx.newPage();
p2.on('pageerror',e=>results.push('JSERR(contact) — '+e.message));
await p2.goto(B+'/contact/',{waitUntil:'networkidle'});
await p2.fill('#cf-name','Real Parent');await p2.fill('#cf-email','parent@familymail.example');
await p2.fill('#cf-msg','Hello, I would like to book a school demo for our trust.');
await p2.check('#cf-human');
const q=await p2.locator('#cf-q').innerText();const m=q.match(/(\d+)\s*\+\s*(\d+)/);
await p2.fill('#cf-a',String(+m[1]+ +m[2]));
await p2.waitForTimeout(1700);
await p2.click('#cf-send');await p2.waitForTimeout(250);
ok('Contact: human message accepted', /Message sent|thank you/i.test(await p2.locator('#cf-note').innerText()));
const inbox=await p2.evaluate(()=>JSON.parse(localStorage.getItem('sy-inbox')||'[]'));
ok('Contact: message lands in the admin inbox store', inbox.some(x=>x.from==='Real Parent'));
await p2.reload({waitUntil:'networkidle'});
await p2.evaluate(()=>{document.getElementById('cf-hp').value='spambot'});
await p2.fill('#cf-name','x y');await p2.fill('#cf-email','a@b.co');await p2.fill('#cf-msg','buy my product now cheap deal');
await p2.check('#cf-human');
const q2=await p2.locator('#cf-q').innerText();const m2=q2.match(/(\d+)\s*\+\s*(\d+)/);
await p2.fill('#cf-a',String(+m2[1]+ +m2[2]));
await p2.waitForTimeout(1700);
await p2.click('#cf-send');await p2.waitForTimeout(250);
ok('Contact: honeypot blocks bots', /Automated request blocked/.test(await p2.locator('#cf-note').innerText()));

/* curated resource appears for students */
const p3=await ctx.newPage();
await p3.addInitScript(()=>{localStorage.setItem('sy-session',JSON.stringify({role:'student',name:'S',email:'emily@customer.example'}))});
await p3.goto(B+'/study/#search',{waitUntil:'networkidle'});
await p3.fill('#q','Photosynthesis explained');
await p3.waitForTimeout(500);
ok('Curated pipeline resource appears in student Find resources',
  await p3.evaluate(()=>document.body.innerText.includes('Photosynthesis explained (video)')));

/* parent radar + stability colour pass */
const p4=await ctx.newPage();
p4.on('pageerror',e=>results.push('JSERR(parent) — '+e.message));
await p4.addInitScript(now=>{
  localStorage.setItem('sy-session',JSON.stringify({role:'parent',name:'M',email:'marcus@customer.example'}));
  localStorage.setItem('sy-u:marcus@customer.example:children',JSON.stringify([{email:'emily@customer.example',name:'Emily C'}]));
  localStorage.setItem('sy-u:emily@customer.example:profile',JSON.stringify({name:'Emily C',level:'GCSE',subjects:[{s:'Mathematics',target:8},{s:'Physics',target:7}]}));
  localStorage.setItem('sy-u:emily@customer.example:quizzes',JSON.stringify([
    {t:now.slice(0,10),subj:'Mathematics',title:'q1',pct:74},{t:now.slice(0,10),subj:'Physics',title:'q2',pct:48},
    {t:now.slice(0,10),subj:'Mathematics',title:'q3',pct:81},{t:now.slice(0,10),subj:'Physics',title:'q4',pct:55}
  ]));
  localStorage.setItem('sy-u:emily@customer.example:consent',JSON.stringify({parent:true,schoolToParent:true}));
},NOW);
await p4.goto(B+'/parent/',{waitUntil:'networkidle'});
await p4.waitForTimeout(500);
ok('Parent: stability shows coloured status', await p4.evaluate(()=>{const n=document.getElementById('stab-note');return !!(n&&n.querySelector('b'))}));
const radarOk=await p4.evaluate(()=>{
  const svgs=[...document.querySelectorAll('svg')];
  return svgs.some(s=>s.innerHTML.includes('url(#rg)')&&s.innerHTML.includes('stroke-dasharray'));
});
ok('Parent: colourful radar (gradient surface + target band + RAG dots)', radarOk);

for(const r of results)console.log(r);
await browser.close();
