# 11 — Module: Revision Resources (the Study Sandbox toolset)

> **"Create a revision resource."** The maker-and-tester toolset at the heart of the
> Student workspace (`05 §2.2` AI-Powered Study Sandbox, `05 §2.4` note-sharing). The
> pedagogy is deliberate: **the act of *making* a resource teaches; *re-using and
> self-testing* with it teaches again; *sharing* it teaches others.** Sign-up is required
> to author (resources are owned, saved, and re-testable) but the flow is quick and free.

## 1. Where this module sits

Revision Resources is a **Content & Assessment** capability, surfaced primarily to Students
but authored by anyone who benefits (a teacher building a class quiz, a tutor building
package flashcards). Every resource is topic-tagged against the shared **LearningObjective
taxonomy** (`09 §3`), so self-test results can write back into **Mastery** — a resource is
never a dead artifact, it feeds the closed loop (`00 §5`).

```
 Student/Teacher/Tutor ──create──▶ Resource (topic-tagged)
                                      │
              ┌──────────┬───────────┼───────────┬──────────┐
              ▼          ▼           ▼            ▼          ▼
           re-use    self-test    share    generate-from-source   analytics
              │          │           │            │                  │
              └── mastery.updated ◀──┴────────────┘        performance trends
```

## 2. The resource types

> The **create-flows** below name how a resource is made; the full persisted
> `Resource.type` enum (including structured-thinking templates like SWOT / Compare-and-
> contrast / Timeline and media formats like Audio / Video / Presentation) is canonicalised
> in [12 §5 — Resource Type](12-reference-data.md). Every resource also carries the
> `(Level, Subject, Exam Board, Topic)` specification tuple from [12 §§1–4](12-reference-data.md).

| Tool | What it is | Testable? | Shareable? | Primary generator |
|---|---|:--:|:--:|---|
| **Study Planner** | a revision timetable built from subjects + free-time + deadline/exam date | – | ✓ | scheduling optimizer |
| **Flashcards** | small Q-front / A-back cards | ✓ (spaced recall) | ✓ | manual or AI-from-notes |
| **Revision Cards** | topics broken into manageable A5 chunks | ✓ | ✓ | manual |
| **Revision Notes** | detailed topic notes | – | ✓ | manual |
| **Quizzes** | educational, self- and peer-testable question sets | ✓ (scored) | ✓ | manual or AI-from-source |
| **Mindmaps** | diagram of relationships within a topic | – | ✓ | manual (node/edge) |
| **Crosswords** | crossword built from term/clue pairs (a study break) | ✓ (light) | ✓ | generator from clue set |
| **Organise-your-thinking** | structured analysis of a topic's key elements | – | ✓ | template-driven |
| **Quizsearches** | a quiz × wordsearch hybrid | ✓ | ✓ | generator from term set |
| **Shared Resources** | curated external notes, slides, sites, videos, podcasts | – | ✓ | link/upload |

## 3. The three-part lifecycle (make → test → share)

### 3.1 Make
- **Manual authoring** for every type (a form/editor per type).
- **AI generation** for the source-driven types: upload lecture slides or notes → generate
  editable flashcards, quizzes, and adaptive review guides (the `05 §2.2` sandbox path).
  Generation is an async job; output is **editable** and topic-tagged, never final-on-arrival.
- Authoring requires an account (ownership + persistence); the create CTA prompts sign-up.

### 3.2 Test (self & peer)
- Testable types (flashcards, quizzes, revision cards, crosswords, quizsearches) run in a
  **study/test mode** that records attempts.
- Attempts on topic-tagged resources emit `mastery.updated`, so self-testing moves the
  *same* mastery record teachers and tutors see — self-study is measured, not siloed.
- Spaced-repetition scheduling can drive flashcard re-tests; the Study Planner can slot
  test sessions into the timetable.

### 3.3 Share
- Any resource can be shared to a **cohort forum** (`05 §2.4`, visibility inherits
  enrollment) or published more broadly as a Shared Resource.
- Sharing is a first-class artifact action (not a raw file dump): shared resources keep
  their type, topic tags, and testability, so a peer can *test themselves* on a classmate's
  flashcards, not just read them.
- Moderation hooks report up to the owning teacher/tutor and Tenant Admin (`05 §2.4`).

## 4. Data model additions

Extends `09`:

| Entity | Key fields | Notes |
|---|---|---|
| **Resource** | id, tenant_id, owner_user_id, type, objective_ids[], visibility, source_ref? | base type for all tools |
| **ResourceItem** | resource_id, payload (card/question/node/clue/…) | type-specific content |
| **StudyPlan** | owner_user_id, subjects[], availability, target_date | Study Planner output |
| **PlanSlot** | study_plan_id, when, subject, resource_ref? | scheduled revision block (a `CalendarItem` source → student HUD) |
| **Attempt** | resource_id, user_id, score, objective_ids[], at | self/peer test result → `mastery.updated` |
| **Share** | resource_id, scope (cohort/public), shared_by | preserves type + testability |

Invariants carried over: `tenant_id` on every row (`09 §7.2`); testable attempts are the
only *self-service* writer path into Mastery, and they write the **same** `(student,
objective)` row (`09 §7.1`) rather than a parallel one.

## 5. Cross-persona reach

- **Student:** primary author, tester, and sharer — this *is* the study sandbox.
- **Teacher:** can author quizzes/flashcards as class resources; a pop-quiz (`03 §3`) is a
  Quiz resource deployed to a cohort with auto-grading rules.
- **Tutor:** can attach package-specific resources to a booking; post-session revision
  material becomes a shared Resource.
- **Parent:** sees resource-driven activity as part of engagement/progress (`06 §2.2`), and
  Study-Planner adherence as a study-habit signal.
- **Admin:** governs visibility/moderation policy and sees resource creation/usage in
  engagement rollups.

## 6. Why it belongs in the kernel, not a bolt-on

Because every testable resource writes the **shared Mastery record**, revision tooling is
not a separate "study app" glued on — it is another *writer into the same learning record*
that teachers and tutors use. That is exactly the Edu-OS thesis (`00 §2`): one fact, many
lenses. A student self-testing on flashcards the night before an exam moves the same needle
a teacher's graded quiz moves — and the whole ecosystem can see it.
