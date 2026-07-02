# PART 4 · The Data Intelligence Layer

> Sibling docs: [`05-self-managing-platform.md`](./05-self-managing-platform.md) · [`06-security-compliance.md`](./06-security-compliance.md) · [`11-database-schema-erd.md`](./11-database-schema-erd.md) · [`../architecture/14`](../architecture/14).
>
> **Scope.** This document defines StudYear's central **Data Intelligence Layer** — the ten cooperating data systems that turn raw operational events into the intelligence that powers the five engines (Diagnostic, AI Study Roadmap, AI Learning Tools, Progress Intelligence, ACU Wallet) and the named agents (Sentinel.ai, Principia.ai, Pedagogue.ai, Mentor.ai, Concierge.ai, Matchmaker.ai). It also specifies the end-to-end flow from operational **MariaDB → CDC → event stream → lake/warehouse → feature store + vector store → agents**, the **student knowledge graph** that grounds Mentor.ai and predicted grades, and the RAG substrate behind AI Learning Tools.

---

## 1. Why a Dedicated Intelligence Layer

The operational MariaDB (composite-key tenant sharding, sub-domain per tenant — see [`11-database-schema-erd.md`](./11-database-schema-erd.md)) is optimised for **transactions**: enrolments, ACU ledger writes, roadmap state. It is the wrong place to run analytics, ML training, semantic search, or graph traversal. StudYear therefore separates **operational** (system of record) from **analytical/AI** (system of intelligence) planes, connected by a streaming spine. This is the proven pattern behind every data-driven product (the "modern data stack" + lakehouse).

**Design tenets.** (1) The operational DB is never queried directly by analytics or agents. (2) Everything flows through an event stream — one durable log, many consumers. (3) Minor data carries residency + consent tags end-to-end (see [`06-security-compliance.md`](./06-security-compliance.md)). (4) Every derived record is lineage-traceable back to source for GDPR erasure and auditability.

---

## 2. End-to-End Data Flow

```
 OPERATIONAL PLANE                STREAMING SPINE            ANALYTICAL / AI PLANE
 ─────────────────                ───────────────            ─────────────────────
 ┌───────────────┐   CDC (Debezium ┌───────────────┐        ┌────────────────────┐
 │  MariaDB      │──logical repl)─►│ Event Streaming│───┬──►│ Data Lake (raw/bronze
 │ (tenant-shard)│                 │ Kafka/Redpanda │   │    │ → silver → gold)    │
 └───────────────┘                 │  (topics per   │   │    └─────────┬──────────┘
 ┌───────────────┐   app events    │   domain)      │   │              ▼
 │ App / FastAPI │────────────────►│                │   │    ┌────────────────────┐
 │ LLM workers   │                 └───────┬────────┘   │    │ Data Warehouse /    │
 └───────────────┘                         │            │    │ Lakehouse (gold)    │
                                           │            │    └───────┬────────────┘
                       ┌───────────────────┼────────────┘            │
                       ▼                   ▼                          ▼
             ┌──────────────────┐ ┌──────────────────┐   ┌────────────────────────┐
             │ Real-Time        │ │ Feature Store     │   │ Knowledge Graph (Neo4j) │
             │ Analytics Engine │ │ (online+offline)  │   │ topic-mastery DAG       │
             └────────┬─────────┘ └────────┬──────────┘   └───────────┬────────────┘
                      │                    │                          │
                      │            ┌───────▼──────────┐               │
                      │            │ Vector DB (RAG)  │               │
                      │            │ pgvector/Pinecone│               │
                      │            └───────┬──────────┘               │
                      ▼                    ▼                          ▼
             ┌──────────────────────────────────────────────────────────────────┐
             │  ENGINES + AGENTS: Predictive · Behavioural · Recommendation ·     │
             │  Decision Intelligence  →  Sentinel/Principia/Pedagogue/Mentor/    │
             │  Concierge/Matchmaker  →  Model Router (residency-aware)           │
             └──────────────────────────────────────────────────────────────────┘
```

**Path in words.** MariaDB row changes are captured by **CDC (Debezium logical replication)** and emitted, alongside first-class application/AI events, onto **Kafka/Redpanda** topics. The stream fans out to: (a) the **Data Lake** (bronze/silver/gold medallion) for cheap durable history + ML training, (b) the **Real-Time Analytics Engine** for sub-second dashboards, (c) the **Feature Store** for online + offline ML features, and (d) transform jobs that build the **Vector DB** (embeddings for RAG) and the **Knowledge Graph** (topic-mastery DAG). Engines and agents read from the feature store, vector store, warehouse, and graph — never from MariaDB.

