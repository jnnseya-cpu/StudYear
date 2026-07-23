# STUDYEAR AI-OS — COMPETITIVE INTELLIGENCE DOSSIER 04
## DUOLINGO DEEP EXTRACTION & GAP ANALYSIS
### "Copy · Improve · Add" — Product Development Extraction for the StudYear AI-OS Platform

**Classification:** Internal — Groupe Nseya Digital / JNN Global Ltd
**Programme:** NSEYA X-EXECUTE — StudYear AI-OS Workstream
**Companion documents:** CI-01 Get Revising Teardown (`get-revising-audit.md`) · CI-02 Times Tables Rock Stars Teardown · Number Rock Stars Module Specification (`../maths-heroes-spec.md`) · Duolingo deep-dive extraction (`duolingo-deep-dive-extraction.md`)
**Date:** July 2026
**Status:** Production-ready — feeds directly into StudYear v1.2 backlog

> **Sourcing note.** Duolingo figures are carried from the extraction with their
> original attributions and are competitor benchmarks for planning, not StudYear
> claims. Everything under *Improve*, *Add*, the gap map, the Copy/Improve/Add
> matrix, KPI **targets** and the execution sequence is StudYear strategy derived
> from the intel — targets and directives, not reported fact.

---

## SECTION 1 — EXECUTIVE SUMMARY

Duolingo is the most successful consumer learning product ever built. As of Q1 2026 it operates at **56.5 million daily active users**, **137.8 million monthly active users**, a **41% DAU/MAU ratio** (social-network-class stickiness, against an EdTech norm of 10–15%), **12.2M+ paid subscribers**, and **FY2025 revenue of $1.04 billion** at a ~50% free-cash-flow margin. Its stated target is **100 million DAU by 2028**.

But Duolingo's dominance is an *engagement* dominance, not a *learning outcomes* dominance. Its own market is now openly documenting the ceiling: most learners plateau at **CEFR A2**, cannot produce language spontaneously, and receive no exam-aligned preparation. Duolingo is a habit machine wearing an education costume.

**This is precisely the strategic opening for StudYear.** StudYear's thesis inverts Duolingo's: take the world-class habit engine Duolingo perfected, and bolt it onto a platform whose core is **verified exam outcomes** — GCSE, A-Level, IB, TENAFEP, BEPC — where the "win condition" is not a streak count but a grade on a national certificate.

The extraction verdict in one line:

> **COPY the retention engine. IMPROVE the learning engine. ADD the outcomes engine Duolingo structurally cannot build.**

This dossier extracts Duolingo across six layers — business model, learning architecture, gamification system, AI/ML engine, monetisation, and growth engine — then maps every finding into a Copy/Improve/Add matrix bound to the StudYear 21-agent registry, the seven-dimension Learner Profile Vector, BitriPay monetisation, and the Number Rock Stars acquisition funnel.

---

## SECTION 2 — BUSINESS & METRICS SNAPSHOT (THE BENCHMARK STUDYEAR IS CALIBRATING AGAINST)

| Metric | Duolingo (latest reported) | Why it matters to StudYear |
|---|---|---|
| DAU | 56.5M (Q1 2026, +21% YoY) | The habit-loop benchmark |
| MAU | 137.8M (Q1 2026, +6% YoY) | Top-of-funnel is flattening — their vulnerability window |
| DAU/MAU ratio | ~41% | StudYear v1 target: ≥25%; v2 target: ≥35% in exam season |
| Paid subscribers | 12.2M (end 2025) | ~9% of MAU convert — freemium ratio to model |
| FY2025 revenue | $1.04B (+39% YoY) | ~83% from subscriptions |
| Adjusted EBITDA | >$300M (FY2025); 29% margin Q1 2026 | Proof that AI-native EdTech scales profitably |
| Content production | 20,500 course units/quarter (Q1 2026) — 11× the 2024 rate | AI content factory benchmark for StudYear's Content Generation Agent |
| 2026 strategy | Growth-first: >$50M bookings deliberately foregone to improve the free tier | They are widening the funnel — expect aggressive free-tier competition |
| Retention economics | 7-day streak users ~3.6× more likely to remain long-term; streak freeze reduced at-risk churn ~21% | The two numbers that justify StudYear's entire streak architecture |

