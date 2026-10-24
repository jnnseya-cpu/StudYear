# StudYear — Launch Authority Final Report

Audit standard: **MASTER PROMPT v2**. Access available this run: **repository, terminal, CI/CD**.
Access NOT available: live browser against staging/prod with real sessions, production database,
cloud consoles (Firebase/Vercel/Stripe), payment sandbox, load-test infrastructure, monitoring.
Per the prompt's own Section 0, areas needing that access are reported **UNTESTED**, never PASS.

---

## 1. Executive verdict

**NO-GO (not approved for public launch).**
Confidence this is the correct verdict: **high (~0.9)**. Cycles run: 2 (recon + fix pass 1; security P0 fix pass 2).

One-paragraph reality: StudYear is a genuinely substantial, mostly-real edtech platform — the code is
unusually clean, most public claims trace to real implementations, and the core AI/study features exist
end-to-end. But it is **not launch-ready** for three honest reasons: (1) it carried a **P0 unauthenticated
admin-takeover** (now fixed in code + deployed, with one owner step to fully close); (2) it has a **real
financial-integrity gap** — AI usage is metered client-side only, so ACUs can be spent-free by bypassing
the browser; and (3) **entire launch gates are untested** because they require a staging environment,
sandbox payment keys, database and monitoring access I don't have. A platform with major untested gates
is, by this standard, NO-GO until those are exercised.

## 2. Immediate launch blockers

| ID | Sev | Area | Defect | Status |
|----|-----|------|--------|--------|
| SY-001 | P0 | Security | Unauthenticated admin takeover via `adminBootstrap` (public invite hash) | **FIXED + deployed**; H1 to fully close |
| SY-002 | P1 | Payments | No server-side ACU debit in `aiProxy` (denial-of-wallet) | OPEN |
| SY-003 | P1 | QA | CI E2E suite red since 2026-10-04 | PARTIAL (2 of 4 fixed) |
| SY-014 | — | Coverage | Payments, load, DR, DB, device/a11y, privacy, monitoring UNTESTED | BLOCKED (access) |

## 3. Gate results

| Gate | Status | Note |
|------|--------|------|
| 1 Build integrity | **PASS (build) / FAIL (tests)** | Deterministic build + clean typecheck across 3 workspaces; but the E2E gate has been red for weeks (SY-003). |
| 2 Truth & fitness | **PARTIAL** | Most claims REAL; fabricated dashboard metrics now labelled (SY-006); novice-on-real-device value path UNTESTED. |
| 3 Critical functionality | **UNTESTED** | No live session/browser against a real backend. |
| 4 Security | **CONDITIONAL** | P0 fixed+deployed; MEDIUM/LOW open (SY-004/005/009/010/011/012). |
| 5 Data integrity | **UNTESTED** | No DB access; no restore drill. |
| 6 Financial integrity | **FAIL** | SY-002 server-side metering gap; no payments test; no reconciliation/invariants. |
| 7 Performance | **UNTESTED** | No load infra. |
| 8 Reliability | **UNTESTED** | No failure injection against live deps. |
| 9 Observability | **PARTIAL** | Audit events + `alertOwner` exist; delivery unproven (H6). |
| 10 Privacy & compliance | **UNTESTED** | No deletion drill; Children's Code sign-off pending (H7). |
| 11 Operational readiness | **PARTIAL** | Account ownership unverified (H5); CI red. |

## 4. Truth audit summary

Based on a full static trace + a dedicated sub-audit. The platform is **not** a fake shell — most claims are REAL:
- **REAL**: AI tutor/examiner/course/flashcards/quiz/spelling/Skills Coach (all route through `aiProxy` to real models — OpenAI/Anthropic/Gemini, all vision-capable); study planner; diagnostics; spaced repetition; blog; referral/lead capture; Stripe checkout plumbing; cross-device sync (E2E-encrypted).
- **Honest-by-design**: live stats are empty until real adoption and **exclude** demo/test accounts; `proof.json`/testimonials empty until real; demo surface isolated on `@demo.studyear`.
- **Was misleading, now fixed**: legacy `dashboards/{teacher,school,tutor}` hardcoded metrics (labelled); dead `/app/*` stubs → fake dashboards (removed).
- **Gap**: AI metering is real client-side but **not enforced server-side** (SY-002) — the billing claim is only partially real.

