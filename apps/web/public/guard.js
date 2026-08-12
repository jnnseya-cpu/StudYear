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
  // URL normalisation MUST run before anything else: hosts that serve console
  // pages without the trailing slash (/teacher instead of /teacher/) silently
  // break every RELATIVE reference on the page — <script src="nav.js"> loads
  // /nav.js (404, so the console renders unstyled) and sidebar links resolve a
  // level too high (students/ → /students/, the "hasn't shipped yet" 404s).
  // replaceState updates document.baseURI without a navigation, so everything
  // parsed after this script resolves correctly. No-op when the slash is there.
  try {
    var _p = location.pathname;
    if (!/\/$/.test(_p) && !/\.[^\/]+$/.test(_p)) {
      history.replaceState(null, '', _p + '/' + location.search + location.hash);
    }
  } catch (e) {}
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

  // Sentinel: the anti-hacking / human-only security agent. Loaded on EVERY
  // page (every section + part of the OS) and early (not deferred) so it captures
  // input and guards synthetic events from the first moment.
  try {
    if (!window.__SY_SENTINEL) {
      var sj = document.createElement('script');
      sj.src = base + 'sentinel.js';
      (document.head || document.documentElement).appendChild(sj);
    }
  } catch (e) {}

  // cloud bridge: Firebase Auth mirror + end-to-end-encrypted sync + Storage.
  // A silent no-op until firebase-config.json carries real values (go-live).
  try {
    var cj = document.createElement('script');
    cj.src = base + 'cloud.js'; cj.defer = true;
    (document.head || document.documentElement).appendChild(cj);
  } catch (e) {}

  // password show/hide toggle on every signed-in page with a password field
  // (change-password panels, re-auth prompts) — same control as the login page.
  try {
    var pe = document.createElement('script');
    pe.src = base + 'pweye.js'; pe.defer = true;
    (document.head || document.documentElement).appendChild(pe);
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
  /** cloud.js is injected by guard with defer, so window.SYCloud may not exist
      yet when a page's load-time code runs. Resolve once it appears (or null
      after ~10s) so link publish/resolve never silently no-ops on first load. */
  function cloudReady() {
    if (window.SYCloud) return Promise.resolve(window.SYCloud);
    return new Promise(function (res) {
      var n = 0, t = setInterval(function () {
        if (window.SYCloud) { clearInterval(t); res(window.SYCloud); }
        else if (++n > 100) { clearInterval(t); res(null); }
      }, 100);
    });
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

    /** map a share code -> this account's email so a linker can resolve it.
        Same-device via localStorage (offline/demo) AND, for real cloud
        sessions, published to the backend directory so a linker on a
        different account/device can resolve it too. */
    publishCode: function (code, kind) {
      try { localStorage.setItem('sy-code:' + code, s.email); } catch (e) {}
      if (s.demo) return;
      var tries = 0;
      function attempt() {
        cloudReady().then(function (c) {
          if (!c) return;
          try {
            Promise.resolve(c.dirPublish(String(code), kind || 'account', s.email)).then(function (ok) {
              // token may settle a moment after load — retry a few times so the
              // code always reaches the backend and a parent on another device
              // can resolve it without either side re-signing in.
              if (!ok && ++tries < 4) setTimeout(attempt, 2500);
            });
          } catch (e) {}
        });
      }
      attempt();
    },
    /** a demo/presentation account address (seeded by /demo). Real accounts must
        never resolve to, link to, or display these — and vice versa — or a real
        parent ends up viewing seeded demo data. */
    isDemoAccount: function (email) { return /@demo\.studyear$/i.test(String(email || '')); },
    /** true when linking `email` from THIS session would cross the real↔demo
        boundary (a real account pulling in a demo child, or a demo account
        pulling in a real one). */
    crossesDemoBoundary: function (email) { return this.isDemoAccount(email) !== !!s.demo; },
    /** resolve a share code to an account email (or null) — same-device only */
    resolveCode: function (code) { try { return localStorage.getItem('sy-code:' + String(code).trim()); } catch (e) { return null; } },
    /** resolve a share code across accounts/devices: tries the backend
        directory first (real cross-device link), then the local map.
        Resolves to { email, name, uid, kind } or null. */
    resolveCodeAsync: function (code) {
      var c = String(code).trim(), local = this.resolveCode(c), self = this;
      // never let a real session resolve a code to a demo account (or a demo
      // session resolve a real one) — that is how demo data leaks into a real view
      if (local && self.crossesDemoBoundary(local)) local = null;
      var loc = local ? { email: local, name: self.accountName(local), uid: null, kind: 'account', local: true } : null;
      if (s.demo) return Promise.resolve(loc);
      return cloudReady().then(function (cl) {
        if (!cl) return loc;
        return cl.dirResolve(c, s.email).then(function (r) {
          if (r && r.email && !self.crossesDemoBoundary(r.email)) return { email: r.email, name: r.name || self.accountName(r.email), uid: r.uid || null, kind: r.kind || 'account' };
          return loc;
        }).catch(function () { return loc; });
      });
    },
    /** establish a link to the code's owner on the backend (both sides see it);
        resolves to the target { email, name, uid, kind } or the local fallback. */
    connectCode: function (code, relation) {
      var c = String(code).trim(), self = this;
      if (s.demo) return this.resolveCodeAsync(c);
      return cloudReady().then(function (cl) {
        if (!cl) return self.resolveCodeAsync(c);
        return cl.dirConnect(c, relation || 'parent', s.email).then(function (r) {
          if (r && r.email && !self.crossesDemoBoundary(r.email)) return { email: r.email, name: r.name || self.accountName(r.email), uid: r.uid || null, kind: r.kind || 'account' };
          return self.resolveCodeAsync(c);
        }).catch(function () { return self.resolveCodeAsync(c); });
      });
    },
    /** Attainment for a study level — the correct national framework, not a
        one-size GCSE grade. Primary children (England) are NOT graded 1–9:
          EYFS (Reception) → Early Learning Goals: Emerging / Expected
          KS1/KS2          → Working Towards / Expected Standard / Greater Depth
                             + a KS2-style scaled score (80–120, 100 = expected)
          Secondary        → GCSE grade 1–9
        Returns { system, band, scaled?, grade?, short, caption, label }. */
    attainment: function (level, masteryPct) {
      var L = String(level || '').toLowerCase();
      var m = Math.max(0, Math.min(100, Math.round(masteryPct || 0)));

      // University — Master's / Postgraduate: Distinction / Merit / Pass
      if (/master|postgrad|\bpg\b|\bpgt\b|\bpgr\b|phd|doctora|\bmsc\b|\bmba\b/.test(L)) {
        var pgb = m >= 70 ? 'Distinction' : m >= 60 ? 'Merit' : m >= 50 ? 'Pass' : 'Fail';
        return { system: 'pg', band: pgb, short: pgb, caption: 'Postgraduate (' + m + '%)', label: "Master's — " + pgb + ' (' + m + '%)' };
      }
      // University — Foundation year: Pass / Merit / Distinction
      if (/foundation year/.test(L)) {
        var fyb = m >= 70 ? 'Distinction' : m >= 60 ? 'Merit' : m >= 40 ? 'Pass' : 'Fail';
        return { system: 'foundation', band: fyb, short: fyb, caption: 'Foundation year (' + m + '%)', label: 'Foundation year — ' + fyb + ' (' + m + '%)' };
      }
      // University — Undergraduate degree classification: 1st / 2:1 / 2:2 / 3rd
      if (/undergrad|\bug\b|degree|bachelor|honours|\buniversity\b|\bba\b|\bbsc\b/.test(L)) {
        var cls, csh;
        if (m >= 70) { cls = 'First-Class Honours'; csh = '1st'; }
        else if (m >= 60) { cls = 'Upper Second (2:1)'; csh = '2:1'; }
        else if (m >= 50) { cls = 'Lower Second (2:2)'; csh = '2:2'; }
        else if (m >= 40) { cls = 'Third-Class (3rd)'; csh = '3rd'; }
        else if (m >= 35) { cls = 'Ordinary / Pass degree'; csh = 'Pass'; }
        else { cls = 'Fail'; csh = 'Fail'; }
        return { system: 'degree', band: csh, short: csh, caption: 'Degree classification (' + m + '%)', label: cls + ' — ' + m + '%' };
      }
      // A-level / AS-level (KS5): A*–E
      if (/a2|a-?level|\bas\b|ks5|key stage 5|sixth form|year 12|year 13/.test(L)) {
        var isAS = /\bas\b/.test(L) && !/a2|a-?level/.test(L);
        var ag = m >= 90 ? 'A*' : m >= 80 ? 'A' : m >= 70 ? 'B' : m >= 60 ? 'C' : m >= 50 ? 'D' : m >= 40 ? 'E' : 'U';
        if (isAS && ag === 'A*') ag = 'A';
        return { system: 'alevel', band: ag, short: (ag === 'U' ? 'U' : 'Grade ' + ag), caption: (isAS ? 'AS-level' : 'A-level') + ' grade', label: (isAS ? 'AS-level ' : 'A-level ') + ag + ' (' + m + '%)' };
      }
      // BTEC / T-level / vocational: Pass / Merit / Distinction / Distinction*
      if (/btec|t-?level|vocational|\bcache\b|\bnvq\b|\bhnd\b|\bhnc\b/.test(L)) {
        var vb = m >= 85 ? 'Distinction*' : m >= 70 ? 'Distinction' : m >= 55 ? 'Merit' : m >= 40 ? 'Pass' : m >= 30 ? 'Near Pass' : 'Unclassified';
        return { system: 'btec', band: vb, short: vb, caption: 'BTEC / vocational grade', label: 'BTEC — ' + vb + ' (' + m + '%)' };
      }
      // International Baccalaureate: subject grade 1–7
      if (/international baccalaureate|\bib\b/.test(L)) {
        var ibp = Math.max(1, Math.min(7, Math.round(1 + 6 * m / 100)));
        return { system: 'ib', grade: ibp, short: ibp + '/7', caption: 'IB subject grade (1–7)', label: 'IB grade ' + ibp + '/7 (' + m + '%)' };
      }
      // Scottish qualifications: National 5 / Higher / Advanced Higher (A–D)
      if (/national 5|nat 5|scottish|advanced higher|\bhighers?\b/.test(L)) {
        var sg = m >= 70 ? 'A' : m >= 60 ? 'B' : m >= 50 ? 'C' : m >= 40 ? 'D' : 'No award';
        var sn = /advanced higher/.test(L) ? 'Advanced Higher' : /higher/.test(L) ? 'Higher' : 'National 5';
        return { system: 'scottish', band: sg, short: 'Grade ' + sg, caption: sn + ' band (A–D)', label: sn + ' ' + sg + ' (' + m + '%)' };
      }
      // 11+ (grammar-school selection): standardised score 69–141 (mean 100)
      if (/11\s*\+|eleven plus|grammar/.test(L)) {
        var sas = Math.round(69 + m * 0.72); if (sas > 141) sas = 141; if (sas < 69) sas = 69;
        var pass = sas >= 111;
        return { system: 'elevenplus', score: sas, band: pass ? 'At/above typical pass' : 'Below typical pass', short: 'SAS ' + sas,
          caption: 'Standardised score (avg 100; pass ~111+)', label: '11+ standardised score ' + sas + (pass ? ' — at/above the typical grammar pass mark' : ' — below the typical pass mark (varies by school)') };
      }
      // GCSE / IGCSE (KS4): grade 9–1 (4 = Standard Pass, 5 = Strong Pass)
      if (/gcse|igcse|ks4|key stage 4|year 10|year 11/.test(L)) {
        var g9 = m >= 95 ? 9 : m >= 85 ? 8 : m >= 75 ? 7 : m >= 65 ? 6 : m >= 55 ? 5 : m >= 45 ? 4 : m >= 33 ? 3 : m >= 20 ? 2 : m >= 8 ? 1 : 'U';
        var gn = g9 === 5 ? ' · Strong Pass' : g9 === 4 ? ' · Standard Pass' : '';
        return { system: 'gcse', grade: g9, short: (g9 === 'U' ? 'U' : 'Grade ' + g9), caption: 'GCSE grade (9–1)' + gn, label: 'GCSE ' + (g9 === 'U' ? 'Ungraded' : 'Grade ' + g9) + gn + ' (' + m + '%)' };
      }
      // KS3 (Years 7–9): same DfE descriptors as primary, tracked vs the year's
      // Programme of Study, plus an on-track GCSE grade
      if (/ks3|key stage 3|years? *7|years? *8|years? *9|7-9|7–9/.test(L)) {
        var kb = m >= 80 ? 'Greater Depth' : m >= 65 ? 'Above expected' : m >= 45 ? 'At expected' : m >= 30 ? 'Working towards' : 'Below expected';
        var onTrack = m >= 95 ? 9 : m >= 85 ? 8 : m >= 75 ? 7 : m >= 65 ? 6 : m >= 55 ? 5 : m >= 45 ? 4 : m >= 33 ? 3 : m >= 20 ? 2 : 1;
        return { system: 'ks3', band: kb, projected: onTrack, short: kb, caption: 'Age-related · on track for GCSE ' + onTrack, label: 'KS3: ' + kb + ' — on track for GCSE Grade ' + onTrack };
      }
      // KS2 (SATs): scaled score 80–120 + expected/greater-depth band
      if (/key stage 2|\bks2\b|years? *[3-6]\b|junior/.test(L)) {
        var sc = Math.round(80 + m * 0.4); if (sc < 80) sc = 80; if (sc > 120) sc = 120;
        var kb2 = sc >= 110 ? 'Greater Depth' : sc >= 100 ? 'Expected Standard' : 'Working Towards';
        return { system: 'ks2', scaled: sc, band: kb2, short: kb2, caption: 'Scaled score ' + sc + ' (100 = expected)', label: 'KS2 (SATs): ' + kb2 + ' · scaled score ' + sc };
      }
      // KS1: teacher-assessment bands (no scaled score prominence)
      if (/key stage 1|\bks1\b|years? *[12]\b|infant/.test(L)) {
        var kb1 = m >= 80 ? 'Greater Depth' : m >= 50 ? 'Expected Standard' : 'Working Towards';
        return { system: 'ks1', band: kb1, short: kb1, caption: 'Teacher assessment (KS1)', label: 'KS1: ' + kb1 };
      }
      // EYFS / Reception: Early Learning Goals — Emerging / Expected
      if (/eyfs|reception|nursery|early years/.test(L)) {
        var eb = m >= 65 ? 'Expected' : 'Emerging';
        return { system: 'eyfs', band: eb, short: eb, caption: 'Early Learning Goals', label: 'EYFS: ' + eb + ' (Early Learning Goals)' };
      }
      // NEET / lifelong / adult / other: progress, not a grade
      if (/neet|lifelong|adult|autodidact|\bfun\b|other|all level/.test(L)) {
        var prb = m >= 80 ? 'Confident' : m >= 55 ? 'Developing' : m >= 30 ? 'Foundation' : 'Getting started';
        return { system: 'progress', band: prb, short: m + '%', caption: 'Progress · ' + prb, label: prb + ' — ' + m + '% progress' };
      }
      // Fallback: a plain "working at" GCSE-style grade
      var gf = Math.max(1, Math.min(9, Math.round(1 + 8 * m / 100)));
      return { system: 'generic', grade: gf, short: 'Grade ' + gf, caption: 'Working at', label: 'Working at Grade ' + gf };
    },
    /** one-line guidance the AI generators append so questions match the
        learner's national assessment style (SATs, 11+ reasoning, phonics,
        GCSE command words, degree essays) rather than a one-size format. */
    stageStyle: function (level) {
      var L = String(level || '').toLowerCase();
      var k = /reception|eyfs|nursery|\bks1\b|key stage 1/.test(L) ? 'ks1'
        : /11\s*\+|eleven plus/.test(L) ? 'eleven'
        : /\bks2\b|key stage 2/.test(L) ? 'ks2'
        : /\bks3\b|key stage 3|year *7|year *8|year *9/.test(L) ? 'ks3'
        : /universit|undergrad|degree|master|\bpg\b|\bug\b|foundation year/.test(L) ? 'degree'
        : /a-?level|\bas\b|higher|\bib\b|btec|national 5/.test(L) ? 'alevel'
        : 'gcse';
      return ({
        ks1: ' Pitch for ages 5–7 (KS1): very simple one-step questions — sounding out and reading simple words (phonics), counting, number bonds, adding/taking away within 20, and the 2, 5 and 10 times tables. Short, concrete language; no hard vocabulary or exam command words.',
        ks2: ' Pitch for KS2 SATs (ages 7–11): for maths mix straight arithmetic with short real-life reasoning word problems (money, time, measures, fractions, percentages); for reading use retrieval, inference and vocabulary; for grammar use word classes, punctuation and spelling. Plain child-friendly language.',
        eleven: ' Pitch for 11+ grammar-school selection (age 10–11): verbal reasoning (letter/number codes, analogies, synonyms & antonyms, odd-one-out, letter series), non-verbal reasoning described fully in words (shape sequences, rotations, sides), and multi-step maths problems. Each question self-contained, single best answer.',
        ks3: ' Pitch for KS3 (Years 7–9): solid curriculum questions a little below GCSE demand, building key knowledge and some short reasoning.',
        gcse: ' Pitch at GCSE (grade 9–1) with exam-accurate content and proper command words.',
        alevel: ' Pitch at A-level / Level 3: application, analysis and evaluation, assuming strong foundations.',
        degree: ' Pitch at undergraduate/postgraduate level: critical, applied and theory-referenced.'
      })[k] || '';
    },
    /** award reward points to the current account (homework/behaviour/skillrush
        all call SY.addPoints). Accumulates on the account's `points` total that
        the dashboards read. Safe no-op for demo sessions' persistence. */
    addPoints: function (n) {
      try { var p = Number(this.get('points', 0)) || 0; this.set('points', p + (Number(n) || 0)); } catch (e) {}
      return true;
    },
    /** resolves true when this account has a live cloud session (Firebase token)
        — cross-account linking/sync needs it; used to give a clear message. */
    cloudAuthed: function () {
      if (s.demo) return Promise.resolve(false);
      return cloudReady().then(function (c) { return c ? c.token(s.email).then(function (t) { return !!t; }).catch(function () { return false; }) : false; });
    },
    /** Guarantee a live cloud session before an action that needs the backend
        (linking, sync). If the token is missing — e.g. the first sign-in ran
        while the network was blocking the servers — reconnect inline by
        confirming the password, so the user never has to sign fully out.
        Resolves true once a token is present. */
    ensureCloud: function () {
      if (s.demo) return Promise.resolve(false);
      return this.cloudAuthed().then(function (ok) {
        if (ok) return true;
        return cloudReady().then(function (cl) {
          if (!cl || !cl.signIn) return false;
          return new Promise(function (resolve) {
            var ov = document.createElement('div');
            ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(6,11,24,.72);' +
              'display:flex;align-items:center;justify-content:center;padding:20px;' +
              'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
            var card = document.createElement('div');
            card.style.cssText = 'background:#0F1830;border:1px solid rgba(120,150,200,.3);border-radius:16px;' +
              'max-width:390px;width:100%;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.55);color:#EAF1FF';
            card.innerHTML =
              '<div style="font-weight:700;font-size:16.5px;margin-bottom:6px">Reconnect to StudYear</div>' +
              '<div style="font-size:13px;color:#AEBBD6;line-height:1.55;margin-bottom:14px">Confirm your password for <b style="color:#EAF1FF">' + String(s.email || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }) + '</b> so linking and sync work on this network. Your sign-in stays active.</div>' +
              '<input type="password" id="sy-reauth-pw" autocomplete="current-password" placeholder="Your StudYear password" style="width:100%;padding:12px 13px;border-radius:10px;border:1px solid rgba(150,170,210,.4);background:#0A1224;color:#fff;font-size:14px;outline:none;box-sizing:border-box">' +
              '<div id="sy-reauth-err" style="color:#FF8A8A;font-size:12.5px;margin-top:9px;display:none"></div>' +
              '<div id="sy-reauth-reset" style="font-size:12.5px;margin-top:10px;display:none"><a href="#" id="sy-reauth-resetlink" style="color:#8FC2EC;text-decoration:underline">Email me a link to reset my cloud password</a></div>' +
              '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
              '<button id="sy-reauth-cancel" type="button" style="padding:10px 15px;border-radius:9px;border:1px solid rgba(150,170,210,.3);background:none;color:#AEBBD6;font-weight:600;cursor:pointer">Cancel</button>' +
              '<button id="sy-reauth-ok" type="button" style="padding:10px 18px;border-radius:9px;border:none;background:#3D8FD1;color:#fff;font-weight:700;cursor:pointer">Reconnect</button></div>';
            ov.appendChild(card);
            (document.body || document.documentElement).appendChild(ov);
            var pw = card.querySelector('#sy-reauth-pw'), err = card.querySelector('#sy-reauth-err'),
              okB = card.querySelector('#sy-reauth-ok'), cB = card.querySelector('#sy-reauth-cancel'),
              resetWrap = card.querySelector('#sy-reauth-reset'), resetLink = card.querySelector('#sy-reauth-resetlink');
            setTimeout(function () { try { pw.focus(); } catch (e) {} }, 60);
            function done(v) { try { ov.remove(); } catch (e) {} resolve(v); }
            function fail(msg, offerReset) {
              okB.disabled = false; okB.textContent = 'Reconnect';
              err.textContent = msg; err.style.display = 'block';
              if (resetWrap) resetWrap.style.display = offerReset ? 'block' : 'none';
              try { pw.select(); } catch (e) {}
            }
            function submit() {
              var p = pw.value;
              if (!p) { err.textContent = 'Enter your password.'; err.style.display = 'block'; return; }
              okB.disabled = true; okB.textContent = 'Reconnecting…'; err.style.display = 'none';
              if (resetWrap) resetWrap.style.display = 'none';
              /* reauth reports WHY it failed, so the message is honest: a wrong
                 password, a cloud password that drifted from the local one, or a
                 network/server problem are no longer all shown as "wrong password". */
              var attempt = cl.reauth
                ? cl.reauth(s.email, p)
                : Promise.resolve(cl.signIn(s.email, p)).then(function (r) {
                    if (r) return { ok: true };
                    if (cl.signUp) return Promise.resolve(cl.signUp(s.email, p, s.name, s.role)).then(function (x) { return { ok: !!x, reason: x ? 'provisioned' : 'wrong_password' }; }).catch(function () { return { ok: false, reason: 'network' }; });
                    return { ok: false, reason: 'wrong_password' };
                  });
              Promise.resolve(attempt).then(function (res) {
                res = res || { ok: false, reason: 'network' };
                if (res.ok) { try { if (cl.reconnect) cl.reconnect(); } catch (e) {} done(true); return; }
                if (res.reason === 'wrong_password')
                  fail("That password doesn't match your StudYear cloud account. If you've changed your password on another device, reset your cloud password below.", true);
                else if (res.reason === 'weak_password')
                  fail('Your cloud account needs a password of at least 6 characters. Reset it below, then reconnect.', true);
                else if (res.reason === 'offline')
                  fail("StudYear's cloud isn't configured on this build. Linking works once you're online on the live site.", false);
                else
                  fail("Couldn't reach StudYear's servers on this network — this is a connection problem, not your password. Linking keeps retrying; try again, or switch networks (e.g. mobile data).", false);
              }).catch(function () { fail("Couldn't reach StudYear just now — please try again.", false); });
            }
            if (resetLink) resetLink.onclick = function (e) {
              e.preventDefault();
              if (!cl.resetPassword) return;
              resetLink.textContent = 'Sending…';
              Promise.resolve(cl.resetPassword(s.email)).then(function () {
                err.style.display = 'block'; err.style.color = '#8ee0a5';
                err.textContent = 'Reset link sent to ' + String(s.email || '') + ' — set a new password, then reconnect here with it.';
                if (resetWrap) resetWrap.style.display = 'none';
              }).catch(function () { resetLink.textContent = 'Couldn\'t send the reset email — try again.'; });
            };
            okB.onclick = submit; cB.onclick = function () { done(false); };
            pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
          });
        });
      });
    },
    /** my backend links: { inbound:[…people linked to me…], outbound:[…accounts I linked to…] } */
    myLinks: function () {
      if (s.demo) return Promise.resolve(null);
      return cloudReady().then(function (cl) { return cl ? cl.dirLinks(s.email).catch(function () { return null; }) : null; });
    },
    /** remove a backend link (dir = 'outbound' for accounts I linked to,
        'inbound' for people linked to me) */
    disconnectLink: function (uid, dir) {
      if (s.demo || !uid) return Promise.resolve(false);
      return cloudReady().then(function (cl) { return cl ? cl.dirDisconnect(uid, dir || 'outbound', s.email).catch(function () { return false; }) : false; });
    },
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

  // ---- KIDS theme: under-12 students (Primary / KS1 / KS2 / 11+) get the
  // StudYear Primary premium theme — light sky background, navy sidebar,
  // rounded fonts, floating cards. Applied automatically from the study level.
  //
  // It must NEVER silently fail: the study level lives in the personal profile
  // which can be encrypted (E2E) and, on a device where the key hasn't been
  // unlocked yet, momentarily unreadable — returning {} and mis-detecting the
  // child as secondary. So we cache the primary/secondary decision in a PLAIN
  // per-account flag, apply the theme SYNCHRONOUSLY from that flag on every
  // page, and re-evaluate a few times as the profile becomes readable.
  try {
    if (s.role === 'student') {
      var _KIDFLAG = 'sy-kids:' + (s.email || 'anon');
      var applyKids = function () {
        var l = document.getElementById('sy-kids');
        if (l) return;
        l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = base + 'kids.css'; l.id = 'sy-kids';
        (document.head || document.documentElement).appendChild(l);
        document.documentElement.setAttribute('data-sy-kids', '1');
        if (!document.getElementById('sy-kids-font')) {
          var kf = document.createElement('link');
          kf.id = 'sy-kids-font'; kf.rel = 'stylesheet'; kf.media = 'print';
          kf.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap';
          kf.onload = function () { this.media = 'all'; };
          (document.head || document.documentElement).appendChild(kf);
        }
      };
      var removeKids = function () {
        var l = document.getElementById('sy-kids'); if (l) l.remove();
        document.documentElement.removeAttribute('data-sy-kids');
      };
      // classify the level string: 'primary' | 'secondary' | '' (unknown)
      var classify = function () {
        var kp = window.SY.get('profile', {}) || {};
        var str = [kp.level, kp.yearGroup, kp.year, kp.keyStage, kp.stage, kp.phase]
          .map(function (x) { return String(x || ''); }).join(' ');
        // school-managed level is a second authoritative source
        try {
          var em = (s.email || '').toLowerCase();
          for (var i = 0; i < localStorage.length; i++) {
            var kk = localStorage.key(i), mm = kk && kk.match(/^sy-school:([^:]+):roster$/);
            if (!mm) continue;
            var mg = window.SY.schoolGet(mm[1], 'managed:' + em, {}) || {};
            if (mg.level) str += ' ' + mg.level;
          }
        } catch (e) {}
        if (!str.trim()) return '';
        if (/gcse|a-?level|as-?level|\bks\s*[345]\b|key\s*stage\s*[345]|\byear\s*(7|8|9|1[0-3])\b|sixth form|btec|ib\b|undergrad|degree|college|university/i.test(str)) return 'secondary';
        if (/primary|eyfs|reception|infant|junior|\bks\s*[12]\b|key\s*stage\s*[12]|\b11\s*\+|\byear\s*[1-6]\b/i.test(str)) return 'primary';
        return '';
      };
      var evaluate = function () {
        var c = classify();
        if (c === 'primary') { try { localStorage.setItem(_KIDFLAG, '1'); } catch (e) {} applyKids(); }
        else if (c === 'secondary') { try { localStorage.setItem(_KIDFLAG, '0'); } catch (e) {} removeKids(); }
        else { // unknown right now — fall back to the last known decision
          var cached = null; try { cached = localStorage.getItem(_KIDFLAG); } catch (e) {}
          if (cached === '1') applyKids();
        }
      };
      // 1) instant: apply from the cached flag with zero delay (no dark flash)
      try { if (localStorage.getItem(_KIDFLAG) === '1') applyKids(); } catch (e) {}
      // 2) evaluate now, then again as the profile/E2E key becomes readable
      evaluate();
      setTimeout(evaluate, 250);
      setTimeout(evaluate, 900);
      setTimeout(evaluate, 2000);
      try {
        document.addEventListener('DOMContentLoaded', evaluate);
        window.addEventListener('sy-e2e-ready', evaluate);
      } catch (e) {}
    }
  } catch (e) {}

  // ---- school-managed profile bridge (runs on every guarded page) ----
  // My School and the private account stay separate surfaces, but they share
  // data in the background: a private student manages their own year group;
  // once a school links them, the school's managed fields (year group) flow
  // into the personal profile store here, so every tool — planner,
  // diagnostics, predicted grades, exams — uses the school's value without
  // the student having to visit or re-save their profile.
  try {
    if (s.role === 'student') {
      // publish the parent link code to the backend directory on EVERY student
      // page (not only /account/), so a parent on another device can always
      // resolve it — and generate one if the account never had it yet.
      if (!s.demo) {
        var _pc = window.SY.get('parentCode', null);
        if (!_pc) { _pc = String(Math.floor(10000000 + Math.random() * 90000000)); window.SY.set('parentCode', _pc); }
        window.SY.publishCode(_pc, 'account');
      }
      var _semail = (s.email || '').toLowerCase();
      for (var _si = 0; _si < localStorage.length; _si++) {
        var _sk = localStorage.key(_si);
        var _sm = _sk && _sk.match(/^sy-school:([^:]+):roster$/);
        if (!_sm) continue;
        var _roster = window.SY.schoolGet(_sm[1], 'roster', []) || [];
        var _onRoll = false;
        for (var _ri = 0; _ri < _roster.length; _ri++) {
          if (String(_roster[_ri].email || '').toLowerCase() === _semail) { _onRoll = true; break; }
        }
        if (!_onRoll) continue;
        var _mg = window.SY.schoolGet(_sm[1], 'managed:' + _semail, {}) || {};
        if (_mg.level) {
          var _prof = window.SY.get('profile', {}) || {};
          if (_prof.level !== _mg.level) { _prof.level = _mg.level; window.SY.set('profile', _prof); }
        }
        break;
      }
    }
  } catch (e) {}

  // ---- school directory bridge (runs on every guarded school page) ----
  // The join code is the school's share code: published to the backend
  // directory so a student on any device can link to it, and students who
  // linked from elsewhere are pulled onto the same-device roster here — so
  // every school console (people, students, analytics…) sees them.
  try {
    if ((s.role === 'school' || s.role === 'teacher') && !s.demo) {
      var _scode = window.SY.get('schoolCode', null);
      if (_scode && s.role === 'school') window.SY.publishCode(_scode, 'school');
      window.SY.myLinks().then(function (g) {
        if (!g || !g.inbound || !_scode) return;
        var _r = window.SY.schoolGet(_scode, 'roster', []) || [], _add = false;
        g.inbound.filter(function (l) { return l.relation === 'student'; }).forEach(function (l) {
          if (l.email && !_r.some(function (x) { return String(x.email).toLowerCase() === String(l.email).toLowerCase(); })) {
            _r.push({ email: l.email, name: l.name || String(l.email).split('@')[0], year: '' }); _add = true;
          }
        });
        if (_add) window.SY.schoolSet(_scode, 'roster', _r);
      }).catch(function () {});
    }
  } catch (e) {}

  // ---- gentle self-healing connectivity indicator ----
  // The OS never blames the user's network or tells them to switch. On the
  // production domain we use the same-origin proxy, so real sign-in / linking /
  // sync / AI calls work without the client ever reaching Google directly. If a
  // background health check can't be confirmed, we show a small, calm
  // "reconnecting" pill (bottom, not a scary top bar), keep retrying quietly,
  // and remove it the moment connectivity is confirmed. Work is saved locally
  // and syncs automatically — so a blip is never a dead end.
  try {
    if (!s.demo) {
      var _pill = null, _retryTimer = null, _tries = 0;
      var removePill = function () {
        if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null; }
        _tries = 0;
        if (_pill) { _pill.remove(); _pill = null; }
      };
      var scheduleRetry = function () {
        if (_retryTimer) return;
        var delay = Math.min(30000, 3000 * Math.pow(1.6, Math.min(_tries, 6)));
        _retryTimer = setTimeout(function () {
          _retryTimer = null; _tries++;
          try {
            if (window.SYCloud && SYCloud.reconnect) {
              Promise.resolve(SYCloud.reconnect()).then(function () {
                if (window.__SYCLOUD_UP === false) scheduleRetry();
              });
            } else { scheduleRetry(); }
          } catch (e) { scheduleRetry(); }
        }, delay);
      };
      var showPill = function () {
        if (_pill) return;
        _pill = document.createElement('div');
        _pill.id = 'sy-cloud-pill';
        _pill.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;' +
          'background:rgba(17,24,39,.92);color:#E5EDF7;border:1px solid rgba(148,163,184,.28);' +
          'font:600 12.5px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
          'padding:9px 14px;border-radius:999px;box-shadow:0 6px 22px rgba(0,0,0,.32);display:flex;align-items:center;gap:9px;max-width:calc(100vw - 24px)';
        _pill.innerHTML = '<span style="width:9px;height:9px;border-radius:50%;background:#F5B301;box-shadow:0 0 0 0 rgba(245,179,1,.6);animation:syPulse 1.6s infinite;flex:none"></span>' +
          '<span>Reconnecting to StudYear… your work is saved and will sync automatically.</span>';
        try {
          var st = document.createElement('style');
          st.textContent = '@keyframes syPulse{0%{box-shadow:0 0 0 0 rgba(245,179,1,.55)}70%{box-shadow:0 0 0 7px rgba(245,179,1,0)}100%{box-shadow:0 0 0 0 rgba(245,179,1,0)}}';
          document.head.appendChild(st);
        } catch (e) {}
        (document.body || document.documentElement).appendChild(_pill);
        scheduleRetry();
      };
      window.addEventListener('sy-cloud-status', function (e) {
        if (!e.detail) return;
        if (e.detail.up === false) showPill();
        else removePill();                 // up === true OR null (unknown/optimistic) → all clear
      });
      // React only to a definite "down"; optimistic/unknown stays silent.
      if (window.__SYCLOUD_UP === false) showPill();
    }
  } catch (e) {}

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
      rs.textContent = 'img{max-width:100%;height:auto}.sy-scroll,table.sy-scroll{display:block;max-width:100%;overflow-x:auto}' +
        // grid/flex children default to min-width:auto, so one wide child (chart,
        // table, long word) forces the whole console wider than a phone screen —
        // let console grid cells shrink and wrap instead of overflowing
        '.grid>*,.two>*,.three>*{min-width:0}';
      head.appendChild(rs);
    }
    // Keep a signed-in student's parent-link code registered in the backend on
    // EVERY page they load — not just /account/. Students now live in the study
    // hub and may never open the account page, so without this their code was
    // never published and a parent (or school/tutor) always got "invalid code".
    // Once per tab session; publishCode itself retries until the cloud token
    // settles, no-ops for demo, and de-dupes server-side.
    try {
      if (s && s.role === 'student' && s.email && !s.demo && window.SY &&
          !sessionStorage.getItem('sy-code-pub')) {
        var _pc = window.SY.get('parentCode', null);
        if (!_pc) { _pc = String(Math.floor(10000000 + Math.random() * 90000000)); window.SY.set('parentCode', _pc); }
        window.SY.publishCode(_pc, 'account');
        try { sessionStorage.setItem('sy-code-pub', '1'); } catch (e) {}
      }
    } catch (e) {}
    // register the offline/install service worker (scope-relative so / and /StudYear/ both work)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(function () {});
      // when a NEW worker replaces the one that was controlling this page, the
      // markup on screen was styled by the previous deploy's cached CSS —
      // refresh once so HTML+CSS match. hadController distinguishes an update
      // from the first-ever install (claim() fires controllerchange there too).
      var hadController = !!navigator.serviceWorker.controller;
      var reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController || reloaded || !navigator.serviceWorker.controller) return;
        if (!sessionStorage.getItem('sy-sw-reloaded')) {
          reloaded = true; sessionStorage.setItem('sy-sw-reloaded', '1'); location.reload();
        }
      });
    }
  } catch (e) {}
})();
