# Implementation status — honest traceability snapshot

> Companion to [REQUIREMENTS-MANDATE.md](REQUIREMENTS-MANDATE.md). Status of every major
> capability in the corpus as of 2026-07-06. Legend: ✅ real and working ·
> 🟡 working UI with demo/simulated data · ❌ specified but not implemented.

## The structural fact

The live surface is a **static site (GitHub Pages)** — the owner's current, deliberate
deployment decision. Static hosting can run everything client-side (UI, tools, local
data) but **cannot** run AI models, payment processing, server-verified accounts, or a
shared database. Every ❌ below traces to one of two blockers:
**B1 — backend not deployed** (Firebase Functions/Firestore exist in `backend/` but are
undeployed, by decision) and **B2 — no live AI/payment keys** (the previously shared
keys are compromised and must be rotated before any real AI or Stripe call).

## Status by capability

| Area | Status | Notes / blocker |
|---|---|---|
| Cinematic landing, brand system, logo | ✅ | Live |
| Company & legal pages (about, contact, terms, privacy…) | ✅ | Drafts need solicitor pass |
| Controlled vocabularies (15 levels, 30 subjects, 9 boards, 29 topics, 23 types) | ✅ | Shared contracts + wired into surfaces |
| Per-category consoles & separated dashboards | 🟡 | Real routes/UX; charts & wallet are canned data (B1) |
| Role-gated access (signup/sign-in per category) | 🟡 | Working flow, browser-local sessions; Firebase Auth + server rules pending (B1) |
| Study workspace: search, planner, flashcards, quizzes, notes, mindmaps, revision cards, timelines, crosswords, tables, SWOT, character analysis, progress | 🟡 | Fully interactive but client-side; 13 of 23 resource types have viewers and 8 have creators; no shared community library (B1) |
| Past papers locator | 🟡 | Working filters over a demo dataset; no real PDF archive links |
| Tutor bot | 🟡 | Canned pattern-matched answers — **not AI** (B1+B2) |
| AI tutor / homework help (real model) | ❌ | B1 + B2 |
| AI generators: courses, quizzes, flashcards, summaries, mind maps, formula sheets | ❌ | B1 + B2 |
| Academic diagnostic → results → recovery plan engine | 🟡 | Rules-based wizard live in the workspace (mastery map, predicted grade, recovery week into the planner); the AI version (SY-A04) is B1 + B2 |
| Predicted grades (real model over live mastery) | 🟡 | Static calculator live — blends quiz history with the latest diagnostic; real model B1 |
| Assignment review / paper analysis (mark-scheme marking) | ❌ | B1 + B2 |
| Visual/graph generation engine | ❌ | B1 + B2 |
| ACU wallet: real ledger, reserve→settle, hard stop | ❌ | Contracts exist in `@studyear/shared`; engine is B1 |
| Stripe billing, subscriptions, top-ups (GBP) | ❌ | B1 + B2 (new Stripe keys) |
| Referral / growth partner programme | ❌ | Contracts defined; engine B1 |
| Parent↔child linking & consent grants | ❌ | B1 |
| Tutor marketplace (discovery, booking, payouts, DBS) | ❌ | B1 |
| School multi-tenancy, MIS/SSO, shared ACU pools | ❌ | B1 |
| Messaging / notifications / weekly digests | ❌ | B1 |
| Admin ops: moderation, content verification, fraud/billing ops | ❌ | B1 |
| PWA: manifest + icons | ✅ | Installable shell |
| PWA: service worker / offline | ✅ | Cache-first assets, network-first navigations, offline fallback |
| Firestore security rules, Functions API scaffold | 🟡 | Code in `backend/`, undeployed (B1) |
| Architecture & product documentation (docs/) | ✅ | Extensive |

**Rough shape: ~15% real, ~25% working-with-demo-data, ~60% not implemented — and the
missing 60% is overwhelmingly the backend-dependent core (AI + money + shared data).**

## The two roads (not mutually exclusive)

1. **Static-max** — keep shipping everything that can be real without a backend.
   Shipped so far: the diagnostic → recovery-plan wizard, the grade-prediction
   calculator, offline PWA, and viewers/creators for timelines, crosswords, the
   three comparison tables, SWOT, character analysis and grids. Still open: the
   media-embed types (audio, video, image, presentation, document, spreadsheet,
   web page), quizsearch/multi-tool, and an ever-deeper seeded resource library
   across subjects and levels.
2. **Backend unlock** — deploy `backend/` to Firebase (go-live guide Part 3), rotate all
   AI/Stripe keys, then implement the ACU ledger, real auth, real AI flows and Stripe.
   This is the only road to the other ~60%; it stays deferred until the owner says go.
