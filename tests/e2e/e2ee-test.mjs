import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);
const ctx=await browser.newContext({serviceWorkers:'block'});
const p=await ctx.newPage();
p.on('pageerror',e=>results.push('JSERR — '+e.message));

/* ---- 1. signup mints wrapped keys; store writes are sealed ---- */
await p.goto(B+'/auth/?role=student',{waitUntil:'networkidle'});
await p.click('#t-up');
await p.fill('#name','Enc Rypted');
await p.fill('#dob','2000-01-01');
await p.fill('#email','enc@e2e.test');
await p.fill('#pw','S3cretPass!x');
await p.check('#human-ck');
const q=await p.locator('#chal-q').innerText();const m=q.match(/(\d+)\s*\+\s*(\d+)/);
await p.fill('#chal-a',String(+m[1]+ +m[2]));
await p.check('#agree-ck');   /* Terms + 18/guardian consent — required for signup */
await p.waitForTimeout(1600);
await p.click('#go');
await p.waitForURL(u=>!/\/auth\//.test(u.pathname),{timeout:8000}).catch(()=>{});
ok('Signup completes with E2EE active', !/\/auth\//.test(p.url()));
const keyRec=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-e2e:enc@e2e.test')||'null'));
ok('Key record exists: PBKDF2 salt + password-wrapped + device-wrapped data key',
  !!(keyRec&&keyRec.salt&&keyRec.wrapPw&&keyRec.wrapPw.c&&keyRec.wrapDev&&keyRec.wrapDev.c));

/* write through the store on a guarded page and inspect the raw bytes */
await p.goto(B+'/study/',{waitUntil:'networkidle'});
await p.evaluate(()=>{SY.set('profile',{name:'Enc Rypted',level:'GCSE',medical:'TOP-SECRET-NOTE'})});
const raw=await p.evaluate(()=>localStorage.getItem('sy-u:enc@e2e.test:profile'));
ok('Personal data is ciphertext at rest (envelope, no plaintext)',
  raw.includes('"__e2e":1')&&!raw.includes('TOP-SECRET-NOTE'));
ok('SY.get transparently decrypts',
  await p.evaluate(()=>SY.get('profile',{}).medical==='TOP-SECRET-NOTE'));
ok('Session reports E2EE active', await p.evaluate(()=>SY.e2eActive()===true));

/* ---- 2. new browser context (no sessionStorage): device keyring unlocks ---- */
const state=await p.evaluate(()=>{
  const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);out[k]=localStorage.getItem(k)}return out});
const ctx2=await browser.newContext({serviceWorkers:'block'});
const p2=await ctx2.newPage();
p2.on('pageerror',e=>results.push('JSERR — '+e.message));
await p2.addInitScript(st=>{for(const [k,v] of Object.entries(st))localStorage.setItem(k,v)},state);
await p2.goto(B+'/study/',{waitUntil:'networkidle'});
ok('Fresh context (no session key) still reads own data via device keyring',
  await p2.evaluate(()=>SY.get('profile',{}).medical==='TOP-SECRET-NOTE'));

/* ---- 3. consented cross-account read (parent flow) decrypts ---- */
ok('readAccount decrypts a linked account on this device',
  await p2.evaluate(()=>{
    localStorage.setItem('sy-session',JSON.stringify({role:'parent',name:'P',email:'par@e2e.test'}));
    return SY.readAccount('enc@e2e.test','profile',{}).medical==='TOP-SECRET-NOTE';
  }));

/* ---- 4. sync payload: ciphertext only, device wrap excluded ---- */
const sp=await p2.evaluate(()=>SYE2E.syncPayload('enc@e2e.test'));
ok('Sync payload carries password-wrapped key only (no device wrap)',
  !!(sp.e2e&&sp.e2e.wrapPw&&!sp.e2e.wrapDev));
ok('Sync payload values are all envelopes',
  Object.values(sp.data).length>0&&Object.values(sp.data).every(v=>v.__e2e===1&&v.n&&v.c));
ok('Sync payload contains no plaintext secret', !JSON.stringify(sp).includes('TOP-SECRET-NOTE'));

/* ---- 5. wrong password cannot unwrap (E2E property) ---- */
ok('Password wrap resists a wrong password',
  await p2.evaluate(async()=>{
    const r=JSON.parse(localStorage.getItem('sy-e2e:enc@e2e.test'));
    const enc=new TextEncoder();
    const mat=await crypto.subtle.importKey('raw',enc.encode('WrongPass!9'),'PBKDF2',false,['deriveBits']);
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',
      salt:Uint8Array.from(atob(r.salt),c=>c.charCodeAt(0)),iterations:150000},mat,256);
    const bad=new Uint8Array(bits);
    const un=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    return nacl.secretbox.open(un(r.wrapPw.c),un(r.wrapPw.n),bad)===null;
  }));

/* ---- 6. demo accounts stay intentionally unencrypted ---- */
const ctx3=await browser.newContext({serviceWorkers:'block'});
const p3=await ctx3.newPage();
p3.on('pageerror',e=>results.push('JSERR — '+e.message));
await p3.goto(B+'/demo/',{waitUntil:'networkidle'});
await p3.click('#card-student button[data-m="loaded"]');
await p3.waitForURL(u=>/\/study\//.test(u.pathname),{timeout:8000});
await p3.waitForLoadState('networkidle');
ok('Demo accounts remain plaintext (presentation data)',
  await p3.evaluate(()=>{
    const raw=localStorage.getItem('sy-u:student@demo.studyear:profile');
    return raw.includes('Emily Carter')&&SY.e2eActive()===false;
  }));

for(const r of results)console.log(r);
await browser.close();
