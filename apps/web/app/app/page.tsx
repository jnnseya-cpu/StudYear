'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ACU_PER_POUND,
  ACU_TARIFF,
  AgentId,
  FREE_TIER,
  MARGIN,
  PARENT_PLANS,
  ROLES,
  SCHOOL_PLANS,
  STUDENT_PLANS,
  type MeteredActivity,
  type Plan,
  type Role,
} from '@studyear/shared';

/**
 * /app — the StudYear OS shell.
 * One console, six lenses: every persona from the shared ROLES contract gets a
 * purpose-built surface (modules, wallet, analytics deep-links) reading the same
 * shared kernel of tariffs, plans and agent registry.
 */

type Module = {
  agent: AgentId;
  label: string;
  desc: string;
  tariff?: MeteredActivity;
};

const PERSONAS: Record<
  Role,
  { label: string; strap: string; hash: string; dashboard: string; modules: Module[]; plans?: Plan[] }
> = {
  student: {
    label: 'Student',
    strap: 'Study smarter, not harder.',
    hash: 'student',
    dashboard: 'student',
    plans: STUDENT_PLANS,
    modules: [
      { agent: AgentId.Planner, label: 'Study Planner', desc: 'A personalised plan in under 5 minutes — weak topics weighted heaviest.', tariff: 'study_planner' },
      { agent: AgentId.Tutor, label: 'AI Tutor', desc: 'Homework & exam help, 24/7. Teaches the method, never just the answer.', tariff: 'homework_help' },
      { agent: AgentId.Examiner, label: 'Academic Diagnostic', desc: 'Find exactly what you know, forget and need next.', tariff: 'academic_diagnostic' },
      { agent: AgentId.ContentForge, label: 'Resource Maker', desc: 'Flashcards, quizzes, notes, mindmaps — generated or your own.', tariff: 'flashcards' },
      { agent: AgentId.Examiner, label: 'Predicted Grade', desc: 'Live grade trajectory with confidence band vs your target.', tariff: 'predicted_grade' },
      { agent: AgentId.Motivation, label: 'Streaks & Points', desc: 'Momentum you can see — streaks, points, mastery per subject.' },
    ],
  },
  parent: {
    label: 'Parent',
    strap: 'Clarity without micromanaging.',
    hash: 'parent',
    dashboard: 'parent',
    plans: PARENT_PLANS,
    modules: [
      { agent: AgentId.FamilyDigest, label: 'Family Digest', desc: 'Weekly plain-English summary of every child’s momentum.' },
      { agent: AgentId.EarlyWarning, label: 'Risk Alerts', desc: 'Alerts fire before grades collapse — not after.' },
      { agent: AgentId.Escalation, label: 'Book Support', desc: 'One tap from an alert to a vetted tutor session.', tariff: 'tutor_session_short' },
      { agent: AgentId.Reporting, label: 'Progress Reports', desc: 'The same mastery record their teachers see.', tariff: 'diagnostic_results' },
    ],
  },
  teacher: {
    label: 'Teacher',
    strap: 'Intervene weeks before mocks.',
    hash: 'teacher',
    dashboard: 'teacher',
    modules: [
      { agent: AgentId.ClassCockpit, label: 'Class Cockpit', desc: 'Mastery heatmap: students × spec topics, flagged at-risk.' },
      { agent: AgentId.Assignment, label: 'Assignment Review', desc: 'AI pre-marks against the mark scheme; you approve.', tariff: 'assignment_review' },
      { agent: AgentId.ContentForge, label: 'Lesson Content', desc: 'Interactive lessons and quizzes aligned to your board.', tariff: 'interactive_lesson' },
      { agent: AgentId.Reporting, label: 'Parent Reporting', desc: 'Evidence-backed reports generated, not typed.' },
    ],
  },
  school_admin: {
    label: 'School',
    strap: 'Whole-cohort intelligence.',
    hash: 'school',
    dashboard: 'school',
    plans: SCHOOL_PLANS,
    modules: [
      { agent: AgentId.CohortAnalytics, label: 'Cohort Health Map', desc: 'Predicted vs target by department, year and class.' },
      { agent: AgentId.EarlyWarning, label: 'Early-Warning Board', desc: 'Every at-risk student, ranked by intervention urgency.' },
      { agent: AgentId.Taxonomy, label: 'Curriculum Coverage', desc: 'Spec coverage and pace across every teaching group.' },
      { agent: AgentId.FraudBillingOps, label: 'Shared ACU Pool', desc: 'One pool, per-department allocations, zero surprise bills.' },
    ],
  },
  tutor: {
    label: 'Tutor',
    strap: 'Teach more, admin less.',
    hash: 'tutor',
    dashboard: 'tutor',
    modules: [
      { agent: AgentId.MarketplaceMatch, label: 'Get Booked', desc: 'Publish availability & offerings; matched to demand.' },
      { agent: AgentId.SessionPrep, label: 'Session Prep', desc: 'Arrive knowing exactly what the student got wrong last week.', tariff: 'paper_analysis' },
      { agent: AgentId.TutorWorkspace, label: 'Tutor Workspace', desc: 'Notes, consent-scoped mastery views, session history.' },
      { agent: AgentId.Reporting, label: 'Earnings', desc: 'Pipeline, payouts and repeat-booking analytics.' },
    ],
  },
  platform_admin: {
    label: 'Admin',
    strap: 'Run the platform inside the margin band.',
    hash: 'admin',
    dashboard: 'admin',
    modules: [
      { agent: AgentId.FraudBillingOps, label: 'Billing Ops', desc: `Per-action margin vs the ${Math.round(MARGIN.FLOOR * 100)}% floor; cost trigger at ${Math.round(MARGIN.COST_TRIGGER * 100)}% of revenue.` },
      { agent: AgentId.Moderation, label: 'Moderation', desc: 'Content and marketplace safety queues.' },
      { agent: AgentId.ContentVerification, label: 'Content Verification', desc: 'Board-alignment checks on generated material.' },
      { agent: AgentId.Integrity, label: 'Integrity', desc: 'Academic-integrity signals across submissions.' },
    ],
  },
};

