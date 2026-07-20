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
// build marker: bump to force firebase-tools to redeploy (env-only .env changes
// like a rotated STRIPE_WEBHOOK_SECRET don't re-trigger it on their own) — sw-secret-sync-2
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createHmac, timingSafeEqual } from 'crypto';
import { ACU_TARIFF, FREE_TIER, MARGIN, ACU_PER_POUND,
  STUDENT_PLANS, PARENT_PLANS, SCHOOL_PLANS, TOPUPS, type MeteredActivity } from '../../../packages/shared/src';

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
 * The purchasable catalogue, derived from the shared source of truth: every
 * plan (subscription) and every top-up (one-off pack), keyed by its id. The
 * webhook credits `acus` on purchase and, for subscriptions, refills them on
 * each renewal cycle. Single source → the checkout UI, the plans pages and the
 * server can never drift on how many ACUs a purchase is worth.
 */
type CatalogItem = { acus: number; kind: 'subscription' | 'topup'; audience?: string; pence: number };
const STRIPE_CATALOG: Record<string, CatalogItem> = (() => {
  const m: Record<string, CatalogItem> = {};
  for (const p of [...STUDENT_PLANS, ...PARENT_PLANS, ...SCHOOL_PLANS])
    m[p.id] = { acus: p.acus, kind: 'subscription', audience: p.audience, pence: p.monthlyPence };
  for (const t of TOPUPS) m[t.id] = { acus: t.acus, kind: 'topup', pence: t.pence };
  return m;
})();

/**
 * Verify the `Stripe-Signature` header WITHOUT the Stripe SDK: parse the
 * `t=<ts>,v1=<sig>` scheme, recompute HMAC-SHA256 over `<ts>.<rawBody>` with the
 * endpoint secret, constant-time compare, and reject anything older than the
 * tolerance window (replay defence). Returns true only on a genuine match.
 */
