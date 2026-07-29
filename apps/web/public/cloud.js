/* StudYear cloud bridge (window.SYCloud) — the go-live connector.
 *
 * Wires the static OS to the production backend WITHOUT changing how the OS
 * works offline:
 *  - AUTH    — Firebase Authentication (email/password) mirrors every local
 *              account, via the Identity Toolkit REST API (no SDK needed).
 *  - SYNC    — the account's end-to-end-encrypted payload (SYE2E.syncPayload:
 *              ciphertext + password-wrapped key ONLY) is pushed to the
 *              Functions /sync endpoint and pulled back on a new device.
 *              Servers never see plaintext or a usable key.
 *  - STORAGE — uploads land in Firebase Storage under uploads/<uid>/…,
 *              guarded by storage.rules.
 *
 * Activation: fetches firebase-config.json from the site root. While its
 * values are empty (the committed placeholder), every method is a silent
 * no-op and the OS behaves exactly as before — so this file is safe on
 * GitHub Pages, Vercel previews and offline installs alike.
 * Demo accounts never touch the cloud.
 */
(function () {
  'use strict';

  /* our own base path — cloud.js may load on pages without window.SY */
  var BASE = (function () {
    try {
      var src = (document.currentScript && document.currentScript.src) || '';
      return src ? src.replace(/cloud\.js.*$/, '') : '';
    } catch (e) { return ''; }
  })();

  var CFG = null;                       // {apiKey, projectId, storageBucket, apiBase}

  /* Same-origin proxy: on the production domain (Vercel), all Google/Firebase
     endpoints are reachable through /gapi/* rewrites, so a network that blocks
     googleapis.com / cloudfunctions.net (school filters, etc.) but allows
     studyear.com can still sign in, link, sync and use AI — the browser never
     talks to a Google hostname; Vercel makes that hop server-side. Probed once;
     falls back to calling Google directly (GitHub Pages / offline / dev). */
  var GAPI = null;                      // { idt, sec, fn, st } base paths, or null = direct
  var CLOUD_UP = null;                  // null=unknown, true reachable, false unreachable
  function publishStatus() {
    try { window.__SYCLOUD_UP = CLOUD_UP; window.dispatchEvent(new CustomEvent('sy-cloud-status', { detail: { up: CLOUD_UP } })); } catch (e) {}
  }
  function useProxy() {
    GAPI = { idt: '/gapi/idt', sec: '/gapi/sec', fn: '/gapi/fn', st: '/gapi/storage' };
    try { window.__SYGAPI = GAPI; } catch (e) {}
  }
  function isProdHost() {
    var h = location.hostname || '';
    return /(^|\.)studyear\.com$/.test(h) || /\.vercel\.app$/.test(h);
  }
  function directHealth() {
    if (!(CFG && CFG.apiBase)) { CLOUD_UP = false; return; }
    return fetch(CFG.apiBase.replace(/\/$/, '') + '/health', { cache: 'no-store' })
      .then(function (r) { CLOUD_UP = !!r.ok; }).catch(function () { CLOUD_UP = false; });
  }
  /* Confirm the same-origin proxy in the BACKGROUND — never a gate. The page
     already loaded from this origin, so /gapi/* is reachable and Vercel makes
     the Google hop server-side; real sign-in / linking / sync / AI calls work
     even if this health check 404s or cold-starts. We retry quietly, and only
     the status flag (for a soft "reconnecting" hint) depends on it. */
  function verifyProxy(tries) {
    return fetch('/gapi/fn/health', { cache: 'no-store' })
      .then(function (r) {
        if (r.ok) { CLOUD_UP = true; publishStatus(); return; }
        throw new Error('probe ' + r.status);
      })
      .catch(function () {
        if (tries > 1) {
          return new Promise(function (res) { setTimeout(res, 2000); })
            .then(function () { return verifyProxy(tries - 1); });
        }
        /* Health unconfirmed after retries. The health function is optional —
           real sign-in / linking / sync / AI still route through the same-origin
           proxy. So we DON'T probe Google directly (the very host a filtered
           network blocks); we leave status "unknown" and stay optimistic. */
        CLOUD_UP = null; publishStatus();
      });
  }
  function isLocalHost() {
    var h = location.hostname || '';
    return h === 'localhost' || h === '127.0.0.1' || h === '' || h === '0.0.0.0' || /\.local$/.test(h);
  }
  /* VALIDATE the same-origin /gapi proxy actually reaches Google before we
     commit auth/linking/sync to it. If the Vercel rewrite is live we get a
     Google JSON error body back; if it isn't (Vercel's own 404 — HTML/non-JSON)
     we fall back to calling Google DIRECTLY (gbase() with GAPI=null), which
     works whenever the network allows googleapis.com. This makes auth work
     regardless of whether the proxy rewrite is deployed, and never forces
     traffic down a broken proxy path. */
  function validateProxy() {
    var key = (CFG && CFG.apiKey) || 'x';
    return fetch('/gapi/idt/v1/accounts:signUp?key=' + encodeURIComponent(key),
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var reaches = false;
        try { var j = JSON.parse(t); reaches = !!(j && j.error && j.error.message); } catch (e) {}
        if (reaches) { useProxy(); CLOUD_UP = true; }   // proxy routes to Google → use it
        else { GAPI = null; CLOUD_UP = null; }           // rewrite missing → call Google directly
        publishStatus();
      })
      .catch(function () { GAPI = null; CLOUD_UP = null; publishStatus(); }); // → direct
  }
  function probeProxy() {
    // Localhost / dev / file: stay silent (status unknown) — no probes, no pill.
    if (isLocalHost()) return Promise.resolve();
    // Production / Vercel previews carry the /gapi rewrites — validate then use
    // proxy-or-direct. Other hosts (GitHub Pages backup): call Google directly.
    if (isProdHost()) return validateProxy();
    return Promise.resolve(directHealth()).then(publishStatus);
  }
  /* Re-check connectivity on demand (e.g. the browser comes back online). */
  function reconnect() {
    if (isProdHost()) return validateProxy();
    return Promise.resolve(directHealth()).then(publishStatus);
  }
  try {
    window.addEventListener('online', function () { reconnect(); });
  } catch (e) {}
  function gbase(kind) {
    if (GAPI) return GAPI[kind];
    return ({ idt: 'https://identitytoolkit.googleapis.com', sec: 'https://securetoken.googleapis.com',
      fn: CFG && CFG.apiBase ? CFG.apiBase.replace(/\/$/, '') : '', st: 'https://firebasestorage.googleapis.com' })[kind];
  }

  var CFG_READY = fetchConfig().then(function (cfg) { return probeProxy().then(function () { return cfg; }); });

  function fetchConfig() {
    return fetch(BASE + 'firebase-config.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.apiKey && j.projectId && j.apiBase) {
          CFG = j;
          try { localStorage.setItem('sy-cloud-config', JSON.stringify(j)); } catch (e) {}
        } else if (!j || !j.apiKey) {
          /* placeholder or missing file — fall back to a cached copy (offline PWA) */
          try {
            var c = JSON.parse(localStorage.getItem('sy-cloud-config'));
            if (c && c.apiKey && c.projectId && c.apiBase) CFG = c;
          } catch (e) {}
        }
        return CFG;
      })
      .catch(function () {
        try {
          var c = JSON.parse(localStorage.getItem('sy-cloud-config'));
          if (c && c.apiKey && c.projectId && c.apiBase) CFG = c;
        } catch (e) {}
        return CFG;
      });
  }

  function ready() { return !!CFG; }
  function whenReady() { return CFG_READY; }

  function timeout(ms) { return new Promise(function (_, rej) { setTimeout(function () { rej(new Error('cloud timeout')); }, ms); }); }
  function race(p, ms) { return Promise.race([p, timeout(ms || 6000)]); }

  /* ------------------------------------------------ token store ---------- */
  function toks() { try { return JSON.parse(localStorage.getItem('sy-cloud-tok')) || {}; } catch (e) { return {}; } }
  function saveTok(email, t) {
    var all = toks();
    all[email] = { uid: t.localId || t.user_id || (all[email] && all[email].uid),
      idToken: t.idToken || t.id_token, refreshToken: t.refreshToken || t.refresh_token,
      exp: Date.now() + (parseInt(t.expiresIn || t.expires_in || '3600', 10) - 120) * 1000 };
    try { localStorage.setItem('sy-cloud-tok', JSON.stringify(all)); } catch (e) {}
    return all[email];
  }

  function idpAt(base, action, body) {
    return fetch(base + '/v1/accounts:' + action + '?key=' + encodeURIComponent(CFG.apiKey), {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error((j.error && j.error.message) || 'auth failed'); e.authError = true; throw e; } return j; }); });
  }
  /* A rejection from idpAt is either a real auth error (marked authError — the
     server answered, e.g. INVALID_PASSWORD) or a transport failure (fetch threw,
     e.g. a broken proxy rewrite / blocked host). Auth errors propagate; transport
     failures on the proxy retry the SAME call DIRECTLY against Google, which works
     on any network that allows googleapis.com — so a dead proxy never blocks sign-in. */
  function idp(action, body) {
    return idpAt(gbase('idt'), action, body).catch(function (e) {
      if (!e || e.authError) throw e;                 // real auth error — surface it
      if (!GAPI) throw e;                              // already direct — nothing to fall back to
      return idpAt('https://identitytoolkit.googleapis.com', action, body);
    });
  }

  /** valid ID token for the account, refreshing when expired; null if none.
      The refresh retries directly against Google if the proxy transport fails,
      mirroring idp() — a broken proxy must not silently invalidate the session. */
  function refreshAt(base, refreshToken) {
    return fetch(base + '/v1/token?key=' + encodeURIComponent(CFG.apiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(refreshToken)
    });
  }
  async function token(email) {
    if (!CFG) return null;
    var t = toks()[email];
    if (!t || !t.refreshToken) return null;
    if (t.idToken && Date.now() < t.exp) return t.idToken;
    try {
      var r;
      try { r = await refreshAt(gbase('sec'), t.refreshToken); }
      catch (e) { if (!GAPI) throw e; r = await refreshAt('https://securetoken.googleapis.com', t.refreshToken); }
      if (!r.ok) return null;
      return saveTok(email, await r.json()).idToken;
    } catch (e) { return null; }
  }

  function apiAt(base, path, method, tk, body) {
    return fetch(base + path, {
      method: method || 'GET', keepalive: method === 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk },
      body: body ? JSON.stringify(body) : undefined
    });
  }
  async function api(path, method, body, email) {
    var tk = await token(email);
    if (!tk) throw new Error('not signed in to cloud');
    var direct = CFG && CFG.apiBase ? CFG.apiBase.replace(/\/$/, '') : '';
    var r;
    try { r = await apiAt(gbase('fn'), path, method, tk, body); }
    catch (e) { if (!GAPI || !direct) throw e; r = await apiAt(direct, path, method, tk, body); } // proxy dead → direct
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || ('api ' + r.status));
    return j;
  }

  /* --------------------------------------------------- auth -------------- */
  /** Mirror a local signup into Firebase Auth + the users collection.
      Same email, second role → the existing cloud account gains the role. */
  async function signUp(email, pw, name, role) {
    await whenReady(); if (!CFG) return false;
    var t;
    try { t = await race(idp('signUp', { email: email, password: pw, returnSecureToken: true })); }
    catch (e) {
      if (String(e.message).indexOf('EMAIL_EXISTS') < 0) return false;
      try { t = await race(idp('signInWithPassword', { email: email, password: pw, returnSecureToken: true })); }
      catch (e2) { return false; }
    }
    saveTok(email, t);
    try { await race(api('/register', 'POST', { name: name, role: role }, email)); } catch (e) {}
    /* welcome + verify email via Firebase's own delivery (no SMTP needed) */
    try { if (t && t.idToken) await race(idp('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: t.idToken })); } catch (e) {}
    schedulePush(email);
    return true;
  }

  /* password reset — Firebase sends the reset email through Google's mail
     infrastructure (works as soon as Email/Password auth is enabled). */
  async function resetPassword(email) {
    await whenReady(); if (!CFG) throw new Error('offline');
    await race(idp('sendOobCode', { requestType: 'PASSWORD_RESET', email: email }));
    return true;
  }
  /* resend the verification email for the signed-in account */
  async function sendVerify(email) {
    await whenReady(); if (!CFG) throw new Error('offline');
    var tk = await token(email); if (!tk) throw new Error('sign in first');
    await race(idp('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: tk }));
    return true;
  }

  async function signIn(email, pw) {
    await whenReady(); if (!CFG) return false;
    try {
      saveTok(email, await race(idp('signInWithPassword', { email: email, password: pw, returnSecureToken: true })));
      schedulePush(email);
      return true;
    } catch (e) { return false; }
  }

  /* Diagnostic reconnect: sign in, and if the account was never mirrored to the
     cloud, provision it — returning WHY it failed instead of a single opaque
     boolean. This lets the UI tell a genuinely-wrong password apart from a
     server/network problem apart from a cloud password that drifted from the
     local one — the three cases the old signIn collapsed into "wrong password".
       -> { ok:true, reason:'signed_in'|'provisioned' }
       -> { ok:false, reason:'offline'|'network'|'wrong_password'|'weak_password' } */
  async function reauth(email, pw) {
    await whenReady();
    if (!CFG) return { ok: false, reason: 'offline' };
    try {
      saveTok(email, await race(idp('signInWithPassword', { email: email, password: pw, returnSecureToken: true })));
      schedulePush(email);
      return { ok: true, reason: 'signed_in' };
    } catch (e) {
      var m = String((e && e.message) || '');
      if (/INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS|MISSING_PASSWORD/.test(m)) return { ok: false, reason: 'wrong_password' };
      if (/EMAIL_NOT_FOUND/.test(m)) {
        // account exists locally but was never created in the cloud — make it now
        try {
          saveTok(email, await race(idp('signUp', { email: email, password: pw, returnSecureToken: true })));
          try { await race(api('/register', 'POST', { name: '', role: '' }, email)); } catch (e2) {}
          try { schedulePush(email); } catch (e3) {}
          return { ok: true, reason: 'provisioned' };
        } catch (e4) {
          var m2 = String((e4 && e4.message) || '');
          if (/EMAIL_EXISTS/.test(m2)) return { ok: false, reason: 'wrong_password' }; // race: exists w/ another pw
          if (/WEAK_PASSWORD/.test(m2)) return { ok: false, reason: 'weak_password' };
          return { ok: false, reason: 'network' };
        }
      }
      // cloud timeout / Failed to fetch / TypeError → transport, not a bad password
      return { ok: false, reason: 'network' };
    }
  }

  /* same digest the auth page and admin bulk-import use */
  async function pwHash(salt, pw) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '·' + pw));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  /** New device: sign in to the cloud, pull the E2E key record + ciphertext
      blobs into this browser, and recreate the local account entries. The
      data only becomes readable after SYE2E unwraps the key with the
      password — the pull itself moves ciphertext. */
  async function restore(email, pw) {
    await whenReady(); if (!CFG) return null;
    if (!(await signIn(email, pw))) return null;
    var j;
    try { j = await race(api('/syncPull', 'GET', null, email), 10000); } catch (e) { return null; }
    if (!j || !j.ok) return null;
    try {
      if (j.e2e && j.e2e.wrapPw && !localStorage.getItem('sy-e2e:' + email))
        localStorage.setItem('sy-e2e:' + email, JSON.stringify({ v: j.e2e.v || 1, salt: j.e2e.salt, wrapPw: j.e2e.wrapPw }));
      var data = j.data || {};
      for (var k in data) {
        var full = 'sy-u:' + email + ':' + k;
        if (localStorage.getItem(full) === null) localStorage.setItem(full, JSON.stringify(data[k]));
      }
      var user = j.user || {};
      var roles = user.roles || [];
      var users = []; try { users = JSON.parse(localStorage.getItem('sy-users')) || []; } catch (e) {}
      for (var i = 0; i < roles.length; i++) {
        if (users.some(function (u) { return u.email === email && u.role === roles[i]; })) continue;
        var salt = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        users.push({ name: user.name || email.split('@')[0], email: email, role: roles[i], salt: salt, hash: await pwHash(salt, pw) });
      }
      localStorage.setItem('sy-users', JSON.stringify(users));
      return user;
    } catch (e) { return null; }
  }

  /* --------------------------------------------------- sync -------------- */
  var pushTimer = null;
  function schedulePush(email) {
    if (!CFG || !email) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { push(email).catch(function () {}); }, 5000);
  }

  /** Push the account's encrypted payload. Refuses anything that is not the
      E2E contract (no key record → nothing to sync; demo → never). */
  async function push(email) {
    await whenReady(); if (!CFG || !email) return false;
    if (!window.SYE2E || !SYE2E.enabled(email)) return false;
    var payload = SYE2E.syncPayload(email);
    if (!payload.e2e || !payload.e2e.wrapPw) return false;
    try { await api('/sync', 'POST', payload, email); return true; } catch (e) { return false; }
  }

  /* ------------------------------------------------- storage ------------- */
  /** Upload a Blob/File to Firebase Storage under uploads/<uid>/<name>. */
  async function upload(name, blob, email) {
    await whenReady(); if (!CFG || !CFG.storageBucket) throw new Error('storage not configured');
    var tk = await token(email);
    var uid = (toks()[email] || {}).uid;
    if (!tk || !uid) throw new Error('not signed in to cloud');
    var object = 'uploads/' + uid + '/' + String(name).replace(/[^\w.\-]+/g, '_');
    var r = await fetch(gbase('st') + '/v0/b/' + CFG.storageBucket +
      '/o?uploadType=media&name=' + encodeURIComponent(object), {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'application/octet-stream', 'Authorization': 'Firebase ' + tk },
      body: blob
    });
    if (!r.ok) throw new Error('upload failed (' + r.status + ')');
    var j = await r.json();
    return { path: object, url: gbase('st') + '/v0/b/' + CFG.storageBucket +
      '/o/' + encodeURIComponent(object) + '?alt=media&token=' + (j.downloadTokens || '') };
  }

  /* ------------------------------------------------ link directory ------- */
  /* Cross-account / cross-device linking. A share code published by one
     account resolves on any other, and connecting records the link on both
     sides' server documents — so a parent on their phone links to a child on
     a laptop. All methods no-op / reject cleanly when the cloud is offline,
     letting the caller fall back to the same-device localStorage path. */
  async function dirPublish(code, kind, email) {
    await whenReady(); if (!CFG || !email) return false;
    try { await api('/directory', 'POST', { op: 'publish', code: code, kind: kind || 'account' }, email); return true; }
    catch (e) { return false; }
  }
  async function dirResolve(code, email) {
    await whenReady(); if (!CFG || !email) return null;
    try { var j = await api('/directory?op=resolve&code=' + encodeURIComponent(code), 'GET', null, email); return j && j.ok ? j : null; }
    catch (e) { return null; }
  }
  async function dirConnect(code, relation, email) {
    await whenReady(); if (!CFG || !email) return null;
    try { var j = await api('/directory', 'POST', { op: 'connect', code: code, relation: relation || 'parent' }, email); return j && j.ok ? j : null; }
    catch (e) { return null; }
  }
  async function dirDisconnect(uid, dir, email) {
    await whenReady(); if (!CFG || !email) return false;
    try { await api('/directory', 'POST', { op: 'disconnect', uid: uid, dir: dir || 'outbound' }, email); return true; }
    catch (e) { return false; }
  }
  async function dirLinks(email) {
    await whenReady(); if (!CFG || !email) return null;
    try { var j = await api('/directory?op=links', 'GET', null, email); return j && j.ok ? j : null; }
    catch (e) { return null; }
  }

  /* Pathways opportunities marketplace — cross-device. Read is any signed-in
     account; publish/remove are owner-only (enforced server-side). Returns null
     on offline/error so the caller falls back to the same-device cache. */
  async function marketList(filter, email) {
    await whenReady(); if (!CFG || !email) return null;
    filter = filter || {};
    var qs = 'op=list';
    if (filter.sector) qs += '&sector=' + encodeURIComponent(filter.sector);
    if (filter.ownerKind) qs += '&ownerKind=' + encodeURIComponent(filter.ownerKind);
    if (filter.mine) qs += '&mine=1';
    try { var j = await api('/market?' + qs, 'GET', null, email); return j && j.ok ? (j.items || []) : null; }
    catch (e) { return null; }
  }
  async function marketPublish(entry, email) {
    await whenReady(); if (!CFG || !email) return false;
    try { var j = await api('/market', 'POST', { op: 'publish', entry: entry }, email); return !!(j && j.ok); }
    catch (e) { return false; }
  }
  async function marketRemove(id, email) {
    await whenReady(); if (!CFG || !email) return false;
    try { var j = await api('/market', 'POST', { op: 'remove', id: id }, email); return !!(j && j.ok); }
    catch (e) { return false; }
  }

  window.SYCloud = { ready: ready, whenReady: whenReady, signUp: signUp, signIn: signIn, reauth: reauth,
    restore: restore, push: push, schedulePush: schedulePush, upload: upload, token: token,
    resetPassword: resetPassword, sendVerify: sendVerify,
    reachable: function () { return CLOUD_UP; }, reconnect: reconnect,
    dirPublish: dirPublish, dirResolve: dirResolve, dirConnect: dirConnect,
    dirDisconnect: dirDisconnect, dirLinks: dirLinks,
    marketList: marketList, marketPublish: marketPublish, marketRemove: marketRemove,
    /* redeem a StudYear bonus/promo code server-side (validated window/limits/
       audience, ledgered once per user, ACUs credited on the server). Resolves
       to { ok, bonusAcus, discountPct, label } or throws with the reason. */
    redeemCode: function (code, email) { return api('/redeemCode', 'POST', { code: String(code || '').trim() }, email); },
    /* redeem a gift code ("Fund a student from anywhere"): the server claims it
       exactly once and credits this account's wallet. Resolves to { ok, acus,
       from } or throws (not found / unpaid / already redeemed / wrong email). */
    redeemGift: function (code, email) { return api('/redeemGift', 'POST', { code: String(code || '').trim().toUpperCase() }, email); },
    /* create a Stripe Checkout Session on the server (price + plan set server-
       side, never trusted from the client) and resolve to { url } to redirect to.
       Throws if not signed in to cloud or payments aren't configured.
       opts.gift routes the purchase to fund someone else: pass { gift:true,
       giftCode, from, forEmail } and the webhook mints the code instead of
       crediting the buyer. */
    checkoutSession: function (planId, ref, opts, email) {
      opts = opts || {};
      return api('/createCheckout', 'POST', {
        planId: String(planId || ''), ref: ref != null ? String(ref) : undefined,
        successUrl: opts.successUrl, cancelUrl: opts.cancelUrl, promo: opts.promo,
        gift: opts.gift ? true : undefined, giftCode: opts.giftCode, from: opts.from, forEmail: opts.forEmail,
      }, email);
    },
    /* Synthesise real spoken audio server-side and resolve to an ArrayBuffer of
       MP3. Used for spelling dictation: the browser's speechSynthesis caps at
       device volume and is often too quiet, so the caller replays this through a
       Web Audio gain node to make it genuinely louder. Rejects if not signed in
       to cloud or speech isn't configured — the caller falls back to the
       built-in voice. */
    speak: async function (text, opts, email) {
      opts = opts || {};
      var tk = await token(email);
      if (!tk) throw new Error('not signed in to cloud');
      var direct = CFG && CFG.apiBase ? CFG.apiBase.replace(/\/$/, '') : '';
      var body = JSON.stringify({ text: String(text || ''), voice: opts.voice, speed: opts.speed });
      var hit = function (base) {
        return fetch(base + '/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk }, body: body });
      };
      var r;
      try { r = await hit(gbase('fn')); }
      catch (e) { if (!GAPI || !direct) throw e; r = await hit(direct); }
      if (!r.ok) { var j = await r.json().catch(function () { return {}; }); throw new Error(j.error || ('tts ' + r.status)); }
      return await r.arrayBuffer();
    } };

  /* ------------------------------------------- auto-sync hook ------------ */
  /* On consoles (guard.js present, real signed-in session): every store
     write schedules a debounced encrypted push, and each page load pushes
     once to catch changes made while offline. */
  function arm() {
    try {
      var s = window.SY && SY.session;
      if (!CFG || !s || !s.email || s.demo) return;
      ['set', 'writeAccount', 'log', 'schoolSet'].forEach(function (fn) {
        if (typeof SY[fn] !== 'function' || SY[fn].__cloud) return;
        var orig = SY[fn];
        SY[fn] = function () { var r = orig.apply(SY, arguments); schedulePush(s.email); return r; };
        SY[fn].__cloud = true;
      });
      schedulePush(s.email);
    } catch (e) {}
  }
  CFG_READY.then(function () {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
    else arm();
  });
})();
