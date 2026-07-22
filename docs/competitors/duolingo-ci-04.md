# Dossier CI-04 — Duolingo Extraction & StudYear Transformation Map

| | |
|---|---|
| **Dossier** | CI-04 (competitive intelligence) |
| **Target** | Duolingo, Inc. (NASDAQ: DUOL) |
| **Segment** | Consumer language learning + adjacent skills (maths, music, chess); gamified habit-formation edtech |
| **Relevance to StudYear** | Retention-engineering benchmark and contrast case — proves the gamified daily-habit loop at global scale, but structurally cannot serve exam-specific attainment. Copy the retention engine; refuse the energy paywall; add what they can't. |
| **Sits alongside** | `get-revising-audit.md` (CI, Get Revising / The Student Room) · TTRS teardown (Times Tables Rock Stars) |
| **Feeds** | StudYear **v1.2 backlog** (§5 below) · agent registry `../product/studyear-ai-os-venture-brief.md` (SY-A01–A21) · `../REQUIREMENTS-MANDATE.md` (preserve-and-enhance) |
| **Status** | Executive extraction merged. Deep-dive source tables (full HLR/Birdbrain internals, per-cohort KPI ledger) tracked for a second pass. |

> **Sourcing note.** Market and product figures below are carried from the delivered
> extraction with their original attributions (Stocktitan, SQ Magazine, Axis
> Intelligence, Trophy, TechAhead, My Engineering Buddy). They are competitor
> figures for planning context, not StudYear claims. Everything under *Improve*,
> *Add*, the gap matrix, KPI **targets** and the phase plan is StudYear strategy
> derived from the intel — targets and directives, not reported fact.

---

## 1. Intelligence snapshot (Q1 2026)

| Metric | Value | Source |
|---|---|---|
| Daily active users | **56.5M DAU** (+21% YoY) | Stocktitan |
| Monthly active users | **137.8M MAU** | Stocktitan |
| Quarterly revenue | **$292M** | Stocktitan |
| Stated ambition | **100M DAU by 2028** — deliberately moderating financial growth to accelerate users | SQ Magazine |
| Growth reinvestment | **>$50M** in foregone bookings reinvested into the **free** experience | Axis Intelligence |
| AI content throughput | **20,500 course units / quarter — 11× the 2024 rate** | Axis Intelligence |

**Read:** Duolingo is buying users with free-tier generosity and an AI content
factory, betting habit + scale converts later. Their moat is **retention
engineering and content velocity**, not academic outcomes.

---

## 2. Stack extraction — what to study

- **Retention architecture — streaks / freezes / leagues.** The core habit loop.
  Streak **freezes extend average streak longevity by ~48% past day seven**
  (Trophy). Leagues add social-competitive pull; streaks add loss-aversion.
- **Birdbrain / HLR engine.** Half-Life Regression + Birdbrain **unified into a
  single neural network**; session generation **cut from 750ms → 14ms via a Scala
  rewrite** (TechAhead). This is spaced-repetition scheduling at latency that
  feels instant.
- **AI content factory.** 20,500 course units/quarter (Axis Intelligence) — an
  industrialised generate → review → publish pipeline; the source of their velocity.
- **Free-tier economics.** Deliberate reinvestment of bookings into the free tier
  (Axis Intelligence) to widen the top of the funnel.

---

## 3. Strategic findings — the exploitable weaknesses

1. **The free tier caps most learners at ~A2 CEFR and cannot build exam-specific
   skills** (My Engineering Buddy). It teaches *a* language, not *the* GCSE / BEPC /
   TENAFEP a student is actually sat on.
2. **The energy system triggered a documented user backlash, with switching to
   competitors** (My Engineering Buddy). Monetising *effort* — charging a learner to
   keep trying — is the resented seam.
3. **Habit ≠ attainment.** No predicted grade, no mark-scheme-aligned marking, no
   accountable outcome a parent or school can act on.
4. **No diaspora / local-rails payment path** into the Francophone-African exam
   corridor (TENAFEP / BEPC).

### Core directive (the CI-04 thesis)

> **Copy** the retention engine. **Refuse** the energy paywall — *"never charge a
> student to try harder."* **Add** the three things Duolingo structurally can't:
> a **Predicted Grade Engine**, **mark-scheme AI Examiner marking**, and
> **BitriPay CDF / diaspora rails** for the TENAFEP / BEPC corridor.

---

## 4. Copy / Improve / Add matrix — mapped to the agent registry (SY-A01–A21)

