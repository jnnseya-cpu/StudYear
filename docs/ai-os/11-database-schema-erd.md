# PART 4 · Database Schema & ERD

> **Scope:** Developer-ready relational schema for **StudYear** on **MariaDB (Galera, Hostinger)**, sharded by `tenant_id`, sub-domain per tenant. Every tenant-scoped table uses a **composite primary key `(tenant_id, id)`** so rows cluster physically per tenant (partition pruning, cheap GDPR export/erase). This document is the source of truth for tables, keys, indexes, tenant-scoping, permissions, and audit requirements.
>
> **Cross-references:** architecture in `docs/ai-os/10-production-architecture.md`; APIs in `docs/ai-os/12-api-specification.md`; security/GDPR in `docs/ai-os/06-security-compliance.md`; BitriPay in `docs/ai-os/08-bitripay-gateway.md`; canonical model `docs/architecture/09`; deployment `docs/architecture/15`.

---

## 1. Conventions

| Convention | Rule |
|------------|------|
| Tenant scoping | Every business table carries `tenant_id BIGINT UNSIGNED NOT NULL` as the **first** PK column. All FKs are `(tenant_id, ...)` composite so relationships never cross tenants. |
| Primary keys | `PRIMARY KEY (tenant_id, id)`; `id` is a per-tenant monotonic `BIGINT UNSIGNED` (Snowflake-style or per-tenant sequence). Public IDs exposed via opaque ULIDs (`public_id CHAR(26)`). |
| Global control DB | `tenant_shard_map`, `tenants`, `plans` live in a small global control database (not sharded). Everything else lives on the tenant's shard. |
| Timestamps | `created_at`, `updated_at` `DATETIME(3)` UTC; soft delete via `deleted_at DATETIME(3) NULL` where retention requires it. |
| Money | Integer minor units (`amount_cents BIGINT`, `currency CHAR(3)`). ACU stored as integer `acu` units. Never floats for money/ACU. |
| Enums | Stored as `VARCHAR` + `CHECK`/lookup table (avoids native ENUM migration pain). |
| Audit | Any INSERT/UPDATE/DELETE on tables marked **AUDIT=Y** writes an `audit_events` row (see §21). |
| Engine | InnoDB, `utf8mb4`, `ROW_FORMAT=DYNAMIC`. Hot activity tables range-partitioned by month. |

---

## 2. ASCII ERD Overview

```
 GLOBAL CONTROL DB
 ┌────────────┐   ┌────────────────┐   ┌─────────┐
 │  tenants   │──<│ tenant_shard_map│   │  plans  │
 └────────────┘   └────────────────┘   └────┬────┘
        │                                    │
 ════════════════════════ PER-TENANT SHARD ══╪══════════════════════════════════
        │                                    │
 ┌──────▼───────┐  ┌──────────┐  ┌──────────▼──────┐   ┌──────────────┐
 │organisations │  │  roles   │──<│  permissions   │   │ subscriptions│
 └──────┬───────┘  └────┬─────┘   └────────────────┘   └──────┬───────┘
        │               │                                     │
 ┌──────▼───────┐  ┌────▼─────────┐                    ┌──────▼───────┐  ┌──────────┐
 │   schools    │  │    users     │──<│ user_roles │   │   invoices   │──<│ payments │
 └──┬────────┬──┘  └──┬───┬───┬───┘                    └──────────────┘  └──────────┘
    │        │        │   │   │                                (stripe / bitripay)
    │  ┌─────▼──┐ ┌───▼┐ ┌▼──────┐ ┌────────┐
    │  │teachers│ │tutor│ │parents│ │students│───────────────┐
    │  └───┬────┘ └──┬─┘ └───┬───┘ └───┬────┘                │
    │      │         │       │         │                     │
 ┌──▼──────▼──┐      │  ┌────▼─────────▼──┐          ┌────────▼────────┐
 │  classes   │──<│  │  │ guardianship_links│         │ student_profile │
 │ (cohorts)  │ enrol│  └──────────────────┘         │ (year/board/    │
 └─────┬──────┘   ment│                              │  target grades) │
       │              │                              └────────┬────────┘
       │        ┌─────▼──────────┐                            │
       │        │ tutor_offerings│──<│ bookings │──<│ sessions │
       │        └────────────────┘                            │
       │                                                      │
 ┌─────▼──────┐  ┌─────────────┐  ┌────────────┐  ┌──────────▼────┐  ┌──────────┐
 │ assignments│──<│ submissions │──<│  grades   │  │  diagnostics  │  │ subjects │
 └────────────┘  └─────────────┘  └────────────┘  └───────┬───────┘  └────┬─────┘
                                                          │               │
 ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────▼──────┐  ┌─────▼────┐
 │ study_plans│──<│ plan_items │  │learning_res. │  │   mastery   │>─│  topics  │
 └────────────┘  └────────────┘  └──────────────┘  │(student×topic)│ └──────────┘
                                                    └─────────────┘
 ┌─────────────┐  ┌───────────────┐  ┌───────────┐  ┌──────────────┐
 │ acu_wallets │──<│acu_transactions│  │ acu_packs │  │content_library│
 └─────────────┘  └───────────────┘  └───────────┘  └──────────────┘
 ┌─────────────┐  ┌───────────────┐  ┌───────────┐  ┌──────────────┐  ┌────────────┐
 │notifications│  │ msg_threads   │──<│ messages  │  │ audit_events │  │gdpr_requests│
 └─────────────┘  └───────────────┘  └───────────┘  └──────────────┘  └────────────┘
                  ┌───────────────┐
                  │ ai_usage_logs │   ( >── = one-to-many ;  ── = FK link )
                  └───────────────┘
```