const poundsFor = (acus: number) => `£${(acus / ACU_PER_POUND).toFixed(2)}`;
// deterministic thousands separator — toLocaleString() differs between build-time
// Node and the browser, which breaks hydration
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const price = (pence: number) => (pence === 0 ? 'Free' : `£${(pence / 100).toFixed(pence % 100 ? 2 : 0)}/mo`);

export default function OSShell() {
  const [role, setRole] = useState<Role>('student');

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace('#', '');
      const match = ROLES.find((r) => PERSONAS[r].hash === h);
      if (match) setRole(match);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const p = PERSONAS[role];
  const walletAcus = 512; // demo balance — production reads the ledger via backend/functions
  const deepSessions = useMemo(() => Math.floor(walletAcus / ACU_TARIFF.tutor_session_deep), [walletAcus]);

  return (
    <main className="os">
      {/* raw injection: <style>{text}</style> gets entity-escaped by SSR but parsed
          raw by the browser, which guarantees a hydration mismatch */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="bar">
        <a className="logo" href="../">Stud<b>Year</b> <span className="os-tag">OS</span></a>
        <nav className="switch" aria-label="Choose your role">
          {ROLES.map((r) => (
            <button key={r} className={r === role ? 'on' : ''} onClick={() => { setRole(r); window.location.hash = PERSONAS[r].hash; }}>
              {PERSONAS[r].label}
            </button>
          ))}
        </nav>
        <div className="wallet" title={`£1 = ${ACU_PER_POUND} ACUs · hard stop at zero — no surprise bills`}>
          <span className="dot" /> {walletAcus} ACUs <small>≈ {deepSessions} deep sessions</small>
        </div>
      </header>

      <section className="hero">
        <p className="kicker">{p.label} console</p>
        <h1>{p.strap}</h1>
        <p className="lede">
          Every surface below reads the same live mastery record. Prepaid ACU wallet — {ACU_PER_POUND} ACUs to the pound,
          a hard stop at zero, and the free tier ships {FREE_TIER.acusPerQuarter} ACUs a quarter.
        </p>
        <div className="cta">
          <a className="btn gold" href={`../dashboards/#${p.dashboard}`}>Open {p.label.toLowerCase()} analytics →</a>
          {role === 'student' && <a className="btn ghost" href="../study/">Open study workspace</a>}
        </div>
      </section>

      <section className="modules">
        {p.modules.map((m) => (
          <article key={m.agent + m.label} className="mod">
            <div className="agent">{m.agent}</div>
            <h3>{m.label}</h3>
            <p>{m.desc}</p>
            <div className="foot">
              {m.tariff ? (
                <span className="tariff">{ACU_TARIFF[m.tariff]} ACUs · {poundsFor(ACU_TARIFF[m.tariff])}</span>
              ) : (
                <span className="tariff free">included</span>
              )}
              <span className="go">launch →</span>
            </div>
          </article>
        ))}
      </section>

      {p.plans && (
        <section className="plans">
          <h2>{p.label} plans</h2>
          <div className="plan-row">
            {p.plans.map((pl) => (
              <article key={pl.id} className="plan">
                <h4>{pl.label}</h4>
                <div className="pv">{price(pl.monthlyPence)}</div>
                <div className="pa">{fmt(pl.acus)} ACUs{pl.monthlyPence === 0 ? ' / quarter' : ' / month'}</div>
                {pl.positioning && <p>{pl.positioning}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="os-foot">
        <a href="../">Home</a>
        <a href="../study/">Study workspace</a>
        <a href="../dashboards/">Analytics</a>
        <span>© StudYear — the AI Academic Operating System</span>
      </footer>
    </main>
  );
}

const CSS = `
  .os{min-height:100vh;max-width:1240px;margin:0 auto;padding:0 32px 60px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  .os a{text-decoration:none;color:inherit}
  .bar{display:flex;align-items:center;gap:18px;padding:20px 0;border-bottom:1px solid rgba(212,175,55,.14);flex-wrap:wrap}
  .logo{font-family:Georgia,serif;font-size:22px;color:#EDF1F8}
  .logo b{color:#D4AF37;font-weight:600}
  .os-tag{font-size:10px;letter-spacing:.2em;border:1px solid rgba(212,175,55,.5);border-radius:4px;padding:2px 6px;color:#E3C567;vertical-align:middle}
  .switch{display:flex;gap:4px;flex-wrap:wrap;margin:0 auto}
  .switch button{appearance:none;background:none;border:1px solid transparent;border-radius:8px;color:#AAB6CC;
    font:600 13px inherit;padding:8px 14px;cursor:pointer}
  .switch button:hover{color:#EDF1F8}
  .switch button.on{color:#F2DCA0;border-color:rgba(212,175,55,.5);background:rgba(212,175,55,.1)}
  .wallet{border:1px solid rgba(212,175,55,.4);border-radius:20px;padding:7px 16px;font-size:13px;color:#F2DCA0;display:flex;align-items:center;gap:8px}
  .wallet small{color:#6B7A96}
  .dot{width:8px;height:8px;border-radius:50%;background:#5CBB7B;display:inline-block}
  .hero{padding:54px 0 34px}
  .kicker{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#D4AF37;margin-bottom:12px}
  .hero h1{font-family:Georgia,serif;font-weight:500;font-size:42px;letter-spacing:-.01em;margin:0}
  .lede{color:#AAB6CC;max-width:68ch;margin-top:12px;font-weight:300}
  .cta{display:flex;gap:12px;margin-top:22px;flex-wrap:wrap}
  .btn{border-radius:9px;padding:11px 20px;font-size:14px;font-weight:600;display:inline-block}
  .btn.gold{background:#D4AF37;color:#060B18}
  .btn.gold:hover{background:#E3C567}
  .btn.ghost{border:1px solid rgba(170,182,204,.35);color:#EDF1F8}
  .modules{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
  .mod{border:1px solid rgba(212,175,55,.14);border-radius:14px;padding:18px 20px;
    background:linear-gradient(180deg,rgba(16,27,51,.62),rgba(11,18,32,.9));transition:border-color .12s}
  .mod:hover{border-color:#D4AF37}
  .agent{font-size:10px;letter-spacing:.18em;color:#6B7A96;margin-bottom:8px}
  .mod h3{font-family:Georgia,serif;font-weight:500;font-size:18px;margin:0 0 6px}
  .mod p{font-size:13.5px;color:#AAB6CC;margin:0;min-height:40px}
  .foot{display:flex;justify-content:space-between;align-items:center;margin-top:14px}
  .tariff{font-size:12px;color:#F2DCA0}
  .tariff.free{color:#5CBB7B}
  .go{font-size:12px;color:#6B7A96}
  .mod:hover .go{color:#E3C567}
  .plans{margin-top:44px}
  .plans h2{font-family:Georgia,serif;font-weight:500;font-size:24px;border-bottom:1px solid rgba(212,175,55,.14);padding-bottom:12px}
  .plan-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}
  .plan{border:1px solid rgba(212,175,55,.14);border-radius:12px;padding:16px;background:rgba(16,27,51,.5)}
  .plan h4{margin:0;font-size:13px;letter-spacing:.04em}
  .pv{font-family:Georgia,serif;font-size:26px;color:#F2DCA0;margin-top:6px}
  .pa{font-size:12px;color:#6B7A96}
  .plan p{font-size:12.5px;color:#AAB6CC;margin:8px 0 0}
  .os-foot{display:flex;gap:22px;margin-top:56px;padding-top:18px;border-top:1px solid rgba(212,175,55,.14);
    font-size:12.5px;color:#6B7A96;flex-wrap:wrap}
  .os-foot a{color:#AAB6CC}
  .os-foot a:hover{color:#F2DCA0}
  .os-foot span{margin-left:auto}
  @media(max-width:900px){.modules{grid-template-columns:1fr}.hero h1{font-size:32px}.switch{order:3;width:100%}}
`;
