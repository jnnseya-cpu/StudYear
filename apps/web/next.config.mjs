/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@studyear/shared'],
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
};

export default nextConfig;
