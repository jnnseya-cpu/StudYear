# StudYear AI-OS · Product Specification

# Maths Heroes™
### The Four-Operation Arithmetic Fluency Module
*Addition. Subtraction. Multiplication. Division. Mastered — one smart question at a time.*

**Prepared for:** Justin Nseya · Directeur Général, Groupe Nseya Digital / JNN Global Ltd
**Platform:** StudYear AI-OS — powered by the Personalisation Engine & agent registry · UK + DRC/francophone-Africa corridors
**Status:** v1 SHIPPED inside the SkillRush™ Fluency Arena (`/skillrush/`), teacher layer at `/teacher/fluency/`, parent layer in the Parent Command Centre.

---

## 00 · What this module is

A narrow-domain, gamified, adaptive fluency loop covering all four arithmetic operations. It is
StudYear's foundational-numeracy on-ramp (Year 1 → KS3) feeding the full GCSE/A-Level/IB platform,
and the natural DRC entry product (TENAFEP-aligned).

**Design principle:** one legible metric, one visible next rung, a forgiving adaptive grind, zero
teacher labour — applied four times over, across a fact graph of ~530 core facts (extensible to
1,000+), while the learner-facing surface stays radically simple.

### The fact universe — implemented
| Operation | Fact space | Bounds (level-pitched) | Inverse pair |
|---|---|---|---|
| Addition + | ~121 core | 0+0 … 10+10 (→ 20+20 → 2-digit) | Subtraction |
| Subtraction − | ~121 core | differences within 20 (→ 2-digit) | Addition |
| Multiplication × | ~144 | 1×1 … 12×12 | Division |
| Division ÷ | ~144 | ÷1 … ÷12, exact quotients | Multiplication |

Inverse relationships are first-class: every generated fact carries its inverse key, and a correct
answer propagates half-credit to the inverse node (`7×8` ✓ raises the prior on `56÷8`).

## 01 · Game modes (shipped)

A pressure ladder from timer-free confidence-building to honest assessment and competition:

| Mode | Mechanic | Reward weighting |
|---|---|---|
| 🌱 Confidence | No timer, learner-chosen skill, hints — rebuild self-belief first | standard |
| ⚡ Focus | Adaptive: re-weights to the learner's weakest/slowest facts · 3 min | **richest** (steers volume to smart practice) |
| 🚀 Comeback | Starts easy, ramps up — recovery after a dip | standard |
| ⏱ Exam Pressure | 25 questions · 6 s each — mirrors the statutory Multiplication Tables Check | reduced |
| 🩺 Arithmetic Diagnostic | 12 questions rotating all four operations — the full-numeracy check | minimal (honest signal) |
| ⚔️ Class Battle | Every correct answer scores for the class week (school store) | boosted |
| 👨‍👧 Parent Challenge | Pass-the-device duel: learner vs parent, 6 questions each | standard |
| 🏆 National Test | Admin-triggered, one official attempt, grouped by education level; top 5 per level win a year of full access for learner + parent | minimal |
| 🛟 Streak Rescue | Gentle 8-question return session after missed days | standard |
| 🤖 AI Coach | Why-you're-stuck + targeted mini-lesson (live model; premium tier) | — |

## 02 · Progression — the Number Rank ladder (shipped)

Per-operation speed rank from rolling fact latency, colour-coded per operation
(＋green · −blue · ×purple · ÷orange), shown on each operation tile:

`Lightning Hero (≤1s) → Number Legend (≤2s) → Number Star (≤3s) → Champion → Challenger →
Climber → Riser → Improver → Explorer → Starter → Newcomer` · *Unranked* below 10 tracked facts.

Plus mastery trophies at ≥90% over 20+ attempts — **Addition Hero · Subtraction Sniper ·
Multiplication Boss · Division Master** — XP level titles (Rookie → Grandmaster), coins, streaks,
badges and certificates (Achievements page). Rank derives only from honest assessment-grade play;
practice is rewarded generously in coins but never mints status.

## 03 · The adaptive engine (shipped)

- **Unit of mastery:** one fact node (`add:7+8`, `sub:15-6`, `mul:7x8`, `div:56/8`) with accuracy,
  attempts and rolling latency (EWMA).
- **Adaptive selection:** Focus & Comeback bias question generation to the 6 weakest/slowest facts
  in scope (mastery <85% or latency >4 s); random until enough signal exists.
