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
  var LEVELS=['Reception','KS1','KS2','11+','KS3','GCSE','IGCSE','National 5','AS','A-level','Highers','IB','BTEC','University'];
  var BOARDS=['','AQA','Edexcel','OCR','WJEC','CCEA','SQA','CIE','IB'];
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
  function fallbackQuestions(n,subject,level,topics){
    var ts=(topics&&topics.length?topics:[subject]).filter(Boolean);
    var out=[];
    for(var i=0;i<n;i++){
      var tpl=TEMPLATES[i%TEMPLATES.length];
      var t=ts[Math.floor(i/TEMPLATES.length)%ts.length]||subject;
      out.push({q:tpl[0].replace(/\{t\}/g,t).replace(/\{s\}/g,subject),marks:tpl[1],
        a:tpl[2]+' Pitch expected depth at '+level+' standard.'});
    }
    return out;
  }
  async function liveQuestions(n,subject,level,board,topics,difficulty,onProgress){
    var out=[],batch=10;
    for(var start=0;start<n;start+=batch){
      var count=Math.min(batch,n-start);
      if(onProgress)onProgress(start,n);
      var sys='You are a senior '+level+' '+subject+' examiner'+(board?' writing to the '+board+' specification':'')+
        '. Write exam-style questions with full mark-scheme answers. Difficulty: '+difficulty+
        '. Return EXACTLY this format for each question, nothing else:\n'+
        'Q<number> [<marks> marks] <question text on one line>\n'+
        'A<number>: <mark-scheme answer as numbered points showing where each mark is earned>\n'+
        'Vary command words (define, state, describe, explain, compare, analyse, evaluate, calculate where the subject allows). Marks per question between 1 and 6. Real curriculum content, never placeholders.';
      var user='Write questions '+(start+1)+' to '+(start+count)+' of a '+n+'-question '+subject+' exam paper for '+level+
        (topics.length?' covering these topics: '+topics.join('; ')+'.':'.')+
        ' Continue numbering from Q'+(start+1)+'.';
      var text=await window.SYAI.ask(sys,user,{maxTokens:2400,temperature:0.7});
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
        '<div style="font-size:13px;margin-top:4px;white-space:pre-wrap">'+esc(x.a)+'</div></div>';
    }).join('')+'<div class="meta" style="margin-top:18px;border-top:1px solid #ccc;padding-top:8px">END OF MARK SCHEME · Produced with '+esc(brand.name)+'</div>';
  }
  function wordBlocks(brand,meta,qs,isAnswers){
    var blocks=[{h:brand.name+(brand.line?' — '+brand.line:'')},
      {p:meta.title+(isAnswers?' — ANSWER SHEET':'')+' · '+meta.subject+' · '+meta.level+(meta.board?' · '+meta.board:'')},
      {p:meta.n+' questions · Total '+meta.total+' marks'+(isAnswers?'':' · Name: ____________  Class: ________')}];
    qs.forEach(function(x,i){
      blocks.push({p:'Q'+(i+1)+'. '+x.q+'  ['+x.marks+' mark'+(x.marks===1?'':'s')+']'});
      blocks.push({p:isAnswers?('Answer: '+x.a):'Answer: ............................................................................................................'});
    });
    blocks.push({p:(isAnswers?'END OF MARK SCHEME':'END OF PAPER')+' · Produced with '+brand.name});
    return blocks;
  }
  function mount(el,opts){
    opts=opts||{};var brand=opts.brand||{name:'StudYear',line:'AI Academic Operating System'};
    var levels=opts.levels||LEVELS,boards=opts.boards||BOARDS;
    var d=opts.defaults||{};var goId=opts.goId||'sx-go';
    el.innerHTML=
      '<label class="f">Paper title</label><input type="text" id="sx-title" placeholder="e.g. End of Unit Test — Forces & Motion">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">'+
      '<div><label class="f">Subject</label><input type="text" id="sx-subj" placeholder="Any subject" value="'+esc(d.subject||'')+'"></div>'+
      '<div><label class="f">Level</label><select id="sx-level">'+levels.map(function(l){return '<option'+(l===d.level?' selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select></div>'+
      '<div><label class="f">Exam board</label><select id="sx-board">'+boards.map(function(b){return '<option'+(b===(d.board||'')?' selected':'')+'>'+esc(b)+'</option>'}).join('')+'</select></div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">'+
      '<div><label class="f">Questions (1–50)</label><input type="number" id="sx-n" value="10" min="1" max="50"></div>'+
      '<div><label class="f">Difficulty</label><select id="sx-diff"><option>Foundation</option><option selected>Standard</option><option>Higher / stretch</option></select></div></div>'+
      '<label class="f" style="margin-top:10px">Topics (optional, comma-separated)</label>'+
      '<input type="text" id="sx-topics" placeholder="e.g. speed and velocity, Newton’s laws, terminal velocity">'+
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
    $(goId).onclick=async function(){
      var subject=$('sx-subj').value.trim(),level=$('sx-level').value,board=$('sx-board').value;
      var n=Math.max(1,Math.min(50,parseInt($('sx-n').value,10)||10));
      var title=$('sx-title').value.trim()||(subject+' — '+level+' exam paper');
      var topics=$('sx-topics').value.split(',').map(function(t){return t.trim()}).filter(Boolean);
      var diff=$('sx-diff').value;
      if(!subject){$('sx-status').textContent='Enter a subject first.';return}
      var cost=Math.max(10,n);
      if(opts.spend&&!opts.spend(cost,'Exam paper: '+title+' ('+n+' questions)'))return;
      var btn=$(goId);btn.disabled=true;
      try{
        var qs;
        if(window.SYAI&&window.SYAI.ready()){
          $('sx-status').textContent='Writing your paper with '+window.SYAI.provider()+'…';
          try{qs=await liveQuestions(n,subject,level,board,topics,diff,function(done,total){$('sx-status').textContent='Writing questions '+(done+1)+'–'+Math.min(done+10,total)+' of '+total+'…'});}
          catch(e){qs=null}
          if(qs&&qs.length>n)qs=qs.slice(0,n);
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
