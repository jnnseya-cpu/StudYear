import { notFound } from 'next/navigation';
import AdminConsole from '../AdminConsole';
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
  if (persona.slug === 'admin') return <AdminConsole />;
  return <PersonaConsole persona={persona} />;
}
