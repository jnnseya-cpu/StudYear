# PART 4 · Security, Compliance & the Cybersecurity Command Centre

> Sibling docs: [`05-self-managing-platform.md`](./05-self-managing-platform.md) · [`07-data-intelligence-layer.md`](./07-data-intelligence-layer.md) · [`11-database-schema-erd.md`](./11-database-schema-erd.md) · [`../architecture/14`](../architecture/14).
>
> **Scope.** StudYear is an AI Education OS serving **minors at scale**. Security is not a bolt-on module — it is the substrate. This document defines the Zero Trust posture, the Cybersecurity Command Centre (real-time detection + response), the anti-hacking framework, and the GDPR / KYC / AML / PCI-DSS compliance spine. Every control cited maps to a proven production pattern (Cloudflare, CrowdStrike, Okta/Auth0, Stripe Radar, Persona/Sumsub/Veriff).

---

## 1. Threat Model & Guiding Principles

StudYear's crown jewels, ranked by blast radius:

| Rank | Asset | Why it's targeted | Regulatory weight |
|------|-------|-------------------|-------------------|
| 1 | **Minor PII** (student profiles, ages, schools, guardianship links) | Child-safety liability; high-value for identity theft | GDPR Art. 8, UK Age Appropriate Design Code (AADC) |
| 2 | **ACU Wallet balances & ledgers** | Directly monetisable; prepaid credit = cash equivalent | PCI-DSS adjacent, AML |
| 3 | **Stripe / BitriPay payment flows** | Card fraud, chargeback abuse | PCI-DSS SAQ-A |
| 4 | **AI inputs/outputs** (diagnostic answers, essays, chat) | Exfiltration of learning data; prompt-injection pivot | GDPR special-category risk (child) |
| 5 | **Model Router credentials** (Anthropic/Gemini/OpenAI keys) | Bill-run-up, data-residency breach | Contractual, GDPR transfer |
| 6 | **Tenant isolation boundary** (composite-key sharding) | Cross-tenant data leak between schools | GDPR, contractual |

**Principles.** (1) **Never trust, always verify** — no implicit trust from network position, tenant, or prior auth. (2) **Assume breach** — segment, log, and limit blast radius so a single compromise is contained. (3) **Least privilege by default** — every role, agent, and service key gets the minimum grant. (4) **Child-first** — when a control decision is ambiguous, resolve in favour of the minor's safety and data minimisation. (5) **Defence in depth** — no single control is load-bearing.

---

## 2. Zero Trust Architecture

StudYear implements the **NIST SP 800-207** Zero Trust model, operationalised via a Cloudflare edge + application-layer Policy Decision Point (PDP). Every request — user, service, or agent — is authenticated, authorised, and continuously evaluated.

```
                          ┌──────────────────────────────────────────┐
   User / Agent / Service │        POLICY DECISION POINT (PDP)         │
        request  ───────► │  identity + device + risk + context signals│
                          │  → ALLOW / STEP-UP / DENY / QUARANTINE      │
                          └───────────────┬────────────────────────────┘
                                          │ signed short-lived token (mTLS + JWT)
   ┌──────────┐   ┌───────────┐   ┌───────▼────────┐   ┌────────────┐   ┌──────────┐
   │ Cloudflare│─►│  WAF /     │─►│ API Gateway    │─►│ PEP (per-   │─►│ MariaDB / │
   │ edge/DDoS │  │ Bot Mgmt   │  │ (Next.js/Node) │  │ service     │  │ services  │
   │           │  │ rate-limit │  │ FastAPI workers│  │ enforcement)│  │ Redis     │
   └──────────┘   └───────────┘   └────────────────┘   └────────────┘   └──────────┘
```

