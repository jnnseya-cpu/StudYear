/* StudYear cookie-consent gate + unified event tracking (PECR reg.6 / UK GDPR).
   Non-essential trackers (Meta Pixel, Google Tag Manager) load ONLY after the
   visitor opts in. Default is NO tracking. Choice is remembered in localStorage
   (sy-consent = 'granted' | 'denied').

   SCOPE (owner decision, 2026-08-22): tracking runs on public/marketing pages
   AND on the account/billing + auth surfaces (so signup and purchase conversions
   can be measured for ad ROAS). It is HARD-BLOCKED on the student learning areas
   and every child-facing console (study, app, parent, teacher, school, tutor,
   authority, admin, myschool) — children's activity never leaves to Meta/Google.

   Event API: window.SYTrack.event(name, params) fires to BOTH Meta Pixel and the
   GTM dataLayer, once, after consent. Events raised before the trackers finish
   loading are queued and flushed on load; on blocked pages they are dropped and
   nothing is transmitted. Standard Meta event names are sent via fbq('track'),
   anything else via fbq('trackCustom'). */
(function () {
  'use strict';
  if (window.__syConsentInit) return;            // idempotent: pages may include + inject it
  window.__syConsentInit = 1;

  var PIXEL = '3470955229736707';
  var GTM = 'GTM-5GNC8F6G';

  function get() { try { return localStorage.getItem('sy-consent'); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem('sy-consent', v); } catch (e) {} }

  /* HARD block: student learning areas + every child-facing console. Note the
     word-boundary — /tutor/ (the tutor console) is blocked but /tutors/ (the
     public tutor-finder) is not; /account/ and /auth/ are intentionally allowed
     so purchase + registration conversions can fire. */
  function blocked() {
    // never track a signed-in STUDENT (a child) on ANY surface, including the
    // account/auth pages a minor can reach — UK Children's Code data-minimisation.
    try { var s = JSON.parse(localStorage.getItem('sy-session')); if (s && s.role === 'student') return true; } catch (e) {}
    return /\/(study|app|parent|teacher|school|tutor|authority|admin|myschool)(\/|$)/.test(location.pathname);
  }
  var allowed = !blocked();

  /* ---- unified event dispatch (Meta Pixel + GTM dataLayer) ---- */
  var META_STD = { PageView: 1, ViewContent: 1, Lead: 1, CompleteRegistration: 1, Purchase: 1,
    InitiateCheckout: 1, AddToCart: 1, Search: 1, Contact: 1, Subscribe: 1, StartTrial: 1, Schedule: 1 };
  var queue = [];
  function dispatch(name, params) {
    params = params || {};
    try { (window.dataLayer = window.dataLayer || []).push(assign({ event: name }, params)); } catch (e) {}
    try { if (window.fbq) { if (META_STD[name]) window.fbq('track', name, params); else window.fbq('trackCustom', name, params); } } catch (e) {}
  }
  function emit(name, params) {
    if (!allowed || !name) return;               // never queue or send on blocked pages
    if (!window.__syTrackersLoaded) { if (queue.length < 100) queue.push([name, params]); return; }
    dispatch(name, params);
  }
  function assign(a, b) { if (b) for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k]; return a; }
  /* public API — defined on every page so callers in any surface are safe to call
     (they simply no-op where tracking is blocked or consent is withheld) */
  window.SYTrack = {
    event: emit,
    view: function (params) { emit('ViewContent', params || {}); },
    lead: function (params) { emit('Lead', params || {}); },
    signup: function (params) { emit('CompleteRegistration', params || {}); },
    login: function (params) { emit('Login', params || {}); },
    checkoutStart: function (params) { emit('InitiateCheckout', params || {}); },
    purchase: function (value, currency, params) { emit('Purchase', assign({ value: value, currency: currency || 'GBP' }, params || {})); }
  };

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
    /* flush anything raised before load, then the automatic content event */
    var pending = queue.splice(0, queue.length);
    for (var k = 0; k < pending.length; k++) dispatch(pending[k][0], pending[k][1]);
    autoView();
    bindDeclarative();
  }

  /* content pages get a ViewContent (stronger signal than a bare PageView) */
  function autoView() {
    try {
      var p = location.pathname;
      if (/\/blog\/[^/]+\/(index\.html)?$/.test(p) && !/\/blog\/(index\.html)?$/.test(p)) dispatch('ViewContent', { content_type: 'article', content_name: document.title });
      else if (/\/free\//.test(p)) dispatch('ViewContent', { content_type: 'free_tool', content_name: document.title });
    } catch (e) {}
  }

  /* declarative tracking: any element with data-sy-track="EventName" fires on
     click; data-sy-value / data-sy-currency ride along. Lets CTAs across the site
     be tagged in HTML with no extra JS. */
  function bindDeclarative() {
    if (window.__syDeclBound) return; window.__syDeclBound = 1;
    document.addEventListener('click', function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest('[data-sy-track]') : null;
      if (!el) return;
      var name = el.getAttribute('data-sy-track'); if (!name) return;
      var params = {};
      var v = el.getAttribute('data-sy-value'); if (v) params.value = parseFloat(v) || v;
      var c = el.getAttribute('data-sy-currency'); if (c) params.currency = c;
      var lbl = el.getAttribute('data-sy-label') || (el.textContent || '').trim().slice(0, 80); if (lbl) params.label = lbl;
      emit(name, params);
    }, true);
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
    var base = /\/StudYear\//.test(location.pathname) ? '/StudYear/' : '/';
    return base + p;
  }
  function start() {
    if (!allowed) return;                  // never track child/learning areas
    var c = get();
    if (c === 'granted') { loadTrackers(); return; }
    if (c === 'denied') return;
    banner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