---

## 3. The Ten Systems

For each: **purpose · tech options (proven) · inputs · outputs · consumers**.

### 3.1 Data Lake
| | |
|---|---|
| **Purpose** | Durable, cheap, schema-on-read store of ALL raw + refined data; source of truth for ML training and replay. Medallion layering: bronze (raw) → silver (cleaned/conformed) → gold (curated, business-ready). |
| **Tech** | Databricks (Delta Lake) / Snowflake / BigQuery over object storage (S3/GCS); open table formats (Delta/Iceberg). |
| **Inputs** | CDC streams from MariaDB, app + AI events, third-party (Stripe, KYC) via connectors. |
| **Outputs** | Curated gold tables/features; training datasets; historical replay. |
| **Consumers** | Warehouse, Feature Store, Predictive & Behavioural engines, data science, RAG corpus builders. |

### 3.2 Data Warehouse / Lakehouse
| | |
|---|---|
| **Purpose** | Governed, high-performance SQL analytics on conformed (gold) data; powers reporting, cohort analysis, and BI for Schools/Admin. |
| **Tech** | Snowflake / Databricks SQL / BigQuery. |
| **Inputs** | Gold-layer lake tables; dimensional models (students, schools, roadmaps, ACU ledger facts). |
| **Outputs** | Metrics, cohorts, KPIs, aggregates; served to dashboards and Decision Intelligence. |
| **Consumers** | Real-Time Analytics Engine, Decision Intelligence Engine, Principia.ai, School/Admin reporting, Progress Intelligence engine. |

### 3.3 Vector Database
| | |
|---|---|
| **Purpose** | Semantic retrieval — stores embeddings of learning content, curriculum, past answers, and knowledge artefacts to **ground AI (RAG)** and power semantic search + similarity. |
| **Tech** | pgvector (Postgres) for lean start; Pinecone / Milvus / Weaviate at scale. |
| **Inputs** | Chunked + embedded curriculum, worked examples, student essays/answers, help content, mastery notes. |
| **Outputs** | Top-k relevant chunks with metadata + tenant/residency filters for retrieval-augmented generation. |
| **Consumers** | AI Learning Tools, Mentor.ai, Pedagogue.ai, Concierge.ai, Diagnostic explanations, Model Router prompts. |

### 3.4 Knowledge Graph
| | |
|---|---|
| **Purpose** | Model the **structure of knowledge and relationships** — curriculum topic dependencies, per-student topic mastery, links between students/schools/tutors/content. The **student knowledge graph is a topic-mastery DAG**. |
| **Tech** | Neo4j (property graph) / Amazon Neptune. |
| **Inputs** | Curriculum ontology (topic → prerequisite topic edges), diagnostic results, learning-tool interactions, assessment outcomes. |
| **Outputs** | Mastery state per topic, prerequisite gaps, learning-path ordering, "next best topic," predicted-grade inputs. |
| **Consumers** | Mentor.ai (personal path), AI Study Roadmap engine, Predictive engine (predicted grades), Matchmaker.ai (tutor↔need). |

### 3.5 Event Streaming Platform
| | |
|---|---|
| **Purpose** | The durable, ordered backbone — one immutable log, many independent consumers; decouples producers from consumers and enables real-time + replay. |
| **Tech** | Apache Kafka / Redpanda (Kafka-compatible, lower ops); Debezium for CDC. |
| **Inputs** | MariaDB CDC, application events (roadmap progress, ACU spend, logins), AI events (prompt/response, tool calls), security events. |
| **Outputs** | Domain topics consumed by lake, analytics, feature store, security Command Centre. |
| **Consumers** | Every downstream system; the security Command Centre in [`06-security-compliance.md`](./06-security-compliance.md) is a first-class consumer. |

### 3.6 Real-Time Analytics Engine
| | |
|---|---|
| **Purpose** | Sub-second aggregation over the live stream for operational dashboards, live ACU spend, active-learner counts, and streaming anomaly features. |
| **Tech** | Apache Flink / ksqlDB / Materialize / Apache Pinot / ClickHouse; Redis for hot serving. |
| **Inputs** | Kafka/Redpanda topics. |
| **Outputs** | Live metrics, windowed aggregates, streaming features. |
| **Consumers** | Admin/School live dashboards, Sentinel.ai (real-time fraud/security), Decision Intelligence, ACU monitoring. |

