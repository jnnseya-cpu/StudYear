# 12 — Reference Data & Controlled Vocabularies

Shared enums the whole ecosystem tags against. Centralizing them here is what keeps a
tutor's offering, a teacher's class, a student's profile, and a revision resource
**comparable** — the same value means the same thing on every surface. These are
Admin-governed master data (Global Academic Architecture Engine, `02 §2.2`).

## 1. Education Level

The level a class, offering, resource, or learner is pitched at. Used for **discovery/
matching** (a parent finds a tutor at the right level), **filtering** (browse resources by
level), and **profile/config** (student's level, class level, curriculum scope).

| Value | Notes |
|---|---|
| **Primary School** | early years / primary |
| **Years 7–9 (KS3)** | lower secondary (England & Wales Key Stage 3) |
| **GCSE** | secondary, England/Wales/NI |
| **IGCSE** | international GCSE |
| **National 5** | Scottish secondary |
| **Scottish Highers** | Scottish upper secondary |
| **Scottish Advanced Highers** | Scottish post-Higher |
| **AS** | A-level year 1 |
| **A2 / A-level** | A-level (full) |
| **BTEC National** | vocational Level 3 |
| **International Baccalaureate** | IB Diploma / programmes |
| **University** | higher education |
| **All Levels** | wildcard — matches any level (e.g. a tutor who teaches across levels) |
| **Fun** | non-curricular / enrichment / break content (e.g. crosswords, quizsearches) |
| **Other** | catch-all / not-listed; free-text detail may accompany |

### 1.1 Special values
- **All Levels** is a *matcher*, not a level: an offering tagged `All Levels` surfaces for
  learners at any specific level. Do not store it on a learner profile — it's meaningful
  only on offerings/resources.
- **Fun** decouples enrichment content (revision breaks, `11 §2` crosswords/quizsearches)
  from graded curriculum so it never pollutes mastery/alignment.
- **Other** carries optional free-text so the taxonomy can grow without blocking authors;
  Admin can promote frequently-used "Other" values into first-class entries.

### 1.2 Where the Level field attaches

| Entity (`09`) | Field | Purpose |
|---|---|---|
| `Curriculum` / `PolicyConfig` | `levels[]` | which levels a tenant operates |
| `Class` | `level` | class's pitch |
| `TutorOffering` | `levels[]` | discovery/matching (`04`) |
| `Resource` (`11`) | `level` | filter/browse revision resources |
| `User` profile (student) | `level` | learner's current level |
| `LearningObjective` | `level` scope | objectives are level-bounded |

### 1.3 Relationship to curriculum & grading scale
Level is **orthogonal** to the *curriculum system* (GCSE-vs-IB-vs-K-12 as syllabus, `02
§2.2`) and to the *grading scale* (GPA / % / alphanumeric). In practice several list values
(GCSE, IGCSE, IB, National 5…) name both a level *and* a curriculum system; the platform
treats the **Level enum** as the discovery/matching axis and resolves the associated
curriculum/grading from tenant academic config. Keep the enum as the single source for the
level dimension; don't re-derive it per surface.

## 2. Governance & extensibility
- **Admin-owned:** values are managed in the Global Academic Architecture Engine; adding/
  renaming a level is an audited config change (`02 §2.4`).
- **Stable keys:** store a stable machine key per value (e.g. `a2_a_level`,
  `years_7_9_ks3`) so display labels can be localized/renamed without breaking data.
- **Regional visibility:** a tenant may expose only the subset relevant to its region
  (e.g. a Scottish school surfaces National 5 / Highers; an international school surfaces
  IGCSE / IB) while the master list remains platform-wide.

> Future vocabularies (Subject, Grading Scale, Curriculum System, Resource Type — see
> `11 §2`) belong in this file too, tagged the same way, for the same reason: one value,
> one meaning, every surface.
