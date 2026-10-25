/* PWA bootstrap for public (non-guarded) pages: derive the site base from the
   manifest link, add iOS home-screen meta + apple-touch-icon, and register the
   offline/install service worker. Works at / and at /StudYear/. */
(function(){
  var m=document.querySelector('link[rel=manifest]');
  var base=m?m.getAttribute('href').replace(/manifest\.json$/,''):'./';
  function meta(n,c){if(!document.querySelector('meta[name="'+n+'"]')){var x=document.createElement('meta');x.name=n;x.content=c;document.head.appendChild(x);}}
  meta('apple-mobile-web-app-capable','yes');
  meta('mobile-web-app-capable','yes');
  meta('apple-mobile-web-app-title','StudYear');
  meta('apple-mobile-web-app-status-bar-style','black-translucent');
  if(!document.querySelector('link[rel="apple-touch-icon"]')){var l=document.createElement('link');l.rel='apple-touch-icon';l.href=base+'apple-touch-icon.png';document.head.appendChild(l);}
  if('serviceWorker' in navigator){
    /* Register, then ACTIVELY check for a new service worker on load, whenever
       the app regains focus, and hourly — an installed PWA otherwise sits on a
       stale worker for up to a day and never shows a deploy. When a new worker
       takes control, reload ONCE so the page runs the new code (never on first
       install, never in a loop). This is what makes website/admin updates
       actually reach an installed PWA. */
    var hadController=!!navigator.serviceWorker.controller, reloaded=false;
    navigator.serviceWorker.register(base+'sw.js',{scope:base}).then(function(reg){
      try{reg.update();}catch(e){}
      document.addEventListener('visibilitychange',function(){
        if(document.visibilityState==='visible'){try{reg.update();}catch(e){}}});
      setInterval(function(){try{reg.update();}catch(e){}},30*60*1000);
    }).catch(function(){});
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(reloaded||!hadController)return; // first-ever install → no reload
      reloaded=true; try{location.reload();}catch(e){}
    });
  }
  /* premium webfonts (Fraunces + Inter), loaded NON-BLOCKING: preconnect + a
     print-media stylesheet flipped to all on load, so a slow or firewalled fonts
     host never delays first paint — pub.css falls back to Georgia/Inter-system
     until the real faces arrive. (Replaces a render-blocking @import in the CSS.) */
  try{
    if(!document.getElementById('sy-fonts')){
      var pc1=document.createElement('link');pc1.rel='preconnect';pc1.href='https://fonts.googleapis.com';
      var pc2=document.createElement('link');pc2.rel='preconnect';pc2.href='https://fonts.gstatic.com';pc2.crossOrigin='';
      var ff=document.createElement('link');ff.id='sy-fonts';ff.rel='stylesheet';
      ff.href='https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;450;500;600;700&display=swap';
      ff.media='print';ff.onload=function(){this.media='all'};
      document.head.appendChild(pc1);document.head.appendChild(pc2);document.head.appendChild(ff);
    }
  }catch(e){}
  /* consent-gated analytics/marketing (Meta Pixel + GTM). consent.js decides per
     page whether tracking is allowed; loading it here gives every public page the
     tag + event API without editing each file. */
  if(!window.__syConsentInit && !document.querySelector('script[src$="consent.js"]')){var cs=document.createElement('script');cs.src=base+'consent.js';cs.defer=true;document.head.appendChild(cs);}
})();