| ZT Pillar | StudYear implementation |
|-----------|-------------------------|
| **Identity** | Okta/Auth0-pattern IdP; OIDC/OAuth2.1; MFA; per-role claims; guardianship claim for minors |
| **Device** | Device fingerprinting (FingerprintJS-pattern), posture signals, device-bound sessions |
| **Network** | Cloudflare Zero Trust tunnels; no public DB; private VPC; mTLS between services |
| **Application/Workload** | Every microservice + FastAPI/LLM worker authenticates via short-lived SPIFFE-style identity; agents (Sentinel.ai et al.) hold scoped service accounts |
| **Data** | Tenant-scoped row access via composite key; field-level encryption on PII; policy checks at query time |
| **Continuous evaluation** | Session risk re-scored on every sensitive action (payment, ACU spend, profile edit, data export) |

**Micro-segmentation.** Operational DB, analytics plane, payment plane, and AI-inference plane are separate trust zones. A compromised LLM worker cannot reach the Stripe secret or the payment ledger — it holds only a scoped inference token and a residency-restricted model key.

---

## 3. Identity Layer

Pattern basis: **Okta / Auth0** adaptive authentication + **FingerprintJS** device intelligence.

### 3.1 Authentication factors

| Factor | Mechanism | Applied to |
|--------|-----------|-----------|
| Knowledge | Password (Argon2id hashed, breach-check via HIBP k-anonymity) | All |
| Possession | TOTP (RFC 6238), WebAuthn/passkeys, push, SMS fallback (discouraged) | Admin, School, Tutor, Parent |
| Inherence | Platform biometric via WebAuthn/passkey (Face/Touch ID) | Optional all; encouraged for payment |
| Device | Device fingerprint + bound session cookie | All |
| Context | Geo-velocity, IP reputation, time-of-day, ASN | Risk engine input |

### 3.2 Risk-based (adaptive) auth

The PDP computes a per-session **risk score (0–100)** from device, network, behavioural, and history signals, then selects an action:

| Risk band | Action |
|-----------|--------|
| 0–30 | Allow (silent) |
| 31–60 | Step-up MFA on sensitive actions only |
| 61–85 | Force MFA + re-verify device; throttle |
| 86–100 | Deny + quarantine session + alert Sentinel.ai |

**Minor-specific rules.** Students under the age threshold (16 UK / 13 with parental consent per jurisdiction) authenticate under a **guardianship-linked account**. Sensitive actions — payment, ACU top-up, data export, profile changes to safety-relevant fields — require the **parent/guardian** factor, not the minor's. SMS is disabled for minor accounts; passkeys or guardian approval only.

### 3.3 Session management

- Short-lived access tokens (≤15 min) + rotating refresh tokens (rotation-detection: reuse of a rotated refresh token revokes the whole family — the Auth0/Descope pattern).
- Sessions bound to device fingerprint + IP class; drift triggers re-auth.
- Absolute session lifetime caps; idle timeout tighter for admin/payment scopes.
- Server-side session registry in Redis for instant global revocation (logout-everywhere, admin kill-switch).

---

## 4. Cybersecurity Command Centre (Threat Detection & Response)

The Command Centre is StudYear's SOC-in-software: a real-time pipeline that ingests every security-relevant event, scores it, and drives automated or human response. Pattern basis: **CrowdStrike Falcon** (behavioural detection) + SIEM/SOAR + Cloudflare telemetry.

### 4.1 Telemetry sources → detection → response

```
 Sources                     Detection plane                Response
 ─────────                   ───────────────                ────────
 WAF / edge logs        ┐                                ┌ auto-block IP / ASN
 Auth events            │   ┌────────────────────┐       │ force MFA step-up
 API gateway logs       ├──►│  Event stream (Kafka│──────►│ quarantine session
 ACU ledger events      │   │  / Redpanda)        │       │ freeze wallet
 Payment/webhook events │   │        ↓            │       │ page on-call / Slack
 Agent action logs      │   │  Rules + ML anomaly │       │ open incident ticket
 Admin action audit     ┘   │  (Sentinel.ai)      │       └ escalate to human SOC
                            └────────────────────┘
```

### 4.2 Behavioural analytics & AI anomaly detection

