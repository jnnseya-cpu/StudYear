import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'StudYear — The AI Academic Operating System',
  description:
    'StudYear turns academic data into better grades: diagnostics, AI tutoring, adaptive study plans, assignment review and live progress for students, parents, schools and tutors.',
  manifest: `${BASE}/manifest.json`,
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: 'StudYear', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#060B18',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#060B18', color: '#EDF1F8', fontFamily: 'system-ui, sans-serif' }}>
        {/* PWA splash: branded launch screen when opened as an installed app
            (no-op in the browser). Loaded early; shared with the static consoles
            via public/splash.js so every surface starts the same way. */}
        <script src={`${BASE}/splash.js`} />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator)navigator.serviceWorker.register('${BASE}/sw.js',{scope:'${BASE}/'}).catch(function(){});`,
          }}
        />
      </body>
    </html>
  );
}
