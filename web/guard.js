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
    location.replace(base + 'auth/?role=' + role + '&next=' + here);
    return;
  } else if (s.role !== role) {
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

  window.SY = {
    session: s,
    base: base,
    ns: NS,
    get: function (k, d) {
      try { var v = JSON.parse(localStorage.getItem(NS + k)); return v === null || v === undefined ? d : v; }
      catch (e) { return d; }
    },
    set: function (k, v) { localStorage.setItem(NS + k, JSON.stringify(v)); },
    remove: function (k) { localStorage.removeItem(NS + k); },
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
    /** read another account's namespaced key (read-only) */
    readAccount: function (email, k, d) {
      try { var v = JSON.parse(localStorage.getItem('sy-u:' + email + ':' + k)); return v === null || v === undefined ? d : v; }
      catch (e) { return d; }
    },
    /** shared school data store, keyed by the school join code */
    schoolGet: function (code, k, d) {
      try { var v = JSON.parse(localStorage.getItem('sy-school:' + code + ':' + k)); return v === null || v === undefined ? d : v; }
      catch (e) { return d; }
    },
    schoolSet: function (code, k, v) { try { localStorage.setItem('sy-school:' + code + ':' + k, JSON.stringify(v)); } catch (e) {} },

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
})();
