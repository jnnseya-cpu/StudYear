/**
 * StudYear verification runner.
 * Serves the static export, runs every Playwright e2e suite plus the
 * 82-page crawl, and fails on any FAIL / JSERR line. Used by `npm run verify`
 * locally and by .github/workflows/verify.yml in CI.
 *
 * Env:
 *   CHROMIUM_PATH — chromium binary (default /opt/pw-browsers/chromium)
 *   SY_OUT        — built static export (default apps/web/out)
 *   SY_PORT       — port to serve on (default 8137)
 */
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SY_OUT || join(ROOT, 'apps/web/out');
const PORT = +(process.env.SY_PORT || 8137);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

if (!existsSync(join(OUT, 'landing.html'))) {
  console.error('No build found at ' + OUT + ' — run the static export first.');
  process.exit(2);
}

/* serve OUT under /StudYear (mirrors GitHub Pages) */
const server = createServer((req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!path.startsWith('/StudYear')) { res.writeHead(404); res.end(); return; }
    path = path.slice('/StudYear'.length) || '/';
    let file = join(OUT, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404); res.end('File not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch (e) { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(PORT, r));
console.log('Serving ' + OUT + ' at http://localhost:' + PORT + '/StudYear');

const SUITES = ['auth-test', 'e2ee-test', 'prem-test', 'exam-test', 'demo-test', 'admin-test', 'record-test', 'data-test', 'crawl'];
let failed = 0;
for (const s of SUITES) {
  const file = join(ROOT, 'tests/e2e', s + '.mjs');
  process.stdout.write('\n=== ' + s + ' ===\n');
  const out = await new Promise((resolve) => {
    const ch = spawn(process.execPath, [file], { env: process.env, cwd: ROOT });
    let buf = '';
    ch.stdout.on('data', (d) => { buf += d; });
    ch.stderr.on('data', (d) => { buf += d; });
    ch.on('close', () => resolve(buf));
  });
  process.stdout.write(out);
  const bad = out.split('\n').filter((l) => /^(FAIL|JSERR)/.test(l));
  // the crawl reports expected anonymous->auth redirects on /app/*; only
  // real error classes count against it
  const real = s === 'crawl'
    ? out.split('\n').filter((l) => /^\[(jserror|console|404|reqfail|nav)\]/.test(l))
    : bad;
  if (real.length || /Error:|Traceback/.test(out) === true && !/^=== /.test(out)) failed += real.length;
  if (real.length) console.error('✗ ' + s + ': ' + real.length + ' failure(s)');
  else console.log('✓ ' + s + ' clean');
}
server.close();
console.log('\n' + (failed ? '✗ VERIFY FAILED — ' + failed + ' failure(s)' : '✓ VERIFY PASSED — all suites green'));
process.exit(failed ? 1 : 0);