| Duolingo mechanic | StudYear move | Owning agent(s) |
|---|---|---|
| Streak + streak-freeze (loss aversion; +48% longevity past D7) | **Copy** — daily streak with a *free* freeze/repair; the streak protects effort, it is never sold | **SY-A05 Motivation** |
| Leagues / social competition | **Copy, re-aim** — leagues scoped to class / cohort / school so the competition ties to real curricula (SkillRush, Maths Heroes, NRS already seed this) | **SY-A05 Motivation**, **SY-A09 Cohort Analytics** |
| Birdbrain / HLR spaced-repetition scheduler | **Improve** — schedule against **specification points × mastery × exam date**, not just word half-life; explainable to student, parent and teacher | **SY-A01 Planner**, **SY-A21 Profile** |
| AI content factory (20.5k units/qtr) | **Improve** — generate/verify/publish tied to **board × subject × topic × spec point**, human-approved | **SY-A03 Content Forge**, **SY-A17 Content Verification**, **SY-A18 Taxonomy** |
| Energy / hearts (pay to keep trying) | **Refuse** — no energy paywall anywhere. ACUs meter *AI compute*, never *attempts* or *effort* | — (product principle; mandate) |
| — (they have no equivalent) | **Add — Predicted Grade Engine**: an accountable grade forecast from diagnostics, mastery trend and quiz history | **SY-A08 Reporting**, **SY-A21 Profile** |
| — | **Add — AI Examiner**: mark-scheme-aligned marking with per-mark rationale (already live as Assignment Review; deepen to exam-board mark schemes) | **SY-A04 Examiner** |
| — | **Add — BitriPay CDF / diaspora rails**: pay/fund a student across the TENAFEP / BEPC corridor from anywhere (aligns with the live gift-code "fund a student from anywhere" flow) | billing / BitriPay integration |

---

## 5. Twelve exploitable gaps → v1.2 backlog

Derived from §2–3; each is a StudYear build item, not a Duolingo fact.

1. Free-tier ceiling at ~A2 → **exam-tier ladder** to the student's real qualification.
2. No exam-specific skills → **spec-point mastery map** (SY-A18 taxonomy already models this).
3. No accountable outcome → **Predicted Grade Engine** (SY-A08/A21).
4. No mark-scheme marking → **AI Examiner** deepened to board mark schemes (SY-A04).
5. Effort monetised (energy) → **free effort, metered compute** principle enforced product-wide.
6. Habit without teaching → **Interactive Lesson + Tutor** carry real curriculum (live).
7. Streak longevity → **free streak freeze/repair** (SY-A05).
8. Social pull generic → **cohort/class/school leagues** on real curricula (SY-A05/A09).
9. No parent-actionable signal → **Family Digest / at-risk alerts** (SY-A11/A12).
10. No school layer → **Class Cockpit + Cohort Analytics** (SY-A06/A09).
11. No local payment corridor → **BitriPay CDF / diaspora rails** (TENAFEP/BEPC).
12. Content velocity gap → **verified content forge** at board×topic granularity (SY-A03/A17/A18).

---

## 6. KPI targets — calibrated against their benchmarks

Targets for StudYear, benchmarked to the Duolingo figures in §1 (aspirational planning numbers, not commitments):

| Dimension | Duolingo benchmark | StudYear target posture |
|---|---|---|
| D7 streak survival | +48% with freeze | match with a **free** freeze (no paywall drag on the metric) |
| Session latency | 14ms scheduling | keep generation/scheduling perceptually instant |
| Content throughput | 20.5k units/qtr | verified, spec-tagged units — quality-gated velocity |
| Retention lever | free-tier reinvestment | free effort + accountable outcomes as the retention wedge |
| Monetisation seam | energy paywall (resented) | ACU compute metering only — never effort |

---

## 7. Five-phase execution sequence

1. **Retention core** — free streak + freeze/repair, cohort leagues (SY-A05).
2. **Accountable outcomes** — Predicted Grade Engine + deepen AI Examiner to mark schemes (SY-A04/A08/A21).
3. **Spec-point content** — verified forge at board×subject×topic (SY-A03/A17/A18).
4. **Rails** — BitriPay CDF / diaspora funding for the TENAFEP/BEPC corridor.
5. **School/parent layer** — Class Cockpit, Cohort Analytics, Family Digest, at-risk escalation (SY-A06/A09/A11/A12).

---

*CI-04 · merged to the competitor dossier set. Extends the canonical agent
registry usage without adding agents; every move maps to an existing SY-A0x/A1x/A21
owner or to a product principle in `../REQUIREMENTS-MANDATE.md`.*