- **UEBA (User & Entity Behaviour Analytics).** Per-user baselines: typical login geo/times, typical ACU spend velocity, typical API call mix. Deviations (impossible travel, spend spikes, endpoint enumeration) raise risk. See behavioural engine in [`07-data-intelligence-layer.md`](./07-data-intelligence-layer.md).
- **Sentinel.ai** owns real-time fraud + churn signals; here it doubles as the anomaly-detection agent for security events, streaming scores back into the PDP risk score.
- Models: unsupervised anomaly detection (isolation forest / autoencoder) for novel attacks + supervised classifiers for known fraud/abuse patterns; feedback loop from confirmed incidents (see §6).

### 4.3 Detection → response automation (SOAR)

| Trigger | Automated response | Human escalation |
|---------|-------------------|------------------|
| Credential-stuffing burst (many accounts, one IP range) | Rate-limit + CAPTCHA + block ASN | If >N accounts flagged |
| Account-takeover indicators (device drift + spend spike) | Freeze wallet, force re-auth, notify guardian | Always for minors |
| Data-export anomaly (bulk PII read) | Throttle + require MFA + log | Always |
| Model-key abuse (spend spike on provider) | Rotate key, cap budget | Platform Admin |
| Cross-tenant query attempt | Block + immutable audit + P1 alert | Always (P1) |

---

## 5. Anti-Hacking Framework — Controls Mapped to Threats

Layered defence spanning edge (Cloudflare), gateway, application, and data. **Every threat below has ≥2 independent controls.**

| # | Threat | Primary controls | Secondary / detection | Proven stack |
|---|--------|------------------|----------------------|--------------|
| T1 | **DDoS (L3/4 + L7)** | Cloudflare anycast absorption, rate limiting, adaptive challenge | Traffic anomaly alerts, autoscale isolation | Cloudflare |
| T2 | **SQL Injection** | Parameterised queries / ORM prepared statements ONLY; strict input validation | WAF SQLi ruleset; query anomaly detection | Cloudflare WAF, MariaDB prepared stmts |
| T3 | **XSS (stored/reflected/DOM)** | Output encoding, CSP (nonce-based, no `unsafe-inline`), React auto-escaping, sanitise rich text (DOMPurify) | WAF XSS ruleset; CSP violation reports | React, Cloudflare |
| T4 | **CSRF** | SameSite=Strict cookies + per-request anti-CSRF tokens; double-submit | Origin/Referer validation | Next.js middleware |
| T5 | **Session hijacking** | Device-bound sessions, short TTL, HttpOnly+Secure cookies, TLS 1.3 everywhere | Session anomaly (geo/device drift) → revoke | Redis session registry |
| T6 | **Account takeover (ATO)** | Risk-based MFA, breach-password check, device intelligence | UEBA drift, guardian notification (minors) | Auth0 pattern, FingerprintJS |
| T7 | **Credential stuffing** | Breach-list blocking, per-IP + per-account rate limits, CAPTCHA/Turnstile, passkeys | Velocity anomaly → block ASN | Cloudflare Turnstile, HIBP |
| T8 | **API abuse / scraping** | Per-key quotas, tiered rate limits, HMAC-signed requests, schema validation | Behavioural bot scoring, honey-endpoints | Cloudflare API Shield |
| T9 | **Bot attacks** | Cloudflare Bot Management (ML), Turnstile, device fingerprint | Score-based challenge/block | Cloudflare Bot Mgmt |
| T10 | **Broken access control / IDOR** | Deny-by-default authz, tenant composite-key scoping on every query, object-level checks | Cross-tenant access alerts (P1) | App PEP |
| T11 | **SSRF** | Egress allowlist, block link-local/metadata IPs, signed internal calls | Egress anomaly logging | VPC egress firewall |
| T12 | **Prompt injection / LLM abuse** | Input sanitisation, system-prompt isolation, tool-permission scoping, output filtering, residency-locked routing | Anomaly on tool-call patterns; see Model Router | Model Router guardrails |
| T13 | **Supply-chain / dependency** | SCA scanning, pinned deps, SBOM, signed artefacts | Dependabot/Renovate alerts | CI security gate |
| T14 | **Insider / admin abuse** | Least privilege, immutable admin audit, dual-control on high-risk ops | Admin-action anomaly detection | §8.5 |