### 3.7 Predictive Intelligence Engine
| | |
|---|---|
| **Purpose** | Forecasting — **predicted grades**, at-risk-of-falling-behind, churn propensity, ACU depletion forecasting. |
| **Tech** | Databricks ML / Vertex AI / SageMaker patterns; gradient-boosted models + sequence models; MLflow for tracking. |
| **Inputs** | Feature store (mastery, engagement, historical outcomes), knowledge-graph mastery state, warehouse aggregates. |
| **Outputs** | Predicted grade per subject/topic, risk scores, forecast horizons with confidence. |
| **Consumers** | Progress Intelligence engine, Mentor.ai, Principia.ai (strategy), Sentinel.ai (churn), Parent/School reporting. |

### 3.8 Behavioural Intelligence Engine
| | |
|---|---|
| **Purpose** | Understand **how** users behave — learning-session patterns, engagement rhythms, drop-off signals, and (for security) UEBA anomaly baselines. |
| **Tech** | Feature pipelines + clustering/sequence models; feeds both learning and security use-cases. |
| **Inputs** | Event stream (sessions, tool usage, timing), feature store. |
| **Outputs** | Behaviour segments, engagement scores, anomaly baselines, optimal-study-time signals. |
| **Consumers** | Recommendation engine, Mentor.ai, Concierge.ai (nudges), Sentinel.ai (security UEBA — see [`06-security-compliance.md`](./06-security-compliance.md)). |

### 3.9 Recommendation Engine
| | |
|---|---|
| **Purpose** | Suggest the right next action/content/resource/tutor — "what should this learner do next." |
| **Tech** | Hybrid collaborative-filtering + content-based + knowledge-graph-aware ranking (two-tower / embeddings retrieval + reranker). |
| **Inputs** | Knowledge-graph mastery, behavioural signals, vector similarity, warehouse cohort data. |
| **Outputs** | Ranked recommendations (next topic, resource, practice, tutor match). |
| **Consumers** | AI Study Roadmap engine, Mentor.ai, Matchmaker.ai (tutor recommendations), AI Learning Tools. |

### 3.10 Decision Intelligence Engine
| | |
|---|---|
| **Purpose** | Turn predictions + recommendations into **actions and policies** — orchestrates trade-offs (e.g., ACU budget vs. learning value), routes decisions, and closes the Assess→Plan→Learn→Improve loop. |
| **Tech** | Rules + optimisation + ML ensembles; policy engine; scenario simulation. |
| **Inputs** | Outputs of Predictive, Behavioural, Recommendation engines; warehouse; business rules. |
| **Outputs** | Concrete decisions/policies (roadmap adjustments, interventions, ACU-aware pacing, escalations). |
| **Consumers** | All five StudYear engines; Principia.ai (platform strategy), Pedagogue.ai (pedagogy decisions), self-managing platform ([`05-self-managing-platform.md`](./05-self-managing-platform.md)). |

---

## 4. Engine × System Consumption Matrix

| System ↓ / Consumer → | Diagnostic | AI Roadmap | AI Learning Tools | Progress Intel | ACU Wallet | Sentinel.ai | Mentor.ai | Principia.ai | Pedagogue.ai | Matchmaker.ai |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Data Lake | ● | ● | | ● | ● | ● | | ● | ● | ● |
| Warehouse | | ● | | ● | ● | | ● | ● | ● | |
| Vector DB (RAG) | ● | | ● | | | | ● | | ● | ● |
| Knowledge Graph | ● | ● | ● | ● | | | ● | | ● | ● |
| Event Stream | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Real-Time Analytics | | | | ● | ● | ● | | ● | | |
| Predictive | | ● | | ● | ● | ● | ● | ● | | |
| Behavioural | | ● | ● | ● | | ● | ● | | ● | ● |
| Recommendation | | ● | ● | | | | ● | | | ● |
| Decision Intelligence | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |

---

## 5. The Student Knowledge Graph — Topic-Mastery DAG

The knowledge graph is StudYear's pedagogical core. Two coupled layers:

1. **Curriculum ontology (shared).** Topics as nodes; directed edges `PREREQUISITE_OF` form a DAG (e.g., *fractions → ratios → algebraic proportions*). Aligned to exam-board specs.
2. **Per-student mastery overlay.** For each student, every topic node carries a **mastery score** (0–1) with confidence and recency, updated by diagnostics, learning-tool interactions, and assessments.

**How Mentor.ai uses it.** Mentor.ai traverses the DAG to find the student's **mastery frontier** — topics whose prerequisites are mastered but which are not yet mastered — and orders them into a personalised path. It surfaces **prerequisite gaps** (a weak downstream topic traced to an un-mastered upstream node), enabling targeted remediation rather than re-teaching everything. Recommendations from §3.9 are re-ranked against the frontier so the roadmap is always both *ready-to-learn* and *high-value*.

