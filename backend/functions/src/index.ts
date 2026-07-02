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
import { ACU_TARIFF, FREE_TIER, MARGIN, type MeteredActivity } from '@studyear/shared';

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
