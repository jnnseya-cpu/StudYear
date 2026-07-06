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
    }
  };
})();