---

## 3. Global Control DB

### `tenants`
| Field | Type | Notes |
|-------|------|-------|
| id | BIGINT UNSIGNED PK | tenant_id used everywhere downstream |
| public_id | CHAR(26) UNIQUE | ULID |
| name | VARCHAR(160) | |
| subdomain | VARCHAR(63) UNIQUE | `{subdomain}.studyear.app` |
| tenant_type | VARCHAR(20) | `school` \| `tutor` \| `family` \| `platform` |
| residency_region | VARCHAR(12) | `eu` \| `uk` \| `us` — drives shard + Model Router |
| status | VARCHAR(16) | `active`\|`suspended`\|`provisioning` |
| created_at / updated_at | DATETIME(3) | |

Indexes: `UNIQUE(subdomain)`, `INDEX(status)`. **AUDIT=Y.**

### `tenant_shard_map`
| Field | Type | Notes |
|-------|------|-------|
| tenant_id | BIGINT UNSIGNED PK | FK→tenants.id |
| shard_id | INT | physical shard |
| dsn_ref | VARCHAR(120) | secret ref, not raw creds |
| residency_region | VARCHAR(12) | must match tenants |
| INDEX | (shard_id) | |

### `plans` (billing catalogue — global)
| Field | Type | Notes |
|-------|------|-------|
| id | BIGINT PK | |
| code | VARCHAR(40) UNIQUE | `school_annual`, `tutor_pro`, `family_basic` |
| name | VARCHAR(120) | |
| price_cents | BIGINT | |
| currency | CHAR(3) | |
| interval | VARCHAR(12) | `month`\|`year` |
| included_acu | BIGINT | monthly ACU grant |
| stripe_price_id | VARCHAR(64) | |
| active | TINYINT(1) | |

---

## 4. Identity, Roles & Permissions (per-tenant)

### `users`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id | BIGINT PK-1 | |
| id | BIGINT PK-2 | |
| public_id | CHAR(26) | ULID, exposed in API |
| email | VARCHAR(254) | |
| email_verified_at | DATETIME(3) NULL | |
| phone | VARCHAR(32) NULL | never for minors |
| password_hash | VARBINARY(255) NULL | argon2id; NULL for SSO-only |
| user_type | VARCHAR(20) | `student`\|`parent`\|`school`\|`teacher`\|`tutor`\|`platform_admin` |
| is_minor | TINYINT(1) | gates consent + channels |
| mfa_enabled | TINYINT(1) | |
| status | VARCHAR(16) | `active`\|`invited`\|`disabled` |
| last_login_at | DATETIME(3) NULL | |
| created_at / updated_at / deleted_at | DATETIME(3) | |

Indexes: `UNIQUE(tenant_id, email)`, `UNIQUE(tenant_id, public_id)`, `INDEX(tenant_id, user_type, status)`.

