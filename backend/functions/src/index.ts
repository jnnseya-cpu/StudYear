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
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createHmac, timingSafeEqual, createHash, randomBytes } from 'crypto';
import { ACU_TARIFF, FREE_TIER, MARGIN, ACU_PER_POUND,
  STUDENT_PLANS, PARENT_PLANS, SCHOOL_PLANS, TOPUPS, type MeteredActivity } from '../../../packages/shared/src';
import { SITE, isoWeekKey, verifyUnsub, nlRender } from './newsletter';

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

/** Per-caller daily rate limit — bounds share-code enumeration and gift/discount
    brute-force. Throws 429 when the cap is hit. Buckets are function-only
    (default-deny in firestore.rules), keyed by uid + name + UTC day. */
async function enforceRate(uid: string, name: string, cap: number): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.doc(`apiRateLimits/${uid}_${name}_${day}`);
  const used = await ref.get().then((d) => (d.exists ? Number(d.data()!.count) || 0 : 0));
  if (used >= cap) throw httpError(429, 'too many requests — please slow down and try again later');
  await ref.set({ count: FieldValue.increment(1), day, uid, name, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// -------------------------------------------------------------------- mail ----
/** Single source of truth for outbound SMTP. Returns a nodemailer transport, or
    null when MAIL_* is not configured (callers degrade gracefully). */
async function mailTransport(): Promise<import('nodemailer').Transporter | null> {
  if (!process.env.MAIL_HOST) return null;
  const nodemailer = await import('nodemailer');
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 465),
    secure: (process.env.MAIL_SECURE ?? 'true') !== 'false',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
}
/** Send one email through the shared transport. Throws if mail isn't configured
    so marketing/transactional callers can decide how to handle it. */
async function sendMail(opts: { to: string; subject: string; text?: string; html?: string; replyTo?: string; listUnsubscribe?: string }): Promise<void> {
  const transport = await mailTransport();
  if (!transport) throw httpError(503, 'mail not configured');
  const headers = opts.listUnsubscribe ? { 'List-Unsubscribe': `<${opts.listUnsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined;
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
    to: opts.to, subject: opts.subject, text: opts.text, html: opts.html, replyTo: opts.replyTo, headers,
  });
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
type CatalogItem = { acus: number; kind: 'subscription' | 'topup'; audience?: string; pence: number; label: string };
const STRIPE_CATALOG: Record<string, CatalogItem> = (() => {
  const m: Record<string, CatalogItem> = {};
  for (const p of [...STUDENT_PLANS, ...PARENT_PLANS, ...SCHOOL_PLANS])
    m[p.id] = { acus: p.acus, kind: 'subscription', audience: p.audience, pence: p.monthlyPence, label: p.label };
  for (const t of TOPUPS) m[t.id] = { acus: t.acus, kind: 'topup', pence: t.pence, label: `${t.acus.toLocaleString('en-GB')} ACU top-up` };
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
      // Bind the ACU grant to the money actually collected: for the LEGACY path
      // (client_reference_id only, no server metadata) the planId is
      // client-influenced, so a buyer must not pay the cheapest Payment Link and
      // claim the most expensive plan — the amount must cover the catalogue price.
      // For a dynamic Checkout Session the planId is stamped into server metadata
      // (tamper-proof), and a Stripe-applied promotion code legitimately lowers
      // amount_total below the catalogue price — so trust the metadata plan and
      // credit despite the discount, instead of charging the buyer and crediting
      // nothing (the previous behaviour whenever any discount code was used).
      const trustedPlan = !!((s.metadata as Record<string, string> | undefined)?.planId);
      const priceOk = trustedPlan || amt == null || !item ? true : amt >= item.pence;
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
      const meta = (s.metadata as Record<string, string> | undefined) ?? {};
      const isGift = meta.gift === '1';
      if (isGift && paid && item && priceOk) {
        // Funding a student from anywhere: the buyer paid, so mint the server-
        // backed gift code (redeemable on any device by the recipient). The buyer
        // is NOT credited. Idempotent: keyed doc, merged on retry.
        const code = String(meta.giftCode ?? '').toUpperCase();
        if (/^SY-GIFT-[A-Z0-9-]{6,20}$/.test(code)) {
          await db.doc(`giftCodes/${code}`).set({
            code, acus: item.acus, from: meta.giftFrom || 'A supporter', forEmail: meta.giftForEmail || null,
            buyerUid: buyer.uid ?? null, buyerEmail: buyer.email ?? null, paid: true,
            sessionId: s.id ?? null, eventId: event.id, redeemed: null, createdAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          await audit('STRIPE_GIFT_FUNDED', buyer.uid ?? buyer.ownerKey, { code, acus: item.acus });
        }
      } else if (applied) {
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
    await enforceRate(user.uid, 'redeem', 40);
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

/**
 * POST /redeemGift { code } — the recipient side of "Fund a student from
 * anywhere". A supporter buys a top-up pack as a gift (createCheckout with
 * gift:1); on payment the webhook mints giftCodes/{code} { acus, paid:true,
 * redeemed:null }. Here the student/parent redeems it: we atomically claim the
 * code (exactly once) and credit their wallet. If the gift named a recipient
 * email, only that account may redeem it.
 */
export const redeemGift = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    await enforceRate(user.uid, 'redeem', 40);
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!/^SY-GIFT-[A-Z0-9-]{6,20}$/.test(code)) throw httpError(400, 'invalid gift code');
    const giftRef = db.doc(`giftCodes/${code}`);
    // atomic: a gift is claimable exactly once. The transaction flips redeemed
    // from null → {uid} so two devices racing the same code can't double-credit.
    const grant = await db.runTransaction(async (tx) => {
      const doc = await tx.get(giftRef);
      if (!doc.exists) throw httpError(404, 'gift code not found');
      const g = doc.data()!;
      if (!g.paid) throw httpError(409, 'this gift has not been paid for yet');
      if (g.redeemed) throw httpError(410, 'this gift has already been redeemed');
      const forEmail = String(g.forEmail ?? '').toLowerCase();
      if (forEmail && forEmail !== String(user.email ?? '').toLowerCase())
        throw httpError(403, 'this gift was sent to a different email address');
      const acus = Math.max(0, Math.round(Number(g.acus) || 0));
      tx.set(giftRef, {
        redeemed: { uid: user.uid, email: user.email ?? null, at: FieldValue.serverTimestamp() },
      }, { merge: true });
      return { acus, from: String(g.from ?? 'A supporter') };
    });
    // credit once the claim is committed; deterministic id blocks a retry double-credit
    if (grant.acus > 0) await creditAcus(user.uid, grant.acus, `redeemGift:${code}`, { code, kind: 'gift-redemption', from: grant.from }, `gift_${code}`);
    await audit('GIFT_REDEEMED', user.uid, { code, acus: grant.acus });
    res.json({ ok: true, code, acus: grant.acus, from: grant.from });
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
// --------------------------------------------------------- checkout ----
/**
 * POST /createCheckout { planId, ref?, successUrl?, cancelUrl?, promo? }
 * Creates a Stripe Checkout Session ON DEMAND so there are no Payment Links to
 * author or maintain. The PRICE is set here from the server catalogue (never the
 * client) and the plan is stamped into metadata.planId, so the amount and what's
 * granted are fully server-authoritative. Returns { url } for the browser to
 * redirect to; the existing stripeWebhook credits ACUs after payment.
 */
const CHECKOUT_ALLOWED_ORIGINS = /^(https:\/\/(www\.)?studyear\.com|https:\/\/jnnseya-cpu\.github\.io|http:\/\/localhost(:\d+)?)$/;
function safeReturnUrl(u: unknown, fallback: string): string {
  try { const url = new URL(String(u)); if (CHECKOUT_ALLOWED_ORIGINS.test(url.origin)) return url.toString(); } catch { /* bad url */ }
  return fallback;
}
export const createCheckout = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw httpError(503, 'payments not configured');
    const planId = String(req.body?.planId ?? '').trim();
    const item = STRIPE_CATALOG[planId];
    if (!item || item.pence <= 0) throw httpError(400, 'unknown or non-purchasable plan');
    // buyer reference: schools pass their code; everyone else is keyed by email
    const ref = String(req.body?.ref ?? user.email ?? user.uid).trim();
    const dflt = 'https://www.studyear.com/account/topup/';
    const withParam = (u: unknown, param: string, fb: string): string => {
      if (typeof u !== 'string' || !u) return fb;
      return safeReturnUrl(u + (u.includes('?') ? '&' : '?') + param, fb);
    };
    const success = withParam(req.body?.successUrl, 'paid=1', dflt + '?paid=1');
    const cancel = withParam(req.body?.cancelUrl, 'checkout=cancel', dflt + '?checkout=cancel');
    const mode = item.kind === 'subscription' ? 'subscription' : 'payment';
    const p = new URLSearchParams();
    p.set('mode', mode);
    p.set('success_url', success);
    p.set('cancel_url', cancel);
    p.set('client_reference_id', `${planId}__${ref}`); // buyer identity (webhook fallback)
    p.set('metadata[planId]', planId);                  // server-authoritative plan (webhook prefers this)
    p.set('metadata[ref]', ref);
    // GIFT: funding a student from anywhere. The buyer pays; instead of crediting
    // their own wallet, the webhook mints a server-backed gift code (redeemable on
    // any device by the recipient). Only for one-off packs.
    const gift = !!req.body?.gift;
    if (gift) {
      if (item.kind !== 'topup') throw httpError(400, 'gifts must be a top-up pack');
      const giftCode = String(req.body?.giftCode ?? '').trim().toUpperCase();
      if (!/^SY-GIFT-[A-Z0-9-]{6,20}$/.test(giftCode)) throw httpError(400, 'invalid gift code');
      p.set('metadata[gift]', '1');
      p.set('metadata[giftCode]', giftCode);
      p.set('metadata[giftFrom]', String(req.body?.from ?? user.email ?? 'A supporter').slice(0, 80));
      const forEmail = String(req.body?.forEmail ?? '').trim().toLowerCase();
      if (forEmail) p.set('metadata[giftForEmail]', forEmail);
    }
    if (user.email) p.set('customer_email', user.email);
    if (typeof req.body?.promo === 'string' && req.body.promo) p.set('allow_promotion_codes', 'true');
    p.set('line_items[0][quantity]', '1');
    p.set('line_items[0][price_data][currency]', 'gbp');
    p.set('line_items[0][price_data][unit_amount]', String(item.pence));
    p.set('line_items[0][price_data][product_data][name]', `StudYear — ${item.label}`);
    if (mode === 'subscription') p.set('line_items[0][price_data][recurring][interval]', 'month');
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: p.toString(),
    });
    const j = (await r.json()) as { url?: string; id?: string; error?: { message?: string } };
    if (!r.ok || !j.url) throw httpError(502, j.error?.message || `stripe ${r.status}`);
    res.json({ ok: true, url: j.url, id: j.id ?? null });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

export const aiProxy = onRequest({ region: 'europe-west2', cors: true, maxInstances: 20 }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    // Denial-of-wallet backstop: cap calls per account per day. This is an abuse
    // ceiling (well above any legitimate use), NOT the ACU meter. It is now
    // PLAN-AWARE: a free (child_free) account — the only free tier — is bounded
    // tightly so unmetered/free-tool AI usage (or a stolen free token, or a client
    // that skips the local ACU charge) can't erode margin; paid plans keep a
    // generous ceiling. Worst-case free-tier provider cost falls from ~500 to a few
    // dozen calls/day (pennies). Both caps are env-tunable. This protects the
    // ~95% margin with no wallet migration and no risk to paid users.
    const dayKey = new Date().toISOString().slice(0, 10);
    const rateRef = db.doc(`aiRateLimits/${user.uid}_${dayKey}`);
    let plan = 'child_free';
    try { plan = ((await db.doc(`users/${user.uid}`).get()).data()?.plan as string) ?? 'child_free'; } catch { /* default free */ }
    const FREE_CAP = Number(process.env.AI_DAILY_CAP_FREE) || 60;
    const PAID_CAP = Number(process.env.AI_DAILY_CALL_CAP) || 500;
    const AI_DAILY_CAP = plan === 'child_free' ? FREE_CAP : PAID_CAP;
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

// ------------------------------------------------------------- text to speech ----
/**
 * POST /tts { text, voice? } -> audio/mpeg. Real spoken audio for spelling
 * dictation: the browser's built-in speechSynthesis caps at device volume and
 * is often too quiet, so we synthesise real audio here and the client replays
 * it through a Web Audio gain node (louder than the device default). Auth-gated
 * and daily-capped like aiProxy so a stolen token can't run up provider spend.
 */
export const tts = onRequest({ region: 'europe-west2', cors: true, maxInstances: 10 }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const text = String(req.body?.text ?? '').trim().slice(0, 300);
    if (!text) throw httpError(400, 'text required');
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw httpError(503, 'speech not configured');
    const dayKey = new Date().toISOString().slice(0, 10);
    const rateRef = db.doc(`ttsRateLimits/${user.uid}_${dayKey}`);
    const CAP = Number(process.env.TTS_DAILY_CAP) || 1000; // dictation repeats words — generous
    const used = await rateRef.get().then((d) => (d.exists ? Number(d.data()!.count) || 0 : 0));
    if (used >= CAP) throw httpError(429, 'daily speech limit reached — please try again tomorrow');
    await rateRef.set({ count: FieldValue.increment(1), day: dayKey, uid: user.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const allowed = ['nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx'];
    const voice = allowed.includes(String(req.body?.voice)) ? String(req.body?.voice) : 'nova';
    const speed = Math.max(0.5, Math.min(1.5, Number(req.body?.speed) || 1)); // slower for single-word dictation
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3', speed }),
    });
    if (!r.ok) throw httpError(502, `tts ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(buf);
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
    try {
      await sendMail({
        to: process.env.MAIL_TO ?? 'contact@studyear.com',
        replyTo: email,
        subject: `[StudYear contact] ${String(b.type ?? 'support')} — ${from}`,
        text: `${msg}\n\n— ${from} <${email}>`,
      });
    } catch { /* never fail the submission over email delivery (incl. mail not configured) */ }
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
const PUBLIC_ROLES = ['student', 'parent', 'teacher', 'school', 'tutor', 'authority', 'employer', 'college'];
// ------------------------------------------------------- growth: leads + refer ----
const REF_BONUS = 50;   // ACUs to each side when a referred user joins
const REF_CAP = 25;     // max credited referrals per referrer (anti-abuse)

/** POST /lead — capture an email from the public free tools (no auth). Bot-
    guarded (honeypot + email check), de-duplicated by email. Feeds the nurture
    list so a visitor who isn't ready to sign up isn't lost. */
export const lead = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const b = req.body ?? {};
    if (b.hp) throw httpError(400, 'rejected');                    // honeypot
    const email = String(b.email ?? '').trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'invalid email');
    const id = createHash('sha1').update(email).digest('hex').slice(0, 24);
    await db.doc(`leads/${id}`).set({
      email,
      source: String(b.source ?? 'free').slice(0, 40),
      subject: String(b.subject ?? '').slice(0, 60),
      grade: String(b.grade ?? '').slice(0, 12),
      ref: String(b.ref ?? '').slice(0, 32) || null,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ ok: true });
  } catch (e) { const err = e as Error & { status?: number }; res.status(err.status ?? 500).json({ ok: false, error: err.message }); }
});