---

## 6. Fraud Prevention

Owner agent: **Sentinel.ai** (churn + fraud). Pattern basis: **Stripe Radar** (ML transaction scoring) + device intelligence.

### 6.1 Three scoring surfaces

| Surface | Signals | Output | Action |
|---------|---------|--------|--------|
| **Transaction scoring** | Stripe Radar risk score, card/BIN, amount vs history, velocity, geo mismatch, 3DS result | Approve / 3DS challenge / block | Feeds ACU top-up gate |
| **Behaviour scoring** | ACU spend velocity, action mix, session risk, tenant norms | Behaviour risk 0–100 | Throttle / freeze / review |
| **Device intelligence** | Fingerprint, emulator/root detection, device reputation, shared-device graph | Device trust score | Step-up / deny |

### 6.2 Fraud scenarios & responses

| Scenario | Detection | Response |
|----------|-----------|----------|
| Stolen card → ACU top-up → resale | Radar score + velocity + BIN reputation | 3DS mandatory; block high-risk; hold ACU credit until settlement clears |
| Chargeback abuse | Chargeback history + pattern | Radar rules; ACU claw-back; account flag |
| Promo/credit abuse (multi-account) | Device graph, shared fingerprint, email/phone similarity | Merge-and-block; deny promo |
| Wallet draining after ATO | Spend spike + device drift | Auto-freeze wallet + guardian alert |
| School shared-pool abuse | Anomalous per-student draw from shared pool | Rate-cap per student; notify School admin |

**3D Secure & SCA.** All EU/UK card payments enforce **PSD2 Strong Customer Authentication** via Stripe 3DS. BitriPay (planned) integrates through the same scoring gate — no payment rail bypasses Sentinel.ai.

---

## 7. Data Protection

### 7.1 Encryption everywhere

| State | Control | Detail |
|-------|---------|--------|
| **In transit** | TLS 1.3 mandatory; mTLS service-to-service; HSTS preload | No plaintext internal hops; cert rotation automated |
| **At rest** | AES-256 volume encryption (MariaDB/Hostinger, backups, object store) + **application-layer field encryption** on PII/PAN-adjacent columns | Encrypt-then-store; separate keys per data class |
| **In use** | Minimise PII in memory; confidential-compute enclaves for the most sensitive ops where available; tokenised references passed to AI plane | AI workers see tokens/derived features, not raw PII where avoidable |

### 7.2 Tokenisation & key management

- **Tokenisation.** Card data never touches StudYear servers — Stripe holds the PAN, StudYear stores only a Stripe token/customer ID (PCI SAQ-A). Sensitive identifiers (guardianship links, national IDs from KYC) are tokenised; raw values held in a segregated vault.
- **Key management.** Envelope encryption: data keys wrapped by a KMS-held master key (HSM-backed). Keys are per-data-class and per-tenant-domain where isolation demands. Rotation on schedule + on suspected compromise. **No secret in code or env files** — secrets pulled at runtime from a secrets manager (Vault/cloud KMS pattern), short-lived, audited.
- **Data-residency & keys.** Minor data and its keys are pinned to approved regions; the Model Router (see stack) routes minor inference only to residency-approved providers/regions, and residency is enforced at the key layer — a worker in a non-approved region cannot decrypt minor PII.

---

## 8. Compliance & Risk

### 8.1 GDPR (UK & EU)

StudYear is a **data controller** for platform data and a **processor** on behalf of Schools for their pupils' records. Data categories collected:

| Category | Examples | Lawful basis | Sensitivity |
|----------|----------|--------------|-------------|
| Profile data | Name, age, school, role, guardianship | Contract / consent (guardian for minor) | High (minor) |
| AI inputs | Diagnostic answers, essays, chat prompts | Contract; legitimate interest (learning) | High |
| Usage data | Feature use, roadmap progress, session logs | Legitimate interest | Medium |
| ACU transactions | Balances, ledger, per-action spend | Contract | Medium |
| Payment data | Stripe token, customer ID, last-4 (no PAN) | Contract | High |
| Technical/security data | IP, device fingerprint, risk scores | Legitimate interest (security) | Medium |

