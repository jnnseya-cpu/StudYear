import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'StudYear — The AI Academic Operating System',
  description:
    'StudYear turns academic data into better grades: diagnostics, AI tutoring, adaptive study plans, assignment review and live progress for students, parents, schools and tutors.',
  manifest: `${BASE}/manifest.json`,
  icons: { icon: `${BASE}/icon.svg` },
};

export const viewport: Viewport = {
  themeColor: '#060B18',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#060B18', color: '#EDF1F8', fontFamily: 'system-ui, sans-serif' }}>
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
