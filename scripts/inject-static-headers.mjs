/**
 * Post-export security hardening for the GitHub Pages mirror.
 *
 * GitHub Pages serves static files and CANNOT set response headers, so the
 * Vercel security headers (CSP/HSTS/X-Frame-Options/…) never reach the Pages
 * build. This injects what HTML itself can carry into every exported page:
 *   - a CSP <meta http-equiv> (from the shared scripts/csp.mjs);
 *   - <meta name="referrer"> (the one header meta can express);
 *   - a tiny frame-bust guard (clickjacking defence — X-Frame-Options /
 *     frame-ancestors can't be delivered without a header; the app is never
 *     legitimately framed, per the Vercel `frame-ancestors 'none'`).
 *
 * No-op unless STATIC_EXPORT=1 (so it never touches the Vercel/server build,
 * which already sends real headers). Idempotent.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cspMeta } from './csp.mjs';

if (process.env.STATIC_EXPORT !== '1') process.exit(0);

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'web', 'out');
if (!existsSync(OUT)) { console.log('[inject-headers] no out/ — skipping'); process.exit(0); }

const MARK = 'http-equiv="Content-Security-Policy"';
const INJECT =
  '<meta http-equiv="Content-Security-Policy" content="' + cspMeta().replace(/"/g, '&quot;') + '">' +
  '<meta name="referrer" content="strict-origin-when-cross-origin">' +
  // never legitimately framed → break out of a framing attempt, or hide if we can't
  '<script>try{if(self!==top)top.location=self.location}catch(e){document.documentElement.style.display="none"}</script>';

let n = 0;
function patch(f) {
  let h = readFileSync(f, 'utf8');
  if (h.includes(MARK)) return; // already injected (idempotent)
  const m = h.match(/<head[^>]*>/i);
  if (m) h = h.slice(0, m.index + m[0].length) + INJECT + h.slice(m.index + m[0].length);
  else h = INJECT + h; // no <head> (rare) — prepend so the policy still applies
  writeFileSync(f, h);
  n++;
}
function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (p.endsWith('.html')) patch(p);
  }
}
walk(OUT);
console.log('[inject-headers] injected CSP meta + referrer + frame-bust into ' + n + ' page(s)');
