import { chromium } from 'playwright-core';
import { deflateRawSync } from 'node:zlib';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);

/* build a tiny real .docx (stored zip is fine — method 0) */
function crc32(u8){let t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}
  let c=0xFFFFFFFF;for(const b of u8)c=t[(c^b)&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function mkZip(files){
  const enc=new TextEncoder();const parts=[];const central=[];let off=0;
  const u16=n=>[n&255,(n>>8)&255], u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255];
  for(const f of files){
    const name=enc.encode(f.name), data=enc.encode(f.data), crc=crc32(data);
    const local=Buffer.from([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)]);
    parts.push(local,Buffer.from(name),Buffer.from(data));
    central.push(Buffer.from([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),Buffer.from(name));
    off+=30+name.length+data.length;
  }
  const cd=Buffer.concat(central);const body=Buffer.concat(parts);
  const eocd=Buffer.from([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cd.length),...u32(body.length),...u16(0)]);
  return Buffer.concat([body,cd,eocd]);
}
const docx=mkZip([{name:'word/document.xml',data:'<?xml version="1.0"?><w:document><w:body><w:p><w:r><w:t>The Treaty of Versailles caused deep resentment in Germany.</w:t></w:r></w:p><w:p><w:r><w:t>This essay will argue reparations mattered most.</w:t></w:r></w:p></w:body></w:document>'}]);

async function newPage(role,seed){
  const page=await browser.newPage();
  page.on('pageerror',e=>results.push('JSERR('+role+') — '+e.message));
  await page.addInitScript(s=>{try{
    localStorage.setItem('sy-session',JSON.stringify({role:s.role,name:'T',email:'t@t.test'}));
    for(const [k,v] of Object.entries(s.keys||{}))localStorage.setItem(k,JSON.stringify(v));
  }catch(e){}},seed);
  return page;
}
function mockExamAI(page){
  return page.evaluate(()=>{
    const render=window.SYAI?window.SYAI.render:(t=>t);
    window.SYAI={ready:()=>true,provider:()=>'mock',render,config:()=>({provider:'mock',key:'x'}),
      ask:async(sys,user)=>{
        const m=user.match(/questions (\d+) to (\d+)/i);const a=+m[1],b=+m[2];let out='';
        for(let i=a;i<=b;i++)out+='Q'+i+' ['+((i%5)+2)+' marks] Explain factor '+i+' of the topic.\nA'+i+': 1. Point one earns a mark. 2. Point two earns a mark.\n';
        return out;}};
  });
}

/* ---- 1. Student: premium-gated, 50-question live paper, ACU spend, answer sheet ---- */
let p=await newPage('student',{role:'student',keys:{
  'sy-u:t@t.test:wallet':{acus:700,plan:'student_premium',month:new Date().toISOString().slice(0,7),planExpires:new Date(Date.now()+20*864e5).toISOString()},
}});
await p.goto(B+'/study/#create',{waitUntil:'networkidle'});
ok('Student exam card present with Premium badge', await p.evaluate(()=>{const c=document.getElementById('exam-card');return !!(c&&c.querySelector('.badge.prem'))}));
await mockExamAI(p);
await p.fill('#sx-subj','History');
await p.fill('#sx-n','50');
await p.fill('#sx-title','Weimar Germany mock');
await p.click('#exam-go');
await p.waitForFunction(()=>/answer sheet ready/.test((document.getElementById('sx-status')||{}).textContent||''),null,{timeout:8000}).catch(()=>{});
const st=await p.locator('#sx-status').innerText();
ok('Student: 50-question paper built', /50 questions/.test(st));
const paper=await p.locator('#sx-out').innerText();
ok('Paper is StudYear-branded', /StudYear/.test(paper));
ok('Paper numbers to Q50', /Q50\./.test(paper));
await p.click('#sx-tab-ans');
const ans=await p.locator('#sx-out').innerText();
ok('Answer sheet has a mark-scheme answer per question', /ANSWER SHEET/.test(ans)&&/Q50\./.test(ans)&&(ans.match(/Point one earns a mark/g)||[]).length===50);
const w=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:t@t.test:wallet')).acus);
ok('Student spent 50 ACUs (700→650)', w===650);
/* child_free student is locked out */
await p.evaluate(()=>{const x=JSON.parse(localStorage.getItem('sy-u:t@t.test:wallet'));x.plan='child_free';localStorage.setItem('sy-u:t@t.test:wallet',JSON.stringify(x))});
await p.click('#exam-go');await p.waitForTimeout(250);
ok('Child Free blocked from exam builder', /Premium/.test(await p.evaluate(()=>document.body.innerText.match(/Exam Paper Builder is a Premium tool[^\n]*/)?.[0]||'')));

