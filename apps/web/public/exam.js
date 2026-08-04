/* StudYear Exam Paper Builder — shared across student, school-teacher and
   private-tutor workspaces. Authors an exam-style paper in any subject, up to
   50 questions, with a mark-scheme answer sheet for every question, branded to
   the account that built it (StudYear for students; the school for teachers;
   the tutor's practice for tutors). Exports through SYExport (Word/PDF).
   Live AI (SYAI) writes real curriculum questions in batches; without a live
   key a structured command-word fallback keeps the tool fully usable.
     SYExam.mount(el, {brand:{name,line}, levels, subjects, boards,
                       defaults:{level,subject,board}, goId,
                       spend(cost,label)->bool, note}) */
(function(){
  'use strict';
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var LEVELS=['Reception','KS1','KS2','11+','KS3','GCSE','IGCSE','National 5','AS','A-level','Highers','IB','BTEC','University','UG Year 1','UG Year 2','UG Year 3 / Final','Foundation year','Masters / PG','Lifelong learning'];
  var BOARDS=['','AQA','Edexcel','OCR','WJEC','CCEA','SQA','CIE','IB'];
  var SUBJECTS=['Art & Design','Biology','Business','Chemistry','Combined Science','Computer Science','Design & Technology','Drama','Economics','English Language','English Literature','French','Further Mathematics','Geography','German','History','Mathematics','Music','Non-Verbal Reasoning','Physical Education','Physics','Psychology','Religious Studies','Sociology','Spanish','Verbal Reasoning'];
  var UNI_SUBJECTS=['Accounting','Biology','Business Management','Chemistry','Computing','Criminology','Dentistry','Economics','Engineering','English Language','English Literature','Environmental Science','French','Geography','Government & Politics','Health & Social Care','History','Human Biology','Law','Marketing','Medicine','Nursing','Pharmacy','Philosophy','Psychology','Sociology','Spanish','Sports Science','Zoology'];
  function isUni(lv){return /universit|undergrad|\bUG\b|foundation year|master|postgrad|\bPG\b/i.test(String(lv||''))}
  /* ---- stage-appropriate assessment: the questions themselves match the
     national assessment for the learner's stage (KS1 phonics & number bonds,
     KS2 SATs arithmetic/reasoning/SPaG, 11+ verbal & non-verbal reasoning,
     GCSE command words, A-level/degree extended analysis). ---- */
  var PRIMARY_SUBJECTS=['Arithmetic','English Reading','Grammar & Punctuation (SPaG)','Mathematics','Non-Verbal Reasoning','Phonics','Science','Spelling','Times Tables','Verbal Reasoning'];
  var ELEVEN_SUBJECTS=['English Comprehension','Mathematics','Non-Verbal Reasoning','Spelling & Vocabulary','Verbal Reasoning'];
  function stageKind(lv){lv=String(lv||'').toLowerCase();
    if(/reception|eyfs|nursery|\bks1\b|key stage 1/.test(lv))return 'ks1';
    if(/11\s*\+|eleven plus/.test(lv))return 'eleven';
    if(/\bks2\b|key stage 2/.test(lv))return 'ks2';
    if(/\bks3\b|key stage 3|year *7|year *8|year *9/.test(lv))return 'ks3';
    if(isUni(lv))return 'degree';
    if(/a-?level|\bas\b|higher|\bib\b|btec|national 5/.test(lv))return 'alevel';
    return 'gcse';}
  function subjectsFor(lv){var k=stageKind(lv);
    if(k==='ks1'||k==='ks2')return PRIMARY_SUBJECTS.slice();
    if(k==='eleven')return ELEVEN_SUBJECTS.slice();
    if(isUni(lv))return UNI_SUBJECTS.slice();
    return SUBJECTS.slice();}
  /* exam boards (AQA/Edexcel/OCR/…) only exist for GCSE and A-level style
     qualifications. Primary (KS1/KS2), 11+, KS3 and university have no exam
     board, so the field is hidden and no board is recorded for those levels. */
  function boardApplies(lv){var k=stageKind(lv);return k==='gcse'||k==='alevel';}
  function examStyle(kind,subject){
    /* reasoning subjects define the paper type regardless of level — a
       "Non-Verbal Reasoning" paper must never be maths/algebra or verbal. */
    var s=String(subject||'').toLowerCase();
    if(/non-?verbal/.test(s)) return 'This is a NON-VERBAL REASONING paper. EVERY question must be a non-verbal reasoning item described FULLY IN WORDS (there are no pictures): shape sequences and what comes next; rotations and reflections; odd-shape-out; "each shape gains/loses one side or line"; analogies between described shapes; counting sides, lines or dots; completing a described pattern or grid. Describe each shape precisely (its name, number of sides, shading, arrows, position) so a child can answer on paper. Single best answer, 1 mark each. NEVER write arithmetic, algebra, verbal or curriculum-knowledge questions.';
    if(/verbal reasoning/.test(s)) return 'This is a VERBAL REASONING paper. EVERY question must be a classic verbal reasoning item: letter and number codes, analogies ("big is to small as tall is to __"), synonyms and antonyms, odd-one-out, letter series, hidden words, word–number logic and short logic puzzles. Self-contained, single best answer, 1 mark each. NEVER write arithmetic, algebra or subject-knowledge questions.';
    switch(kind){
      case 'ks1': return 'These are children aged 5–7 (Key Stage 1 / early years). Use VERY simple, one-step questions in short concrete language with familiar contexts (toys, animals, family). PHONICS: ask the child to sound out and read a simple word, spot the first/last sound, or count the sounds (phonemes); include the odd read-it pseudo-word as in the phonics screening check. MATHS: number bonds, counting on, adding and taking away within 20, doubling, and the 2, 5 and 10 times tables. READING: a one- or two-sentence passage then a literal question. 1 mark each. NEVER use command words like "evaluate" or "analyse".';
      case 'ks2': return 'These are Key Stage 2 pupils (ages 7–11) sitting SATs-style questions — match the national curriculum tests. MATHS: mix ARITHMETIC (a calculation to work out — +, −, ×, ÷, fractions, percentages) with REASONING (a short real-life word problem, sometimes multi-step, with money, time or measures). ENGLISH READING: give a 2–4 sentence passage then retrieval, inference ("why…"), and vocabulary ("find and copy a word that means…") questions. GRAMMAR/PUNCTUATION/SPELLING (SPaG): identify word classes (noun, verb, adjective, adverb), add or correct punctuation, or choose the correct spelling. 1–3 marks, plain child-friendly language, no GCSE command words.';
      case 'eleven': return 'This is 11+ grammar-school selection (age 10–11). Use classic 11+ item types. VERBAL REASONING: letter/number codes, analogies ("big is to small as tall is to __"), odd-one-out, synonyms & antonyms, letter series, simple word logic. NON-VERBAL REASONING described fully in words (shape sequences, rotations, reflections, odd-shape-out, "shapes gain one side each time") — describe every shape precisely so NO picture is needed. MATHS: multi-step problem solving with measures, money and time. ENGLISH: comprehension and vocabulary. Single best answer, 1 mark each, quick timed-test style.';
      case 'ks3': return 'These are Key Stage 3 pupils (Years 7–9) building towards GCSE. Clear curriculum questions a little below GCSE demand, some short "explain" questions. 1–4 marks.';
      case 'alevel': return 'A-level / Level 3 standard. Extended application and analysis/evaluation questions; some longer 6–12 mark items with levels-based mark schemes; assume strong subject foundations.';
      case 'degree': return 'Undergraduate / postgraduate level. Critical, essay and applied problem questions requiring analysis, evaluation and reference to theory or the literature; higher mark tariffs and academic register.';
      default: return 'GCSE (grade 9–1) exam style. Use proper command words (state, describe, explain, calculate, compare, analyse, evaluate) with marks matched to demand (1–6), and a mark scheme showing where each mark is earned.';
    }
  }
  /* real, stage-appropriate questions for the on-device fallback (demo/offline);
     live accounts get AI questions styled by examStyle above. [q, marks, answer] */
  var STAGE_BANK={
    ks1:{
      maths:[['What is 3 + 5?',1,'8.'],['What is 10 − 4?',1,'6.'],['What is double 6?',1,'12.'],['2 × 5 = ?',1,'10.'],['Count on: 7, 8, 9, __, __',1,'10 and 11.'],['6 + __ = 10. What is the missing number?',1,'4.'],['10 × 3 = ?',1,'30.'],['What is 5 + 5?',1,'10.'],['Which is bigger: 8 or 5?',1,'8.'],['Half of 8 is __?',1,'4.']],
      english:[['Sound out and read this word: s-u-n. What is the word?',1,'sun.'],['Which word begins with the same sound as “fish”? frog / dog / cat',1,'frog.'],['How many sounds (phonemes) are in the word “cat”?',1,'3 (c-a-t).'],['Read these — which is a REAL word? “ship” or “vodo”',1,'ship (vodo is a pseudo-word).'],['Fill the missing letter: c_t — a small furry pet.',1,'a → cat.'],['Which word rhymes with “hat”? cat / dog / sun',1,'cat.'],['Say the first sound in the word “dog”.',1,'d.'],['Read the word: b-e-d. What is it?',1,'bed.']]
    },
    ks2:{
      maths:[['Work out 3,482 + 1,675.',1,'5,157.'],['Work out 6 × 8.',1,'48.'],['Work out 1,000 − 356.',1,'644.'],['What is 3/4 of 20?',1,'15.'],['What is 25% of 80?',1,'20.'],['Work out 144 ÷ 12.',1,'12.'],['A pencil costs 45p. How much do 6 pencils cost? Give your answer in pounds.',2,'£2.70 (6 × 45p = 270p).'],['There are 32 children in a class. 3/8 have school dinners. How many is that?',2,'12 (32 ÷ 8 = 4, then 4 × 3).'],['A film starts at 14:35 and lasts 1 hour 50 minutes. What time does it end?',2,'16:25.'],['Round 3,748 to the nearest hundred.',1,'3,700.']],
      english:[['Read: “The old house stood at the end of the lane, its garden overgrown.” Find and copy one word that shows the garden was not cared for.',1,'overgrown.'],['Circle the adjective: “The enormous elephant splashed in the river.”',1,'enormous.'],['Add the missing punctuation: what time does the train leave',1,'What time does the train leave?'],['Choose the correct spelling: necessary / neccessary.',1,'necessary.'],['Which word is the verb? “The dog barked loudly.”',1,'barked.'],['Write the plural of “baby”.',1,'babies.'],['Underline the adverb: “She sang beautifully.”',1,'beautifully.'],['Read: “Tom raced home because it had started to rain.” Why did Tom race home?',1,'Because it had started to rain.']],
      science:[['Name the process by which plants make their food.',1,'Photosynthesis.'],['Which organ pumps blood around the body?',1,'The heart.'],['Name the three states of matter.',2,'Solid, liquid and gas.'],['What do we call an animal that eats only plants?',1,'A herbivore.'],['Name the force that pulls objects towards the Earth.',1,'Gravity.'],['Which part of a plant takes in water from the soil?',1,'The roots.']]
    },
    eleven:{
      vr:[['If the code for CAT is 3-1-20 (A=1, B=2 …), what is the code for DOG?',1,'4-15-7.'],['Find the odd one out: apple, banana, carrot, grape, pear.',1,'carrot — it is a vegetable; the rest are fruit.'],['Complete: “big” is to “small” as “tall” is to __.',1,'short.'],['Which word means the same as “rapid”? slow / quick / heavy / late',1,'quick.'],['Which word is the opposite of “ancient”? old / modern / dusty / historic',1,'modern.'],['What comes next: 2, 4, 8, 16, __?',1,'32 (each number doubles).'],['Continue the series: A, C, E, G, __?',1,'I (skip one letter each time).'],['Odd one out: square, circle, triangle, rectangle?',1,'circle — it has no straight sides or corners.']],
      nvr:[['A pattern goes: circle, square, circle, square, circle, __. What shape comes next?',1,'square.'],['Shapes gain one side each time: triangle (3), square (4), pentagon (5), __? Name the next shape.',1,'hexagon (6 sides).'],['A shape has 8 straight sides. What is its name?',1,'octagon.'],['A shape has 5 straight sides. What is its name?',1,'pentagon.'],['If a triangle is turned upside down, how many sides does it still have?',1,'3 — turning a shape never changes its number of sides.']],
      maths:[['A jug holds 2 litres. How many 250 ml cups can be filled from it?',1,'8 (2000 ÷ 250).'],['A train leaves at 09:45 and arrives at 11:20. How long is the journey?',1,'1 hour 35 minutes.'],['What is 15% of 200?',1,'30.'],['Work out 7 × 12.',1,'84.'],['Half of a number is 24. What is the number?',1,'48.']],
      english:[['Which word means the same as “brave”? timid / bold / quiet / weak',1,'bold.'],['Choose the correct spelling: seperate / separate.',1,'separate.'],['Give an antonym (opposite) of “expand”.',1,'contract / shrink.'],['Which is spelt correctly: definately / definitely?',1,'definitely.']]
    }
  };
  function poolKey(subject){var s=String(subject||'').toLowerCase();
    if(/non-?verbal/.test(s))return 'nvr';
    if(/verbal/.test(s))return 'vr';
    if(/phonic|spell|read|english|grammar|spag|vocab|compreh|literac/.test(s))return 'english';
    if(/science|biolog|chem|physic/.test(s))return 'science';
    return 'maths';}
  function stageFallback(kind,subject,n){
    var key=poolKey(subject);
    /* reasoning subjects always draw from the 11+ verbal/non-verbal bank,
       whatever the level — a KS2 "Non-Verbal Reasoning" paper must be NVR. */
    var banks=(key==='vr'||key==='nvr')?STAGE_BANK.eleven:STAGE_BANK[kind];
    if(!banks)return null;
    var pool=banks[key]||banks.maths||banks.english||banks.vr;
    if(!pool||!pool.length)return null;
    var out=[];for(var i=0;i<n;i++){var t=pool[i%pool.length];out.push({q:t[0],marks:t[1],a:t[2]});}
    return out;}
  /* command-word rotation for the on-device fallback: [stem, marks, scheme] */
  var TEMPLATES=[
    ['Define the term “{t}”.',2,'1 mark — precise definition naming the key idea; 1 mark — correct use of subject terminology.'],
    ['State two key facts about {t}.',2,'1 mark per correct, distinct fact (max 2).'],
    ['Describe the main features of {t}.',3,'1 mark per relevant feature described (max 3); no explanation required at this command word.'],
    ['Explain how {t} works, using an example.',4,'1 mark — cause identified; 1 mark — effect linked; 1 mark — chain of reasoning complete; 1 mark — relevant example applied.'],
    ['Explain why {t} is important in {s}.',4,'1 mark per reasoned point in a cause→effect chain (max 3); 1 mark — significance explicitly stated.'],
    ['Compare two aspects of {t}.',4,'1 mark per valid point of comparison (max 2); 1 mark per point developed with detail (max 2). Comparative language required.'],
    ['Give one example of {t} and explain its significance.',3,'1 mark — valid example; 2 marks — significance explained with a how/why chain.'],
    ['Analyse the role of {t} in {s}.',5,'Level-marked: 1–2 marks simple statements; 3–4 marks developed analysis with links; 5 marks sustained analysis with judgement.'],
    ['Suggest how {t} could be applied to an unfamiliar situation.',4,'1 mark — sensible application; 2 marks — method/steps outlined; 1 mark — limitation or condition noted.'],
    ['Evaluate the importance of {t}. Justify your answer.',6,'Level-marked: 1–2 marks one-sided points; 3–4 marks balanced points both ways; 5–6 marks balanced argument with a justified conclusion.']
  ];
  /* natural fallback topics per subject — questions name REAL content, never
     'Define the term "Mathematics"' */
  var FALLBACK_TOPICS={
    'Mathematics':['fractions and percentages','solving linear equations','quadratic equations','ratio and proportion','angles in polygons','probability','averages and range'],
    'Biology':['cell structure','photosynthesis','enzymes','the circulatory system','natural selection','food chains and ecosystems'],
    'Chemistry':['atomic structure','ionic and covalent bonding','acids and alkalis','rates of reaction','the periodic table','electrolysis'],
    'Physics':['forces and motion','energy transfers','electrical circuits','waves','magnetism','pressure in fluids'],
    'Combined Science':['cells and organisation','chemical reactions','energy','forces','ecosystems','atomic structure'],
    'Geography':['rivers and flooding','coastal erosion','urbanisation','climate change','tectonic hazards','development and inequality'],
    'History':['causes of the First World War','life in Nazi Germany','the Cold War','medicine through time','the Norman Conquest','civil rights'],
    'English Language':['persuasive writing techniques','analysing language in fiction','structure and its effects','comparing viewpoints','descriptive writing'],
    'English Literature':['Macbeth','An Inspector Calls','A Christmas Carol','power and conflict poetry','character and theme analysis'],
    'Computer Science':['algorithms and flowcharts','binary and data representation','networks','programming constructs','cyber security'],
    'Business':['the marketing mix','cash flow','business ownership','motivation and retention','break-even analysis'],
    'French':['family and relationships','school life','holidays and travel','future plans','healthy living'],
    'Spanish':['family and relationships','school life','holidays and travel','future plans','healthy living'],
    'Religious Studies':['beliefs about God','religious practices','peace and conflict','crime and punishment','relationships and families'],
    'Psychology':['memory models','conformity and obedience','attachment','research methods'],
    'Economics':['supply and demand','price elasticity','market failure','fiscal and monetary policy']};
  function fallbackQuestions(n,subject,level,topics){
    var sf=stageFallback(stageKind(level),subject,n);   // KS1/KS2/11+ get real stage questions
    if(sf)return sf;
    var ts=(topics&&topics.length?topics:(FALLBACK_TOPICS[subject]||[subject])).filter(Boolean);
    var out=[];
    for(var i=0;i<n;i++){
      var tpl=TEMPLATES[i%TEMPLATES.length];
      var t=ts[i%ts.length]||subject;
      var q=tpl[0].replace(/\{t\}/g,t).replace(/\{s\}/g,subject);
      if(t===subject)q=q.replace(' in '+subject+'.','.'); // avoid 'X is important in X'
      out.push({q:q,marks:tpl[1],
        a:tpl[2]+' Pitch expected depth at '+level+' standard.'});
    }
    return out;
  }
  /* mark-scheme answers rendered as readable point-by-point lines, whether
     they arrive as AI-written numbered lines or template semicolon points */
  function fmtAnswer(a){
    var s=esc(String(a||'').trim());
    if(/\n/.test(s))return s.split(/\n+/).map(function(l){return '<div style="margin:3px 0">'+l.trim()+'</div>'}).join('');
    if(/;\s/.test(s))return s.split(/;\s+/).map(function(l){return '<div style="margin:3px 0">• '+l.replace(/\.$/,'')+'</div>'}).join('');
    return s;
  }
  async function liveQuestions(n,subject,level,board,topics,difficulty,onProgress){
    var out=[],batch=10;
    for(var start=0;start<n;start+=batch){
      var count=Math.min(batch,n-start);
      if(onProgress)onProgress(start,n);
      var sys='You are an experienced '+level+' '+subject+' assessment writer'+(board?' writing to the '+board+' specification':'')+
        '. '+examStyle(stageKind(level),subject)+' Difficulty: '+difficulty+
        '. Return EXACTLY this format for each question, nothing else:\n'+
        'Q<number> [<marks> marks] <question text on one line>\n'+
        'A<number>: <mark-scheme answer showing where each mark is earned>\n'+
        'Keep every question fully self-contained — no images required. Real curriculum content, never placeholders.';
      var user='Write questions '+(start+1)+' to '+(start+count)+' of a '+n+'-question '+subject+' exam paper for '+level+
        (topics.length?' covering these topics: '+topics.join('; ')+'.':'.')+
        ' Continue numbering from Q'+(start+1)+'.';
      /* metered:true — the whole paper is charged ONCE by the caller (below),
         not per question-batch; ask() still gates on the ACU balance */
      var text=await window.SYAI.ask(sys,user,{maxTokens:2400,temperature:0.7,noRecover:true,timeoutMs:30000,metered:true});
      var re=/Q(\d+)\s*\[(\d+)\s*marks?\]\s*([^\n]+)\n+A\1:\s*([\s\S]*?)(?=\nQ\d+\s*\[|\s*$)/g,m;
      while((m=re.exec(text)))out.push({q:m[3].trim(),marks:parseInt(m[2],10)||2,a:m[4].trim()});
    }
    return out;
  }
  function headerHtml(brand,meta,isAnswers){
    var total=meta.total,mins=Math.max(10,Math.round(total*1.2));
    return '<div style="border-bottom:3px double #333;padding-bottom:10px;margin-bottom:14px">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap">'+
      '<div><div style="font-size:24px;font-weight:700;letter-spacing:.02em">'+esc(brand.name)+'</div>'+
      (brand.line?'<div class="meta">'+esc(brand.line)+'</div>':'')+'</div>'+
      '<div style="text-align:right"><div style="font-size:18px;font-weight:700">'+esc(meta.title)+(isAnswers?' — ANSWER SHEET':'')+'</div>'+
      '<div class="meta">'+esc(meta.subject)+' · '+esc(meta.level)+(meta.board?' · '+esc(meta.board):'')+'</div></div></div>'+
      '<div class="meta" style="margin-top:8px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">'+
      '<span>'+meta.n+' questions · Total '+total+' marks · Suggested time '+mins+' minutes</span>'+
      '<span>Date: '+new Date().toLocaleDateString('en-GB')+'</span></div>'+
      (isAnswers?'<div style="margin-top:8px;padding:7px 10px;background:#fdf3d7;border:1px solid #d9b64e;font-size:12.5px"><b>Teacher / marker copy.</b> One mark-scheme answer per question. Award marks only where the scheme point is met.</div>'
        :'<div style="margin-top:10px;font-size:13px">Name: ______________________________ &nbsp;&nbsp; Class: ______________ &nbsp;&nbsp; Score: ______ / '+total+'</div>'+
         '<div style="margin-top:8px;padding:7px 10px;background:#eef3fb;border:1px solid #b8cbe8;font-size:12.5px"><b>Instructions.</b> Answer ALL questions in the spaces provided. Marks for each question are shown in brackets. Check your working.</div>')+
      '</div>';
  }
  function answerLines(marks){
    var lines=Math.min(8,Math.max(2,marks+1)),h='';
    for(var i=0;i<lines;i++)h+='<div style="border-bottom:1px dotted #999;height:22px"></div>';
    return h;
  }
  function paperHtml(brand,meta,qs){
    return headerHtml(brand,meta,false)+qs.map(function(x,i){
      return '<div style="margin:14px 0;page-break-inside:avoid"><div style="display:flex;justify-content:space-between;gap:10px">'+
        '<div style="font-size:14px"><b>Q'+(i+1)+'.</b> '+esc(x.q)+'</div>'+
        '<div style="white-space:nowrap;font-size:12.5px;color:#555">['+x.marks+' mark'+(x.marks===1?'':'s')+']</div></div>'+
        answerLines(x.marks)+'</div>';
    }).join('')+'<div class="meta" style="margin-top:18px;border-top:1px solid #ccc;padding-top:8px">END OF PAPER · Produced with '+esc(brand.name)+' · An answer sheet accompanies every question.</div>';
  }
  function answersHtml(brand,meta,qs){
    return headerHtml(brand,meta,true)+qs.map(function(x,i){
      return '<div style="margin:12px 0;page-break-inside:avoid;border-left:3px solid #2E6BC4;padding-left:10px">'+
        '<div style="font-size:13.5px"><b>Q'+(i+1)+'.</b> '+esc(x.q)+' <span style="color:#555">['+x.marks+']</span></div>'+
        '<div style="font-size:13px;margin-top:4px;line-height:1.55">'+fmtAnswer(x.a)+'</div></div>';
    }).join('')+'<div class="meta" style="margin-top:18px;border-top:1px solid #ccc;padding-top:8px">END OF MARK SCHEME · Produced with '+esc(brand.name)+'</div>';
  }
  function wordBlocks(brand,meta,qs,isAnswers){
    var blocks=[{h:brand.name+(brand.line?' — '+brand.line:'')},
      {p:meta.title+(isAnswers?' — ANSWER SHEET':'')+' · '+meta.subject+' · '+meta.level+(meta.board?' · '+meta.board:'')},
      {p:meta.n+' questions · Total '+meta.total+' marks'+(isAnswers?'':' · Name: ____________  Class: ________')}];
    qs.forEach(function(x,i){
      blocks.push({p:'Q'+(i+1)+'. '+x.q+'  ['+x.marks+' mark'+(x.marks===1?'':'s')+']'});
      if(isAnswers){
        var lines=/\n/.test(x.a)?String(x.a).split(/\n+/):(/;\s/.test(x.a)?String(x.a).split(/;\s+/).map(function(l){return '• '+l}):['Answer: '+x.a]);
        lines.forEach(function(l){if(l.trim())blocks.push({p:l.trim()})});
      }else{
        blocks.push({p:'Answer: ............................................................................................................'});
      }
    });
    blocks.push({p:(isAnswers?'END OF MARK SCHEME':'END OF PAPER')+' · Produced with '+brand.name});
    return blocks;
  }
  function mount(el,opts){
    opts=opts||{};var brand=opts.brand||{name:'StudYear',line:'AI Academic Operating System'};
    var levels=opts.levels||LEVELS,boards=opts.boards||BOARDS;
    var subjects=(opts.subjects&&opts.subjects.length?opts.subjects.slice():SUBJECTS.slice());
    var d=opts.defaults||{};var goId=opts.goId||'sx-go';
    /* one-tap handoff from the student record / interventions: another page
       stages sy-prefill-exam and the builder arrives pre-filled — teachers
       never re-type what the OS already knows */
    try{
      var pf=JSON.parse(localStorage.getItem('sy-prefill-exam'));
      if(pf){d=Object.assign({},d,pf);localStorage.removeItem('sy-prefill-exam');}
    }catch(e){}
    el.innerHTML=
      '<label class="f">Paper title</label><input type="text" id="sx-title" value="'+esc(d.title||'')+'" placeholder="e.g. End of Unit Test — Forces & Motion">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">'+
      '<div><label class="f">Subject</label><select id="sx-subj">'+
        (function(){var list=subjects.slice();
          if(d.subject&&list.indexOf(d.subject)<0)list.unshift(d.subject);
          return '<option value="">Select a subject</option>'+list.map(function(s){return '<option'+(s===d.subject?' selected':'')+'>'+esc(s)+'</option>'}).join('');
        })()+'</select></div>'+
      '<div><label class="f">Level</label><select id="sx-level" data-uni-src="1">'+levels.map(function(l){return '<option'+(l===d.level?' selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select></div>'+
      '<div id="sx-board-wrap"><label class="f">Exam board</label><select id="sx-board">'+boards.map(function(b){return '<option'+(b===(d.board||'')?' selected':'')+'>'+esc(b)+'</option>'}).join('')+'</select></div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">'+
      '<div><label class="f">Questions (1–50)</label><input type="number" id="sx-n" value="10" min="1" max="50"></div>'+
      '<div><label class="f">Difficulty</label><select id="sx-diff"><option>Foundation</option><option selected>Standard</option><option>Higher / stretch</option></select></div></div>'+
      '<label class="f" style="margin-top:10px">Topics (optional, comma-separated)</label>'+
      '<input type="text" id="sx-topics" value="'+esc(d.topics||'')+'" placeholder="e.g. speed and velocity, Newton’s laws, terminal velocity">'+
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
      '<button class="btn" id="'+goId+'">Build exam paper</button><span class="note" id="sx-status" style="margin:0">'+esc(opts.note||'')+'</span></div>'+
      '<div id="sx-outwrap" style="display:none;margin-top:14px">'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+
      '<button class="btn ghost sm" id="sx-tab-paper">📄 Question paper</button>'+
      '<button class="btn ghost sm" id="sx-tab-ans">✅ Answer sheet</button>'+
      '<button class="btn sm" id="sx-exp-paper">⬇ Export paper</button>'+
      '<button class="btn sm" id="sx-exp-ans">⬇ Export answer sheet</button></div>'+
      '<div id="sx-out" style="background:#fff;color:#111;border-radius:8px;padding:18px 22px;max-height:520px;overflow:auto;font-family:Georgia,serif;line-height:1.5"></div></div>';
    function $(id){return el.querySelector('#'+id)}
    var state=null;
    function show(which){
      if(!state)return;
      $('sx-out').innerHTML=which==='ans'?answersHtml(brand,state.meta,state.qs):paperHtml(brand,state.meta,state.qs);
      $('sx-tab-paper').classList.toggle('ghost',which==='ans');
      $('sx-tab-ans').classList.toggle('ghost',which!=='ans');
    }
    $('sx-tab-paper').onclick=function(){show('paper')};
    $('sx-tab-ans').onclick=function(){show('ans')};
    $('sx-exp-paper').onclick=function(){if(!state)return;
      window.SYExport.menu(this,{word:function(){window.SYExport.word(state.meta.title||'exam-paper',{title:state.meta.title,blocks:wordBlocks(brand,state.meta,state.qs,false)})},
        pdf:function(){window.SYExport.pdf(state.meta.title,paperHtml(brand,state.meta,state.qs))}})};
    $('sx-exp-ans').onclick=function(){if(!state)return;
      window.SYExport.menu(this,{word:function(){window.SYExport.word((state.meta.title||'exam-paper')+' — answers',{title:state.meta.title+' — Answer sheet',blocks:wordBlocks(brand,state.meta,state.qs,true)})},
        pdf:function(){window.SYExport.pdf(state.meta.title+' — Answer sheet',answersHtml(brand,state.meta,state.qs))}})};
    /* subject catalogue follows the level: university subjects when a
       university level is chosen, school subjects otherwise; alphabetical */
    (function(){
      var lvEl=$('sx-level'),sjEl=$('sx-subj');if(!lvEl||!sjEl||opts.subjects)return;
      function refill(){var keep=sjEl.value,list=subjectsFor(lvEl.value).slice().sort(function(a,b){return a.localeCompare(b)});
        sjEl.innerHTML='<option value="">Select a subject</option>'+list.map(function(s){return '<option>'+esc(s)+'</option>'}).join('');
        if(list.indexOf(keep)>=0)sjEl.value=keep;}
      lvEl.addEventListener('input',refill);
      /* refill on load when the initial level isn't the default GCSE subject set */
      var _k0=stageKind(lvEl.value);if(isUni(lvEl.value)||_k0==='ks1'||_k0==='ks2'||_k0==='eleven')refill();
    })();
    /* hide the Exam board field for levels that don't have one (primary, 11+,
       KS3, university) — only GCSE / A-level style papers carry a board. */
    (function(){
      var lvEl=$('sx-level'),bw=$('sx-board-wrap');if(!lvEl||!bw)return;
      function toggle(){bw.style.display=boardApplies(lvEl.value)?'':'none';}
      lvEl.addEventListener('input',toggle);toggle();
    })();
    $(goId).onclick=async function(){
      var subject=$('sx-subj').value.trim(),level=$('sx-level').value,board=boardApplies(level)?$('sx-board').value:'';
      var n=Math.max(1,Math.min(50,parseInt($('sx-n').value,10)||10));
      var title=$('sx-title').value.trim()||(subject+' — '+level+' exam paper');
      var topics=$('sx-topics').value.split(',').map(function(t){return t.trim()}).filter(Boolean);
      var diff=$('sx-diff').value;
      if(!subject){$('sx-status').textContent='Select a subject first.';return}
      var cost=Math.max(10,n);
      /* ACU-gated when built with live AI (no free AI). Fallback questions use
         no model, so they are not gated or charged. The whole paper is charged
         ONCE below, only when the AI actually produced it. */
      var useAI=!!(window.SYAI&&window.SYAI.ready());
      if(useAI&&window.SYAI.canAfford&&!window.SYAI.canAfford(cost)){$('sx-status').textContent='Not enough ACUs — top up to build the paper with AI ('+cost+' needed).';return}
      var btn=$(goId);btn.disabled=true;
      try{
        var qs;
        if(useAI){
          $('sx-status').textContent='Writing your paper with '+window.SYAI.provider()+'…';
          try{qs=await liveQuestions(n,subject,level,board,topics,diff,function(done,total){$('sx-status').textContent='Writing questions '+(done+1)+'–'+Math.min(done+10,total)+' of '+total+'…'});}
          catch(e){qs=null}
          if(qs&&qs.length>n)qs=qs.slice(0,n);
          if(qs&&qs.length){try{window.SYAI.charge&&window.SYAI.charge(cost,null,'Exam paper: '+title+' ('+n+' questions)')}catch(e){}}
        }
        if(!qs||!qs.length)qs=fallbackQuestions(n,subject,level,topics);
        var total=qs.reduce(function(a,x){return a+(x.marks||0)},0);
        state={meta:{title:title,subject:subject,level:level,board:board,n:qs.length,total:total},qs:qs};
        $('sx-outwrap').style.display='block';
        $('sx-status').textContent=qs.length+' questions · '+total+' marks · answer sheet ready — export as Word or PDF.';
        show('paper');
        if(opts.onBuilt)try{opts.onBuilt(state)}catch(e){}
      }finally{btn.disabled=false}
    };
  }
  window.SYExam={mount:mount};
})();
