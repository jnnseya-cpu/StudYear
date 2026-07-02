# Hostinger DNS Runbook — studyear.com

> The domain is **hosted at Hostinger**; the zone points traffic at **Vercel** (frontend)
> and **Firebase** (backend API). Hostinger hosts DNS only — no app runs there.

## Zone records

| Type | Host | Value | Purpose |
|---|---|---|---|
| A | `@` | `76.76.21.21` | apex → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | www → Vercel |
| CNAME | `*` | `cname.vercel-dns.com` | **wildcard**: tenant sub-domains (`schoolname.studyear.com`) → Vercel, resolved to tenant in the app |
| CNAME | `api` | `<region>-<project>.cloudfunctions.net` (or Firebase Hosting proxy) | backend API |
| TXT | `@` | Vercel + Firebase domain-verification strings | ownership proofs |
| MX / TXT (SPF, DKIM, DMARC) | `@` | per email provider | transactional email (notifications, digests) |

## Steps

1. **Hostinger → Domains → studyear.com → DNS Zone**: add the records above.
2. **Vercel → Project → Domains**: add `studyear.com`, `www.studyear.com`, and
   `*.studyear.com` (wildcard requires the CNAME above; Vercel issues certs automatically).
3. **Firebase → Hosting/Functions custom domain**: attach `api.studyear.com`, complete the
   TXT verification, wait for cert issuance.
4. **TTL**: keep 300s during cutover; raise to 3600s once stable.
5. **Verify**: `dig +short studyear.com`, `dig +short anything.studyear.com`,
   `curl https://api.studyear.com/health` → `{ ok: true }`.

## Notes

- The wildcard record is what powers **sub-domain-per-tenant** routing
  (`docs/architecture/13 §0`); the Next.js middleware reads the host header and resolves
  `tenant_id` at the edge.
- Email deliverability (parent digests, alerts) depends on correct SPF/DKIM/DMARC — set
  these before enabling notification fan-out.
- Keep registrar lock + 2FA enabled on the Hostinger account; the DNS zone is
  production-critical infrastructure.
