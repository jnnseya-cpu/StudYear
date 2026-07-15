# StudYear Go-Live Runbook

Production target: **frontend on Vercel** · **backend, auth & storage on
Firebase** · **domain & DNS on Hostinger**. Everything code-side is already in
the repo — the steps below are the account-side actions only you can do
(your Google, Vercel and Hostinger logins). Total time ≈ 45–60 minutes.

The OS keeps working at every step: until `firebase-config.json` is filled in,
the cloud bridge is a silent no-op and the platform runs exactly as it does on
GitHub Pages today. Nothing breaks if you stop halfway.

---

## Part A — Firebase (backend + Auth + Storage), ~20 min

### A1. Create the project
1. https://console.firebase.google.com → **Add project** → name it
   **StudYear** (the repo default project ID is `studyear-platform`; if
   Firebase assigns something else, note it — you'll use it in A5 and A6).
2. Skip Google Analytics (the site uses GTM/Meta on marketing pages only).

### A2. Turn on Authentication
1. **Build → Authentication → Get started**.
2. **Sign-in method → Email/Password → Enable → Save**.
   (That's the only provider the OS uses; passwords never reach our code —
   Firebase Auth holds them, and user data is end-to-end encrypted besides.)

### A3. Create Firestore + Storage
1. **Build → Firestore Database → Create database** → **Production mode** →
   location **europe-west2 (London)**.
2. **Build → Storage → Get started** → Production mode, same region.
3. **Upgrade to the Blaze plan** (Settings → Usage and billing). Functions
   require it; the free allowance is generous and you can set a budget alert
   (e.g. £10/month) in the same screen.

### A4. Register the web app (gives you the config values)
1. Project overview → **⚙ Project settings → Your apps → Web (`</>`)** →
   nickname **StudYear OS** → Register (no Firebase Hosting needed).
2. Keep the shown `apiKey`, `projectId`, `storageBucket` — they go into
   `apps/web/public/firebase-config.json` in Part D.

### A5. Deploy the backend (Functions + Firestore rules + Storage rules)
On any machine with Node 20+ (your laptop is fine):

```bash
npm install -g firebase-tools
firebase login
git clone https://github.com/jnnseya-cpu/StudYear.git
cd StudYear && npm install
# only if your project ID is not studyear-platform:
#   edit backend/.firebaserc and replace the ID
cd backend && firebase deploy --project studyear-platform
```

This ships: `health`, `acuAuthorize`, `register`, `sync`, `syncPull`,
`aiProxy`, `contact`, `redeemCode`, `stripeWebhook` + the Firestore and
Storage security rules. Function URLs look like
`https://europe-west2-<project-id>.cloudfunctions.net/health` — open that URL
and check it returns `{ "ok": true }`.

### A6. Server secrets (AI proxy)
Only when you want server-side AI (keys out of browsers):

```bash
firebase functions:secrets:set AI_PROVIDER_KEY   # paste a FRESH key — rotate anything ever shared in chat
firebase deploy --only functions --project studyear-platform
```

---

## Part B — Vercel (production frontend), ~10 min

1. https://vercel.com → **Continue with GitHub** → authorise.
2. **Add New… → Project** → import **jnnseya-cpu/StudYear**.
   (Not listed? "Adjust GitHub App Permissions" and grant the repo.)
3. Configure:
   - **Framework Preset**: Next.js (auto-detected) — leave it.
   - **Root Directory** → **Edit** → `apps/web`. Keep *"Include source files
     outside of the Root Directory"* **enabled** (the app uses
     `packages/shared` from the workspace root).
   - Build settings / env vars: leave default.
4. **Deploy** → you get `https://studyear-xxxx.vercel.app`. Click around —
   the whole OS should work there immediately (still local-mode until Part D).
5. **Settings → Environments → Production → Branch** → set the branch you
   ship from — currently **`claude/continue-from-here-y37pvu`** (or merge it
   into `main` on GitHub first and use `main`; cleaner long-term).

---

## Part C — Hostinger (domain & DNS), ~10 min + propagation

In **Hostinger → Domains → studyear.com → DNS Zone** add:

| Type | Host | Value | Purpose |
|---|---|---|---|
| A | `@` | `76.76.21.21` | apex → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | www → Vercel |
| TXT | `@` | (Vercel shows this when you add the domain) | ownership proof |

