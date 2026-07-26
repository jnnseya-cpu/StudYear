/* StudYear billing seam — real subscriptions without a server.
   When the admin configures Stripe Payment Links (hosted checkout URLs) in the AI
   Gateway, SYBill.checkout redirects the buyer to real Stripe checkout with their
   promo code prefilled. Otherwise it runs the page's preview activation so plans
   still unlock for testing. This is the same swap-in point a Firebase/Vercel
   server (Checkout Sessions / webhooks) plugs behind later — callers unchanged.
   Config is a device-global `sy-billing-live` = { links: { <planId>: <url> } }. */
(function(){
  'use strict';
  /* Payment links must reach EVERY customer's device, not just the admin's
     browser. We fetch a committed, PUBLIC billing-config.json from the site root
     (Stripe Payment Link URLs are public checkout URLs — safe to commit, exactly
     like firebase-config.json). Precedence: an explicit admin-gateway override in
     localStorage wins; otherwise the shipped config file. With an empty links map
     (the default) behaviour is unchanged — checkout runs the page's preview
     activation until the owner populates the file. */
  var BASE=(function(){try{var s=(document.currentScript&&document.currentScript.src)||'';return s?s.replace(/billing\.js.*$/,''):'';}catch(e){return '';}})();
  var FILE_CFG=null;
  try{ fetch(BASE+'billing-config.json',{cache:'no-cache'})
    .then(function(r){return r.ok?r.json():null;})
    .then(function(j){ if(j&&j.links&&Object.keys(j.links).length)FILE_CFG={links:j.links}; })
    .catch(function(){}); }catch(e){}
  function cfg(){
    try{var ls=JSON.parse(localStorage.getItem('sy-billing-live'));if(ls&&ls.links&&Object.keys(ls.links).length)return ls;}catch(e){}
    return FILE_CFG;
  }
  /* demo sessions never reach Stripe — checkout always runs the preview
     activation so presentations spend nothing */
  function isDemo(){try{var s=JSON.parse(localStorage.getItem('sy-session'));return !!(s&&s.demo)}catch(e){return false}}
  /* "ready" = real charging is possible: server-created Checkout Sessions or
     pre-made Payment Links. Demo is never ready. cloud.js is injected deferred so
     SYCloud may not exist yet at first render — treat any real signed-in session
     as ready (server checkout is attempted at click-time, and falls back to an
     honest "unavailable" message rather than a free plan if the server can't). */
  function ready(){
    if(isDemo())return false;
    var c=cfg();if(c&&c.links&&Object.keys(c.links).length)return true;
    if(window.SYCloud&&typeof SYCloud.checkoutSession==='function')return true;
    try{var s=JSON.parse(localStorage.getItem('sy-session'));if(s&&s.email&&!s.demo)return true;}catch(e){}
    return false;
  }
  function linkFor(id){if(isDemo())return null;var c=cfg();return (c&&c.links&&c.links[id])||null}
  function toast(m){try{if(window.SY&&SY.toast)return SY.toast(m);}catch(e){} }
  /* legacy path: a pre-made Payment Link if configured, else preview activation
     (demo accounts only — a real account must NEVER silently free-activate). */
  function legacyCheckout(planId,opts){
    var url=linkFor(planId);
    if(url){
      try{
        var u=new URL(url);
        if(opts.promo)u.searchParams.set('prefilled_promo_code',String(opts.promo));
        if(opts.email)u.searchParams.set('prefilled_email',String(opts.email));
        var ref=opts.ref!=null?String(opts.ref):(opts.email?String(opts.email):'');
        u.searchParams.set('client_reference_id',String(planId)+'__'+ref);
        location.href=u.toString();
      }catch(e){location.href=url}
      return 'redirect';
    }
    if(isDemo()){ if(typeof opts.activate==='function')opts.activate(); return 'preview'; }
    /* real account, no way to charge right now → honest message, no free plan */
    toast('Checkout is temporarily unavailable — please try again in a moment.');
    return 'unavailable';
  }
  /* Payment gate: only an 18+ cardholder may pay (children use the free tier and
     never transact), and — for digital content supplied immediately — UK distance-
     selling law needs the buyer's explicit consent to start now and waive the
     14-day cooling-off. One required confirmation per purchase. Resolves true only
     when both boxes are ticked. Demo/preview never reaches this. */
  function payerGate(){
    return new Promise(function(resolve){
      var ov=document.createElement('div');
      ov.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(4,10,22,.72);display:flex;align-items:center;justify-content:center;padding:18px';
      ov.innerHTML='<div role="dialog" aria-modal="true" aria-label="Confirm before payment" style="max-width:460px;background:#0f1830;color:#e8eef8;border:1px solid #2a3a56;border-radius:16px;padding:22px;font:14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
        '<h3 style="margin:0 0 6px;font-size:18px;font-weight:700">Confirm before payment</h3>'+
        '<p style="margin:0 0 12px;color:#aab6cc">Payment must be made by an adult. A child’s plan can be purchased for them, but only by an 18+ cardholder.</p>'+
        '<label style="display:flex;gap:9px;align-items:flex-start;cursor:pointer;margin:10px 0"><input type="checkbox" id="pg-age" style="margin-top:3px;accent-color:#4FA6E0"><span>I am <b>18 or over</b> and the cardholder making this payment.</span></label>'+
        '<label style="display:flex;gap:9px;align-items:flex-start;cursor:pointer;margin:10px 0"><input type="checkbox" id="pg-now" style="margin-top:3px;accent-color:#4FA6E0"><span>I want my credits/access to start <b>immediately</b> and understand my 14-day right to cancel is lost once I begin using them. See <a href="../terms/" target="_blank" rel="noopener" style="color:#8FC2EC">Terms &amp; refunds</a>.</span></label>'+
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button id="pg-cancel" style="cursor:pointer;background:transparent;color:#e8eef8;border:1px solid #3a4a66;border-radius:9px;padding:9px 14px;font-weight:600">Cancel</button><button id="pg-go" disabled style="background:#4FA6E0;color:#04101f;border:0;border-radius:9px;padding:9px 16px;font-weight:700;opacity:.5;cursor:not-allowed">Continue to payment</button></div>'+
        '</div>';
      document.body.appendChild(ov);
      var age=ov.querySelector('#pg-age'),now=ov.querySelector('#pg-now'),go=ov.querySelector('#pg-go');
      function upd(){var ok=age.checked&&now.checked;go.disabled=!ok;go.style.opacity=ok?'1':'.5';go.style.cursor=ok?'pointer':'not-allowed';}
      age.addEventListener('change',upd);now.addEventListener('change',upd);
      function done(v){try{document.body.removeChild(ov);}catch(e){}resolve(v);}
      ov.querySelector('#pg-cancel').onclick=function(){done(false);};
      go.onclick=function(){if(age.checked&&now.checked)done(true);};
      ov.addEventListener('click',function(e){if(e.target===ov)done(false);});
    });
  }
  /* the real charge path, run only after the payer gate passes */
  function proceed(planId, opts){
    var ref=opts.ref!=null?String(opts.ref):(opts.email?String(opts.email):'');
    if(!isDemo() && window.SYCloud && typeof SYCloud.checkoutSession==='function'){
      var back=location.origin+location.pathname;
      var succ=back+(back.indexOf('?')>=0?'&':'?')+'sybuy='+encodeURIComponent(planId);
      try{
        toast('Opening secure checkout…');
        SYCloud.checkoutSession(planId, ref, {successUrl:succ, cancelUrl:back, promo:opts.promo}, opts.email)
          .then(function(r){ if(r&&r.url){location.href=r.url;} else {legacyCheckout(planId,opts);} })
          .catch(function(){ legacyCheckout(planId,opts); });
        return;
      }catch(e){/* fall through to legacy */}
    }
    legacyCheckout(planId,opts);
  }
  /* checkout(planId, {promo, email, ref, activate}) → 'redirect' | 'preview' | 'unavailable'
     PREFERRED path: ask the server to create a Stripe Checkout Session on demand
     (price + planId set server-side, tamper-proof) and redirect to it. Real charges
     first pass the 18+ cardholder / immediate-supply consent gate. The webhook
     credits ACUs on payment. */
  function checkout(planId, opts){
    opts=opts||{};
    /* demo/preview never charges → no gate, keep presentations frictionless */
    if(isDemo())return legacyCheckout(planId,opts);
    payerGate().then(function(ok){ if(ok)proceed(planId,opts); else toast('Payment cancelled.'); });
    return 'redirect';
  }
  /* On returning from a successful Stripe checkout the URL carries ?paid=1&sybuy=<planId>.
     consumeReturn() returns that planId once (then strips the params so a refresh
     can't re-credit) so the page can reflect the purchase in the wallet. Returns
     null if this isn't a paid return. */
  function consumeReturn(){
    try{
      var q=new URLSearchParams(location.search);
      if(q.get('paid')!=='1')return null;
      var id=q.get('sybuy')||'';
      try{history.replaceState(null,'',location.pathname+location.hash);}catch(e){}
      return id||'';
    }catch(e){return null;}
  }
  window.SYBill={ready:ready,cfg:cfg,linkFor:linkFor,checkout:checkout,consumeReturn:consumeReturn,
    setConfig:function(o){try{localStorage.setItem('sy-billing-live',JSON.stringify(o))}catch(e){}},
    clear:function(){localStorage.removeItem('sy-billing-live')}};
})();
