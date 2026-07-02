# Executive Product Audit & Next-Gen AI Transformation Map — Get Revising

| | |
|---|---|
| **Platform** | Get Revising (an asset of **The Student Room Group**) |
| **Target domain** | UK Secondary & Further Education (GCSE, AS/A2, International Baccalaureate) and Higher Education preparation |
| **Relevance to StudYear** | direct-adjacent competitor in UK revision; contrast case for the closed-loop/agentic thesis (see `../product/`, `../ai-os/01-market-gap-analysis.md`) |

## Part 1 — Current architecture & multi-tenant feature extraction

Get Revising is a **crowdsourced educational content clearinghouse and structured
time-blocking application.** The platform relies on **peer-to-peer resource loops and
rule-based generation algorithms.**

```
                  ┌──────────────────────────────────────────────┐
                  │                ADMIN ACTOR                   │
                  │   (Moderation, Compliance, Analytics, SEO)   │
                  └──────┬────────────────────────────────┬──────┘
                         │                                │
                         ▼                                ▼
       ┌──────────────────────────────────┐    ┌──────────────────────────────────┐
       │          STUDENT ACTOR           │    │           SCHOOL ACTOR           │
       │ (Planner, Quizzes, Flashcards)   │    │  (Cohorts, Resource Assigning)   │
       └─────────────────┬────────────────┘    └────────────────┬─────────────────┘
                         │                                      │
                         ▼                                      ▼
       ┌──────────────────────────────────┐    ┌──────────────────────────────────┐
       │          PARENT ACTOR            │    │       TEACHER / TUTOR ACTOR      │
       │  (Progress Tracking, Guardrails) │    │   (Content Creation, Analytics)  │
       └──────────────────────────────────┘    └──────────────────────────────────┘
```

### 1. Student Actor portfolio

The core consumer loop centres on **minimizing friction between exam specs and a student's
calendar.**

| Feature | Detail |
|---|---|
| **Algorithmic Study Planner** (Revision Timetable Creator) | *Inputs:* exam boards (AQA, OCR, Edexcel, WJEC, CCEA), target subjects, specific dates, school hours, personal time-block constraints. *Outputs:* a color-coded, dynamic weekly/monthly calendar breaking topics into actionable blocks |
| **Crowdsourced Resource Library consumer** | access to **1M+ user-generated assets** (revision notes, mind maps, essays, presentations); filterable by subject, exam board, qualification level |
| **Interactive Tool Studio** | built-in creation suites for custom **Flashcards, Wordsearches, Crosswords, Quizzes** — active-recall support |
| **Past Paper Hub** | official exam-board past papers tied to an internal marking system |
| **AI Tutor Sandbox** *(recent iteration)* | guided step-by-step chat prompts that **prevent students from seeing full answers immediately**, forcing structured retrieval |

### 2. Teacher & Private Tutor Actor portfolio

Scale resource deployment and audit student readiness.

| Feature | Detail |
|---|---|
| **Authoring Suite** | structured templates to upload, format, and tag revision materials with **exact exam-specification codes** |
| **Resource Assignment Engine** | build curated reading packets or flashcard decks; distribute directly to student groups |
| **Public Tutoring Profile Marketplace** | public landing pages with qualifications, specialties, and direct contact — converting browsing students into paying clients |

### 3. School Admin & Institutional Actor portfolio

Institutional insight across cohorts.

| Feature | Detail |
|---|---|
| **Cohort Management Dashboards** | group by class year or target tiers (e.g., Foundation vs Higher) |
| **Engagement & Activity Analytics** | minutes on self-directed revision vs active resource generation |
| **Curriculum Alignment Mapping** | ensure crowdsourced/teacher content matches national exam boards |

### 4. Parent Actor portfolio

Observation and support, **data clarity rather than direct interaction.**

| Feature | Detail |
|---|---|
| **Progress Mirroring** | read-only access to the student's Study Planner — verify time-blocking compliance |
| **Target vs Actual reports** | dashboards of completed study sessions vs skipped blocks |
| **Resource Procurement** | gateways to unlock premium test banks or connect with top-rated tutors |

### 5. System Administrator portfolio

The infrastructure backbone for content curation and data integrity.

