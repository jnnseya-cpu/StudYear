# PART 4 · API Specification (REST + Webhooks)

> **Scope:** Public + internal REST API and webhook contracts for **StudYear**. All endpoints are tenant-scoped, JWT-authenticated, RBAC-gated, versioned, and (for mutations) idempotent. This document is the contract between clients and the transactional core / AI orchestration layer.
>
> **Cross-references:** architecture `docs/ai-os/10-production-architecture.md`; schema `docs/ai-os/11-database-schema-erd.md`; security/GDPR `docs/ai-os/06-security-compliance.md`; BitriPay `docs/ai-os/08-bitripay-gateway.md`; canonical model `docs/architecture/09`; deployment `docs/architecture/15`.

---

## 1. Conventions

| Aspect | Rule |
|--------|------|
| Base URL | `https://{tenant}.studyear.app/api/v1` — sub-domain resolves `tenant_id`; internal service base `https://api.internal.studyear/v1` (mTLS). |
| Versioning | URI major version `/v1`; additive changes are non-breaking; breaking changes bump to `/v2`. `Deprecation` + `Sunset` headers on retiring endpoints. |
| Auth | `Authorization: Bearer <access_jwt>`. JWT `tid` **must** equal the sub-domain tenant or the gateway returns `403 tenant_scope_mismatch`. |
| RBAC | Each endpoint lists required permission(s) (`resource:action`) evaluated by `rbac-svc`; relationship scope enforced (parent→child, teacher→cohort). |
| Content type | `application/json; charset=utf-8`. Timestamps ISO-8601 UTC. IDs are opaque ULIDs (`public_id`). |
| Idempotency | All `POST`/`PATCH`/`DELETE` accept `Idempotency-Key: <ulid>`; same key + same body → same result (24h window). Required for payments & ACU. |
| Pagination | Cursor-based: `?limit=50&cursor=<opaque>`; response `{ data: [...], page: { next_cursor, has_more } }`. Max `limit` 100. |
| Filtering/sort | `?filter[field]=value&sort=-created_at`. |
| Rate limits | Per (tenant, user, route). Headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`. `429` on breach. |
| Errors | Envelope `{ error: { code, message, request_id, details? } }` — see §14. |
| Tracing | `X-Request-Id` echoed; propagated to traces + `audit_events`. |
| AI endpoints | Return `202 Accepted` + `job_id` (async) or `200` with cached result; stream via SSE/WebSocket. All debit ACU (hard stop at 0). |

---

## 2. Authentication

### `POST /auth/login`
Auth: public. RBAC: none. Rate limit: 10/min/IP.
```json
// request
{ "email": "student@school.example", "password": "••••••", "mfa_code": "123456" }
```
```json
// 200
{
  "access_token": "eyJ…",           // 10-min JWT (sub, tid, role, scopes[], residency)
  "refresh_token": "rt_…",          // rotated; also set HttpOnly cookie
  "token_type": "Bearer",
  "expires_in": 600,
  "user": { "id": "01HZ…", "user_type": "student", "is_minor": true }
}
```
Errors: `401 invalid_credentials`, `423 account_locked`, `403 mfa_required`.

### `POST /auth/refresh`
Auth: refresh cookie/token. Rotates refresh token (reuse-detection → `401 token_reuse_detected` + session revoke).

### `POST /auth/logout`
Auth: Bearer. Revokes refresh token family. `204`.

### `GET /auth/me`
Auth: Bearer. Returns current user + resolved roles/permissions for the tenant.

---

## 3. Users & RBAC

### `GET /users`
Auth: Bearer. RBAC: `iam:read`. Rate limit: 120/min. Paginated. Filter `filter[user_type]`, `filter[status]`.

### `POST /users`
Auth: Bearer. RBAC: `iam:write` (School/Admin). Idempotent.
```json
{ "email":"teacher@school.example", "user_type":"teacher", "roles":["school_teacher"] }
```
`201` → user object (`status:"invited"`). Emits invite notification. Audited.

### `PATCH /users/{id}/roles`
Auth: Bearer. RBAC: `iam:write`. Body `{ "add":["school_teacher"], "remove":[] }`. Audited (`role.grant`/`role.revoke`).

### `GET /roles` · `GET /permissions`
Auth: Bearer. RBAC: `iam:read`. Returns tenant role catalogue and permission keys.

---

## 4. Students & Academic Profile

### `GET /students`
Auth: Bearer. RBAC: `student:read` (relationship-scoped: parent→linked children, teacher→cohort). Paginated. Filter `filter[year_group]`, `filter[school_id]`.

### `POST /students`
Auth: Bearer. RBAC: `student:write`. Idempotent. Minor PII field-encrypted.
```json
{ "first_name":"Ada","last_name":"L.","date_of_birth":"2009-12-10",
  "year_group":"Y11","exam_board":"AQA","school_id":"01HZSCHOOL" }