- **Inverse linking:** correct answers propagate half-credit across +↔− and ×↔÷.
- **Learner view:** four red→green fact heatmaps (12×12 for ×/÷; 0–10 grids for +/−) with
  per-cell tooltips; "gone green" per operation. Ready / At-risk / Critical status per operation.
- **Cross-operation diagnosis:** the four-op diagnostic exposes relational gaps (× strong, ÷ weak
  = relational gap; + strong, − weak = bridging/place-value issue) — signal a single-operation
  product structurally cannot see.

## 04 · Assessment & the statutory wedge

- **× Checkpoint** — Exam Pressure mode mirrors the UK Multiplication Tables Check (25 Q, ~6 s).
- **Four-Op Gauntlet** — the Arithmetic Diagnostic (KS2-SATs-style mixed check).
- **National Test** — admin-triggered, one official attempt, grouped by education level; top 5 per
  level win a year of full access for learner + parent.
- **TENAFEP Numeracy** — *pending source material:* DRC-faithful papers slot into the same
  checkpoint engine once curriculum documents are supplied.
- **Readiness Hub** — teacher fluency console: check-ready count, at-risk list, per-class gap
  heatmap.

## 05 · Teacher & admin layer (shipped)

Class fluency heatmap (students × skills, mastery by colour) · at-risk + fastest-improving with AI
intervention suggestions · teacher-directed practice (class focus = every student's daily mission)
· printable practice sheets with answer keys (PDF/Word) · parent-update generator (live AI) ·
class-battle manager · school league · check-readiness KPI.
*Pending backend:* spreadsheet→auto-credential onboarding, live real-time class races, MAT rollups
(the LA console already provides multi-school benchmarking + exportable evidence packs).

**Teacher-time-to-value guarantee:** from setup to a live, adaptive, four-operation class in under
5 minutes, with zero marking thereafter.

## 06 · Economy, accessibility & wellbeing (shipped)

Mode-weighted coins (Focus 4 → Exam/Battle 3 → standard 2 → assessment 1) keep status honest;
spend is cosmetic (avatars). Accessibility: huge font, dyslexia-friendly font, hide timer,
read-aloud (speech synthesis), voice answers (speech recognition where supported), anonymous hero
names, parent-set curfew/quiet hours, no ads/chat/purchases.

## 07 · Go-to-market & the Africa on-ramp

Land (free tier + simple school SKU) → wedge (statutory checkpoints) → expand (trust dashboards →
full StudYear) → consumer on-ramp (family/tutor tiers). **Bi-corridor by design:** the FR
localisation pack ships in v1 (wrapper + French spelling/grammar banks, engine untouched);
Lingala/Swahili packs, TENAFEP-faithful papers and BitriPay rails are the next corridor steps
(require curriculum sources + payment rail).

## 08 · Engine mapping — mechanic → agent

| Mechanic | Engine hook | Owning agent role |
|---|---|---|
| Focus adaptive loop | Weakest/slowest-fact re-weighting (next-best-item) | Adaptive Practice / Item-Selection |
| Four operation heatmaps | Per-fact mastery vectors | Diagnostics / Mastery-Tracking |
| Inverse-pair linking | Linked-node half-credit propagation | Knowledge-Graph |
| Misconception inference | Cross-operation pattern analysis (diagnostic) | Learner-Profiling |
| Number Rank ladder | Per-op rolling-latency estimate | Progression / Gamification |
| Coins & cosmetics | Mode-weighted engagement economy | Motivation / Rewards |
| Checkpoints (UK / TENAFEP) | Exam-format simulation | Assessment / Papers |
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
Rank ladder; teacher layer (class focus, worksheets, heatmap); × Checkpoint (check-faithful Exam
Pressure).
**Phase 2 (SHIPPED core):** battles + leagues + Parent Challenge; mode-weighted economy;
Four-Op Gauntlet diagnostic; class analytics + readiness. *(Live-realtime class races and MAT
rollups arrive with the Firebase backend.)*
**Phase 3 (STARTED):** FR localisation pack shipped; TENAFEP papers, Lingala/Swahili themes,
offline packs and BitriPay await source material and the payment rail; the upsell bridge exists —
SkillRush results already feed My Progress, the parent command centre and predicted grades.

---

*Everything marked "shipped" is live and Playwright-verified in the static preview build; items
marked "pending" require external inputs (Firebase backend, DRC curriculum documents, BitriPay)
and slot into seams already built (`ai.js`, `billing.js`, school store).*