### `roles`
| tenant_id, id (PK) | code VARCHAR(40) | name | is_system TINYINT | Notes: `UNIQUE(tenant_id, code)`. Seeded system roles map to the six platform roles. |

### `permissions`
| tenant_id, id (PK) | key VARCHAR(80) | resource VARCHAR(40) | action VARCHAR(20) | Example keys: `student.grade:write`, `acu.wallet:read`, `booking:manage`. `UNIQUE(tenant_id, key)`. |

### `role_permissions` (join)
`PRIMARY KEY (tenant_id, role_id, permission_id)`, FKs `(tenant_id, role_id)`→roles, `(tenant_id, permission_id)`→permissions.

### `user_roles` (join)  **AUDIT=Y**
`PRIMARY KEY (tenant_id, user_id, role_id)`; optional `scope_type`/`scope_id` for relationship-scoped grants (e.g. teacher→class, parent→student). `INDEX(tenant_id, user_id)`.

---

## 5. Organisations, Schools & Educators

### `organisations`
| tenant_id, id (PK) | name | org_type VARCHAR(20) `school`\|`tutor_biz`\|`family` | billing_owner_user_id | created_at |

### `schools`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| org_id | BIGINT | FK→organisations |
| name | VARCHAR(160) | |
| urn | VARCHAR(20) NULL | UK school ref |
| exam_boards | JSON | supported boards |
| acu_pool_wallet_id | BIGINT NULL | shared ACU pool (→acu_wallets) |
| created_at / updated_at | | |

### `teachers`
| tenant_id, id (PK) | user_id FK→users | school_id FK→schools | subjects JSON | status | `INDEX(tenant_id, school_id)` |

### `tutors`
| tenant_id, id (PK) | user_id FK→users | display_name | bio TEXT | subjects JSON | verified_at DATETIME NULL | rating_avg DECIMAL(3,2) | payout_account_ref VARCHAR(64) (Stripe Connect) | `INDEX(tenant_id, verified_at)` |

### `parents`
| tenant_id, id (PK) | user_id FK→users | created_at | — thin profile; link via guardianship_links |

### `guardianship_links`  **AUDIT=Y** (parent ↔ student)
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| parent_id | BIGINT | FK→parents |
| student_id | BIGINT | FK→students |
| relationship | VARCHAR(20) | `mother`\|`father`\|`guardian` |
| consent_status | VARCHAR(16) | `granted`\|`pending`\|`revoked` |
| consent_at | DATETIME(3) NULL | |
| is_primary | TINYINT(1) | |

Indexes: `UNIQUE(tenant_id, parent_id, student_id)`, `INDEX(tenant_id, student_id)`.

---

## 6. Students & Academic Profile

### `students`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| user_id | BIGINT | FK→users (nullable if managed minor) |
| school_id | BIGINT NULL | FK→schools |
| public_id | CHAR(26) | |
| first_name / last_name | VARCHAR(80) | field-level encrypted for minors |
| date_of_birth | DATE | drives is_minor |
| year_group | VARCHAR(12) | e.g. `Y11`, `Y13` |
| exam_board | VARCHAR(40) | e.g. `AQA`, `Edexcel` |
| status | VARCHAR(16) | |
| created_at / updated_at / deleted_at | | |

Indexes: `UNIQUE(tenant_id, public_id)`, `INDEX(tenant_id, school_id, year_group)`.

### `student_subjects` (academic profile per subject — target/current/confidence)
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| student_id | BIGINT | FK→students |
| subject_id | BIGINT | FK→subjects |
| exam_board | VARCHAR(40) | may override student default |
| target_grade | VARCHAR(6) | e.g. `A*`, `7` |
| current_grade | VARCHAR(6) | latest assessed |
| confidence | TINYINT | 0–100 self-reported signal |
| priority | TINYINT | derived by Principia |
| updated_at | DATETIME(3) | |

Indexes: `UNIQUE(tenant_id, student_id, subject_id)`, `INDEX(tenant_id, subject_id)`.

---

## 7. Subjects / Topics Taxonomy

### `subjects`
| tenant_id, id (PK) | code VARCHAR(20) | name | key_stage VARCHAR(8) | exam_boards JSON | `UNIQUE(tenant_id, code)` |

