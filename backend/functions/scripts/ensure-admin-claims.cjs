/*
 * Self-healing admin-lockout guard (runs inside the backend deploy).
 *
 * Guarantees every founding admin (ADMIN_EMAILS) carries the durable
 * { admin: true } Firebase custom claim, so the requireAdmin gate (custom claim
 * OR verified email) can never lock the owner out of their own console — which
 * is exactly what the P0 "verified email required" hardening did to accounts
 * that had neither a verified email nor the claim yet.
 *
 * Uses the deploy's own service-account credentials (GOOGLE_APPLICATION_CREDENTIALS).
 * Idempotent: skips accounts that already have the claim, and silently skips any
 * that don't exist yet. Touches ONLY the hardcoded allow-list, and never fails
 * the deploy (all errors are swallowed and logged).
 *
 * It deliberately does NOT revoke tokens — the owner picks up the claim on their
 * next fresh sign-in (or hourly token refresh), so this never force-logs-out a
 * live admin session.
 */
const fs = require('fs');
const admin = require('firebase-admin');

(async () => {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saPath || !fs.existsSync(saPath)) { console.log('[admin-claims] no service account — skipping'); return; }
  const emails = (process.env.ADMIN_EMAILS || 'jnnseya@gmail.com,jnbankwa@gmail.com,admin@studyear.com')
    .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  try {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(saPath, 'utf8'))) });
  } catch (e) { console.log(`[admin-claims] init failed (non-fatal): ${(e && e.message) || e}`); return; }
  const auth = admin.auth();
  let granted = 0, already = 0, missing = 0;
  for (const email of emails) {
    try {
      const u = await auth.getUserByEmail(email);
      if (u.customClaims && u.customClaims.admin === true) { already++; console.log(`[admin-claims] ${email}: already admin`); continue; }
      await auth.setCustomUserClaims(u.uid, Object.assign({}, u.customClaims, { admin: true }));
      granted++; console.log(`[admin-claims] ${email}: claim granted`);
    } catch (e) {
      if (String((e && e.code) || '').includes('user-not-found')) { missing++; console.log(`[admin-claims] ${email}: no account yet`); }
      else console.log(`[admin-claims] ${email}: ${(e && e.message) || e}`);
    }
  }
  console.log(`[admin-claims] done — granted=${granted} already=${already} missing=${missing}`);
})().catch((e) => { console.log(`[admin-claims] non-fatal: ${(e && e.message) || e}`); });