```
`201` → student (`is_minor` derived). Audited.

### `GET /students/{id}`
Auth: Bearer. RBAC: `student:read` (scoped). `403 relationship_scope_denied` if not linked.

### `GET /students/{id}/subjects` · `PATCH /students/{id}/subjects/{subjectId}`
Auth: Bearer. RBAC: `student:read` / `student:write`. Manages `target_grade`, `current_grade`, `confidence`.
```json
// PATCH body
{ "target_grade":"7", "confidence":40 }
```
`200` → updated `student_subjects` row. Confidence feeds Principia prioritisation.

---

## 5. Diagnostics

### `POST /diagnostics`
Auth: Bearer. RBAC: `diagnostic:write`. Idempotent. **ACU pre-flight.**
```json
{ "student_id":"01HZADA", "subject_id":"01HZMATHS" }
```
`202` →
```json
{ "job_id":"job_01HZ…", "diagnostic_id":"01HZDIAG", "status":"started", "acu_reserved":5 }
```
Errors: `402 acu_insufficient`, `429 rate_limited`.

### `GET /diagnostics/{id}`
Auth: Bearer. RBAC: `diagnostic:read` (scoped). Returns status + `result_json` (per-topic breakdown) when `scored`. On completion emits `diagnostic.completed` and triggers Principia + mastery update.

---

## 6. Study Plans

### `POST /study-plans`
Auth: Bearer. RBAC: `plan:write`. **ACU pre-flight.** Generates via Principia.
```json
{ "student_id":"01HZADA", "subject_id":"01HZMATHS", "source_diagnostic_id":"01HZDIAG" }
```
`202` → `{ "job_id":"job_…", "plan_id":"01HZPLAN", "status":"generating" }`.

### `GET /study-plans/{id}` · `GET /study-plans/{id}/items`
Auth: Bearer. RBAC: `plan:read`. Items paginated, `sort=scheduled_for`.

### `PATCH /study-plans/{id}/items/{itemId}`
Auth: Bearer. RBAC: `plan:write`. Body `{ "status":"done" }` → updates progress, feeds mastery decay scheduling.

---

## 7. AI Tutor (Mentor)

### `POST /ai-tutor/threads`
Auth: Bearer. RBAC: `ai.tutor:use`. Creates a tutoring thread `{ subject_id, topic_id? }`. `201` → `{ "thread_id":"01HZT" }`.

### `POST /ai-tutor/threads/{threadId}/messages`
Auth: Bearer. RBAC: `ai.tutor:use`. Idempotent. **ACU pre-flight + hard stop.** Streams via SSE.
```json
{ "content":"Explain completing the square", "stream": true }
```
`202` → `{ "job_id":"job_…", "acu_reserved":2, "stream_url":"/ai-tutor/streams/job_…" }`
On completion: finalises ACU debit, writes `ai_usage_logs`, updates mastery. If wallet hits 0 mid-stream → `acu.depleted` event + `402` on next call.
Errors: `402 acu_insufficient`, `409 content_flagged` (Sentinel), `503 provider_unavailable` (after Model Router failover exhausted / `residency_blocked`).

Rate limit: 30 msgs/min/user.

---

## 8. Resources & Assignments

### `POST /resources`
Auth: Bearer. RBAC: `resource:generate`. **ACU pre-flight.** Pedagogue generation.
```json
{ "type":"quiz", "subject_id":"01HZMATHS", "topic_id":"01HZQUAD", "count":10 }
```
`202` → `{ "job_id":"job_…", "resource_id":"01HZRES" }`.

### `GET /resources/{id}` — Auth: Bearer. RBAC: `resource:read`.

### `POST /assignments` — Auth: Bearer. RBAC: `assignment:write` (teacher). Idempotent.
```json
{ "class_id":"01HZCLASS","subject_id":"01HZMATHS","title":"Quadratics HW",
  "due_at":"2026-07-10T16:00:00Z","max_score":20 }
