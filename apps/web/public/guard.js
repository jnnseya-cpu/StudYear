/**
 * Route guard: every protected surface declares the account category it
 * belongs to; anyone without a matching signed-in session is redirected to
 * /auth/ before the page paints. Include synchronously right after <body>:
 *   <script src="../../guard.js" data-role="student" data-base="../../"></script>
 *
 * Preview build: sessions live in this browser's localStorage. The production
 * swap-in is Firebase Auth + custom role claims enforced by Firestore rules —
 * same guard contract, server-verified.
 *
 * Also exposes window.SY — the signed-in user's personal data store. Every
 * account gets its own namespace (sy-u:<email>:<key>), so two students on one
 * device never see each other's plans, points, creations or profile. Legacy
 * un-namespaced keys (sy-plan, sy-points, …) are claimed once by the first
 * account that signs in after the upgrade.
 */
(function () {
  'use strict';
  var el = document.currentScript;
  var role = el.getAttribute('data-role');
  var base = el.getAttribute('data-base') || '../../';
  var s = null;
  try { s = JSON.parse(localStorage.getItem('sy-session')); } catch (e) {}
  var here = encodeURIComponent(location.pathname + location.search + location.hash);
  if (!s || !s.role) {
    location.replace(base + 'auth/?role=' + (role === 'any' ? 'student' : role) + '&next=' + here);
    return;
  } else if (role !== 'any' && s.role !== role) {
    // data-role="any" admits every signed-in account (e.g. the universal profile page)
    location.replace(base + 'auth/?role=' + role + '&mismatch=' + encodeURIComponent(s.role) + '&next=' + here);
    return;
  }

  var NS = 'sy-u:' + (s.email || 'anon') + ':';
  // one account claims the pre-account-era data, once
  var LEGACY = ['mine', 'points', 'streak', 'quizzes', 'plan', 'diagnostic'];
  try {
    var claimed = localStorage.getItem('sy-legacy-claimed');
    if (!claimed) {
      LEGACY.forEach(function (k) {
        var v = localStorage.getItem('sy-' + k);
        if (v !== null && localStorage.getItem(NS + k) === null) localStorage.setItem(NS + k, v);
      });
      localStorage.setItem('sy-legacy-claimed', s.email || 'anon');
    }
  } catch (e) {}

  // premium colour theme: one shared enhancement layer across every console
  try {
    var th = document.createElement('link');
    th.rel = 'stylesheet'; th.href = base + 'theme.css';
    (document.head || document.documentElement).appendChild(th);
  } catch (e) {}

  // mobile / PWA shell: installed-app and phone sessions get a drawer, app
  // bar and bottom tab bar; the desktop look is untouched
  try {
    var mc = document.createElement('link');
    mc.rel = 'stylesheet'; mc.href = base + 'mobile.css';
    (document.head || document.documentElement).appendChild(mc);
    var mj = document.createElement('script');
    mj.src = base + 'mobile.js'; mj.defer = true;
    (document.head || document.documentElement).appendChild(mj);
  } catch (e) {}

  // cloud bridge: Firebase Auth mirror + end-to-end-encrypted sync + Storage.
  // A silent no-op until firebase-config.json carries real values (go-live).
  try {
    var cj = document.createElement('script');
    cj.src = base + 'cloud.js'; cj.defer = true;
    (document.head || document.documentElement).appendChild(cj);
  } catch (e) {}

  // end-to-end encryption layer: TweetNaCl (synchronous secretbox) + the
  // SYE2E key manager load parser-blocking so they are ready before any page
  // script touches the store. e2e.js runs the one-time migration sweep.
  try {
    document.write('<script src="' + base + 'vendor/nacl-fast.min.js"><\/script>' +
                   '<script src="' + base + 'e2e.js"><\/script>');
  } catch (e) {}

  /** true when this session's personal store is being end-to-end encrypted */
  function canE2E(email) {
    return !!(window.SYE2E && !s.demo && window.SYE2E.enabled(email || s.email));
  }
  function readStored(fullKey, ownerEmail, d) {
    var raw = localStorage.getItem(fullKey);
    if (raw === null || raw === undefined) return d;
    if (window.SYE2E && window.SYE2E.isEnvelope(raw)) {
      var r = window.SYE2E.decryptValue(raw, ownerEmail);
      return r.ok ? (r.value === null || r.value === undefined ? d : r.value) : d;
    }
    try { var v = JSON.parse(raw); return v === null || v === undefined ? d : v; }
    catch (e) { return d; }
  }

  window.SY = {
    session: s,
    base: base,
    ns: NS,
    e2eActive: function () { return canE2E(s.email); },
    get: function (k, d) {
      try { return readStored(NS + k, s.email, d); } catch (e) { return d; }
    },
    set: function (k, v) {
      if (canE2E(s.email)) {
        var env = window.SYE2E.encryptValue(v, s.email);
        if (env) { localStorage.setItem(NS + k, env); return; }
      }
      localStorage.setItem(NS + k, JSON.stringify(v));
    },
    remove: function (k) { localStorage.removeItem(NS + k); },
    /** billing rule: a paid plan whose monthly payment lapsed falls back to
        the free account on EVERY console — all free-tier rules re-apply
        (premium tools lock, Assignment Review gated, free allowance only).
        One-time pack ACUs are purchases and remain spendable. */
    _enforcePlanLapse: function () {
      try {
        if (s.demo) return;
        var w = window.SY.get('wallet', null);
        if (!w || !w.plan || w.plan === 'child_free') return;
        if (w.planExpires && Date.now() > new Date(w.planExpires).getTime()) {
          var old = w.plan;
          w.plan = 'child_free';
          delete w.planExpires;
          w.month = new Date().toISOString().slice(0, 7);
          window.SY.set('wallet', w);
          window.SY.log('billing', 'Subscription payment not renewed — reverted to the free account',
            'Your ' + old + ' plan lapsed. Premium tools are locked and free-tier rules apply until you resubscribe. Purchased ACU packs remain yours.');
        }
      } catch (e) {}
    },
    /** one-time sweep: seal any plaintext personal values once keys exist */
    _e2eMigrate: function () {
      try {
        if (!canE2E(s.email)) return;
        var flag = 'sy-e2e-mig:' + s.email;
        if (localStorage.getItem(flag)) return;
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (!k || k.indexOf(NS) !== 0) continue;
          var raw = localStorage.getItem(k);
          if (window.SYE2E.isEnvelope(raw)) continue;
          var val; try { val = JSON.parse(raw); } catch (e) { continue; }
          var env = window.SYE2E.encryptValue(val, s.email);
          if (env) localStorage.setItem(k, env);
        }
        localStorage.setItem(flag, new Date().toISOString());
      } catch (e) {}
    },
    /** every key belonging to this account (for export / delete) */
    keys: function () {
      var out = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(NS) === 0) out.push(k.slice(NS.length));
      }
      return out;
    },
    signOut: function () {
      localStorage.removeItem('sy-session');
      location.href = base;
    },
    /** append to this account's activity feed (dashboard renders it) */
    log: function (kind, title, detail) {
      try {
        var feed = window.SY.get('activity', []);
        feed.unshift({ k: kind, t: title, d: detail || '', when: new Date().toISOString() });
        window.SY.set('activity', feed.slice(0, 100));
      } catch (e) {}
    },
    timeAgo: function (iso) {
      var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
      if (s < 90) return 'just now';
      var m = s / 60; if (m < 90) return Math.round(m) + ' minutes ago';
      var h = m / 60; if (h < 36) return 'about ' + Math.round(h) + ' hours ago';
      var d = h / 24; if (d < 45) return Math.round(d) + ' days ago';
      var mo = d / 30.4; if (mo < 18) return 'about ' + Math.round(mo) + ' month' + (Math.round(mo) > 1 ? 's' : '') + ' ago';
      return Math.round(mo / 12) + ' years ago';
    },

    // ---- cross-account sharing (preview build: same-device consented reads) ----
    // A student publishes a link code that resolves to their account so a parent
    // can find it; parents/schools read the student's namespace read-only, gated
    // by the student's own consent flags. Production swaps this for Firestore
    // documents with security rules enforcing the same consent contract.

    /** map a share code -> this account's email so a linker can resolve it */
    publishCode: function (code) { try { localStorage.setItem('sy-code:' + code, s.email); } catch (e) {} },
    /** resolve a share code to an account email (or null) */
    resolveCode: function (code) { try { return localStorage.getItem('sy-code:' + String(code).trim()); } catch (e) { return null; } },
    /** name registered against an account email (from sy-users) */
    accountName: function (email) {
      try {
        var us = JSON.parse(localStorage.getItem('sy-users')) || [];
        var u = us.find(function (x) { return x.email === email; });
        return u ? u.name : email;
      } catch (e) { return email; }
    },
    /** read another account's namespaced key (read-only; decrypts via the
        device keyring for consented same-device links — parent↔child,
        school↔student, admin support) */
    readAccount: function (email, k, d) {
      try { return readStored('sy-u:' + email + ':' + k, email, d); }
      catch (e) { return d; }
    },
    /** write into another account's namespace (consented flows: parent
        pushes a recovery plan, admin adjusts a wallet) — sealed with the
        TARGET account's key when it has one */
    writeAccount: function (email, k, v) {
      var full = 'sy-u:' + email + ':' + k;
      if (window.SYE2E && window.SYE2E.enabled(email)) {
        var env = window.SYE2E.encryptValue(v, email);
        if (env) { localStorage.setItem(full, env); return; }
      }
      localStorage.setItem(full, JSON.stringify(v));
    },
    /** shared school data store, keyed by the school join code */
    schoolGet: function (code, k, d) {
      try { var v = JSON.parse(localStorage.getItem('sy-school:' + code + ':' + k)); return v === null || v === undefined ? d : v; }
      catch (e) { return d; }
    },
    schoolSet: function (code, k, v) { try { localStorage.setItem('sy-school:' + code + ':' + k, JSON.stringify(v)); } catch (e) {} },

    // ---- end-to-end encryption (at rest) ----
    // StudYear is an end-to-end encrypted OS. Sensitive blobs — identity
    // documents, safeguarding files, verification uploads, PII — are encrypted
    // with AES-GCM before they ever touch storage. In this preview the key is
    // device-bound (derived from the account + a device secret generated once
    // and kept only on this machine). The production backend swaps in a
    // passphrase-derived, zero-knowledge key so ciphertext is unreadable
    // server-side — true cross-device E2E, identical call contract.
    e2eAvailable: !!(window.crypto && window.crypto.subtle),
    _deviceSecret: function () {
      try {
        var d = localStorage.getItem('sy-device-secret');
        if (!d) {
          var a = new Uint8Array(32);
          if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
          d = btoa(String.fromCharCode.apply(null, a));
          localStorage.setItem('sy-device-secret', d);
        }
        return d;
      } catch (e) { return 'sy-fallback-secret'; }
    },
    _key: null,
    _getKey: function () {
      var self = window.SY;
      if (self._key) return self._key;
      self._key = (function () {
        var enc = new TextEncoder();
        return crypto.subtle.importKey('raw', enc.encode((s.email || 'anon') + '|' + self._deviceSecret()), 'PBKDF2', false, ['deriveKey'])
          .then(function (material) {
            return crypto.subtle.deriveKey(
              { name: 'PBKDF2', salt: enc.encode('studyear-e2e-v1'), iterations: 120000, hash: 'SHA-256' },
              material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
          });
      })();
      return self._key;
    },
    /** encrypt a string -> payload object {e2e, iv, ct} (or passthrough if unavailable) */
    encrypt: function (plain) {
      if (!window.SY.e2eAvailable) return Promise.resolve({ e2e: false, v: plain });
      return window.SY._getKey().then(function (key) {
        var iv = crypto.getRandomValues(new Uint8Array(12));
        return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plain))
          .then(function (ct) {
            return { e2e: true, iv: btoa(String.fromCharCode.apply(null, iv)), ct: btoa(String.fromCharCode.apply(null, new Uint8Array(ct))) };
          });
      }).catch(function () { return { e2e: false, v: plain }; });
    },
    /** decrypt a payload object -> string (or null on failure) */
    decrypt: function (p) {
      if (!p) return Promise.resolve(null);
      if (!p.e2e) return Promise.resolve(p.v != null ? p.v : null);
      return window.SY._getKey().then(function (key) {
        var iv = Uint8Array.from(atob(p.iv), function (c) { return c.charCodeAt(0); });
        var ct = Uint8Array.from(atob(p.ct), function (c) { return c.charCodeAt(0); });
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct)
          .then(function (pt) { return new TextDecoder().decode(pt); });
      }).catch(function () { return null; });
    },
    /** store a value encrypted at rest (async) */
    setSecure: function (k, v) {
      return window.SY.encrypt(JSON.stringify(v)).then(function (p) {
        localStorage.setItem(NS + k, JSON.stringify(p)); return true;
      });
    },
    /** read a value that was stored encrypted (async) */
    getSecure: function (k, d) {
      var raw;
      try { raw = JSON.parse(localStorage.getItem(NS + k)); } catch (e) { return Promise.resolve(d); }
      if (raw === null || raw === undefined) return Promise.resolve(d);
      return window.SY.decrypt(raw).then(function (str) {
        if (str === null) return d;
        try { return JSON.parse(str); } catch (e) { return d; }
      });
    },

    // ---- adaptive accessibility: every person renders to their own needs ----
    // Applies the account's Learning Profile (dyslexia-friendly type, text size,
    // spacing, colour overlay for visual stress, reduced motion) to ANY page
    // that includes guard.js. No human could tune this per student; StudYear does.
    applyLearning: function () {
      var L = window.SY.get('learning', {}) || {};
      var de = document.documentElement;
      de.classList.toggle('sy-dyslexia', !!L.dyslexiaFont);
      de.classList.toggle('sy-large', L.textScale === 'large');
      de.classList.toggle('sy-xlarge', L.textScale === 'xlarge');
      de.classList.toggle('sy-spacing', !!L.spacing);
      de.classList.toggle('sy-reduce-motion', !!L.reduceMotion);
      if (!document.getElementById('sy-a11y-style')) {
        var st = document.createElement('style'); st.id = 'sy-a11y-style';
        st.textContent = [
          'html.sy-dyslexia, html.sy-dyslexia *{font-family:"Trebuchet MS",Verdana,Tahoma,"Segoe UI",sans-serif !important;letter-spacing:.02em}',
          'html.sy-dyslexia p,html.sy-dyslexia li,html.sy-dyslexia .notes-body,html.sy-dyslexia textarea{line-height:1.8 !important;word-spacing:.09em}',
          'html.sy-large{zoom:1.12}', 'html.sy-xlarge{zoom:1.25}',
          'html.sy-spacing p,html.sy-spacing li{line-height:1.9 !important;letter-spacing:.03em}',
          'html.sy-reduce-motion *{animation:none !important;transition:none !important}',
          '#sy-overlay{position:fixed;inset:0;pointer-events:none;z-index:2147483646;mix-blend-mode:multiply}'
        ].join('\n');
        de.appendChild(st);
      }
      var ov = document.getElementById('sy-overlay');
      var tints = { cream: '#fff2cc', blue: '#cfe1ff', green: '#d3f2dd', rose: '#ffd6e1', grey: '#d7dce5' };
      if (L.overlay && tints[L.overlay]) {
        if (!ov) { ov = document.createElement('div'); ov.id = 'sy-overlay'; (document.body || de).appendChild(ov); }
        ov.style.background = tints[L.overlay];
      } else if (ov) { ov.parentNode.removeChild(ov); }
    }
  };
  try { window.SY.applyLearning(); } catch (e) {}

  // ---- Progressive Web App + responsive baseline (applied to every guarded page) ----
  // One place wires PWA install + offline + iOS home-screen + a responsive safety net,
  // so all role consoles behave as an installable, screen-fitting app.
  try {
    var head = document.head || document.getElementsByTagName('head')[0];
    function ensureMeta(sel, make) { if (!document.querySelector(sel)) head.appendChild(make()); }
    // viewport (in case a page forgot it) — fits phones, tablets, laptops, large screens
    ensureMeta('meta[name="viewport"]', function () { var m = document.createElement('meta'); m.name = 'viewport'; m.content = 'width=device-width, initial-scale=1, viewport-fit=cover'; return m; });
    // manifest
    ensureMeta('link[rel="manifest"]', function () { var l = document.createElement('link'); l.rel = 'manifest'; l.href = base + 'manifest.json'; return l; });
    // theme + iOS standalone
    ensureMeta('meta[name="theme-color"]', function () { var m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#060B18'; return m; });
    ensureMeta('meta[name="apple-mobile-web-app-capable"]', function () { var m = document.createElement('meta'); m.name = 'apple-mobile-web-app-capable'; m.content = 'yes'; return m; });
    ensureMeta('meta[name="mobile-web-app-capable"]', function () { var m = document.createElement('meta'); m.name = 'mobile-web-app-capable'; m.content = 'yes'; return m; });
    ensureMeta('meta[name="apple-mobile-web-app-status-bar-style"]', function () { var m = document.createElement('meta'); m.name = 'apple-mobile-web-app-status-bar-style'; m.content = 'black-translucent'; return m; });
    ensureMeta('meta[name="apple-mobile-web-app-title"]', function () { var m = document.createElement('meta'); m.name = 'apple-mobile-web-app-title'; m.content = 'StudYear'; return m; });
    ensureMeta('link[rel="apple-touch-icon"]', function () { var l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = base + 'apple-touch-icon.png'; return l; });
    // responsive safety net — media stays inside its container on any screen; tables/code scroll
    if (!document.getElementById('sy-responsive')) {
      var rs = document.createElement('style'); rs.id = 'sy-responsive';
      rs.textContent = 'img{max-width:100%;height:auto}.sy-scroll,table.sy-scroll{display:block;max-width:100%;overflow-x:auto}@media(max-width:520px){:root{}}';
      head.appendChild(rs);
    }
    // register the offline/install service worker (scope-relative so / and /StudYear/ both work)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(function () {});
      // when a new worker takes control mid-visit, the page on screen was styled
      // by the previous deploy's cached CSS — refresh once so HTML+CSS match
      var reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloaded || !navigator.serviceWorker.controller) return;
        if (!sessionStorage.getItem('sy-sw-reloaded')) {
          reloaded = true; sessionStorage.setItem('sy-sw-reloaded', '1'); location.reload();
        }
      });
    }
  } catch (e) {}
})();
