/* ============================================================================
   SYSchoolOS — the Satchel-One Phase 3 "school operating system" layer:
   academic structure, admissions, examinations, and a roles-&-permissions
   matrix. Same shared school store (sy-school:<code>:*) as homework.js and
   schoolsuite.js, so everything is one coherent record per school code.

   Purely additive — mounts on the leadership console; nothing removed.
   A canonical data model: external MIS systems map INTO these entities (the
   integrations hub in mobile.js handles the mapping), so we never depend on
   one provider.

     window.SYStructure   — year groups · subjects · classes
     window.SYAdmissions  — enquiry → application → offer → enrolled pipeline
     window.SYExams       — exam sessions · entries · grades · grade schemes
     window.SYRoles       — role taxonomy + permission matrix + can() gate
   ========================================================================== */
(function () {
  'use strict';
  var SY = window.SY;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function uid(p){return (p||'x')+Math.abs((Date.now()%1e7)).toString(36)+Math.floor(Math.random()*1e6).toString(36);}
  function now(){return new Date().toISOString();}
  function fmtDate(iso){try{var d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){return '';}}
  function say(t){ try{ if(typeof window.toast==='function') window.toast(t); }catch(e){} }
  function sg(code,k,d){ return SY.schoolGet(code,k,d); }
  function ss(code,k,v){ SY.schoolSet(code,k,v); }
  function roster(code){ return (sg(code,'roster',[])||[]); }
  function staff(code){ return (sg(code,'staff',[])||[]); }
  function nameFor(email){ try{return (SY.accountName&&SY.accountName(email))||String(email||'').split('@')[0];}catch(e){return email;} }
  function ask(q,d){ var v=window.prompt(q,d||''); return v==null?null:v; }

  /* =====================================================================
     ACADEMIC STRUCTURE — sy-school:<code>:structure
     { years:[], subjects:[], classes:[{id,name,year,subject,teacher,teacherName,room}] }
     ===================================================================== */
  function struct(code){ var s=sg(code,'structure',null); if(!s){ s={years:defaultYears(code),subjects:defaultSubjects(),classes:[]}; } s.years=s.years||[]; s.subjects=s.subjects||[]; s.classes=s.classes||[]; return s; }
  function defaultYears(code){ var y={}; roster(code).forEach(function(r){ var v=r.year||r.yearGroup; if(v)y[v]=1; }); var arr=Object.keys(y); return arr.length?arr:['Year 7','Year 8','Year 9','Year 10','Year 11']; }
  function defaultSubjects(){ return ['Mathematics','English Language','English Literature','Biology','Chemistry','Physics','History','Geography','French','Computing','Art','PE']; }
  var Structure = {
    get:struct,
    save:function(code,s){ ss(code,'structure',s); },
    addClass:function(code,c){ var s=struct(code); c.id=c.id||uid('cl'); s.classes.push(c); Structure.save(code,s); return c; },
    removeClass:function(code,id){ var s=struct(code); s.classes=s.classes.filter(function(c){return c.id!==id;}); Structure.save(code,s); },
    mountSchool:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null); if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
      function render(){ var s=struct(code); var st=staff(code);
        var h='<div class="card"><div style="display:flex;gap:14px;flex-wrap:wrap">'+
          '<div style="flex:1;min-width:180px"><div class="note" style="margin-bottom:4px">Year groups ('+s.years.length+')</div>'+
            '<div style="display:flex;gap:6px;flex-wrap:wrap">'+s.years.map(function(y){return '<span style="font-size:12px;background:rgba(150,170,210,.12);border-radius:14px;padding:3px 9px">'+esc(y)+'</span>';}).join('')+
            '<button class="btn ghost sm" id="st-addyear">+ Add</button></div></div>'+
          '<div style="flex:1;min-width:180px"><div class="note" style="margin-bottom:4px">Subjects ('+s.subjects.length+')</div>'+
            '<div style="display:flex;gap:6px;flex-wrap:wrap">'+s.subjects.map(function(x){return '<span style="font-size:12px;background:rgba(150,170,210,.12);border-radius:14px;padding:3px 9px">'+esc(x)+'</span>';}).join('')+
            '<button class="btn ghost sm" id="st-addsubj">+ Add</button></div></div></div></div>';
        h+='<div class="card" style="margin-top:12px"><div class="note" style="margin-bottom:6px">Teaching classes ('+s.classes.length+')</div>';
        h+='<div class="two"><div><label class="f">Class name</label><input id="cl-name" placeholder="e.g. 10A/Ma1"></div>'+
          '<div><label class="f">Year</label><select id="cl-year">'+s.years.map(function(y){return '<option>'+esc(y)+'</option>';}).join('')+'</select></div></div>'+
          '<div class="two" style="margin-top:8px"><div><label class="f">Subject</label><select id="cl-subj">'+s.subjects.map(function(x){return '<option>'+esc(x)+'</option>';}).join('')+'</select></div>'+
          '<div><label class="f">Teacher</label><select id="cl-teacher"><option value="">—</option>'+st.map(function(t){return '<option value="'+esc(t.email||'')+'">'+esc(t.name||t.email)+'</option>';}).join('')+'</select></div></div>'+
          '<div style="margin-top:10px"><button class="btn solid" id="cl-add">Add class →</button></div>';
        h+=s.classes.length?('<div style="margin-top:10px">'+s.classes.map(function(c){
          return '<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:8px 0"><b style="flex:1;font-size:13px">'+esc(c.name)+'</b>'+
            '<span class="note" style="margin:0">'+esc(c.year)+' · '+esc(c.subject)+(c.teacherName?' · '+esc(c.teacherName):'')+'</span><button class="btn ghost sm cl-del" data-id="'+c.id+'">✕</button></div>';
        }).join('')+'</div>'):'<div class="note" style="margin-top:8px;font-style:normal">No classes defined yet.</div>';
        h+='</div>';
        el.innerHTML=h;
        document.getElementById('st-addyear').onclick=function(){ var v=ask('New year group (e.g. Year 12):'); if(v&&v.trim()){ var s2=struct(code); s2.years.push(v.trim()); Structure.save(code,s2); render(); } };
        document.getElementById('st-addsubj').onclick=function(){ var v=ask('New subject:'); if(v&&v.trim()){ var s2=struct(code); s2.subjects.push(v.trim()); Structure.save(code,s2); render(); } };
        document.getElementById('cl-add').onclick=function(){ var nm=(document.getElementById('cl-name').value||'').trim(); if(!nm){say('Name the class');return;}
          var tsel=document.getElementById('cl-teacher'); var temail=tsel.value; var tname=temail?(st.filter(function(x){return x.email===temail;})[0]||{}).name||'':'';
          Structure.addClass(code,{name:nm,year:document.getElementById('cl-year').value,subject:document.getElementById('cl-subj').value,teacher:temail,teacherName:tname}); say('Class added ✓'); render(); };
        el.querySelectorAll('.cl-del').forEach(function(b){b.onclick=function(){ Structure.removeClass(code,b.dataset.id); render(); };});
      }
      render();
    }
  };
  window.SYStructure = Structure;

  /* =====================================================================
     ADMISSIONS — sy-school:<code>:admissions = [{id,name,dob,year,stage,
     contact,notes,at}]. Pipeline: enquiry→application→assessment→offer→
     accepted→enrolled (or declined).
     ===================================================================== */
  var STAGES=['enquiry','application','assessment','offer','accepted','enrolled','declined'];
  var STAGE_L={enquiry:'Enquiry',application:'Application',assessment:'Assessment',offer:'Offer made',accepted:'Accepted',enrolled:'Enrolled',declined:'Declined'};
  var STAGE_C={enquiry:'var(--ink-3)',application:'var(--blue-300,#8FC2EC)',assessment:'var(--warn,#E0A93F)',offer:'var(--gold-300)',accepted:'var(--good,#5CBB7B)',enrolled:'var(--good,#5CBB7B)',declined:'var(--crit,#E06060)'};
  var Admissions = {
    all:function(code){ return (sg(code,'admissions',[])||[]); },
    add:function(code,o){ var l=sg(code,'admissions',[])||[]; var a={id:uid('adm'),name:o.name||'Applicant',dob:o.dob||'',year:o.year||'',stage:o.stage||'enquiry',contact:o.contact||'',notes:o.notes||'',at:now(),history:[{stage:o.stage||'enquiry',at:now()}]}; l.unshift(a); ss(code,'admissions',l); return a; },
    setStage:function(code,id,stage){ var l=sg(code,'admissions',[])||[]; for(var i=0;i<l.length;i++){ if(l[i].id===id){ l[i].stage=stage; (l[i].history=l[i].history||[]).push({stage:stage,at:now()}); ss(code,'admissions',l);
      if(stage==='enrolled'){ enrol(code,l[i]); } return true; } } return false; },
    remove:function(code,id){ ss(code,'admissions',(sg(code,'admissions',[])||[]).filter(function(a){return a.id!==id;})); }
  };
  function enrol(code,a){ try{ var r=roster(code); var email=(a.contact&&/@/.test(a.contact))?a.contact.toLowerCase():(a.name.toLowerCase().replace(/[^a-z]+/g,'.')+'@applicant.local');
    if(!r.some(function(x){return String(x.email||'').toLowerCase()===email;})){ r.push({email:email,name:a.name,year:a.year,cohort:a.year,enrolledFrom:'admissions'}); ss(code,'roster',r); } }catch(e){} }
  var Adm = {
    all:Admissions.all, add:Admissions.add, setStage:Admissions.setStage,
    mountSchool:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null); if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
      function render(){ var l=Admissions.all(code); var s=struct(code);
        var counts={}; STAGES.forEach(function(x){counts[x]=0;}); l.forEach(function(a){counts[a.stage]=(counts[a.stage]||0)+1;});
        var h='<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">'+
          STAGES.map(function(x){return '<span style="font-size:11.5px;background:rgba(150,170,210,.1);border-radius:12px;padding:3px 9px;color:'+STAGE_C[x]+'"><b>'+counts[x]+'</b> '+STAGE_L[x]+'</span>';}).join('')+'</div>'+
          '<div class="two"><div><label class="f">Applicant name</label><input id="ad-name" placeholder="Full name"></div>'+
          '<div><label class="f">Year applying for</label><select id="ad-year">'+s.years.map(function(y){return '<option>'+esc(y)+'</option>';}).join('')+'</select></div></div>'+
          '<div class="two" style="margin-top:8px"><div><label class="f">Parent contact (email)</label><input id="ad-contact" placeholder="parent@email"></div>'+
          '<div style="display:flex;align-items:flex-end"><button class="btn solid" id="ad-add" style="width:100%">Add enquiry →</button></div></div></div>';
        h+='<div style="margin-top:12px">'+(l.length?l.map(function(a){
          var idx=STAGES.indexOf(a.stage);
          return '<div class="card" style="margin-bottom:8px"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+esc(a.name)+'</b>'+
            '<span style="font-size:11px;font-weight:700;color:'+STAGE_C[a.stage]+'">'+STAGE_L[a.stage]+'</span></div>'+
            '<div class="note" style="margin-top:2px">'+esc(a.year)+(a.contact?' · '+esc(a.contact):'')+' · added '+fmtDate(a.at)+'</div>'+
            '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">'+
              (idx<5&&a.stage!=='declined'?'<button class="btn sm ad-next" data-id="'+a.id+'" data-next="'+STAGES[idx+1]+'">Advance to '+STAGE_L[STAGES[idx+1]]+' →</button>':'')+
              (a.stage!=='declined'&&a.stage!=='enrolled'?'<button class="btn ghost sm ad-dec" data-id="'+a.id+'">Decline</button>':'')+
              '<button class="btn ghost sm ad-del" data-id="'+a.id+'">✕</button></div></div>';
        }).join(''):'<div class="note" style="font-style:normal">No applicants yet.</div>')+'</div>';
        el.innerHTML=h;
        document.getElementById('ad-add').onclick=function(){ var nm=(document.getElementById('ad-name').value||'').trim(); if(!nm){say('Enter a name');return;}
          Admissions.add(code,{name:nm,year:document.getElementById('ad-year').value,contact:(document.getElementById('ad-contact').value||'').trim()}); say('Enquiry added ✓'); render(); };
        el.querySelectorAll('.ad-next').forEach(function(b){b.onclick=function(){ Admissions.setStage(code,b.dataset.id,b.dataset.next); if(b.dataset.next==='enrolled')say('Enrolled — added to the roster ✓'); render(); };});
        el.querySelectorAll('.ad-dec').forEach(function(b){b.onclick=function(){ Admissions.setStage(code,b.dataset.id,'declined'); render(); };});
        el.querySelectorAll('.ad-del').forEach(function(b){b.onclick=function(){ Admissions.remove(code,b.dataset.id); render(); };});
      }
      render();
    }
  };
  window.SYAdmissions = Adm;

  /* =====================================================================
     EXAMS — sy-school:<code>:exams = { sessions:[{id,name,subject,board,date,
     group,scheme}], entries:{sessionId:{email:{grade,mark}}} }
     ===================================================================== */
  var SCHEMES={'gcse91':{label:'GCSE 9–1',grades:['9','8','7','6','5','4','3','2','1','U']},'alevel':{label:'A level A*–E',grades:['A*','A','B','C','D','E','U']},'btec':{label:'BTEC',grades:['D*','D','M','P','U']},'ks2':{label:'KS2 scaled',grades:['GDS','EXS','WTS','PKF']}};
  function exams(code){ var e=sg(code,'exams',null)||{sessions:[],entries:{}}; e.sessions=e.sessions||[]; e.entries=e.entries||{}; return e; }
  var Exams = {
    get:exams,
    addSession:function(code,o){ var e=exams(code); var s={id:uid('ex'),name:o.name||'Exam',subject:o.subject||'',board:o.board||'',date:o.date||'',group:o.group||'',scheme:o.scheme||'gcse91'}; e.sessions.unshift(s); ss(code,'exams',e); return s; },
    removeSession:function(code,id){ var e=exams(code); e.sessions=e.sessions.filter(function(s){return s.id!==id;}); delete e.entries[id]; ss(code,'exams',e); },
    setGrade:function(code,id,email,grade,mark){ var e=exams(code); e.entries[id]=e.entries[id]||{}; e.entries[id][String(email).toLowerCase()]={grade:grade,mark:mark==null?'':mark}; ss(code,'exams',e); },
    resultsFor:function(code,email){ var e=exams(code),em=String(email).toLowerCase(),out=[]; e.sessions.forEach(function(s){ var en=(e.entries[s.id]||{})[em]; if(en&&en.grade)out.push({session:s,grade:en.grade,mark:en.mark}); }); return out; },
    mountSchool:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null); if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
      var open=null;
      function render(){ var e=exams(code), s=struct(code);
        var h='<div class="card"><div class="note" style="margin-bottom:6px">Create an exam / assessment session</div>'+
          '<div class="two"><div><label class="f">Name</label><input id="ex-name" placeholder="e.g. Y11 Maths Paper 1 (Mock)"></div>'+
          '<div><label class="f">Subject</label><select id="ex-subj">'+s.subjects.map(function(x){return '<option>'+esc(x)+'</option>';}).join('')+'</select></div></div>'+
          '<div class="two" style="margin-top:8px"><div><label class="f">Class / year</label><select id="ex-group">'+s.years.map(function(y){return '<option>'+esc(y)+'</option>';}).join('')+'</select></div>'+
          '<div><label class="f">Grade scheme</label><select id="ex-scheme">'+Object.keys(SCHEMES).map(function(k){return '<option value="'+k+'">'+SCHEMES[k].label+'</option>';}).join('')+'</select></div></div>'+
          '<div class="two" style="margin-top:8px"><div><label class="f">Board (optional)</label><input id="ex-board" placeholder="AQA / Edexcel…"></div>'+
          '<div><label class="f">Date</label><input type="date" id="ex-date"></div></div>'+
          '<div style="margin-top:10px"><button class="btn solid" id="ex-add">Create session →</button></div></div>';
        h+='<div style="margin-top:12px">'+(e.sessions.length?e.sessions.map(function(x){ var entered=Object.keys(e.entries[x.id]||{}).length;
          return '<div class="card" style="margin-bottom:8px"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+esc(x.name)+'</b><span class="note" style="margin:0">'+entered+' entered</span></div>'+
            '<div class="note" style="margin-top:2px">'+esc(x.subject)+' · '+esc(x.group)+' · '+(SCHEMES[x.scheme]||SCHEMES.gcse91).label+(x.date?' · '+fmtDate(x.date):'')+'</div>'+
            '<div style="margin-top:8px"><button class="btn sm ex-open" data-id="'+x.id+'">Enter results →</button> <button class="btn ghost sm ex-del" data-id="'+x.id+'">✕</button></div></div>';
        }).join(''):'<div class="note" style="font-style:normal">No exam sessions yet.</div>')+'</div>';
        el.innerHTML=h;
        document.getElementById('ex-add').onclick=function(){ var nm=(document.getElementById('ex-name').value||'').trim(); if(!nm){say('Name the session');return;}
          Exams.addSession(code,{name:nm,subject:document.getElementById('ex-subj').value,group:document.getElementById('ex-group').value,scheme:document.getElementById('ex-scheme').value,board:(document.getElementById('ex-board').value||'').trim(),date:document.getElementById('ex-date').value}); say('Session created ✓'); render(); };
        el.querySelectorAll('.ex-open').forEach(function(b){b.onclick=function(){ enter(b.dataset.id); };});
        el.querySelectorAll('.ex-del').forEach(function(b){b.onclick=function(){ Exams.removeSession(code,b.dataset.id); render(); };});
      }
      function enter(id){ var e=exams(code); var s=e.sessions.filter(function(x){return x.id===id;})[0]; if(!s)return;
        var scheme=SCHEMES[s.scheme]||SCHEMES.gcse91; var rl=roster(code).filter(function(r){ return !s.group||String(r.year||r.cohort||'')===s.group; }); if(!rl.length)rl=roster(code);
        var ent=e.entries[id]||{};
        var h='<div class="card"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1;font-size:15px">'+esc(s.name)+'</b><button class="btn ghost sm" id="ex-back">← Back</button></div>'+
          '<div class="note" style="margin-top:2px">'+esc(s.subject)+' · '+scheme.label+'</div>';
        rl.forEach(function(r){ var em=String(r.email||'').toLowerCase(); var cur=ent[em]||{};
          h+='<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:8px 0"><b style="flex:1;font-size:13px">'+esc(r.name||nameFor(em))+'</b>'+
            '<input class="ex-mark" data-em="'+esc(em)+'" value="'+esc(cur.mark!=null?cur.mark:'')+'" placeholder="mark" style="width:70px">'+
            '<select class="ex-grade" data-em="'+esc(em)+'"><option value="">grade</option>'+scheme.grades.map(function(g){return '<option'+(cur.grade===g?' selected':'')+'>'+g+'</option>';}).join('')+'</select></div>';
        });
        h+='<div style="margin-top:10px"><button class="btn solid" id="ex-save">Save results</button></div></div>';
        el.innerHTML=h;
        document.getElementById('ex-back').onclick=render;
        document.getElementById('ex-save').onclick=function(){ el.querySelectorAll('.ex-grade').forEach(function(sel){ var em=sel.dataset.em; var g=sel.value; var mk=(el.querySelector('.ex-mark[data-em="'+CSS.escape(em)+'"]')||{}).value||''; if(g||mk)Exams.setGrade(code,id,em,g,mk); }); say('Results saved ✓'); render(); };
      }
      render();
    }
  };
  window.SYExams = Exams;

  /* =====================================================================
     ROLES & PERMISSIONS — sy-school:<code>:roles =
     { roles:[{id,name,perms:{DIM:bool}}], assignments:{email:roleId} }
     ===================================================================== */
  var DIMS=['View','Create','Edit','Delete','Approve','Publish','Export','Share','Assign','Close','AccessAI','ViewSensitive','ManagePermissions','Impersonate','CrossSchool','Historical'];
  function defaultRoles(){ return [
    {id:'leader',name:'School leader',perms:allPerms(true)},
    {id:'teacher',name:'Teacher',perms:permSet(['View','Create','Edit','Publish','Assign','AccessAI','Export'])},
    {id:'ta',name:'Teaching assistant',perms:permSet(['View','AccessAI'])},
    {id:'office',name:'Office / admin',perms:permSet(['View','Create','Edit','Export','ViewSensitive'])},
    {id:'safeguard',name:'Safeguarding lead',perms:permSet(['View','ViewSensitive','Historical','Export'])}
  ]; }
  function allPerms(v){ var o={}; DIMS.forEach(function(d){o[d]=v;}); return o; }
  function permSet(list){ var o=allPerms(false); list.forEach(function(d){o[d]=true;}); return o; }
  function rolesDoc(code){ var r=sg(code,'roles',null); if(!r){ r={roles:defaultRoles(),assignments:{}}; } r.roles=r.roles||[]; r.assignments=r.assignments||{}; return r; }
  var Roles = {
    get:rolesDoc,
    save:function(code,r){ ss(code,'roles',r); },
    can:function(code,email,dim){ var r=rolesDoc(code); var rid=r.assignments[String(email||'').toLowerCase()]; if(!rid)return false; var role=r.roles.filter(function(x){return x.id===rid;})[0]; return !!(role&&role.perms&&role.perms[dim]); },
    assign:function(code,email,roleId){ var r=rolesDoc(code); r.assignments[String(email).toLowerCase()]=roleId; Roles.save(code,r); },
    mountSchool:function(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||SY.get('schoolCode',null); if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
      function render(){ var r=rolesDoc(code); var st=staff(code);
        var h='<div class="card"><div class="note" style="margin-bottom:6px">Permission matrix — tick what each role may do</div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:720px;font-size:11.5px"><thead><tr><th style="text-align:left;padding:5px;position:sticky;left:0;background:var(--panel,#0B1428)">Role</th>'+
          DIMS.map(function(d){return '<th style="padding:5px;color:var(--ink-3);white-space:nowrap">'+d+'</th>';}).join('')+'</tr></thead><tbody>';
        r.roles.forEach(function(role){ h+='<tr><td style="padding:5px;position:sticky;left:0;background:var(--panel,#0B1428)"><b>'+esc(role.name)+'</b></td>'+
          DIMS.map(function(d){return '<td style="padding:5px;text-align:center"><input type="checkbox" class="rp" data-role="'+role.id+'" data-dim="'+d+'"'+(role.perms[d]?' checked':'')+'></td>';}).join('')+'</tr>'; });
        h+='</tbody></table></div><div style="margin-top:8px"><button class="btn sm" id="rp-addrole">+ Add role</button></div></div>';
        // assignments
        h+='<div class="card" style="margin-top:12px"><div class="note" style="margin-bottom:6px">Assign staff to roles</div>'+
          (st.length?st.map(function(t){ var em=String(t.email||'').toLowerCase();
            return '<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:7px 0"><b style="flex:1;font-size:13px">'+esc(t.name||em)+'</b>'+
              '<select class="rp-assign" data-em="'+esc(em)+'"><option value="">— no role —</option>'+r.roles.map(function(ro){return '<option value="'+ro.id+'"'+(r.assignments[em]===ro.id?' selected':'')+'>'+esc(ro.name)+'</option>';}).join('')+'</select></div>';
          }).join(''):'<div class="note" style="font-style:normal">Add staff in People management first.</div>')+'</div>';
        el.innerHTML=h;
        el.querySelectorAll('.rp').forEach(function(cb){cb.onchange=function(){ var r2=rolesDoc(code); var role=r2.roles.filter(function(x){return x.id===cb.dataset.role;})[0]; if(role){ role.perms[cb.dataset.dim]=cb.checked; Roles.save(code,r2); } };});
        el.querySelectorAll('.rp-assign').forEach(function(sel){sel.onchange=function(){ var r2=rolesDoc(code); if(sel.value)r2.assignments[sel.dataset.em]=sel.value; else delete r2.assignments[sel.dataset.em]; Roles.save(code,r2); say('Role updated for '+nameFor(sel.dataset.em)); };});
        document.getElementById('rp-addrole').onclick=function(){ var nm=ask('New role name:'); if(nm&&nm.trim()){ var r2=rolesDoc(code); r2.roles.push({id:uid('ro'),name:nm.trim(),perms:permSet(['View'])}); Roles.save(code,r2); render(); } };
      }
      render();
    }
  };
  window.SYRoles = Roles;
})();