```

### `POST /assignments/{id}/submissions` — Auth: Bearer. RBAC: `submission:write` (student, scoped). Idempotent. Optional AI review triggers ACU pre-flight.

### `POST /submissions/{id}/grade` — Auth: Bearer. RBAC: `student.grade:write` (teacher/tutor). Appends to `grades` (never overwrites). Audited (`grade.update`). Emits nothing external but updates mastery.

---

## 9. Progress & Mastery

### `GET /students/{id}/progress`
Auth: Bearer. RBAC: `student.grade:read` (scoped). Returns grade timeline + subject rollups. Backed by `grades (tenant_id, student_id, graded_at)` index.

### `GET /students/{id}/mastery`
Auth: Bearer. RBAC: `student.grade:read`. Returns per-topic mastery.
```json
{ "data":[ { "topic_id":"01HZQUAD","topic":"Quadratics","mastery_score":72.5,
             "confidence":40,"last_source":"tutor","updated_at":"2026-07-01T…" } ],
  "page": { "next_cursor": null, "has_more": false } }
```

### `GET /students/{id}/risk`
Auth: Bearer. RBAC: `progress.risk:read` (teacher/school/parent scoped). Sentinel risk score + flags. Flag changes emit `risk.flagged`.

---

## 10. ACU Wallet, Packs & Transactions

### `GET /acu/wallet`
Auth: Bearer. RBAC: `acu.wallet:read`. Query `?owner_type=student&owner_id=01HZADA` (school pool: `owner_type=school_pool`).
```json
{ "wallet_id":"01HZW","balance_acu":128,"reserved_acu":4,"low_threshold":50 }
```

### `GET /acu/transactions`
Auth: Bearer. RBAC: `acu.wallet:read`. Paginated ledger, `sort=-created_at`. Filter `filter[reason]`, `filter[direction]`. Hot-path index `(tenant_id, wallet_id, created_at)`.

### `GET /acu/packs`
Auth: Bearer. RBAC: `acu.pack:read`. Returns purchasable packs (`acu_amount`, `price_cents`, `stripe_price_id`).

### `POST /acu/packs/{code}/purchase`
Auth: Bearer. RBAC: `acu.pack:buy`. **Idempotent (required).** Creates a payment intent (Stripe/BitriPay) — does **not** credit until `payment.succeeded`.
```json
// request  (Idempotency-Key header required)
{ "provider":"stripe", "quantity":1 }
```
```json
// 201
{ "payment_id":"01HZPAY","provider":"stripe",
  "client_secret":"pi_…_secret_…","status":"pending","acu_on_success":500 }