### `topics`
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| subject_id | BIGINT | FK→subjects |
| parent_topic_id | BIGINT NULL | self-ref → sub-topic tree |
| code | VARCHAR(40) | |
| name | VARCHAR(160) | |
| difficulty | TINYINT | 1–5 |
| `INDEX(tenant_id, subject_id, parent_topic_id)` | | topic tree traversal |

---

## 8. Classes / Cohorts & Enrolment

### `classes`  (cohorts)
| tenant_id, id (PK) | school_id FK | teacher_id FK→teachers | name | subject_id FK | year_group | academic_year VARCHAR(9) | `INDEX(tenant_id, teacher_id)`, `INDEX(tenant_id, school_id, academic_year)` |

### `class_enrolments`
`PRIMARY KEY (tenant_id, class_id, student_id)`; `enrolled_at`, `status`. `INDEX(tenant_id, student_id)`.

---

## 9. Diagnostics Engine

### `diagnostics`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| student_id | BIGINT | FK→students |
| subject_id | BIGINT | FK→subjects |
| status | VARCHAR(16) | `started`\|`completed`\|`scored` |
| score_overall | DECIMAL(5,2) NULL | |
| result_json | JSON | per-topic breakdown from Pedagogue |
| acu_txn_id | BIGINT NULL | ACU spent scoring |
| started_at / completed_at | DATETIME(3) | |

Indexes: `INDEX(tenant_id, student_id, subject_id)`, `INDEX(tenant_id, status, completed_at)`.

Emits `diagnostic.completed` → triggers Principia plan rebuild + mastery update.

---

## 10. Study Plans

### `study_plans`  **AUDIT=Y**
| tenant_id, id (PK) | student_id FK | subject_id FK NULL | title | strategy_json JSON | generated_by VARCHAR(20) `principia` | source_diagnostic_id BIGINT NULL | status VARCHAR(16) | created_at / updated_at | `INDEX(tenant_id, student_id, status)` |

### `study_plan_items`
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| plan_id | BIGINT | FK→study_plans |
| topic_id | BIGINT | FK→topics |
| resource_id | BIGINT NULL | FK→learning_resources |
| scheduled_for | DATE | |
| priority | TINYINT | |
| status | VARCHAR(16) | `todo`\|`done`\|`skipped` |
| `INDEX(tenant_id, plan_id, scheduled_for)` | | schedule view |

---

## 11. Learning Resources & Content Library

### `learning_resources`  (AI-generated + curated)
| tenant_id, id (PK) | subject_id FK | topic_id FK | type VARCHAR(20) `flashcards`\|`quiz`\|`worksheet`\|`explainer` | title | body_ref VARCHAR(255) (S3/blob) | generated_by VARCHAR(20) `pedagogue`\|`curated` | acu_txn_id BIGINT NULL | vector_ref VARCHAR(64) | created_at | `INDEX(tenant_id, topic_id, type)` |

### `content_library`  (shared/curated corpus, RAG-indexed)
| tenant_id, id (PK) | subject_id FK | topic_id FK NULL | title | doc_type VARCHAR(20) | storage_ref VARCHAR(255) | vector_ref VARCHAR(64) | visibility VARCHAR(16) `tenant`\|`shared` | created_at | `INDEX(tenant_id, subject_id, doc_type)` |

---

## 12. Assignments, Submissions & Grades

### `assignments`  **AUDIT=Y**
| tenant_id, id (PK) | class_id FK NULL | teacher_id FK NULL | subject_id FK | topic_id FK NULL | title | instructions TEXT | due_at DATETIME(3) | max_score DECIMAL(6,2) | created_at | `INDEX(tenant_id, class_id, due_at)` |

### `submissions`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| assignment_id | BIGINT | FK→assignments |
| student_id | BIGINT | FK→students |
| content_ref | VARCHAR(255) | blob |
| status | VARCHAR(16) | `submitted`\|`reviewed`\|`returned` |
| ai_review_json | JSON NULL | Assignment Review output |
| acu_txn_id | BIGINT NULL | |
| submitted_at | DATETIME(3) | |
| `UNIQUE(tenant_id, assignment_id, student_id)`, `INDEX(tenant_id, student_id, status)` | | |

