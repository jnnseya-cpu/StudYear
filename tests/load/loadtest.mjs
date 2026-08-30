/**
 * StudYear load test — dependency-free (no external library). Fires sustained
 * concurrent requests at a target URL and reports p50/p95/p99 latency,
 * throughput and error rate. Run it from a machine that can reach the target
 * (this must be executed against the LIVE/STAGING host — it cannot run from the
 * build sandbox, whose egress is firewalled).
 *
 * Usage:
 *   TARGET_URL="https://www.studyear.com/how-it-works/" CONCURRENCY=50 DURATION=30 node tests/load/loadtest.mjs
 *   # API (needs a token):  TARGET_URL="https://europe-west2-revision-rocket-4nuir.cloudfunctions.net/health" node tests/load/loadtest.mjs
 *
 * Env: TARGET_URL (required), CONCURRENCY (default 25), DURATION seconds
 * (default 30), METHOD (GET), AUTH (Bearer token, optional), BODY (JSON string).
 *
 * Launch targets to judge against (set your own): p95 < 800ms, error rate < 1%.
 */
const URLT = process.env.TARGET_URL;
if (!URLT) { console.error('Set TARGET_URL'); process.exit(2); }
const CONC = Math.max(1, Number(process.env.CONCURRENCY) || 25);
const DUR = Math.max(1, Number(process.env.DURATION) || 30) * 1000;
const METHOD = process.env.METHOD || 'GET';
const AUTH = process.env.AUTH || '';
const BODY = process.env.BODY || '';

const lat = [];
let ok = 0, err = 0, done = false;
const headers = { ...(AUTH ? { Authorization: 'Bearer ' + AUTH } : {}), ...(BODY ? { 'Content-Type': 'application/json' } : {}) };

async function worker() {
  while (!done) {
    const t = Date.now();
    try {
      const r = await fetch(URLT, { method: METHOD, headers, body: BODY || undefined });
      lat.push(Date.now() - t);
      if (r.ok) ok++; else err++;
      await r.arrayBuffer().catch(() => {});
    } catch { err++; lat.push(Date.now() - t); }
  }
}

function pct(a, p) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; }

const start = Date.now();
setTimeout(() => { done = true; }, DUR);
console.log(`Load: ${METHOD} ${URLT}  concurrency=${CONC}  duration=${DUR / 1000}s`);
await Promise.all(Array.from({ length: CONC }, worker));
const secs = (Date.now() - start) / 1000;
const total = ok + err;
console.log('--- results ---');
console.log('requests:        ' + total + '  (ok ' + ok + ', errors ' + err + ')');
console.log('throughput:      ' + (total / secs).toFixed(1) + ' req/s');
console.log('error rate:      ' + (total ? (100 * err / total).toFixed(2) : '0') + '%');
console.log('latency p50/p95/p99 (ms): ' + pct(lat, 50) + ' / ' + pct(lat, 95) + ' / ' + pct(lat, 99));
console.log('latency max (ms): ' + (lat.length ? Math.max(...lat) : 0));
const p95 = pct(lat, 95), errRate = total ? 100 * err / total : 100;
const pass = p95 < 800 && errRate < 1;
console.log(pass ? '✓ within example targets (p95<800ms, err<1%)' : '✗ exceeds example targets — investigate before launch');
process.exit(pass ? 0 : 1);
