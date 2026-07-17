/* ============================================================================
   SYAgents — the Satchel-One Phase 4 "AI moat": a school intelligence console
   where each agent computes REAL findings from the live shared-store data
   (homework, attendance, behaviour, quizzes, diagnostics, exams, roster), not
   labels. Findings carry a recommended action the leader can act on in a tap.

   Additive; read-only over the data except the explicit "Log intervention"
   action, which writes to sy-school:<code>:interventions (the same store the
   teacher/school intervention engine reads).

     window.SYAgents.compute(code)  -> [{key,name,icon,summary,findings:[...]}]
     window.SYAgents.mountConsole(el,{code})
   ========================================================================== */
(function () {
  'use strict';
  var SY = window.SY;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function now(){return new Date().toISOString();}
  function say(t){ try{ if(typeof window.toast==='function') window.toast(t); }catch(e){} }
  function sg(code,k,d){ return SY.schoolGet(code,k,d); }
  function ss(code,k,v){ SY.schoolSet(code,k,v); }
  function roster(code){ return (sg(code,'roster',[])||[]); }
  function nameFor(email){ try{return (SY.accountName&&SY.accountName(email))||String(email||'').split('@')[0];}catch(e){return email;} }

  /* ---- data helpers ---------------------------------------------------- */
  function attendancePct(code,email){
    var store=sg(code,'attendance',{})||{}; var em=String(email).toLowerCase(); var counted=0,present=0;
    Object.keys(store).forEach(function(k){ var rec=store[k]&&store[k].records; if(rec&&rec[em]!=null){ counted++; var st=String(rec[em]).toLowerCase(); if(st==='present'||st==='late'||st==='p'||st==='l')present++; } });
    return counted?Math.round(100*present/counted):null;
  }
  function hwState(code,email){
    var em=String(email).toLowerCase(); var list=sg(code,'homework',[])||[]; var pending=0,overdue=0,total=0;
    list.forEach(function(a){ total++; var sub=(a.submissions||{})[em]; if(sub&&sub.submittedAt)return;
      if(a.dueAt&&new Date(a.dueAt)<new Date())overdue++; else pending++; });
    return {pending:pending,overdue:overdue,total:total};
  }
  function behaviourNet(code,email){
    var em=String(email).toLowerCase(); var log=(sg(code,'behaviour',[])||[]).filter(function(b){return String(b.student).toLowerCase()===em;});
    var net=log.reduce(function(a,b){return a+(b.points||0);},0);
    var recentNeg=log.filter(function(b){return b.points<0 && (Date.now()-new Date(b.at).getTime())<14*864e5;}).length;
    return {net:net,recentNeg:recentNeg,count:log.length};
  }
  function mastery(email){
    try{ var qz=SY.readAccount(email,'quizzes',[])||[]; var dg=(SY.readAccount(email,'diagnostics',[])||[])[0];
      var vals=qz.map(function(q){return q.pct;}).filter(function(x){return typeof x==='number';});
      if(dg&&dg.list)dg.list.forEach(function(x){ if(typeof x.mastery==='number')vals.push(x.mastery); });
      if(!vals.length)return null; return Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length);
    }catch(e){return null;}
  }
  function sendFlag(r){ return !!(r.send||r.SEND||r.sen||(Array.isArray(r.flags)&&r.flags.some(function(f){return /send|sen|ehcp/i.test(f);}))); }

  /* ---- the agents ------------------------------------------------------ */
  function compute(code){
    var rl=roster(code)||[]; var out=[];
    // 1. Academic Load
    var load=[]; rl.forEach(function(r){ var h=hwState(code,r.email); if(h.overdue>=2||h.pending>=4){ load.push({student:r.email,name:r.name||nameFor(r.email),severity:h.overdue>=3?'high':'med',text:h.overdue+' overdue · '+h.pending+' pending homework',action:'intervention',reason:'Homework backlog'}); } });
    out.push({key:'load',name:'Academic Load Agent',icon:'📚',summary:load.length?load.length+' student(s) overloaded with unfinished work':'Workload balanced across the cohort',findings:load});
    // 2. Attendance Intervention
    var att=[]; rl.forEach(function(r){ var p=attendancePct(code,r.email); if(p!=null&&p<90){ att.push({student:r.email,name:r.name||nameFor(r.email),severity:p<85?'high':'med',text:p+'% attendance',action:'intervention',reason:'Attendance below 90%'}); } });
    out.push({key:'attendance',name:'Attendance Intervention Agent',icon:'📅',summary:att.length?att.length+' student(s) below the 90% threshold':'Attendance healthy where recorded',findings:att});
    // 3. Behaviour Pattern
    var beh=[]; rl.forEach(function(r){ var b=behaviourNet(code,r.email); if(b.net<0||b.recentNeg>=2){ beh.push({student:r.email,name:r.name||nameFor(r.email),severity:b.net<=-3?'high':'med',text:(b.net>=0?'+':'')+b.net+' net · '+b.recentNeg+' concerns in 14 days',action:'intervention',reason:'Behaviour trend'}); } });
    out.push({key:'behaviour',name:'Behaviour & Engagement Agent',icon:'🎯',summary:beh.length?beh.length+' student(s) showing a negative pattern':'Behaviour positive across the cohort',findings:beh});
    // 4. Examination Readiness
    var exr=[]; rl.forEach(function(r){ var m=mastery(r.email); var target=null; try{ var pf=SY.readAccount(r.email,'profile',{}); if(pf.subjects&&pf.subjects[0]&&pf.subjects[0].target)target=pf.subjects[0].target; }catch(e){}
      if(m!=null&&m<55){ exr.push({student:r.email,name:r.name||nameFor(r.email),severity:m<45?'high':'med',text:m+'% mastery'+(target?' (target grade '+target+')':''),action:'intervention',reason:'Below exam-ready mastery'}); } });
    out.push({key:'exam',name:'Examination Readiness Agent',icon:'🎓',summary:exr.length?exr.length+' student(s) below exam-ready mastery':'Cohort tracking toward targets',findings:exr});
    // 5. SEND Adjustment
    var send=[]; rl.forEach(function(r){ if(sendFlag(r)){ send.push({student:r.email,name:r.name||nameFor(r.email),severity:'info',text:'SEND — check adjustments are applied in lessons & exams',action:'note',reason:'SEND provision'}); } });
    out.push({key:'send',name:'SEND Adjustment Agent',icon:'🧩',summary:send.length?send.length+' student(s) with SEND provision to honour':'No SEND flags on the roster',findings:send});
    // 6. School Operations
    var ops=[];
    var hw=sg(code,'homework',[])||[]; var unmarked=hw.filter(function(a){ var subs=a.submissions||{}; return Object.keys(subs).some(function(k){return subs[k].submittedAt&&(subs[k].grade==null||subs[k].grade==='');}); }).length;
    if(unmarked)ops.push({severity:'med',text:unmarked+' assignment(s) have submissions awaiting marking',action:'note',reason:'Marking backlog'});
    var anns=sg(code,'announcements',[])||[]; var urgentUnread=anns.filter(function(a){return a.priority==='urgent'&&Object.keys(a.reads||{}).length===0;}).length;
    if(urgentUnread)ops.push({severity:'high',text:urgentUnread+' urgent notice(s) not yet acknowledged by anyone',action:'note',reason:'Communication gap'});
    var tt=sg(code,'timetable',[])||[]; if(!tt.length)ops.push({severity:'med',text:'No timetable published yet — students & parents can\'t see lessons',action:'note',reason:'Missing timetable'});
    var att2=sg(code,'attendance',{})||{}; if(!Object.keys(att2).length)ops.push({severity:'med',text:'No registers taken yet — attendance intelligence is blank',action:'note',reason:'Missing registers'});
    out.push({key:'ops',name:'School Operations Agent',icon:'🛰',summary:ops.length?ops.length+' operational gap(s) need attention':'Operations running clean',findings:ops});
    return out;
  }

  function logIntervention(code,f){ try{ var iv=sg(code,'interventions',[])||[]; iv.unshift({student:f.student,name:f.name,status:'active',reason:f.reason||'AI-flagged',by:'ai-agent',at:now()}); ss(code,'interventions',iv); }catch(e){} }

  var SEV={high:{l:'High',c:'var(--crit,#E06060)'},med:{l:'Watch',c:'var(--warn,#E0A93F)'},info:{l:'Info',c:'var(--blue-300,#8FC2EC)'}};
  function mountConsole(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||(SY.get&&SY.get('schoolCode',null))||((SY.get&&SY.get('teacherProfile',{})||{}).schoolCode);
    if(!code){ el.innerHTML='<div class="note">Link your school to activate the AI intelligence agents.</div>'; return; }
    function render(){ var agents=compute(code);
      var totalFindings=agents.reduce(function(a,x){return a+x.findings.length;},0);
      var h='<div class="note" style="margin-bottom:8px">'+agents.length+' agents active · '+totalFindings+' live finding'+(totalFindings===1?'':'s')+' from your school\'s data</div>';
      h+=agents.map(function(ag){
        return '<div class="card" style="margin-bottom:10px"><div style="display:flex;align-items:baseline;gap:8px"><b style="flex:1">'+ag.icon+' '+esc(ag.name)+'</b>'+
          '<span class="note" style="margin:0">'+(ag.findings.length?ag.findings.length+' finding'+(ag.findings.length===1?'':'s'):'✓ clear')+'</span></div>'+
          '<div class="note" style="margin-top:2px">'+esc(ag.summary)+'</div>'+
          (ag.findings.length?('<div style="margin-top:8px">'+ag.findings.map(function(f,i){
            return '<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:7px 0;font-size:12.5px">'+
              '<span style="width:44px;font-weight:700;color:'+SEV[f.severity].c+'">'+SEV[f.severity].l+'</span>'+
              '<span style="flex:1">'+(f.name?'<b>'+esc(f.name)+'</b> · ':'')+esc(f.text)+'</span>'+
              (f.action==='intervention'&&f.student?'<button class="btn ghost sm ag-iv" data-agent="'+ag.key+'" data-i="'+i+'">Log intervention</button>':'')+'</div>';
          }).join('')+'</div>'):'')+'</div>';
      }).join('');
      el.innerHTML=h;
      el.querySelectorAll('.ag-iv').forEach(function(b){b.onclick=function(){ var ag=compute(code).filter(function(x){return x.key===b.dataset.agent;})[0]; var f=ag&&ag.findings[+b.dataset.i]; if(f){ logIntervention(code,f); say('Intervention logged for '+f.name+' — visible to staff'); b.disabled=true; b.textContent='Logged ✓'; } };});
    }
    render();
  }

  window.SYAgents = { compute:compute, mountConsole:mountConsole };
})();