### `grades`  **AUDIT=Y** (append-only history — never UPDATE)
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| student_id | BIGINT | FK→students |
| subject_id | BIGINT | FK→subjects |
| topic_id | BIGINT NULL | FK→topics |
| submission_id | BIGINT NULL | FK→submissions |
| assessment_type | VARCHAR(20) | `assignment`\|`diagnostic`\|`mock`\|`teacher` |
| score | DECIMAL(6,2) | |
| grade_label | VARCHAR(6) | mapped grade |
| graded_by_user_id | BIGINT NULL | teacher/tutor or NULL for AI |
| graded_at | DATETIME(3) | |

Indexes (**hot path**): `INDEX(tenant_id, student_id, graded_at)`, `INDEX(tenant_id, subject_id, graded_at)`. Range-partitioned by month.

---

## 13. Mastery (student × topic)

### `mastery`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id | PK-1 | |
| student_id | PK-2 | FK→students |
| topic_id | PK-3 | FK→topics — composite PK gives one authoritative row per student×topic |
| mastery_score | DECIMAL(5,2) | 0–100, updated from every interaction |
| confidence | TINYINT | learner signal |
| last_source | VARCHAR(20) | `diagnostic`\|`tutor`\|`assignment` |
| decay_at | DATETIME(3) NULL | spaced-repetition decay marker |
| updated_at | DATETIME(3) | |

Indexes: `INDEX(tenant_id, student_id, mastery_score)`, `INDEX(tenant_id, topic_id)`. Reconciled transactionally with vector memory write-back (see `10-…§8`).

---

## 14. Tutor Marketplace

### `tutor_offerings`
| tenant_id, id (PK) | tutor_id FK→tutors | subject_id FK | title | level VARCHAR(20) | rate_cents BIGINT | currency CHAR(3) | mode VARCHAR(12) `online`\|`in_person` | active TINYINT | `INDEX(tenant_id, subject_id, active)` |

### `bookings`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| offering_id | BIGINT | FK→tutor_offerings |
| student_id | BIGINT | FK→students |
| tutor_id | BIGINT | FK→tutors |
| scheduled_start / scheduled_end | DATETIME(3) | |
| status | VARCHAR(16) | `pending`\|`confirmed`\|`cancelled`\|`completed` |
| payment_id | BIGINT NULL | FK→payments |
| created_at | | |

Indexes: `INDEX(tenant_id, tutor_id, scheduled_start)`, `INDEX(tenant_id, student_id, status)`. Emits `booking.confirmed`.

### `sessions`  **AUDIT=Y**
| tenant_id, id (PK) | booking_id FK→bookings | started_at / ended_at DATETIME(3) | notes_ref VARCHAR(255) | ai_summary_json JSON NULL (Mentor) | acu_txn_id BIGINT NULL | status VARCHAR(16) | `INDEX(tenant_id, booking_id)` | Emits `session.completed`. |

---

## 15. ACU Wallet & Billing

### `acu_wallets`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| owner_type | VARCHAR(16) | `student`\|`school_pool`\|`tutor` |
| owner_id | BIGINT | polymorphic within tenant |
| balance_acu | BIGINT | current balance; **hard stop at 0** |
| reserved_acu | BIGINT | soft-holds for in-flight AI jobs |
| low_threshold | BIGINT | triggers low-balance notification |
| updated_at | DATETIME(3) | |

Indexes: `UNIQUE(tenant_id, owner_type, owner_id)`. Balance mutated only via `acu_transactions` (never edited directly).

### `acu_transactions`  **AUDIT=Y** (append-only ledger)
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| wallet_id | BIGINT | FK→acu_wallets |
| direction | VARCHAR(8) | `credit`\|`debit` |
| amount_acu | BIGINT | |
| reason | VARCHAR(40) | `ai_tutor`\|`diagnostic`\|`resource_gen`\|`pack_purchase`\|`refund` |
| ref_type / ref_id | VARCHAR(20)/BIGINT | links to session/diagnostic/pack |
| idempotency_key | VARCHAR(80) | dedupe on retry/webhook |
| balance_after | BIGINT | running balance snapshot |
| created_at | DATETIME(3) | |

Indexes (**hot path**): `INDEX(tenant_id, wallet_id, created_at)`, `UNIQUE(tenant_id, idempotency_key)`. Month-partitioned. Powers ACU burn analytics.

