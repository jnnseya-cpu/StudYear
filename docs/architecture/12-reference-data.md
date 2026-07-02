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

## 2. Subject

The academic subject a class, offering, resource, objective, or tutor specialism is about.
Together with **Level** (§1) it forms the primary **discovery/matching key** — a parent
searching "GCSE Mathematics" filters offerings on `(level=GCSE, subject=Mathematics)`.

> **Subject is level-scoped.** There is not one flat subject list: the valid set depends on
> the Level. The table below is the **school / further-education set** (Primary–A-level:
> GCSE, IGCSE, A-level, etc.). **University** has its own, much larger subject taxonomy
> (§2.4). Store subjects against their level-scope; don't merge the two lists.

### 2.0 School / further-education subjects (Primary–A-level)

| Value | | Value | |
|---|---|---|---|
| Accounting | | ICT | |
| Biology | | Law | |
| Business Studies | | Mathematics | |
| Chemistry | | Media Studies | |
| Computing | | Music | |
| Economics | | Philosophy | |
| English | | Physical Education | |
| English Language | | Physics | |
| English Literature | | Psychology | |
| French | | Religious Studies | |
| Geography | | Science | |
| Government & Politics | | Sociology | |
| Health & Social Care | | Spanish | |
| History | | | |

Plus the special values: **All**, **Fun**, **Other**.

### 2.1 Special values
- **All** — wildcard matcher (a tutor who covers every subject); like `All Levels`, store it
  only on offerings/resources, never on a learner profile or a single class.
- **Fun** — non-curricular/enrichment, mirrors the `Fun` level so break content
  (`11 §2` crosswords, quizsearches) stays out of mastery/alignment.
- **Other** — catch-all with optional free-text; Admin can promote frequent "Other" values
  into first-class entries.

### 2.2 Notes on overlaps & granularity
- **English** vs **English Language** vs **English Literature**, and **Science** vs the
  discrete sciences (Biology/Chemistry/Physics), coexist deliberately: some tenants/levels
  teach the umbrella subject, others the split. Keep all values; do not auto-collapse.
  Resolve umbrella↔component relationships in Admin config if roll-ups are needed, rather
  than forcing authors to pick one granularity.
- **Computing** vs **ICT** are distinct curriculum subjects, not synonyms — keep both.

### 2.3 Where the Subject field attaches

| Entity (`09`) | Field | Purpose |
|---|---|---|
| `Class` | `subject` | what the class teaches |
| `TutorOffering` | `subjects[]` | discovery/matching (`04`) |
| `Resource` (`11`) | `subject` | filter/browse revision resources |
| `LearningObjective` | `subject` scope | objectives are subject-bounded |
| `User` profile (tutor) | `specialisms[]` | tutor's subject specialisms |
| `StudyPlan` (`11`) | per-subject blocks | planner organises revision by subject |

### 2.4 University subjects (List of UK University Subjects 2026/2027)

Scoped to `level = University`. Far broader than the school set, and includes vocational and
professional fields. Plus the same special values **All / Other** (and **Fun** where
enrichment applies).

| | | | |
|---|---|---|---|
| Accounting and Finance | Data Science | Land and Property Management | Politics |
| Adult Nursing | Dentistry | Law | Postgraduate Certificate in Education (PGCE) |
| Aeronautical and Manufacturing Engineering | Drama Dance and Cinematics | Linguistics | Project Management |
| Agriculture and Forestry | Economics | Marketing | Psychology |
| Anatomy and Physiology | Education | Materials Technology | Public Health |
| Anthropology | Electrical and Electronic Engineering | Mathematics | Real Estate |
| Archaeology | English | Mechanical Engineering | Robotics |
| Architecture | Fashion | Medical Technology | Social Policy |
| Art and Design | Film Making | Medicine | Social Work |
| Biological Sciences | Food Science | Music | Sociology |
| Biomedical Science (Biomedicine) | Forensic Science | Neuroscience | Sports Science |
| Building | General Engineering | Nursing | TESOL |
| Business and Management Studies | Geography and Environmental Sciences | Occupational Therapy | Veterinary Medicine |
| Chemical Engineering | Geology | Pharmacology and Pharmacy | Youth Work |
| Chemistry | Health and Social Care | Philosophy | |
| Civil Engineering | History | Physics and Astronomy | |
| Classics and Ancient History | History of Art Architecture and Design | Physiotherapy | |
| Communication and Media Studies | Hospitality Leisure Recreation and Tourism | | |
| Complementary Medicine | Information Technology | | |
| Computer Science | | | |
| Counselling | | | |
| Creative Writing | | | |
| Criminology | | | |

