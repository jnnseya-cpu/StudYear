import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const OUT='/home/user/StudYear/apps/web/out';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';

/* collect every page + its guard role */
function pages(dir,acc){
  for(const e of readdirSync(dir)){
    const p=join(dir,e);
    if(statSync(p).isDirectory())pages(p,acc);
    else if(e==='index.html'||e==='landing.html'||e==='404.html'){
      const rel=p.slice(OUT.length).replace(/\/index\.html$/,'/')||'/';
      const html=readFileSync(p,'utf8');
      const m=html.match(/data-role="([^"]+)"/);
      acc.push({url:rel.replace(/^\//,''),role:m?m[1]:null});
    }
  }
  return acc;
}
const all=pages(OUT,[]);
const byRole={};
for(const pg of all)(byRole[pg.role||'public']=byRole[pg.role||'public']||[]).push(pg.url);

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const problems=[];let visited=0;
for(const [role,urls] of Object.entries(byRole)){
  const ctx=await browser.newContext({serviceWorkers:'block'});
  const p=await ctx.newPage();
  if(role!=='public'){
    await p.addInitScript(r=>{try{
      localStorage.setItem('sy-session',JSON.stringify({role:r,name:'Audit',email:'audit-'+r+'@t.test',demo:false}));
    }catch(e){}},role);
  }
  const errs=[];
  p.on('pageerror',e=>errs.push({type:'jserror',msg:String(e.message).slice(0,200)}));
  p.on('console',m=>{
    if(m.type()!=='error')return;
    const txt=m.text();
    /* external analytics (GTM / Meta Pixel) are proxy-blocked in the sandbox —
       only same-origin resource failures count against the crawl */
    if(/ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/.test(txt))return;
    errs.push({type:'console',msg:txt.slice(0,200)});
  });
  p.on('response',r=>{
    if(r.status()===404&&r.url().startsWith('http://localhost:8137'))errs.push({type:'404',msg:r.url().replace('http://localhost:8137','')});
  });
  p.on('requestfailed',r=>{
    var why=(r.failure()||{}).errorText||'';
    // ERR_ABORTED = in-flight request cancelled by the crawler's own
    // navigation (e.g. cloud.js's async firebase-config fetch) — not a defect
    if(why==='net::ERR_ABORTED')return;
    if(r.url().startsWith('http://localhost:8137'))errs.push({type:'reqfail',msg:r.url().replace('http://localhost:8137','')+' — '+why});
  });
  for(const u of urls){
    errs.length=0;
    try{
      await p.goto(B+'/'+u,{waitUntil:'networkidle',timeout:20000});
      await p.waitForTimeout(250);
    }catch(e){errs.push({type:'nav',msg:String(e.message).slice(0,150)})}
    visited++;
    /* redirects to /auth/ mean the role guess was wrong — count separately */
    const landedAuth=/\/auth\//.test(p.url())&&!/^auth/.test(u);
    if(landedAuth)problems.push({page:u,role,type:'guard-redirect',msg:'redirected to '+p.url().replace(B,'')});
    for(const e of errs)problems.push({page:u,role,...e});
  }
  await ctx.close();
}
await browser.close();
console.log('visited',visited,'pages');
if(!problems.length)console.log('CLEAN — no JS errors, no 404s, no failed requests, no guard misroutes');
const seen=new Set();
for(const pr of problems){
  const k=pr.page+'|'+pr.type+'|'+pr.msg;
  if(seen.has(k))continue;seen.add(k);
  console.log('['+pr.type+'] /'+pr.page+' :: '+pr.msg);
}
