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

export default function ConsolePage({ params }: { params: { slug: string } }) {
  const persona = PERSONAS.find((p) => p.slug === params.slug);
  if (!persona) notFound();
  if (persona.slug === 'admin') {
    // The production Admin console is the static one at /admin/. The old
    // React prototype that used to render here (fixture data, sample users,
    // "Grant free ACUs" era) is retired — anything still linking to
    // /app/admin lands on the real thing.
    return (
      <script dangerouslySetInnerHTML={{
        __html: "location.replace(location.pathname.replace(/app\\/admin\\/?$/, 'admin/'));",
      }} />
    );
  }
  return <PersonaConsole persona={persona} />;
}
