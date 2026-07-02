# The Preservation & Enhancement Mandate

> **Governing rule for this entire repository and any implementation built from it:**
> **Everything provided in the source material MUST be implemented. Nothing may be
> removed. Changes may only improve and enhance.** This applies from the very start of
> the corpus to the very end — retroactively and for all future additions.

## 1. What this means in practice

1. **Every feature, role, module, agent, workflow, vocabulary, business rule, revenue
   stream, and user journey** recorded anywhere in `docs/` is a **mandatory requirement**
   for the build.
2. **No consolidation may drop content.** Where multiple passes describe the same thing
   (e.g., the several Get Revising teardowns, or the StudYear role extractions vs. the
   formal report), implementations must satisfy the **union** of all versions — overlaps
   merge, differences both survive as variants or the richer one subsumes the other
   *without losing detail*.
3. **Enhancement is one-directional.** A spec item may gain precision, guardrails,
   architecture, or scope — it may never lose capability it was described with.
4. **As-is vs. target are both binding.** The disclosed current state
   (`product/studyear-product-spec.md §3b` — Firebase, Google/OpenAI, Stripe, strict ACU
   rules) is the migration *starting point*; the target blueprints (MariaDB tenancy, Model
   Router incl. Claude, BitriPay, agent mesh) are the *destination*. Neither invalidates
   the other.

## 2. Requirements traceability index

Every content stream received, and where it is implemented in the corpus:

| # | Source stream | Where captured |
|---|---|---|
| 1 | Edu-OS 5-persona ecosystem framing + system matrix | `architecture/00–01`, `architecture/07` |
| 2 | Persona specs: Student, Parent, Teacher, Admin, Tutor | `architecture/02–06` (verbatim-woven) |
| 3 | Revision-resource toolset ("Create a revision resource") | `architecture/11` |
| 4 | Controlled vocabularies: Level, Subject (school + university + pathways), Exam Board, Topic, Resource Type | `architecture/12` |
| 5 | PART 1 module decomposition (MariaDB/Hostinger, 6 modules) | `architecture/13` |
| 6 | PART 2 named agents (Sentinel…Matchmaker) + Claude/Gemini/OpenAI directive | `architecture/14` |
| 7 | PART 3 layered runtime, partitioning, async AI engine | `architecture/15` |
| 8 | Master AI-OS Architect prompt (17 sections) | `ai-os/00–15` + `ai-os/README.md` |
| 9 | Real-product extraction: 5 engines, ACU wallet, 6 roles, 20 modules, positioning | `product/studyear-product-spec.md §1–6` |
| 10 | Enhanced agents (3 admin, 5 student, 4 parent, 5 school, 4 teacher, 4 tutor = 25) | `ai-os/04 §3A` + product spec role tables |
| 11 | ML layer (13 models) + 14-agent roster + 6 governance invariants | `product/studyear-product-spec.md §5a/§5c` |
| 12 | Admin universal ACU-grant / plan-change authority | `ai-os/14` + product spec §4.1 |
| 13 | Public-teardown ground truth: disclosed stack, strict ACU rules, telemetry, capability strip, six flagship modules, UGC layer, per-role journeys, PM observations | `product/studyear-product-spec.md §2b–§4b` |
| 14 | Formal Deep Platform Extraction report (Part A + Part B + closing) | `product/deep-platform-extraction-report.md` |
| 15 | Get Revising audit, pass 1 (actors → agentic map → local-stack migration) | `competitors/get-revising-audit.md` main body |
| 16 | Get Revising pass 2 (deep roles, weaknesses, Revision AI-OS, Africa play) | same file, Appendix 1 |
| 17 | Get Revising pass 3 (architectural teardown, Learning OS, MariaDB schema, token tiers) | same file, Appendix 2 |
| 18 | Get Revising pass 4 (feature extraction + Academic Success OS rosters: Student/Parent/Teacher/School/Tutor/Admin OS layers, ML signals, the canonical 18-agent build list, winning positioning) | same file, Appendix 3 — **complete** |
| 19 | Preservation & Enhancement Mandate directive ("implement everything, remove nothing, enhance only, start to end") | this document + root README banner |
| 20 | Pedagogical thesis: same school/lessons/lectures, different styles & speeds → ML + behavioural learning personalisation to improve everyone quickly | `product/studyear-product-spec.md §0` |
| 21 | v1.1 Personalisation Engine: LPV (7 behavioural dimensions), three adaptation loops, catch-up compression / stretch principle, SY-A21 Profile Agent (registry → 21) | `product/studyear-product-spec.md §5e` |
| 22 | Flagship venture brief: incumbent-generation contrast, opposite-premise substrate, five-sided revenue architecture, BitriPay diaspora/francophone rail, NSEYA X-EXECUTE shared portfolio assets, positioning statement | `product/studyear-ai-os-venture-brief.md` |

**Audit rule:** every future stream gets a row here before its commit is pushed.

## 3. Conflict-resolution protocol (enhance, never remove)

When sources disagree:

| Conflict type | Resolution |
|---|---|
| As-is fact vs earlier assumption (e.g., Firebase vs Hostinger) | record both; label as-is vs target; **keep both binding** (§1.4) |
| Two overlapping agent rosters (e.g., B2/B3 agents vs §3A enhanced agents vs Appendix-3 rosters) | implement the **union**; identical agents merge with all described capabilities; similar agents remain distinct specialisations |
| Live processor (Stripe) vs requested gateway (BitriPay) | **both** — unified payments abstraction (`ai-os/08`) |
| Non-refundable ACU purchases vs admin refund powers | both: customer purchases final; admin goodwill re-credits remain audited admin actions |

## 4. Implementation obligation

This corpus is not documentation-for-its-own-sake: it is the **requirements baseline for
the build**. Any implementation phase (per `ai-os/15-build-roadmap.md` and the extraction
report's B7 roadmap) must trace back to this index, item by item, and satisfy every row.
