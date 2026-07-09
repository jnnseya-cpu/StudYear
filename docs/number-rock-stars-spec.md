# StudYear AI-OS · Product Specification

# Number Rock Stars™
### The Four-Operation Arithmetic Fluency Module
*The complete TT Rock Stars mechanic set, replicated across addition, subtraction, multiplication and division.*

**Prepared for:** Justin Nseya · Directeur Général, Groupe Nseya Digital / JNN Global Ltd
**Platform:** StudYear AI-OS — powered by the Personalisation Engine & agent registry · UK + DRC/francophone-Africa corridors
**Status:** v1 SHIPPED in the SkillRush™ Fluency Arena (`/skillrush/`), teacher layer at `/teacher/fluency/`, parent layer in the Parent Command Centre.

---

## 00 · What this module is

A narrow-domain, gamified, adaptive fluency loop — the proven TTRS model — generalised from one
operation (×) to all four. It is StudYear's foundational-numeracy on-ramp (Year 1 → KS3) feeding
the full GCSE/A-Level/IB platform, and the natural DRC entry product (TENAFEP-aligned).

**Design principle:** one legible metric, one visible next rung, a forgiving adaptive grind, zero
teacher labour — applied four times over, with a fact graph of ~530 core facts (extensible to
1,000+) instead of 144, while the learner-facing surface stays exactly as simple.

### The fact universe — implemented
| Operation | Fact space | Bounds (level-pitched) | Inverse pair |
|---|---|---|---|
| Addition + | ~121 core | 0+0 … 10+10 (→ 20+20 → 2-digit) | Subtraction |
| Subtraction − | ~121 core | differences within 20 (→ 2-digit) | Addition |
| Multiplication × | ~144 | 1×1 … 12×12 | Division |
| Division ÷ | ~144 | ÷1 … ÷12, exact quotients | Multiplication |

Inverse relationships are first-class: every generated fact carries its inverse key, and a correct
answer propagates half-credit to the inverse node (`7×8` ✓ raises the prior on `56÷8`).

## 01 · Game modes (shipped mapping)

| Spec mode | TTRS origin | Shipped as |
|---|---|---|
| Warm-Up | Jamming | 🌱 Confidence Mode (no timer, learner-chosen skill, hints) |
| Practice Bay | Garage | ⚡ Focus Mode (adaptive re-weight to weakest/slowest facts, richest coins) |
| Studio | Studio | Speed/accuracy tracking per session; Number Rank derived from fact latency |
| Checkpoint | Soundcheck | ⏱ Exam Pressure (25 Q × 6 s — MTC-faithful) |
| Monthly Gig | Gig | 🩺 Arithmetic Diagnostic (12 Q across the four ops, readiness statuses) + admin-triggered National Test (one attempt) |
| Battles | Battles | ⚔️ Class Battle (weekly class totals via the school store) |
| Number Slam | Rock Slam | 👨‍👧 Parent Challenge (async/pass-the-device duel) |
| Arena / Festival | Arena/Festival | League boards (school + device); live-realtime arrives with the Firebase backend |
| **Four-Op Gauntlet** *(TTRS lacks)* | — | Diagnostic rotates all four operations in one run |
| Comeback / Streak Rescue | — | Recovery ramp + gentle-return session (StudYear exclusive) |
| 🤖 AI Coach | — | Why-you're-stuck + targeted mini-lesson (live model, premium tier) |

## 02 · Progression — the Number Rank ladder (shipped)

Per-operation speed rank from rolling fact latency, colour-coded per operation
(＋green · −blue · ×purple · ÷orange), shown on each operation tile:

`Number God (≤1s) → Number Legend (≤2s) → Number Star (≤3s) → Headliner → Support Act →
Breakthrough → Rising Act → Gigger → Busker → Garage Act → Newcomer` · *Unranked* below 10 tracked facts.

Plus mastery trophies at ≥90% over 20+ attempts: **Addition Hero · Subtraction Sniper ·
Multiplication Boss · Division Master**, XP level titles (Rookie → Grandmaster), coins, streaks,
badges and certificates (Achievements page).

## 03 · The adaptive engine (shipped)

- **Unit of mastery:** one fact node (`add:7+8`, `sub:15-6`, `mul:7x8`, `div:56/8`) with accuracy,
  attempts and rolling latency (EWMA).
- **Adaptive selection:** Focus & Comeback bias question generation to the 6 weakest/slowest facts
  in scope (mastery <85% or latency >4 s); falls back to random until ≥3 candidates exist.
- **Inverse linking:** correct answers propagate half-credit across +↔− and ×↔÷.
- **Learner view:** four red→green fact heatmaps (12×12 for ×/÷; 0–10 grids for +/−) with
  per-cell tooltips; "gone green" per operation. Ready / At-risk / Critical status per operation.