/* ---- 2. AR accepts .docx (any-format upload) ---- */
await p.evaluate(()=>{const x=JSON.parse(localStorage.getItem('sy-u:t@t.test:wallet'));x.plan='student_premium';localStorage.setItem('sy-u:t@t.test:wallet',JSON.stringify(x))});
await p.evaluate(()=>{location.hash='#review'});await p.waitForTimeout(150);
await p.setInputFiles('#ar-file',{name:'essay.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:docx});
await p.waitForFunction(()=>/Treaty of Versailles/.test(document.getElementById('ar-text').value),null,{timeout:4000}).catch(()=>{});
ok('AR: .docx text extracted into the box', /Treaty of Versailles/.test(await p.inputValue('#ar-text')));
await p.setInputFiles('#ar-file',{name:'old.doc',mimeType:'application/msword',buffer:Buffer.from([0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1,0,1,2,3,0,1,2,3,0,0,0,0])});
await p.waitForTimeout(300);
ok('AR: unreadable legacy format gets a helpful steer', /can't read directly|Couldn't read/.test(await p.locator('#ar-filename').innerText()));
await p.close();

/* ---- 3. Teacher: school branding + school pool spend ---- */
p=await newPage('teacher',{role:'teacher',keys:{
  'sy-u:t@t.test:teacherProfile':{name:'T',schoolCode:'SCH1'},
  'sy-school:SCH1:name':'Riverside Academy',
  'sy-school:SCH1:acu':{balance:500,burn:[]},
  'sy-school:SCH1:staff':[{email:'t@t.test',name:'T'}],
}});
await p.goto(B+'/teacher/assistant/',{waitUntil:'networkidle'});
ok('Teacher: exam mount rendered', await p.locator('#exam-mount #exam-go').count()>0);
const pn=await p.locator('#exam-pool-note').innerText();
ok('Teacher: school pool shown', /School pool: 500 ACUs at Riverside Academy/.test(pn.replace(/ /g,' ')));
await mockExamAI(p);
await p.fill('#sx-subj','Physics');await p.fill('#sx-n','12');
await p.click('#exam-go');
await p.waitForFunction(()=>/answer sheet ready/.test((document.getElementById('sx-status')||{}).textContent||''),null,{timeout:8000}).catch(()=>{});
ok('Teacher: paper built', /12 questions/.test(await p.locator('#sx-status').innerText()));
ok('Teacher: paper branded to the school', /Riverside Academy/.test(await p.locator('#sx-out').innerText()));
const pool=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-school:SCH1:acu')));
ok('Teacher: 12 ACUs drawn from school pool (500→488)', pool.balance===488);
await p.close();

/* ---- 4. Tutor: practice branding + wallet spend + fallback (no AI) ---- */
p=await newPage('tutor',{role:'tutor',keys:{
  'sy-u:t@t.test:tutorProfile':{businessName:'Nseya Tutoring'},
  'sy-u:t@t.test:wallet':{acus:200,plan:'tutor_pro'},
}});
await p.goto(B+'/tutor/assistant/',{waitUntil:'networkidle'});
ok('Tutor: exam mount rendered', await p.locator('#exam-mount #exam-go').count()>0);
await p.fill('#sx-subj','French');await p.fill('#sx-n','8');
await p.click('#exam-go'); // no SYAI key → fallback templates
await p.waitForFunction(()=>/answer sheet ready/.test((document.getElementById('sx-status')||{}).textContent||''),null,{timeout:6000}).catch(()=>{});
const tout=await p.locator('#sx-out').innerText();
ok('Tutor: fallback paper built without live AI', /Q8\./.test(tout));
ok('Tutor: paper branded to the practice', /Nseya Tutoring/.test(tout));
await p.click('#sx-tab-ans');
ok('Tutor: fallback answer sheet has mark schemes', /mark/.test(await p.locator('#sx-out').innerText()));
const tw=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:t@t.test:wallet')).acus);
ok('Tutor: 10 ACUs (min) spent for 8 questions (200→190)', tw===190);
await p.close();

for(const r of results)console.log(r);
await browser.close();