**How predicted grades work.** The Predictive engine (§3.7) consumes the mastery overlay — coverage and depth of mastery across the exam-relevant topic set, weighted by topic importance and trajectory (rate of mastery gain) — to output a **predicted grade** per subject with a confidence band. Because the input is the graph, predictions are **explainable**: "predicted B; limited by low mastery in *X* and *Y*, both prerequisites for high-weight topic *Z*." These feed Progress Intelligence and Parent/School reporting.

```
   (mastered)      (frontier: learn next)     (blocked: needs prereq)
   Fractions ──►  Ratios ──►  Proportions ──►  Similar Triangles
     0.92          0.40          0.05             0.00
                    ▲
             Mentor.ai targets here; predicted-grade model reads the whole overlay
```

---

## 6. RAG — Grounding the AI Learning Tools

AI Learning Tools, Mentor.ai, Pedagogue.ai, and Concierge.ai are **retrieval-augmented** — they do not rely on the LLM's parametric memory for curriculum facts. Flow:

1. **Ingest & chunk** curriculum, worked examples, mark schemes, and approved help content; **embed** into the Vector DB (§3.3) with metadata (subject, topic node, exam board, tenant, residency tag, consent class).
2. **Retrieve** at query time: the user/agent query is embedded; top-k relevant chunks are fetched, filtered by tenant + residency + the student's current topic context (from the knowledge graph).
3. **Ground** the LLM prompt with retrieved context via the **Model Router**, which selects an approved provider/region — **minor data is routed only to residency-approved providers** (Anthropic/Gemini/OpenAI per policy; see [`06-security-compliance.md`](./06-security-compliance.md)).
4. **Cite & constrain.** Responses are grounded in retrieved sources, reducing hallucination; outputs are filtered before return.

This gives **curriculum-accurate, tenant-safe, minor-safe** AI generation, and lets StudYear update knowledge by re-indexing content rather than retraining models.

---

## 7. Feature Store

The feature store is the contract between raw data and ML, serving **consistent features** to both training (offline) and inference (online), eliminating train/serve skew.

| Aspect | Detail |
|--------|--------|
| **Offline** | Historical features from the lake/warehouse for model training (Feast/Databricks/Vertex pattern). |
| **Online** | Low-latency features (Redis-backed) for real-time inference — predicted grades, fraud scoring, recommendations. |
| **Example features** | Topic-mastery vector, 7-day engagement, ACU spend velocity, session-timing profile, diagnostic recency. |
| **Consumers** | Predictive, Behavioural, Recommendation, Decision Intelligence engines; Sentinel.ai. |

---

## 8. Lineage & Governance

Because StudYear processes **minor data under GDPR**, the intelligence layer is governed end-to-end (see [`06-security-compliance.md`](./06-security-compliance.md)).

| Concern | Implementation |
|---------|----------------|
| **Lineage** | Column- and dataset-level lineage from MariaDB source → CDC topic → lake layer → warehouse/feature/vector/graph → engine output (OpenLineage/Unity Catalog/data-catalog pattern). Every derived record traces to source. |
| **Cataloguing** | Central data catalog with ownership, PII classification, residency + consent tags on every dataset/column. |
| **GDPR erasure** | Erasure requests fan out across lake, warehouse, vector store, graph, feature store, and backups (crypto-shredding where hard-delete is impractical) — lineage guarantees completeness and proof (see [`06-security-compliance.md`](./06-security-compliance.md) §8.1). |
| **Data quality** | Contract tests + expectations (Great Expectations pattern) at bronze→silver→gold boundaries; bad data quarantined, not propagated. |
| **Residency routing** | Minor data and its embeddings/features are region-pinned; the Model Router enforces provider/region at inference; non-approved regions cannot decrypt or process minor PII. |
| **Access control** | Analytical plane inherits RBAC + tenant scoping; row/column-level security in the warehouse; agents hold scoped, audited service accounts. |
| **Retention** | Purpose-bound retention schedules with auto-expiry; training corpora exclude data lacking a valid consent/residency tag. |
| **Auditability** | Every model input/output and agent decision is logged for explainability, bias review, and the DPIA record. |

> **Bottom line.** A streaming spine (CDC → Kafka/Redpanda) feeds a lakehouse, feature store, vector store, and a student **topic-mastery knowledge graph**; ten cooperating systems turn events into predicted grades, personalised paths, and RAG-grounded AI — all lineage-tracked, residency-pinned, and consent-tagged so the intelligence layer is as compliant for minors as it is powerful.
