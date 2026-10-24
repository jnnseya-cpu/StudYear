/**
 * Two build targets, one app:
 *  - default        → Vercel/server mode: rewrites serve the cinematic landing at /,
 *                     security headers on every response.
 *  - STATIC_EXPORT  → fully static `out/` for GitHub Pages (set PAGES_BASE_PATH to the
 *                     repo path, e.g. /StudYear). Rewrites/headers don't exist in static
 *                     hosting, so CI copies public/landing.html to out/index.html and the
 *                     host is expected to set headers at the edge.
 */
import { cspHeader } from '../../scripts/csp.mjs';

const isExport = process.env.STATIC_EXPORT === '1';
const basePath = process.env.PAGES_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@studyear/shared'],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // BOTH targets: the consoles are static pages under public/ that navigate
  // with RELATIVE links (students/, people/, gateway/ …). Those only resolve
  // when the browser URL ends in a slash — /school/ + students/ → /school/students/.
  // Without this, Vercel serves /school (no slash) and every sidebar link
  // resolves a level too high (→ /students/ → 404 on the live domain).
  trailingSlash: true,
  ...(isExport
    ? {
        output: 'export',
        basePath,
      }
    : {
        async rewrites() {
          // Cinematic marketing page served statically at the root (public/landing.html).
          return [{ source: '/', destination: '/landing.html' }];
        },
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                // Content-Security-Policy: strict on the high-value directives
                // (no external script injection, no <base>/<object> abuse, not
                // framable), permissive on connect/img/media so the many first-
                // and third-party API/asset hosts aren't broken. Inline scripts
                // exist throughout the static bundle, hence 'unsafe-inline'.
                // CSP from the shared single source of truth (scripts/csp.mjs),
                // so the Vercel header and the GitHub-Pages <meta> never drift.
                { key: 'Content-Security-Policy', value: cspHeader() },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                // force HTTPS for two years incl. subdomains (safe: prod is HTTPS-only)
                { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                // deny sensors by default; camera/mic stay available for QR scan + live classroom
                { key: 'Permissions-Policy', value: 'geolocation=(), payment=(), usb=(), camera=(self), microphone=(self)' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
                { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