**Strategic read:** Duolingo is intentionally slowing monetisation to chase 100M DAU, subsidised by a fortress balance sheet. StudYear cannot win a habit-volume war. StudYear wins on **outcome density**: revenue per learner tied to exam results, school/B2B channels, and francophone-Africa corridors Duolingo does not price for or curriculum-map to.

---

## SECTION 3 — LEARNING ARCHITECTURE EXTRACTION

### 3.1 The atomic unit: the 2–4 minute lesson
Everything in Duolingo reduces to one behaviour: **complete one short lesson today**. Every other system — characters, leagues, notifications, widgets, streaks — exists to drive that single rep. Lessons are deliberately small enough that the decision cost of starting is near zero.

**Extraction principle:** design the platform around ONE daily atomic behaviour, then aim every other system at it.
**StudYear atomic behaviour:** *"Complete today's Smart Session"* — a Personalisation-Engine-generated 5–7 minute block mixing new content, spaced retrieval, and one exam-style question.

### 3.2 The Path (linear world map)
In 2022 Duolingo replaced its branching "tree" with a single guided path. Rationale: choice overload kills novices; a single path lets the algorithm sequence optimally and lets social features anchor to shared positions. Units group into sections aligned to CEFR bands; each unit ends in a review/boss checkpoint; periodic placement jumps let stronger users test out.

**Copy:** single guided path per qualification (e.g., "AQA GCSE Maths Higher path"), units mapped 1:1 to specification topics, checkpoint = mini mock.
**Improve:** Duolingo's path maps loosely to CEFR; StudYear's path maps *exactly* to exam board specifications (AQA/Edexcel/OCR/WJEC, IB subject guides, EPSP programmes for TENAFEP/BEPC). Every node carries a spec reference code. That is a defensible data asset Duolingo has never built.

### 3.3 Exercise formats and the recognition trap
Duolingo's exercise inventory: tap-the-pairs, translate (bank + free text), listen-and-type, speak-and-repeat, fill-the-gap, match, stories, and (2024+) Adventures — explorable mini-scenario games. The documented weakness: formats overwhelmingly test **recognition, not production**. Learners with 1,500-day streaks still freeze in real conversation; reviewers consistently place the ceiling at A2–B1.

**Extraction principle (negative):** recognition-heavy formats inflate perceived progress and collapse at the exam.
**StudYear counter-design:** enforce a **Production Ratio** in the Session Generator — every session must include ≥40% production-type items (free response, worked calculation, extended writing, spoken answer for languages/orals) with AI marking. Track Production Ratio as a first-class learner metric on the seven-dimension Learner Profile Vector (format-effectiveness dimension — consistent with the existing directive to use *empirically measured format effectiveness*, never "learning styles").

### 3.4 Guidebooks and "Explain My Answer"
Each unit has a short grammar/tips guidebook (widely criticised as too shallow), and — as of January 2026 — the formerly premium **"Explain My Answer"** AI explanation feature is now free for all users in major courses.

**Read the signal:** Duolingo just made AI explanation a free-tier commodity. StudYear must therefore treat AI explanations as table stakes, not a paywall feature — and differentiate on *depth*: exam-technique explanations ("here is why this scores 2/3 against the AQA mark scheme, and the exact phrase the examiner needed").

---

## SECTION 4 — GAMIFICATION SYSTEM EXTRACTION (THE FULL MECHANIC INVENTORY)

This is the crown-jewel extraction. Duolingo's system is layered so each mechanic serves a different tenure segment — day-1 users, week-1 users, month-1 users, year-1 users. That layering, not any single mechanic, is why it holds at scale.

### 4.1 Streaks — the loss-aversion core
- Counts consecutive days of activity; flame icon front-and-centre.
- **Streak Freeze**: equippable protection against one missed day. Platform data across apps shows freeze-equipped streak users last ~48% longer past day 7; Duolingo's own rollout cut churn ~21% for at-risk users. Forgiveness is not a soft feature — it is the highest-ROI retention mechanic in the system.
- **Streak Society**: milestone rewards at 7/30/100/365+ days (bonus freezes, exclusive app icons, profile flair, gem chests).
- **Streak wagers**: staking gems on maintaining a streak lifts day-7/14 retention ~14%.
- **Identity design**: notification copy deliberately builds self-image — "you're someone who doesn't break streaks." Motivation is shifted from reward to identity.

