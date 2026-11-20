/**
 * StudYear Sentinel — anti-hacking / human-only security agent (window.SYSentinel)
 * ------------------------------------------------------------------------------
 * Loaded by guard.js on EVERY page, so every section and every part of the OS is
 * covered. It does three jobs:
 *   1. HUMAN-ONLY  — verifies a real human is present (genuine, trusted input;
 *      no automation/headless/webdriver markers) and exposes a gate that
 *      sign-up, sign-in and other sensitive forms call before proceeding.
 *   2. BLOCK NON-HUMAN INSTRUCTIONS — synthetic (script-dispatched, isTrusted=
 *      false) clicks/submits on protected controls are blocked; abnormal action
 *      velocity and injection-shaped input are detected.
 *   3. ANTI-HACKING AGENT — continuously monitors for tampering and attack
 *      patterns, logs security events, and on a high-severity signal soft-locks
 *      the page behind a human confirmation.
 *
 * HONEST SCOPE: no purely client-side check is unforgeable. This is a strong,
 * layered heuristic defence that raises the cost of automated abuse; it composes
 * with the backend's per-user rate limits + honeypot + Firebase Auth's own
 * abuse protection, and is designed to accept a server-verified challenge
 * (Cloudflare Turnstile / reCAPTCHA) as the next layer.
 *
 * To protect a control, add the attribute data-sy-human to a form or button.
 * A form's submit handler should call SYSentinel.humanGate({event}) and refuse
 * on !ok.
 */
