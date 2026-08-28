/**
 * Regression test for the auth open-redirect / DOM-XSS fix in auth/index.html.
 * Extracts the SHIPPED destination() function and runs it against hostile ?next=
 * values with a mocked location. A `javascript:` / external / data: URI must
 * never be returned (it would execute same-origin or phish); legit same-origin
 * console paths must be preserved. Node-only (no browser needed).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = readFileSync(join(ROOT, 'apps/web/public/auth/index.html'), 'utf8');
const m = html.match(/function destination\(role\)\{[\s\S]*?\n\}/);
if (!m) { console.log('FAIL — could not locate destination() in auth/index.html'); process.exit(1); }
const src = m[0];

function run(next) {
  const location = { origin: 'https://www.studyear.com', pathname: '/auth/' };
  const CONSOLE = { student: '../study/' };
  const fn = new Function('next', 'location', 'CONSOLE', 'decodeURIComponent', 'URL', src + '; return destination("student");');
  return fn(next, location, CONSOLE, decodeURIComponent, URL);
}

const cases = [
  ['javascript: URI is neutralised', 'javascript:window.x=1//account/', (v) => !/^javascript:/i.test(v) && v.indexOf(':') < 0],
  ['protocol-relative external rejected', '//evil.com/account/', (v) => !/evil\.com/.test(v) && v.indexOf('//') !== 0],
  ['absolute external rejected', 'https://evil.com/study/', (v) => !/evil\.com/.test(v)],
  ['data: URI rejected', 'data:text/html,x//account/', (v) => v.indexOf('data:') < 0],
  ['legit same-origin path preserved', 'https://www.studyear.com/account/topup/', (v) => /\/account\/topup\//.test(v)],
];

let ok = true;
for (const [name, input, pred] of cases) {
  const out = run(input);
  const pass = pred(out);
  ok = ok && pass;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + ' (' + JSON.stringify(input) + ' -> ' + JSON.stringify(out) + ')');
}
console.log(ok ? '✓ redirect-test clean' : '✗ redirect-test FAILED');
process.exit(ok ? 0 : 1);
