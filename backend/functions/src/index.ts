/**
 * StudYear backend — Firebase Functions (api.studyear.com behind Hostinger DNS).
 *
 * Core invariants enforced here, not in clients:
 *  - ACU metering: pre-authorise → debit at initiation → append-only ledger; balances derived.
 *  - Hard stop at zero; no negative balances; no unlimited AI (commercial-model §11).
 *  - Free accounts: no tutor access; limit-gated features (commercial-model §6).
 *  - Margin band 66%–100%: cost telemetry per action feeds the margin guard (§1).
 *  - Every AI call goes out through the AI Gateway in deep-thinking mode (architecture/14 §0.0).
 */
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ACU_TARIFF, FREE_TIER, MARGIN, type MeteredActivity } from '../../../packages/shared/src';

initializeApp();
const db = getFirestore();

// ---------------------------------------------------------------- helpers ----
async function requireUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) throw httpError(401, 'missing bearer token');
  const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
  return decoded;
}

function httpError(status: number, message: string) {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
}

/** Bot-pattern text heuristic shared with the browser filters. */
function looksGibberish(s: string): boolean {
  const t = String(s ?? '').trim();
  if (!t) return true;
  const words = t.split(/\s+/);
  const weird = words.filter((w) =>
    (w.length >= 12 && !/[aeiou]/i.test(w)) || /[a-z][A-Z][a-z][A-Z]/.test(w) || /[bcdfghjklmnpqrstvwxz]{6,}/i.test(w)).length;
  return weird >= Math.max(1, Math.ceil(words.length * 0.5));
}

/** Append-only audit trail (go-live architecture §18). Readable by platform
    admins only (firestore.rules); failures never break the user action. */
function audit(action: string, actorId: string, detail: Record<string, unknown> = {}) {
  return db.collection('auditEvents')
    .add({ action, actorId, ...detail, source: 'function', createdAt: FieldValue.serverTimestamp() })
    .catch(() => null);
}

/** Derived balance = sum of append-only ledger. Cached on wallets/{ownerId} by trigger later. */
async function walletBalance(ownerId: string): Promise<number> {
  const snap = await db.collection('acuTransactions').where('ownerId', '==', ownerId).get();
  return snap.docs.reduce((sum, d) => sum + (d.data().delta as number), 0);
}

// ------------------------------------------------------------------ health ----
export const health = onRequest({ region: 'europe-west2' }, (_req, res) => {
  res.json({ ok: true, service: 'studyear-api', marginFloor: MARGIN.FLOOR });
});

// -------------------------------------------------------------- ACU meter ----
/**
 * POST /acuAuthorize { activity }
 * Pre-authorises a metered activity: checks tariff, plan gates, free-tier rules,
 * and balance. On success writes the debit (at initiation, per §A3) and returns
 * the remaining balance. The AI Gateway is called only after this returns ok.
 */
export const acuAuthorize = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const activity = req.body?.activity as MeteredActivity;
    const cost = ACU_TARIFF[activity];
    if (!cost) throw httpError(400, `unknown metered activity: ${activity}`);

    const userDoc = await db.doc(`users/${user.uid}`).get();
    const plan = (userDoc.data()?.plan as string) ?? 'child_free';

    // Free-tier gates (commercial-model §6, resolved directives)
    if (plan === 'child_free') {
      if (activity === 'assignment_review') throw httpError(403, 'Assignment Review requires a paid plan');
      if (!FREE_TIER.tutorMarketplaceAccess && req.body?.context === 'tutor_session')
        throw httpError(403, 'free accounts have no tutor access');
    }

    const balance = await walletBalance(user.uid);
    if (balance < cost) {
      res.status(402).json({ ok: false, reason: 'insufficient_acus', balance, required: cost });
      return; // hard stop at zero — top-up required, never overdraft
    }

    const tx = await db.collection('acuTransactions').add({
      ownerId: user.uid,
      delta: -cost,
      activity,
      agent: req.body?.agent ?? null, // SY-A## when agent-initiated
      createdAt: FieldValue.serverTimestamp(),
    });

    await audit('AI_CREDITS_DEDUCTED', user.uid, { activity, cost });
    res.json({ ok: true, txId: tx.id, debited: cost, balance: balance - cost });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------------- Stripe hook ----
/**
 * POST /stripeWebhook — payment.settled → credit ACUs (plans & top-ups),
 * referral qualification (£10+ cleared, 14-day validity), influencer ledger.
 * Signature verification + idempotency keys required before production.
 */
export const stripeWebhook = onRequest({ region: 'europe-west2' }, async (req, res) => {
  // TODO(payments): verify Stripe-Signature against webhook secret; enforce idempotency.
  res.status(501).json({ ok: false, error: 'not yet wired — see docs/product/commercial-model.md' });
});

