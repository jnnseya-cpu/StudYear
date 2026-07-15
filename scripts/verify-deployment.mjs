/**
 * Post-deploy smoke test (go-live checklist §20 "Final release").
 *   node scripts/verify-deployment.mjs
 * Env:
 *   SY_API_BASE  — Functions base, e.g. https://europe-west2-studyear-platform.cloudfunctions.net
 *   SY_SITE      — optional frontend origin, e.g. https://studyear.com
 * Exits non-zero on any failure. Never needs credentials: it proves the
 * public surface is up AND that protected endpoints refuse anonymous calls.
 */
const API = process.env.SY_API_BASE;
const SITE = process.env.SY_SITE;
let failed = 0;
const ok = (name, cond, extra = '') => {
  console.log((cond ? 'PASS' : 'FAIL') + ' — ' + name + (extra ? ' (' + extra + ')' : ''));
  if (!cond) failed++;
};

if (!API) { console.log('SKIP — SY_API_BASE not set; nothing to smoke-test'); process.exit(0); }
const base = API.replace(/\/$/, '');

const health = await fetch(base + '/health').then(r => r.json()).catch(() => null);
ok('/health responds ok:true', !!health && health.ok === true, JSON.stringify(health));

for (const [path, method] of [['/syncPull', 'GET'], ['/sync', 'POST'], ['/register', 'POST'], ['/acuAuthorize', 'POST']]) {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined }).catch(() => null);
  ok(path + ' refuses anonymous calls', !!r && r.status === 401, 'status ' + (r && r.status));
}

if (SITE) {
  const site = SITE.replace(/\/$/, '');
  const cfg = await fetch(site + '/firebase-config.json').then(r => r.json()).catch(() => null);
  ok('frontend serves firebase-config.json with real values', !!cfg && !!cfg.apiKey && !!cfg.apiBase);
  const auth = await fetch(site + '/auth/').then(r => r.text()).catch(() => '');
  ok('auth page is live and carries the cloud bridge', auth.includes('cloud.js'));
}

console.log(failed ? '✗ SMOKE TEST FAILED — ' + failed + ' failure(s)' : '✓ SMOKE TEST PASSED');
process.exit(failed ? 1 : 0);
