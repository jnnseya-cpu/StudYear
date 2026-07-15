/* Go-live cloud bridge: Firebase Auth mirror, encrypted push-sync, and
   new-device restore — proven against stubbed Firebase/Functions endpoints
   (the network contract, not Google's servers, is what's under test). */
import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);

const CFG={apiKey:'test-api-key',projectId:'test-proj',storageBucket:'test-proj.appspot.com',apiBase:'https://api.cloudtest.local'};
const calls={signUp:0,signIn:0,register:null,sync:null,pulls:0};

async function wire(ctx){
  await ctx.route('**/firebase-config.json',r=>r.fulfill({json:CFG}));
  await ctx.route('https://identitytoolkit.googleapis.com/**',async r=>{
    const url=r.request().url(), body=r.request().postDataJSON()||{};
    if(url.includes('accounts:signUp')){calls.signUp++;
      return r.fulfill({json:{localId:'uid-cloud-1',email:body.email,idToken:'tok-1',refreshToken:'ref-1',expiresIn:'3600'}});}
    if(url.includes('accounts:signInWithPassword')){calls.signIn++;
      if(body.password!=='CloudPass!77')return r.fulfill({status:400,json:{error:{message:'INVALID_LOGIN_CREDENTIALS'}}});
      return r.fulfill({json:{localId:'uid-cloud-1',email:body.email,idToken:'tok-2',refreshToken:'ref-1',expiresIn:'3600'}});}
    return r.fulfill({status:404,json:{}});
  });
  await ctx.route('https://securetoken.googleapis.com/**',r=>r.fulfill({json:{id_token:'tok-r',refresh_token:'ref-1',expires_in:'3600',user_id:'uid-cloud-1'}}));
  await ctx.route('https://api.cloudtest.local/**',async r=>{
    const url=r.request().url();
    if(url.endsWith('/register')){calls.register=r.request().postDataJSON();return r.fulfill({json:{ok:true}});}
    if(url.endsWith('/sync')){calls.sync=r.request().postDataJSON();return r.fulfill({json:{ok:true,stored:Object.keys(calls.sync.data||{}).length}});}
    if(url.endsWith('/syncPull')){calls.pulls++;
      return r.fulfill({json:{ok:true,e2e:calls.sync?calls.sync.e2e:null,
        user:{name:'Cloud Tester',roles:['student'],plan:'child_free'},data:calls.sync?calls.sync.data:{}}});}
    return r.fulfill({status:404,json:{ok:false}});
  });
}

