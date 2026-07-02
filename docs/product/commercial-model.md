# StudYear Commercial Reset — Final Recommendation (operative pricing model)

> **The definitive commercial model.** Supersedes-as-operative the indicative pricing in
> the [venture brief §11](studyear-ai-os-venture-brief.md) (which stays on record per the
> [mandate](../REQUIREMENTS-MANDATE.md)).
>
> **Market anchor:** AI tutors ≈ **$4/mo (Khanmigo)**, **Quizlet Plus ≈ $6.99/mo**, while UK
> tutoring is commonly far higher (especially 11+ and GCSE tuition). **StudYear wins by
> being low-cost, ACU-controlled, parent-visible, and exam-focused — not by offering
> unlimited AI.**
>
> **Payment-fee model:** Stripe UK card cost ≈ **1.5% + 20p per UK card payment** — every
> low-price plan must protect margin **after fees.**

## 1. Core rule

**Keep: £1 = 100 ACUs.**

Internal profitability rule — **the margin band mandate (final, resolved):** on everything,
**the only permitted gross-margin range is 66% to 100%.**

| Per 100 ACUs | Value |
|---|---|
| Revenue | £1.00 |
| Total variable cost | **≤ £0.34** (may approach £0.00) |
| Gross profit | **£0.66 – £1.00 (66%–100% margin band)** |

> **✅ Margin rule (final):** every paid product operates **inside the 66%–100% margin
> band** — 66% is the hard floor (cost never exceeds 34% of realised price), and cost
> optimisation pushes margin toward 100% wherever quality permits. The earlier
> ≤ £0.50 (50%-margin) draft ceiling is superseded. The only exemption remains **defined
> free accounts** (Child Free, free teacher tooling). Variable cost includes provider
> inference, Stripe fees (1.5% + 20p modelling), and hosting allocation.

## 2. Student plans — monthly only

| Plan | Monthly price | ACUs included | Access |
|---|---|---|---|
| **Child Free** | £0 | **100 ACUs every 3 months** | basic child access |
| **Student Access** | £5/mo | 500 ACUs | full access **except Premium tools + Assignment Review** |
| **Student Premium** | £10/mo | 700 ACUs | unlocks full premium toolkit |
| **Student Premium+** | £20/mo | 1,650 ACUs | everything in Premium + intensive AI usage |
| **Student Max** | £30/mo | 2,750 ACUs | heavy GCSE, A-Level, 11+, SATs, university users |

**Sharp positioning:**

| Tier | Line |
|---|---|
| Free | *"Start learning safely."* |
| £5 | *"A full week of AI-supported study."* |
| £10 | *"Unlock every premium learning tool."* |
| £20 | *"Built for serious exam terms."* |
| £30 | *"For students who use StudYear daily."* |

## 3. Parent plans — monthly only

| Plan | Monthly price | ACUs included | Access |
|---|---|---|---|
| **Parent View** | £5/mo | 300 ACUs | child progress visibility |
| **Parent Pro** | £10/mo | 700 ACUs | Academic Command Centre |
| **Parent Pro+** | £20/mo | 1,650 ACUs | intervention mode + weekly AI briefing |
| **Parent Elite** | £39/mo | 3,900 ACUs | full family intelligence dashboard |

## 4. ACU top-ups

| Top-up | Price | ACUs | Use case |
|---|---|---|---|
| Mini Boost | £3 | 250 | emergency homework help |
| Core Boost | £5 | 500 | weekly study support |
| Growth Boost | £10 | 1,100 | regular learner |
| Exam Boost | £20 | 2,400 | exam period |
| Power Boost | £30 | 3,750 | heavy usage |

> **Avoid excessive bonuses below £10** — Stripe fixed fees damage margin.

## 5. ACU cost per activity

| Activity | ACU cost | Activity | ACU cost |
|---|---|---|---|
| Quick AI explanation | 5 | AI Study Planner | 20 |
| Homework help answer | 8 | Academic Diagnostic | 25 |
| AI Tutor session, short | 15 | Diagnostic Results | 15 |
| AI Tutor session, deep | 25 | Personal Recovery Plan | 25 |
| Quiz generation | 10 | Interactive Lesson | 25 |
| Flashcards | 12 | AI Course Generator | 30 |
| Topic summary / notes | 12 | Predicted Grade | 20 |
| Formula sheet | 15 | **Assignment Review** | **60** |
| Mind map | 18 | Submit paper analysis | 50 |
| | | Visual tools / graphs | 40 |

## 6. Free plan rules (Child Free)

- 100 ACUs every 3 months · **no cash-out value** · **no rollover after 90 days**
- **One child account per verified parent/device**
- No Assignment Review · no heavy AI course-generation abuse
- **No access to the tutor marketplace** — free accounts cannot book tutors or receive
  tutor-triggered AI support (resolved directive; upgrading to a paid plan or a parent
  wallet unlocks it)
- **Every free-tier feature is limit-gated** — where a limit is not yet explicitly
  defined, a default cap applies until Admin sets one (limits are Admin-configurable per
  feature, like ACU costs — `§12b` / `../ai-os/14`)
- Referral ACUs cannot be withdrawn

**Purpose: access, trust, community goodwill — not unlimited AI usage.**

## 7. Referral system

When an existing user refers a **new paying user**:
- **Referrer gets 5% of the first payment value as ACUs.** (Friend pays £20 → 5% = £1 →
  referrer receives **100 bonus ACUs**.)
