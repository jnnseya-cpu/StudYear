import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);
const ctx=await browser.newContext({serviceWorkers:'block'});
const p=await ctx.newPage();
p.on('pageerror',e=>results.push('JSERR — '+e.message));

/* ---- signup with human check ---- */
await p.goto(B+'/auth/?role=student',{waitUntil:'networkidle'});
await p.click('#t-up');
await p.fill('#name','Test Human');
await p.fill('#dob','2000-01-01');
await p.fill('#email','human@e2e.test');
await p.fill('#pw','Passw0rd!x');
await p.check('#human-ck');
const q=await p.locator('#chal-q').innerText();
const m=q.match(/(\d+)\s*\+\s*(\d+)/);
await p.fill('#chal-a',String(+m[1]+ +m[2]));
await p.check('#agree-ck');   /* Terms + 18/guardian consent — required for signup */
await p.waitForTimeout(1600);
await p.click('#go');
await p.waitForURL(u=>!/\/auth\//.test(u.pathname),{timeout:8000}).catch(()=>{});
ok('Signup with human check passes and leaves /auth/', !/\/auth\//.test(p.url()));
const sess=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-session')||'null'));
ok('Session created for the new student', !!(sess&&sess.role==='student'&&sess.email==='human@e2e.test'));

/* ---- wrong human answer is blocked ---- */
const p2=await ctx.newPage();
p2.on('pageerror',e=>results.push('JSERR — '+e.message));
await p2.goto(B+'/auth/?role=student',{waitUntil:'networkidle'});
await p2.evaluate(()=>localStorage.removeItem('sy-session'));
await p2.click('#t-up');
await p2.fill('#name','Bot');await p2.fill('#dob','2000-01-01');await p2.fill('#email','bot@e2e.test');await p2.fill('#pw','Passw0rd!x');
await p2.check('#human-ck');await p2.fill('#chal-a','999');
await p2.waitForTimeout(1600);
await p2.click('#go');await p2.waitForTimeout(400);
ok('Wrong human answer is blocked', /\/auth\//.test(p2.url())&&/Human check failed/i.test(await p2.evaluate(()=>document.body.innerText)));
/* honeypot */
await p2.evaluate(()=>{document.getElementById('hp').value='spam'});
await p2.check('#human-ck');
const q2=await p2.locator('#chal-q').innerText();const m2=q2.match(/(\d+)\s*\+\s*(\d+)/);
await p2.fill('#chal-a',String(+m2[1]+ +m2[2]));
await p2.waitForTimeout(1600);
await p2.click('#go');await p2.waitForTimeout(400);
ok('Honeypot blocks automated submits', /\/auth\//.test(p2.url())&&/Automated request blocked/i.test(await p2.evaluate(()=>document.body.innerText)));

/* ---- sign back in ---- */
const p3=await ctx.newPage();
await p3.goto(B+'/auth/?role=student',{waitUntil:'networkidle'});
await p3.evaluate(()=>localStorage.removeItem('sy-session'));
await p3.reload({waitUntil:'networkidle'});
await p3.fill('#email','human@e2e.test');
await p3.fill('#pw','Passw0rd!x');
await p3.check('#human-ck');
const q3=await p3.locator('#chal-q').innerText();const m3=q3.match(/(\d+)\s*\+\s*(\d+)/);
await p3.fill('#chal-a',String(+m3[1]+ +m3[2]));
await p3.waitForTimeout(1600);
await p3.click('#go');
await p3.waitForURL(u=>!/\/auth\//.test(u.pathname),{timeout:8000}).catch(()=>{});
ok('Existing user signs back in', !/\/auth\//.test(p3.url()));

for(const r of results)console.log(r);
await browser.close();