**Data subject rights.** Self-service portal + admin workflow for: access (SAR export within statutory window), rectification, **erasure ("right to be forgotten")**, restriction, portability, objection. Deletion requests fan out across the estate — operational MariaDB, data lake/warehouse, vector store, backups (crypto-shredding of keys where hard-delete of backups is impractical), and third parties (Stripe, KYC vendor, model providers per DPA). See lineage/governance in [`07-data-intelligence-layer.md`](./07-data-intelligence-layer.md) — every record is traceable so erasure is complete and provable.

**Principles enforced.** Data minimisation, purpose limitation, storage limitation (retention schedules + auto-expiry), privacy by design & default, and **DPIAs** for high-risk processing (AI on minor data, profiling).

### 8.2 Child-data protection (many students are minors)

Compliance basis: **GDPR Art. 8**, **UK AADC (Children's Code)**, COPPA-equivalent posture.

- **Parental/guardian consent via guardianship.** A minor account cannot be provisioned without a verified guardianship link; consent is captured, versioned, and revocable. Guardian holds authority over payment, data export, and consent.
- **Age assurance** at signup; age-appropriate defaults (high-privacy defaults, geolocation off, no behavioural ad profiling — StudYear runs none).
- **Data minimisation for minors** — collect only what the learning loop requires.
- **No minor data to non-approved model providers/regions** — enforced by Model Router residency routing + key pinning (§7.2).
- **Safeguarding hooks** — content/chat monitoring for safety signals routed to School/guardian per policy.

### 8.3 KYC / KYB / AML

For Schools, Tutors, and Parents transacting real money (Stripe/BitriPay), StudYear runs identity/business verification and screening. Pattern basis: **Persona / Sumsub / Veriff**.

| Control | Who | Vendor pattern | Trigger |
|---------|-----|----------------|---------|
| **KYC** (identity) | Private Tutors, Parents (higher tiers) | Persona/Sumsub/Veriff — doc + biometric liveness | Onboarding, elevated payout/spend |
| **KYB** (business) | Schools, tutoring businesses | Registry checks, UBO verification | Onboarding as payee |
| **AML screening** | All payees | PEP + sanctions + adverse-media list screening; ongoing re-screening | Onboarding + periodic |
| **Transaction monitoring** | All money flows | Rule + ML monitoring for structuring, velocity, unusual patterns (Sentinel.ai) | Continuous |

Note: **minors are never KYC subjects** — the guardian is the verified party. Tutors working with minors additionally clear safeguarding checks per jurisdiction.

### 8.4 PCI-DSS logic

StudYear targets **PCI-DSS SAQ-A** by never storing/processing/transmitting PANs — Stripe Elements/Checkout tokenises card data client-side; StudYear only ever holds tokens.

| PCI requirement (theme) | StudYear control |
|-------------------------|------------------|
| Don't store PAN | Tokenisation; PAN stays with Stripe |
| Protect stored data | Encrypt tokens + payment metadata at rest (§7) |
| Encrypt transmission | TLS 1.3 (§7.1) |
| Access control | Least privilege + role permissions (§8.6) |
| Track & monitor | Immutable audit of all payment-plane access (§8.5) |
| Test security | SCA, pen-tests, vuln scans in CI |
| Secure keys / webhooks | §8.5 |

### 8.5 Secure API keys, webhook signing, transaction & admin monitoring

- **API keys / secrets.** Scoped, rotated, short-lived; stored in a secrets manager (never in repo/env-in-image); per-service least privilege; automatic revocation on anomaly. Model-provider keys are budget-capped and residency-tagged.
- **Webhook signing.** All inbound webhooks (Stripe, BitriPay, KYC vendor) verified via HMAC signature + timestamp (replay window) before processing; unsigned/invalid dropped and alerted. Idempotency keys prevent double-processing of ACU credits.
- **Transaction monitoring.** Every ACU ledger mutation and payment event is streamed to the Command Centre (§4) and scored by Sentinel.ai; hard-stop-at-zero wallet logic is enforced server-side and cannot be bypassed client-side.
- **Admin-action tracking.** Every Platform Admin action (impersonation, config change, data export, refund, ACU grant, user delete) writes to an **append-only, tamper-evident audit log** (hash-chained). High-risk actions require dual control. Admin-action anomalies feed detection (T14).

### 8.6 Role permissions (RBAC + tenant scope)

Authorisation = **RBAC × tenant scope × ABAC context**. Deny by default.

| Role | Can | Cannot |
|------|-----|--------|
| **Platform Admin** | Global ops, config, support (audited, dual-control on high-risk) | Silently read PII (impersonation logged + guardian-gated for minors) |
| **School** | Manage own tenant, shared ACU pool, teachers, pupils | Cross-tenant access; individual card data |
| **School Teacher** | Own classes/pupils within tenant | Payments, tenant config, other tenants |
| **Private Tutor** | Own students, own payouts (post-KYC) | Others' students; platform config |
| **Parent/Guardian** | Own child's account, payment, consent, exports | Other families; platform config |
| **Student (minor)** | Learning loop; own progress | Payment, data export, consent changes, safety-field edits |

Every DB query carries the tenant composite key + role claim; the PEP rejects any object access outside the caller's scope (mitigates IDOR/T10). See tenant model in [`11-database-schema-erd.md`](./11-database-schema-erd.md).

---

## 9. Control ↔ Threat ↔ Regulation Traceability

| Control domain | Threats mitigated | Regulations satisfied | Owner |
|----------------|-------------------|------------------------|-------|
| Zero Trust + PDP/PEP | T5, T6, T10, T14 | GDPR, PCI | Platform |
| Identity + adaptive MFA | T6, T7 | GDPR, PSD2 SCA, AADC | Auth service |
| Command Centre / UEBA | T1–T14 (detection) | GDPR (breach 72h), PCI monitoring | Sentinel.ai + SOC |
| Anti-hacking (edge/WAF/app) | T1–T13 | PCI, GDPR security | Platform |
| Fraud prevention | T6, payment fraud | AML, PSD2 | Sentinel.ai |
| Data protection / encryption | T5, T11, exfiltration | GDPR, PCI | Data platform |
| GDPR / rights / DPIA | Privacy harm | UK & EU GDPR | DPO |
| Child protection | Minor harm, illegal profiling | Art. 8, AADC, COPPA-posture | DPO + Safeguarding |
| KYC/KYB/AML | Financial crime, ATO | AML, sanctions | Compliance + Sentinel.ai |
| PCI-DSS + webhooks + keys | T8, payment fraud, replay | PCI SAQ-A | Payments |
| RBAC + admin audit | T10, T14, insider | GDPR accountability, PCI | Platform |

---

## 10. Incident Response & Continuous Improvement

- **Runbooks + SOAR.** Detection (§4) drives automated containment; P1 (cross-tenant leak, minor-data breach, payment compromise) pages on-call and opens an incident with a mandatory post-mortem.
- **Breach notification.** GDPR 72-hour supervisory-authority notification workflow pre-built; guardian notification for any incident touching minor data.
- **Verification.** Regular pen-tests, red-team exercises, tabletop drills, and dependency/secret scanning in CI. Confirmed incidents feed labelled data back to Sentinel.ai (closing the detection loop, §4.2).
- **Self-healing.** Security remediation ties into the self-managing platform — see [`05-self-managing-platform.md`](./05-self-managing-platform.md) for auto-remediation and rollback of compromised components.

> **Bottom line.** Zero Trust boundary, an always-on Cybersecurity Command Centre driven by Sentinel.ai, defence-in-depth mapped control-by-control to every major web/API/AI threat, tokenised PCI-SAQ-A payments, and a GDPR + child-safety spine that treats every student as a protected minor until proven otherwise.