**Copy:** full streak stack — streak, freeze, milestone society, identity-framed notifications.
**Improve for StudYear:**
1. **Streak = learning-effective days**, not app-opens. A day counts only if the Smart Session was completed with a minimum retrieval-accuracy floor. This protects the metric from Duolingo's known corruption (users gaming XP without learning).
2. **Term-aware streaks**: UK school calendars (half-terms, holidays) and DRC calendars get scheduled "protected days" so the streak system respects real student life instead of punishing it — a structural improvement no global-generic product can match.
3. **Exam Countdown Streak**: a second streak that only exists in the 90 days before the learner's real exam date. Dual-flame UI. Loss aversion aimed at the moment it matters.

### 4.2 XP, gems and the currency economy
- **XP** = universal activity currency; feeds leagues, quests, and progress stats. Boost mechanics (double-XP windows, combo bonuses) create urgency.
- **Gems** = soft currency earned via behaviour Duolingo wants (evening lessons, installing the home-screen widget — note: they *pay users in gems to install the widget*, a retention masterstroke) and spent on freezes, hearts/energy refills, league repair, bonus content, wager entries.

**Copy:** dual-currency economy (StudYear: **XP + Coins**), including paying Coins for retention-positive behaviours (widget install, evening revision session, adding exam dates, inviting a study buddy).
**Improve:** weight XP by cognitive value — a hard past-paper question worth multiples of a flashcard tap — with anti-farming caps per format per day. Publish the weighting so students perceive fairness.
**Add (BitriPay bridge):** a parent/diaspora top-up loop — family in UK/EU can gift Coin bundles or premium weeks to a student in Kinshasa via BitriPay diaspora rails. Duolingo has no family-remittance mechanic; StudYear's portfolio makes this native.

### 4.3 Leagues — competitive retention
- Weekly XP leaderboards in ~10 promotion/demotion tiers (Bronze → Diamond), cohorts of ~30.
- 2026-era matchmaking pairs users by *activity level* so competition always feels winnable — the critical calibration most clones miss.
- **League repair** purchasable with gems after demotion (monetised regret).
- Effect: leaderboard mechanics credited with ~40% engagement lift.

**Copy:** weekly leagues with promotion/demotion, activity-matched cohorts, repair mechanic.
**Improve:**
1. **Class leagues and school leagues** (the TTRS lesson fused with the Duolingo lesson): teacher-visible, school-vs-school in the same exam board cohort. Duolingo's leagues are anonymous strangers; StudYear's are your actual classmates — vastly stronger social gravity for 14–18s.
2. **Effort-normalised scoring option** for leagues (accuracy × difficulty × consistency, not raw grind), so weaker students can win weeks — protecting the exact demographic exam platforms lose first.
3. **Country corridors**: UK leagues and DRC leagues run in local prime-time windows; a "Kinshasa–Birmingham derby" event ties directly into Justin's community positioning.

### 4.4 Energy/Hearts — the friction paywall (HANDLE WITH CARE)
Duolingo's free tier historically used 5 hearts (lose one per mistake); through 2025–26 it rolled out **Energy**, depleting per lesson *regardless of correctness*, limiting free users to roughly 2–3 lessons (~15–20 min) per recharge cycle. This is their single most hated mechanic: community polls show near-majority active dislike, documented switching to competitors, and the core complaint that it *punishes practice itself*. It converts, but it burns brand and contradicts learning.

**Extraction verdict: DO NOT COPY energy-style depletion into an exam product.** Punishing a GCSE student for attempting more revision is commercially suicidal with parents and schools, and ethically wrong.
**StudYear alternative — invert it:** unlimited practice forever on the free tier; monetise *depth and intelligence* instead (full mock analytics, AI examiner marking of extended answers, predicted-grade engine, parent reports, Legendary-style challenge tiers). Free = unlimited effort. Paid = superior insight. This is the loudest possible positioning wedge against Duolingo-style paywalls: **"We will never charge your child to try harder."** Put that sentence in marketing.

### 4.5 Quests, badges, events
- Daily quests (small, always completable), Friend Quests (co-op weekly goals with a friend), monthly badges, seasonal/time-limited events.
- Badge discipline: awarded only for genuine accomplishment; trivial badges dilute the whole system.
- Friend streaks + friend challenges add social accountability for long-tenure users.

**Copy:** daily quests, co-op friend quests, monthly badge, seasonal events.
**Improve:** align seasonal events to the *academic* calendar — "Mock Season Marathon" (Nov/Dec), "Easter Revision Sprint," "Results Countdown," TENAFEP/BEPC season events for DRC. Duolingo's events are arbitrary; StudYear's map to real academic adrenaline.
**Add:** **Squad Quests** — 4–6 person study squads with shared weekly targets and a squad wallet (BitriPay), reusing the KinetiQ squad-wallet architecture already blueprinted.

