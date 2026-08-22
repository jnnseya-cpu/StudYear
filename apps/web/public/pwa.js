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
  if('serviceWorker' in navigator){navigator.serviceWorker.register(base+'sw.js',{scope:base}).catch(function(){});}
  /* consent-gated analytics/marketing (Meta Pixel + GTM). consent.js decides per
     page whether tracking is allowed; loading it here gives every public page the
     tag + event API without editing each file. */
  if(!window.__syConsentInit && !document.querySelector('script[src$="consent.js"]')){var cs=document.createElement('script');cs.src=base+'consent.js';cs.defer=true;document.head.appendChild(cs);}
})();