#### 2.4.1 Subject pathways / sub-disciplines
Some university subjects fan out into **pathways** — related but distinct programmes that a
learner or tutor may specialise in. Example (Construction & the Built Environment):

| Parent area | Pathways |
|---|---|
| Construction Management | Architectural Technology · Building Surveying · Civil Engineering · Construction Management · Quantity Surveying · Real Estate |

*Modelling:* a pathway is a subject that may reference a broader `parent_subject`. Note some
pathways (Civil Engineering, Real Estate) are **also top-level subjects** in their own right —
the graph is a DAG, not a strict tree, so store the relationship as an optional parent link
rather than forcing a single hierarchy. Resolve roll-ups in Admin config (same posture as the
umbrella/component note in §2.2).

## 3. Exam Board

The awarding organisation whose specification a class, offering, resource, or objective
follows. It refines `(Level, Subject)` into the exact specification — "GCSE Mathematics
**AQA**" vs "GCSE Mathematics **Edexcel**" — which matters because content, mark schemes,
and past papers differ by board. The third axis of the discovery/matching key.

| Value | Notes |
|---|---|
| **AQA** | England |
| **Edexcel** | Pearson Edexcel, England |
| **OCR** | England |
| **WJEC** | Wales (and Eduqas brand) |
| **CCEA** | Northern Ireland |
| **SQA** | Scottish Qualifications Authority (National 5, Highers, Advanced Highers) |
| **CIE** | Cambridge International (IGCSE / international) |
| **ICAAE** | international awarding body |
| **All boards** | wildcard matcher — content/offering valid across boards |
| **Other** | catch-all / not-listed; optional free-text |

### 3.1 Special values
- **All boards** — matcher for board-agnostic content (foundational material, or a tutor who
  covers any board); store on offerings/resources, not on a single specification-bound class.
- **Other** — catch-all with optional free-text; Admin can promote frequent values.

### 3.2 Relationship to Level & Subject
Exam Board is only meaningful **in combination** with a level+subject that a board actually
awards (SQA pairs with National 5 / Highers; CIE with IGCSE; AQA/Edexcel/OCR/WJEC/CCEA with
GCSE and A-level). The three enums together — `(Level, Subject, Exam Board)` — are the
canonical **specification tuple** used for discovery, filtering, and objective alignment.
Validation of *which* board is valid for a given level+subject lives in Admin academic
config, not hard-coded per surface.

### 3.3 Where the Exam Board field attaches

| Entity (`09`) | Field | Purpose |
|---|---|---|
| `Curriculum` / `PolicyConfig` | `exam_boards[]` | boards a tenant operates |
| `Class` | `exam_board` | class's specification |
| `TutorOffering` | `exam_boards[]` | discovery/matching (`04`) |
| `Resource` (`11`) | `exam_board` | filter/browse by specification |
| `LearningObjective` | `exam_board` scope | objectives map to a board's spec |

## 4. Topic

The **most granular axis** — the specific area of study within a `(Level, Subject, Exam
Board)` specification. Topic is architecturally distinct from the three enums above: it is
**not a small closed list** but a large, subject- and board-scoped taxonomy that maps
directly onto the **`LearningObjective`** entity (`09 §3`). **Topic is the grain at which
`Mastery` is measured** — the single `(student, objective)` row from `09 §7.1` is, in
product terms, a `(student, topic)` mastery.