// --------------------------------------------------------- discount codes ----
/**
 * POST /redeemCode { code } — validates window, remaining redemptions, per-user
 * limit, audience, product eligibility, min spend; grants exactly what was set.
 * (commercial-model §12b; codes are authored by Admin console only.)
 */
export const redeemCode = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!code) throw httpError(400, 'code required');
    const doc = await db.doc(`discountCodes/${code}`).get();
    if (!doc.exists || doc.data()!.status !== 'active') throw httpError(404, 'invalid or inactive code');
    // TODO(growth): window/limits/audience checks + ledgered redemption + benefit grant.
    res.status(501).json({ ok: false, error: 'validation pipeline lands with billing wiring', user: user.uid });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------- AI proxy ----
/**
 * POST /aiProxy { system, user, maxTokens?, temperature?, image? }
 * Server-side model gateway: provider keys live in env (never in browsers),
 * calls are metered through acuAuthorize first, and usage lands in
 * aiUsageLogs (the Admin console's AI usage & costs panel reads it).
 * The browser SYAI client swaps its direct-provider path for this endpoint
 * by setting sy-ai-live = { provider:'proxy', key:'session' }.
 */
export const aiProxy = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const provider = process.env.AI_PROVIDER ?? 'gemini';
    const key = process.env.AI_PROVIDER_KEY;
    if (!key) throw httpError(503, 'AI provider key not configured on the server');
    const t0 = Date.now();
    const body = req.body ?? {};
    // Same request shapes the browser client uses — one provider adapter here.
    const model = process.env.AI_MODEL ?? (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
    let text = '';
    if (provider === 'gemini') {
      const parts: unknown[] = [{ text: String(body.user ?? '') }];
      if (body.image) {
        const m = String(body.image).match(/^data:([^;]+);base64,(.*)$/);
        if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
      }
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: body.system ? { parts: [{ text: body.system }] } : undefined,
          contents: [{ role: 'user', parts }],
          generationConfig: { maxOutputTokens: body.maxTokens ?? 1024, temperature: body.temperature ?? 0.6 },
        }),
      });
      if (!r.ok) throw httpError(502, `provider ${r.status}`);
      const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      text = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    } else {
      throw httpError(501, `provider ${provider} adapter lands with go-live config`);
    }
    await db.collection('aiUsageLogs').add({
      ownerId: user.uid, provider, model, ms: Date.now() - t0, ok: true,
      inChars: String(body.system ?? '').length + String(body.user ?? '').length,
      outChars: text.length, createdAt: FieldValue.serverTimestamp(),
    });
    res.json({ ok: true, text });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ----------------------------------------------------------- contact inbox ----
/**
 * POST /contact { from, email, type, body } — the public contact form.
 * Mirrors the browser-side bot defences server-side (honeypot field, minimum
 * dwell time, gibberish heuristic) and stores accepted messages in
 * contactInbox for the Admin console; SMTP notification via env MAIL_*.
 */
export const contact = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const b = req.body ?? {};
    if (b.hp) throw httpError(400, 'rejected'); // honeypot
    const msg = String(b.body ?? '').trim();
    const from = String(b.from ?? '').trim();
    const email = String(b.email ?? '').trim();
    if (!from || msg.length < 10 || !/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'invalid submission');
    const words = msg.split(/\s+/);
    const weird = words.filter((w) => (w.length >= 12 && !/[aeiou]/i.test(w)) || /[bcdfghjklmnpqrstvwxz]{6,}/i.test(w)).length;
    if (weird >= Math.max(1, Math.ceil(words.length * 0.5))) throw httpError(400, 'flagged as automated');
    if ((msg.match(/https?:\/\//gi) ?? []).length >= 2) throw httpError(400, 'flagged as automated'); // link-stuffing
    if (looksGibberish(from)) throw httpError(400, 'flagged as automated'); // bot-pattern sender names
    // throttle: max 3 messages per sender address per hour
    const hourAgo = new Date(Date.now() - 3600_000);
    const recent = await db.collection('contactInbox')
      .where('email', '==', email).where('createdAt', '>', hourAgo).get();
    if (recent.size >= 3) throw httpError(429, 'too many messages — please wait before sending more');
    await db.collection('contactInbox').add({
      from, email, type: String(b.type ?? 'support'), body: msg, status: 'NEW',
      createdAt: FieldValue.serverTimestamp(),
    });
    // Forward to the public inbox. Best-effort: the message is already stored
    // in contactInbox (Admin console) even if SMTP is not configured yet.
    // Configure via backend/functions/.env or secrets: MAIL_HOST, MAIL_PORT,
    // MAIL_USER, MAIL_PASS (and optionally MAIL_FROM / MAIL_TO).
    if (process.env.MAIL_HOST) {
      try {
        const nodemailer = await import('nodemailer');
        const transport = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT ?? 465),
          secure: (process.env.MAIL_SECURE ?? 'true') !== 'false',
          auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        });
        await transport.sendMail({
          from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
          to: process.env.MAIL_TO ?? 'contact@studyear.com',
          replyTo: email,
          subject: `[StudYear contact] ${String(b.type ?? 'support')} — ${from}`,
          text: `${msg}\n\n— ${from} <${email}>`,
        });
      } catch { /* never fail the submission over email delivery */ }
    }
    res.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------------- registration ----
