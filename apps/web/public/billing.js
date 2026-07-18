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
  function ready(){if(isDemo())return false;var c=cfg();return !!(c&&c.links&&Object.keys(c.links).length)}
  function linkFor(id){if(isDemo())return null;var c=cfg();return (c&&c.links&&c.links[id])||null}
  /* checkout(planId, {promo, email, ref, activate}) → 'redirect' | 'preview'
     client_reference_id carries "<planId>__<ref>" so the Stripe webhook knows
     BOTH what was bought (planId → ACUs) and who bought it (ref = email or
     school code), with no server-side price→plan table to keep in sync. */
  function checkout(planId, opts){
    opts=opts||{};var url=linkFor(planId);
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
    if(typeof opts.activate==='function')opts.activate();
    return 'preview';
  }
  window.SYBill={ready:ready,cfg:cfg,linkFor:linkFor,checkout:checkout,
    setConfig:function(o){try{localStorage.setItem('sy-billing-live',JSON.stringify(o))}catch(e){}},
    clear:function(){localStorage.removeItem('sy-billing-live')}};
})();