## 5. Novice-user findings

**UNTESTED on a real device/throttled network** (no browser access). Static review notes: sign-up, cloud
provisioning self-heal, and the "Finish setup" confirmation were hardened earlier this session; the ACU/pay-per-use
model was clarified. A real 360px / slow-3G / French walkthrough is required before any claim here — logged as H3.

## 6. Coverage

- **Executed**: production build (static export) ✓; typecheck (3 workspaces) ✓; `npm audit` ✓; E2E suite run ✓ (red); 3 parallel static sub-audits (duplicates/obsolete, security surface, dummy data) ✓; targeted E2E suites `exam-test`/`prem-test`/`cloud-test`/`demo-test` ✓.
- **Not executed (access)**: live journey/API/payment/permission/load/DR/privacy/device tests.

## 7. Architecture & dependencies

Monorepo (npm workspaces): `apps/web` (Next.js static export + Vercel; app is mostly vanilla HTML/JS in `public/`),
`packages/shared` (TS), `backend/functions` (Firebase Cloud Functions, TS). DB Firestore; Auth Firebase Auth;
Storage Firebase Storage; Payments Stripe (+ ACU credit ledger); Email nodemailer; AI OpenAI/Anthropic/Gemini via a
server `aiProxy`. Deploy: Vercel + GitHub Pages (web), Firebase (backend). **SPOFs/risks**: single Firebase project;
**public repo** (H2); account-ownership unverified (H5); CI verify red (SY-003).

## 8–14. (Security / Functional / Data / Payments / AI / Performance / Observability)

See `defects.md`. Security: 1 P0 (fixed), several MEDIUM/LOW open. Functional/Data/Payments/Perf/Privacy largely
**UNTESTED (access)**. AI: real provider calls confirmed in code + proven by the existing Assignment Review path;
vision always routed to a vision-capable model; **no measured eval set** run (needs live keys). Financial: the
invariants report cannot be produced without DB access; the metering gap (SY-002) means ledger integrity is **not** proven.

## 15. Fixes implemented this audit

| Defect | Change | Deploy |
|--------|--------|--------|
| SY-001 | adminBootstrap fail-closed (burned-hash denylist; authed-admin or fresh-secret only; owner alert); client sends admin token | backend deployed ✓ (2026-10-24 18:51Z) + frontend |
| SY-006 | Visible "example data" banner on 3 legacy dashboards | frontend ✓ |
| SY-007 | Removed 7 dead `/app/*` stubs (verified `/app/*` still served) | frontend ✓ |
| SY-008 | Removed client admin invite hash + public admin sign-up | frontend ✓ |
| SY-003 (part) | `exam-test` + `prem-test` updated to pay-per-use; both pass | — |

## 16. Unresolved risks

SY-002 (financial), SY-003 (remaining E2E), SY-004/005 (headers/CSP), SY-009/010/011/012 (hardening), SY-013
(deps), SY-014 (untested gates). None safely closable without owner input or access.

## 17. Human Action List

See `human-actions.md` (H1–H7). The blocking ones for GO: **H1** (rotate admin secret), **H3** (staging + sandbox),
plus SY-002 fix and a real test pass.

## 18. Pre-launch action plan

- **Before ANY launch**: H1; fix SY-002; green the E2E suite; H3 to actually test critical journeys + payments.
- **Before beta**: SY-004 (headers on Pages), SY-010 (checkout binding), H5/H6 (ownership + alerting), privacy-deletion drill (H7).
- **Before public**: SY-005 (CSP nonce), SY-013 (deps), load/DR drills, full device/a11y pass.
- **Within 7/30 days**: SY-009/011/012; monitoring dashboards; reconciliation job.

## 19. Launch configuration (recommended if a restricted pilot is desired later)

Invite-only; UK only; disable public admin sign-up (done); keep AI behind ACU balance; rate-limit checkout;
rollback = redeploy previous commit (backend) / Vercel rollback (web); kill-switch = unset AI provider key.

## 20. Final decision

**This release is not approved for public launch.**

It is close on code quality and realness, and a **restricted invite-only pilot** could be reachable after
H1, SY-002, a green E2E run, and H3 (so critical journeys + payments are actually tested, not assumed).
No GO or CONDITIONAL GO can be honestly issued while core gates remain untested and a financial-integrity
gap is open.
