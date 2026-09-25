/* ============================================================================
   SYHomework — the teacher → student → parent homework/assignment loop.

   Phase 1 of the Satchel-One extraction (see docs/STUDYEAR-BLUEPRINT-SATCHEL.md):
   a teacher SETS work to a class → a student sees it in their To-Do and SUBMITS
   (text + optional file note) → the teacher MARKS it with AI assistance → the
   parent SEES status, grade and feedback. Purely additive: mounts on top of the
   existing consoles, nothing removed.

   Storage follows the same rails as the attendance register and roster: the
   shared school store `sy-school:<code>:homework` (SY.schoolGet/schoolSet), so a
   teacher and their students on the same school code share one assignment list.
   A cross-device backend sync can be layered on later exactly like the link
   directory — the data shape here is ready for it.

   Mount points (each a one-liner, like SYMakers):
     SYHomework.mountTeacher(el, { schoolCode, teacher, teacherName, subjects, levels })
     SYHomework.mountStudent(el, { email, name })
     SYHomework.mountParent(el, { children:[{email,name}] })
   ========================================================================== */
(function () {
  'use strict';
  var SY = window.SY;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function uid(){return 'a'+Math.abs((Date.now()%1e7)).toString(36)+Math.floor(Math.random()*1e6).toString(36);}
  function now(){return new Date().toISOString();}
  function fmtDate(iso){try{var d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});}catch(e){return '';}}
  function daysUntil(iso){try{var ms=new Date(iso).getTime()-Date.now();return Math.ceil(ms/86400000);}catch(e){return null;}}
  /* safe toast: on pages with <div id="toast">, window.toast is the ELEMENT
     (id→global), so only call it when it's genuinely a function. */
  function say(t){ try{ if(typeof window.toast==='function') window.toast(t); }catch(e){} }

  /* ---------------- storage helpers (shared school store) ---------------- */
  function hw(code){ return (SY.schoolGet(code,'homework',[])||[]); }
  function saveHw(code,list){ SY.schoolSet(code,'homework',list); }
  function roster(code){ return (SY.schoolGet(code,'roster',[])||[]); }

  /* every school code that has a roster this email is on (+ own schoolCode) */
  function schoolsForEmail(email){
    var out=[], seen={}, em=String(email||'').toLowerCase();
    try{ var mine=SY.get('schoolCode',null); if(mine){out.push(mine);seen[mine]=1;} }catch(e){}
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i), m=k&&k.match(/^sy-school:([^:]+):roster$/);
        if(!m||seen[m[1]])continue;
        var r=roster(m[1]);
        for(var j=0;j<r.length;j++){ if(String(r[j].email||'').toLowerCase()===em){out.push(m[1]);seen[m[1]]=1;break;} }
      }
    }catch(e){}
    return out;
  }
  function nameFor(email){ try{return (SY.accountName&&SY.accountName(email))||String(email||'').split('@')[0];}catch(e){return email;} }
  /* the class group a student is in on a school roster (Year 10, 10A, …) */
  function groupOf(code,email){ var em=String(email||'').toLowerCase();
    var r=roster(code).filter(function(x){return String(x.email||'').toLowerCase()===em;})[0];
    return r?(r.year||r.yearGroup||r.cohort||r.group||null):null; }
  /* is this assignment addressed to this student? "Whole class"/blank = all;
     otherwise the assignment group must match the student's roster group —
     so a Year 7 never sees Year 11 homework. */
  function addressedTo(a,code,email){ var g=a.group;
    if(!g||/whole class/i.test(g))return true;
    var sg=groupOf(code,email); if(!sg)return true; /* ungrouped roster → show all */
    return String(sg).toLowerCase()===String(g).toLowerCase(); }

  /* status for one student on one assignment */
  function statusOf(a, email){
    var sub=(a.submissions&&a.submissions[String(email).toLowerCase()])||null;
    if(sub&&sub.grade!=null&&sub.grade!=='') return 'marked';
    if(sub&&sub.submittedAt) return (a.dueAt&&new Date(sub.submittedAt)>new Date(a.dueAt))?'late':'submitted';
    if(a.dueAt&&daysUntil(a.dueAt)<0) return 'overdue';
    return 'todo';
  }
  var STATUS_LABEL={todo:'To do',submitted:'Submitted',late:'Submitted late',overdue:'Overdue',marked:'Marked'};
  var STATUS_COLOR={todo:'var(--ink-3)',submitted:'var(--good)',late:'var(--warn)',overdue:'var(--crit)',marked:'var(--gold-300)'};

  /* ------------------------------------------------ data API ------------- */
  var API = {
    schoolsForEmail: schoolsForEmail,
    /** create/append an assignment to a school's homework list */
    setAssignment: function(code, o){
      if(!code) return null;
      var list=hw(code);
      var a={ id:uid(), by:o.by, byName:o.byName||nameFor(o.by), title:o.title||'Untitled task',
        subject:o.subject||'', level:o.level||'', topic:o.topic||'', body:o.body||'',
        group:o.group||'Whole class', submitMethod:o.submitMethod||'online', maxScore:o.maxScore||null,
        resources:o.resources||[], bloom:o.bloom||'', estMins:o.estMins||null,
        issuedAt:o.issuedAt||now(), dueAt:o.dueAt||null, parentVisible:o.parentVisible!==false,
        submissions:{}, createdAt:now() };
      list.unshift(a); saveHw(code,list);
      try{ SY.log&&SY.log('homework','Homework set: '+a.title,(a.subject?a.subject+' · ':'')+(a.dueAt?'due '+fmtDate(a.dueAt):'no deadline')); }catch(e){}
      return a;
    },
    teacherAssignments: function(code, teacherEmail){
      var em=String(teacherEmail||'').toLowerCase();
      return hw(code).filter(function(a){return !em||String(a.by||'').toLowerCase()===em;});
    },
    /** all assignments addressed to a student across their schools, with status */
    forStudent: function(email){
      var em=String(email||'').toLowerCase(), out=[];
      schoolsForEmail(em).forEach(function(code){
        hw(code).forEach(function(a){ if(addressedTo(a,code,em)) out.push({code:code, a:a, status:statusOf(a,em)}); });
      });
      out.sort(function(x,y){ return new Date(y.a.issuedAt)-new Date(x.a.issuedAt); });
      return out;
    },
    submit: function(code, id, email, payload){
      var em=String(email||'').toLowerCase(), list=hw(code);
      for(var i=0;i<list.length;i++){ if(list[i].id===id){
        list[i].submissions=list[i].submissions||{};
        var prev=list[i].submissions[em]||{};
        list[i].submissions[em]={ text:(payload&&payload.text)||prev.text||'', files:(payload&&payload.files)||prev.files||[],
          submittedAt:now(), grade:prev.grade!=null?prev.grade:'', feedback:prev.feedback||'', markedAt:prev.markedAt||null,
          comments:prev.comments||[], name:nameFor(em) };
        saveHw(code,list);
        try{ SY.log&&SY.log('homework','Submitted: '+list[i].title,''); SY.addPoints&&SY.addPoints(10); }catch(e){}
        return list[i].submissions[em];
      } }
      return null;
    },
    mark: function(code, id, email, payload){
      var em=String(email||'').toLowerCase(), list=hw(code);
      for(var i=0;i<list.length;i++){ if(list[i].id===id){
        var s=(list[i].submissions=list[i].submissions||{})[em]||{name:nameFor(em)};
        if(payload.grade!=null) s.grade=payload.grade;
        if(payload.feedback!=null) s.feedback=payload.feedback;
        s.markedAt=now(); list[i].submissions[em]=s; saveHw(code,list);
        try{ SY.log&&SY.log('homework','Marked: '+list[i].title+' — '+nameFor(em),(s.grade!=null?'Grade: '+s.grade:'')); }catch(e){}
        return s;
      } }
      return null;
    },
    comment: function(code, id, email, who, text){
      var em=String(email||'').toLowerCase(), list=hw(code);
      for(var i=0;i<list.length;i++){ if(list[i].id===id){
        var s=(list[i].submissions=list[i].submissions||{})[em]||{name:nameFor(em)};
        s.comments=s.comments||[]; s.comments.push({who:who,text:String(text||'').slice(0,1000),at:now()});
        list[i].submissions[em]=s; saveHw(code,list); return s.comments;
      } }
      return null;
    },
    statusOf: statusOf
  };
  window.SYHomework = API;

  /* ------------------------------------------------ shared UI ------------ */
  function badge(status){ return '<span style="font-size:11px;font-weight:700;color:'+STATUS_COLOR[status]+'">'+STATUS_LABEL[status]+'</span>'; }
  function aiReady(){ return !!(window.SYAI && SYAI.ready()); }

  /* --------- shared comment thread (teacher ⇄ student, parent-visible) ------- */
  var WHO_LABEL={teacher:'Teacher',student:'Student',parent:'Parent'};
  var WHO_COLOR={teacher:'var(--gold-300)',student:'var(--blue-300,#8FC2EC)',parent:'var(--good,#5CBB7B)'};
  function fmtWhen(iso){try{var d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}catch(e){return '';}}
  /* render the message thread for one submission; `canPost` shows the reply box */
  function commentThread(a, em, whoAmI, canPost){
    var sub=(a.submissions&&a.submissions[String(em).toLowerCase()])||{};
    var msgs=sub.comments||[];
    var h='<div class="hw-thread" style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">'+
      '<div class="note" style="margin-bottom:6px">💬 Messages'+(msgs.length?' ('+msgs.length+')':'')+'</div>';
    if(!msgs.length) h+='<div class="note" style="font-style:normal;opacity:.8">No messages yet.'+(canPost?' Ask a question or leave a note below.':'')+'</div>';
    else h+=msgs.map(function(m){
      return '<div style="margin:6px 0;font-size:13px;line-height:1.5"><b style="color:'+(WHO_COLOR[m.who]||'var(--ink)')+'">'+(WHO_LABEL[m.who]||'—')+'</b> '+
        '<span class="note" style="margin:0">· '+fmtWhen(m.at)+'</span><div style="color:var(--ink-2);white-space:pre-wrap">'+esc(m.text)+'</div></div>';
    }).join('');
    if(canPost) h+='<div style="display:flex;gap:8px;margin-top:8px"><input type="text" class="hw-cmt" data-em="'+esc(String(em).toLowerCase())+'" placeholder="Write a message…" style="flex:1">'+
      '<button class="btn sm hw-cmt-send" data-em="'+esc(String(em).toLowerCase())+'">Send</button></div>';
    return h+'</div>';
  }
  /* wire every reply box in `root` to API.comment; calls onSent() after posting */
  function wireComments(root, code, id, whoAmI, onSent){
    root.querySelectorAll('.hw-cmt-send').forEach(function(b){ b.onclick=function(){
      var em=b.dataset.em; var box=root.querySelector('.hw-cmt[data-em="'+CSS.escape(em)+'"]'); if(!box)return;
      var t=(box.value||'').trim(); if(!t){ say('Write a message first'); return; }
      API.comment(code,id,em,whoAmI,t); box.value='';
      try{ SY.log&&SY.log('homework','Message on homework',''); }catch(e){}
      if(typeof onSent==='function') onSent(em);
    };});
  }

  /* ================= STUDENT ================= */
  API.mountStudent = function(el, opts){
    opts=opts||{}; var email=(opts.email||(SY&&SY.session&&SY.session.email)||'').toLowerCase();
    if(!el) return;
    var filter='open';
    function render(){
      var items=API.forStudent(email);
      var open=items.filter(function(x){return x.status==='todo'||x.status==='overdue';});
      var done=items.filter(function(x){return x.status!=='todo'&&x.status!=='overdue';});
      var show=filter==='open'?open:filter==='done'?done:items;
      var overdue=open.filter(function(x){return x.status==='overdue';}).length;
      var h='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
        '<button class="btn ghost sm hw-f'+(filter==='open'?' on':'')+'" data-f="open">📌 To do ('+open.length+')</button>'+
        '<button class="btn ghost sm hw-f'+(filter==='done'?' on':'')+'" data-f="done">✓ Done ('+done.length+')</button>'+
        '<button class="btn ghost sm hw-f'+(filter==='all'?' on':'')+'" data-f="all">All</button>'+
        (overdue?'<span class="note" style="align-self:center;color:var(--crit)">⚠ '+overdue+' overdue</span>':'')+'</div>';
      if(!show.length){ h+='<div class="note">'+(filter==='open'?'No homework to do right now — nice.':'Nothing here yet.')+' Homework your teacher sets appears here automatically.</div>'; }
      else h+=show.map(function(x){ var a=x.a, d=a.dueAt?daysUntil(a.dueAt):null;
        return '<div class="card" style="margin-bottom:10px"><div style="display:flex;align-items:baseline;gap:8px">'+
          '<b style="flex:1;font-size:14.5px">'+esc(a.title)+'</b>'+badge(x.status)+'</div>'+
          '<div class="note" style="margin-top:3px">'+(a.subject?esc(a.subject)+' · ':'')+'set by '+esc(a.byName)+
            (a.dueAt?(' · <b style="color:'+(d<0?'var(--crit)':d<=1?'var(--warn)':'var(--ink-2)')+'">due '+fmtDate(a.dueAt)+(d!=null&&d>=0?' ('+(d===0?'today':d+'d')+')':d<0?' (overdue)':'')+'</b>'):' · no deadline')+'</div>'+
          '<div style="margin-top:8px"><button class="btn sm" data-open="'+x.code+'|'+a.id+'">Open &amp; '+(x.status==='marked'?'view feedback':(x.status==='submitted'||x.status==='late')?'view':'do it')+' →</button></div></div>';
      }).join('');
      el.innerHTML=h;
      el.querySelectorAll('.hw-f').forEach(function(b){b.onclick=function(){filter=b.dataset.f;render();};});
      el.querySelectorAll('[data-open]').forEach(function(b){b.onclick=function(){var p=b.dataset.open.split('|');openTask(p[0],p[1]);};});
    }
    function openTask(code, id){
      var a=hw(code).filter(function(x){return x.id===id;})[0]; if(!a) return;
      var sub=(a.submissions&&a.submissions[email])||{};
      var st=statusOf(a,email), canSubmit=a.submitMethod!=='none'&&st!=='marked';
      var h='<div class="card"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1;font-size:15px">'+esc(a.title)+'</b>'+badge(st)+'</div>'+
        '<div class="note" style="margin-top:2px">'+(a.subject?esc(a.subject)+' · ':'')+'set by '+esc(a.byName)+(a.dueAt?' · due '+fmtDate(a.dueAt):'')+(a.maxScore?' · out of '+a.maxScore:'')+'</div>'+
        (a.body?'<div style="margin-top:10px;font-size:13.5px;color:var(--ink-2);line-height:1.7;white-space:pre-wrap">'+esc(a.body)+'</div>':'')+
        (a.resources&&a.resources.length?'<div class="note" style="margin-top:8px">Resources: '+a.resources.map(function(r){return esc(r);}).join(', ')+'</div>':'');
      if(sub.grade!=null&&sub.grade!==''){
        h+='<div style="margin-top:12px;border:1px solid rgba(92,187,123,.4);background:rgba(92,187,123,.07);border-radius:10px;padding:11px 13px">'+
          '<b>Grade: <span style="color:var(--good)">'+esc(String(sub.grade))+'</span></b>'+(sub.feedback?'<div style="font-size:13px;color:var(--ink-2);margin-top:6px;line-height:1.6">'+esc(sub.feedback)+'</div>':'')+'</div>';
      }
      if(canSubmit){
        h+='<div style="margin-top:14px"><label class="f">Your answer</label>'+
          '<textarea id="hw-ans" rows="5" placeholder="Type your answer or notes on what you submitted…" style="width:100%">'+esc(sub.text||'')+'</textarea>'+
          '<input type="text" id="hw-file" placeholder="Optional: name/link of a file you did (e.g. essay.docx)" style="width:100%;margin-top:6px" value="'+esc((sub.files&&sub.files[0])||'')+'">'+
          '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">'+
            '<button class="btn sm ghost" id="hw-help">💡 Help me understand (AI)</button>'+
            '<button class="btn sm ghost" id="hw-check">🔍 Check my draft (AI)</button>'+
            '<button class="btn" id="hw-submit">'+(sub.submittedAt?'Update submission':'Submit to teacher')+'</button>'+
          '</div><div id="hw-ai" class="note" style="margin-top:8px"></div></div>';
      }
      h+=commentThread(a, email, 'student', true);
      h+='<div style="margin-top:12px"><button class="btn ghost sm" id="hw-back">← Back to homework</button></div></div>';
      el.innerHTML=h;
      wireComments(el, code, id, 'student', function(){ openTask(code,id); });
      document.getElementById('hw-back').onclick=render;
      var sb=document.getElementById('hw-submit');
      if(sb) sb.onclick=function(){ var t=(document.getElementById('hw-ans').value||'').trim(), f=(document.getElementById('hw-file').value||'').trim();
        if(!t&&!f){ say('Write your answer or name your file first'); return; }
        API.submit(code,id,email,{text:t,files:f?[f]:[]}); say('Submitted to '+a.byName+' ✓'); openTask(code,id); };
      var hb=document.getElementById('hw-help');
      if(hb) hb.onclick=function(){ aiCoach(a,'help'); };
      var cb=document.getElementById('hw-check');
      if(cb) cb.onclick=function(){ aiCoach(a,'check'); };
    }
    function aiCoach(a, mode){
      var box=document.getElementById('hw-ai'); if(!box) return;
      var lvl=(SY.get('profile',{})||{}).level||a.level||'GCSE';
      if(!aiReady()){ box.textContent='Live AI help needs a connection — try the AI Tutor tab, or ask your teacher.'; return; }
      box.textContent='Thinking…';
      var draft=(document.getElementById('hw-ans').value||'').trim();
      var sys, usr;
      if(mode==='check'){
        sys='You are a supportive '+lvl+' teacher checking a student\'s homework DRAFT before they submit.'+((SY&&SY.stageStyle)?SY.stageStyle(lvl):'')+
          ' Do NOT rewrite it or give the answer. Point out: what\'s strong, what\'s missing, any errors to fix, and one thing to improve. Keep it short and encouraging.';
        usr='TASK: '+a.title+(a.body?'\n'+a.body:'')+'\n\nSTUDENT DRAFT:\n'+(draft||'(empty)');
      } else {
        sys='You are a '+lvl+' tutor helping a student UNDERSTAND their homework so they can do it themselves.'+((SY&&SY.stageStyle)?SY.stageStyle(lvl):'')+
          ' Explain what the task is asking, give a step-by-step plan and one worked hint — but DO NOT write the answer for them. End with a check-question.';
        usr='TASK: '+a.title+(a.body?'\n'+a.body:'')+(a.subject?'\nSubject: '+a.subject:'');
      }
      SYAI.ask(sys,usr,{maxTokens:700}).then(function(t){ box.innerHTML=(window.SYAI&&SYAI.render)?SYAI.render(t):esc(t); }).catch(function(){ box.textContent='Couldn\'t reach the AI just now — try again in a moment.'; });
    }
    render();
  };

  /* ================= TEACHER / TUTOR ================= */
  API.mountTeacher = function(el, opts){
    opts=opts||{}; if(!el) return;
    var code=opts.schoolCode||(SY&&SY.get&&SY.get('schoolCode',null))||((SY.get('teacherProfile',{})||{}).schoolCode)||null;
    var me=(opts.teacher||(SY&&SY.session&&SY.session.email)||'').toLowerCase();
    var myName=opts.teacherName||(SY&&SY.session&&SY.session.name)||'Teacher';
    var subjects=opts.subjects||[], levels=opts.levels||[];
    if(!code){ el.innerHTML='<div class="note">Connect your class/school first (My School) to set homework your students receive.</div>'; return; }
    var view='set';
    function groups(){ var g={};(roster(code)||[]).forEach(function(r){ var y=r.year||r.yearGroup||r.group||'Whole class'; g[y]=1; }); return ['Whole class'].concat(Object.keys(g).filter(function(x){return x!=='Whole class';})); }
    function render(){
      var mine=API.teacherAssignments(code,me);
      var h='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
        '<button class="btn ghost sm hw-v'+(view==='set'?' on':'')+'" data-v="set">➕ Set homework</button>'+
        '<button class="btn ghost sm hw-v'+(view==='mark'?' on':'')+'" data-v="mark">📥 Mark &amp; track ('+mine.length+')</button>'+
        '<button class="btn ghost sm hw-v'+(view==='analytics'?' on':'')+'" data-v="analytics">📊 Analytics</button></div>';
      if(view==='set') h+=setForm(); else if(view==='analytics') h+=analytics(mine); else h+=markList(mine);
      el.innerHTML=h; wire();
    }
    function setForm(){
      var subOpts=(subjects.length?subjects:['Mathematics','English','Science']).map(function(s){return '<option>'+esc(s)+'</option>';}).join('');
      var lvlOpts=(levels.length?levels:['GCSE']).map(function(s){return '<option>'+esc(s)+'</option>';}).join('');
      var grpOpts=groups().map(function(g){return '<option>'+esc(g)+'</option>';}).join('');
      return '<div class="card"><div class="two"><div><label class="f">Title</label><input id="hs-title" placeholder="e.g. Quadratic equations — worksheet 3"></div>'+
        '<div><label class="f">Subject</label><select id="hs-subj">'+subOpts+'</select></div></div>'+
        '<div class="two" style="margin-top:8px"><div><label class="f">Level</label><select id="hs-level">'+lvlOpts+'</select></div>'+
        '<div><label class="f">Set to</label><select id="hs-group">'+grpOpts+'</select></div></div>'+
        '<label class="f" style="margin-top:8px">Instructions</label><textarea id="hs-body" rows="4" placeholder="What should students do?"></textarea>'+
        '<div style="margin-top:6px"><button class="btn ghost sm" id="hs-ai">✨ Draft with AI</button></div>'+
        '<div class="two" style="margin-top:8px"><div><label class="f">Due date</label><input type="date" id="hs-due"></div>'+
        '<div><label class="f">Submission</label><select id="hs-method"><option value="online">Online (in StudYear)</option><option value="in-class">Hand in class</option><option value="none">No submission</option></select></div></div>'+
        '<div class="two" style="margin-top:8px"><div><label class="f">Out of (optional)</label><input type="number" id="hs-max" placeholder="e.g. 20" min="1"></div>'+
        '<div><label class="f">Resources (optional)</label><input id="hs-res" placeholder="comma-separated links or file names"></div></div>'+
        '<div style="margin-top:12px"><button class="btn solid" id="hs-go">Set homework →</button></div>'+
        '<div class="note" id="hs-msg" style="margin-top:8px">Students on <b>'+esc(code)+'</b> get this in their To-Do automatically; parents see the status.</div></div>';
    }
    function markList(mine){
      if(!mine.length) return '<div class="note">No homework set yet. Use “Set homework” to create your first task.</div>';
      return mine.map(function(a){
        var subs=a.submissions||{}, keys=Object.keys(subs);
        var submitted=keys.filter(function(k){return subs[k].submittedAt;}).length;
        var marked=keys.filter(function(k){return subs[k].grade!=null&&subs[k].grade!=='';}).length;
        var rosterN=(roster(code)||[]).length||keys.length;
        return '<div class="card" style="margin-bottom:10px"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+esc(a.title)+'</b>'+
          '<span class="note">'+submitted+'/'+(rosterN||'?')+' submitted · '+marked+' marked</span></div>'+
          '<div class="note" style="margin-top:2px">'+(a.subject?esc(a.subject)+' · ':'')+esc(a.group)+(a.dueAt?' · due '+fmtDate(a.dueAt):'')+'</div>'+
          '<div style="margin-top:8px"><button class="btn sm" data-mark="'+a.id+'">Open marking →</button></div></div>';
      }).join('');
    }
    /* completion analytics + at-risk register across this teacher's homework */
    function analytics(mine){
      var rl=roster(code)||[];
      if(!mine.length) return '<div class="note">Set some homework first — completion rates and the at-risk register build automatically.</div>';
      var totalCells=0, submittedCells=0, markedCells=0;
      var missByStudent={}; // email -> count of assignments not submitted (past or due soon)
      mine.forEach(function(a){
        var subs=a.submissions||{};
        rl.forEach(function(r){
          var em=String(r.email||'').toLowerCase(); if(!em) return;
          totalCells++;
          var s=subs[em]||{};
          if(s.submittedAt){ submittedCells++; if(s.grade!=null&&s.grade!=='') markedCells++; }
          else { missByStudent[em]=(missByStudent[em]||0)+1; }
        });
      });
      var compRate=totalCells?Math.round(100*submittedCells/totalCells):0;
      var markRate=submittedCells?Math.round(100*markedCells/submittedCells):0;
      // overdue-not-submitted count (the sharp end of at-risk)
      var overdueMiss=0; mine.forEach(function(a){ if(a.dueAt&&daysUntil(a.dueAt)<0){ var subs=a.submissions||{}; rl.forEach(function(r){var em=String(r.email||'').toLowerCase(); if(em&&!(subs[em]&&subs[em].submittedAt))overdueMiss++;}); } });
      var atRisk=Object.keys(missByStudent).map(function(em){return {em:em, miss:missByStudent[em]};})
        .filter(function(x){return x.miss>0;}).sort(function(a,b){return b.miss-a.miss;});
      var h='<div class="card"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">'+
        '<div><div style="font-family:var(--serif,Georgia);font-size:30px;color:var(--gold-300)">'+compRate+'%</div><div class="note" style="margin:0">Completion rate</div></div>'+
        '<div><div style="font-family:var(--serif,Georgia);font-size:30px;color:var(--good,#5CBB7B)">'+markRate+'%</div><div class="note" style="margin:0">Submissions marked</div></div>'+
        '<div><div style="font-family:var(--serif,Georgia);font-size:30px;color:'+(overdueMiss?'var(--crit,#E06060)':'var(--ink)')+'">'+overdueMiss+'</div><div class="note" style="margin:0">Overdue &amp; missing</div></div>'+
        '<div><div style="font-family:var(--serif,Georgia);font-size:30px;color:var(--ink)">'+mine.length+'</div><div class="note" style="margin:0">Tasks set</div></div>'+
        '</div>';
      h+='<h3 style="margin-top:16px;font-size:14px">⚠ At-risk register — students with missing work</h3>';
      if(!atRisk.length) h+='<div class="note" style="font-style:normal">Everyone is up to date. 🎉</div>';
      else h+=atRisk.map(function(x){
        var pct=Math.round(100*x.miss/mine.length);
        var col=pct>=50?'var(--crit,#E06060)':pct>=25?'var(--warn,#E0A93F)':'var(--ink-3)';
        return '<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:8px 0">'+
          '<b style="flex:1;font-size:13.5px">'+esc(nameFor(x.em))+'</b>'+
          '<span class="note" style="margin:0;color:'+col+'">'+x.miss+'/'+mine.length+' missing</span>'+
          '<button class="btn ghost sm hw-a-plan" data-em="'+esc(x.em)+'">Log intervention</button></div>';
      }).join('');
      h+='<div class="note" style="margin-top:10px">Per-assignment breakdown</div>';
      h+=mine.map(function(a){
        var subs=a.submissions||{}, n=rl.length||Object.keys(subs).length||1;
        var sub=rl.filter(function(r){var em=String(r.email||'').toLowerCase();return subs[em]&&subs[em].submittedAt;}).length;
        var pct=Math.round(100*sub/n);
        return '<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>'+esc(a.title)+'</span><span class="note" style="margin:0">'+pct+'%</span></div>'+
          '<div style="height:7px;border-radius:5px;background:rgba(150,170,210,.16);overflow:hidden;margin-top:3px"><div style="height:100%;width:'+pct+'%;background:'+(pct>=70?'var(--good,#5CBB7B)':pct>=40?'var(--warn,#E0A93F)':'var(--crit,#E06060)')+'"></div></div></div>';
      }).join('');
      return h+'</div>';
    }
    function markOne(a){
      var subs=a.submissions||{}, rl=roster(code)||[];
      /* union of rostered students + anyone who submitted */
      var emails={}; rl.forEach(function(r){ if(r.email)emails[String(r.email).toLowerCase()]=1; }); Object.keys(subs).forEach(function(k){emails[k]=1;});
      var list=Object.keys(emails);
      var h='<div class="card"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1;font-size:15px">'+esc(a.title)+'</b>'+
        '<button class="btn ghost sm" id="hm-back">← Back</button></div><div class="note" style="margin-top:2px">'+(a.subject?esc(a.subject)+' · ':'')+esc(a.group)+(a.maxScore?' · out of '+a.maxScore:'')+'</div>';
      if(!list.length) h+='<div class="note" style="margin-top:10px">No students on this class roster yet.</div>';
      list.forEach(function(em){
        var s=subs[em]||{}, st=statusOf(a,em);
        h+='<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px">'+
          '<div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1;font-size:13.5px">'+esc(s.name||nameFor(em))+'</b>'+badge(st)+'</div>'+
          (s.text?'<div style="font-size:13px;color:var(--ink-2);margin-top:6px;white-space:pre-wrap;border-left:2px solid var(--line);padding-left:10px">'+esc(s.text)+'</div>':'<div class="note" style="margin-top:4px">No online submission yet.</div>')+
          (s.files&&s.files.length?'<div class="note" style="margin-top:4px">File: '+esc(s.files.join(', '))+'</div>':'')+
          '<div class="two" style="margin-top:8px"><div><label class="f">Grade'+(a.maxScore?' / '+a.maxScore:'')+'</label><input class="hm-grade" data-em="'+esc(em)+'" value="'+esc(s.grade!=null?s.grade:'')+'" placeholder="grade"></div>'+
          '<div><label class="f">Feedback</label><input class="hm-fb" data-em="'+esc(em)+'" value="'+esc(s.feedback||'')+'" placeholder="one line of feedback"></div></div>'+
          '<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">'+(s.text&&aiReady()?'<button class="btn ghost sm hm-ai" data-em="'+esc(em)+'">🤖 AI-suggest feedback</button>':'')+
            '<button class="btn sm hm-save" data-em="'+esc(em)+'">Save mark</button></div>'+
          commentThread(a, em, 'teacher', true)+'</div>';
      });
      el.innerHTML=h;
      document.getElementById('hm-back').onclick=render;
      wireComments(el, code, a.id, 'teacher', function(){ markOne(a); });
      el.querySelectorAll('.hm-save').forEach(function(b){b.onclick=function(){var em=b.dataset.em;
        var g=el.querySelector('.hm-grade[data-em="'+CSS.escape(em)+'"]').value.trim();
        var f=el.querySelector('.hm-fb[data-em="'+CSS.escape(em)+'"]').value.trim();
        API.mark(code,a.id,em,{grade:g,feedback:f}); say('Mark saved for '+nameFor(em)); };});
      el.querySelectorAll('.hm-ai').forEach(function(b){b.onclick=function(){var em=b.dataset.em, s=(a.submissions||{})[em]||{};
        var fb=el.querySelector('.hm-fb[data-em="'+CSS.escape(em)+'"]'); if(!fb)return; fb.value='thinking…';
        var lvl=a.level||'GCSE';
        SYAI.ask('You are a '+lvl+' teacher marking homework titled "'+a.title+'". Give ONE concise, specific, encouraging line of feedback (max 25 words) and, on a new line, a suggested grade'+(a.maxScore?' out of '+a.maxScore:'')+' as "Grade: X". Base it only on the student answer.',
          'STUDENT ANSWER:\n'+(s.text||'(none)'),{maxTokens:120}).then(function(t){
          var gm=/Grade:\s*([^\n]+)/i.exec(t); var line=String(t).replace(/Grade:\s*[^\n]+/i,'').trim();
          fb.value=line.slice(0,140); var gi=el.querySelector('.hm-grade[data-em="'+CSS.escape(em)+'"]'); if(gm&&gi&&!gi.value)gi.value=gm[1].trim();
        }).catch(function(){fb.value='';});};});
    }
    function wire(){
      el.querySelectorAll('.hw-v').forEach(function(b){b.onclick=function(){view=b.dataset.v;render();};});
      el.querySelectorAll('.hw-a-plan').forEach(function(b){b.onclick=function(){ var em=b.dataset.em;
        try{ var iv=SY.schoolGet(code,'interventions',[])||[];
          iv.unshift({student:em,email:em,name:nameFor(em),status:'active',reason:'Missing homework',subject:'Homework',notes:'Missing homework — follow up',by:me,at:now(),when:now()});
          SY.schoolSet(code,'interventions',iv); say('Intervention logged for '+nameFor(em)+' — visible to leadership'); }catch(e){}
      };});
      var go=document.getElementById('hs-go');
      if(go) go.onclick=function(){
        var title=(document.getElementById('hs-title').value||'').trim(); if(!title){say('Give the homework a title');return;}
        var res=(document.getElementById('hs-res').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
        var a=API.setAssignment(code,{ by:me, byName:myName, title:title,
          subject:document.getElementById('hs-subj').value, level:document.getElementById('hs-level').value,
          group:document.getElementById('hs-group').value, body:(document.getElementById('hs-body').value||'').trim(),
          dueAt:document.getElementById('hs-due').value?new Date(document.getElementById('hs-due').value).toISOString():null,
          submitMethod:document.getElementById('hs-method').value, maxScore:parseInt(document.getElementById('hs-max').value,10)||null, resources:res });
        say('Homework set for '+esc(a.group)+' ✓'); view='mark'; render();
      };
      var ai=document.getElementById('hs-ai');
      if(ai) ai.onclick=function(){ if(!aiReady()){say('AI draft needs a connection');return;}
        var t=(document.getElementById('hs-title').value||'a homework task').trim(), subj=document.getElementById('hs-subj').value, lvl=document.getElementById('hs-level').value;
        var body=document.getElementById('hs-body'); body.value='Drafting…';
        SYAI.ask('You are a '+lvl+' '+subj+' teacher. Write clear, motivating homework INSTRUCTIONS for students (not the answers) for the task titled "'+t+'". Include what to do, how long it should take, and success criteria. Keep it concise.'+((SY&&SY.stageStyle)?SY.stageStyle(lvl):''),'Task: '+t,{maxTokens:500})
          .then(function(x){body.value=String(x).trim();}).catch(function(){body.value='';}); };
      el.querySelectorAll('[data-mark]').forEach(function(b){b.onclick=function(){var a=API.teacherAssignments(code,me).filter(function(x){return x.id===b.dataset.mark;})[0]; if(a)markOne(a);};});
    }
    render();
  };

  /* ================= PARENT ================= */
  API.mountParent = function(el, opts){
    opts=opts||{}; if(!el) return;
    var kids=opts.children||(SY&&SY.get&&SY.get('children',[]))||[];
    if(!kids.length){ el.innerHTML='<div class="note">Link a child to see the homework their teachers set, whether it\'s submitted, and the grades &amp; feedback.</div>'; return; }
    var h='';
    kids.forEach(function(k){
      var email=String(k.email||'').toLowerCase(), name=k.name||nameFor(email);
      var items=API.forStudent(email).filter(function(x){return x.a.parentVisible!==false;});
      var open=items.filter(function(x){return x.status==='todo'||x.status==='overdue';}).length;
      var overdue=items.filter(function(x){return x.status==='overdue';}).length;
      h+='<div class="card" style="margin-bottom:12px"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+esc(name)+'</b>'+
        '<span class="note">'+open+' to do'+(overdue?' · <span style="color:var(--crit)">'+overdue+' overdue</span>':'')+'</span></div>';
      if(!items.length) h+='<div class="note" style="margin-top:6px">No homework yet.</div>';
      else h+='<div style="margin-top:8px">'+items.slice(0,12).map(function(x){var a=x.a;
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><span style="flex:1;font-size:13px">'+esc(a.title)+
          '<span class="note"> · '+(a.subject?esc(a.subject)+' · ':'')+esc(a.byName)+(a.dueAt?' · due '+fmtDate(a.dueAt):'')+'</span></span>'+badge(x.status)+
          (x.status==='marked'?' <b style="color:var(--good);font-size:12px">'+esc(String((a.submissions[email]||{}).grade))+'</b>':'')+'</div>';
      }).join('')+'</div>';
      /* marked feedback the parent can read */
      var fb=items.filter(function(x){return x.status==='marked'&&(a2(x).feedback);}); function a2(x){return (x.a.submissions[email]||{});}
      if(fb.length) h+='<div class="note" style="margin-top:8px">Latest feedback: “'+esc(a2(fb[0]).feedback)+'” — '+esc(fb[0].a.title)+'</div>';
      h+='</div>';
    });
    el.innerHTML=h;
  };
})();
