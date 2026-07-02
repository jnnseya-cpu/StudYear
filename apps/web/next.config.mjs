/**
 * Two build targets, one app:
 *  - default        → Vercel/server mode: rewrites serve the cinematic landing at /,
 *                     security headers on every response.
 *  - STATIC_EXPORT  → fully static `out/` for GitHub Pages (set PAGES_BASE_PATH to the
 *                     repo path, e.g. /StudYear). Rewrites/headers don't exist in static
 *                     hosting, so CI copies public/landing.html to out/index.html and the
 *                     host is expected to set headers at the edge.
 */
const isExport = process.env.STATIC_EXPORT === '1';
const basePath = process.env.PAGES_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@studyear/shared'],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isExport
    ? {
        output: 'export',
        basePath,
        trailingSlash: true,
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
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
