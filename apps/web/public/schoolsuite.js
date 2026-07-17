/* ============================================================================
   SYSchoolSuite — the Satchel-One school-engagement modules, layered on the
   same shared school store (sy-school:<code>:*) as homework.js and the roster,
   so teachers, students and parents on one school code share the same data.

   Purely additive — each module mounts on top of the existing consoles like
   SYHomework, nothing removed. A cross-device backend sync can be layered on
   later exactly like the link directory; the data shapes here are ready for it.

     window.SYTimetable  — weekly class timetable (school sets → all see)
     window.SYAnnounce   — announcements / notices with read acknowledgement
     window.SYDocs       — shared documents & resources library
     window.SYBehaviour  — behaviour points, houses & badges (Phase 2 opener)

   Each exposes a data API + mount<Role>(el, opts) one-liners.
   ========================================================================== */
(function () {
  'use strict';
  var SY = window.SY;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function uid(p){return (p||'x')+Math.abs((Date.now()%1e7)).toString(36)+Math.floor(Math.random()*1e6).toString(36);}
  function now(){return new Date().toISOString();}
  function fmtDate(iso){try{var d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});}catch(e){return '';}}
  function fmtWhen(iso){try{var d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}catch(e){return '';}}
  function say(t){ try{ if(typeof window.toast==='function') window.toast(t); }catch(e){} }
  function sg(code,k,d){ return SY.schoolGet(code,k,d); }
  function ss(code,k,v){ SY.schoolSet(code,k,v); }
  function roster(code){ return (sg(code,'roster',[])||[]); }
  function nameFor(email){ try{return (SY.accountName&&SY.accountName(email))||String(email||'').split('@')[0];}catch(e){return email;} }
  /* the class group a student belongs to on a school roster (Year 10, 10A, …) */
  function groupOf(code,email){
    var em=String(email||'').toLowerCase();
    var r=roster(code).filter(function(x){return String(x.email||'').toLowerCase()===em;})[0];
    return r?(r.year||r.yearGroup||r.cohort||r.group||'Whole class'):null;
  }
  /* every school code whose roster this email is on (mirrors homework.js) */
  function schoolsForEmail(email){
    if(window.SYHomework&&SYHomework.schoolsForEmail) return SYHomework.schoolsForEmail(email);
    var out=[],seen={},em=String(email||'').toLowerCase();
    try{ var mine=SY.get('schoolCode',null); if(mine){out.push(mine);seen[mine]=1;} }catch(e){}
    try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i),m=k&&k.match(/^sy-school:([^:]+):roster$/);
      if(!m||seen[m[1]])continue; var r=roster(m[1]);
      for(var j=0;j<r.length;j++){ if(String(r[j].email||'').toLowerCase()===em){out.push(m[1]);seen[m[1]]=1;break;} } } }catch(e){}
    return out;
  }
  function groups(code){ var g={}; roster(code).forEach(function(r){ var y=r.year||r.yearGroup||r.cohort||r.group; if(y)g[y]=1; }); return Object.keys(g); }

  /* ======================================================================
     TIMETABLE — sy-school:<code>:timetable = [{id,day,slot,subject,teacher,
     teacherName,room,group}]. day 0..4 = Mon..Fri, slot 1..PERIODS.
     ====================================================================== */
  var DAYS=['Mon','Tue','Wed','Thu','Fri'];
  var PERIODS=6;
  var TT = {
    all:function(code){ return sg(code,'timetable',[])||[]; },
    forGroup:function(code,group){ return TT.all(code).filter(function(e){return e.group===group;}); },
    forTeacher:function(code,email){ var em=String(email||'').toLowerCase(); return TT.all(code).filter(function(e){return String(e.teacher||'').toLowerCase()===em;}); },
    set:function(code,e){ var l=TT.all(code); l=l.filter(function(x){return !(x.group===e.group&&x.day===e.day&&x.slot===e.slot);}); if(e.subject){ e.id=e.id||uid('tt'); l.push(e); } ss(code,'timetable',l); return e; },
    remove:function(code,group,day,slot){ ss(code,'timetable',TT.all(code).filter(function(x){return !(x.group===group&&x.day===day&&x.slot===slot);})); }
  };
  function cell(e){ return e? '<b style="font-size:12px">'+esc(e.subject)+'</b>'+(e.teacherName?'<div class="note" style="margin:0;font-size:10.5px">'+esc(e.teacherName)+'</div>':'')+(e.room?'<div class="note" style="margin:0;font-size:10.5px">'+esc(e.room)+'</div>':'') : '<span class="note" style="margin:0;opacity:.5">—</span>'; }
  function gridReadonly(entries){
    var by={}; entries.forEach(function(e){ by[e.day+'_'+e.slot]=e; });
    var h='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:520px"><thead><tr><th style="text-align:left;padding:6px;font-size:11px;color:var(--ink-3)">Period</th>'+
      DAYS.map(function(d){return '<th style="padding:6px;font-size:11px;color:var(--ink-3)">'+d+'</th>';}).join('')+'</tr></thead><tbody>';
    for(var s=1;s<=PERIODS;s++){ h+='<tr><td style="padding:6px;font-size:11px;color:var(--ink-3)">P'+s+'</td>';
      for(var d=0;d<5;d++){ h+='<td style="padding:6px;border:1px solid var(--line);vertical-align:top">'+cell(by[d+'_'+s])+'</td>'; } h+='</tr>'; }
    return h+'</tbody></table></div>';
  }
  var Timetable = {
    all:TT.all, forGroup:TT.forGroup, forTeacher:TT.forTeacher, setEntry:TT.set,
    /* school leadership: pick a class, fill its weekly grid */
    mountSchool:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null); if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
      var gs=groups(code); if(!gs.length)gs=['Whole class']; var cur=opts.group||gs[0];
      function render(){
        var entries=TT.forGroup(code,cur), by={}; entries.forEach(function(e){by[e.day+'_'+e.slot]=e;});
        var staff=sg(code,'staff',[])||[];
        var h='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><label class="f" style="margin:0">Class</label>'+
          '<select id="tt-group">'+gs.map(function(g){return '<option'+(g===cur?' selected':'')+'>'+esc(g)+'</option>';}).join('')+'</select>'+
          '<span class="note" style="margin:0">Click a cell to set the subject, teacher &amp; room.</span></div>';
        h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:560px"><thead><tr><th style="padding:6px;font-size:11px;color:var(--ink-3)">Period</th>'+
          DAYS.map(function(d){return '<th style="padding:6px;font-size:11px;color:var(--ink-3)">'+d+'</th>';}).join('')+'</tr></thead><tbody>';
        for(var s=1;s<=PERIODS;s++){ h+='<tr><td style="padding:6px;font-size:11px;color:var(--ink-3)">P'+s+'</td>';
          for(var d=0;d<5;d++){ var e=by[d+'_'+s]; h+='<td class="tt-cell" data-d="'+d+'" data-s="'+s+'" style="padding:6px;border:1px solid var(--line);vertical-align:top;cursor:pointer;min-width:92px">'+cell(e)+'</td>'; } h+='</tr>'; }
        h+='</tbody></table></div>';
        el.innerHTML=h;
        document.getElementById('tt-group').onchange=function(){cur=this.value;render();};
        el.querySelectorAll('.tt-cell').forEach(function(td){ td.onclick=function(){ editCell(+td.dataset.d,+td.dataset.s,staff); }; });
      }
      function editCell(d,s,staff){
        var e=TT.forGroup(code,cur).filter(function(x){return x.day===d&&x.slot===s;})[0]||{};
        var subj=prompt('Subject for '+DAYS[d]+' P'+s+' ('+cur+') — leave blank to clear:', e.subject||''); if(subj===null)return;
        if(!subj.trim()){ TT.remove(code,cur,d,s); render(); return; }
        var room=prompt('Room (optional):', e.room||'')||'';
        var tName=prompt('Teacher name (optional):', e.teacherName||'')||'';
        var tEmail=e.teacher||''; if(tName){ var m=staff.filter(function(x){return (x.name||'')===tName;})[0]; if(m)tEmail=m.email; }
        TT.set(code,{group:cur,day:d,slot:s,subject:subj.trim(),room:room.trim(),teacherName:tName.trim(),teacher:tEmail}); render();
      }
      render();
    },
    mountTeacher:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null)||((SY.get('teacherProfile',{})||{}).schoolCode); var email=(opts.email||(SY.session&&SY.session.email)||'').toLowerCase();
      if(!code){el.innerHTML='<div class="note">Link your school to see your teaching timetable.</div>';return;}
      var e=TT.forTeacher(code,email); el.innerHTML=e.length?gridReadonly(e):'<div class="note">No lessons scheduled to you yet — leadership sets the timetable in the School console.</div>'; },
    mountStudent:function(el,opts){ opts=opts||{}; if(!el)return; var email=(opts.email||(SY.session&&SY.session.email)||'').toLowerCase();
      var codes=schoolsForEmail(email); var found=false;
      for(var i=0;i<codes.length&&!found;i++){ var g=groupOf(codes[i],email); if(g){ var e=TT.forGroup(codes[i],g); if(e.length){ el.innerHTML='<div class="note" style="margin-bottom:6px">Your class: <b>'+esc(g)+'</b></div>'+gridReadonly(e); found=true; } } }
      if(!found) el.innerHTML='<div class="note">Your school timetable appears here once your teachers publish it.</div>'; },
    mountParentChild:function(el,email){ if(!el)return; email=String(email||'').toLowerCase(); var codes=schoolsForEmail(email);
      for(var i=0;i<codes.length;i++){ var g=groupOf(codes[i],email); if(g){ var e=TT.forGroup(codes[i],g); if(e.length){ el.innerHTML=gridReadonly(e); return; } } }
      el.innerHTML='<div class="note">No published timetable yet.</div>'; }
  };
  window.SYTimetable = Timetable;

  /* ======================================================================
     ANNOUNCEMENTS — sy-school:<code>:announcements = [{id,title,body,by,
     byName,audience,group,priority,at,reads:{email:iso}}]
     ====================================================================== */
  var PRI={info:{l:'Info',c:'var(--blue-300,#8FC2EC)'},important:{l:'Important',c:'var(--warn,#E0A93F)'},urgent:{l:'Urgent',c:'var(--crit,#E06060)'}};
  var AN = {
    all:function(code){ return (sg(code,'announcements',[])||[]).slice().sort(function(a,b){return new Date(b.at)-new Date(a.at);}); },
    post:function(code,o){ var l=sg(code,'announcements',[])||[]; var a={id:uid('an'),title:o.title||'Notice',body:o.body||'',by:o.by,byName:o.byName||nameFor(o.by),audience:o.audience||'all',group:o.group||'',priority:o.priority||'info',at:now(),reads:{}}; l.unshift(a); ss(code,'announcements',l);
      try{ SY.log&&SY.log('announce','Notice posted: '+a.title,''); }catch(e){} return a; },
    remove:function(code,id){ ss(code,'announcements',(sg(code,'announcements',[])||[]).filter(function(a){return a.id!==id;})); },
    markRead:function(code,id,email){ var l=sg(code,'announcements',[])||[]; for(var i=0;i<l.length;i++){ if(l[i].id===id){ l[i].reads=l[i].reads||{}; if(!l[i].reads[email]){ l[i].reads[email]=now(); ss(code,'announcements',l);} return true; } } return false; },
    /* announcements addressed to this viewer (role in 'students'|'parents') */
    forViewer:function(code,role,group){ return AN.all(code).filter(function(a){ if(a.audience==='all')return true; if(a.audience===role)return true; if(group&&a.audience===group)return true; return false; }); }
  };
  var Announce = {
    all:AN.all, post:AN.post, forViewer:AN.forViewer, markRead:AN.markRead, remove:AN.remove,
    mountPoster:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null)||((SY.get('teacherProfile',{})||{}).schoolCode);
      var by=(opts.by||(SY.session&&SY.session.email)||'').toLowerCase(), byName=opts.byName||(SY.session&&SY.session.name)||'Staff';
      if(!code){el.innerHTML='<div class="note">Link your school to post notices.</div>';return;}
      function render(){
        var gs=groups(code);
        var h='<div class="card"><div class="two"><div><label class="f">Title</label><input id="an-title" placeholder="e.g. Parents\' evening — Thursday"></div>'+
          '<div><label class="f">Priority</label><select id="an-pri"><option value="info">Info</option><option value="important">Important</option><option value="urgent">Urgent</option></select></div></div>'+
          '<label class="f" style="margin-top:8px">Message</label><textarea id="an-body" rows="3" placeholder="What do families / students need to know?"></textarea>'+
          '<div class="two" style="margin-top:8px"><div><label class="f">Audience</label><select id="an-aud"><option value="all">Everyone</option><option value="students">Students</option><option value="parents">Parents</option>'+
            gs.map(function(g){return '<option value="'+esc(g)+'">Class: '+esc(g)+'</option>';}).join('')+'</select></div>'+
          '<div style="display:flex;align-items:flex-end"><button class="btn solid" id="an-go" style="width:100%">Post notice →</button></div></div></div>';
        h+='<div style="margin-top:12px" id="an-list"></div>';
        el.innerHTML=h;
        document.getElementById('an-go').onclick=function(){ var t=(document.getElementById('an-title').value||'').trim(); if(!t){say('Give the notice a title');return;}
          AN.post(code,{title:t,body:(document.getElementById('an-body').value||'').trim(),audience:document.getElementById('an-aud').value,priority:document.getElementById('an-pri').value,by:by,byName:byName});
          say('Notice posted ✓'); render(); };
        list();
      }
      function list(){ var box=document.getElementById('an-list'); var l=AN.all(code);
        box.innerHTML='<div class="note" style="margin-bottom:6px">Posted notices</div>'+(l.length?l.map(function(a){ var reads=Object.keys(a.reads||{}).length;
          return '<div class="card" style="margin-bottom:8px"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+esc(a.title)+'</b><span style="font-size:11px;font-weight:700;color:'+PRI[a.priority].c+'">'+PRI[a.priority].l+'</span></div>'+
            '<div class="note" style="margin-top:2px">'+esc(a.audience==='all'?'Everyone':a.audience)+' · '+fmtWhen(a.at)+' · '+reads+' read</div>'+
            (a.body?'<div style="font-size:13px;color:var(--ink-2);margin-top:6px;white-space:pre-wrap">'+esc(a.body)+'</div>':'')+
            '<div style="margin-top:6px"><button class="btn ghost sm an-del" data-id="'+a.id+'">Delete</button></div></div>';
        }).join(''):'<div class="note" style="font-style:normal">No notices yet.</div>');
        box.querySelectorAll('.an-del').forEach(function(b){b.onclick=function(){ AN.remove(code,b.dataset.id); render(); };});
      }
      render();
    },
    /* students / parents read feed with acknowledge */
    mountFeed:function(el,opts){ opts=opts||{}; if(!el)return; var role=opts.role||'students';
      var email=(opts.email||(SY.session&&SY.session.email)||'').toLowerCase();
      var codes=opts.code?[opts.code]:schoolsForEmail(opts.viewerEmail||email);
      function render(){
        var items=[]; codes.forEach(function(code){ var g=groupOf(code,opts.viewerEmail||email); AN.forViewer(code,role,g).forEach(function(a){ items.push({code:code,a:a}); }); });
        items.sort(function(x,y){return new Date(y.a.at)-new Date(x.a.at);});
        if(!items.length){ el.innerHTML='<div class="note" style="font-style:normal">No notices from school right now.</div>'; return; }
        el.innerHTML=items.slice(0,20).map(function(x){ var a=x.a, read=a.reads&&a.reads[email];
          return '<div class="card" style="margin-bottom:8px;border-left:3px solid '+PRI[a.priority].c+'"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+esc(a.title)+'</b>'+
            '<span style="font-size:11px;font-weight:700;color:'+PRI[a.priority].c+'">'+PRI[a.priority].l+'</span></div>'+
            '<div class="note" style="margin-top:2px">'+esc(a.byName)+' · '+fmtWhen(a.at)+'</div>'+
            (a.body?'<div style="font-size:13px;color:var(--ink-2);margin-top:6px;white-space:pre-wrap">'+esc(a.body)+'</div>':'')+
            '<div style="margin-top:8px">'+(read?'<span class="note" style="margin:0;color:var(--good,#5CBB7B)">✓ Acknowledged '+fmtDate(read)+'</span>':'<button class="btn sm an-ack" data-code="'+x.code+'" data-id="'+a.id+'">Acknowledge</button>')+'</div></div>';
        }).join('');
        el.querySelectorAll('.an-ack').forEach(function(b){b.onclick=function(){ AN.markRead(b.dataset.code,b.dataset.id,email); render(); };});
      }
      render();
    }
  };
  window.SYAnnounce = Announce;

  /* ======================================================================
     DOCUMENTS — sy-school:<code>:documents = [{id,title,url,note,category,
     audience,by,byName,at}]
     ====================================================================== */
  var DOC = {
    all:function(code){ return (sg(code,'documents',[])||[]).slice().sort(function(a,b){return new Date(b.at)-new Date(a.at);}); },
    add:function(code,o){ var l=sg(code,'documents',[])||[]; var d={id:uid('doc'),title:o.title||'Document',url:o.url||'',note:o.note||'',category:o.category||'General',audience:o.audience||'all',by:o.by,byName:o.byName||nameFor(o.by),at:now()}; l.unshift(d); ss(code,'documents',l); return d; },
    remove:function(code,id){ ss(code,'documents',(sg(code,'documents',[])||[]).filter(function(d){return d.id!==id;})); },
    forViewer:function(code,role){ return DOC.all(code).filter(function(d){return d.audience==='all'||d.audience===role;}); }
  };
  var CATS=['General','Policies','Letters','Curriculum','Revision','Forms','Safeguarding'];
  function docLine(d,canDel){ var link=d.url?('<a href="'+esc(d.url)+'" target="_blank" rel="noopener" style="color:var(--gold-300);text-decoration:underline">Open</a>'):'';
    return '<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:8px 0"><span style="flex:1;font-size:13px"><b>'+esc(d.title)+'</b>'+
      '<span class="note"> · '+esc(d.category)+' · '+esc(d.byName)+' · '+fmtDate(d.at)+'</span>'+(d.note?'<div class="note" style="margin:2px 0 0">'+esc(d.note)+'</div>':'')+'</span>'+
      link+(canDel?' <button class="btn ghost sm doc-del" data-id="'+d.id+'">✕</button>':'')+'</div>'; }
  var Docs = {
    all:DOC.all, add:DOC.add, forViewer:DOC.forViewer,
    mountManage:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null)||((SY.get('teacherProfile',{})||{}).schoolCode);
      var by=(opts.by||(SY.session&&SY.session.email)||'').toLowerCase(), byName=opts.byName||(SY.session&&SY.session.name)||'Staff';
      if(!code){el.innerHTML='<div class="note">Link your school to share documents.</div>';return;}
      function render(){ var l=DOC.all(code);
        var h='<div class="card"><div class="two"><div><label class="f">Title</label><input id="dc-title" placeholder="e.g. Year 10 revision checklist"></div>'+
          '<div><label class="f">Category</label><select id="dc-cat">'+CATS.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></div></div>'+
          '<div class="two" style="margin-top:8px"><div><label class="f">Link (URL)</label><input id="dc-url" placeholder="https://…"></div>'+
          '<div><label class="f">Audience</label><select id="dc-aud"><option value="all">Everyone</option><option value="students">Students</option><option value="parents">Parents</option></select></div></div>'+
          '<label class="f" style="margin-top:8px">Note (optional)</label><input id="dc-note" placeholder="short description">'+
          '<div style="margin-top:10px"><button class="btn solid" id="dc-go">Add document →</button></div></div>';
        h+='<div class="card" style="margin-top:12px"><div class="note" style="margin-bottom:4px">Library ('+l.length+')</div>'+(l.length?l.map(function(d){return docLine(d,true);}).join(''):'<div class="note" style="font-style:normal">No documents yet.</div>')+'</div>';
        el.innerHTML=h;
        document.getElementById('dc-go').onclick=function(){ var t=(document.getElementById('dc-title').value||'').trim(); if(!t){say('Give the document a title');return;}
          DOC.add(code,{title:t,url:(document.getElementById('dc-url').value||'').trim(),note:(document.getElementById('dc-note').value||'').trim(),category:document.getElementById('dc-cat').value,audience:document.getElementById('dc-aud').value,by:by,byName:byName});
          say('Document added ✓'); render(); };
        el.querySelectorAll('.doc-del').forEach(function(b){b.onclick=function(){ DOC.remove(code,b.dataset.id); render(); };});
      }
      render();
    },
    mountBrowse:function(el,opts){ opts=opts||{}; if(!el)return; var role=opts.role||'students';
      var email=(opts.viewerEmail||(SY.session&&SY.session.email)||'').toLowerCase();
      var codes=opts.code?[opts.code]:schoolsForEmail(email);
      var docs=[]; codes.forEach(function(code){ DOC.forViewer(code,role).forEach(function(d){docs.push(d);}); });
      docs.sort(function(a,b){return new Date(b.at)-new Date(a.at);});
      el.innerHTML=docs.length?docs.map(function(d){return docLine(d,false);}).join(''):'<div class="note" style="font-style:normal">No school documents shared yet.</div>';
    }
  };
  window.SYDocs = Docs;

  /* ======================================================================
     BEHAVIOUR — sy-school:<code>:behaviour = [{id,student,name,points,reason,
     category,by,byName,at}]. Positive & negative points, houses & badges.
     ====================================================================== */
  var POS=[{r:'Excellent effort',c:'Effort',p:2},{r:'Great answer / contribution',c:'Participation',p:1},{r:'Helping others',c:'Kindness',p:2},{r:'Homework excellence',c:'Homework',p:2},{r:'Outstanding progress',c:'Progress',p:3}];
  var NEG=[{r:'Off-task',c:'Focus',p:-1},{r:'Disruption',c:'Behaviour',p:-2},{r:'Missing homework',c:'Homework',p:-1},{r:'Late to lesson',c:'Punctuality',p:-1}];
  var BADGES=[{n:'Rising Star',min:10,ic:'⭐'},{n:'High Achiever',min:25,ic:'🌟'},{n:'Role Model',min:50,ic:'🏅'},{n:'Legend',min:100,ic:'🏆'}];
  var BH = {
    all:function(code){ return (sg(code,'behaviour',[])||[]); },
    award:function(code,o){ var l=sg(code,'behaviour',[])||[]; var b={id:uid('bh'),student:String(o.student||'').toLowerCase(),name:o.name||nameFor(o.student),points:o.points||0,reason:o.reason||'',category:o.category||'General',by:o.by,byName:o.byName||nameFor(o.by),at:now()}; l.unshift(b); ss(code,'behaviour',l);
      try{ SY.log&&SY.log('behaviour',(b.points>=0?'+':'')+b.points+' — '+b.reason,''); if(b.points>0&&SY.addPoints)SY.addPoints(b.points); }catch(e){} return b; },
    forStudent:function(code,email){ var em=String(email||'').toLowerCase(); var log=BH.all(code).filter(function(b){return b.student===em;});
      var total=log.reduce(function(a,b){return a+(b.points||0);},0);
      var positive=log.filter(function(b){return b.points>0;}).reduce(function(a,b){return a+b.points;},0);
      var negative=log.filter(function(b){return b.points<0;}).reduce(function(a,b){return a+b.points;},0);
      var badges=BADGES.filter(function(x){return positive>=x.min;});
      return {total:total,positive:positive,negative:negative,log:log,badges:badges}; },
    leaderboard:function(code){ var by={}; BH.all(code).forEach(function(b){ if(b.points>0){ by[b.student]=(by[b.student]||0)+b.points; } });
      return Object.keys(by).map(function(em){return {email:em,name:nameFor(em),points:by[em]};}).sort(function(a,b){return b.points-a.points;}); }
  };
  function badgeRow(badges){ return badges.length?('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">'+badges.map(function(x){return '<span style="font-size:12px;background:rgba(217,174,85,.15);border:1px solid var(--gold-500,#B98A2F);border-radius:20px;padding:3px 9px">'+x.ic+' '+esc(x.n)+'</span>';}).join('')+'</div>'):''; }
  var Behaviour = {
    all:BH.all, award:BH.award, forStudent:BH.forStudent, leaderboard:BH.leaderboard,
    mountTeacher:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null)||((SY.get('teacherProfile',{})||{}).schoolCode);
      var by=(opts.by||(SY.session&&SY.session.email)||'').toLowerCase(), byName=opts.byName||(SY.session&&SY.session.name)||'Teacher';
      if(!code){el.innerHTML='<div class="note">Link your school to award behaviour points.</div>';return;}
      function render(){ var rl=roster(code)||[];
        var h='<div class="card"><div class="note" style="margin-bottom:6px">Award points — tap a student, then a reason.</div>'+
          '<label class="f">Student</label><select id="bh-student">'+rl.map(function(r){return '<option value="'+esc(r.email)+'">'+esc(r.name||nameFor(r.email))+'</option>';}).join('')+'</select>'+
          '<div class="note" style="margin-top:10px">Positive</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">'+
            POS.map(function(x,i){return '<button class="btn ghost sm bh-pos" data-i="'+i+'">+'+x.p+' '+esc(x.r)+'</button>';}).join('')+'</div>'+
          '<div class="note" style="margin-top:10px">Needs improvement</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">'+
            NEG.map(function(x,i){return '<button class="btn ghost sm bh-neg" data-i="'+i+'">'+x.p+' '+esc(x.r)+'</button>';}).join('')+'</div></div>';
        // leaderboard + recent
        var lb=BH.leaderboard(code).slice(0,8);
        h+='<div class="card" style="margin-top:12px"><div class="note" style="margin-bottom:4px">🏆 House points leaderboard</div>'+
          (lb.length?lb.map(function(x,i){return '<div style="display:flex;gap:8px;padding:5px 0;border-top:1px solid var(--line)"><span class="note" style="margin:0;width:20px">'+(i+1)+'</span><b style="flex:1;font-size:13px">'+esc(x.name)+'</b><b style="color:var(--gold-300)">'+x.points+'</b></div>';}).join(''):'<div class="note" style="font-style:normal">No points awarded yet.</div>')+'</div>';
        el.innerHTML=h;
        function award(list,i){ var s=document.getElementById('bh-student'); var email=s.value; var it=list[i];
          BH.award(code,{student:email,name:nameFor(email),points:it.p,reason:it.r,category:it.c,by:by,byName:byName});
          say((it.p>=0?'+':'')+it.p+' to '+nameFor(email)+' — '+it.r); render(); s2(email); }
        function s2(email){ try{document.getElementById('bh-student').value=email;}catch(e){} }
        el.querySelectorAll('.bh-pos').forEach(function(b){b.onclick=function(){award(POS,+b.dataset.i);};});
        el.querySelectorAll('.bh-neg').forEach(function(b){b.onclick=function(){award(NEG,+b.dataset.i);};});
      }
      render();
    },
    mountStudent:function(el,opts){ opts=opts||{}; if(!el)return; var email=(opts.email||(SY.session&&SY.session.email)||'').toLowerCase();
      var codes=schoolsForEmail(email); var agg={total:0,positive:0,negative:0,log:[],badges:[]};
      codes.forEach(function(code){ var s=BH.forStudent(code,email); agg.total+=s.total; agg.positive+=s.positive; agg.negative+=s.negative; agg.log=agg.log.concat(s.log); });
      agg.badges=BADGES.filter(function(x){return agg.positive>=x.min;}); agg.log.sort(function(a,b){return new Date(b.at)-new Date(a.at);});
      if(!agg.log.length){ el.innerHTML='<div class="note" style="font-style:normal">No behaviour points yet — earn them for effort, great answers and helping others.</div>'; return; }
      var next=BADGES.filter(function(x){return agg.positive<x.min;})[0];
      el.innerHTML='<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center"><div><div style="font-family:var(--serif,Georgia);font-size:34px;color:var(--gold-300)">'+agg.total+'</div><div class="note" style="margin:0">Total points</div></div>'+
        '<div><div style="font-size:16px;color:var(--good,#5CBB7B)">+'+agg.positive+'</div><div class="note" style="margin:0">Positive</div></div>'+
        (agg.negative?'<div><div style="font-size:16px;color:var(--crit,#E06060)">'+agg.negative+'</div><div class="note" style="margin:0">Improve</div></div>':'')+'</div>'+
        badgeRow(agg.badges)+(next?'<div class="note" style="margin-top:6px">'+(next.min-agg.positive)+' more positive points to '+next.ic+' '+esc(next.n)+'</div>':'')+
        '<div class="note" style="margin-top:12px;margin-bottom:4px">Recent</div>'+agg.log.slice(0,12).map(function(b){
          return '<div style="display:flex;gap:8px;padding:6px 0;border-top:1px solid var(--line);font-size:13px"><b style="color:'+(b.points>=0?'var(--good,#5CBB7B)':'var(--crit,#E06060)')+';width:34px">'+(b.points>=0?'+':'')+b.points+'</b><span style="flex:1">'+esc(b.reason)+'<span class="note"> · '+esc(b.byName)+' · '+fmtDate(b.at)+'</span></span></div>';
        }).join('');
    },
    mountParent:function(el,opts){ opts=opts||{}; if(!el)return; var kids=opts.children||[];
      if(!kids.length){ el.innerHTML='<div class="note" style="font-style:normal">Link a child to see their behaviour points, badges and the log.</div>'; return; }
      var h=''; kids.forEach(function(k){ var email=String(k.email||'').toLowerCase(); var codes=schoolsForEmail(email);
        var agg={total:0,positive:0,negative:0,log:[]}; codes.forEach(function(code){ var s=BH.forStudent(code,email); agg.total+=s.total; agg.positive+=s.positive; agg.negative+=s.negative; agg.log=agg.log.concat(s.log); });
        agg.log.sort(function(a,b){return new Date(b.at)-new Date(a.at);});
        var badges=BADGES.filter(function(x){return agg.positive>=x.min;});
        h+='<div class="card" style="margin-bottom:10px"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+esc(k.name||nameFor(email))+'</b><b style="color:var(--gold-300)">'+agg.total+' pts</b></div>'+
          badgeRow(badges)+(agg.log.length?('<div style="margin-top:8px">'+agg.log.slice(0,6).map(function(b){return '<div style="display:flex;gap:8px;padding:5px 0;border-top:1px solid var(--line);font-size:12.5px"><b style="color:'+(b.points>=0?'var(--good,#5CBB7B)':'var(--crit,#E06060)')+';width:30px">'+(b.points>=0?'+':'')+b.points+'</b><span style="flex:1">'+esc(b.reason)+'<span class="note"> · '+fmtDate(b.at)+'</span></span></div>';}).join('')+'</div>'):'<div class="note" style="margin-top:6px">No points logged yet.</div>')+'</div>';
      });
      el.innerHTML=h;
    }
  };
  window.SYBehaviour = Behaviour;

  /* ======================================================================
     ATTENDANCE read helper — sy-school:<code>:attendance keyed by
     "date|cohort|session" -> {records:{email:status}} (written by the register).
     ====================================================================== */
  function attendancePct(code,email){
    var em=String(email||'').toLowerCase(); var store=sg(code,'attendance',{})||{}; var present=0,total=0;
    Object.keys(store).forEach(function(k){ var rec=store[k]&&store[k].records; if(!rec||!(em in rec))return; total++; var st=rec[em]; if(st==='present'||st==='late')present++; });
    return {pct: total?Math.round(100*present/total):null, sessions:total};
  }

  /* ======================================================================
     STUDENT 360 — one connected profile aggregating academics, homework,
     behaviour, attendance, interventions & timetable for staff. Permissioned:
     the caller passes the school code the student is rostered on.
     ====================================================================== */
  function academics(email){
    var quizzes=SY.readAccount(email,'quizzes',[])||[]; var diag=(SY.readAccount(email,'diagnostics',[])||[])[0]||null;
    var by={}; quizzes.forEach(function(q){(by[q.subj]=by[q.subj]||[]).push(q.pct);});
    var mastery={}; Object.keys(by).forEach(function(s){mastery[s]=Math.round(by[s].reduce(function(a,b){return a+b;},0)/by[s].length);});
    if(diag&&diag.list)diag.list.forEach(function(x){mastery[x.s]=mastery[x.s]!=null?Math.round((mastery[x.s]+x.mastery)/2):x.mastery;});
    var subs=Object.keys(mastery); var overall=subs.length?Math.round(subs.reduce(function(a,s){return a+mastery[s];},0)/subs.length):null;
    var weak=subs.length?subs.reduce(function(a,b){return mastery[a]<mastery[b]?a:b;}):null;
    return {mastery:mastery, overall:overall, weak:weak, diag:diag};
  }
  var Student360 = {
    /** data bundle for one student (staff view) */
    data:function(code,email){
      var em=String(email||'').toLowerCase();
      var prof=SY.readAccount(em,'profile',{})||{};
      var ac=academics(em);
      var hw=(window.SYHomework&&window.SYHomework.forStudent)?window.SYHomework.forStudent(em):[];
      var hwBy={}; hw.forEach(function(x){hwBy[x.status]=(hwBy[x.status]||0)+1;});
      var bh=BH.forStudent(code,em);
      var att=attendancePct(code,em);
      var iv=(sg(code,'interventions',[])||[]).filter(function(i){return String(i.student||'').toLowerCase()===em&&i.status!=='closed';});
      return {email:em, name:nameFor(em), group:groupOf(code,em), profile:prof, academics:ac,
        homework:{items:hw, by:hwBy}, behaviour:bh, attendance:att, interventions:iv};
    },
    mount:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null)||((SY.get('teacherProfile',{})||{}).schoolCode);
      if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
      var rl=roster(code)||[]; var cur=(opts.email||(rl[0]&&rl[0].email)||'').toLowerCase();
      function render(){
        var d=Student360.data(code,cur);
        var att=d.attendance.pct==null?'—':d.attendance.pct+'%';
        var over=d.academics.overall==null?'—':d.academics.overall+'%';
        var h='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><label class="f" style="margin:0">Student</label>'+
          '<select id="s360-pick">'+rl.map(function(r){return '<option value="'+esc(r.email)+'"'+(String(r.email).toLowerCase()===cur?' selected':'')+'>'+esc(r.name||nameFor(r.email))+'</option>';}).join('')+'</select>'+
          (d.group?'<span class="note" style="margin:0">'+esc(d.group)+'</span>':'')+'</div>';
        h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px">'+
          tile(over,'Attainment')+tile(att,'Attendance')+tile(d.behaviour.total,'Behaviour pts')+
          tile((d.homework.by.marked||0)+'/'+d.homework.items.length,'HW marked')+
          tile(d.homework.by.overdue||0,'HW overdue',(d.homework.by.overdue?'var(--crit,#E06060)':''))+
          tile(d.interventions.length,'Interventions')+'</div>';
        // knowledge mastery
        var subs=Object.keys(d.academics.mastery);
        h+='<h3 style="margin-top:14px;font-size:14px">Knowledge mastery</h3>';
        h+=subs.length?subs.map(function(s){var m=d.academics.mastery[s];return bar(s,m);}).join(''):'<div class="note" style="font-style:normal">No quiz/diagnostic data yet.</div>';
        // behaviour badges
        if(d.behaviour.badges.length) h+='<h3 style="margin-top:14px;font-size:14px">Badges</h3>'+badgeRow(d.behaviour.badges);
        // interventions
        h+='<h3 style="margin-top:14px;font-size:14px">Active interventions</h3>';
        h+=d.interventions.length?d.interventions.map(function(i){return '<div class="note" style="font-style:normal">• '+esc(i.reason||'Intervention')+' — '+esc(i.status||'active')+(i.by?' ('+esc(nameFor(i.by))+')':'')+'</div>';}).join(''):'<div class="note" style="font-style:normal">None open.</div>';
        // AI briefing
        h+='<div style="margin-top:14px"><button class="btn sm" id="s360-brief">🧠 Generate AI briefing</button><div id="s360-brief-out" class="note" style="margin-top:8px"></div></div>';
        el.innerHTML=h;
        document.getElementById('s360-pick').onchange=function(){cur=this.value.toLowerCase();render();};
        document.getElementById('s360-brief').onclick=function(){ brief(d); };
      }
      function tile(v,label,col){ return '<div><div style="font-family:var(--serif,Georgia);font-size:26px;color:'+(col||'var(--gold-300)')+'">'+v+'</div><div class="note" style="margin:0">'+label+'</div></div>'; }
      function bar(label,m){ m=m||0; var c=m>=70?'var(--good,#5CBB7B)':m>=50?'var(--warn,#E0A93F)':'var(--crit,#E06060)';
        return '<div style="margin-top:6px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>'+esc(label)+'</span><span class="note" style="margin:0">'+m+'%</span></div><div style="height:7px;border-radius:5px;background:rgba(150,170,210,.16);margin-top:3px"><div style="height:100%;width:'+m+'%;background:'+c+';border-radius:5px"></div></div></div>'; }
      function brief(d){ var box=document.getElementById('s360-brief-out'); if(!box)return;
        if(!(window.SYAI&&SYAI.ready())){ box.textContent='Connect AI (AI Gateway) to generate a written briefing. Summary above is live from the data.'; return; }
        box.textContent='Thinking…';
        var facts='Student: '+d.name+' ('+(d.group||'')+')\nAttainment: '+(d.academics.overall||'n/a')+'%\nWeakest: '+(d.academics.weak||'n/a')+
          '\nAttendance: '+(d.attendance.pct==null?'n/a':d.attendance.pct+'%')+'\nBehaviour points: '+d.behaviour.total+
          '\nHomework: '+(d.homework.by.marked||0)+' marked, '+(d.homework.by.submitted||0)+' awaiting, '+(d.homework.by.overdue||0)+' overdue'+
          '\nOpen interventions: '+d.interventions.length;
        SYAI.ask('You are a school analyst writing a concise staff briefing on one student. Give: current position (2 lines), main risks (bullets), and 3 recommended actions with who owns each. Be specific and supportive.',facts,{maxTokens:500})
          .then(function(t){ box.innerHTML=(window.SYAI&&SYAI.render)?SYAI.render(t):esc(t); }).catch(function(){ box.textContent='Could not reach AI just now.'; });
      }
      render();
    }
  };
  window.SYStudent360 = Student360;

  /* ======================================================================
     COMMUNICATION — sy-school:<code>:messages = { studentEmail:[{role,name,
     text,at}] }. A per-student message board school/teacher ⇄ parent share.
     ====================================================================== */
  var MSG = {
    forStudent:function(code,email){ var all=sg(code,'messages',{})||{}; return all[String(email||'').toLowerCase()]||[]; },
    post:function(code,email,m){ var all=sg(code,'messages',{})||{}; var em=String(email||'').toLowerCase(); all[em]=all[em]||[]; all[em].push({role:m.role,name:m.name||'',text:String(m.text||'').slice(0,2000),at:now()}); ss(code,'messages',all);
      try{ SY.log&&SY.log('message','Message about '+nameFor(em),''); }catch(e){} return all[em]; }
  };
  function threadHtml(msgs){ return msgs.length?msgs.map(function(m){ var col=m.role==='parent'?'var(--good,#5CBB7B)':'var(--gold-300)';
    return '<div style="margin:6px 0;font-size:13px"><b style="color:'+col+'">'+esc(m.name||(m.role==='parent'?'Parent':'School'))+'</b> <span class="note" style="margin:0">· '+fmtWhen(m.at)+'</span><div style="color:var(--ink-2);white-space:pre-wrap">'+esc(m.text)+'</div></div>';
  }).join(''):'<div class="note" style="font-style:normal">No messages yet.</div>'; }
  var Comms = {
    forStudent:MSG.forStudent, post:MSG.post,
    mountStaff:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null)||((SY.get('teacherProfile',{})||{}).schoolCode);
      var name=opts.byName||(SY.session&&SY.session.name)||'School'; if(!code){el.innerHTML='<div class="note">Link your school to message families.</div>';return;}
      var rl=roster(code)||[]; var cur=(opts.email||(rl[0]&&rl[0].email)||'').toLowerCase();
      function render(){ var msgs=MSG.forStudent(code,cur);
        var h='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><label class="f" style="margin:0">About</label>'+
          '<select id="cm-pick">'+rl.map(function(r){return '<option value="'+esc(r.email)+'"'+(String(r.email).toLowerCase()===cur?' selected':'')+'>'+esc(r.name||nameFor(r.email))+'</option>';}).join('')+'</select></div>';
        h+='<div style="border:1px solid var(--line);border-radius:10px;padding:10px;max-height:230px;overflow:auto">'+threadHtml(msgs)+'</div>';
        h+='<div style="display:flex;gap:8px;margin-top:8px"><input id="cm-in" placeholder="Message '+esc(nameFor(cur))+'\'s parent…" style="flex:1"><button class="btn sm" id="cm-send">Send</button></div>';
        el.innerHTML=h;
        document.getElementById('cm-pick').onchange=function(){cur=this.value.toLowerCase();render();};
        document.getElementById('cm-send').onclick=function(){ var i=document.getElementById('cm-in'); var t=(i.value||'').trim(); if(!t){say('Write a message');return;} MSG.post(code,cur,{role:'staff',name:name,text:t}); render(); };
      }
      render();
    },
    mountParent:function(el,opts){ opts=opts||{}; if(!el)return; var kids=opts.children||[]; var name=opts.name||(SY.session&&SY.session.name)||'Parent';
      if(!kids.length){ el.innerHTML='<div class="note" style="font-style:normal">Link a child to message their school.</div>'; return; }
      function codeForKid(email){ var cs=schoolsForEmail(email); return cs[0]||null; }
      function render(){
        el.innerHTML=kids.map(function(k,ki){ var code=codeForKid(k.email); var msgs=code?MSG.forStudent(code,k.email):[];
          return '<div class="card" style="margin-bottom:10px"><b>'+esc(k.name||nameFor(k.email))+'</b>'+
            (code?('<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:6px;max-height:200px;overflow:auto">'+threadHtml(msgs)+'</div>'+
              '<div style="display:flex;gap:8px;margin-top:8px"><input class="cm-pin" data-k="'+ki+'" placeholder="Message the school…" style="flex:1"><button class="btn sm cm-psend" data-k="'+ki+'" data-code="'+esc(code)+'" data-em="'+esc(k.email)+'">Send</button></div>')
              :'<div class="note" style="margin-top:6px">This child isn\'t linked to a school yet.</div>')+'</div>';
        }).join('');
        el.querySelectorAll('.cm-psend').forEach(function(b){b.onclick=function(){ var box=el.querySelector('.cm-pin[data-k="'+b.dataset.k+'"]'); var t=(box.value||'').trim(); if(!t){say('Write a message');return;} MSG.post(b.dataset.code,b.dataset.em,{role:'parent',name:name,text:t}); render(); };});
      }
      render();
    }
  };
  window.SYComms = Comms;

  /* ======================================================================
     SEATING — sy-school:<code>:seating = { group:{cols,seats:[email|null,…]} }
     ====================================================================== */
  var SEAT = {
    get:function(code,group){ var all=sg(code,'seating',{})||{}; return all[group]||{cols:5,seats:[]}; },
    save:function(code,group,plan){ var all=sg(code,'seating',{})||{}; all[group]=plan; ss(code,'seating',all); },
    auto:function(code,group){ var rl=roster(code).filter(function(r){var y=r.year||r.yearGroup||r.cohort||r.group;return !group||y===group||group==='Whole class';}); var p=SEAT.get(code,group); p.seats=rl.map(function(r){return String(r.email).toLowerCase();}); SEAT.save(code,group,p); return p; }
  };
  var Seating = {
    get:SEAT.get, save:SEAT.save, auto:SEAT.auto,
    mountEditor:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null)||((SY.get('teacherProfile',{})||{}).schoolCode);
      if(!code){el.innerHTML='<div class="note">Link your school to build a seating plan.</div>';return;}
      var gs=groups(code); if(!gs.length)gs=['Whole class']; var cur=opts.group||gs[0];
      function render(){ var plan=SEAT.get(code,cur); var cols=plan.cols||5;
        var rl=roster(code).filter(function(r){var y=r.year||r.yearGroup||r.cohort||r.group;return cur==='Whole class'||y===cur;});
        var seated={}; (plan.seats||[]).forEach(function(e){if(e)seated[e]=1;});
        var unseated=rl.filter(function(r){return !seated[String(r.email).toLowerCase()];});
        var h='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><label class="f" style="margin:0">Class</label>'+
          '<select id="se-group">'+gs.map(function(g){return '<option'+(g===cur?' selected':'')+'>'+esc(g)+'</option>';}).join('')+'</select>'+
          '<label class="f" style="margin:0">Columns</label><input id="se-cols" type="number" min="2" max="8" value="'+cols+'" style="width:64px">'+
          '<button class="btn ghost sm" id="se-auto">Auto-fill from roster</button>'+
          '<button class="btn ghost sm" id="se-clear">Clear</button></div>';
        h+='<div class="note" style="margin-bottom:6px">🧑‍🏫 Front of class · click an empty seat to place the next student, a filled seat to remove.</div>';
        var seats=plan.seats||[]; var rows=Math.max(1,Math.ceil(Math.max(seats.length,rl.length)/cols));
        h+='<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:6px">';
        for(var i=0;i<rows*cols;i++){ var em=seats[i]; h+='<div class="se-seat" data-i="'+i+'" style="border:1px solid var(--line);border-radius:8px;min-height:44px;padding:5px;font-size:11.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center;background:'+(em?'rgba(217,174,85,.1)':'transparent')+'">'+(em?esc(nameFor(em).split(' ')[0]):'<span class="note" style="margin:0;opacity:.5">seat</span>')+'</div>'; }
        h+='</div>';
        h+='<div class="note" style="margin-top:8px">Not yet seated: '+(unseated.length?unseated.map(function(r){return esc(nameFor(r.email).split(' ')[0]);}).join(', '):'everyone placed ✓')+'</div>';
        el.innerHTML=h;
        document.getElementById('se-group').onchange=function(){cur=this.value;render();};
        document.getElementById('se-cols').onchange=function(){var p=SEAT.get(code,cur);p.cols=Math.max(2,Math.min(8,+this.value||5));SEAT.save(code,cur,p);render();};
        document.getElementById('se-auto').onclick=function(){SEAT.auto(code,cur);render();};
        document.getElementById('se-clear').onclick=function(){var p=SEAT.get(code,cur);p.seats=[];SEAT.save(code,cur,p);render();};
        el.querySelectorAll('.se-seat').forEach(function(c){c.onclick=function(){ var i=+c.dataset.i; var p=SEAT.get(code,cur); p.seats=p.seats||[];
          if(p.seats[i]){ p.seats[i]=null; }
          else { var placed={}; p.seats.forEach(function(e){if(e)placed[e]=1;}); var next=rl.filter(function(r){return !placed[String(r.email).toLowerCase()];})[0]; if(!next){say('Everyone is seated');return;} p.seats[i]=String(next.email).toLowerCase(); }
          SEAT.save(code,cur,p); render(); };});
      }
      render();
    }
  };
  window.SYSeating = Seating;
})();