Representative values (a sample across subjects — the real set is large and grows):

| Topic | Typical subject / spec |
|---|---|
| America – 19th and 20th century | History |
| Russia – 19th and 20th century | History |
| British monarchy – Tudors and Stuarts | History |
| Modern Britain – 19th century onwards | History |
| Medicine through time (OCR History A) | History (OCR) |
| WWII and Nazi Germany 1939–1945 | History |
| The Cold War | History / Politics |
| An Inspector Calls | English Literature |
| Grammar and vocabulary | Languages / English |
| Attachment · Memory · Approaches · Research methods and techniques | Psychology |
| Crime and deviance · Families and households · Education | Sociology |
| Criminal law | Law |
| Christianity · Religion and beliefs · Ethics · Philosophy | Religious Studies / Philosophy |
| Cells, tissues and organs · DNA, genetics and evolution · Human, animal and plant physiology · Cellular processes and structure | Biology |
| Biological molecules, organic chemistry and biochemistry | Chemistry |
| Energy | Physics / Science |
| Natural hazards | Geography |
| Case studies | (cross-subject) |

### 4.1 Why Topic is modelled differently
- **It's the mastery grain.** Every graded assignment, quiz attempt, and self-test
  (`11 §3.2`) writes mastery *on a topic*. Teachers and tutors write the same topic-keyed
  row; students, parents, and analytics read it. Topic is therefore the linchpin of the
  closed loop (`00 §5`, `07 §4`).
- **It's scoped, not global.** A topic is meaningful only within its specification — "Medicine
  through time" belongs to *OCR History A*, not to Chemistry. Topics hang off
  `LearningObjective`, which carries `level`/`subject`/`exam_board` scope (`09 §3`).
- **It's spec-versioned.** Because boards revise specifications, topics are versioned with the
  curriculum (`02 §2.2`) so historical mastery stays interpretable after a spec change.