### 4.6 The mascot, notifications, and voice
- Duo the owl humanises the interface and fronts a notification system famous enough to be a global meme ("passive-aggressive owl").
- Notifications are ML-timed (sent when the individual user historically responds), tone-tested, and self-limiting (Duolingo publicly "gives up" with a guilt-trip message after repeated ignores — itself a re-engagement joke that works).
- The red-dot/urgency layer measurably lifts DAU.
- Marketing personality (unhinged TikTok owl; the 2025 "Dead Duo" campaign generated ~1B+ impressions and a measurable Q1 bookings spike) is inseparable from product retention.

**Copy:** a named mascot with genuine personality and an ML-timed, personality-driven notification engine (owned by StudYear's Engagement/Nudge Agent). Widget on home screen showing streak + today's session + days-to-exam.
**Improve:** two-register voice system — playful register for the student, professional register for parent/teacher surfaces. Duolingo has one voice; StudYear serves three stakeholders.
**Add:** mascot localisation — bilingual EN/FR personality from day one, with DRC-cultural references in the francophone corridor. (Mascot concept development: candidate should be an animal with pan-African + UK resonance; personality brief = "the friend who makes sure you pass," strategically distinct from Duo's chaotic-guilt persona.)

---

## SECTION 5 — AI/ML ENGINE EXTRACTION

### 5.1 Birdbrain + Half-Life Regression (the real moat)
- **HLR (published ACL 2016):** every learnable item has a modelled memory "half-life" — time until recall probability decays to 50% — estimated from correctness history, exposure counts, and lag times, trained on 13M+ learning traces. It roughly halved prediction error vs. Leitner baselines. The dataset is public.
- **Birdbrain:** a neural model estimating, per user per exercise, the probability of a correct answer — used to hold sessions in the productive-struggle zone (challenging but not demoralising). Duolingo eventually **merged spaced-repetition decay modelling into the unified Birdbrain network**, eliminating dual-pipeline sync overhead. It now personalises on the order of a billion exercises daily.
- **Session Generator:** composes each lesson from candidate exercise pools using Birdbrain scores + HLR-due items; a Scala rewrite took generation latency from 750ms to ~14ms.
- **Bandit algorithms** optimise notification timing/copy and reward variants.
- **GenAI layer:** LLM-generated course content at 20,500 units/quarter, AI conversation (Video Call with Lily; guided variant Falstaff), Roleplay scenarios with post-session feedback, and free-tier AI answer explanations.

**Copy (architecture, not code):**
1. **Memory decay model per micro-skill** — StudYear's Spaced Retrieval Agent implements HLR-class half-life estimation per specification point (the public HLR paper/dataset is the reference implementation; the same maths generalises to maths facts, science definitions, quotes, formulae — Duolingo itself reuses it for math and music).
2. **Correctness-probability model** driving the Session Generator to target the productive-struggle band (~75–85% expected success, dipping harder before exams).
3. **Sub-50ms session assembly** as an explicit non-functional requirement in the NestJS service layer.
4. **Bandit-optimised notifications** in the Engagement Agent.

**Improve:** Duolingo predicts *recall*. StudYear must predict **marks**: a second model layer mapping skill-state to expected performance against real mark schemes → the **Predicted Grade Engine** (per subject, per paper, updated after every session, with confidence intervals). This is the number parents will pay for and Duolingo cannot produce. It is also the retention hook Duolingo lacks: watching your predicted grade climb from a 5 to a 7 is stronger loss-aversion fuel than any flame icon.

**Add:** **AI Examiner** — LLM marking of extended/free-response answers *against official mark-scheme criteria* with point-by-point band justification (the exam-grade version of "Explain My Answer"), and **AI Oral Examiner** (Video-Call-class speaking practice repurposed for MFL GCSE orals, IB orals, and English-language interviews) — reusing exactly the interaction pattern Duolingo proved with Lily, but scored against real assessment rubrics.

### 5.2 Experimentation culture
Duolingo runs hundreds of concurrent A/B tests; essentially every mechanic above was discovered, not designed. The meta-lesson: **the moat is the experimentation pipeline, not any feature.**

**Copy:** feature-flag + experiment framework in StudYear's platform layer from v1 (Kafka event stream → experiment assignment service → metric pipelines), with a north-star metric hierarchy: (1) learning-effective DAU, (2) D7/D30 retention, (3) predicted-grade delta, (4) conversion. Every gamification parameter (XP weights, quest sizes, notification copy) ships as a tunable, never a constant.

---

## SECTION 6 — MONETISATION & GROWTH EXTRACTION

### 6.1 Tier structure
| Tier | Price (US ref.) | Contents |
|---|---|---|
| Free | £0 | All courses; ads; energy-limited; now includes AI explanations |
| Super | ~$84–96/yr (annual) | No ads, unlimited energy, mistake-review hub, streak repair; **content identical to free** |
| Super Family | ~$119.99/yr ÷ 6 | Same, up to 6 accounts (~£1.67/user/month effective) |
| Max | $168/yr | Super + Video Call + Roleplay (its value thinned after AI explanations went free; management is openly re-examining the tier) |

Plus: 14-day (now experimenting 1–3 month) trials, ~50% New Year promotions, student verification discounts, and the separately monetised **Duolingo English Test** ($70, accepted by 5,500+ programmes) — a certification product bolted onto the top of the funnel.

**Copy:** freemium + family plan (family economics are the quiet genius — ~£1.67/user/month makes the paid tier a household commodity purchase) + long free trials + seasonal promotion cadence timed to academic moments (September back-to-school, January mock-results panic, April final-sprint).
**Improve:** Duolingo's Super is a *remove-friction* subscription (pay to un-cripple). StudYear's paid tier must be an *add-value* subscription (pay for AI Examiner, Predicted Grade Engine, unlimited mocks, parent dashboard, oral practice). Value-added subscriptions survive scrutiny from parents and press; friction-removal subscriptions generate the backlash Duolingo is now managing.
**Add:**
1. **BitriPay-native regional pricing** — CDF/mobile-money price points (M-Pesa, Orange Money, Airtel Money, Africell) for DRC, where Duolingo's USD pricing and card-first billing structurally exclude the market.
2. **Diaspora sponsorship plans** — UK/EU family pays, Kinshasa student learns (remittance-corridor product; zero Western competitor has this).
3. **B2B school licensing** (per-cohort dashboards, MIS integration) — Duolingo for Schools is a thin free classroom layer, not a serious B2B product; StudYear's school tier is a genuine revenue line.
4. **Certification endgame (v3 horizon):** the DET playbook — a proctored StudYear assessment for the DRC corridor where credential access is scarce; the long-term licence to print money if pursued with the Ministry relationship in the VERYX government beachhead strategy.

### 6.2 Growth engine
- **Onboarding:** value before signup (first lesson pre-registration), motivation-based personalisation questions, immediate placement, day-one achievable wins, daily-goal self-commitment.
- **Social/viral:** friend streaks, friend quests, share cards for milestones, meme-native brand marketing.
- **Widget:** home-screen streak widget (gem-incentivised install) — one of their highest-leverage retention surfaces.

**Copy:** all of it — especially value-before-signup (first diagnostic + one insight *before* account creation) and the incentivised widget.
**Improve:** StudYear's share cards carry *outcome* flexes ("Predicted 8 in Biology," "Beat 92% of the country on today's Number Rock Stars sprint") — shareable proof, not just shareable effort. Number Rock Stars remains the designated viral acquisition funnel into the full platform, now with Duolingo-grade streak/league mechanics wired through it.

---

## SECTION 7 — THE GAP MAP: WHERE DUOLINGO IS STRUCTURALLY BEATABLE

| # | Duolingo gap (evidenced) | StudYear exploitation |
|---|---|---|
| G1 | **A2 ceiling / recognition trap** — learners plateau; can recognise but not produce | Production Ratio ≥40%; AI Examiner; oral practice; mark-scheme marking |
| G2 | **Zero exam alignment** — no mapping to GCSE/A-Level/IB/national curricula; even its CEFR mapping is loose | Specification-locked paths; per-spec-point mastery tracking; past-paper engine |
| G3 | **No outcome measurement** — progress = XP/completion %, documented as creating false fluency confidence | Predicted Grade Engine with confidence intervals; mock analytics |
| G4 | **Energy paywall backlash** — punishing practice; documented churn to rivals | "Never pay to try harder" free tier; value-added premium |
| G5 | **Shallow explanations** — guidebooks cursory; grammar via pattern exposure | Deep AI explanation tied to mark schemes and misconception taxonomy |
| G6 | **Weak teacher/school layer** — Schools product is thin; no MIS, no cohort intelligence | Full B2B tier: teacher dashboards, class leagues, intervention alerts |
| G7 | **No parent surface** — parents fund it blind | Parent app/report: streak, predicted grades, session evidence, BitriPay top-ups |
| G8 | **Anglophone/USD-centric monetisation** — no mobile-money rails, no francophone-Africa pricing, no curriculum presence in DRC | BitriPay CDF pricing; TENAFEP/BEPC paths; FR-first UX; diaspora sponsorship |
| G9 | **Gamification decoupled from learning** — XP farmable; "playing to win points rather than learn" | Learning-effective streaks; cognitive-value XP weighting; anti-farming caps |
| G10 | **Generic calendar** — events ignore academic rhythm | Term-aware streaks; mock-season and results-countdown events; exam-date-anchored everything |
| G11 | **Max tier value crisis** — flagship AI features commoditising downward | Skip the trap: AI features priced by *assessment value*, not conversation novelty |
| G12 | **MAU flattening** — top-of-funnel growth ~flat while DAU deepens | Attack the funnel they're not winning: school-mediated acquisition + francophone corridor, where their marketing machine doesn't reach |

---

## SECTION 8 — COPY / IMPROVE / ADD MASTER MATRIX (BUILD DIRECTIVES)

> Agent names below are the CI-04 working labels; they map onto the canonical
> StudYear registry (SY-A01–A21, `../product/studyear-ai-os-venture-brief.md`) —
> e.g. Engagement/Rewards/Nudge → **SY-A05 Motivation**, Session Generator/
> Personalisation → **SY-A01 Planner** + **SY-A21 Profile**, Marking/Examiner →
> **SY-A04 Examiner**, School/Social Competition → **SY-A06 Class Cockpit** +
> **SY-A09 Cohort Analytics**, Content → **SY-A03 Content Forge** + **SY-A17/A18**.

### COPY (proven, adopt substantially as-is)
| Mechanic | Owning StudYear agent | Priority |
|---|---|---|
| Atomic daily session (5–7 min) as the single core behaviour | Session Generator Agent | P0 |
| Streak + Streak Freeze + milestone Streak Society | Engagement Agent | P0 |
| Dual currency (XP + Coins), gem-incentivised widget install | Rewards Agent | P0 |
| Weekly leagues, ~30-cohort, promotion/demotion, activity matchmaking | Social Competition Agent | P0 |
| HLR-class per-item memory decay model | Spaced Retrieval Agent | P0 |
| Correctness-probability model targeting productive struggle | Personalisation Engine | P0 |
| Sub-50ms session assembly SLA | Platform/NestJS layer | P0 |
| ML-timed, personality-voiced notifications + self-limiting guilt arc | Nudge Agent | P0 |
| Value-before-signup onboarding + daily-goal self-commitment | Onboarding Agent | P0 |
| Daily quests, friend quests, monthly badges (badge discipline: no trivial badges) | Quest Agent | P1 |
| Family plan economics (÷6 pricing) | BitriPay/Billing Agent | P1 |
| Experimentation pipeline as core infrastructure | Analytics/Experiment service | P0 |
| Mascot with genuine personality + meme-native marketing voice | Brand workstream | P1 |

### IMPROVE (adopt, but corrected for exam context)
| Duolingo version | StudYear version | Priority |
|---|---|---|
| Streak = opened app | Streak = learning-effective day (accuracy floor) + term-aware protected days | P0 |
| Path ≈ CEFR-ish | Path = exam-specification-locked, per-board | P0 |
| XP = flat per activity | XP = cognitive-value weighted, anti-farm capped, published rules | P1 |
| Anonymous stranger leagues | Class/school/country-corridor leagues + effort-normalised mode | P1 |
| Seasonal events (arbitrary) | Academic-calendar events (mock season, Easter sprint, results countdown, TENAFEP season) | P1 |
| Recognition-heavy exercises | Enforced ≥40% Production Ratio per session | P0 |
| "Explain My Answer" (generic) | Mark-scheme-anchored explanation + misconception taxonomy | P0 |
| Friction-removal subscription | Value-added subscription (never gate practice volume) | P0 |
| One brand voice | Dual-register voice (student / parent-teacher) | P2 |
| Share cards (effort flex) | Share cards (outcome flex: predicted grades, national percentile) | P2 |

### ADD (StudYear-only, structurally unavailable to Duolingo)
| Feature | Description | Owning agent | Priority |
|---|---|---|---|
| Predicted Grade Engine | Skill-state → expected marks per paper, live-updating, confidence-banded | Assessment Intelligence Agent | P0 |
| AI Examiner | LLM marking of free/extended response against official mark schemes with band justification | Marking Agent | P0 |
| AI Oral Examiner | Lily-pattern speaking practice scored to GCSE/IB oral rubrics | Oral Practice Agent | P1 |
| Exam Countdown Streak | Second streak, active T-90 days to real exam date | Engagement Agent | P1 |
| Parent surface | Reports, predicted-grade tracking, BitriPay top-ups/gifting | Guardian Agent | P1 |
| Teacher/B2B tier | Cohort dashboards, class leagues, intervention alerts, MIS hooks | School Agent | P1 |
| Squad Quests + squad wallets | 4–6 person co-op with BitriPay shared wallet (KinetiQ architecture reuse) | Social Agent + BitriPay | P2 |
| Diaspora sponsorship plans | UK/EU pays → DRC student learns, remittance-corridor product | BitriPay/Billing Agent | P1 |
| CDF mobile-money pricing | M-Pesa / Orange / Airtel / Africell native billing | BitriPay/Billing Agent | P0 (DRC launch gate) |
| TENAFEP/BEPC paths | Francophone-DRC curriculum trees, FR-first UX | Content Agent | P0 (DRC launch gate) |
| Number Rock Stars fusion | Duolingo-grade streaks/leagues wired into the NRS viral funnel | NRS module | P0 |
| Certification endgame | DET-playbook proctored credential for the DRC corridor | v3 roadmap | P3 |

---

## SECTION 9 — KPI TARGETS CALIBRATED TO THE EXTRACTION

| KPI | Duolingo benchmark | StudYear v1 target | StudYear v2 target |
|---|---|---|---|
| DAU/MAU | 41% | 25% | 35% (exam season) |
| D7 retention (streak-freeze cohort uplift) | +~48% streak longevity with freeze | Ship freeze at launch | Wager mechanics live |
| 7-day-streak → long-term retention multiplier | ~3.6× | Instrument from day 1 | ≥3× |
| Session assembly latency | 14ms | <50ms | <20ms |
| Production Ratio per session | n/a (their gap) | ≥40% | ≥50% pre-exam |
| AI content throughput | 20,500 units/quarter | 1,000 spec-mapped units/quarter | 5,000/quarter |
| Paid conversion of MAU | ~9% | 4% (year 1) | 8% |
| Predicted-grade accuracy (±1 grade at T-30) | n/a (their gap) | ≥70% | ≥85% |

---

## SECTION 10 — EXECUTION SEQUENCE (FEEDS STUDYEAR v1.2 BACKLOG)

**Phase A — Retention Core (next build cycle):** atomic Smart Session · learning-effective streak + freeze · XP/Coins economy · daily quests · notification engine v1 · value-before-signup onboarding · widget · experiment framework.

**Phase B — Competition & Intelligence:** leagues (individual → class) · HLR spaced-retrieval model · Birdbrain-class correctness model in the Session Generator · mark-scheme AI explanations · Production Ratio enforcement.

**Phase C — Outcomes Moat:** Predicted Grade Engine · AI Examiner · parent surface · academic-calendar events · Exam Countdown Streak.

**Phase D — Corridor & B2B:** TENAFEP/BEPC paths + FR UX · BitriPay CDF/mobile-money billing · diaspora sponsorship · school tier · squad wallets.

**Phase E — Endgame:** AI Oral Examiner at scale · certification product exploration · Kinshasa–Birmingham league events as brand theatre.

---

## SECTION 11 — CLOSING STRATEGIC NOTE

Duolingo spent thirteen years and thousands of A/B tests discovering the retention physics of consumer learning. That R&D is now public knowledge — extracted above at zero cost. Their remaining moats are data scale, brand, and the experimentation pipeline. None of those moats extend into **exam-outcome territory, school channels, francophone Africa, or mobile-money economies** — the exact four squares StudYear occupies.

The winning sentence for the investor deck:

> **"StudYear is what happens when Duolingo's habit engine meets an exam hall: the streak your child keeps is the grade they get."**

— End of Dossier CI-04 —