- **New user receives +100 welcome ACUs after first successful payment.**

**Rules:** reward only after payment clears · no reward on Free plan · no reward on refunds ·
**max referral bonus 1,000 ACUs/month unless manually approved.**

## 8. Influencer programme

**Final rule: 20% commission on first payment only.**

| Customer first payment | Influencer commission |
|---|---|
| £5 | £1 |
| £10 | £2 |
| £20 | £4 |
| £39 | £7.80 |

**Onboarding flow:** influencer registration page → identity + social-profile submission →
admin approval → unique tracking code/link → dashboard (clicks, signups, paid conversions,
commission) → **payout only after refund window closes.**

> **Do not pay influencer commission on ACU top-ups forever. That kills margin.**

## 9. Tutor marketplace

| Item | Price |
|---|---|
| Tutor onboarding | **£10 one-time** |
| Tutor commission to StudYear | **15% per lesson** |
| AI usage during lesson | **student pays ACUs** |

Tutors can trigger AI support, but **ACUs must always come from the student wallet or
parent wallet.** Since **free accounts have no tutor access** (§6), tutor-triggered ACUs
can only ever draw from a **paid** student plan or a parent wallet — the Child Free
quarterly allowance can never be drained by a tutor. *(Resolves annotation JN1.1.)*

## 10. School pricing

| School plan | Monthly price | ACUs included |
|---|---|---|
| Small School | £99 | 10,000 |
| Medium School | £199 | 22,000 |
| Large School | £399 | 48,000 |

**Extra school ACU bundles:**

| Bundle | Price | ACUs |
|---|---|---|
| Starter | £100 | 11,000 |
| Growth | £250 | 30,000 |
| Scale | £500 | 65,000 |

## 11. Margin-protection logic

**Developer rule (66% minimum margin — resolved directive):**

```
if estimated_provider_cost + stripe_cost + hosting_allocation > 34% of plan revenue:
    reduce ACUs
    or throttle expensive tools
    or require top-up
```

> **Threshold note:** a later draft phrased this trigger as "> 66% of plan revenue" — that
> figure names the **margin target**, not the cost trigger. Enforcing **margin ≥ 66%**
> requires acting when **cost exceeds 34% of revenue** (cost + margin = 100%). The 34%
> trigger above is therefore the faithful implementation of the 66%–100% margin band (§1).

**Hard controls:**
- No negative ACU balance · no unlimited AI
- **Assignment Review always metered** · video analysis always metered · visual generation
  always metered
- Premium unlocks tools — **it does not mean unlimited AI**
- Free ACUs expire · **bonus ACUs expire after 60 days** · **referral ACUs expire after 90
  days**

## 12b. Discount-Code Engine (admin-created)

> **Directive:** Admin can create discount codes with **time, number of users, validity and
> everything else needed** — users redeem them and **get exactly what was set.**

### Code configuration (everything settable by Admin)

| Parameter | Options |
|---|---|
| **Code** | custom string or auto-generated; unique |
| **Benefit type** | % off · fixed £ off · **bonus ACUs** · free period of a plan · plan upgrade |
| **Benefit value** | as set (e.g. 20% off first month; +200 ACUs; 1 month Premium free) |
| **Validity window** | start + end date/time — expires automatically |
| **Total redemption limit** | max number of users who can redeem (e.g. first 500) |
| **Per-user limit** | typically 1; admin-settable |
| **Eligible products** | specific plans, ACU packs, school tiers — or all |
| **Eligible audiences** | student / parent / tutor / school; new-users-only or everyone |
| **Minimum spend** | optional qualifying threshold |
| **Stackability** | **off by default** — one code per checkout |
| **Status** | draft → active → paused → exhausted/expired (auto) |

### Redemption behaviour

- User enters the code at checkout (or via a promo link) → validation checks **window,
  remaining redemptions, per-user limit, audience, product eligibility, min spend** → on
  pass, **the user gets exactly what was set** — applied transparently on the invoice/wallet.
- Every redemption is a ledgered event (who, when, code, benefit granted) feeding the
  admin's code dashboard: redemptions used/remaining, conversion, revenue impact.

### Guardrails (composition with existing rules)

| Rule | Effect |
|---|---|
| **Margin band (§1)** | a code that would push a product's effective margin **below the 66% floor** is flagged and blocked at creation unless Admin overrides with a logged reason — discounts live inside the 66–100% band like everything else |
| **Commission exclusion** | promo discounts are **deducted from net eligible revenue** — no referral/influencer commission is paid on the discounted portion ([growth programme §9](growth-partner-programme.md)) |
| **Bonus-ACU expiry** | ACUs granted by codes follow **bonus-ACU expiry (60 days)** (§11) |
| **Anti-abuse** | coupon abuse is an anti-fraud signal (growth programme §7); per-user limits enforced by account + payment-instrument + device checks |
| **Audit** | code creation/edits/overrides are dual-controlled where revenue-negative at scale and always audit-logged (Admin console — `../ai-os/14`) |

## 12. Best final offer (public pricing headline)

| Offer | |
|---|---|
| **Free** | 100 ACUs every 3 months |
| **£5/month** | 500 ACUs, full learning access |
| **£10/month** | 700 ACUs + Premium tools |
| **£20/month** | 1,650 ACUs + Premium+ |
| **£39/month Parent Elite** | 3,900 ACUs + full family command centre |

> **This keeps StudYear affordable for deprived communities while protecting the platform
> from AI-cost bankruptcy.**