- **Note board-specific labels.** Some values embed their board (e.g. "Medicine through time
  (OCR History A)") — store the clean topic plus its `exam_board` scope rather than baking the
  board into the label long-term; the parenthetical is display sugar.

### 4.2 Where Topic attaches

| Entity (`09`) | Field | Purpose |
|---|---|---|
| `LearningObjective` | **is** the topic (code + label + spec scope) | canonical definition |
| `Lesson` / `Assignment` | `objective_ids[]` | what's taught / assessed |
| `Mastery` | `objective_id` | **the (student, topic) mastery row** |
| `TutorOffering` | `objective_ids[]` | topic-level discovery (`04`) — "reinforce *this* topic" |
| `Resource` (`11`) | `objective_ids[]` | topic-tagged flashcards/quizzes → mastery write-back |
| `Alert` (risk flag) | `objective_ids[]` | at-risk *on a specific topic* → matched tutor suggestions |

### 4.3 The full specification hierarchy
Levels (§1) → Subjects (§2) → Exam Boards (§3) → **Topics (§4)** form the drill-down:

```
Level (GCSE) ─▶ Subject (History) ─▶ Exam Board (OCR) ─▶ Topic (Medicine through time)
                                                              │
                                                              ▼
                                                   LearningObjective  ─▶  Mastery(student, topic)
```

The first three are discovery/filter facets; the fourth is where learning is actually
*measured*. This is why the ecosystem can route a teacher's topic-level flag to a
topic-matched tutor and see improvement on the same topic — the axes bottom out in one
shared, measurable unit.

## 5. Resource Type

The kind of revision resource (`11`). This is the **canonical `Resource.type` enum** — the
`11 §2` toolset names the *creation flows*, while this list is the full set of persisted
types, spanning three families: **authored study tools**, **structured-thinking templates**
(the "Organise-your-thinking" family, `11 §2`), and **shared media formats** (the "Shared
Resources" family, `11 §2`).

| Value | Family | Testable? | Notes / `11` mapping |
|---|---|:--:|---|
| **Flashcards** | study tool | ✓ | spaced recall |
| **Revision Cards** | study tool | ✓ | A5 chunks |
| **Revision Notes** | study tool | – | detailed notes |
| **Quiz** | study tool | ✓ | scored self/peer test |
| **Quizsearch** | study tool | ✓ | quiz × wordsearch |
| **Crossword** | study tool | ✓ (light) | revision break (`Fun`) |
| **Mindmap** | study tool | – | node/edge diagram |
| **Timeline** | thinking template | – | chronological structure |
| **Grid** | thinking template | – | generic tabular organiser |
| **Compare and contrast table** | thinking template | – | organise-your-thinking |
| **Advantages and disadvantages table** | thinking template | – | organise-your-thinking |
| **Causes and effects table** | thinking template | – | organise-your-thinking |
| **SWOT analysis** | thinking template | – | organise-your-thinking |
| **Character analysis** | thinking template | – | e.g. English Literature |
| **Document** | media | – | shared file |
| **Presentation** | media | – | slides |
| **Spreadsheet** | media | – | data/tables |
| **Image** | media | – | shared image |
| **Audio** | media | – | podcast / clip |
| **Video** | media | – | shared video |
| **Web Page** | media | – | external link/resource |
| **Multi-tool** | composite | mixed | bundles several types into one resource |
| **Other** | catch-all | – | optional free-text |

### 5.1 How this reconciles with the `11` toolset
- The `11 §2` **"Organise-your-thinking"** create-flow produces any of the *thinking
  template* types (Compare/contrast, Advantages/disadvantages, Causes/effects, SWOT,
  Character analysis, Grid, Timeline).
- The `11 §2` **"Shared Resources"** create-flow produces the *media* types (Document,
  Presentation, Spreadsheet, Image, Audio, Video, Web Page).
- **Study Planner** (`11 §2`) is a `StudyPlan`, modelled separately from `Resource` (it
  schedules resources rather than being one), so it is intentionally absent from this enum.
- **Multi-tool** is a composite whose testability derives from the testable children it
  bundles.

### 5.2 Testability drives mastery write-back
The `Testable?` column is load-bearing: only testable types produce `Attempt` records that
emit `mastery.updated` (`11 §3.2`). Media and thinking-template types are studied/shared but
do not themselves move mastery — they inform, they don't measure. This keeps the single-fact
mastery rule (`09 §7.1`) clean.

### 5.3 Where Resource Type attaches
`Resource.type` (`09` / `11 §4`) — one required value per resource, plus its `(Level,
Subject, Exam Board, Topic)` scope tags from §§1–4 so every resource is both *typed* and
*placed in the specification hierarchy*.

## 6. Governance & extensibility
- **Admin-owned:** values are managed in the Global Academic Architecture Engine; adding/
  renaming a level is an audited config change (`02 §2.4`).
- **Stable keys:** store a stable machine key per value (e.g. `a2_a_level`,
  `years_7_9_ks3`) so display labels can be localized/renamed without breaking data.
- **Regional visibility:** a tenant may expose only the subset relevant to its region
  (e.g. a Scottish school surfaces National 5 / Highers; an international school surfaces
  IGCSE / IB) while the master list remains platform-wide.

### Vocabularies defined here

| § | Vocabulary | Role |
|---|---|---|
| 1 | **Education Level** | discovery/matching facet |
| 2 | **Subject** | discovery/matching facet |
| 3 | **Exam Board** | discovery/matching facet |
| 4 | **Topic** | the mastery grain (→ `LearningObjective`) |
| 5 | **Resource Type** | `Resource.type` for revision resources |

Together §§1–4 form the **specification tuple** `(Level, Subject, Exam Board, Topic)` that
every class, offering, resource, and objective is tagged with — the first three filter,
the fourth measures.

> Still to canonicalise here when specified: **Grading Scale** (GPA / % / alphanumeric,
> referenced in `02 §2.2`) and **Curriculum System** (GCSE-vs-IB-vs-K-12 as syllabus).
> They belong in this file too, tagged the same way, for the same reason: one value, one
> meaning, every surface.
