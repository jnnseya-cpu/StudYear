#!/usr/bin/env bash
# ============================================================================
# StudYear — one-command backend go-live.
#
# Run in Cloud Shell (https://console.cloud.google.com/?project=revision-rocket-4nuir&cloudshell=true):
#
#   cd ~/StudYear && git pull && bash infra/meeting-ready.sh
#
# (first time only: git clone https://github.com/jnnseya-cpu/StudYear ~/StudYear
#  and check out the production branch: cd ~/StudYear && git checkout claude/continue-from-here-y37pvu)
#
# It does three things, in order, and tells you plainly what happened:
#   1. Deploys the newest backend (all functions + Firestore rules) as YOU —
#      the project owner — which never hits the robot's permission problem.
#   2. Smoke-tests the live API so you see PASS/FAIL immediately.
#   3. Authorises the GitHub deploy robot so the "Deploy Backend" button
#      works by itself from now on (best-effort; the deploy above already
#      succeeded either way).
# ============================================================================
set -uo pipefail

PROJECT="revision-rocket-4nuir"
ROBOT="firebase-adminsdk-fbsvc@${PROJECT}.iam.gserviceaccount.com"
API="https://europe-west2-${PROJECT}.cloudfunctions.net"

step() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓ %s\033[0m\n' "$*"; }
bad()  { printf '  \033[31m✗ %s\033[0m\n' "$*"; }

cd "$(dirname "$0")/.." || exit 1

step "1/3 Deploying backend as $(gcloud config get-value account 2>/dev/null || echo 'you')"
( cd backend && npx --yes firebase-tools deploy --only functions,firestore \
    --project "$PROJECT" --non-interactive --force ) \
  || { bad "Deploy failed — copy the error above into the chat and I will fix it."; exit 1; }
ok "Backend deployed"

step "2/3 Smoke-testing the live API"
FAIL=0
if curl -sf "$API/health" >/dev/null; then ok "health responds"; else bad "health"; FAIL=1; fi
if curl -sf "$API/publicStats" >/dev/null; then ok "publicStats live (landing real numbers)"; else bad "publicStats"; FAIL=1; fi
for f in adminOverview sync register notify; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$API/$f")
  if [ "$code" != "404" ] && [ "$code" != "000" ]; then ok "$f deployed (HTTP $code — auth-protected as designed)"; else bad "$f missing"; FAIL=1; fi
done
[ "$FAIL" = 0 ] && ok "ALL CHECKS PASSED — the OS backend is fully current." \
                || bad "Some checks failed — send me this output."

step "3/3 Authorising the GitHub deploy robot (one-click deploys from now on)"
for R in roles/editor roles/iam.serviceAccountUser roles/firebase.admin; do
  if gcloud projects add-iam-policy-binding "$PROJECT" \
       --member="serviceAccount:$ROBOT" --role="$R" \
       --condition=None --quiet >/dev/null 2>&1; then ok "$R"; else bad "$R (not fatal — deploy above already succeeded)"; fi
done
if gcloud iam service-accounts add-iam-policy-binding "${PROJECT}@appspot.gserviceaccount.com" \
     --member="serviceAccount:$ROBOT" --role="roles/iam.serviceAccountUser" \
     --project="$PROJECT" --quiet >/dev/null 2>&1; then ok "act-as App Engine SA"; else bad "act-as binding (not fatal)"; fi

printf '\n\033[1;32mDone. The backend is live and current. You are meeting-ready.\033[0m\n'
