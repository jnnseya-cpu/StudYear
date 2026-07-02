# Go-Live Guide — step by step

Three independent steps, in order of effort. Part 1 puts the built OS on a free
public URL in two minutes; Part 2 is the real production target; Part 3 brings
the backend up when you need it.

---

## Part 1 — GitHub Pages (~2 minutes, free)

The `Deploy StudYear OS` workflow already builds the static OS and publishes it
to the `gh-pages` branch on every push. GitHub just needs to be told to serve
that branch (the Actions token is not allowed to enable Pages itself).

1. Sign in to GitHub and open `https://github.com/jnnseya-cpu/StudYear`.
2. Click the **Settings** tab.
3. Left sidebar → **Code and automation** → **Pages**.
4. **Build and deployment → Source** → choose **Deploy from a branch**.
5. **Branch**: first dropdown **`gh-pages`**, second dropdown **`/ (root)`**.
6. Click **Save**, wait 1–2 minutes, refresh — the banner links to
   **https://jnnseya-cpu.github.io/StudYear/**.

After this one-time step, every push redeploys automatically.

## Part 2 — Vercel (production frontend, ~10 minutes, free Hobby tier)

Vercel serves the full app: landing rewrite at `/`, security headers, preview
deployments per commit.

1. Go to https://vercel.com → **Continue with GitHub** (authorise your account).
2. Dashboard → **Add New… → Project** → find **StudYear** → **Import**.
   (Not listed? "Adjust GitHub App Permissions" and grant the repo.)
3. Configure Project:
   - **Framework Preset**: auto-detected **Next.js** — leave it.
   - **Root Directory**: click **Edit** → select **`apps/web`**. Keep
     *"Include source files outside of the Root Directory"* **enabled** —
     the app depends on `packages/shared`, and Vercel installs from the
     npm-workspace root automatically.
   - Leave build settings and env vars default.
4. **Deploy** → you get `https://studyear-xxxx.vercel.app`.
5. Point production at the working branch: **Settings → Environments →
   Production → Branch** → `claude/studyear-ecosystem-architecture-f4lu5m`
   (or merge that branch into `main` on GitHub instead — cleaner long-term).
6. Optional custom domain: **Settings → Domains → Add** → `studyear.com`.
   Vercel shows the DNS record (`A 76.76.21.21` for the apex, or `CNAME
   cname.vercel-dns.com` for `www`). Add it in **Hostinger → Domains →
   studyear.com → DNS**, save, wait for verification. HTTPS is automatic.

## Part 3 — Firebase backend (when ready; needs your Google login)

Deploys the Functions API (ACU metering), Firestore rules + indexes, and
Storage rules. The frontend runs fine before this exists.

1. https://console.firebase.google.com → **Add project**. The repo expects the
   project ID **`studyear-platform`** (`backend/.firebaserc`); if Firebase
   assigns a different ID, note it for step 4.
2. In the project: **Build → Firestore Database → Create database** →
   Production mode → **europe-west2 (London)**. Create **Storage** likewise.
3. On any machine with Node 20+:

   ```bash
   npm install -g firebase-tools
   firebase login
   git clone https://github.com/jnnseya-cpu/StudYear.git
   cd StudYear && npm install
   ```

4. If your project ID differs, edit `backend/.firebaserc` and replace
   `studyear-platform` with the real ID.
5. Deploy everything:

   ```bash
   firebase deploy --config backend/firebase.json --project studyear-platform
   ```

   Functions require the pay-as-you-go **Blaze** plan (generous free allowance).
6. Connect the frontend: in Vercel **Settings → Environment Variables**, set
   the values referenced by `apps/web/vercel.json` (`NEXT_PUBLIC_API_BASE`,
   `NEXT_PUBLIC_FIREBASE_PROJECT`) once the Functions URL exists.

---

**Security note:** rotate any API keys that were ever pasted into chats or
shared documents (OpenAI, Gemini, Google service accounts, Stripe) before
wiring providers into the deployment — treat exposed keys as compromised.
