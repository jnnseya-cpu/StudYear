/**
 * Single source of truth for StudYear's Content-Security-Policy.
 * Consumed by:
 *   - apps/web/next.config.mjs  → Vercel/server target: real CSP response header
 *     (alongside HSTS, X-Frame-Options, nosniff, etc. that only a header can set).
 *   - scripts/inject-static-headers.mjs → GitHub Pages static export: a CSP
 *     <meta http-equiv>, because GitHub Pages cannot set response headers.
 * Keeping one list stops the two targets from drifting.
 */
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://buy.stripe.com https://checkout.stripe.com",
  "script-src 'self' 'unsafe-inline' blob: https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' https:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://meet.jit.si https://www.googletagmanager.com",
];

/** The full policy string for a response header. */
export function cspHeader() { return CSP_DIRECTIVES.join('; '); }

/** The policy string for a <meta http-equiv> tag. Browsers IGNORE
 *  `frame-ancestors` in a meta tag, so it is dropped here — clickjacking on the
 *  header-less Pages mirror is instead defended by a frame-bust guard. */
export function cspMeta() {
  return CSP_DIRECTIVES.filter((d) => !/^frame-ancestors\b/.test(d)).join('; ');
}
