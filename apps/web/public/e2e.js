/* StudYear end-to-end encryption layer (window.SYE2E).
 *
 * Model:
 *  - Every account gets a random 256-bit DATA KEY. All personal data
 *    (sy-u:<email>:*) is sealed with it (XSalsa20-Poly1305 via TweetNaCl —
 *    synchronous, so the SY.get/set API stays synchronous).
 *  - The data key is stored only WRAPPED, never in the clear at rest:
 *      wrapPw  — wrapped by a key derived from the user's PASSWORD
 *                (PBKDF2-SHA256, 150k iterations, per-account salt). This is
 *                the end-to-end property: the sync backend only ever receives
 *                wrapPw + ciphertext, so servers can never read user data.
 *      wrapDev — wrapped by this device's random device key, so linked local
 *                flows (parent↔child, teacher↔school, admin support) keep
 *                working on the user's own device. wrapDev NEVER leaves the
 *                device (the sync payload builder excludes it).
 *  - Envelope: {"__e2e":1,"v":1,"n":"<b64 nonce>","c":"<b64 box>"}.
 *  - Demo accounts are intentionally unencrypted (presentation data only).
 */
(function () {
  'use strict';
  var nacl = window.nacl;
  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function unb64(s) { var bin = atob(s), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function unutf8(u8) { return new TextDecoder().decode(u8); }

  function deviceKey() {
    var k = localStorage.getItem('sy-device-key');
    if (!k) { k = b64(nacl.randomBytes(32)); localStorage.setItem('sy-device-key', k); }
    return unb64(k);
  }
  function seal(u8, key) {
    var n = nacl.randomBytes(24);
    return { n: b64(n), c: b64(nacl.secretbox(u8, n, key)) };
  }
  function open(box, key) {
    try {
      var out = nacl.secretbox.open(unb64(box.c), unb64(box.n), key);
      return out || null;
    } catch (e) { return null; }
  }
  function rec(email) {
    try { return JSON.parse(localStorage.getItem('sy-e2e:' + email)) || null; } catch (e) { return null; }
  }

  /* PBKDF2 via WebCrypto — async, used only on the auth page at sign-in/up. */
  async function kdf(password, saltB64) {
    var mat = await crypto.subtle.importKey('raw', utf8(password), 'PBKDF2', false, ['deriveBits']);
    var bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: 150000 }, mat, 256);
    return new Uint8Array(bits);
  }

  /* Create (or unlock) the account's encryption record. Call with the
     password at sign-in/sign-up. Idempotent; rewraps if password changed. */
  async function setupAccount(email, password) {
    if (!nacl || !email || !password) return false;
    var r = rec(email), dk = null;
    if (r) {
      dk = open(r.wrapDev, deviceKey());
      if (!dk) { var kek0 = await kdf(password, r.salt); dk = open(r.wrapPw, kek0); }
      if (!dk) { /* foreign record we can't unlock — start a fresh key */ r = null; }
    }
    if (!r) {
      dk = dk || nacl.randomBytes(32);
      r = { v: 1, salt: b64(nacl.randomBytes(16)) };
    }
    var kek = await kdf(password, r.salt);
    r.wrapPw = seal(dk, kek);
    r.wrapDev = seal(dk, deviceKey());
    localStorage.setItem('sy-e2e:' + email, JSON.stringify(r));
    sessionStorage.setItem('sy-dk:' + email, b64(dk));
    return true;
  }

  /* Resolve an account's data key on this device (session cache → device wrap). */
  function keyFor(email) {
    if (!nacl || !email) return null;
    var s = sessionStorage.getItem('sy-dk:' + email);
    if (s) return unb64(s);
    var r = rec(email);
    if (!r || !r.wrapDev) return null;
    var dk = open(r.wrapDev, deviceKey());
    if (dk) try { sessionStorage.setItem('sy-dk:' + email, b64(dk)); } catch (e) {}
    return dk;
  }

  function enabled(email) { return !!keyFor(email); }

  /* JSON value <-> envelope string */
  function encryptValue(value, email) {
    var k = keyFor(email);
    if (!k) return null;
    var e = seal(utf8(JSON.stringify(value)), k);
    return JSON.stringify({ __e2e: 1, v: 1, n: e.n, c: e.c });
  }
  function decryptValue(raw, email) {
    var env; try { env = JSON.parse(raw); } catch (e) { return { ok: false }; }
    if (!env || env.__e2e !== 1) return { ok: false, plain: env };
    var k = keyFor(email);
    if (!k) return { ok: false, locked: true };
    var u8 = open(env, k);
    if (!u8) return { ok: false, locked: true };
    try { return { ok: true, value: JSON.parse(unutf8(u8)) }; } catch (e) { return { ok: false, locked: true }; }
  }
  function isEnvelope(raw) {
    return typeof raw === 'string' && raw.indexOf('"__e2e":1') > 0;
  }

  /* Build the account's sync payload: ciphertext + wrapPw ONLY. wrapDev and
     the device key never leave this device — that is the E2E boundary the
     backend /sync endpoint enforces (it rejects any plaintext value). */
  function syncPayload(email) {
    var r = rec(email);
    var out = { email: email, e2e: r ? { v: r.v, salt: r.salt, wrapPw: r.wrapPw } : null, data: {} };
    var ns = 'sy-u:' + email + ':';
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(ns) === 0) {
        var raw = localStorage.getItem(k);
        if (isEnvelope(raw)) out.data[k.slice(ns.length)] = JSON.parse(raw);
      }
    }
    return out;
  }

  window.SYE2E = { setupAccount: setupAccount, keyFor: keyFor, enabled: enabled,
    encryptValue: encryptValue, decryptValue: decryptValue, isEnvelope: isEnvelope,
    syncPayload: syncPayload };

  /* guard.js loads us parser-blocking right after it defines window.SY —
     seal any pre-encryption plaintext for the signed-in account now. */
  try { if (window.SY && window.SY._e2eMigrate) window.SY._e2eMigrate(); } catch (e) {}
})();
