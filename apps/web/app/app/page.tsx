'use client';

import { useEffect } from 'react';
import { PERSONAS } from './personas';

/**
 * /app — account chooser. Every user category has its own console route
 * (/app/student/, /app/parent/, …) and its own dashboard
 * (/dashboards/student/, …); this page is the front door between them.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function AccountChooser() {
  // legacy deep links: /app#school → /app/school/
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (PERSONAS.some((p) => p.slug === h)) window.location.replace(`${BASE}/app/${h}/`);
  }, []);

  return (
    <main className="pick-os">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="bar">
        <a className="logo" href={`${BASE}/`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mark" src={`${BASE}/logo.svg`} alt="" width={34} height={34} />
          Stud<b>Year</b> <span className="os-tag">OS</span>
        </a>
      </header>

      <section className="hero">
        <p className="kicker">Choose your account</p>
        <h1>One OS. A console for every seat at the table.</h1>
        <p className="lede">
          Each user category gets its own account, its own console and its own dashboard —
          all reading the same live mastery record.
        </p>
      </section>

      <section className="cards">
        {PERSONAS.map((p) => (
          <a key={p.slug} className="pcard" href={`${BASE}/app/${p.slug}/`}>
            <span className="avatar">{p.label[0]}</span>
            <span className="who">{p.label}</span>
            <h2>{p.strap}</h2>
            <span className="acct">{p.account.name} · {p.account.detail}</span>
            <span className="go">Enter {p.label.toLowerCase()} console →</span>
          </a>
        ))}
      </section>

      <footer className="os-foot">
        <a href={`${BASE}/`}>Home</a>
        <a href={`${BASE}/study/`}>Study workspace</a>
        <a href={`${BASE}/dashboards/`}>Dashboards</a>
        <span>© StudYear — the AI Academic Operating System</span>
      </footer>
    </main>
  );
}

const CSS = `
  .pick-os{min-height:100vh;max-width:1240px;margin:0 auto;padding:0 32px 60px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  .pick-os a{text-decoration:none;color:inherit}
  .bar{display:flex;align-items:center;gap:18px;padding:20px 0;border-bottom:1px solid rgba(77,157,224,.14)}
  .logo{font-family:Georgia,serif;font-size:22px;color:#EDF1F8;display:inline-flex;align-items:center;gap:10px}
  .logo .mark{filter:drop-shadow(0 0 12px rgba(79,166,224,.45))}
  .logo b{color:#4FA6E0;font-weight:600}
  .os-tag{font-size:10px;letter-spacing:.2em;border:1px solid rgba(79,166,224,.5);border-radius:4px;padding:2px 6px;color:#5FA8E0;vertical-align:middle}
  .hero{padding:56px 0 20px}
  .kicker{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#3D8FD1;margin-bottom:12px}
  .hero h1{font-family:Georgia,serif;font-weight:500;font-size:40px;letter-spacing:-.01em;margin:0;max-width:24ch}
  .lede{color:#AAB6CC;max-width:64ch;margin-top:12px;font-weight:300}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:34px}
  .pcard{display:flex;flex-direction:column;gap:8px;border:1px solid rgba(77,157,224,.14);border-radius:16px;
    padding:26px 26px 22px;background:linear-gradient(180deg,rgba(16,27,51,.62),rgba(11,18,32,.9));
    transition:border-color .15s,transform .15s;position:relative}
  .pcard:hover{border-color:#3D8FD1;transform:translateY(-4px)}
  .avatar{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;
    background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff;font-weight:700;font-size:17px;margin-bottom:6px}
  .who{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:#5FA8E0}
  .pcard h2{font-family:Georgia,serif;font-weight:500;font-size:21px;color:#EDF1F8;margin:2px 0 4px;line-height:1.3}
  .acct{font-size:12px;color:#6B7A96}
  .go{font-size:12.5px;color:#6B7A96;margin-top:12px}
  .pcard:hover .go{color:#A9CFF2}
  .os-foot{display:flex;gap:22px;margin-top:56px;padding-top:18px;border-top:1px solid rgba(77,157,224,.14);
    font-size:12.5px;color:#6B7A96;flex-wrap:wrap}
  .os-foot a{color:#AAB6CC}
  .os-foot a:hover{color:#A9CFF2}
  .os-foot span{margin-left:auto}
  @media(max-width:960px){.cards{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){.cards{grid-template-columns:1fr}.hero h1{font-size:31px}}
`;