| Feature | Detail |
|---|---|
| **Crowdsourced Content Moderation pipeline** | automated flag queues + manual review panels — plagiarism, inaccuracy, copyright |
| **SEO & Taxonomy Management engine** | high-volume landing pages organized around exam boards/keywords for organic search capture |
| **User Auth & Data Governance** | UK GDPR + **Age Appropriate Design Code (AADC)** compliance guardrails |

---

## Part 2 — Blueprint for the generative-AI & agentic evolution

To shift Get Revising from a **passive, crowdsourced library** into an **autonomous, agentic
system**: move away from manual user uploads and static calendars, toward **continuous,
closed-loop personalization.**

```
       ┌────────────────────────────────────────────────────────────────┐
       │                ORCHESTRATION & ANALYTICS LAYERS                │
       │          Omniscient Director Agent & Hyper-Personalized        │
       │                   Student Knowledge Graph                      │
       └───────────────────────────────┬────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌──────────────────────────────┐┌──────────────────────────────┐┌──────────────────────────────┐
│       STUDENT LAYER          ││    TEACHER/TUTOR LAYER       ││         PARENT LAYER         │
├──────────────────────────────┤├──────────────────────────────┤├──────────────────────────────┤
│ • Dynamic Micro-Scheduler    ││ • Co-Pilot Lesson Synthesizer││ • Non-Intrusive Coach        │
│ • "Blurt" Voice Assessment   ││ • Automatic Exam Predictor   ││ • Real-time Intervention Hub │
│ • Multi-Agent Debater Socratic│ • Auto-Grader Feedback       ││ • Conversational Progress    │
└──────────────────────────────┘└──────────────────────────────┘└──────────────────────────────┘
```

### 2.1 The core infrastructure engine

**Omniscient Director Agent (system router).** Instead of rule-based SQL keyword matching, a
central coordinator agent manages all user interactions — **profiling user behavior, intent,
and cognitive load in real time**, routing requests to specialized sub-agents.

**Hyper-Personalized Student Knowledge Graph.** Beyond static profiles: a **live vector
graph** tracking mastery per topic. Every interaction — a skipped study session, a paused
video, a low past-paper score — **adjusts the graph's nodes**, mapping strengths and
weaknesses **down to specific sub-chapters.**

### 2.2 Next-gen Student agent features

| Agent | Legacy system | AI transformation |
|---|---|---|
| **Dynamic Micro-Scheduler** | students manually drag-and-drop study blocks into a calendar | autonomous scheduling agent checks real-time performance + syncs external calendars; a poor afternoon chemistry quiz **automatically reshuffles the evening** toward chemistry active recall; accounts for **cognitive fatigue** by swapping intense writing tasks for light flashcard review later |
| **"Blurt" Voice Assessment & Multi-Modal Processing** | typed paragraphs / basic MCQs | hands-free **voice explanation** of a topic (e.g., mitosis) → transcription → **semantic match against the official exam rubric** → omitted keywords & misconceptions highlighted in real time |
| **Multi-Agent Socratic Debater** | static reading of uploaded essays | for humanities/essay subjects, a **dual-agent simulation**: **Agent A (Strict Examiner)** critiques structure, evidence, argument; **Agent B (Socratic Guide)** helps rewrite sections and adjust tone for top-tier marks |

### 2.3 Next-gen Teacher & Private Tutor agent features

| Agent | Legacy system | AI transformation |
|---|---|---|
| **Co-Pilot Lesson Synthesizer** | teachers spend hours compiling worksheets and searching for resources | content agent instantly generates **board-specific, non-plagiarized** homework packets, slide decks, flashcards from a basic prompt or raw lesson notes; **100% alignment with current AQA/Edexcel specs**, dynamically updated if the board changes criteria |
| **Predictive Exam Matrix** | teachers manually guess likely exam topics from previous years | analytical agent processes **decades of historical papers, chief-examiner reports, and national performance data** → predictive analysis of high-yield topics, common pitfalls, recommended focus areas before test day |
| **Synthetic Student Auto-Grader** | weekends spent manually marking mocks and writing feedback letters | **vision-language agent scans handwritten papers**, extracts text, scores against precise mark-scheme rubrics, line-by-line constructive feedback; groups class performance into a summary showing **exactly what to reteach Monday morning** |

### 2.4 Next-gen Parent agent features

