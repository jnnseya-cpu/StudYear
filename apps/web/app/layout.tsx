import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'StudYear — The AI Academic Operating System',
  description:
    'StudYear turns academic data into better grades: diagnostics, AI tutoring, adaptive study plans, assignment review and live progress for students, parents, schools and tutors.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#060B18', color: '#EDF1F8', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
