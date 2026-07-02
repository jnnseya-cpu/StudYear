# 07 — System Matrix: The Studyear Connected Ecosystem

This is the **micro-level interaction map** — how an action by one persona ripples across
the others through shared kernel services. It is the counterpart to the macro view in
`00-overview.md`.

## 1. Who reads / writes what

Legend: **W** = writes (source of truth) · **R** = reads · **–** = no access

| Domain object | Admin | Teacher | Tutor | Student | Parent |
|---|:--:|:--:|:--:|:--:|:--:|
| Tenant / policy config | **W** | R | R | R | R |
| User / role / membership | **W** | R (own class) | R (own) | R (self) | R (children) |
| Class / enrollment | R | **W** | – | R (self) | R (children) |
| Curriculum / lesson | R | **W** | R | R | R |
| Tutor offering / availability | R | – | **W** | R | R |
| Booking / session | R | **W** (office hrs) | **W** | R/W (join) | **W** (book) |
| Assignment | R | **W** | **W** | R | R (children) |
| Submission | R | R | R | **W** | R (children) |
| Grade / mastery | R | **W** | **W** | R | R (children) |
| Attendance | R | **W** | **W** | R | R (children) |
| Feedback (session) | R | **W** | **W** | R | R (children) |
| Message thread | R (audit) | **W** | **W** | **W** | **W** |
| Invoice / payment | R (oversee) | – | R (own) | – | **W** |
| Payout | R (oversee) | – | R (own) | – | – |
| Alert / flag | R | **W**/R | R | R | R (children) |
| Audit event | **W**/R | – | – | – | – |

Note the invariant: **mastery has exactly two writers (teacher, tutor) and one row per
(student, topic).** That single-fact property is what makes the ecosystem coherent.

## 2. The closed loop, as a sequence

```
Teacher ──grade/flag──▶ Learning Records ──event──▶ Analytics
                                                       │ at-risk
                                                       ▼
Parent ◀──alert── Notifications ◀────────────────── Analytics
   │
   │ search + book
   ▼
Booking/Marketplace ──match──▶ Tutor ──teach──▶ Learning Records (SAME mastery row)
                                   │ feedback           │
                                   ▼                    ▼
Parent ◀── feedback + updated mastery ── Analytics ──▶ Teacher
   │
   ▼
Commerce ──payout──▶ Tutor        Admin ◀── engagement/revenue/outcomes ── Analytics
```

Every arrow is a real kernel-service call; no persona touches another persona's store
directly.

## 2b. The cross-pollination thesis (PM summary)

What makes Studyear valuable is **data exchange across otherwise-siloed user types**.
Instead of leaving schools and private tutors in separate systems, the platform makes them
one integrated network. The canonical value chain:

```
[School Teacher updates Gradebook]
        │  triggers alert
        ▼
[Parent notified of learning gap]
        │  one-click booking
        ▼
[Private Tutor hired via Marketplace]
        │  syncs workspace / mastery
        ▼
[Student receives targeted assistance]
```

This interconnectedness is the business case: it **maximizes retention, raises the lifetime
value of each account, and turns the platform from a simple utility into an indispensable
ecosystem** — no single-persona product can reproduce the chain, because each arrow crosses
a persona boundary that only a shared kernel can bridge.

## 3. Cross-persona business-logic touchpoints

| Trigger (by) | Rule / policy applied | Effect (to whom) |
|---|---|---|
| Teacher posts grade | grading scale, comms rules (Admin policy) | student HUD, parent gradebook, mastery, possible alert |
| Deadline passes with no submission | "missing" derivation | student, parent, teacher all see identical state |
| Analytics flags at-risk | threshold config | parent alert; suggested tutors (topic-matched) |
| Parent books tutor | guardianship: parent may need to authorize spend | booking on tutor+student calendars; payment auth |
| Tutor completes package | milestone-escrow rule | escrow released → payout; parent notified |
| Parent under-threshold child | guardianship controller rule | student actions require parent approval |
| Admin changes policy | version bump + propagation | all in-scope surfaces read new rule at runtime |
| Any privileged admin action | audit requirement | append-only audit event (incl. impersonation) |

## 4. Shared services, different lenses (worked example)

**Object: a single `mastery(student=Ada, topic=Quadratics)` row.**

- **Teacher** writes it from a graded quiz; sees it as a cell in the class gradebook and a
  point in a class distribution.
- **Analytics** reads it, compares to threshold, emits `at_risk` when low.
- **Parent** reads it as "needs help in Quadratics" and as the reason for an alert.
- **Tutor** (once booked) reads it as session context and *writes* an improved value.
- **Student** sees it as a trend line in the retention engine and as "what to practice next."
- **Admin** sees it only in aggregate (outcomes rollup) unless auditing.

One fact, six lenses, zero duplication — the entire architectural thesis in one row.

## 5. Failure-mode boundaries (what must NOT happen)

- A parent must never read a non-dependent student's records (scope derived from
  guardianship only).
- A tutor must only see the shared *context* for a booked student, not their full
  institutional record.
- A teacher's reach is bounded by class enrollment.
- Money movement is always mediated by Commerce + a processor — no persona moves funds
  directly.
- Every privileged/cross-scope action is audited.

See [Technical Architecture](08-technical-architecture.md) for how these boundaries are
enforced.