/* ---- 1. signup mirrors into Firebase Auth + /register ---- */
const ctx=await browser.newContext({serviceWorkers:'block'});
await wire(ctx);
const p=await ctx.newPage();
p.on('pageerror',e=>results.push('JSERR — '+e.message));
await p.goto(B+'/auth/?role=student',{waitUntil:'networkidle'});
await p.click('#t-up');
await p.fill('#name','Cloud Tester');
await p.fill('#email','cloud@e2e.test');
await p.fill('#pw','CloudPass!77');
await p.check('#human-ck');
const q=await p.locator('#chal-q').innerText();const m=q.match(/(\d+)\s*\+\s*(\d+)/);
await p.fill('#chal-a',String(+m[1]+ +m[2]));
await p.waitForTimeout(1600);
await p.click('#go');
await p.waitForURL(u=>!/\/auth\//.test(u.pathname),{timeout:8000}).catch(()=>{});
ok('Signup completes with cloud active', !/\/auth\//.test(p.url()));
ok('Firebase Auth account created (identitytoolkit signUp)', calls.signUp===1);
ok('/register called with the picked role', !!calls.register&&calls.register.role==='student'&&calls.register.name==='Cloud Tester');

/* ---- 2. store writes push the E2E-encrypted payload ---- */
await p.goto(B+'/study/',{waitUntil:'networkidle'});
await p.evaluate(()=>SY.set('profile',{name:'Cloud Tester',level:'GCSE',medical:'CLOUD-SECRET'}));
await p.waitForTimeout(6500); // debounce is 5s
ok('Debounced push hit /sync', !!calls.sync);
ok('Sync payload: password-wrapped key only, no device wrap',
  !!(calls.sync&&calls.sync.e2e&&calls.sync.e2e.wrapPw&&!calls.sync.e2e.wrapDev));
ok('Sync payload: every value is a ciphertext envelope',
  !!calls.sync&&Object.values(calls.sync.data).length>0&&Object.values(calls.sync.data).every(v=>v.__e2e===1&&v.n&&v.c));
ok('Sync payload leaks no plaintext', !JSON.stringify(calls.sync).includes('CLOUD-SECRET'));

/* ---- 3. brand-new device: sign-in restores the account from the cloud ---- */
const ctx2=await browser.newContext({serviceWorkers:'block'});
await wire(ctx2);
const p2=await ctx2.newPage();
p2.on('pageerror',e=>results.push('JSERR — '+e.message));
await p2.goto(B+'/auth/?role=student',{waitUntil:'networkidle'});
await p2.fill('#email','cloud@e2e.test');
await p2.fill('#pw','CloudPass!77');
await p2.check('#human-ck');
const q2=await p2.locator('#chal-q').innerText();const m2=q2.match(/(\d+)\s*\+\s*(\d+)/);
await p2.fill('#chal-a',String(+m2[1]+ +m2[2]));
await p2.waitForTimeout(1600);
await p2.click('#go');
await p2.waitForURL(u=>!/\/auth\//.test(u.pathname),{timeout:10000}).catch(()=>{});
ok('New device signs in via cloud restore', !/\/auth\//.test(p2.url()));
ok('syncPull was used for the restore', calls.pulls>=1);
await p2.goto(B+'/study/',{waitUntil:'networkidle'});
ok('Restored data decrypts with the password on the new device',
  await p2.evaluate(()=>SY.get('profile',{}).medical==='CLOUD-SECRET'));
ok('Restored store is ciphertext at rest',
  await p2.evaluate(()=>String(localStorage.getItem('sy-u:cloud@e2e.test:profile')).includes('"__e2e":1')));

/* ---- 4. wrong password gets nothing from the cloud path ---- */
const ctx3=await browser.newContext({serviceWorkers:'block'});
await wire(ctx3);
const p3=await ctx3.newPage();
p3.on('pageerror',e=>results.push('JSERR — '+e.message));
await p3.goto(B+'/auth/?role=student',{waitUntil:'networkidle'});
await p3.fill('#email','cloud@e2e.test');
await p3.fill('#pw','WrongPass!99');
await p3.check('#human-ck');
const q3=await p3.locator('#chal-q').innerText();const m3=q3.match(/(\d+)\s*\+\s*(\d+)/);
await p3.fill('#chal-a',String(+m3[1]+ +m3[2]));
await p3.waitForTimeout(1600);
await p3.click('#go');
await p3.waitForTimeout(2500);
ok('Wrong password is rejected (no restore, stays on auth)', /\/auth\//.test(p3.url()));

/* ---- 5. empty/placeholder config keeps the bridge dormant ---- */
const ctx4=await browser.newContext({serviceWorkers:'block'});
await ctx4.route('**/firebase-config.json',r=>r.fulfill({json:{apiKey:'',projectId:'',storageBucket:'',apiBase:''}}));
const p4=await ctx4.newPage();
p4.on('pageerror',e=>results.push('JSERR — '+e.message));
await p4.goto(B+'/auth/',{waitUntil:'networkidle'});
ok('Empty config → SYCloud dormant (offline OS unchanged)',
  await p4.evaluate(async()=>{await SYCloud.whenReady();return SYCloud.ready()===false}));

for(const r of results)console.log(r);
await browser.close();