### `acu_packs`  (catalogue of purchasable credit bundles)
| tenant_id, id (PK) | code VARCHAR(40) | name | acu_amount BIGINT | price_cents BIGINT | currency CHAR(3) | stripe_price_id VARCHAR(64) | active TINYINT | `UNIQUE(tenant_id, code)` |

### `subscriptions`  **AUDIT=Y**
| tenant_id, id (PK) | plan_code VARCHAR(40) (→global plans) | owner_user_id FK→users | provider VARCHAR(12) `stripe`\|`bitripay` | provider_ref VARCHAR(64) | status VARCHAR(16) `active`\|`past_due`\|`cancelled` | current_period_end DATETIME(3) | monthly_acu_grant BIGINT | `INDEX(tenant_id, status)` |

### `invoices`  **AUDIT=Y**
| tenant_id, id (PK) | subscription_id FK NULL | provider VARCHAR(12) | provider_invoice_id VARCHAR(64) | amount_cents BIGINT | currency CHAR(3) | status VARCHAR(16) `open`\|`paid`\|`void` | issued_at / paid_at DATETIME(3) | `UNIQUE(tenant_id, provider, provider_invoice_id)` |

### `payments`  **AUDIT=Y** (Stripe live + BitriPay planned)
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| invoice_id | BIGINT NULL | FK→invoices |
| provider | VARCHAR(12) | `stripe`\|`bitripay` |
| provider_payment_id | VARCHAR(80) | Stripe `pi_…` / BitriPay ref |
| purpose | VARCHAR(20) | `subscription`\|`acu_pack`\|`booking` |
| amount_cents | BIGINT | |
| currency | CHAR(3) | |
| status | VARCHAR(16) | `pending`\|`succeeded`\|`failed`\|`refunded` |
| idempotency_key | VARCHAR(80) | |
| raw_event_ref | VARCHAR(120) | webhook payload store |
| created_at | DATETIME(3) | |

Indexes (**hot path**): `UNIQUE(tenant_id, provider, provider_payment_id)`, `UNIQUE(tenant_id, idempotency_key)`, `INDEX(tenant_id, status, created_at)`. A `succeeded` ACU-pack payment yields exactly one credit `acu_transactions` row (idempotent). See `docs/ai-os/08-bitripay-gateway.md`.

---

## 16. Notifications & Messaging

### `notifications`  **AUDIT=Y**
| tenant_id, id (PK) | user_id FK→users | channel VARCHAR(12) `in_app`\|`email`\|`sms`\|`push` | template_code VARCHAR(60) | payload_json JSON | status VARCHAR(16) `queued`\|`sent`\|`read`\|`failed` | created_at / sent_at DATETIME(3) | `INDEX(tenant_id, user_id, status, created_at)` — hot path. No SMS to minors. |

### `message_threads`
| tenant_id, id (PK) | subject VARCHAR(160) | context_type VARCHAR(20) `class`\|`booking`\|`support` | context_id BIGINT NULL | created_at | `INDEX(tenant_id, context_type, context_id)` |

### `thread_participants`
`PRIMARY KEY (tenant_id, thread_id, user_id)`; `role VARCHAR(16)`. `INDEX(tenant_id, user_id)`.

### `messages`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| thread_id | BIGINT | FK→message_threads |
| sender_user_id | BIGINT | FK→users |
| body | TEXT | encrypted at rest |
| read_by_json | JSON | |
| created_at | DATETIME(3) | |

Indexes (**hot path**): `INDEX(tenant_id, thread_id, created_at)`. Month-partitioned.

---

## 17. AI Usage Logs

### `ai_usage_logs`  **AUDIT=Y** (cost, tokens, provider, residency)
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| user_id | BIGINT NULL | initiating actor |
| agent | VARCHAR(20) | `mentor`\|`principia`\|`pedagogue`\|`sentinel`\|`concierge`\|`matchmaker` |
| capability | VARCHAR(30) | `chat.tutor`, `reasoning.plan`, … |
| provider | VARCHAR(16) | `claude`\|`gemini`\|`openai` |
| model | VARCHAR(40) | resolved model id |
| residency_region | VARCHAR(12) | enforced region |
| prompt_hash | CHAR(64) | SHA-256; never raw minor PII |
| tokens_in / tokens_out | INT | |
| cost_acu | BIGINT | debited ACU |
| cache_hit | TINYINT(1) | RAG/result cache |
| latency_ms | INT | |
| status | VARCHAR(16) | `ok`\|`provider_error`\|`residency_blocked`\|`content_flagged` |
| acu_txn_id | BIGINT NULL | FK→acu_transactions |
| created_at | DATETIME(3) | |

