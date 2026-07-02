import { STUDENT_PLANS, ACU_PER_POUND } from '@studyear/shared';

/**
 * /app — authenticated shell entry ("Launching your learning experience...").
 * Role-scoped route groups (student/parent/teacher/school/tutor/admin) attach here
 * per venture brief §6.4. This placeholder proves the shared-contract wiring.
 */
export default function AppShell() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <p style={{ letterSpacing: '.3em', fontSize: 12, color: '#D4AF37' }}>STUDYEAR</p>
        <h1 style={{ fontWeight: 500 }}>Launching your learning experience…</h1>
        <p style={{ color: '#AAB6CC' }}>
          £1 = {ACU_PER_POUND} ACUs · {STUDENT_PLANS.length} student plans live · balance always visible.
        </p>
      </div>
    </main>
  );
}
