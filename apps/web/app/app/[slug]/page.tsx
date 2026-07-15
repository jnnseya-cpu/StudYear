import { notFound } from 'next/navigation';
import PersonaConsole from '../PersonaConsole';
import { PERSONAS } from '../personas';

export const dynamicParams = false;

export function generateStaticParams() {
  return PERSONAS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = PERSONAS.find((x) => x.slug === params.slug);
  return { title: p ? `StudYear — ${p.label} Console` : 'StudYear' };
}

const CONSOLE: Record<string, string> = {
  student: 'study/', parent: 'parent/', teacher: 'teacher/', school: 'school/',
  tutor: 'tutor/', authority: 'authority/', admin: 'admin/',
};

export default function ConsolePage({ params }: { params: { slug: string } }) {
  const persona = PERSONAS.find((p) => p.slug === params.slug);
  if (!persona) notFound();
  // The real consoles are the static command centres (colour system, live
  // data, guard). The React launcher pages that used to render here are
  // retired — every /app/<role> link lands on the genuine console.
  const target = CONSOLE[persona.slug] ?? 'study/';
  return (
    <script dangerouslySetInnerHTML={{
      __html: `location.replace(location.pathname.replace(/app\\/[a-z]+\\/?$/, '${target}'));`,
    }} />
  );
}
