/**
 * StudYear PWA splash screen (window.__SY_SPLASH)
 * ---------------------------------------------------------------------------
 * A branded launch screen shown ONLY when StudYear is opened as an installed
 * PWA (display-mode standalone / minimal-ui, or iOS navigator.standalone) — so
 * normal browser tabs and first-time visitors never see it. It paints instantly
 * over the app's dark background (matching the manifest's #060B18), then fades
 * out and removes itself once the page is ready.
 *
 * Android/Chromium already draw a native splash from the manifest; this fills
 * the iOS gap (Safari shows a blank launch otherwise) and gives every surface a
 * consistent branded start. Self-contained, dependency-free, idempotent — safe
 * to include on any page (it no-ops outside standalone mode). Loaded on every
 * console via guard.js, and directly on the start_url (/app/) and landing page.
 */
(function () {
  'use strict';
  if (window.__SY_SPLASH) return;
  window.__SY_SPLASH = true;

  var BASE = (function () {
    try { var s = (document.currentScript && document.currentScript.src) || ''; return s ? s.replace(/splash\.js.*$/, '') : ''; }
    catch (e) { return ''; }
  })();

  /* Only in an installed app — never over the browser or a normal visit. */
  function isStandalone() {
    try {
      return (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches || matchMedia('(display-mode: fullscreen)').matches)) ||
        window.navigator.standalone === true;
    } catch (e) { return false; }
  }

  /* Make iOS treat this as an app: solid status bar over the theme colour, app
     title, no Safari chrome. Injected if a page hasn't already declared them. */
  function ensureIOSMeta() {
    try {
      var metas = [
        ['apple-mobile-web-app-capable', 'yes'],
        ['mobile-web-app-capable', 'yes'],
        ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
        ['apple-mobile-web-app-title', 'StudYear']
      ];
      metas.forEach(function (m) {
        if (document.querySelector('meta[name="' + m[0] + '"]')) return;
        var el = document.createElement('meta'); el.name = m[0]; el.content = m[1];
        (document.head || document.documentElement).appendChild(el);
      });
      if (BASE && !document.querySelector('link[rel="apple-touch-icon"]')) {
        var l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = BASE + 'apple-touch-icon.png';
        (document.head || document.documentElement).appendChild(l);
      }
    } catch (e) {}
  }

  ensureIOSMeta();
  if (!isStandalone()) return; // browsing normally — no splash

  var reduce = false;
  try { reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function build() {
    if (document.getElementById('sy-splash')) return;
    var ov = document.createElement('div');
    ov.id = 'sy-splash';
    ov.setAttribute('role', 'status');
    ov.setAttribute('aria-label', 'Loading StudYear');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#060B18;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;opacity:1;transition:opacity .35s ease;-webkit-tap-highlight-color:transparent';
    var icon = BASE ? '<img src="' + BASE + 'icon-192.png" alt="" width="96" height="96" style="width:96px;height:96px;border-radius:22px;box-shadow:0 10px 40px rgba(0,0,0,.5)">' : '';
    var spinner = reduce ? '' : '<div id="sy-splash-spin" style="width:26px;height:26px;border:3px solid rgba(255,255,255,.16);border-top-color:#4FA6E0;border-radius:50%;margin-top:6px"></div>';
    ov.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:14px">' + icon +
      '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:26px;letter-spacing:.3px;color:#EAF1FF;font-weight:600">Stud<span style="color:#4FA6E0">Year</span></div>' +
      '<div style="font-size:13px;color:#7C8AA6;letter-spacing:.02em">Your AI study companion</div>' + spinner + '</div>';
    (document.body || document.documentElement).appendChild(ov);
    if (!reduce && !document.getElementById('sy-splash-style')) {
      var st = document.createElement('style'); st.id = 'sy-splash-style';
      st.textContent = '@keyframes sy-splash-spin{to{transform:rotate(360deg)}}#sy-splash-spin{animation:sy-splash-spin .8s linear infinite}';
      (document.head || document.documentElement).appendChild(st);
    }
  }

  function dismiss() {
    var ov = document.getElementById('sy-splash'); if (!ov) return;
    ov.style.opacity = '0';
    var done = false;
    function rm() { if (done) return; done = true; try { ov.parentNode && ov.parentNode.removeChild(ov); } catch (e) {} }
    ov.addEventListener('transitionend', rm);
    setTimeout(rm, 500); // fallback if transitionend doesn't fire
  }

  // Paint as early as possible; if body isn't ready yet, wait for it.
  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);

  // Keep it up for a readable minimum, then leave when the page is loaded —
  // capped so a slow resource never traps the user behind the splash.
  var shownAt = Date.now();
  var MIN = 500, MAX = 2600;
  function leave() {
    var wait = Math.max(0, MIN - (Date.now() - shownAt));
    setTimeout(dismiss, wait);
  }
  if (document.readyState === 'complete') leave();
  else window.addEventListener('load', leave);
  setTimeout(dismiss, MAX); // hard cap

  window.SYSplash = { dismiss: dismiss };
})();