function verifyStripeSig(raw: Buffer, header: string, secret: string, toleranceSec = 300): boolean {
  try {
    const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string]));
    const ts = parts.t;
    const v1 = parts.v1;
    if (!ts || !v1) return false;
    if (Math.abs(Date.now() / 1000 - Number(ts)) > toleranceSec) return false; // replayed / stale
    const expected = createHmac('sha256', secret).update(`${ts}.${raw.toString('utf8')}`).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(v1, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Pull the (planId, buyerRef) pair out of a Checkout Session. billing.js sends
    `client_reference_id = "<planId>__<ref>"`; we also accept explicit metadata
    and a bare client_reference_id (legacy = ref only). */
function planAndRef(obj: Record<string, unknown>): { planId: string; ref: string } {
  const meta = (obj.metadata as Record<string, string> | undefined) ?? {};
  const cref = String(obj.client_reference_id ?? '');
  let planId = meta.planId ?? '';
  let ref = meta.ref ?? '';
  if (cref.includes('__')) {
    const [a, b] = cref.split('__');
    if (!planId) planId = a;
    if (!ref) ref = b;
  } else if (cref && !ref) {
    ref = cref;
  }
  return { planId: planId.trim(), ref: ref.trim() };
}

/** Resolve a buyer reference to a ledger owner. An email maps to its Firebase
    uid (the wallet owner); a school code maps to a `school:<CODE>` owner key so
    school purchases are ledgered even without a personal account. */
async function resolveBuyer(ref: string): Promise<{ uid: string | null; ownerKey: string; kind: 'user' | 'school'; email: string | null }> {
  const r = ref.trim();
  if (/^\S+@\S+\.\S+$/.test(r)) {
    const email = r.toLowerCase();
    try {
      const u = await getAuth().getUserByEmail(email);
      return { uid: u.uid, ownerKey: u.uid, kind: 'user', email };
    } catch {
      return { uid: null, ownerKey: '', kind: 'user', email }; // paid but no account yet — reconciled from stripePayments
    }
  }
  if (r) return { uid: null, ownerKey: `school:${r.toUpperCase()}`, kind: 'school', email: null };
  return { uid: null, ownerKey: '', kind: 'user', email: null };
}

/** Append a positive credit to the append-only ledger (walletBalance sums delta).
    When `dedupeId` is given the row is written at a deterministic doc id, so a
    replayed webhook (e.g. the idempotency guard was torn down by a post-credit
    error and Stripe retried) can never append a second credit. */
async function creditAcus(ownerKey: string, acus: number, source: string, meta: Record<string, unknown>, dedupeId?: string) {
  const data = {
    ownerId: ownerKey, delta: Math.max(0, Math.round(acus)), activity: 'purchase',
    source, ...meta, createdAt: FieldValue.serverTimestamp(),
  };
  if (dedupeId) {
    try { await db.collection('acuTransactions').doc(dedupeId).create(data); }
    catch (e) { const c = (e as { code?: number | string }).code; if (c === 6 || c === 'already-exists') return; throw e; } // already credited
    return;
  }
  await db.collection('acuTransactions').add(data);
}

/** Append a signed adjustment (e.g. a refund/chargeback clawback = negative
    delta). Deterministic doc id keeps it idempotent against webhook retries. */
async function adjustAcus(ownerKey: string, delta: number, activity: string, source: string, meta: Record<string, unknown>, dedupeId: string) {
  const data = { ownerId: ownerKey, delta: Math.round(delta), activity, source, ...meta, createdAt: FieldValue.serverTimestamp() };
  try { await db.collection('acuTransactions').doc(dedupeId).create(data); }
  catch (e) { const c = (e as { code?: number | string }).code; if (c === 6 || c === 'already-exists') return; throw e; }
}

/**
 * POST /stripeWebhook — the real payments endpoint.
 *   checkout.session.completed / .async_payment_succeeded  → initial credit,
 *     set the account's plan (subscriptions), remember the customer↔plan link.
 *   invoice.payment_succeeded (billing_reason=subscription_cycle) → monthly refill.
 * Hardened: HMAC signature verification (no SDK), a 5-minute replay window, and
 * atomic idempotency via `stripeEvents/{id}` so a Stripe retry never double-credits.
 */
export const stripeWebhook = onRequest({ region: 'europe-west2' }, async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) { res.status(500).json({ ok: false, error: 'STRIPE_WEBHOOK_SECRET not configured' }); return; }
  const sig = req.headers['stripe-signature'] as string | undefined;
  const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
  if (!raw || !sig || !verifyStripeSig(raw, sig, secret)) { res.status(400).json({ ok: false, error: 'invalid signature' }); return; }

  let event: { id: string; type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    res.status(400).json({ ok: false, error: 'invalid payload' });
    return;
  }
  if (!event?.id || !event?.type) { res.status(400).json({ ok: false, error: 'malformed event' }); return; }

  // Atomic idempotency: create() rejects if the event was already processed, so
  // concurrent/retried deliveries collapse to a single credit.
  const evRef = db.doc(`stripeEvents/${event.id}`);
  try {
    await evRef.create({ type: event.type, receivedAt: FieldValue.serverTimestamp() });
  } catch {
    res.json({ ok: true, dedup: true });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const s = event.data.object;
      const paid = String(s.payment_status ?? 'unpaid') === 'paid'; // fail closed on a missing field
      const { planId, ref } = planAndRef(s);
      const item = STRIPE_CATALOG[planId];
      const buyer = await resolveBuyer(ref);
      const amt = typeof s.amount_total === 'number' ? s.amount_total : null;
      // Bind the ACU grant to the money actually collected: the planId is
      // client-influenced (client_reference_id), so a buyer must not be able to
      // pay the cheapest Payment Link and claim the most expensive plan. When the
      // amount is known it must cover the catalogue price for the claimed plan.
      const priceOk = amt == null || !item ? true : amt >= item.pence;
      const applied = !!(paid && item && buyer.ownerKey && priceOk);
      await db.collection('stripePayments').add({
        eventId: event.id, sessionId: s.id ?? null, paymentIntent: s.payment_intent ?? null, planId: planId || null, ref: ref || null,
        acus: item?.acus ?? 0, kind: item?.kind ?? null, ownerKey: buyer.ownerKey || null,
        uid: buyer.uid, email: buyer.email, customer: s.customer ?? null,
        amountTotal: amt, currency: s.currency ?? null, expectedPence: item?.pence ?? null, priceOk,
        applied, createdAt: FieldValue.serverTimestamp(),
      });
      if (paid && item && !priceOk) // paid, but underpaid for the claimed plan — hold for review, do not credit
        await audit('STRIPE_AMOUNT_MISMATCH', buyer.uid ?? buyer.ownerKey, { planId, amountTotal: amt, expectedPence: item.pence });
      if (applied) {
        await creditAcus(buyer.ownerKey, item.acus, `stripe:${event.type}`, { planId, ref, sessionId: s.id ?? null, eventId: event.id }, `credit_${event.id}`);
        if (item.kind === 'subscription') {
          if (buyer.kind === 'user' && buyer.uid)
            await db.doc(`users/${buyer.uid}`).set({ plan: planId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          else if (buyer.kind === 'school')
            await db.doc(`schools/${buyer.ownerKey.replace('school:', '')}`).set({ plan: planId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          if (s.customer)
            await db.doc(`stripeCustomers/${String(s.customer)}`).set(
              { ownerKey: buyer.ownerKey, uid: buyer.uid ?? null, kind: buyer.kind, planId, acus: item.acus, ref, updatedAt: FieldValue.serverTimestamp() },
              { merge: true });
        }
        await audit('STRIPE_PURCHASE', buyer.uid ?? buyer.ownerKey, { planId, acus: item.acus, kind: item.kind });
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const inv = event.data.object;
      // The first invoice (subscription_create) is already covered by the checkout
      // session; only credit the recurring cycles here so renewals top the wallet up.
      if (String(inv.billing_reason ?? '') === 'subscription_cycle' && inv.customer) {
        const cust = await db.doc(`stripeCustomers/${String(inv.customer)}`).get();
        if (cust.exists) {
          const c = cust.data()!;
          await creditAcus(String(c.ownerKey), Number(c.acus) || 0, 'stripe:renewal', { planId: c.planId ?? null, invoiceId: inv.id ?? null, eventId: event.id }, `renewal_${event.id}`);
          await audit('STRIPE_RENEWAL', (c.uid as string) ?? String(c.ownerKey), { planId: c.planId ?? null, acus: c.acus ?? 0 });
        }
      }
    } else if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
      // Money pulled back (refund or chargeback) → claw back the ACUs that this
      // payment granted, so refund/chargeback fraud can't keep the credits. The
      // original checkout stored the paymentIntent on stripePayments; find that
      // record and write a compensating negative delta (idempotent by event id).
      const ch = event.data.object;
      const pi = (event.type === 'charge.dispute.created' ? ch.payment_intent : ch.payment_intent) ?? null;
      let claimed = false;
      if (pi) {
        const q = await db.collection('stripePayments').where('paymentIntent', '==', String(pi)).limit(5).get();
        for (const doc of q.docs) {
          const p = doc.data();
          if (p.applied && p.ownerKey && Number(p.acus) > 0) {
            await adjustAcus(String(p.ownerKey), -Math.abs(Number(p.acus) || 0), 'refund',
              `stripe:${event.type}`, { planId: p.planId ?? null, paymentIntent: String(pi), eventId: event.id, originalEvent: p.eventId ?? null },
              `clawback_${event.id}_${doc.id}`);
            claimed = true;
            // a chargeback/refund of a subscription also drops the plan back to free
            if (p.kind === 'subscription' && p.uid)
              await db.doc(`users/${String(p.uid)}`).set({ plan: 'child_free', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
            await audit('STRIPE_CLAWBACK', (p.uid as string) ?? String(p.ownerKey), { planId: p.planId ?? null, acus: p.acus ?? 0, reason: event.type });
          }
        }
      }
      // Always record the reversal for reconciliation, even if no grant was found
      await db.collection('refunds').add({
        eventId: event.id, type: event.type, paymentIntent: pi, charge: ch.id ?? null,
        amount: ch.amount_refunded ?? ch.amount ?? null, clawedBack: claimed, createdAt: FieldValue.serverTimestamp(),
      });
    } else if (event.type === 'customer.subscription.deleted') {
      // Subscription cancelled/expired — drop the account back to the free plan.
      const sub = event.data.object;
      if (sub.customer) {
        const cust = await db.doc(`stripeCustomers/${String(sub.customer)}`).get();
        if (cust.exists && cust.data()!.kind === 'user' && cust.data()!.uid)
          await db.doc(`users/${String(cust.data()!.uid)}`).set({ plan: 'child_free', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }
    res.json({ ok: true, type: event.type });
  } catch (e) {
    // Processing failed after the idempotency guard was written — remove it so
    // Stripe's automatic retry gets a clean second attempt.
    await evRef.delete().catch(() => null);
    const err = e as Error;
    res.status(500).json({ ok: false, error: err.message });
  }
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
    const toMs = (v: unknown): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') { const t = Date.parse(v); return isNaN(t) ? null : t; }
      const anyv = v as { toMillis?: () => number };
      return typeof anyv.toMillis === 'function' ? anyv.toMillis() : null;
    };
    const codeRef = db.doc(`discountCodes/${code}`);
    const redemptionRef = db.doc(`codeRedemptions/${code}__${user.uid}`);
    // atomic: validate window/limits/audience, ledger the redemption once per user
    const grant = await db.runTransaction(async (tx) => {
      const doc = await tx.get(codeRef);
      if (!doc.exists) throw httpError(404, 'invalid or inactive code');
      const c = doc.data()!;
      if (c.status !== 'active') throw httpError(410, 'code inactive');
      const now = Date.now();
      const startsAt = toMs(c.startsAt); if (startsAt != null && now < startsAt) throw httpError(403, 'code not active yet');
      const endsAt = toMs(c.endsAt); if (endsAt != null && now > endsAt) throw httpError(410, 'code expired');
      if (typeof c.maxRedemptions === 'number' && (Number(c.redeemedCount) || 0) >= c.maxRedemptions) throw httpError(410, 'code fully redeemed');
      const perUserLimit = typeof c.perUserLimit === 'number' ? c.perUserLimit : 1;
      const mine = await tx.get(redemptionRef);
      const myCount = mine.exists ? (Number(mine.data()!.count) || 0) : 0;
      if (myCount >= perUserLimit) throw httpError(409, 'you have already redeemed this code');
      if (Array.isArray(c.audienceRoles) && c.audienceRoles.length) {
        const uDoc = await tx.get(db.doc(`users/${user.uid}`));
        const role = uDoc.exists ? String(uDoc.data()!.role ?? '') : '';
        if (!c.audienceRoles.includes(role)) throw httpError(403, 'this code is not valid for your account type');
      }
      const bonusAcus = Math.max(0, Math.round(Number(c.bonusAcus) || 0));
      const discountPct = Math.max(0, Math.min(100, Number(c.discountPct) || 0));
      tx.set(codeRef, { redeemedCount: (Number(c.redeemedCount) || 0) + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.set(redemptionRef, { code, uid: user.uid, count: myCount + 1, bonusAcus, at: FieldValue.serverTimestamp() }, { merge: true });
      return { bonusAcus, discountPct, label: String(c.label ?? code) };
    });
    // grant the benefit once the redemption is committed (append-only ACU ledger)
    if (grant.bonusAcus > 0) await creditAcus(user.uid, grant.bonusAcus, `redeemCode:${code}`, { code, kind: 'code-redemption' });
    res.json({ ok: true, code, bonusAcus: grant.bonusAcus, discountPct: grant.discountPct, label: grant.label });
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
type AiProvider = 'openai' | 'anthropic' | 'gemini';
type AiBody = { system?: string; user?: string; maxTokens?: number; temperature?: number; image?: string };
const AI_DEFAULT_MODEL: Record<AiProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  gemini: 'gemini-2.0-flash',
};
/** All configured providers, primary (AI_PROVIDER) first — every key that is
 *  set joins the failover chain, so one provider outage never downs the OS. */
function aiProviderChain(): { provider: AiProvider; key: string }[] {
  const keys: Record<AiProvider, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  const legacyP = process.env.AI_PROVIDER as AiProvider | undefined;
  if (legacyP && process.env.AI_PROVIDER_KEY && !keys[legacyP]) keys[legacyP] = process.env.AI_PROVIDER_KEY;
  const all: AiProvider[] = ['openai', 'anthropic', 'gemini'];
  const order = legacyP && keys[legacyP] ? [legacyP, ...all.filter((p) => p !== legacyP)] : all;
  return order.filter((p) => keys[p]).map((p) => ({ provider: p, key: keys[p] as string }));
}
async function aiCall(provider: AiProvider, key: string, body: AiBody): Promise<{ text: string; model: string }> {
  const model = (process.env.AI_MODEL && (process.env.AI_PROVIDER ?? 'openai') === provider)
    ? process.env.AI_MODEL : AI_DEFAULT_MODEL[provider];
  // Clamp output length server-side so a client can't request a huge (costly)
  // completion. Even authenticated callers must stay inside this ceiling.
  const maxTokens = Math.max(1, Math.min(Number(body.maxTokens) || 1024, 2048));
  const temperature = Math.max(0, Math.min(Number(body.temperature ?? 0.6), 1));
  const img = body.image ? String(body.image).match(/^data:([^;]+);base64,(.*)$/) : null;
  if (provider === 'gemini') {
    const parts: unknown[] = [{ text: String(body.user ?? '') }];
    if (img) parts.push({ inlineData: { mimeType: img[1], data: img[2] } });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: body.system ? { parts: [{ text: body.system }] } : undefined,
        contents: [{ role: 'user', parts }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    });
    if (!r.ok) throw httpError(502, `gemini ${r.status}`);
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return { text: (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join(''), model };
  }
  if (provider === 'anthropic') {
    const content: unknown[] = [];
    if (img) content.push(img[1] === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: img[1], data: img[2] } }
      : { type: 'image', source: { type: 'base64', media_type: img[1], data: img[2] } });
    content.push({ type: 'text', text: String(body.user ?? '') });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model, max_tokens: maxTokens, temperature,
        system: body.system || undefined,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!r.ok) throw httpError(502, `anthropic ${r.status}`);
    const j = (await r.json()) as { content?: { type: string; text?: string }[] };
    return { text: (j.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join(''), model };
  }
  // openai
  const userContent: unknown = img
    ? [{ type: 'text', text: String(body.user ?? '') },
       img[1] === 'application/pdf'
         ? { type: 'file', file: { filename: 'upload.pdf', file_data: body.image } }
         : { type: 'image_url', image_url: { url: body.image } }]
    : String(body.user ?? '');
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature,
      messages: [...(body.system ? [{ role: 'system', content: body.system }] : []), { role: 'user', content: userContent }],
    }),
  });
  if (!r.ok) throw httpError(502, `openai ${r.status}`);
  const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return { text: j.choices?.[0]?.message?.content ?? '', model };
}
export const aiProxy = onRequest({ region: 'europe-west2', cors: true, maxInstances: 20 }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    // Denial-of-wallet backstop: cap calls per account per day. This is an abuse
    // ceiling (well above any legitimate use), NOT the ACU meter — real per-call
    // ACU debiting is the architectural fix tracked separately. Bounds a single
    // account or stolen token to a finite provider spend instead of unlimited.
    const dayKey = new Date().toISOString().slice(0, 10);
    const rateRef = db.doc(`aiRateLimits/${user.uid}_${dayKey}`);
    const AI_DAILY_CAP = Number(process.env.AI_DAILY_CALL_CAP) || 500;
    const used = (await rateRef.get().then((d) => (d.exists ? Number(d.data()!.count) || 0 : 0)));
    if (used >= AI_DAILY_CAP) throw httpError(429, 'daily AI limit reached — please try again tomorrow');
    await rateRef.set({ count: FieldValue.increment(1), day: dayKey, uid: user.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const chain = aiProviderChain();
    if (!chain.length) throw httpError(503, 'AI provider key not configured on the server');
    const t0 = Date.now();
    const body = (req.body ?? {}) as AiBody;
    let lastErr: Error | null = null;
    for (const { provider, key } of chain) {
      try {
        const { text, model } = await aiCall(provider, key, body);
        await db.collection('aiUsageLogs').add({
          ownerId: user.uid, provider, model, ms: Date.now() - t0, ok: true,
          failover: chain[0].provider !== provider,
          inChars: String(body.system ?? '').length + String(body.user ?? '').length,
          outChars: text.length, createdAt: FieldValue.serverTimestamp(),
        });
        res.json({ ok: true, text, provider });
        return;
      } catch (e) {
        lastErr = e as Error; // provider down/limited — fail over to the next key
      }
    }
    await db.collection('aiUsageLogs').add({
      ownerId: user.uid, provider: chain[0].provider, model: '-', ms: Date.now() - t0, ok: false,
      inChars: String(body.system ?? '').length + String(body.user ?? '').length,
      outChars: 0, createdAt: FieldValue.serverTimestamp(),
    });
    throw httpError(502, `all providers failed: ${lastErr?.message ?? 'unknown'}`);
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

// -------------------------------------------------------------- public stats ----
/** GET /publicStats — real platform-wide numbers for the landing counters
    (no marketing fallbacks — owner directive: reality only). Public,
    cached in-memory for 60s per instance. */
let statsCache: { at: number; body: Record<string, unknown> } | null = null;
export const publicStats = onRequest({ region: 'europe-west2', cors: true }, async (_req, res) => {
  try {
    if (statsCache && Date.now() - statsCache.at < 60_000) { res.json(statsCache.body); return; }
    const [auth, docs] = await Promise.all([getAuth().listUsers(1000), db.collection('users').get()]);
    let students = 0, partners = 0;
    docs.forEach((d) => {
      const roles = (d.data().roles as string[]) ?? [];
      if (roles.includes('student')) students++;
      if (roles.some((r) => ['school', 'authority', 'tutor'].includes(r))) partners++;
    });
    const body = { ok: true, students, partners, profiles: docs.size, accounts: auth.users.length, resources: 0 };
    statsCache = { at: Date.now(), body };
    res.json(body);
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ----------------------------------------------------------- admin (cloud view) ----
/** Platform administrators — the only accounts the admin endpoints serve.
    Override with the ADMIN_EMAILS env (comma-separated). */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jnnseya@gmail.com,jnbankwa@gmail.com')
  .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
async function requireAdmin(authHeader: string | undefined) {
  const u = await requireUser(authHeader);
  // Require a VERIFIED email: Firebase lets anyone register an arbitrary
  // unverified address, so an allow-list match alone would let someone claim an
  // admin address that isn't yet a real account and pass this gate.
  if (!u.email || !u.email_verified || !ADMIN_EMAILS.includes(u.email.toLowerCase())) throw httpError(403, 'admin only');
  return u;
}

/**
 * GET /adminOverview — the platform-wide truth for the Admin console:
 * every Firebase Auth account (merged with its users/ doc), the contact
 * inbox, recent audit events and a 30-day AI usage summary. The console
 * merges this over its device-local view, so the admin sees every user on
 * the platform regardless of which device they signed up on.
 */
export const adminOverview = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const admin = await requireAdmin(req.headers.authorization);
    const [authUsers, userDocs, inbox, audits, usage] = await Promise.all([
      getAuth().listUsers(1000),
      db.collection('users').get(),
      db.collection('contactInbox').orderBy('createdAt', 'desc').limit(200).get(),
      db.collection('auditEvents').orderBy('createdAt', 'desc').limit(100).get(),
      db.collection('aiUsageLogs').orderBy('createdAt', 'desc').limit(500).get(),
    ]);
    const docs: Record<string, FirebaseFirestore.DocumentData> = {};
    userDocs.forEach((d) => { docs[d.id] = d.data(); });
    const iso = (v: { toDate?: () => Date } | undefined) => v?.toDate?.()?.toISOString() ?? null;
    await audit('ADMIN_OVERVIEW_READ', admin.uid);
    res.json({
      ok: true,
      users: authUsers.users.map((u) => ({
        uid: u.uid, email: u.email ?? null,
        name: (docs[u.uid]?.name as string) ?? u.displayName ?? null,
        roles: (docs[u.uid]?.roles as string[]) ?? [],
        plan: (docs[u.uid]?.plan as string) ?? 'child_free',
        created: u.metadata.creationTime, lastLogin: u.metadata.lastSignInTime,
        disabled: u.disabled,
      })),
      inbox: inbox.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: iso(d.data().createdAt) })),
      audit: audits.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: iso(d.data().createdAt) })),
      aiUsage: usage.docs.map((d) => ({ ...d.data(), createdAt: iso(d.data().createdAt) })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /adminUserOp { op, uid, value? } — server-side account actions:
 *   delete   — removes the Auth account, users/ doc and encrypted blobs
 *   disable / enable — blocks or restores sign-in (bot/no-human ban)
 *   setPlan  — server-authoritative plan change
 * Every action is audited with the acting admin.
 */
export const adminUserOp = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const admin = await requireAdmin(req.headers.authorization);
    const op = String(req.body?.op ?? '');
    const uid = String(req.body?.uid ?? '');
    if (!uid) throw httpError(400, 'uid required');
    if (op === 'delete') {
      await getAuth().deleteUser(uid).catch(() => null);
      await db.doc(`users/${uid}`).delete().catch(() => null);
      await db.doc(`e2eKeys/${uid}`).delete().catch(() => null);
      const blobs = await db.collection(`e2eData/${uid}/blobs`).get();
      const batch = db.batch(); blobs.forEach((d) => batch.delete(d.ref)); await batch.commit();
    } else if (op === 'disable' || op === 'enable') {
      await getAuth().updateUser(uid, { disabled: op === 'disable' });
    } else if (op === 'setPlan') {
      await db.doc(`users/${uid}`).set({ plan: String(req.body?.value ?? 'child_free') }, { merge: true });
    } else throw httpError(400, 'unknown op');
    await audit('ADMIN_USER_' + op.toUpperCase(), admin.uid, { target: uid });
    res.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// -------------------------------------------------------------- notify (email) ----
/**
 * POST /notify { subject, text } — sends an email to the CALLER's own
 * verified address only (abuse-proof by construction: the recipient is taken
 * from the ID token, never the payload). Used by the Communication Event
 * Architecture's "Send test to me" and account-level notices.
 * Requires MAIL_* env; returns ok:false when mail is not configured.
 */
export const notify = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    if (!user.email) throw httpError(400, 'token has no email');
    if (!process.env.MAIL_HOST) { res.json({ ok: false, reason: 'mail not configured' }); return; }
    const subject = String(req.body?.subject ?? 'StudYear notification').slice(0, 200);
    const text = String(req.body?.text ?? '').slice(0, 5000);
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 465),
      secure: (process.env.MAIL_SECURE ?? 'true') !== 'false',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
    await transport.sendMail({ from: process.env.MAIL_FROM ?? process.env.MAIL_USER, to: user.email, subject, text });
    await audit('NOTIFY_SENT', user.uid, { subject });
    res.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// -------------------------------------------------------- link directory ----
/**
 * /directory — the cross-account/cross-device link registry.
 *
 * The static OS previews linking with same-device localStorage (sy-code:*),
 * which cannot connect a parent on their phone to a child on a laptop. This
 * function is the production swap the client comments promise: share codes and
 * the resulting links live in Firestore, so a code generated on one account
 * resolves on any other, on any device.
 *
 * Only public directory fields (email, name, kind) cross the boundary — never
 * a user's end-to-end-encrypted data. Each side reads only ITS OWN links doc.
 *
 *   POST { op:'publish',  code, kind }            register my share code
 *   GET  ?op=resolve&code=XXXX                    code -> { uid, email, name, kind }
 *   POST { op:'connect',  code, relation }        link me <-> the code's owner
 *   POST { op:'disconnect', uid, dir }            remove a link (dir=inbound|outbound)
 *   GET  ?op=links                                my { inbound:[], outbound:[] }
 */
const LINK_KINDS = ['account', 'school', 'tutor', 'class'];
const LINK_RELATIONS = ['parent', 'student', 'teacher', 'guardian', 'mentor'];
async function accountName(uid: string, fallback: string | null): Promise<string> {
  const d = await db.doc(`users/${uid}`).get();
  return (d.data()?.name as string) || fallback || 'Account';
}
export const directory = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const op = String(req.query.op ?? req.body?.op ?? '');
    const myEmail = user.email ?? null;

    if (op === 'publish') {
      const code = String(req.body?.code ?? '').trim();
      const kind = String(req.body?.kind ?? 'account');
      if (!/^[A-Za-z0-9-]{4,24}$/.test(code)) throw httpError(400, 'invalid code');
      if (!LINK_KINDS.includes(kind)) throw httpError(400, 'invalid kind');
      const existing = await db.doc(`shareCodes/${code}`).get();
      // a code already owned by another account cannot be hijacked
      if (existing.exists && existing.data()!.uid !== user.uid) throw httpError(409, 'code already in use');
      await db.doc(`shareCodes/${code}`).set({
        uid: user.uid, email: myEmail, name: await accountName(user.uid, myEmail),
        kind, updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ ok: true, code });
      return;
    }

    if (op === 'resolve') {
      const code = String(req.query.code ?? req.body?.code ?? '').trim();
      if (!code) throw httpError(400, 'code required');
      const d = await db.doc(`shareCodes/${code}`).get();
      if (!d.exists) throw httpError(404, 'no account for that code');
      const v = d.data()!;
      res.json({ ok: true, code, uid: v.uid, email: v.email ?? null, name: v.name ?? null, kind: v.kind ?? 'account' });
      return;
    }

    if (op === 'connect') {
      const code = String(req.body?.code ?? '').trim();
      const relation = String(req.body?.relation ?? 'parent');
      if (!code) throw httpError(400, 'code required');
      if (!LINK_RELATIONS.includes(relation)) throw httpError(400, 'invalid relation');
      const d = await db.doc(`shareCodes/${code}`).get();
      if (!d.exists) throw httpError(404, 'no account for that code');
      const target = d.data()!;
      if (target.uid === user.uid) throw httpError(400, 'cannot link to yourself');
      const meName = await accountName(user.uid, myEmail);
      const now = FieldValue.serverTimestamp();
      // the code owner gains an inbound link; the connector an outbound one —
      // each account reads only its own subtree, so nobody sees anyone else's graph
      const batch = db.batch();
      batch.set(db.doc(`links/${target.uid}/inbound/${user.uid}`),
        { relation, email: myEmail, name: meName, kind: target.kind ?? 'account', code, at: now }, { merge: true });
      batch.set(db.doc(`links/${user.uid}/outbound/${target.uid}`),
        { relation, email: target.email ?? null, name: target.name ?? null, kind: target.kind ?? 'account', code, at: now }, { merge: true });
      await batch.commit();
      await audit('LINK_CONNECTED', user.uid, { target: target.uid, relation, kind: target.kind ?? 'account' });
      res.json({ ok: true, uid: target.uid, email: target.email ?? null, name: target.name ?? null, kind: target.kind ?? 'account' });
      return;
    }

    if (op === 'disconnect') {
      const uid = String(req.body?.uid ?? '').trim();
      const dir = String(req.body?.dir ?? 'outbound');
      if (!uid) throw httpError(400, 'uid required');
      if (dir === 'outbound') {
        await db.doc(`links/${user.uid}/outbound/${uid}`).delete().catch(() => null);
        await db.doc(`links/${uid}/inbound/${user.uid}`).delete().catch(() => null);
      } else {
        await db.doc(`links/${user.uid}/inbound/${uid}`).delete().catch(() => null);
        await db.doc(`links/${uid}/outbound/${user.uid}`).delete().catch(() => null);
      }
      res.json({ ok: true });
      return;
    }

    if (op === 'links') {
      const [inb, outb] = await Promise.all([
        db.collection(`links/${user.uid}/inbound`).get(),
        db.collection(`links/${user.uid}/outbound`).get(),
      ]);
      const shape = (d: FirebaseFirestore.QueryDocumentSnapshot) => {
        const v = d.data();
        return { uid: d.id, relation: v.relation ?? null, email: v.email ?? null, name: v.name ?? null, kind: v.kind ?? 'account', code: v.code ?? null };
      };
      res.json({ ok: true, inbound: inb.docs.map(shape), outbound: outb.docs.map(shape) });
      return;
    }

    throw httpError(400, 'unknown op');
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
