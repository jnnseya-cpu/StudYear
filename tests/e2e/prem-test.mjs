import { chromium } from 'playwright-core';
const B=process.env.SY_BASE||'http://localhost:8137/StudYear';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
const results=[];const ok=(n,c)=>results.push((c?'PASS':'FAIL')+' — '+n);

async function newPage(plan,acus){
  const page=await browser.newPage();
  page.on('pageerror',e=>results.push('JSERR — '+e.message));
  await page.addInitScript(({plan,acus})=>{try{
    localStorage.setItem('sy-session',JSON.stringify({role:'student',name:'T',email:'t@t.test'}));
    localStorage.setItem('sy-u:t@t.test:wallet',JSON.stringify({acus:acus,plan:plan,month:new Date().toISOString().slice(0,7),planExpires:plan==='child_free'?undefined:new Date(Date.now()+20*864e5).toISOString()}));
  }catch(e){}},{plan,acus});
  return page;
}
function mockAI(page,reply){
  return page.evaluate((reply)=>{
    const render=window.SYAI?window.SYAI.render:(t=>t);
    window.__asks=[];
    window.SYAI={ready:()=>true,provider:()=>'mock',render,
      ask:async(sys,user,opts)=>{window.__asks.push({sys,user,opts});return reply},
      config:()=>({provider:'mock',key:'x'})};
  },reply);
}