Indexes: `INDEX(tenant_id, agent, created_at)`, `INDEX(tenant_id, provider, status)`. Month-partitioned; exported to warehouse.

---

## 18. Audit Events

### `audit_events`  (append-only, immutable, tamper-evident)
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| actor_user_id | BIGINT NULL | NULL for system |
| action | VARCHAR(60) | `grade.update`, `acu.debit`, `payment.succeeded`, `role.grant` |
| resource_type | VARCHAR(40) | |
| resource_id | BIGINT | |
| before_hash / after_hash | CHAR(64) | change fingerprint |
| ip | VARBINARY(16) | |
| request_id | CHAR(26) | trace correlation |
| prev_hash | CHAR(64) | hash-chain link (tamper-evident) |
| created_at | DATETIME(3) | |

Indexes: `INDEX(tenant_id, resource_type, resource_id, created_at)`, `INDEX(tenant_id, actor_user_id, created_at)`. Month-partitioned, WORM export. See `docs/ai-os/06-security-compliance.md`.

---

## 19. GDPR / Data Management

### `gdpr_requests`  **AUDIT=Y**
| Field | Type | Notes |
|-------|------|-------|
| tenant_id, id | PK | |
| subject_user_id | BIGINT | FK→users (or student) |
| requested_by_user_id | BIGINT | may be parent for minor |
| request_type | VARCHAR(16) | `export`\|`erasure`\|`rectify`\|`restrict` |
| status | VARCHAR(16) | `received`\|`processing`\|`completed`\|`rejected` |
| lawful_basis | VARCHAR(40) | |
| export_ref | VARCHAR(255) NULL | residency-pinned blob |
| due_by | DATE | statutory deadline |
| completed_at | DATETIME(3) NULL | |

Indexes: `INDEX(tenant_id, status, due_by)`, `INDEX(tenant_id, subject_user_id)`. Composite-key clustering makes per-subject export/erase a bounded, tenant-local operation.

---

## 20. Index & Hot-Path Summary

| Table | Critical index | Why |
|-------|----------------|-----|
| `acu_transactions` | `(tenant_id, wallet_id, created_at)` + `UNIQUE(tenant_id, idempotency_key)` | Ledger reads, burn rate, retry-safe debits |
| `grades` | `(tenant_id, student_id, graded_at)` | Grade-log/progress timelines |
| `messages` | `(tenant_id, thread_id, created_at)` | Thread pagination |
| `notifications` | `(tenant_id, user_id, status, created_at)` | Inbox/unread counts |
| `class_enrolments` / attendance | `(tenant_id, student_id)` | Attendance/activity lookups |
| `mastery` | PK `(tenant_id, student_id, topic_id)` | O(1) mastery read/update |
| `payments` | `UNIQUE(tenant_id, provider, provider_payment_id)` | Webhook idempotency |
| `ai_usage_logs` | `(tenant_id, agent, created_at)` | Cost/latency analytics |

---

## 21. Audit & Permission Requirements (matrix)

| Table group | Read permission | Write permission | Audit |
|-------------|-----------------|------------------|-------|
| users / roles / permissions | `iam:read` | `iam:write` (admin/school) | Y |
| students / student_subjects | `student:read` (scoped) | `student:write` | Y |
| grades / mastery | `student.grade:read` | `student.grade:write` (teacher/tutor/AI) | Y |
| acu_* | `acu.wallet:read` | `acu.wallet:write` (system/admin only) | Y |
| subscriptions/invoices/payments | `billing:read` | `billing:write` (billing-svc) | Y |
| bookings/sessions | `booking:read` | `booking:manage` | Y |
| gdpr_requests | `gdpr:read` (admin) | `gdpr:process` | Y |
| audit_events | `audit:read` (admin) | append-only (system) | — (is the audit) |

All reads/writes are additionally constrained by `tenant_id` and, where applicable, relationship scope (parent→child, teacher→cohort).

---

*Next: `docs/ai-os/12-api-specification.md` — REST + webhook contracts over these tables.*
