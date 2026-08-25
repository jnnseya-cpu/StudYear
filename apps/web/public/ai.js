/* StudYear browser-side AI client.
   Wires the real model providers (Google Gemini, OpenAI, Anthropic Claude) so the
   AI tools give genuine model answers, not templates. Config is written by the
   admin AI Gateway into a device-global key `sy-ai-live` = {provider,key,model},
   readable by every session on this device. When no key is set, SYAI.ready() is
   false and callers fall back to their on-device engine — nothing breaks.

   SECURITY: a browser-held key is exposed to anyone using this device. This is a
   preview/demo path — production routes through a server-side proxy so the key
   never reaches the browser. Use a restricted/test key here. */
(function(){
  'use strict';
  function cfg(){try{
    var c=JSON.parse(localStorage.getItem('sy-ai-live'))||null;
    if(c&&c.provider)return c;
    /* go-live default: when the cloud is configured, every signed-in account
       routes through the server-side gateway (/aiProxy) automatically — no
       per-device setup. The server holds the provider key; if the gateway is
       dormant the call fails cleanly and tools use their proven fallbacks. */
    var cc=null;try{cc=JSON.parse(localStorage.getItem('sy-cloud-config'))}catch(e){}
    if(cc&&cc.apiBase)return{provider:'proxy',key:'server'};
    return c;
  }catch(e){return null}}
  /* demo sessions never call the live providers — every tool uses its
     on-device fallback, so presentations spend nothing */
  function isDemo(){try{var s=JSON.parse(localStorage.getItem('sy-session'));return !!(s&&s.demo)}catch(e){return false}}
  function ready(){if(isDemo())return false;var c=cfg();return !!(c&&c.provider&&c.key)}
  function provider(){var c=cfg();return c?c.provider:null}
  function modelFor(c){
    if(c.model)return c.model;
    return c.provider==='gemini'?'gemini-2.0-flash':c.provider==='openai'?'gpt-4o-mini':'claude-3-5-haiku-20241022';
  }
  /* ask(system, user, {maxTokens, temperature, image}) -> Promise<string>
     opts.image: a data-URL (photo of work / scanned document / PDF) — sent to
     the provider's vision or document input so models can read uploads.
     PDFs (mime application/pdf) route to each provider's document channel. */
  function splitDataUrl(u){var m=String(u).match(/^data:([^;]+);base64,(.*)$/);return m?{mime:m[1],data:m[2]}:null}
  /* ---------------------------------------------------------------------------
     ACU METERING — single source of truth (owner policy 2026-08):
     EVERY live AI action is metered and gated by available ACUs. There are NO
     free passes — admin and every role are charged; demo sessions never reach a
     live provider so they simply use on-device fallbacks (nothing to meter).
     Charge is taken ONLY on a successful response (a failed/timed-out call costs
     nothing), and the balance is checked BEFORE the provider is called so an
     empty wallet never runs up provider cost. opts.acus sets the price
     (default 1); opts.pool charges a school ACU pool instead of the personal
     wallet. Callers that used to debit their own wallet now rely on this. ---- */
  function _monthKey(){try{return new Date().toISOString().slice(0,7)}catch(e){return '0000-00'}}
  /* free-tier grant cadence: 100 ACUs per QUARTER (every 3 months) — kept in a
     dedicated field so it never clashes with w.month (which the plan-lapse
     logic also writes). */
  function _quarterKey(){try{var d=new Date();return d.getUTCFullYear()+'-Q'+(Math.floor(d.getUTCMonth()/3)+1)}catch(e){return '0-Q0'}}
  function _mToQ(m){try{var p=String(m||'').split('-');if(p.length<2)return '';return p[0]+'-Q'+(Math.floor((parseInt(p[1],10)-1)/3)+1)}catch(e){return ''}}
  function _personal(){
    try{
      if(!(window.SY&&SY.get&&SY.set))return null;
      var w=SY.get('wallet',null);
      if(!w||typeof w!=='object')w={acus:100,plan:'child_free',month:_monthKey(),freeQ:_quarterKey()};
      if(w.plan==='child_free'){
        if(!w.freeQ)w.freeQ=_mToQ(w.month)||_quarterKey();      // migrate without re-granting mid-quarter
        if(w.freeQ!==_quarterKey()){w.acus=(w.acus||0)+100;w.freeQ=_quarterKey();SY.set('wallet',w);}
      }
      return w;
    }catch(e){return null}
  }
  function acuBalance(pool){
    try{
      if(pool&&window.SY&&SY.schoolGet){var p=SY.schoolGet(pool,'acu',{balance:0,burn:[]});return p.balance||0;}
      var w=_personal();return w?(w.acus||0):0;
    }catch(e){return 0}
  }
  function canAfford(cost,pool){return acuBalance(pool)>=Math.max(1,cost||1);}
  function chargeAcus(cost,pool,label){
    cost=Math.max(1,cost||1);
    try{
      if(pool&&window.SY&&SY.schoolGet){var p=SY.schoolGet(pool,'acu',{balance:0,burn:[]});p.balance=Math.max(0,(p.balance||0)-cost);p.burn=(p.burn||[]).concat(cost);SY.schoolSet(pool,'acu',p);}
      else{var w=_personal();if(w&&window.SY&&SY.set){w.acus=Math.max(0,(w.acus||0)-cost);SY.set('wallet',w);}}
      try{if(window.SY&&SY.log)SY.log('billing',(label||'AI action')+' — '+cost+' ACU'+(cost>1?'s':''),acuBalance(pool)+' ACUs remaining.');}catch(e){}
      try{window.dispatchEvent(new CustomEvent('sy-acus',{detail:{balance:acuBalance(pool),pool:pool||null}}));}catch(e){}
    }catch(e){}
  }
  /* usage log for the admin console (production reads Firestore aiUsageLogs):
     every live call records provider, model, latency, outcome and a rough GBP
     cost hint (chars→tokens estimate × list price × USD→GBP 0.79). */
  function logUsage(c,model,t0,ok,inChars,outChars){
    try{
      var sess=null;try{sess=JSON.parse(localStorage.getItem('sy-session'))}catch(e){}
      var tokens=Math.round((inChars+outChars)/4);
      var usd=tokens/1e6*2.5;
      var log=[];try{log=JSON.parse(localStorage.getItem('sy-ai-usage'))||[]}catch(e){}
      log.unshift({email:sess&&sess.email||'',name:sess&&sess.name||'',provider:c.provider,model:model,
        ms:Date.now()-t0,ok:ok,gbp:+(usd*0.79).toFixed(4),when:new Date().toISOString()});
      localStorage.setItem('sy-ai-usage',JSON.stringify(log.slice(0,200)));
    }catch(e){}
  }
  async function ask(system, user, opts){
    var c=cfg();if(!c||(!c.key&&c.provider!=='proxy'))throw new Error('No AI key configured');
    /* house style for every tool: natural student-readable text, never raw markup */
    system=String(system||'')+' STYLE RULE: write in plain natural language for a student. NEVER use LaTeX or math markup — no \\( \\), \\frac, ^{ } or $ delimiters. Write maths as readable text symbols: x², 3x² + 12x + 12 = 0, ½, √9, ±, ×, ≤.';
    opts=opts||{};var model=modelFor(c);var maxTokens=opts.maxTokens||1024;
    /* meter FIRST: gate on available ACUs before spending any provider cost.
       No free passes for any role. Charged on success only (see below).
       opts.metered:true means the CALLER debits once for a multi-call action
       (e.g. an exam paper built from several batches) — we still GATE on the
       balance so an empty wallet is blocked, but skip the per-call debit. */
    var acuCost=Math.max(1,opts.acus||1),acuPool=opts.pool||null,acuSelf=!!opts.metered;
    if(!canAfford(acuCost,acuPool))throw new Error('Not enough ACUs — top up to keep using AI.');
    var img=opts.image?splitDataUrl(opts.image):null;
    var t0=Date.now(),inChars=String(system||'').length+String(user||'').length;
    var rawAsk=async function(){
    if(c.provider==='proxy'){
      /* production path: the server-side gateway (/aiProxy) holds the provider
         key; the browser sends only the signed-in user's ID token */
      var cc=null;try{cc=JSON.parse(localStorage.getItem('sy-cloud-config'))}catch(e){}
      if(!cc||!cc.apiBase)throw new Error('Server gateway not configured');
      var email=null;try{email=(JSON.parse(localStorage.getItem('sy-session'))||{}).email}catch(e){}
      if(!window.SYCloud)throw new Error('Cloud bridge unavailable');
      var tk=await SYCloud.token(email);
      if(!tk){
        /* No cloud token on this device/network — the model can't be reached
           without one. For interactive tutors we reconnect inline (same flow as
           linking/sync) then retry the token, so they recover instead of
           dead-ending. Batch generators (exam builder etc.) pass noRecover so
           they fall back to templates INSTANTLY rather than popping a modal. */
        if(!opts.noRecover){ try{ if(window.SY&&SY.ensureCloud){ var done=await SY.ensureCloud(); if(done) tk=await SYCloud.token(email); } }catch(e){} }
        if(!tk)throw new Error('Reconnect to StudYear to use the AI tutor.');
      }
      /* activity lets the SERVER charge the correct ACU tariff (tamper-proof —
         the server ignores any client-sent cost and looks it up by activity,
         defaulting to 1 so nothing is ever free). */
      var body=JSON.stringify({system:system,user:user,maxTokens:maxTokens,
        temperature:opts.temperature!=null?opts.temperature:0.6,image:opts.image||undefined,
        activity:opts.activity||undefined});
      var hdr={'Content-Type':'application/json','Authorization':'Bearer '+tk};
      /* Same-origin proxy when available (studyear.com/gapi/*) so the gateway
         works even where cloudfunctions.net is blocked; if that proxy THROWS at
         request time (dead rewrite), fall back to calling the function directly —
         which works on any network that allows the functions host. */
      var direct=cc.apiBase.replace(/\/$/,'');
      var gp=(window.__SYGAPI&&window.__SYGAPI.fn)?window.__SYGAPI.fn:direct;
      var rp;
      try{ rp=await fetch(gp+'/aiProxy',{method:'POST',headers:hdr,body:body}); }
      catch(e){ if(gp===direct)throw e; rp=await fetch(direct+'/aiProxy',{method:'POST',headers:hdr,body:body}); }
      var jp=await rp.json().catch(function(){return{}});
      /* server-side ACU meter said the wallet can't cover this — surface the same
         clear message as the client pre-check (a forged local balance no longer
         buys real AI). */
      if(rp.status===402||jp.reason==='insufficient_acus')throw new Error('Not enough ACUs — top up to keep using AI.');
      if(!rp.ok||!jp.ok)throw new Error('Gateway '+rp.status+': '+(jp.error||''));
      return jp.text||'';
    }
    if(c.provider==='gemini'){
      var parts=[{text:user}];if(img)parts.push({inlineData:{mimeType:img.mime,data:img.data}});
      var url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(c.key);
      var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        systemInstruction:system?{parts:[{text:system}]}:undefined,
        contents:[{role:'user',parts:parts}],
        generationConfig:{maxOutputTokens:maxTokens,temperature:opts.temperature!=null?opts.temperature:0.6}
      })});
      if(!r.ok)throw new Error('Gemini '+r.status+': '+(await r.text()).slice(0,200));
      var j=await r.json();
      return (((j.candidates||[])[0]||{}).content||{}).parts&&j.candidates[0].content.parts.map(function(p){return p.text||''}).join('')||'';
    }
    if(c.provider==='openai'){
      var attach=img?(img.mime==='application/pdf'
        ?{type:'file',file:{filename:'upload.pdf',file_data:opts.image}}
        :{type:'image_url',image_url:{url:opts.image}}):null;
      var content=img?[{type:'text',text:user},attach]:user;
      var r2=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+c.key},body:JSON.stringify({
        model:model,max_tokens:maxTokens,temperature:opts.temperature!=null?opts.temperature:0.6,
        messages:[system?{role:'system',content:system}:null,{role:'user',content:content}].filter(Boolean)
      })});
      if(!r2.ok)throw new Error('OpenAI '+r2.status+': '+(await r2.text()).slice(0,200));
      var j2=await r2.json();return (((j2.choices||[])[0]||{}).message||{}).content||'';
    }
    if(c.provider==='anthropic'){
      var block3=img?(img.mime==='application/pdf'
        ?{type:'document',source:{type:'base64',media_type:'application/pdf',data:img.data}}
        :{type:'image',source:{type:'base64',media_type:img.mime,data:img.data}}):null;
      var content3=img?[block3,{type:'text',text:user}]:user;
      var r3=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':c.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({
        model:model,max_tokens:maxTokens,system:system||undefined,messages:[{role:'user',content:content3}]
      })});
      if(!r3.ok)throw new Error('Anthropic '+r3.status+': '+(await r3.text()).slice(0,200));
      var j3=await r3.json();return (j3.content||[]).map(function(b){return b.text||''}).join('');
    }
    throw new Error('Unknown provider '+c.provider);
    };
    /* hard ceiling so a stalled gateway / dead network can NEVER hang a feature
       forever — callers (tutor, exam builder, lessons) catch and fall back. */
    var TMO=opts.timeoutMs||90000;
    function withTimeout(pr){ return new Promise(function(res,rej){ var done=false;
      var id=setTimeout(function(){ if(!done){done=true;rej(new Error('AI request timed out'));} },TMO);
      pr.then(function(v){ if(!done){done=true;clearTimeout(id);res(v);} },
              function(e){ if(!done){done=true;clearTimeout(id);rej(e);} }); }); }
    try{
      var out=await withTimeout(rawAsk());
      logUsage(c,model,t0,true,inChars,String(out||'').length);
      if(!acuSelf)chargeAcus(acuCost,acuPool,opts.label||'AI action');   // debit on success only
      return out;
    }catch(e){
      logUsage(c,model,t0,false,inChars,0);
      throw e;
    }
  }
  /* light markdown -> HTML for rendering model output safely */
  /* de-LaTeX: models sometimes emit \( x^2 \) style maths — translate it to
     natural reading text (x², ±, √, ×, fractions) so students never see raw
     markup. Applied before markdown rendering. */
  var SUPS={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','n':'ⁿ','+':'⁺','-':'⁻'};
  function deLatex(s){
    s=String(s||'');
    s=s.replace(/\\\[|\\\]|\\\(|\\\)/g,'');                       // \( \) \[ \]
    s=s.replace(/\$\$([^$]+)\$\$/g,'$1').replace(/\$([^$\n]{1,80})\$/g,'$1');
    s=s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'($1)/($2)');
    s=s.replace(/\\sqrt\{([^{}]+)\}/g,'√($1)').replace(/\\sqrt\s*(\w)/g,'√$1');
    s=s.replace(/\\times/g,'×').replace(/\\div/g,'÷').replace(/\\pm/g,'±').replace(/\\cdot/g,'·')
       .replace(/\\le(?:q)?\b/g,'≤').replace(/\\ge(?:q)?\b/g,'≥').replace(/\\ne(?:q)?\b/g,'≠')
       .replace(/\\approx/g,'≈').replace(/\\infty/g,'∞').replace(/\\pi\b/g,'π').replace(/\\theta\b/g,'θ')
       .replace(/\\alpha\b/g,'α').replace(/\\beta\b/g,'β').replace(/\\Delta\b/g,'Δ').replace(/\\degree|\^\{?\\circ\}?/g,'°')
       .replace(/\\rightarrow|\\to\b/g,'→').replace(/\\%/g,'%');
    s=s.replace(/\\text\{([^{}]*)\}/g,'$1').replace(/\\mathrm\{([^{}]*)\}/g,'$1');
    s=s.replace(/\\left|\\right/g,'');
    s=s.replace(/\^\{([0-9n+\-]{1,3})\}/g,function(_,d){return d.split('').map(function(c){return SUPS[c]||c}).join('')});
    s=s.replace(/\^([0-9n])/g,function(_,d){return SUPS[d]||'^'+d});
    s=s.replace(/_\{([^{}]{1,6})\}/g,'$1').replace(/\\[a-zA-Z]+/g,'');   // leftover commands
    s=s.replace(/[ \t]{2,}/g,' ').replace(/ ([,.:;!?)])/g,'$1').replace(/\( /g,'(');
    return s;
  }
  /* ---- teaching pictures: the model emits a ```diagram fenced JSON block;
     we render it as a real SVG picture. Shared by every tutor surface. ---- */
  function compileExpr(expr){
    var src=String(expr||'').replace(/\^/g,'**');
    if(!/^[0-9x+\-*/(). eE*]*$/.test(src.replace(/sin|cos|tan|sqrt|abs|log|exp|pi/g,'')))return null;
    src=src.replace(/\b(sin|cos|tan|sqrt|abs|log|exp)\b/g,'Math.$1').replace(/\bpi\b/g,'Math.PI');
    try{var f=new Function('x','return ('+src+')');f(1);return f}catch(e){return null}
  }
  function svgWrap(inner,w,h,title){
    return '<div style="margin:8px 0;padding:10px;border:1px solid rgba(120,140,190,.35);border-radius:12px;background:rgba(6,11,24,.5)">'+
      (title?'<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8FA2C4;margin-bottom:6px">'+title+'</div>':'')+
      '<svg viewBox="0 0 '+w+' '+h+'" width="100%" style="max-width:460px;display:block" xmlns="http://www.w3.org/2000/svg">'+inner+'</svg></div>';
  }
  var DIAG_COLS=['#4FA6E0','#F2CE7B','#5CBB7B','#F472B6','#A78BFA','#F97362','#22D3EE'];
  function buildDiagram(spec){
    try{
      var e2=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
      if(spec.kind==='function'){
        var f=compileExpr(spec.expr);if(!f)return null;
        var x0=+spec.xmin||-5,x1=+spec.xmax||5;if(x1<=x0)x1=x0+10;
        var W=460,H=260,pad=28,pts=[],ys=[];
        for(var i=0;i<=120;i++){var x=x0+(x1-x0)*i/120;var y=f(x);if(isFinite(y)){pts.push([x,y]);ys.push(y)}}
        if(!pts.length)return null;
        var ymin=Math.min.apply(null,ys),ymax=Math.max.apply(null,ys);if(ymax===ymin){ymax+=1;ymin-=1}
        var sx=function(x){return pad+(x-x0)/(x1-x0)*(W-2*pad)},sy=function(y){return H-pad-(y-ymin)/(ymax-ymin)*(H-2*pad)};
        var d=pts.map(function(p,i){return (i?'L':'M')+sx(p[0]).toFixed(1)+' '+sy(p[1]).toFixed(1)}).join(' ');
        var ax='';
        if(ymin<0&&ymax>0)ax+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+sy(0)+'" y2="'+sy(0)+'" stroke="#5B6B8C" stroke-width="1"/>';
        if(x0<0&&x1>0)ax+='<line y1="'+pad+'" y2="'+(H-pad)+'" x1="'+sx(0)+'" x2="'+sx(0)+'" stroke="#5B6B8C" stroke-width="1"/>';
        ax+='<text x="'+(W-pad)+'" y="'+(H-8)+'" fill="#8FA2C4" font-size="11" text-anchor="end">x: '+x0+' … '+x1+'</text>';
        return svgWrap(ax+'<path d="'+d+'" fill="none" stroke="#4FA6E0" stroke-width="2.4"/>',W,H,'y = '+e2(spec.expr));
      }
      if(spec.kind==='bar'&&spec.values&&spec.values.length){
        var W=460,H=240,pad=30,vals=spec.values.map(Number),labs=spec.labels||[];
        var max=Math.max.apply(null,vals.concat([1])),bw=(W-2*pad)/vals.length;
        var bars=vals.map(function(v,i){var h=(v/max)*(H-2*pad-16);
          return '<rect x="'+(pad+i*bw+4)+'" y="'+(H-pad-h)+'" width="'+(bw-8)+'" height="'+h+'" rx="4" fill="'+DIAG_COLS[i%DIAG_COLS.length]+'"/>'+
            '<text x="'+(pad+i*bw+bw/2)+'" y="'+(H-pad+14)+'" fill="#AAB6CC" font-size="10.5" text-anchor="middle">'+e2(String(labs[i]||'').slice(0,10))+'</text>'+
            '<text x="'+(pad+i*bw+bw/2)+'" y="'+(H-pad-h-5)+'" fill="#EDF1F8" font-size="10.5" text-anchor="middle">'+v+'</text>';}).join('');
        return svgWrap(bars,W,H,e2(spec.title||'Bar chart'));
      }
      if(spec.kind==='pie'&&spec.values&&spec.values.length){
        var W=460,H=240,cx=120,cy=120,r=90,vals=spec.values.map(Number),labs=spec.labels||[];
        var tot=vals.reduce(function(a,b){return a+b},0)||1,a0=-Math.PI/2,parts='',leg='';
        vals.forEach(function(v,i){var a1=a0+2*Math.PI*v/tot;
          var x0p=cx+r*Math.cos(a0),y0p=cy+r*Math.sin(a0),x1p=cx+r*Math.cos(a1),y1p=cy+r*Math.sin(a1);
          parts+='<path d="M'+cx+' '+cy+' L'+x0p.toFixed(1)+' '+y0p.toFixed(1)+' A'+r+' '+r+' 0 '+(a1-a0>Math.PI?1:0)+' 1 '+x1p.toFixed(1)+' '+y1p.toFixed(1)+' Z" fill="'+DIAG_COLS[i%DIAG_COLS.length]+'"/>';
          leg+='<rect x="250" y="'+(40+i*22)+'" width="12" height="12" rx="3" fill="'+DIAG_COLS[i%DIAG_COLS.length]+'"/><text x="268" y="'+(51+i*22)+'" fill="#EDF1F8" font-size="12">'+e2(String(labs[i]||'').slice(0,18))+' — '+Math.round(100*v/tot)+'%</text>';
          a0=a1;});
        return svgWrap(parts+leg,W,H,e2(spec.title||'Pie chart'));
      }
      if(spec.kind==='line'&&spec.points&&spec.points.length>1){
        var W=460,H=240,pad=30,px=spec.points.map(function(p){return +p[0]}),py=spec.points.map(function(p){return +p[1]});
        var x0=Math.min.apply(null,px),x1=Math.max.apply(null,px),y0=Math.min.apply(null,py),y1=Math.max.apply(null,py);
        if(x1===x0)x1++;if(y1===y0)y1++;
        var sx=function(x){return pad+(x-x0)/(x1-x0)*(W-2*pad)},sy=function(y){return H-pad-(y-y0)/(y1-y0)*(H-2*pad)};
        var d=spec.points.map(function(p,i){return (i?'L':'M')+sx(+p[0]).toFixed(1)+' '+sy(+p[1]).toFixed(1)}).join(' ');
        var dots=spec.points.map(function(p){return '<circle cx="'+sx(+p[0]).toFixed(1)+'" cy="'+sy(+p[1]).toFixed(1)+'" r="3" fill="#F2CE7B"/>'}).join('');
        return svgWrap('<path d="'+d+'" fill="none" stroke="#4FA6E0" stroke-width="2.2"/>'+dots,W,H,e2(spec.title||'Line graph'));
      }
      /* LABELLED diagram — a real study diagram for anatomy, apparatus, cells,
         structures: a central subject with labelled callout parts around it. */
      if(spec.kind==='labelled'&&spec.parts&&spec.parts.length){
        var parts=spec.parts.slice(0,10),W=470,H=Math.max(220,70+parts.length*40);
        var cx=W/2,cyTop=64;
        var subject='<rect x="'+(cx-90)+'" y="30" width="180" height="34" rx="10" fill="rgba(79,166,224,.18)" stroke="#4FA6E0"/>'+
          '<text x="'+cx+'" y="52" text-anchor="middle" fill="#EDF1F8" font-size="13" font-weight="600">'+e2((spec.title||'Diagram').slice(0,34))+'</text>';
        var rowsSvg=parts.map(function(p,i){
          var y=90+i*40,col=DIAG_COLS[i%DIAG_COLS.length];
          var name=e2(String(p.name||p.label||('Part '+(i+1))).slice(0,34));
          var role=e2(String(p.role||p.desc||p.function||'').slice(0,58));
          return '<line x1="'+cx+'" y1="64" x2="40" y2="'+(y+9)+'" stroke="rgba(120,140,190,.35)" stroke-width="1"/>'+
            '<circle cx="40" cy="'+(y+9)+'" r="5" fill="'+col+'"/>'+
            '<text x="54" y="'+(y+6)+'" fill="'+col+'" font-size="12.5" font-weight="600">'+name+'</text>'+
            (role?'<text x="54" y="'+(y+21)+'" fill="#AAB6CC" font-size="11">'+role+'</text>':'');
        }).join('');
        return svgWrap(subject+rowsSvg,W,H,e2(spec.caption||'Labelled diagram'));
      }
      /* FLOW / CYCLE — a process as connected steps (respiration, water cycle,
         reaction pathway, historical sequence). */
      if((spec.kind==='flow'||spec.kind==='cycle')&&spec.steps&&spec.steps.length){
        var steps=spec.steps.slice(0,7),W=470,bw=W-60,bh=42,gap=20,H=30+steps.length*(bh+gap);
        var boxes=steps.map(function(st,i){
          var y=20+i*(bh+gap),col=DIAG_COLS[i%DIAG_COLS.length],label=e2(String(st.text||st.name||st).slice(0,60));
          var arrow=i<steps.length-1?'<path d="M'+(W/2)+' '+(y+bh)+' l0 '+(gap-6)+'" stroke="#5B6B8C" stroke-width="1.5" marker-end="url(#ar)"/>':'';
          return '<rect x="30" y="'+y+'" width="'+bw+'" height="'+bh+'" rx="10" fill="rgba(30,22,70,.6)" stroke="'+col+'"/>'+
            '<text x="'+(W/2)+'" y="'+(y+26)+'" text-anchor="middle" fill="#EDF1F8" font-size="12.5">'+(i+1)+'. '+label+'</text>'+arrow;
        }).join('');
        var defs='<defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#5B6B8C"/></marker></defs>';
        return svgWrap(defs+boxes,W,H,e2(spec.title||(spec.kind==='cycle'?'Cycle':'Process')));
      }
    }catch(e){}
    return null;
  }
  /* the hint tutor surfaces append to their prompts so the model knows it CAN draw */
  var DIAGRAM_HINT=' DIAGRAMS — you CAN draw real pictures for the student, so NEVER say you cannot provide a diagram. Choose the right kind for the content and emit ONE fenced ```diagram block with JSON built from THIS question (never copy an example):\n• Anatomy, cells, apparatus, structures (heart, respiratory system, plant cell, circuit) → {"kind":"labelled","title":"<subject>","parts":[{"name":"Trachea","role":"carries air to the lungs"},…]}\n• A process or sequence (breathing, water cycle, a reaction, historical events) → {"kind":"flow","title":"…","steps":[{"text":"Diaphragm contracts"},…]} (use "cycle" if it repeats)\n• A maths function → {"kind":"function","expr":"x^2 - 4","xmin":-5,"xmax":5}\n• Numeric data → {"kind":"bar"|"pie","title":"…","labels":[…],"values":[…]} or {"kind":"line","points":[[x,y],…]}\nNEVER emit a function/graph for non-numeric topics. Put the block on its own lines; the app renders it as a real labelled picture, then continue your explanation.';
  function render(md){
    var esc=function(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})};
    /* extract ```diagram blocks first and swap in rendered SVG afterwards */
    var diagrams=[];
    var src=String(md||'').replace(/```(?:diagram)?\s*\n(\{[\s\S]*?\})\s*\n```/g,function(_,json){
      try{var svg=buildDiagram(JSON.parse(json));if(svg){diagrams.push(svg);return '\n@@SYDIAG'+(diagrams.length-1)+'@@\n'}}catch(e){}
      return '';
    });
    var lines=deLatex(src).split('\n');var out=[],inList=false;
    lines.forEach(function(l){
      var t=esc(l);
      t=t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*(?!\*)(.+?)\*/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>');
      if(/^\s*[-*]\s+/.test(l)){if(!inList){out.push('<ul style="margin:6px 0 6px 18px">');inList=true}out.push('<li>'+t.replace(/^\s*[-*]\s+/,'')+'</li>');return}
      if(/^\s*\d+\.\s+/.test(l)){if(!inList){out.push('<ul style="margin:6px 0 6px 18px">');inList=true}out.push('<li>'+t.replace(/^\s*\d+\.\s+/,'')+'</li>');return}
      if(inList){out.push('</ul>');inList=false}
      if(/^\s*#{1,6}\s+/.test(l))out.push('<b style="display:block;margin:8px 0 2px">'+t.replace(/^\s*#{1,6}\s+/,'')+'</b>');
      else if(t.trim())out.push('<p style="margin:6px 0">'+t+'</p>');
    });
    if(inList)out.push('</ul>');
    var html=out.join('');
    diagrams.forEach(function(svg,i){html=html.replace(new RegExp('<p[^>]*>@@SYDIAG'+i+'@@</p>|@@SYDIAG'+i+'@@'),svg)});
    return html;
  }
  window.SYAI={ready:ready,provider:provider,config:cfg,ask:ask,render:render,diagramHint:DIAGRAM_HINT,
    canAfford:canAfford,balance:acuBalance,charge:chargeAcus,
    /* label for the "insufficient ACUs" case so callers can show a top-up hint */
    NO_ACUS:'Not enough ACUs — top up to keep using AI.',
    setConfig:function(o){try{localStorage.setItem('sy-ai-live',JSON.stringify(o))}catch(e){}},
    clear:function(){localStorage.removeItem('sy-ai-live')}};
})();