```
On webhook settlement → exactly one credit `acu_transactions` row (idempotent on payment id).

---

## 11. Payments (Stripe live · BitriPay planned)

### `POST /payments/stripe/checkout`
Auth: Bearer. RBAC: `billing:write`. Idempotent. Creates Stripe Checkout/PaymentIntent for subscription, ACU pack, or booking.
```json
{ "purpose":"subscription","plan_code":"school_annual" }
```
`201` → `{ "payment_id":"01HZPAY","client_secret":"pi_…","provider":"stripe" }`.

### `POST /webhooks/stripe` (ingress)
Auth: **Stripe signature** (`Stripe-Signature`), not JWT. Verified by `webhook-svc` before enqueue. Handles `payment_intent.succeeded`, `invoice.paid`, `charge.refunded`. Idempotent on Stripe event id. Returns `200` fast; processing async. See §13.

### `POST /payments/bitripay/checkout`  *(planned)*
Auth: Bearer. RBAC: `billing:write`. Same `PaymentProvider` contract as Stripe; adapter detailed in `docs/ai-os/08-bitripay-gateway.md`. `POST /webhooks/bitripay` verifies BitriPay signature.

### `GET /invoices` · `GET /payments/{id}`
Auth: Bearer. RBAC: `billing:read`. Paginated; `payments` scoped to tenant + owner.

---

## 12. Bookings, Notifications, Admin, GDPR

### `GET /tutor-offerings` · `POST /bookings`
Auth: Bearer. RBAC: `booking:read` / `booking:manage`. Booking creation is idempotent and may create a payment.
```json
// POST /bookings  (Idempotency-Key required)
{ "offering_id":"01HZOFF","student_id":"01HZADA",
  "scheduled_start":"2026-07-05T15:00:00Z","scheduled_end":"2026-07-05T16:00:00Z" }
```
`201` → booking (`status:"pending"`). On confirmation emits `booking.confirmed`. Session end emits `session.completed`.

### `GET /notifications` · `POST /notifications/{id}/read`
Auth: Bearer. RBAC: `notification:read`. Inbox paginated via `(tenant_id, user_id, status, created_at)`; `POST …/read` → `204`. No SMS channel for minors.

### `GET /admin/tenants` · `POST /admin/tenants/{id}/suspend`
Auth: Bearer. RBAC: `platform.admin` (Platform Admin only, cross-tenant → break-glass, MFA, audited). Tenant provisioning, feature flags, webhook redelivery, ACU pack catalogue.

### `POST /gdpr/requests`
Auth: Bearer. RBAC: `gdpr:request` (subject, or parent for a minor). Idempotent.
```json
{ "subject_user_id":"01HZADA","request_type":"export","lawful_basis":"data_subject_request" }
```
`202` → `{ "request_id":"01HZG","status":"received","due_by":"2026-07-30" }`. Processing tenant-local (composite-key clustering). `GET /gdpr/requests/{id}` tracks status; export delivered as residency-pinned signed URL. See `docs/ai-os/06-security-compliance.md`.

---

## 13. Webhook Events (egress, signed)

All outbound webhooks: `POST` to the tenant's registered endpoint with headers
`StudYear-Signature: t=<unix>,v1=<hex-hmac-sha256>` and `StudYear-Event-Id: <ulid>`.
Verify by recomputing HMAC-SHA256 over `"{t}.{raw_body}"` with the endpoint secret; reject if timestamp outside ±5 min (replay window). At-least-once delivery, exponential backoff, DLQ, idempotent on `StudYear-Event-Id`.

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `payment.succeeded` | Stripe/BitriPay settlement | School finance, ACU credit |
| `acu.depleted` | Wallet reaches 0 | Parent/School alerts, block AI |
| `diagnostic.completed` | Diagnostic scored | LMS/school integration |
| `risk.flagged` | Sentinel raises flag | Safeguarding lead (critical) |
| `booking.confirmed` | Booking confirmed/paid | Calendar, tutor, parent |
| `session.completed` | Tutor session ends | Reporting, payout, summary |

### Signed payload examples
```json
// payment.succeeded
{ "id":"01HZEVT","type":"payment.succeeded","tenant_id":"01HZTEN","created_at":"2026-07-02T…",
  "data":{ "payment_id":"01HZPAY","provider":"stripe","provider_payment_id":"pi_3P…",
           "purpose":"acu_pack","amount_cents":4999,"currency":"GBP","acu_credited":500 } }
```
```json
// acu.depleted
{ "id":"01HZEV2","type":"acu.depleted","tenant_id":"01HZTEN","created_at":"2026-07-02T…",
  "data":{ "wallet_id":"01HZW","owner_type":"student","owner_id":"01HZADA","balance_acu":0 } }