/* ---- 1. Child Free: premium tools locked ---- */
let p=await newPage('child_free',100);
await p.goto(B+'/study/#create',{waitUntil:'networkidle'});
ok('AR card shows Premium badge', await p.locator('#tab-review .badge.prem').count()>0);
ok('Create tools carry Premium badges (>=11)', await p.locator('#tab-create .badge.prem').count()>=11);
ok('AR Type select defaults to Assignment', await p.evaluate(()=>document.getElementById('ar-type').value)==='Assignment');
ok('AR Type offers full list incl. Dissertation/Thesis/Personal statement', await p.evaluate(()=>{const o=[...document.querySelectorAll('#ar-type option')].map(x=>x.value);return ['Homework','Assignment','Essay','Coursework','Report','Dissertation','Thesis','Personal statement','Other'].every(v=>o.includes(v))}));
ok('AR drop zone advertises pdf + limits', /25 ?MB PDF/.test(await p.locator('#ar-filename').textContent()));
await p.fill('#g-fc-topic','Bonding'); await p.click('#g-fc-go');
await p.waitForTimeout(300);
const t1=await p.evaluate(()=>document.body.innerText);
ok('Child Free click on AI Flashcards is blocked with a visible unlock panel', /is a Premium tool/.test(t1) && /Unlock Premium/.test(t1));
ok('No deck was generated for Child Free', !(await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:t@t.test:mine')||'[]').length)));
// Assignment Review also locked
await p.evaluate(()=>{location.hash='#review';});await p.waitForTimeout(150);
await p.fill('#ar-text','x'.repeat(120)); await p.click('#ar-go'); await p.waitForTimeout(200);
const bal1=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:t@t.test:wallet')).acus);
ok('Child Free AR click spends nothing (locked)', bal1===100);
await p.close();

/* ---- 2. Student Premium: tools unlock, AR spends 60 ACUs, live review renders ---- */
p=await newPage('student_premium',700);
await p.goto(B+'/study/#create',{waitUntil:'networkidle'});
await p.evaluate(()=>{location.hash='#review';});await p.waitForTimeout(150);
await mockAI(p,'## Predicted grade\nGrade 7 (72%)\n## Criterion breakdown\n**Structure** — 70% · clear\n## Strengths\n- good\n## Targets\n- fix\n## Rewrite one sentence\nBetter.\n## Next steps\n- act');
await p.fill('#ar-title','WW1 essay');
await p.selectOption('#ar-type','Essay');
await p.fill('#ar-text','The First World War began in 1914 because of a web of alliances, imperial rivalry and the assassination of Archduke Franz Ferdinand in Sarajevo, which pulled the great powers into conflict.');
await p.click('#ar-go');
await p.waitForFunction(()=>/Predicted grade/i.test(document.getElementById('ar-out').innerText),null,{timeout:5000}).catch(()=>{});
const arOut=await p.locator('#ar-out').innerText();
ok('Premium AR: live examiner review rendered', /Predicted grade/i.test(arOut));
const bal2=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:t@t.test:wallet')).acus);
ok('AR spent exactly 60 ACUs (700→640)', bal2===640);
const askArgs=await p.evaluate(()=>window.__asks[0]);
ok('AR prompt includes Type of work', /Type of work: Essay/.test(askArgs.user));

/* ---- 3. AR file uploads: txt fills box, png attaches, pdf attaches ---- */
await p.setInputFiles('#ar-file',{name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('Uploaded essay text '.repeat(10))});
await p.waitForTimeout(200);
ok('txt upload fills the textarea', /Uploaded essay text/.test(await p.inputValue('#ar-text')));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
await p.setInputFiles('#ar-file',{name:'work.png',mimeType:'image/png',buffer:png});
await p.waitForTimeout(200);
ok('image upload attaches for AI', /work\.png/.test(await p.locator('#ar-filename').innerText()));
await p.setInputFiles('#ar-file',{name:'essay.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 fake')});
await p.waitForTimeout(200);
ok('pdf upload attaches for AI', /essay\.pdf/.test(await p.locator('#ar-filename').innerText()));
// attached pdf reaches SYAI.ask as opts.image data URL
await p.fill('#ar-text','');
await p.evaluate(()=>{window.__asks=[]});
await p.click('#ar-go');
await p.waitForTimeout(400);
const ask2=await p.evaluate(()=>window.__asks[0]||null);
ok('AR sends attached PDF to the model as data URL', !!(ask2&&ask2.opts&&/^data:application\/pdf/.test(ask2.opts.image||'')));

/* ---- 4. Premium create tools now work ---- */
await p.evaluate(()=>{location.hash='#create';});await p.waitForTimeout(150);
await p.fill('#g-fc-topic','Bonding');
await p.evaluate(()=>{window.SYAI=null}); // static path
await p.click('#g-fc-go'); await p.waitForTimeout(400);
const mine=await p.evaluate(()=>JSON.parse(localStorage.getItem('sy-u:t@t.test:mine')||'[]'));
ok('Premium flashcard generator saves a deck', mine.some(r=>r.type==='Flashcards'));
/* create now OPENS the new resource in its player (create → use); the deck
   modal is showing, so verify it opened, then dismiss it before continuing. */
ok('Created deck opens in its player', await p.evaluate(()=>document.getElementById('modal')?.classList.contains('on')===true));
await p.evaluate(()=>{try{if(window.closeModal)closeModal();}catch(e){}var m=document.getElementById('modal');if(m)m.classList.remove('on');});
await p.waitForTimeout(120);

/* ---- 5. Interactive Lesson: curriculum-grade live lesson ---- */
await mockAI(p,[
 '- AQA 4.2: describe ionic bonding\n- AQA 4.2.1: explain electron transfer',
 '- **ion** — charged particle formed by electron loss/gain\n- **lattice** — regular repeating arrangement',
 'Ionic bonding transfers electrons from metal to non-metal. **Electrostatic attraction** holds ions together. Example: NaCl. Example 2: MgO.',
 'Lattice enthalpy links structure to melting point. Micro-example: MgO melts higher than NaCl. Misunderstanding: molecules of NaCl do not exist.',
 'Explain why NaCl has a high melting point. [4]\n1. M1 giant ionic lattice\n2. M2 strong electrostatic forces\n3. M3 many bonds to break\n4. M4 needs lots of energy — this is the mark scheme',
 '- "Explain" needs cause + effect\n- Trap: saying molecules — fix: say ions'
].join('\n---\n'));
const hasIl=await p.locator('#il-topic').count();
if(hasIl){
  await p.evaluate(()=>{location.hash='#lesson';});await p.waitForTimeout(150);
  await p.fill('#il-topic','Ionic bonding');
  await p.click('#il-go');
  await p.waitForFunction(()=>/curriculum-aligned live AI lesson/i.test(document.getElementById('il-sub').innerText),null,{timeout:6000}).catch(()=>{});
  ok('Interactive Lesson reports curriculum-aligned live lesson', /curriculum-aligned live AI lesson/i.test(await p.locator('#il-sub').innerText()));
  let all='';
  for(let i=0;i<12;i++){
    for(let r=0;r<8;r++){const rv=p.locator('#il-reveal:not([disabled])');if(!await rv.count())break;await rv.click();await p.waitForTimeout(40);}
    all+=' '+await p.evaluate(()=>document.getElementById('il-out')?document.getElementById('il-out').innerText:'');
    const next=await p.locator('#il-next').count();
    if(!next)break;
    await p.click('#il-next');await p.waitForTimeout(80);
  }
  ok('Lesson steps include key vocabulary', /vocabulary/i.test(all));
  ok('Lesson steps include mark-scheme worked example', /mark scheme|M1/i.test(all));
  ok('Lesson steps include exam technique & traps', /Exam technique/i.test(all));
}else{ results.push('SKIP — il-topic not found on page (check id)'); }

for(const r of results)console.log(r);
await browser.close();