- **Cross-operation diagnosis:** the four-op diagnostic exposes relational gaps (× strong, ÷ weak)
  the single-op incumbent structurally cannot see.

## 04 · Assessment & the statutory wedge

- **× Checkpoint** — Exam Pressure mode mirrors the UK MTC (25 questions, ~6 s).
- **Four-Op Gauntlet** — the Arithmetic Diagnostic (KS2-SATs-style mixed check).
- **National Test** — admin-triggered, one official attempt, grouped by education level; top 5 per
  level win a year of full access for learner + parent.
- **TENAFEP Numeracy** — *pending source material:* board-faithful DRC papers slot into the same
  Checkpoint engine once curriculum documents are supplied.
- **Readiness Hub** — teacher fluency console shows MTC-ready count, at-risk list and per-class
  gap heatmap.

## 05 · Teacher & admin layer (shipped)

Class fluency heatmap (students × skills, mastery by colour) · at-risk + fastest-improving with AI
intervention suggestions · teacher-directed practice (class focus = every student's daily mission)
· printable practice sheets with answer keys (PDF/Word) · parent-update generator (live AI) ·
class-battle manager · school league · MTC-readiness KPI.
*Pending backend:* spreadsheet→auto-credential onboarding, live Arena spectate, MAT rollups
(the LA console already provides multi-school benchmarking + exportable evidence packs).

## 06 · Economy, accessibility & wellbeing (shipped)

Mode-weighted coins (Focus 4 → Exam/Battle 3 → standard 2 → assessment 1) keep status honest;
spend is cosmetic (avatars). Accessibility: huge font, dyslexia-friendly font, hide timer,
read-aloud (speech synthesis), voice answers (speech recognition where supported), anonymous rock
names, parent-set curfew/quiet hours, no ads/chat/purchases.

## 07 · Go-to-market & the Africa on-ramp

Land (free tier + simple school SKU) → wedge (statutory checkpoints) → expand (trust dashboards →
full StudYear) → consumer on-ramp (family/tutor tiers). **Hip Hoppers playbook executed from day
one:** the FR localisation pack ships in v1 (wrapper + French spelling/grammar banks, engine
untouched); Lingala/Swahili packs, TENAFEP-faithful papers and BitriPay rails are the next
corridor steps (require curriculum sources + payment rail).

## 08 · Engine mapping — mechanic → agent

| Mechanic | Engine hook | Owning agent role |
|---|---|---|
| Focus adaptive loop | Weakest/slowest-fact re-weighting (next-best-item) | Adaptive Practice / Item-Selection |
| Four operation heatmaps | Per-fact mastery vectors | Diagnostics / Mastery-Tracking |
| Inverse-pair linking | Linked-node half-credit propagation | Knowledge-Graph |
| Misconception inference | Cross-operation pattern analysis (diagnostic) | Learner-Profiling |
| Number Rank ladder | Per-op rolling-latency estimate | Progression / Gamification |
| Coins & cosmetics | Mode-weighted engagement economy | Motivation / Rewards |
| Checkpoints (MTC / TENAFEP) | Exam-format simulation | Assessment / Papers |
| Diagnostic + National Test | Baseline cadence, one honest attempt | Scheduling / Baseline |
| Class focus / homework | Teacher-scoped mission override | Assignment / Teacher-Console |
| Class + LA analytics | Aggregated mastery rollups, evidence packs | Analytics / Reporting |
| Battles / leagues | School-store aggregation (live matchmaking → backend) | Multiplayer / Social |
| Calm / anonymous / curfew | Anxiety-aware pressure control | Wellbeing |
| Read-aloud / voice / fonts | Modality preferences | Accessibility |
| FR pack (→ Lingala/Swahili) | Locale/culture personalisation | Localisation |
| Readiness statuses | Cohort-readiness scoring | Guidance / Advisory |

## 09 · Build sequence — status

**Phase 1 (SHIPPED):** fact graph + adaptive engine with inverse linking; four heatmaps; Number
Rank ladder; teacher layer (class focus, worksheets, heatmap); × Checkpoint (MTC-faithful Exam
Pressure).
**Phase 2 (SHIPPED core):** battles + leagues + Parent Challenge; mode-weighted economy;
Four-Op Gauntlet diagnostic; class analytics + readiness. *(Live-realtime Arena/Festival and MAT
rollups arrive with the Firebase backend.)*
**Phase 3 (STARTED):** FR localisation pack shipped; TENAFEP papers, Lingala/Swahili themes,
offline packs and BitriPay await source material and the payment rail; the upsell bridge exists —
SkillRush results already feed My Progress, the parent command centre and predicted grades.

---

*Everything above marked "shipped" is live and Playwright-verified in the static preview build;
items marked "pending" require external inputs (Firebase backend, DRC curriculum documents,
BitriPay) and slot into seams already built (`ai.js`, `billing.js`, school store).*
