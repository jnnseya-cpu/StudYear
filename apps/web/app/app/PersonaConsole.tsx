'use client';

import { useMemo } from 'react';
import { ACU_PER_POUND, ACU_TARIFF, FREE_TIER } from '@studyear/shared';
import { PERSONAS, type Persona } from './personas';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const poundsFor = (acus: number) => `£${(acus / ACU_PER_POUND).toFixed(2)}`;
// deterministic thousands separator — toLocaleString() differs between build-time
// Node and the browser, which breaks hydration
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const price = (pence: number) => (pence === 0 ? 'Free' : `£${(pence / 100).toFixed(pence % 100 ? 2 : 0)}/mo`);

export default function PersonaConsole({ persona: p }: { persona: Persona }) {
  const walletAcus = 512; // demo balance — production reads the ledger via backend/functions
  const deepSessions = useMemo(() => Math.floor(walletAcus / ACU_TARIFF.tutor_session_deep), [walletAcus]);

  return (
    <main className="os">
      {/* raw injection: <style>{text}</style> gets entity-escaped by SSR but parsed
          raw by the browser, which guarantees a hydration mismatch */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="bar">
        <a className="logo" href={`${BASE}/`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mark" src={`${BASE}/logo.svg`} alt="" width={34} height={34} />
          Stud<b>Year</b> <span className="os-tag">OS</span>
        </a>
        <div className="acct">
          <span className="avatar">{p.account.name[0]}</span>
          <span>
            <b>{p.account.name}</b>
            <small>{p.account.detail}</small>
          </span>
        </div>
        <div className="wallet" title={`£1 = ${ACU_PER_POUND} ACUs · hard stop at zero — no surprise bills`}>
          <span className="dot" /> {walletAcus} ACUs <small>≈ {deepSessions} deep sessions</small>
        </div>
        <a className="switch-acct" href={`${BASE}/app/`}>Switch account</a>
      </header>

      <section className="hero">
        <p className="kicker">{p.label} console</p>
        <h1>{p.strap}</h1>
        <p className="lede">
          Your own console, your own dashboard. Prepaid ACU wallet — {ACU_PER_POUND} ACUs to the pound,
          a hard stop at zero, and the free tier ships {FREE_TIER.acusPerQuarter} ACUs a quarter.
        </p>
        <div className="cta">
          <a className="btn gold" href={p.dashboard ? `${BASE}/dashboards/${p.dashboard}/` : `${BASE}/dashboards/`}>
            Open my {p.label.toLowerCase()} dashboard →
          </a>
          {p.slug === 'student' && <a className="btn ghost" href={`${BASE}/study/`}>Open study workspace</a>}
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
        <a href={`${BASE}/`}>Home</a>
        <a href={`${BASE}/app/`}>All consoles</a>
        {PERSONAS.filter((x) => x.slug !== p.slug).map((x) => (
          <a key={x.slug} href={`${BASE}/app/${x.slug}/`}>{x.label}</a>
        ))}
        <span>© StudYear — the AI Academic Operating System</span>
      </footer>
    </main>
  );
}

const CSS = `
  .os{min-height:100vh;max-width:1240px;margin:0 auto;padding:0 32px 60px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  .os a{text-decoration:none;color:inherit}
  .bar{display:flex;align-items:center;gap:18px;padding:20px 0;border-bottom:1px solid rgba(77,157,224,.14);flex-wrap:wrap}
  .logo{font-family:Georgia,serif;font-size:22px;color:#EDF1F8;display:inline-flex;align-items:center;gap:10px}
  .logo .mark{filter:drop-shadow(0 0 12px rgba(79,166,224,.45))}
  .logo b{color:#4FA6E0;font-weight:600}
  .os-tag{font-size:10px;letter-spacing:.2em;border:1px solid rgba(79,166,224,.5);border-radius:4px;padding:2px 6px;color:#5FA8E0;vertical-align:middle}
  .acct{display:flex;align-items:center;gap:11px;margin:0 auto}
  .acct .avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;
    background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff;font-weight:700;font-size:15px}
  .acct b{display:block;font-size:13.5px;color:#EDF1F8;font-weight:600}
  .acct small{display:block;font-size:11px;color:#6B7A96}
  .switch-acct{font-size:12px;color:#AAB6CC;border:1px solid rgba(170,182,204,.3);border-radius:8px;padding:8px 14px}
  .switch-acct:hover{color:#A9CFF2;border-color:#3D8FD1}
  .wallet{border:1px solid rgba(79,166,224,.4);border-radius:20px;padding:7px 16px;font-size:13px;color:#A9CFF2;display:flex;align-items:center;gap:8px}
  .wallet small{color:#6B7A96}
  .dot{width:8px;height:8px;border-radius:50%;background:#5CBB7B;display:inline-block}
  .hero{padding:54px 0 34px}
  .kicker{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#3D8FD1;margin-bottom:12px}
  .hero h1{font-family:Georgia,serif;font-weight:500;font-size:42px;letter-spacing:-.01em;margin:0}
  .lede{color:#AAB6CC;max-width:68ch;margin-top:12px;font-weight:300}
  .cta{display:flex;gap:12px;margin-top:22px;flex-wrap:wrap}
  .btn{border-radius:9px;padding:11px 20px;font-size:14px;font-weight:600;display:inline-block}
  .btn.gold{background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff}
  .btn.gold:hover{filter:brightness(1.12)}
  .btn.ghost{border:1px solid rgba(170,182,204,.35);color:#EDF1F8}
  .modules{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
  .mod{border:1px solid rgba(77,157,224,.14);border-radius:14px;padding:18px 20px;
    background:linear-gradient(180deg,rgba(16,27,51,.62),rgba(11,18,32,.9));transition:border-color .12s}
  .mod:hover{border-color:#3D8FD1}
  .agent{font-size:10px;letter-spacing:.18em;color:#6B7A96;margin-bottom:8px}
  .mod h3{font-family:Georgia,serif;font-weight:500;font-size:18px;margin:0 0 6px}
  .mod p{font-size:13.5px;color:#AAB6CC;margin:0;min-height:40px}
  .foot{display:flex;justify-content:space-between;align-items:center;margin-top:14px}
  .tariff{font-size:12px;color:#A9CFF2}
  .tariff.free{color:#5CBB7B}
  .go{font-size:12px;color:#6B7A96}
  .mod:hover .go{color:#5FA8E0}
  .plans{margin-top:44px}
  .plans h2{font-family:Georgia,serif;font-weight:500;font-size:24px;border-bottom:1px solid rgba(77,157,224,.14);padding-bottom:12px}
  .plan-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}
  .plan{border:1px solid rgba(77,157,224,.14);border-radius:12px;padding:16px;background:rgba(16,27,51,.5)}
  .plan h4{margin:0;font-size:13px;letter-spacing:.04em}
  .pv{font-family:Georgia,serif;font-size:26px;color:#A9CFF2;margin-top:6px}
  .pa{font-size:12px;color:#6B7A96}
  .plan p{font-size:12.5px;color:#AAB6CC;margin:8px 0 0}
  .os-foot{display:flex;gap:20px;margin-top:56px;padding-top:18px;border-top:1px solid rgba(77,157,224,.14);
    font-size:12.5px;color:#6B7A96;flex-wrap:wrap}
  .os-foot a{color:#AAB6CC}
  .os-foot a:hover{color:#A9CFF2}
  .os-foot span{margin-left:auto}
  @media(max-width:900px){.modules{grid-template-columns:1fr}.hero h1{font-size:32px}.acct{order:3;width:100%}}
`;