(function () {
  'use strict';
  if (window.SYSentinel) return; // already active — never double-bind listeners
  var h = String((location && location.hostname) || '');
  // dev/CI hosts monitor but never hard-block or soft-lock (keeps tests + local
  // work flowing); real hosts enforce fully.
  var ENFORCE = !/^(localhost|127\.|0\.0\.0\.0|::1|\[?::1\]?)/.test(h) && h !== '';

  var S = { human: false, firstAt: Date.now(), moves: 0, keys: 0, taps: 0, events: 0, synthetic: 0, blocked: 0, locked: false, last: [] };

  /* ---------------- automation / headless detection ---------------- */
  function signals() {
    var out = [];
    try {
      var w = window, n = navigator, ua = String(n.userAgent || '');
      if (n.webdriver === true) out.push('webdriver');
      ['_phantom', '__nightmare', 'callPhantom', 'callSelenium', '_selenium', '__selenium_unwrapped',
        '__webdriver_evaluate', '__driver_evaluate', '__fxdriver_evaluate', '__webdriver_script_fn',
        'domAutomation', 'domAutomationController', '__$webdriverAsyncExecutor', 'webdriver'].forEach(function (k) { try { if (w[k]) out.push('g:' + k); } catch (e) {} });
      if (/HeadlessChrome|PhantomJS|SlimerJS|Selenium|puppeteer|playwright|electron|slimerjs|headless/i.test(ua)) out.push('ua');
      if (n.languages && n.languages.length === 0) out.push('nolang');
      if (/Chrome\//.test(ua) && !/Edg|OPR|Brave/.test(ua) && !w.chrome) out.push('nochrome');
      if (typeof w.outerWidth === 'number' && w.outerWidth === 0 && w.outerHeight === 0) out.push('nowin');
      try { if (/Chrome\//.test(ua) && !/Mobile/.test(ua) && n.plugins && n.plugins.length === 0) out.push('noplugins'); } catch (e) {}
      // permissions inconsistency (headless quirk)
    } catch (e) {}
    return out;
  }
  var HARD = ['webdriver', 'ua', 'g:__webdriver_evaluate', 'g:__selenium_unwrapped', 'g:domAutomationController', 'g:callPhantom', 'g:_phantom', 'g:__driver_evaluate', 'g:__fxdriver_evaluate', 'g:__webdriver_script_fn'];
  function isAutomated() { return signals().some(function (x) { return HARD.indexOf(x) >= 0; }); }

  /* ---------------- human-presence capture (trusted events only) ---------------- */
  function onHuman(e) {
    if (!e || !e.isTrusted) return;
    S.human = true;
    if (e.type === 'keydown') S.keys++;
    else if (e.type === 'touchstart') S.taps++;
    else if (e.type === 'pointermove' || e.type === 'mousemove') S.moves++;
  }
  ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'pointermove', 'mousemove', 'wheel'].forEach(function (t) {
    try { window.addEventListener(t, onHuman, { capture: true, passive: true }); } catch (e) {}
  });

  /* ---------------- event log + soft-lock response ---------------- */
  function record(kind, detail, sev) {
    S.events++; S.last.unshift({ kind: kind, detail: detail, sev: sev || 'med', when: Date.now() }); S.last = S.last.slice(0, 30);
    try { if (window.SY && SY.log) SY.log('security', (sev === 'high' ? 'Blocked — ' : 'Flagged — ') + kind, String(detail || '')); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('sy-security', { detail: { kind: kind, detail: detail, sev: sev, when: Date.now() } })); } catch (e) {}
    if (sev === 'high') { S.blocked++; if (ENFORCE) softLock(detail); }
  }
  function softLock(reason) {
    if (S.locked) return; S.locked = true;
    try {
      var o = document.createElement('div');
      o.id = 'sy-sentinel-lock';
      o.setAttribute('role', 'alertdialog');
      o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(4,8,18,.94);display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
      o.innerHTML = '<div style="max-width:420px;background:#0E1626;border:1px solid rgba(120,140,190,.3);border-radius:16px;padding:24px 26px;color:#EDF1F8;text-align:center">' +
        '<div style="font-size:30px">🛡️</div>' +
        '<div style="font-family:Georgia,serif;font-size:20px;margin:8px 0 6px">Security check</div>' +
        '<div style="font-size:13.5px;color:#AAB6CC;line-height:1.6">Our security agent paused this page because it saw activity that did not look human. If this is you, confirm to continue.</div>' +
        '<button id="sy-sentinel-ok" style="margin-top:16px;background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff;border:0;border-radius:10px;padding:11px 22px;font-weight:600;font-size:14px;cursor:pointer">I\'m human — continue</button>' +
        '<div style="font-size:11px;color:#8795AE;margin-top:10px">Ref: ' + String(reason || 'anomaly').slice(0, 60) + '</div></div>';
      (document.body || document.documentElement).appendChild(o);
      var btn = o.querySelector('#sy-sentinel-ok');
      btn.addEventListener('click', function (e) {
        // only a genuine, trusted human click clears the lock
        if (!e.isTrusted || isAutomated()) { record('lock-bypass-attempt', 'Synthetic unlock blocked', 'high'); return; }
        S.locked = false; o.remove();
      }, true);
    } catch (e) { S.locked = false; }
  }

  /* ---------------- velocity + injection monitors ---------------- */
  var acts = [];
  function tick() { var n = Date.now(); acts.push(n); acts = acts.filter(function (t) { return n - t < 3000; }); if (acts.length > 40) { acts = []; record('velocity', 'Abnormal action rate (' + '>40/3s)', 'med'); } }
  var INJ = /<\s*script\b|onerror\s*=|onload\s*=|onclick\s*=|javascript:|\beval\s*\(|\bFunction\s*\(|document\.cookie|<\s*\/?\s*iframe|srcdoc\s*=|\bimport\s*\(/i;
  function scan(v) { try { return INJ.test(String(v == null ? '' : v)); } catch (e) { return false; } }

  /* ---------------- global capture guards ---------------- */
  document.addEventListener('click', function (e) {
    tick();
    if (!e.isTrusted) {
      S.synthetic++;
      var el = e.target && e.target.closest && e.target.closest('[data-sy-human]');
      if (el) { if (ENFORCE) { e.preventDefault(); e.stopImmediatePropagation(); } record('synthetic-click', 'Programmatic click on a protected control', 'high'); }
    }
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.getAttribute && f.getAttribute('data-sy-human') != null && !e.isTrusted) {
      if (ENFORCE) { e.preventDefault(); e.stopImmediatePropagation(); }
      record('synthetic-submit', 'Programmatic form submission blocked', 'high');
    }
  }, true);
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t) return;
    if ((t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && scan(t.value)) record('injection', 'Suspicious input pattern in ' + (t.id || t.name || 'field'), 'med');
  }, true);

  /* ---------------- public API ---------------- */
  window.SYSentinel = {
    active: function () { return true; },
    enforcing: function () { return ENFORCE; },
    isHuman: function () { return S.human && !isAutomated(); },
    automation: signals,
    /** Sensitive-form gate. Returns {ok, reason}. Call from a submit handler. */
    humanGate: function (opts) {
      opts = opts || {};
      if (opts.event && !opts.event.isTrusted) { record('synthetic-submit', 'Non-human submission blocked', 'high'); return { ok: false, reason: 'Automated submission blocked. Reload and try again.' }; }
      if (ENFORCE && isAutomated()) { record('automation', 'Automated browser at a protected form: ' + signals().join(','), 'high'); return { ok: false, reason: 'Automated browser detected. Sign-in is for humans only.' }; }
      if (!S.human) return { ok: false, reason: 'Please interact with the page (move or type) before continuing.' };
      if (Date.now() - S.firstAt < 800) return { ok: false, reason: 'That was too fast — take a moment and try again.' };
      return { ok: true };
    },
    /** injection scan for a value (true = suspicious) */
    scan: scan,
    /** opaque attestation blob for the backend (human signals + automation markers) */
    token: function () {
      try { return btoa(unescape(encodeURIComponent(JSON.stringify({ h: S.human, m: S.moves, k: S.keys, tp: S.taps, a: signals(), auto: isAutomated(), dt: Date.now() - S.firstAt, t: Date.now(), v: 1 })))); } catch (e) { return ''; }
    },
    status: function () { return { active: true, enforcing: ENFORCE, human: this.isHuman(), automation: signals(), events: S.events, blocked: S.blocked, synthetic: S.synthetic, locked: S.locked, recent: S.last.slice(0, 8) }; }
  };

  // announce presence for consoles that surface agent status
  try { window.__SY_SENTINEL = true; window.dispatchEvent(new CustomEvent('sy-sentinel-ready')); } catch (e) {}
})();