/** GET /refcode — the signed-in user's personal invite code (created on first
    call) plus how many people have joined through it and the bonus earned.
    Powers the in-app "invite a friend" card. */
export const refcode = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const uref = db.doc(`users/${user.uid}`);
    const u = await uref.get();
    let code = (u.exists && (u.data()!.refCode as string)) || '';
    if (!code) {
      code = randomBytes(4).toString('hex'); // 8-char
      await db.doc(`refCodes/${code}`).set({ uid: user.uid, at: FieldValue.serverTimestamp() });
      await uref.set({ refCode: code }, { merge: true });
    }
    const joined = (await db.doc(`refCounters/${user.uid}`).get()).data()?.credited as number ?? 0;
    res.json({ ok: true, code, joined, bonus: joined * REF_BONUS });
  } catch (e) { const err = e as Error & { status?: number }; res.status(err.status ?? 500).json({ ok: false, error: err.message }); }
});

export const register = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    // human-only: cap registrations per account and reject browsers that
    // self-report as automated in the Sentinel attestation. Defence-in-depth
    // atop Firebase Auth's own abuse controls and the client-side gate.
    await enforceRate(user.uid, 'register', 20);
    try {
      const raw = String(req.body?.human ?? '');
      if (raw) {
        const att = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as { auto?: boolean; h?: boolean };
        if (att && att.auto === true) {
          await audit('REGISTER_BLOCKED_AUTOMATION', user.uid, { reason: 'sentinel:auto' });
          throw httpError(403, 'Automated sign-up blocked — this platform is for humans.');
        }
      }
    } catch (e) {
      if ((e as { status?: number }).status === 403) throw e; // re-throw the block; ignore parse errors
    }
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
    // referral loop: on a NEW registration carrying a valid invite code, credit
    // BOTH the new user and the referrer bonus ACUs — once per referee, capped
    // per referrer, idempotent via creditAcus dedupe. Best-effort: never blocks.
    try {
      if (!existing.exists) {
        const refCode = String(req.body?.ref ?? '').trim().slice(0, 32);
        if (refCode) {
          const map = await db.doc(`refCodes/${refCode}`).get();
          const referrerUid = map.exists ? String(map.data()!.uid) : '';
          if (referrerUid && referrerUid !== user.uid) {
            const seen = db.doc(`referrals/${user.uid}`);
            if (!(await seen.get()).exists) {
              await seen.set({ referrerUid, at: FieldValue.serverTimestamp() });
              await creditAcus(user.uid, REF_BONUS, 'referral:joined', { referrerUid }, `refjoin_${user.uid}`);
              const cntRef = db.doc(`refCounters/${referrerUid}`);
              const credited = (await cntRef.get()).data()?.credited as number ?? 0;
              if (credited < REF_CAP) {
                await creditAcus(referrerUid, REF_BONUS, 'referral:invitee', { referee: user.uid }, `refinv_${user.uid}`);
                await cntRef.set({ credited: credited + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
              }
              await audit('REFERRAL_CREDITED', user.uid, { referrerUid });
            }
          }
        }
      }
    } catch (e) { /* referral is best-effort */ }
    res.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------------- wallet state ----
/** GET /walletState — the authoritative, signed-in ACU balance + plan from the
    server ledger. The client reconciles its local wallet UPWARD from this so a
    buyer who completed payment but lost the redirect (closed tab, paid on
    another device) is still credited on next load, and a real plan/clawback is
    reflected. Read-only, owner-scoped. */
export const walletState = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const [balance, udoc] = await Promise.all([
      walletBalance(user.uid),
      db.doc(`users/${user.uid}`).get(),
    ]);
    const plan = (udoc.exists && (udoc.data()!.plan as string)) || 'child_free';
    res.json({ ok: true, balance, plan });
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

/**
 * GET /adminLeads — the captured free-tool leads for the Lifecycle & Nurture
 * agent (admin-only). Returns full addresses (the authenticated admin needs
 * them to email), plus segment counts by source/subject and how many are not
 * yet contacted. The static console masks these on-screen; full PII only ever
 * leaves via the admin's own CSV export.
 */
export const adminLeads = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const admin = await requireAdmin(req.headers.authorization);
    const snap = await db.collection('leads').orderBy('createdAt', 'desc').limit(1000).get();
    const iso = (v: { toDate?: () => Date } | undefined) => v?.toDate?.()?.toISOString() ?? null;
    const bySource: Record<string, number> = {};
    const bySubject: Record<string, number> = {};
    let notContacted = 0;
    const items = snap.docs.map((d) => {
      const x = d.data();
      const source = String(x.source ?? 'free');
      const subject = String(x.subject ?? '');
      bySource[source] = (bySource[source] ?? 0) + 1;
      if (subject) bySubject[subject] = (bySubject[subject] ?? 0) + 1;
      if (!x.contacted) notContacted += 1;
      return {
        id: d.id, email: x.email ?? null, source, subject,
        grade: String(x.grade ?? ''), ref: x.ref ?? null,
        contacted: !!x.contacted, createdAt: iso(x.createdAt),
      };
    });
    await audit('ADMIN_LEADS_READ', admin.uid, { count: items.length });
    res.json({ ok: true, items, counts: { total: items.length, notContacted, bySource, bySubject } });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /adminLeadMark { ids: string[] } — flag captured leads as contacted so
 * the nurture agent doesn't re-target them (admin-only, audited).
 */
export const adminLeadMark = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const admin = await requireAdmin(req.headers.authorization);
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as unknown[]).map((x) => String(x)).slice(0, 500) : [];
    if (!ids.length) throw httpError(400, 'ids required');
    const batch = db.batch();
    ids.forEach((id) => batch.set(db.doc(`leads/${id}`), { contacted: true, contactedAt: FieldValue.serverTimestamp() }, { merge: true }));
    await batch.commit();
    await audit('ADMIN_LEADS_MARK', admin.uid, { count: ids.length });
    res.json({ ok: true, marked: ids.length });
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
    await sendMail({ to: user.email, subject, text });
    await audit('NOTIFY_SENT', user.uid, { subject });
    res.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// --------------------------------------------------------- weekly newsletter ----
/**
 * Automatic weekly newsletter to every registered user — sells the platform's
 * features with plenty of hyperlinks back to the live site. Compliance:
 *  - one-click unsubscribe on every send (List-Unsubscribe header + footer link),
 *    honoured via the public /unsubscribe endpoint (UK PECR / GDPR);
 *  - registered users are subscribed unless they opt out (soft opt-in for a
 *    platform's own account holders);
 *  - idempotent per ISO week (a run doc + per-user lastNewsletter stamp) so a
 *    retry or manual re-trigger never double-sends the same issue.
 * Content is a curated, weekly-rotating catalogue (single source of truth) — no
 * per-send AI cost, and it never dead-ends on a provider outage.
 */
/** Send the issue to a set of recipients. onlyTo restricts to one address (test);
    otherwise every registered user who hasn't opted out and hasn't already had
    this week's issue. Idempotent + resilient (per-user failures are tallied). */
async function sendNewsletter(weekKey: string, opts: { onlyTo?: { uid: string; email: string }; by: string }): Promise<{ sent: number; failed: number; skipped: number; total: number }> {
  const transport = await mailTransport();
  if (!transport) throw httpError(503, 'mail not configured');
  let recipients: Array<{ uid: string; email: string; already: boolean; optedOut: boolean }> = [];
  if (opts.onlyTo) {
    recipients = [{ uid: opts.onlyTo.uid, email: opts.onlyTo.email, already: false, optedOut: false }];
  } else {
    const prefs: Record<string, FirebaseFirestore.DocumentData> = {};
    (await db.collection('users').get()).forEach((d) => { prefs[d.id] = d.data(); });
    let pageToken: string | undefined;
    do {
      const page = await getAuth().listUsers(1000, pageToken);
      page.users.forEach((u) => {
        if (!u.email) return;
        const p = (prefs[u.uid]?.emailPrefs ?? {}) as { newsletter?: boolean; lastNewsletter?: string };
        recipients.push({ uid: u.uid, email: u.email, already: p.lastNewsletter === weekKey, optedOut: p.newsletter === false || u.disabled });
      });
      pageToken = page.pageToken;
    } while (pageToken);
  }
  let sent = 0, failed = 0, skipped = 0;
  const total = recipients.length;
  // small batches to stay within SMTP limits; per-user errors never abort the run
  for (let i = 0; i < recipients.length; i += 20) {
    const batch = recipients.slice(i, i + 20);
    await Promise.all(batch.map(async (r) => {
      if (r.optedOut || r.already) { skipped++; return; }
      try {
        const m = nlRender(weekKey, r.uid);
        await transport.sendMail({ from: process.env.MAIL_FROM ?? process.env.MAIL_USER, to: r.email, subject: m.subject, text: m.text, html: m.html, headers: { 'List-Unsubscribe': `<${m.unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
        if (!opts.onlyTo) await db.doc(`users/${r.uid}`).set({ emailPrefs: { lastNewsletter: weekKey } }, { merge: true });
        sent++;
      } catch { failed++; }
    }));
  }
  return { sent, failed, skipped, total };
}

/** The scheduled weekly send. Idempotent: a completed run for the ISO week is a
    no-op, so retries and overlaps never double-send. */
export const weeklyNewsletter = onSchedule({ schedule: '0 9 * * 1', timeZone: 'Europe/London', region: 'europe-west2' }, async () => {
  const weekKey = isoWeekKey(new Date());
  const runRef = db.doc(`newsletterRuns/${weekKey}`);
  const run = await runRef.get();
  if (run.exists && run.data()?.finishedAt) return; // already sent this week
  await runRef.set({ weekKey, by: 'schedule', startedAt: FieldValue.serverTimestamp() }, { merge: true });
  try {
    if (!process.env.MAIL_HOST) { await runRef.set({ finishedAt: FieldValue.serverTimestamp(), error: 'mail not configured' }, { merge: true }); return; }
    const r = await sendNewsletter(weekKey, { by: 'schedule' });
    await runRef.set({ ...r, finishedAt: FieldValue.serverTimestamp() }, { merge: true });
    await audit('NEWSLETTER_SENT', 'system', { weekKey, ...r });
  } catch (e) {
    await runRef.set({ finishedAt: FieldValue.serverTimestamp(), error: (e as Error).message }, { merge: true });
  }
});

/** GET /unsubscribe?u=&t= — one-click opt-out (no login). Only ever sets the
    newsletter preference to false, so a forged link can't do harm. */
export const unsubscribe = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  const uid = String(req.query.u ?? '');
  const token = String(req.query.t ?? '');
  const ok = uid && verifyUnsub(uid, token);
  if (ok) {
    try { await db.doc(`users/${uid}`).set({ emailPrefs: { newsletter: false } }, { merge: true }); await audit('NEWSLETTER_UNSUBSCRIBE', uid, {}); } catch { /* ignore */ }
  }
  res.set('Content-Type', 'text/html; charset=utf-8').status(ok ? 200 : 400).send(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StudYear — ${ok ? 'Unsubscribed' : 'Link expired'}</title></head>` +
    `<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f4f7fb;color:#0f172a"><div style="max-width:520px;margin:8vh auto;background:#fff;border:1px solid #e6ecf5;border-radius:14px;padding:30px 28px;text-align:center">` +
    `<div style="font-size:20px;font-weight:800;color:#0b3a66">StudYear</div>` +
    (ok ? `<h1 style="font-size:22px;margin:16px 0 8px">You’ve been unsubscribed</h1><p style="color:#42506a;line-height:1.6">You won’t receive the weekly newsletter any more. You’ll still get essential account emails. Changed your mind? Manage email preferences in <a href="${SITE}/account/" style="color:#2E6BC4">your account</a>.</p>`
       : `<h1 style="font-size:22px;margin:16px 0 8px">This link isn’t valid</h1><p style="color:#42506a;line-height:1.6">The unsubscribe link is incomplete or has expired. You can manage email preferences in <a href="${SITE}/account/" style="color:#2E6BC4">your account</a>.</p>`) +
    `</div></body></html>`);
});

/** POST /adminNewsletter { op } — owner controls (admin-only, audited):
    preview (this week's HTML), test (send to the admin only), send (send now to
    everyone, idempotent), status (recent runs). */
export const adminNewsletter = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const admin = await requireAdmin(req.headers.authorization);
    const op = String(req.body?.op ?? 'preview');
    const weekKey = isoWeekKey(new Date());
    if (op === 'preview') {
      const m = nlRender(weekKey, admin.uid);
      res.json({ ok: true, weekKey, subject: m.subject, html: m.html });
    } else if (op === 'test') {
      if (!admin.email) throw httpError(400, 'admin has no email');
      const r = await sendNewsletter(weekKey, { onlyTo: { uid: admin.uid, email: admin.email }, by: 'admin-test' });
      await audit('NEWSLETTER_TEST', admin.uid, { weekKey, ...r });
      res.json({ ok: true, weekKey, ...r, to: admin.email });
    } else if (op === 'send') {
      const runRef = db.doc(`newsletterRuns/${weekKey}`);
      if ((await runRef.get()).data()?.finishedAt) { res.json({ ok: true, weekKey, alreadySent: true }); return; }
      await runRef.set({ weekKey, by: 'admin', startedAt: FieldValue.serverTimestamp() }, { merge: true });
      const r = await sendNewsletter(weekKey, { by: 'admin' });
      await runRef.set({ ...r, finishedAt: FieldValue.serverTimestamp() }, { merge: true });
      await audit('NEWSLETTER_SENT', admin.uid, { weekKey, ...r });
      res.json({ ok: true, weekKey, ...r });
    } else if (op === 'status') {
      const runs = await db.collection('newsletterRuns').orderBy('startedAt', 'desc').limit(8).get();
      const iso = (v: { toDate?: () => Date } | undefined) => v?.toDate?.()?.toISOString() ?? null;
      res.json({ ok: true, mailConfigured: !!process.env.MAIL_HOST, runs: runs.docs.map((d) => ({ id: d.id, ...d.data(), startedAt: iso(d.data().startedAt), finishedAt: iso(d.data().finishedAt) })) });
    } else throw httpError(400, 'unknown op');
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
    // bound share-code enumeration: cap the lookup/link ops per caller per day
    // (publish is the caller's OWN code, so it is not enumeration and not capped)
    if (op === 'resolve' || op === 'connect') await enforceRate(user.uid, 'dir', 150);

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

// ------------------------------------------------ Pathways opportunities market ----
/**
 * POST/GET /market — the cross-device opportunities marketplace for the 14+
 * technical-education layer. Employers and colleges publish opportunities
 * (work experience, mentoring, business-set projects, workplace visits,
 * apprenticeships, courses, provider-access offers); students, schools and
 * Strategic Authorities read them to discover local provision and compute
 * skills supply-vs-demand.
 *
 * Public read (any signed-in account); write and delete are owner-only. No
 * personal/child data lives here — only organisation-published opportunities —
 * so it is deliberately NOT in the E2EE personal namespace.
 */
const MARKET_KINDS = ['encounter', 'workexp', 'mentoring', 'project', 'visit', 'apprenticeship', 'vacancy', 'course', 'provider'];
const MARKET_OWNER_KINDS = ['employer', 'college'];
function marketShape(d: FirebaseFirestore.QueryDocumentSnapshot) {
  const v = d.data();
  return {
    id: d.id, owner: v.ownerEmail ?? null, ownerName: v.ownerName ?? null, ownerKind: v.ownerKind ?? 'employer',
    kind: v.kind ?? 'encounter', type: v.type ?? null, sector: v.sector ?? null, title: v.title ?? '',
    level: v.level ?? '', location: v.location ?? '', capacity: v.capacity ?? null, date: v.date ?? null,
    created: v.createdAt && v.createdAt.toMillis ? v.createdAt.toMillis() : null,
  };
}
export const market = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const user = await requireUser(req.headers.authorization);
    const op = String(req.query.op ?? req.body?.op ?? 'list');

    if (op === 'list') {
      // equality filters only (no composite index needed); sort newest-first in memory
      const sector = String(req.query.sector ?? '').trim();
      const ownerKind = String(req.query.ownerKind ?? '').trim();
      const mine = String(req.query.mine ?? '') === '1';
      let q: FirebaseFirestore.Query = db.collection('pathwaysMarket');
      if (mine) q = q.where('ownerId', '==', user.uid);
      else if (sector) q = q.where('sector', '==', sector);
      else if (ownerKind) q = q.where('ownerKind', '==', ownerKind);
      const snap = await q.limit(400).get();
      let items = snap.docs.map(marketShape);
      if (sector && mine) items = items.filter((o) => o.sector === sector);
      items.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
      res.json({ ok: true, items: items.slice(0, 300) });
      return;
    }

    if (op === 'publish') {
      const e = req.body?.entry ?? {};
      const id = String(e.id ?? '').trim();
      const kind = String(e.kind ?? 'encounter');
      if (!/^[A-Za-z0-9_-]{4,48}$/.test(id)) throw httpError(400, 'invalid id');
      if (!MARKET_KINDS.includes(kind)) throw httpError(400, 'invalid kind');
      const title = String(e.title ?? '').trim().slice(0, 160);
      if (!title) throw httpError(400, 'title required');
      const ref = db.doc(`pathwaysMarket/${id}`);
      const existing = await ref.get();
      // an opportunity already owned by another account cannot be overwritten
      if (existing.exists && existing.data()!.ownerId !== user.uid) throw httpError(409, 'not your opportunity');
      const ownerKind = MARKET_OWNER_KINDS.includes(String(e.ownerKind)) ? String(e.ownerKind) : 'employer';
      const cap = e.capacity != null && e.capacity !== '' ? Math.max(0, Math.min(9999, Number(e.capacity) || 0)) : null;
      await ref.set({
        ownerId: user.uid, ownerEmail: user.email ?? null, ownerName: String(e.ownerName ?? '').slice(0, 120),
        ownerKind, kind, type: e.type ? String(e.type).slice(0, 24) : null,
        sector: e.sector ? String(e.sector).slice(0, 24) : null, title,
        level: String(e.level ?? '').slice(0, 60), location: String(e.location ?? '').slice(0, 80),
        capacity: cap, date: e.date ? String(e.date).slice(0, 10) : null,
        createdAt: existing.exists ? (existing.data()!.createdAt ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ ok: true, id });
      return;
    }

    if (op === 'remove') {
      const id = String(req.body?.id ?? '').trim();
      if (!id) throw httpError(400, 'id required');
      const ref = db.doc(`pathwaysMarket/${id}`);
      const d = await ref.get();
      if (d.exists && d.data()!.ownerId === user.uid) await ref.delete();
      res.json({ ok: true });
      return;
    }

    throw httpError(400, 'unknown op');
  } catch (e) {
    const err = e as Error & { status?: number };
    res.status(err.status ?? 500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------- blog ----
/** The public-facing shape of a blog post — everything the blog reader and the
    static generator need, and nothing internal. */
function blogShape(d: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  const x = d.data() ?? {};
  return {
    id: d.id, title: x.title ?? '', slug: x.slug ?? d.id, category: x.category ?? 'Article',
    excerpt: x.excerpt ?? '', metaDesc: x.metaDesc ?? '', body: x.body ?? '',
    tags: Array.isArray(x.tags) ? x.tags : [], keyword: x.keyword ?? '',
    readTime: x.readTime ?? 3, seoScore: x.seoScore ?? 0, published: x.published === true,
    date: x.date ?? null, reviewed: x.reviewed ?? null,
  };
}
/**
 * /blog — one-click live blog publishing from the AI Studio.
 *  - GET  ?op=list           → PUBLIC: every published post, newest first
 *                              (the blog reader merges these over its committed
 *                              posts.json, so an admin post appears live with no
 *                              redeploy).
 *  - POST {op:'publish',post} → ADMIN: upsert a post (published flag honoured).
 *  - POST {op:'remove',id}    → ADMIN: delete a post.
 * The committed posts.json + static /blog/<slug>/ pages stay the crawlable
 * source of truth for SEO; this endpoint is the instant-publish overlay.
 */
export const blog = onRequest({ region: 'europe-west2', cors: true }, async (req, res) => {
  try {
    const op = String(req.query.op ?? req.body?.op ?? 'list');

    if (op === 'list') {
      const snap = await db.collection('blogPosts').where('published', '==', true).limit(300).get();
      const items = snap.docs.map(blogShape).sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
      res.set('Cache-Control', 'public, max-age=120');
      res.json({ ok: true, items });
      return;
    }

    // everything past here mutates — admins only
    const admin = await requireAdmin(req.headers.authorization);

    if (op === 'publish') {
      const p = req.body?.post ?? {};
      const id = String(p.id ?? '').trim();
      if (!/^[A-Za-z0-9_-]{3,64}$/.test(id)) throw httpError(400, 'invalid id');
      const title = String(p.title ?? '').trim().slice(0, 200);
      if (!title) throw httpError(400, 'title required');
      const slug = String(p.slug ?? id).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || id;
      await db.doc(`blogPosts/${id}`).set({
        title, slug, category: String(p.category ?? 'Article').slice(0, 60),
        excerpt: String(p.excerpt ?? '').slice(0, 400), metaDesc: String(p.metaDesc ?? '').slice(0, 320),
        body: String(p.body ?? '').slice(0, 40000),
        tags: Array.isArray(p.tags) ? p.tags.slice(0, 12).map((t: unknown) => String(t).slice(0, 40)) : [],
        keyword: String(p.keyword ?? '').slice(0, 80),
        readTime: Math.max(1, Math.min(60, Number(p.readTime) || 3)),
        seoScore: Math.max(0, Math.min(100, Number(p.seoScore) || 0)),
        published: p.published !== false,
        date: p.date ? String(p.date).slice(0, 30) : new Date().toISOString(),
        reviewed: new Date().toISOString(),
        authorEmail: admin.email ?? null, updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      res.json({ ok: true, id, slug });
      return;
    }

    if (op === 'remove') {
      const id = String(req.body?.id ?? '').trim();
      if (!id) throw httpError(400, 'id required');
      await db.doc(`blogPosts/${id}`).delete();
      res.json({ ok: true });
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
