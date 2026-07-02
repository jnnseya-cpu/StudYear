# StudYear Marketing Engine — AI Blog, Marketing & SEO Agents

> **Directive:** create an AI blog, marketing agents, and an SEO agent **to keep the OS on
> the first page of all search engines and social media.**
>
> This extends the canonical agent registry (SY-A01–A21, venture brief §4) with the
> **Growth Extension: SY-A22–A24**, and delivers the founding description's directive #19
> (AI-powered SEO blog — `founding-project-description.md`). All agents run through the
> [AI Gateway](../architecture/14-ai-agent-blueprint.md) in deep-thinking mode; content
> generation is ACU-cost-classed internally (platform billing class, not user-billed).

## Registry extension

| ID | Agent | Mandate | Class | Billing |
|---|---|---|---|---|
| **SY-A22** | **Blog Agent** | runs the AI-powered blog end-to-end: topic discovery → drafting → SEO-optimised publishing → refresh cycles | Generation | Platform |
| **SY-A23** | **Marketing Agent** | multi-channel campaign engine: social content, email/lifecycle marketing, launch pushes, community amplification | Orchestrator | Platform |
| **SY-A24** | **SEO Agent** | owns search visibility: technical SEO, rankings watch, SERP-gap capture, schema, backlink outreach targets — **the first-page keeper** | Analytics | Platform |

---

## SY-A22 · Blog Agent (the AI-powered blog)

**Purpose:** a continuously-publishing, SEO-first education blog that captures search demand
(revision guides, exam-board explainers, parent how-tos) and converts it into signups.

| Aspect | Specification |
|---|---|
| **Topic discovery** | mines search-demand data, exam calendars (mock seasons, results days), platform telemetry (most-studied topics per `12` vocabularies), and user-behaviour signals — per the founding spec, content is **customisable based on user behavior tracking and engagement metrics** |
| **Drafting** | deep-thinking generation grounded in the RAG corpus (specs, mark schemes) so posts are exam-board-accurate, never generic; every post tagged `(Level, Subject, Exam Board, Topic)` |
| **SEO on-page** | title/meta/heading structure, internal links to matching resources & tool pages, FAQ + `Article`/`EducationalOrganization` schema, image alt text — **SEO best practices enforced at generation time** |
| **Publishing flow** | draft → SY-A17-style factual verification → admin review queue (human approve) → publish to `studyear.com/blog` → auto-share handoff to SY-A23 |
| **Refresh cycle** | decayed-ranking posts get scheduled rewrites (grade-boundary updates, new spec versions) |
| **Conversion** | every post carries the free-diagnostic CTA and level-matched tool embeds (e.g. a mini quiz) |

## SY-A23 · Marketing Agent (multi-channel)

**Purpose:** keep StudYear visible **on social media** and in inboxes — every channel, one
orchestrated calendar.

| Channel | Behaviour |
|---|---|
| **Social (TikTok, Instagram, YouTube Shorts, X, LinkedIn, Facebook)** | transforms each blog post / product moment into platform-native formats (hook scripts, carousels, study-tip shorts); schedules to the exam-season calendar; A/B tests hooks; UTM-tagged links |
| **Email / lifecycle** | onboarding sequences per persona, mock-season campaigns, re-engagement of dormant accounts, parent digest upsell touches — composes with the Notification service |
| **Launch & campaign pushes** | Examiner-Agent free-marking campaigns (GTM §12.1), school-pilot case-study amplification, influencer-programme content kits (growth programme §8) |
| **Community** | seeds and amplifies UGC moments (resource milestones, streak stories) with consent; safeguarding-filtered — **no minor-identifying content, ever** |
| **Attribution** | every asset UTM-tagged into analytics; spend/effort reallocated toward converting channels (CAC per channel reported to the Commercial Dashboard, `../ai-os/14`) |

## SY-A24 · SEO Agent (the first-page keeper)

**Purpose:** **keep StudYear on the first page of all search engines** — and visible in
social search — permanently, by treating rankings as a monitored SLO, not a one-off project.

| Function | Specification |
|---|---|
| **Rank monitoring** | tracks target keywords (per `(Level, Subject, Exam Board, Topic)` matrix — thousands of long-tail terms like "AQA GCSE chemistry electrolysis revision") across Google/Bing/DuckDuckGo; **first-page share** is the north-star metric; alerts on drops |
| **SERP-gap capture** | finds queries where competitors (Get Revising, Seneca, BBC Bitesize, PMT) rank and StudYear doesn't → generates content briefs → feeds SY-A22's queue |
| **Technical SEO** | sitemap freshness, Core Web Vitals watch on the Vercel frontend, canonical/hreflang (English/French for the corridor), robots hygiene, structured data validation |
| **Programmatic SEO** | maintains the landing-matrix: a page per `(Level × Subject × Exam Board)` combination built from the taxonomy (`../architecture/12`) — the same play that gives incumbents their long-tail moat |
| **Social search** | optimises presence for TikTok/YouTube search ("how to revise GCSE maths") — titles, hashtags, captions co-tuned with SY-A23 |
| **Authority building** | identifies backlink/PR targets (education press, school networks, teacher communities); drafts outreach for human send |
| **Reporting** | weekly: first-page coverage %, movements, traffic → signup conversion; feeds KPI framework (venture brief §14, Engagement/Commercial) |

## Operating loop (the three together)

```
SY-A24 SEO Agent ──briefs (SERP gaps, keywords)──▶ SY-A22 Blog Agent
       ▲                                                 │ published post
       │ rank/traffic telemetry                          ▼
       └────────── search engines ◀── SY-A23 Marketing Agent (social/email fan-out)
```

- SEO finds the demand → Blog captures it → Marketing amplifies it → SEO measures the
  ranking effect → next briefs. A closed marketing loop mirroring the learning loop.

## Guardrails

- **Human-in-the-loop publishing:** admin approval before anything goes public (Admin
  Control Panel owns the blog tool — founding directive #19, `../ai-os/14`).
- **Truthfulness:** all claims grounded in real product/platform data; grade-outcome claims
  follow the estimates-not-guarantees liability posture (product spec §4b.3).
- **Safeguarding:** no minor-identifying content in any marketing asset; community
  amplification is consent-gated.
- **Cost class:** marketing generation is platform-billed and margin-accounted like every
  other AI activity — inside the 66%–100% band (commercial-model §1).