```
```json
// risk.flagged  (safeguarding — critical path, never disabled)
{ "id":"01HZEV3","type":"risk.flagged","tenant_id":"01HZTEN","created_at":"2026-07-02T…",
  "data":{ "student_id":"01HZADA","severity":"high","reason":"engagement_drop",
           "detected_by":"sentinel","score":0.87 } }
```
```json
// diagnostic.completed
{ "id":"01HZEV4","type":"diagnostic.completed","tenant_id":"01HZTEN","created_at":"2026-07-02T…",
  "data":{ "diagnostic_id":"01HZDIAG","student_id":"01HZADA","subject_id":"01HZMATHS",
           "score_overall":64.0,"weak_topics":["01HZQUAD","01HZTRIG"] } }
```
```json
// booking.confirmed
{ "id":"01HZEV5","type":"booking.confirmed","tenant_id":"01HZTEN","created_at":"2026-07-02T…",
  "data":{ "booking_id":"01HZBK","tutor_id":"01HZTUT","student_id":"01HZADA",
           "scheduled_start":"2026-07-05T15:00:00Z" } }
```
```json
// session.completed
{ "id":"01HZEV6","type":"session.completed","tenant_id":"01HZTEN","created_at":"2026-07-02T…",
  "data":{ "session_id":"01HZSE","booking_id":"01HZBK","duration_min":58,
           "ai_summary_available":true } }
```

---

## 14. Error Code Table

| HTTP | `code` | Meaning / when |
|------|--------|----------------|
| 400 | `validation_error` | Malformed body/params (`details[]` lists fields) |
| 401 | `invalid_credentials` | Bad login |
| 401 | `token_expired` | Access JWT expired → refresh |
| 401 | `token_reuse_detected` | Refresh reuse → session family revoked |
| 402 | `acu_insufficient` | Balance below action cost (hard stop) |
| 403 | `permission_denied` | RBAC permission missing |
| 403 | `relationship_scope_denied` | Not linked (parent/teacher scope) |
| 403 | `tenant_scope_mismatch` | JWT `tid` ≠ sub-domain tenant |
| 403 | `mfa_required` | Privileged action needs MFA |
| 404 | `not_found` | Resource absent within tenant |
| 409 | `idempotency_conflict` | Same key, different body |
| 409 | `content_flagged` | Sentinel blocked AI content |
| 409 | `booking_conflict` | Slot no longer available |
| 422 | `unprocessable` | Semantically invalid (e.g. minor + SMS) |
| 423 | `account_locked` | Too many attempts |
| 429 | `rate_limited` | Rate limit exceeded (`RateLimit-Reset`) |
| 451 | `residency_blocked` | No compliant AI provider for region |
| 500 | `internal_error` | Unhandled — `request_id` for support |
| 503 | `provider_unavailable` | Model Router failover exhausted |
| 503 | `service_degraded` | Shard/dependency down (see BCP) |

Error envelope:
```json
{ "error": { "code":"acu_insufficient",
             "message":"Wallet balance is below the cost of this action.",
             "request_id":"01HZREQ",
             "details":{ "required_acu":2, "balance_acu":0 } } }
```

---

## 15. Idempotency, Rate Limits & Pagination (summary)

- **Idempotency:** `Idempotency-Key` (ULID) mandatory on payments, ACU purchases, bookings; recommended on all mutations. Server stores key→response 24h; replay returns the stored response. Conflicting body → `409 idempotency_conflict`.
- **Rate limits (representative):** auth 10/min/IP; AI-tutor 30/min/user; diagnostics/resource-gen 10/min/user; reads 120/min/user; webhooks ingress unmetered but signature-gated. School shared-pool actions additionally bounded by pool ACU.
- **Pagination:** cursor-based only (`limit` ≤ 100, `cursor` opaque); never offset on hot tables. Responses always include `page.next_cursor` + `page.has_more`.
- **Versioning:** `/v1` stable; additive fields non-breaking; deprecations announced via `Deprecation`/`Sunset` headers with ≥ 90-day window.

---

*End of Part 4. See `docs/ai-os/10-production-architecture.md` and `docs/ai-os/11-database-schema-erd.md` for the systems and data these APIs expose.*
