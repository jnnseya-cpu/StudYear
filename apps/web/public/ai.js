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
  function cfg(){try{return JSON.parse(localStorage.getItem('sy-ai-live'))||null}catch(e){return null}}
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
  async function ask(system, user, opts){
    var c=cfg();if(!c||!c.key)throw new Error('No AI key configured');
    opts=opts||{};var model=modelFor(c);var maxTokens=opts.maxTokens||1024;
    var img=opts.image?splitDataUrl(opts.image):null;
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
  }
  /* light markdown -> HTML for rendering model output safely */
  function render(md){
    var esc=function(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})};
    var lines=String(md||'').split('\n');var out=[],inList=false;
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
    return out.join('');
  }
  window.SYAI={ready:ready,provider:provider,config:cfg,ask:ask,render:render,
    setConfig:function(o){try{localStorage.setItem('sy-ai-live',JSON.stringify(o))}catch(e){}},
    clear:function(){localStorage.removeItem('sy-ai-live')}};
})();