Then in **Vercel → Project → Settings → Domains** add `studyear.com` and
`www.studyear.com`. Vercel verifies the records and issues HTTPS
automatically. Keep TTL at 300 during cutover; raise later.

Optional but recommended: a friendly API host. In Firebase you can attach a
custom domain to Functions via Firebase Hosting proxy, or simply keep using
the `cloudfunctions.net` URL — the OS doesn't care which you put in
`apiBase`. (Full zone detail incl. the wildcard tenant record and email
SPF/DKIM: see `infra/hostinger-dns.md`.)

---

## Part D — Flip the switch (connect the OS to Firebase), ~5 min

Edit **`apps/web/public/firebase-config.json`** on the shipping branch:

```json
{
  "apiKey":        "<from A4>",
  "projectId":     "<from A4>",
  "storageBucket": "<from A4, e.g. studyear-platform.appspot.com>",
  "apiBase":       "https://europe-west2-<project-id>.cloudfunctions.net"
}
```

Commit + push. Vercel redeploys automatically, and from that moment:

- **Sign-ups & sign-ins mirror into Firebase Auth** (email/password) as well
  as the local store — the OS keeps working offline/PWA.
- **Every account's data syncs to Firestore end-to-end encrypted**: the
  server receives only ciphertext plus a password-wrapped key. The `/sync`
  endpoint rejects any plaintext by design; nobody with console access —
  including us and Google — can read a learner's data.
- **New device sign-in restores the account from the cloud** (the encrypted
  blobs are pulled and only unlock with the user's password).
- **Uploads go to Firebase Storage** under `uploads/<uid>/…`, guarded by
  the deployed storage rules (25 MB cap, owner-only access).
- Demo accounts never touch the cloud.

## Verify the cutover

1. `https://europe-west2-<project-id>.cloudfunctions.net/health` → `{ok:true}`.
2. Open `https://studyear.com/auth/` → create a **test** account → Firebase
   console → **Authentication → Users** shows it, **Firestore → users/**
   has its doc, **e2eData/** fills with ciphertext blobs (never readable —
   that's correct).
3. Open the site in a private window (fresh device simulation) → Sign in
   with the test account → your data comes back after entering the password.
4. Firestore → try reading another user's doc in the Rules playground →
   denied (rules enforce isolation).

## Where things live after go-live

| Layer | Where | What |
|---|---|---|
| Frontend | Vercel (`studyear.com` via Hostinger DNS) | the whole OS, all consoles, PWA |
| Backup frontend | GitHub Pages (`jnnseya-cpu.github.io/StudYear`) | keeps auto-deploying on every push |
| Auth | Firebase Authentication | email/password identities |
| Data | Firestore | E2E-encrypted personal blobs, users, ACU ledger, AI usage logs, contact inbox |
| Files | Firebase Storage | `uploads/<uid>/…`, rules-guarded |
| API | Firebase Functions (europe-west2) | sync, register, ACU metering, AI proxy, contact |
| DNS / domain | Hostinger | zone records only — no app runs there |

## Hardening after cutover (owner console actions)

Per the go-live architecture (`docs/go-live-architecture.md`):

- **Staging project**: create `studyear-staging` in Firebase and deploy to it
  first (`cd backend && firebase deploy --project staging`). Never point a
  Vercel *preview* deployment at the production Firebase project — previews
  use the staging config or the dormant placeholder.
- **App Check**: Firebase console → App Check → register the web app with
  reCAPTCHA v3 and enforce for Firestore/Storage/Functions.
- **Backups**: enable scheduled Firestore exports (console → Firestore →
  Disaster recovery) and add a second production administrator.
- **CI deploys**: add the `FIREBASE_SERVICE_ACCOUNT` secret in GitHub →
  Settings → Secrets → Actions, then the **Deploy Backend (Firebase)**
  workflow deploys staging/production from a button, with an automatic
  post-deploy smoke test (`scripts/verify-deployment.mjs`).
- **Branch model**: once live, merge the shipping branch into `main` and set
  Vercel's production branch to `main`; feature branches then get preview
  URLs automatically.

**Security note:** rotate any API keys that were ever pasted into chats or
shared documents (OpenAI, Gemini, Google service accounts, Stripe) before
wiring providers into the deployment — treat exposed keys as compromised.