| Agent | Legacy system | AI transformation |
|---|---|---|
| **Non-Intrusive Parent Coach** | parents log into a complex dashboard of incomplete tasks — friction with their child | agent summarizes performance into **clear, actionable updates via a messaging interface** — e.g. *"Marcus has mastered 85% of his Physics equations but is struggling with long-form electricity questions. Avoid asking him if he finished his homework; instead, encourage him to try one more practice problem before 8 PM."* |
| **Dynamic Intervention & Private Tutor Concierge** | parents manually search hundreds of unverified tutor profiles | when the knowledge graph detects a student **stuck on a critical topic despite multiple revision attempts**, the system coordinates an intervention: packages the student's **specific error logs and learning preferences**, then **automatically alerts and matches** the family with the best-suited vetted tutor |

### 2.5 Next-gen Admin & platform-management agent features

| Agent | Legacy system | AI transformation |
|---|---|---|
| **Self-Cleaning Crowdsourced Curation** | high vulnerability to copyright complaints and incorrect, poorly formatted student notes | every upload passes an automated validation pipeline: **plagiarism check, formatting correction, mathematical/historical error fixing, exact exam-spec tagging**; substandard entries **quietly filtered out** |
| **Conversational Database UI** (on local infrastructure) | rigid, slow SQL reports for engagement queries | admin staff query the entire data footprint in **natural language** against an internal, secure database — e.g. *"Generate a report showing which Edexcel Maths topics have seen the largest drop in student performance across Birmingham over the past 14 days, and format the output as a clean table."* |

---

## Part 3 — Strategic tech-stack migration plan

