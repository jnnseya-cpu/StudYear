/* StudYear cookie-consent gate (PECR reg.6 / UK GDPR).
   Non-essential trackers (Meta Pixel, Google Tag Manager) load ONLY after the
   visitor opts in. Default is NO tracking. Choice is remembered in localStorage
   (sy-consent = 'granted' | 'denied'). Trackers never load on a signed-in or
   child-facing area regardless of choice (marketing pages only). This preserves
   the marketing tags the owner added — it just makes them consent-gated. */
(function () {
  'use strict';
  var PIXEL = '3470955229736707';
  var GTM = 'GTM-5GNC8F6G';
  function get() { try { return localStorage.getItem('sy-consent'); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem('sy-consent', v); } catch (e) {} }
  /* never track a signed-in session or any child-facing surface */
  function blocked() {
    try { if (JSON.parse(localStorage.getItem('sy-session'))) return true; } catch (e) {}
    return /\/(study|app|account|parent|teacher|school|tutor|authority|admin|myschool)(\/|$)/.test(location.pathname);
  }
  function loadTrackers() {
    if (window.__syTrackersLoaded) return; window.__syTrackersLoaded = true;
    /* Meta Pixel */
    try {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', PIXEL); window.fbq('track', 'PageView');
    } catch (e) {}
    /* Google Tag Manager */
    try {
      (function (w, d, s, l, i) { w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' }); var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f); })(window, document, 'script', 'dataLayer', GTM);
    } catch (e) {}
  }
  function removeBanner() { var b = document.getElementById('sy-consent-bar'); if (b && b.parentNode) b.parentNode.removeChild(b); }
  function banner() {
    if (document.getElementById('sy-consent-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'sy-consent-bar';
    bar.setAttribute('role', 'dialog'); bar.setAttribute('aria-label', 'Cookie consent');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;max-width:760px;margin:0 auto;background:#0f1830;color:#e8eef8;border:1px solid #2a3a56;border-radius:14px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.45);font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    bar.innerHTML = '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">' +
      '<div style="flex:1;min-width:240px">We use only essential cookies to run StudYear. With your consent we’d also use analytics/marketing cookies to improve the site. See our <a href="' + rel('cookies/') + '" style="color:#8FC2EC">Cookie Policy</a>.</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button id="sy-consent-no" style="cursor:pointer;background:transparent;color:#e8eef8;border:1px solid #3a4a66;border-radius:9px;padding:9px 14px;font-weight:600">Essential only</button>' +
      '<button id="sy-consent-yes" style="cursor:pointer;background:#4FA6E0;color:#04101f;border:0;border-radius:9px;padding:9px 14px;font-weight:700">Accept all</button>' +
      '</div></div>';
    document.body.appendChild(bar);
    document.getElementById('sy-consent-yes').onclick = function () { set('granted'); removeBanner(); loadTrackers(); };
    document.getElementById('sy-consent-no').onclick = function () { set('denied'); removeBanner(); };
  }
  /* resolve a root-relative path that works on both / (Vercel) and /StudYear/ (Pages) */
  function rel(p) {
    var m = location.pathname.match(/^(.*\/)(?:[^\/]*)$/);
    var dir = m ? m[1] : '/';
    // climb to site root by counting depth below a known base
    var base = /\/StudYear\//.test(location.pathname) ? '/StudYear/' : '/';
    return base + p;
  }
  function start() {
    if (blocked()) return;                 // never track child/signed-in areas
    var c = get();
    if (c === 'granted') { loadTrackers(); return; }
    if (c === 'denied') return;
    banner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