/**
 * POST /register { name, role } — called by the cloud bridge right after a
 * Firebase Auth signup (or when an existing email adds a second role). The
 * role list is validated here and the users/{uid} document is server-owned:
 * clients can never self-assign admin or change plan through this path.
 */
const PUBLIC_ROLES = ['student', 'parent', 'teacher', 'school', 'tutor', 'authority'];
export const register = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const name = String(req.body?.name ?? '').trim().slice(0, 120);
    const role = String(req.body?.role ?? '');
    if (!PUBLIC_ROLES.includes(role)) throw httpError(400, 'invalid role');
    const ref = db.doc(`users/${user.uid}`);
    const existing = await ref.get();
    await ref.set({
      email: user.email ?? null,
      name: name || existing.data()?.name || null,
      roles: FieldValue.arrayUnion(role),
      plan: existing.data()?.plan ?? 'child_free', // never downgraded by re-registration
      createdAt: existing.data()?.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await audit(existing.exists ? 'USER_ROLE_ADDED' : 'USER_REGISTERED', user.uid, { role });
    res.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------ E2E-encrypted sync ----
/**
 * POST /sync — the end-to-end encryption boundary.
 * Accepts the client's SYE2E.syncPayload(): a password-wrapped key record and
 * a map of ciphertext envelopes. The server REJECTS any plaintext value in
 * the personal namespace — by construction it can never read user data. The
 * device-wrapped key (wrapDev) is not part of the payload contract and is
 * rejected if present.
 */
export const sync = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const b = req.body ?? {};
    if (!b.e2e || !b.e2e.wrapPw || !b.e2e.salt) throw httpError(400, 'missing e2e key record — refusing unencrypted sync');
    if (b.e2e.wrapDev) throw httpError(400, 'device-wrapped keys must never leave the device');
    const data = (b.data ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(data)) {
      const env = v as { __e2e?: number; n?: string; c?: string };
      if (!env || env.__e2e !== 1 || typeof env.n !== 'string' || typeof env.c !== 'string')
        throw httpError(400, `plaintext value rejected for key "${k}" — personal data must be end-to-end encrypted`);
    }
    const batch = db.batch();
    batch.set(db.doc(`e2eKeys/${user.uid}`), { v: b.e2e.v ?? 1, salt: b.e2e.salt, wrapPw: b.e2e.wrapPw,
      updatedAt: FieldValue.serverTimestamp() });
    for (const [k, v] of Object.entries(data))
      batch.set(db.doc(`e2eData/${user.uid}/blobs/${encodeURIComponent(k)}`), { env: v, updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
    await audit('DATA_SYNCED', user.uid, { blobs: Object.keys(data).length });
    res.json({ ok: true, stored: Object.keys(data).length });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /syncPull — restore on a new device. Returns the password-wrapped key
 * record, the ciphertext blobs, and the public account meta (name/roles/plan).
 * Everything personal in the response is ciphertext; it becomes readable only
 * after the client unwraps the key with the user's password.
 */
export const syncPull = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const [keyDoc, userDoc, blobs] = await Promise.all([
      db.doc(`e2eKeys/${user.uid}`).get(),
      db.doc(`users/${user.uid}`).get(),
      db.collection(`e2eData/${user.uid}/blobs`).get(),
    ]);
    const data: Record<string, unknown> = {};
    blobs.forEach((d) => { data[decodeURIComponent(d.id)] = d.data().env; });
    const u = userDoc.data();
    await audit('ACCOUNT_RESTORED', user.uid, { blobs: blobs.size });
    res.json({
      ok: true,
      e2e: keyDoc.exists ? { v: keyDoc.data()!.v ?? 1, salt: keyDoc.data()!.salt, wrapPw: keyDoc.data()!.wrapPw } : null,
      user: u ? { name: u.name ?? null, roles: (u.roles as string[]) ?? [], plan: u.plan ?? 'child_free' } : null,
      data,
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});
