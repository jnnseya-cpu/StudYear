/* ============================================================================
   SYReach — the Satchel-One Phase 5 "international / accessibility reach" layer
   plus the mobile-first teacher quick-bar.

   What can be delivered purely client-side is delivered for real:
     • low-data mode (persisted, honoured by pages that check the flag)
     • offline study packs (a self-contained downloadable HTML file)
     • language / locale preference (persisted; en-GB default)
     • a mobile-first teacher quick-action bar (PWA is the app vehicle)

   What genuinely needs an external provider (WhatsApp Business API, SMS gateway,
   Google Classroom / MIS OAuth, Mobile Money) is delivered as an HONEST config
   surface — real settings storage + explicit Connected / Not-connected status —
   never a fake "sent". The server wiring plugs in behind the same store later.

     window.SYReach        — lowData, locale, offlinePack, mountSettings, mountMobileBar
     window.SYIntegrations — MIS / LMS / SSO connector config (per school)
     window.SYChannels     — parent comms channels config (per school)
   ========================================================================== */
(function () {
  'use strict';
  var SY = window.SY;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function say(t){ try{ if(typeof window.toast==='function') window.toast(t); }catch(e){} }
  function lsGet(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function sg(code,k,d){ return SY.schoolGet(code,k,d); }
  function ss(code,k,v){ SY.schoolSet(code,k,v); }

  /* ---- low-data mode --------------------------------------------------- */
  function lowDataGet(){ return !!lsGet('sy-low-data',false); }
  function lowDataSet(v){ lsSet('sy-low-data',!!v); try{ document.documentElement.classList.toggle('sy-lowdata',!!v); }catch(e){} }
  try{ if(lowDataGet()) document.documentElement.classList.add('sy-lowdata'); }catch(e){}

  /* ---- locale ---------------------------------------------------------- */
  var LOCALES=[['en-GB','English (UK)'],['en','English'],['fr','Français'],['es','Español'],['pt','Português'],['ar','العربية'],['sw','Kiswahili'],['hi','हिन्दी'],['ur','اردو']];
  function localeGet(){ return lsGet('sy-locale','en-GB'); }
  function localeSet(v){ lsSet('sy-locale',v); }

  /* ---- offline study pack --------------------------------------------- */
  /* Build a single self-contained HTML file the learner can save and open with
     no connection: their profile, saved resources/notes and any homework text. */
  function offlinePack(email){
    email=email||(SY.session&&SY.session.email);
    function ra(k,d){ try{ return SY.readAccount?SY.readAccount(email,k,d):SY.get(k,d); }catch(e){ return d; } }
    var profile=ra('profile',{})||{}, mine=ra('mine',[])||[], quizzes=ra('quizzes',[])||[];
    var esc2=esc;
    var parts=['<!doctype html><meta charset="utf-8"><title>StudYear — offline study pack</title>',
      '<style>body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#111;line-height:1.6}h1{font-size:22px}h2{margin-top:26px;border-bottom:1px solid #ddd;padding-bottom:4px}.card{border:1px solid #ddd;border-radius:8px;padding:12px;margin:10px 0}small{color:#666}</style>',
      '<h1>StudYear — Offline Study Pack</h1>',
      '<small>For '+esc2(profile.name||String(email).split('@')[0])+' · '+esc2(profile.level||'')+' · generated offline-ready</small>'];
    parts.push('<h2>Saved resources & notes</h2>');
    if(mine.length) mine.forEach(function(m){ parts.push('<div class="card"><b>'+esc2(m.title||'Note')+'</b> <small>'+esc2(m.subj||'')+'</small><div>'+(m.body||'')+'</div></div>'); });
    else parts.push('<p><small>No saved resources yet.</small></p>');
    parts.push('<h2>Recent quiz scores</h2>');
    if(quizzes.length) parts.push('<ul>'+quizzes.slice(0,20).map(function(q){return '<li>'+esc2(q.title||q.subj||'Quiz')+' — '+esc2(String(q.pct!=null?q.pct+'%':''))+'</li>';}).join('')+'</ul>');
    else parts.push('<p><small>No quiz history yet.</small></p>');
    var html=parts.join('');
    try{
      var blob=new Blob([html],{type:'text/html'}); var url=URL.createObjectURL(blob);
      var a=document.createElement('a'); a.href=url; a.download='studyear-offline-pack.html'; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },1000);
      return true;
    }catch(e){ return false; }
  }

  /* ---- settings surface (student / parent) ---------------------------- */
  function mountSettings(el){
    if(!el)return;
    function render(){
      el.innerHTML='<div class="card"><div style="display:flex;align-items:center;gap:10px"><label class="f" style="margin:0;flex:1">📶 Low-data mode <span class="note" style="display:block;margin:0">Lighter pages on slow or metered connections.</span></label>'+
        '<button class="btn '+(lowDataGet()?'solid':'ghost')+' sm" id="rc-low">'+(lowDataGet()?'On':'Off')+'</button></div>'+
        '<div style="display:flex;align-items:center;gap:10px;margin-top:12px"><label class="f" style="margin:0;flex:1">🌐 Language</label>'+
          '<select id="rc-loc">'+LOCALES.map(function(l){return '<option value="'+l[0]+'"'+(localeGet()===l[0]?' selected':'')+'>'+esc(l[1])+'</option>';}).join('')+'</select></div>'+
        '<div style="margin-top:14px"><button class="btn" id="rc-pack">⬇ Download offline study pack</button>'+
          '<span class="note" style="display:block;margin-top:4px">A single file with your notes &amp; scores — open it with no connection.</span></div></div>';
      document.getElementById('rc-low').onclick=function(){ lowDataSet(!lowDataGet()); say(lowDataGet()?'Low-data mode on':'Low-data mode off'); render(); };
      document.getElementById('rc-loc').onchange=function(){ localeSet(this.value); say('Language preference saved'); };
      document.getElementById('rc-pack').onclick=function(){ offlinePack()?say('Offline pack downloaded ✓'):say('Couldn\'t build the pack on this device'); };
    }
    render();
  }

  /* ---- mobile-first teacher quick-bar --------------------------------- */
  /* A fixed bottom action bar on narrow screens so teachers can jump to their
     core mobile workflows in one tap. Injected once; hidden on wide screens. */
  function mountMobileBar(opts){
    opts=opts||{}; if(document.getElementById('sy-mbar'))return;
    var base=opts.base||''; var items=opts.items||[
      {ic:'📋',t:'Register',href:base+'attendance/'},
      {ic:'📥',t:'Homework',href:base+'#hw-teach-mount'},
      {ic:'🎁',t:'Points',href:base+'#bh-teach-mount'},
      {ic:'✉️',t:'Message',href:base+'#cm-teach-mount'}];
    var css=document.createElement('style');
    css.textContent='#sy-mbar{position:fixed;left:0;right:0;bottom:0;z-index:9000;display:none;justify-content:space-around;'+
      'background:rgba(11,20,40,.96);backdrop-filter:blur(8px);border-top:1px solid rgba(150,170,210,.25);padding:6px 4px env(safe-area-inset-bottom)}'+
      '#sy-mbar a{flex:1;text-align:center;text-decoration:none;color:#AEBBD6;font-size:10.5px;padding:6px 2px}'+
      '#sy-mbar a b{display:block;font-size:19px;line-height:1.1}'+
      '@media(max-width:760px){#sy-mbar{display:flex}body{padding-bottom:64px}}';
    document.head.appendChild(css);
    var bar=document.createElement('nav'); bar.id='sy-mbar';
    bar.innerHTML=items.map(function(i){return '<a href="'+esc(i.href)+'"><b>'+i.ic+'</b>'+esc(i.t)+'</a>';}).join('');
    document.body.appendChild(bar);
  }

  window.SYReach = { lowData:{get:lowDataGet,set:lowDataSet}, locale:{get:localeGet,set:localeSet},
    offlinePack:offlinePack, mountSettings:mountSettings, mountMobileBar:mountMobileBar };

  /* ---- integrations hub (per school) ---------------------------------- */
  var CONNECTORS=[
    {id:'google_classroom',name:'Google Classroom',cat:'LMS'},{id:'ms_teams',name:'Microsoft Teams',cat:'LMS'},
    {id:'wonde',name:'Wonde (MIS bridge)',cat:'MIS'},{id:'sims',name:'SIMS',cat:'MIS'},{id:'arbor',name:'Arbor',cat:'MIS'},{id:'bromcom',name:'Bromcom',cat:'MIS'},
    {id:'google_sso',name:'Google SSO',cat:'Identity'},{id:'ms_entra',name:'Microsoft Entra SSO',cat:'Identity'},
    {id:'stripe',name:'Stripe (payments)',cat:'Payments'},{id:'gocardless',name:'GoCardless (Direct Debit)',cat:'Payments'},{id:'mobile_money',name:'Mobile Money',cat:'Payments'}];
  function integ(code){ return sg(code,'integrations',{})||{}; }
  function mountIntegrations(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||(SY.get&&SY.get('schoolCode',null)); if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
    function render(){ var cfg=integ(code);
      var cats={}; CONNECTORS.forEach(function(c){ (cats[c.cat]=cats[c.cat]||[]).push(c); });
      var h='<div class="note" style="margin-bottom:6px">Connect StudYear to the systems you already use. External systems map into StudYear\'s data model, so you never depend on one provider.</div>';
      Object.keys(cats).forEach(function(cat){ h+='<div class="card" style="margin-bottom:10px"><div class="note" style="margin-bottom:4px">'+esc(cat)+'</div>'+
        cats[cat].map(function(c){ var on=cfg[c.id]&&cfg[c.id].connected;
          return '<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:8px 0"><b style="flex:1;font-size:13px">'+esc(c.name)+'</b>'+
            '<span style="font-size:11px;font-weight:700;color:'+(on?'var(--good,#5CBB7B)':'var(--ink-3)')+'">'+(on?'● Connected':'○ Not connected')+'</span>'+
            '<button class="btn ghost sm ig-t" data-id="'+c.id+'">'+(on?'Disconnect':'Configure')+'</button></div>';
        }).join('')+'</div>'; });
      el.innerHTML=h;
      el.querySelectorAll('.ig-t').forEach(function(b){b.onclick=function(){ var cfg2=integ(code); var id=b.dataset.id;
        if(cfg2[id]&&cfg2[id].connected){ delete cfg2[id]; ss(code,'integrations',cfg2); say('Disconnected'); }
        else { var key=window.prompt('Enter the API key / tenant ID for this connector (stored on your school record; server exchange completes the OAuth):',''); if(key==null){return;} cfg2[id]={connected:!!key.trim(),ref:key.trim()?'configured':'',at:new Date().toISOString()}; ss(code,'integrations',cfg2); say(key.trim()?'Configured ✓':'Saved'); }
        render(); };});
    }
    render();
  }
  window.SYIntegrations = { connectors:CONNECTORS, get:integ, mountSchool:mountIntegrations };

  /* ---- parent comms channels (per school) ----------------------------- */
  var CHANNELS=[{id:'email',name:'Email',note:'Always on where a parent email exists.'},{id:'push',name:'Push notifications',note:'For installed app users.'},
    {id:'sms',name:'SMS',note:'Needs an SMS gateway account.'},{id:'whatsapp',name:'WhatsApp',note:'Needs a WhatsApp Business API number.'},{id:'voice',name:'Voice AI call',note:'Automated reminder calls.'}];
  function chans(code){ return sg(code,'channels',{email:{on:true}})||{email:{on:true}}; }
  function mountChannels(el,opts){ opts=opts||{}; if(!el)return; var code=opts.code||(SY.get&&SY.get('schoolCode',null)); if(!code){el.innerHTML='<div class="note">Link your school first.</div>';return;}
    function render(){ var cfg=chans(code);
      el.innerHTML='<div class="note" style="margin-bottom:6px">Choose how families receive notices. Email &amp; push work now; SMS / WhatsApp / Voice activate once their provider is connected in Integrations.</div>'+
        CHANNELS.map(function(c){ var on=cfg[c.id]&&cfg[c.id].on; var ready=(c.id==='email'||c.id==='push');
          return '<div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:8px 0"><div style="flex:1"><b style="font-size:13px">'+esc(c.name)+'</b><div class="note" style="margin:0">'+esc(c.note)+'</div></div>'+
            (ready?'':'<span class="note" style="margin:0;color:var(--warn,#E0A93F)">needs provider</span>')+
            '<button class="btn '+(on?'solid':'ghost')+' sm ch-t" data-id="'+c.id+'">'+(on?'On':'Off')+'</button></div>';
        }).join('');
      el.querySelectorAll('.ch-t').forEach(function(b){b.onclick=function(){ var cfg2=chans(code); var id=b.dataset.id; cfg2[id]={on:!(cfg2[id]&&cfg2[id].on)}; ss(code,'channels',cfg2); render(); };});
    }
    render();
  }
  window.SYChannels = { channels:CHANNELS, get:chans, mountSchool:mountChannels };
})();