To implement these changes **without relying on third-party backend infrastructures**, the
engineering roadmap deploys **open-weight, production-ready AI frameworks locally:**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          LOCAL STORAGE ENGINE                          │
│     MariaDB (Relational Core)  +   pgvector Extensions (Vector Core)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENT RUNTIME ENVIRONMENT                       │
│      LangGraph / Autogen Orchestration  +  Ollama Inference Engine     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       MODELS DEPLOYED PER NODE                         │
│   • Llama 3.1 70B (Complex Tasks)   • Mistral 7B (Fast-Text Processing)│
└────────────────────────────────────────────────────────────────────────┘
```

| Layer | Components | Role |
|---|---|---|
| **Local storage engine** | MariaDB (relational core) + pgvector extensions (vector core) | data + embeddings on owned infrastructure |
| **Agent runtime** | LangGraph / AutoGen orchestration + **Ollama** inference engine | local agent mesh + self-hosted inference |
| **Models per node** | **Llama 3.1 70B** (complex tasks) · **Mistral 7B** (fast text processing) | open-weight tiering by task complexity |

> **Strategic note (StudYear lens):** this is the **opposite provider bet** to StudYear's —
> Get Revising's map goes *self-hosted open-weight* (data sovereignty, no per-token cost,
> AADC-friendly locality) while StudYear runs *frontier-API multi-provider*
> (Google/OpenAI today; Claude/Gemini/OpenAI router in the target blueprint). The trade:
> self-hosting trades capability ceiling and ops burden for cost control and locality;
> frontier APIs trade per-token cost for state-of-the-art reasoning. A hybrid — frontier for
> deep reasoning, local open-weight for high-volume classify/extract — is the pattern both
> roadmaps converge toward.

### 3.1 Data layer foundation
- **Relational storage:** retain **MariaDB** as the primary engine for user profiles,
  transactional data, billing records, and traditional application state.
- **Vectorization:** deploy a local vector DB instance or **pgvector**-compatible services
  for multi-dimensional student profiles, semantic resources, and exam rubrics.

### 3.2 Agent runtime & orchestration
- **State management:** **LangGraph or Microsoft AutoGen** for structured multi-agent
  workflows — managing complex interactions between specialized agents **without losing
  context.**
- **Local inference pipeline:** **Ollama or vLLM** hosted on private cloud infrastructure
  for open-weight models — **protects student data privacy and avoids high API usage costs.**

### 3.3 Model selection strategy
| Tier | Models | Tasks |
|---|---|---|
| **Heavy** | Llama 3.1 70B / **Qwen-2.5-72B** | complex multi-step: essay evaluation, Socratic debating, exam-board pattern analysis |
| **Fast** | Mistral-7B / Llama-3.1-8B | low-latency: voice transcription, resource tagging, calendar updates |

---

## Positioning note

Get Revising (a The Student Room Group property) is a **classic pre-AI edtech product:
strong distribution, dated mechanics** — a crowdsourced library + manual timetable in an
era of closed-loop agentic systems. It slots naturally next to StudYear as a portfolio
teardown: the Part 2 reimagining above is what an incumbent *would have to build* to match
the StudYear 2.0 blueprint (`../product/deep-platform-extraction-report.md` Part B) —
which is precisely StudYear's window.

---

# Appendix — Second-pass deep extraction

*(A fuller analyst pass over the same platform; identification basis: UK revision &
exam-prep, GCSE/AS-A2/IB/KS3–post-16 coverage, planning + content + community pillars,
1M+ students claim.)*

## Part 1 — Full platform extraction (as it exists today)

### What the platform fundamentally is

A **UK-focused revision and exam-preparation platform** (GCSE, AS/A2, IB, KS3–post-16)
built on **three pillars: planning, content, and community.** It claims **over 1 million
students**; its core promise is **organised, self-directed revision.**

### 1. Student role (the primary persona)

**Planning & organisation**
- Personalised study plan generated **in under 5 minutes** based on what you're studying
- **Timetable builder**: add exams (subject, level, exam board, date), colour-code, allocate
  **revision weight per subject**; builds in breaks, lets students **block out unavailable
  times**, and **prioritises weaker subjects**
- Smart reminders; schedule built around the student's life; **printable colour PDF** timetable
- Clicking any scheduled slot opens a dialogue **linking to specific topic resources for that
  session** — planner-to-content linkage
- Topic tick-off / progress tracking

**Content consumption**
- Library of **425,500+ learning resources**, tagged by exam board — class notes for
  catch-up, multiple learning styles (visual mindmaps, game-based quizzes)
- **Past-paper finder** covering all levels and subjects
- Search by subject, topic, resource type, or keywords, filtered by level, with the
  **highest teacher/user-rated resources surfaced first**

**Content creation (the "Create" suite)**
- Revision notes (with progressive condensing / **"chunking"**), flashcards, revision cards,
  mindmaps (node-and-connection editor), quizzes, crosswords, and **quizsearches**
  (crossword/wordsearch hybrids)
- **Cross-format auto-generation**: create one resource type and the platform attempts to
  generate the other formats from the same material
- A **"select for test"** mechanism — highlighted words/phrases become testable items

**Testing & self-assessment**
- A smart testing tool using **cloze deletion** (strips key words/phrases), **varies removed
  words on retries**, times the student, and **benchmarks performance against other students**
- **Any resource on the platform can be turned into a test**

**Community & social learning**
- Study groups for every subject
- An **"Ask" Q&A system**: subject-tagged questions, email notifications on answers,
  answers rated up/down by usefulness
- Discussion threads, peer messaging for constructive feedback on resources, and a report
  mechanism for inappropriate behaviour

### 2. Teacher role

- Uses the Study Planner to make students build timetables, with **deadline reminders that
  help teachers ensure homework is handed in on time** — i.e., **teachers set work, planner
  enforces it**
- Uses the library as in-class supplementary material and for teaching learning styles
- A free pack of **50 student activities** for exam preparation, plus the **Get Revising
  Book**, KS3/KS4/post-16 **Learning Kits**, and **EPQ teacher/student resources** —
  photocopiable and **licensed for school networks/VLEs**
- Teachers **create and rate resources, which drives search ranking**

### 3. School role

- **Whole-school deployment** (the site showcases a whole-school exam-prep rollout case study)
- Free **Connect Publications resource libraries** placed on school networks and VLEs, **in
  exchange for promoting the platform to students** — a **distribution-led B2B2C model**
- **Exam-date alignment with school calendars** (mock/trial exam integration, per school
  onboarding guides)

### 4. Parent role

- **Thin.** The main offering is a **home-schooling weekly timetable**: deadline tracking,
  teacher-set-work visibility, study built around family life, work broken into manageable
  chunks. There is **no genuine parent dashboard, progress reporting, or communication
  channel.** **This is a structural gap.** *(Contrast: StudYear's parent command centre is a
  first-class marketed persona — see `../product/studyear-product-spec.md §4.3`.)*

### 5. Private tutor role

- **Not a first-class persona at all.** Tutors piggyback on teacher features. **No tutor
  marketplace, no client management, no lesson-linked assignments.** **Second structural
  gap.** *(Contrast: StudYear's tutor marketplace + session pipeline + earnings is one of
  its four marketed command centres — `../product/studyear-product-spec.md §4.6`.)*

### 6. Admin / platform operations (inferred from visible mechanics)

- Content **taxonomy management** (subject × level × exam board tagging) · rating/ranking
  systems · community **moderation and abuse reporting** · UGC quality control ·
  user/account management · resource **licensing** (Connect Publications) ·
  notification/reminder infrastructure · **freemium/premium gating**

### The honest weaknesses (StudYear's opening)

- **Static one-shot planner** — doesn't replan when a student falls behind
- **UGC of wildly variable quality with no verification**
- **Cloze testing as the only "smart" assessment**
- **No knowledge tracing or adaptive difficulty**
- **No marking of written answers against mark schemes**
- **No predictive analytics**
- **Near-zero parent/tutor value**
- **No monetisable marketplace layer**

> **Verdict: it's a content warehouse with a calendar.** Every weakness above is a
> StudYear strength (closed-loop replanning, Examiner marking, knowledge tracing, predictive
> grades, parent/tutor command centres, marketplace) — this list is effectively StudYear's
> competitive sales sheet against the largest incumbent library in UK revision.

## Part 2 (second pass) — The AI-native reimagining: a Revision AI-OS

> Framed as built: a **multi-agent AI workforce operating on a shared learner state, with
> role-scoped surfaces for six personas.**

### The core ML substrate (what makes everything else possible)

| # | Engine | Specification |
|---|---|---|
| 1 | **Knowledge Tracing Engine** | Deep Knowledge Tracing (**DKT/SAINT-style transformer**) maintaining a per-student **mastery vector over every specification point of every exam-board syllabus**; every interaction (flashcard flip, quiz answer, marked essay, tutor session) updates it |
| 2 | **Spaced Repetition Scheduler** | **FSRS-style** forgetting-curve model **per item per student**, replacing dumb calendar slots with *"review this exact topic today because you're about to forget it"* |
| 3 | **Grade Prediction Model** | gradient-boosted/transformer ensemble mapping mastery vectors + behavioural signals + **historical exam-board grade boundaries** → live predicted grade per subject, with confidence intervals and **"grade delta if you do X" counterfactuals** |
| 4 | **RAG Knowledge Layer** | every exam-board specification, mark scheme, examiner report, and past paper indexed; all agents ground answers in the **actual assessment objectives (AO1/AO2/AO3)** rather than generic knowledge |
| 5 | **Safeguarding & Integrity Models** | classifiers for **grooming/bullying/self-harm signals** in community spaces (critical: minors), plus **AI-misuse detection** for submitted work |

### The agent workforce, per persona

**Student agents**

| Agent | Specification |
|---|---|
| **Planner Agent** | replaces the static timetable with **continuous replanning**: missed a session, bombed a quiz, exam date moved → **the plan rebalances overnight**, weighted by mastery gaps and forgetting curves, not naive subject hours |
| **Tutor Agent** | **Socratic, syllabus-grounded, exam-board-aware**; never dumps answers — **diagnoses the misconception from the knowledge-trace** and targets it |
| **Content Forge Agent** | modern cross-format generation: paste class notes or **photograph a textbook page** → flashcards, mindmap, quiz, cloze test, and a **60-second audio summary**, all auto-tagged to specification points |
| **Examiner Agent** | **the killer feature Get Revising cannot do**: marks written answers (incl. essays and 6-markers) against the **real mark scheme**, returns **AO-by-AO breakdown**, model improvements, and predicted marks — **this alone justifies premium pricing** |
| **Motivation Agent** | streaks, workload pacing, **burnout detection from behavioural signals**, wellbeing-aware nudges |

**Teacher agents**

| Agent | Specification |
|---|---|
| **Cockpit Agent** | class-level **heatmap of mastery per specification point**; *"your Year 11 set is collectively weak on electrolysis"* with **one-click intervention assignment** |
| **Assignment Agent** | sets **differentiated homework automatically**: each student gets the version matched to their gap profile; **auto-marked, results flow back to the heatmap** |
| **Reporting Agent** | drafts parent reports, predicted-grade commentary, and intervention lists **from live data** |

*(Further persona agents follow as extracted.)*
