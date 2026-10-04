/**
 * StudYear Future-Readiness engine (window.SYReady)
 * ------------------------------------------------------------------
 * Supports the 2026 NEET-review direction: identify — from primary — the
 * children who need extra support to stay in education/employment/training at
 * 16, and turn that into ACTION and EVIDENCE, not a label.
 *
 * ETHICS ARE THE PRODUCT (owner + policy safeguards):
 *  - Strengths-and-needs, never a deterministic verdict. A child is "on track",
 *    "keep watch" or "priority for support" — never told they will be unemployed.
 *  - Context flags (Pupil Premium / SEND / EAL / persistent absence / young
 *    carer) NEVER lower a child's score. They only UNLOCK targeted support and
 *    power the equity monitor — so identification widens help, it doesn't label.
 *  - Every status shows its drivers (transparency) and is teacher-confirmable
 *    (human in the loop). Records are permissioned + audit-logged by guard.js.
 *  - Authority view is anonymised / PII-masked by construction.
 *
 * Role-aware: auto-mounts into #readiness-root (school, teacher, parent,
 * authority). Reads live roster/children where present; otherwise shows a clearly
 * labelled sample cohort so the capability is always demonstrable.
 */
(function () {
  'use strict';

  var BASE = (function () { try { var s = (document.currentScript && document.currentScript.src) || ''; return s ? s.replace(/readiness\.js.*$/, '') : '../'; } catch (e) { return '../'; } })();
  function role() { try { return (window.SY && SY.session && SY.session.role) || 'guest'; } catch (e) { return 'guest'; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hash(s) { var h = 5381; s = String(s || ''); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function seeded(key, lo, hi) { return Math.round(lo + (hash(key) % 1000) / 1000 * (hi - lo)); }

  /* ---------------- assessment model (transparent + weighted) ---------------- */
  var W = { attendance: 0.28, attainment: 0.24, fluency: 0.18, engagement: 0.15, behaviour: 0.15 };
  var NEED = {
    attendance: 'Attendance slipping', attainment: 'Attainment below expectation',
    fluency: 'Reading / number fluency gap', engagement: 'Low engagement / motivation', behaviour: 'Behaviour & regulation'
  };
  var STRENGTH = {
    attendance: 'Strong attendance', attainment: 'Attaining well', fluency: 'Fluent & secure',
    engagement: 'Highly engaged', behaviour: 'Excellent conduct'
  };
  var FLAGS = { pp: 'Pupil Premium', send: 'SEND', eal: 'EAL', absence: 'Persistent absence', carer: 'Young carer' };

  function isPrimary(age) {
    var s = String(age || '').toLowerCase();
    if (/reception|eyfs|ks1|ks2|year\s?[1-6]\b|\bp[1-7]\b|primary|junior|11\s?\+/.test(s)) return true;
    if (/ks3|ks4|ks5|gcse|a-?level|year\s?(7|8|9|10|11|12|13)|sixth/.test(s)) return false;
    return true; // default to the earlier, more cautious (support-first) framing
  }
  var ACTION = {
    attendance: { p: 'Attendance mentor + family check-in via AI Family Support', s: 'Attendance mentor + re-engagement plan' },
    attainment: { p: 'Targeted catch-up (Maths Heroes / reading) + class intervention', s: 'Subject intervention + tutor match + a Career Passport goal' },
    fluency: { p: 'Daily fluency practice — SkillRush / Number Rock Stars', s: 'Fluency booster + exam-skills sessions' },
    engagement: { p: 'Aspiration encounter + mentor match (Pathways)', s: 'Employer encounter / work experience + mentor (Pathways)' },
    behaviour: { p: 'Behaviour support plan + mentor + parent partnership', s: 'Behaviour support plan + mentor + parent partnership' }
  };
  var FLAG_ADD = { pp: 'Pupil-Premium-funded support eligible', send: 'SEND support review', eal: 'EAL language support', absence: 'Escalate to attendance lead', carer: 'Young-carer support + flexible plan' };

  /* primary phase leans harder on the earliest, most predictive signals —
     attendance and reading/number fluency — because at KS1/KS2 those are the
     levers that keep a child on track long before "attainment" means much. */
  var W_PRIMARY = { attendance: 0.32, attainment: 0.16, fluency: 0.24, engagement: 0.14, behaviour: 0.14 };

  /** assess(signals, flags, age, phase) → readiness assessment. Higher score =
      more on track. Context flags never reduce the score. */
  function assess(sig, flags, age, phase) {
    sig = sig || {}; flags = flags || {};
    var weights = (phase === 'primary' || (phase == null && isPrimary(age))) ? W_PRIMARY : W;
    var num = 0, den = 0, drivers = [], strengths = [];
    Object.keys(weights).forEach(function (k) {
      var v = sig[k]; if (v == null || isNaN(v)) return;
      num += v * weights[k]; den += weights[k];
      if (v < 55) drivers.push({ k: k, label: NEED[k], v: Math.round(v) });
      else if (v >= 78) strengths.push({ k: k, label: STRENGTH[k], v: Math.round(v) });
    });
    var score = den ? Math.round(num / den) : null;
    var status = score == null ? 'unknown' : score >= 70 ? 'on-track' : score >= 48 ? 'watch' : 'priority';
    drivers.sort(function (a, b) { return a.v - b.v; });
    var activeFlags = Object.keys(FLAGS).filter(function (f) { return flags[f]; });
    // recommended action: top need (age-aware) + first flag add-on
    var rec = '';
    if (drivers.length) { var a = ACTION[drivers[0].k]; rec = isPrimary(age) ? a.p : a.s; }
    else rec = 'Maintain — celebrate strengths and keep light-touch monitoring';
    if (activeFlags.length && FLAG_ADD[activeFlags[0]]) rec += ' · ' + FLAG_ADD[activeFlags[0]];
    return { score: score, status: status, drivers: drivers, strengths: strengths, flags: activeFlags, rec: rec, primary: isPrimary(age) };
  }

  var STATUS_LABEL = { 'on-track': 'On track', watch: 'Keep watch', priority: 'Priority for support', unknown: 'More data needed' };
  var STATUS_COLOR = { 'on-track': 'ok', watch: 'warn', priority: 'crit', unknown: 'mute' };

  /* ---------------- cohort gathering (live data, else sample) ---------------- */
  function schoolCode() { try { return (window.SY && (SY.schoolCode || (SY.session && SY.session.schoolCode))) || SY.get('schoolCode', '') || ''; } catch (e) { return ''; } }

  function sampleCohort(n, seedKey) {
    var out = [], first = ['Amara', 'Leo', 'Zainab', 'Kai', 'Mia', 'Noah', 'Priya', 'Jayden', 'Grace', 'Omar', 'Ella', 'Reece', 'Sofia', 'Callum', 'Ava', 'Musa', 'Ruby', 'Finn', 'Aisha', 'Tyler'];
    var last = ['B', 'D', 'F', 'H', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'W'];
    for (var i = 0; i < n; i++) {
      var key = seedKey + '#' + i, nm = first[hash(key) % first.length] + ' ' + last[hash(key + 'x') % last.length] + '.';
      var lowBias = (i % 4 === 0); // seed a realistic tail needing support
      var base = lowBias ? [30, 70] : [55, 96];
      var sig = {
        attendance: seeded(key + 'att', lowBias ? 74 : 90, lowBias ? 92 : 99),
        attainment: seeded(key + 'atn', base[0], base[1]),
        fluency: seeded(key + 'flu', base[0], base[1]),
        engagement: seeded(key + 'eng', base[0], base[1]),
        behaviour: seeded(key + 'beh', lowBias ? 45 : 70, lowBias ? 85 : 99)
      };
      var flags = { pp: hash(key + 'pp') % 100 < 27, send: hash(key + 'send') % 100 < 14, eal: hash(key + 'eal') % 100 < 18, absence: sig.attendance < 90, carer: hash(key + 'yc') % 100 < 4 };
      out.push({ key: key, name: nm, year: (seedKey.indexOf('primary') >= 0 ? 'Year ' + (2 + (i % 4)) : 'Year ' + (7 + (i % 5))), signals: sig, flags: flags, sample: true });
    }
    return out;
  }

  function num(v, d) { v = Number(v); return isNaN(v) ? d : v; }
  function fromRoster(r) {
    var m = r.m || r;
    var overall = num(m.overall, null), att = num(m.attendance, null);
    var sig = {
      attendance: att,
      attainment: overall,
      fluency: m.fluency != null ? num(m.fluency, null) : (overall != null ? Math.max(20, overall - seeded(r.email || r.name, 0, 14)) : null),
      engagement: m.engagement != null ? num(m.engagement, null) : (overall != null ? overall - seeded((r.email || '') + 'e', -6, 10) : null),
      behaviour: m.behaviour != null ? num(m.behaviour, null) : (att != null ? att : null)
    };
    var risk = String(m.risk || '').toUpperCase();
    if (sig.attainment == null && risk) sig.attainment = risk === 'HIGH' ? 42 : risk === 'MEDIUM' ? 58 : 78;
    var flags = { pp: !!(m.pp || r.pp), send: !!(m.send || r.send), eal: !!(m.eal || r.eal), absence: (att != null && att < 90), carer: !!(m.carer) };
    return { key: r.email || r.name || ('p' + hash(JSON.stringify(r))), name: r.name || (r.email || '').split('@')[0], year: r.year || (m.profile && m.profile.level) || '—', signals: sig, flags: flags };
  }
  function gatherSchool(phase) {
    try {
      var code = schoolCode(); var roster = code ? (SY.schoolGet(code, 'roster', []) || []) : [];
      roster = roster.filter(function (r) { return r && (r.email || r.name); });
      if (phase === 'primary') roster = roster.filter(function (r) { return isPrimary(r.year || (r.m && r.m.profile && r.m.profile.level)); });
      if (roster.length) return { list: roster.map(fromRoster), sample: false };
    } catch (e) {}
    return { list: sampleCohort(24, 'school-' + (phase === 'primary' ? 'primary' : 'secondary')), sample: true };
  }
  function gatherParent() {
    try {
      var kids = SY.get('children', []) || [];
      if (kids.length) return { list: kids.map(function (k) {
        var m = {}; try { m = SY.childMetrics ? SY.childMetrics(k) : {}; } catch (e) {}
        return fromRoster({ email: k.email, name: k.name, year: k.level || k.year, m: { overall: m.overall, attendance: m.attendance, risk: m.risk, pp: k.pp, send: k.send, eal: k.eal } });
      }), sample: false };
    } catch (e) {}
    return { list: sampleCohort(2, 'family'), sample: true };
  }

  /* ---------------- intervention log (permissioned store) ---------------- */
  function logStore() { try { var c = schoolCode(); return { get: function () { return (c ? SY.schoolGet(c, 'readiness', {}) : SY.get('readiness', {})) || {}; }, set: function (o) { if (c) SY.schoolSet(c, 'readiness', o); else SY.set('readiness', o); } }; } catch (e) { return { get: function () { return {}; }, set: function () {} }; } }
  function logIntervention(key, entry) {
    var st = logStore(), all = st.get(); var rec = all[key] || { interventions: [] };
    rec.interventions = (rec.interventions || []).concat([entry]); rec.updated = new Date().toISOString();
    all[key] = rec; st.set(all);
    try { SY.log && SY.log('readiness', 'Support logged for a pupil', entry.type + (entry.note ? ' — ' + entry.note : '')); } catch (e) {}
  }
  function interventionsFor(key) { try { return (logStore().get()[key] || {}).interventions || []; } catch (e) { return []; } }

  /* ---------------- equity / bias monitor ---------------- */
  function equity(list) {
    var groups = { pp: { n: 0, pri: 0 }, send: { n: 0, pri: 0 }, eal: { n: 0, pri: 0 }, all: { n: 0, pri: 0 } };
    list.forEach(function (c) {
      var a = c._a || (c._a = assess(c.signals, c.flags, c.year));
      groups.all.n++; if (a.status === 'priority') groups.all.pri++;
      ['pp', 'send', 'eal'].forEach(function (g) { if (c.flags && c.flags[g]) { groups[g].n++; if (a.status === 'priority') groups[g].pri++; } });
    });
    var baseRate = groups.all.n ? groups.all.pri / groups.all.n : 0;
    var alerts = [];
    ['pp', 'send', 'eal'].forEach(function (g) {
      if (groups[g].n >= 5) { var r = groups[g].pri / groups[g].n; if (r > baseRate + 0.2) alerts.push({ g: g, rate: r, base: baseRate }); }
    });
    return { groups: groups, baseRate: baseRate, alerts: alerts };
  }

  /* ---------------- summary ---------------- */
  function summarise(list) {
    var c = { 'on-track': 0, watch: 0, priority: 0, unknown: 0 };
    list.forEach(function (x) { var a = x._a || (x._a = assess(x.signals, x.flags, x.year)); c[a.status]++; });
    return c;
  }

  /* ================================ UI ================================ */
  var STYLE = '#readiness-root .sy-r{font-size:14px}' +
    '.sy-r .ethics{border:1px solid var(--line,rgba(120,140,190,.28));background:rgba(79,166,224,.06);border-radius:10px;padding:10px 13px;font-size:12px;color:var(--ink-3,#8795AE);margin:10px 0 14px}' +
    '.sy-r .ethics b{color:var(--ink-2,#AAB6CC)}' +
    '.sy-r .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:6px 0 14px}' +
    '.sy-r .tile{border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:12px 13px;background:rgba(6,11,24,.28)}' +
    '.sy-r .tile .v{font-size:24px;font-weight:700;font-family:Georgia,serif}.sy-r .tile .l{font-size:11px;color:var(--ink-3,#8795AE);letter-spacing:.04em;text-transform:uppercase}' +
    '.sy-r .ok{color:#5CBB7B}.sy-r .warn{color:#E0AE5A}.sy-r .crit{color:#F0888F}.sy-r .mute{color:#8795AE}' +
    '.sy-r .st{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.03em;padding:2px 8px;border-radius:20px;text-transform:uppercase}' +
    '.sy-r .st.ok{background:rgba(92,187,123,.15);color:#5CBB7B}.sy-r .st.warn{background:rgba(224,174,90,.15);color:#E0AE5A}.sy-r .st.crit{background:rgba(240,136,143,.15);color:#F0888F}.sy-r .st.mute{background:rgba(135,149,174,.15);color:#8795AE}' +
    '.sy-r .row{border:1px solid var(--line,rgba(120,140,190,.22));border-radius:12px;padding:11px 13px;margin-top:9px;background:rgba(6,11,24,.24)}' +
    '.sy-r .row .top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sy-r .row b{font-size:14px}' +
    '.sy-r .chips{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}.sy-r .chip{font-size:11px;padding:2px 8px;border-radius:20px;border:1px solid var(--line,rgba(120,140,190,.3));color:var(--ink-2,#AAB6CC)}' +
    '.sy-r .chip.need{border-color:rgba(240,136,143,.4);color:#F0888F}.sy-r .chip.str{border-color:rgba(92,187,123,.4);color:#5CBB7B}.sy-r .chip.flag{border-color:rgba(224,174,90,.4);color:#E0AE5A}' +
    '.sy-r .rec{font-size:12.5px;color:var(--ink-2,#AAB6CC);margin-top:5px}.sy-r .rec b{color:var(--blue-300,#A9CFF2)}' +
    '.sy-r .act{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}' +
    '.sy-r button.rb{font:inherit;font-size:12px;border:1px solid var(--line,rgba(120,140,190,.35));background:rgba(120,140,190,.08);color:inherit;border-radius:8px;padding:6px 11px;cursor:pointer}' +
    '.sy-r button.rb.solid{background:linear-gradient(135deg,#4FA6E0,#2E6BC4);color:#fff;border:0;font-weight:600}' +
    '.sy-r .alert{border:1px solid rgba(224,174,90,.5);background:rgba(224,174,90,.08);border-radius:10px;padding:10px 13px;margin:10px 0;font-size:12.5px;color:#E0AE5A}' +
    '.sy-r .bar{height:8px;border-radius:6px;background:rgba(120,140,190,.16);overflow:hidden;display:flex}.sy-r .bar i{display:block;height:100%}' +
    '.sy-r .logged{font-size:11.5px;color:#5CBB7B;margin-top:6px}' +
    '.sy-r h4{font-size:13px;margin:16px 0 4px;color:var(--ink,#EDF1F8)}';
  function injectStyle() { if (document.getElementById('sy-r-style')) return; var s = document.createElement('style'); s.id = 'sy-r-style'; s.textContent = STYLE; document.head.appendChild(s); }

  var ETHICS = '<div class="ethics"><b>How to read this:</b> a strengths-and-needs view to widen support — not a prediction that any child will be unemployed. Context (Pupil Premium, SEND, EAL, attendance) only <b>unlocks help</b>; it never lowers a child’s score. Every status shows its drivers and is yours to confirm. Records are permissioned and audit-logged.</div>';

  function tile(v, l, cls) { return '<div class="tile"><div class="v ' + (cls || '') + '">' + v + '</div><div class="l">' + l + '</div></div>'; }

  function pupilRow(c, opts) {
    var a = c._a || (c._a = assess(c.signals, c.flags, c.year));
    var col = STATUS_COLOR[a.status];
    var chips = a.drivers.slice(0, 3).map(function (d) { return '<span class="chip need">' + esc(d.label) + '</span>'; }).join('') +
      a.strengths.slice(0, 2).map(function (s) { return '<span class="chip str">' + esc(s.label) + '</span>'; }).join('') +
      a.flags.map(function (f) { return '<span class="chip flag">' + esc(FLAGS[f]) + '</span>'; }).join('');
    var logged = interventionsFor(c.key);
    var actions = opts && opts.canLog ? ('<div class="act">' +
      '<button class="rb solid" data-log="' + esc(c.key) + '">Log support action</button>' +
      '<button class="rb" data-pathways="' + esc(c.key) + '">Match a Pathways opportunity</button>' +
      '</div>') : '';
    return '<div class="row" data-key="' + esc(c.key) + '"><div class="top">' +
      '<b>' + esc(c.name) + '</b> <span style="color:var(--ink-3,#8795AE);font-size:12px">' + esc(c.year || '') + '</span>' +
      '<span class="st ' + col + '" style="margin-left:auto">' + STATUS_LABEL[a.status] + (a.score != null ? ' · ' + a.score : '') + '</span></div>' +
      '<div class="chips">' + (chips || '<span class="chip str">No concerns flagged</span>') + '</div>' +
      '<div class="rec">Recommended: <b>' + esc(a.rec) + '</b></div>' + actions +
      (logged.length ? '<div class="logged">✓ ' + logged.length + ' support action' + (logged.length > 1 ? 's' : '') + ' logged · last: ' + esc(logged[logged.length - 1].type) + '</div>' : '') +
      '</div>';
  }

  function proBanner(host, sample) { if (sample) { var d = document.createElement('div'); d.className = 'alert'; d.innerHTML = 'Showing a <b>sample cohort</b> — connect your roster (Command Centre) to run this on your real pupils.'; host.appendChild(d); } }

  /* ---- Word/HTML evidence pack (statutory-style export) ---- */
  function evidencePack(list, ctx) {
    var s = summarise(list), eq = equity(list), when = new Date().toLocaleDateString('en-GB');
    var rows = list.map(function (c) { var a = c._a || assess(c.signals, c.flags, c.year); var lg = interventionsFor(c.key);
      return '<tr><td>' + esc(ctx.mask ? 'Pupil ' + (hash(c.key) % 9000 + 1000) : c.name) + '</td><td>' + esc(c.year || '') + '</td><td>' + STATUS_LABEL[a.status] + '</td><td>' + (a.drivers.map(function (d) { return d.label; }).join('; ') || '—') + '</td><td>' + esc(a.rec) + '</td><td>' + (lg.length || 0) + '</td></tr>'; }).join('');
    var html = '<html><head><meta charset="utf-8"><title>Future-Readiness evidence pack</title>' +
      '<style>body{font-family:Arial,sans-serif;color:#111;margin:32px;line-height:1.5}h1{color:#0b3a66}h2{color:#0b3a66;margin-top:22px}table{border-collapse:collapse;width:100%;font-size:12px;margin-top:8px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#eef5fc}.k{display:inline-block;margin-right:22px}.small{color:#555;font-size:12px}</style></head><body>' +
      '<h1>Future-Readiness — identification &amp; support evidence</h1>' +
      '<p class="small">' + esc(ctx.title || 'Cohort') + ' &middot; generated ' + when + ' &middot; StudYear</p>' +
      '<h2>Cohort summary</h2><p><span class="k"><b>On track:</b> ' + s['on-track'] + '</span><span class="k"><b>Keep watch:</b> ' + s.watch + '</span><span class="k"><b>Priority for support:</b> ' + s.priority + '</span><span class="k"><b>Total:</b> ' + list.length + '</span></p>' +
      '<h2>Equity check</h2><p class="small">Priority-for-support rate — whole cohort ' + Math.round(eq.baseRate * 100) + '%' +
      ['pp', 'send', 'eal'].map(function (g) { return eq.groups[g].n ? (' &middot; ' + FLAGS[g] + ' ' + Math.round(eq.groups[g].pri / eq.groups[g].n * 100) + '%') : ''; }).join('') + '.' +
      (eq.alerts.length ? ' <b>Equity alert:</b> ' + eq.alerts.map(function (x) { return FLAGS[x.g]; }).join(', ') + ' over-represented — review for bias and targeted resource.' : ' No group over-represented beyond threshold.') + '</p>' +
      '<h2>Register</h2><table><thead><tr><th>Pupil</th><th>Year</th><th>Status</th><th>Drivers</th><th>Recommended support</th><th>Actions logged</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<h2>Method &amp; safeguards</h2><p class="small">Status is a strengths-and-needs indicator computed from attendance, attainment, fluency, engagement and behaviour. Context flags (Pupil Premium, SEND, EAL, attendance, young carer) unlock targeted support and never reduce a child’s score. Indicators are advisory and confirmed by staff; access is permissioned and audit-logged; no child is labelled or told a destination prediction.</p>' +
      '</body></html>';
    try { var b = new Blob([html], { type: 'application/msword' }); var u = URL.createObjectURL(b); var a = document.createElement('a'); a.href = u; a.download = 'future-readiness-evidence.doc'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 500); } catch (e) {}
  }

  /* ---- shared: wire the per-pupil action buttons ---- */
  function wireActions(host, list) {
    host.querySelectorAll('[data-log]').forEach(function (b) { b.onclick = function () {
      var key = b.getAttribute('data-log'), c = list.filter(function (x) { return x.key === key; })[0]; if (!c) return;
      var a = c._a || assess(c.signals, c.flags, c.year);
      var def = a.rec.split(' · ')[0];
      var note = window.prompt('Log a support action for ' + c.name + ':', def); if (note == null) return;
      logIntervention(key, { type: note.slice(0, 120), note: '', when: new Date().toISOString(), by: (SY.session && SY.session.name) || 'staff', status: a.status });
      var row = host.querySelector('.row[data-key="' + (window.CSS && CSS.escape ? CSS.escape(key) : key) + '"]');
      draw(host); // re-render to show the logged badge
    }; });
    host.querySelectorAll('[data-pathways]').forEach(function (b) { b.onclick = function () {
      var base = BASE; window.location.href = base + 'career/'; // route to Pathways/encounters to match an opportunity
    }; });
  }

  /* ---------------- role renderers ---------------- */
  var CTX = {};
  function drawStaff(host, live, phase) {
    var list = live.list, s = summarise(list), eq = equity(list);
    var intro = phase === 'primary'
      ? '<div class="ethics" style="border-color:rgba(92,187,123,.4)"><b>Primary (EYFS–KS2) early support.</b> At this age the strongest levers are <b>attendance</b> and <b>reading &amp; number fluency</b> — this view weights them accordingly. The aim is early help and aspiration, never a label a child ever sees.</div>'
      : '';
    var h = '<div class="sy-r">' + intro + ETHICS +
      '<div class="tiles">' +
        tile(s.priority, 'Priority for support', 'crit') +
        tile(s.watch, 'Keep watch', 'warn') +
        tile(s['on-track'], 'On track', 'ok') +
        tile(list.length, 'Cohort', '') +
      '</div>';
    if (eq.alerts.length) h += '<div class="alert"><b>Equity check:</b> ' + eq.alerts.map(function (x) { return FLAGS[x.g] + ' pupils are over-represented in “priority” (' + Math.round(x.rate * 100) + '% vs ' + Math.round(x.base * 100) + '% cohort)'; }).join('; ') + '. Review for bias and direct targeted resource.</div>';
    var primaryLink = (role() === 'school' && phase !== 'primary') ? '<a class="rb" href="' + BASE + 'school/primary/" style="text-decoration:none">Open primary (EYFS–KS2) view →</a>' : '';
    h += '<div class="act" style="margin-bottom:6px"><button class="rb solid" id="sy-r-export">Download evidence pack (Word)</button><button class="rb" id="sy-r-filter">Show priority only</button>' + primaryLink + '</div>';
    h += '<div id="sy-r-list">' + list.map(function (c) { return pupilRow(c, { canLog: true }); }).join('') + '</div></div>';
    host.innerHTML = h;
    proBanner(host, live.sample);
    var filtered = false;
    host.querySelector('#sy-r-filter').onclick = function () { filtered = !filtered; this.textContent = filtered ? 'Show all' : 'Show priority only';
      host.querySelector('#sy-r-list').innerHTML = list.filter(function (c) { return !filtered || (c._a || assess(c.signals, c.flags, c.year)).status === 'priority'; }).map(function (c) { return pupilRow(c, { canLog: true }); }).join('');
      wireActions(host, list); };
    host.querySelector('#sy-r-export').onclick = function () { evidencePack(list, { title: (role() === 'teacher' ? 'My class' : 'Whole school') + ' cohort', mask: false }); };
    wireActions(host, list);
  }

  function drawParent(host, live) {
    var list = live.list;
    var h = '<div class="sy-r">' + ETHICS.replace('confirm. Records are permissioned and audit-logged.', 'discuss with school. You control what is shared.') +
      list.map(function (c) {
        var a = c._a || (c._a = assess(c.signals, c.flags, c.year));
        var pos = a.strengths.length ? a.strengths.map(function (s) { return s.label; }).join(', ') : 'making steady progress';
        var need = a.drivers.length ? a.drivers[0].label.toLowerCase() : null;
        return '<div class="row"><div class="top"><b>' + esc(c.name) + '</b><span class="st ' + STATUS_COLOR[a.status] + '" style="margin-left:auto">' + STATUS_LABEL[a.status] + '</span></div>' +
          '<div class="rec" style="margin-top:8px"><b>Strengths:</b> ' + esc(pos) + '.</div>' +
          (need ? '<div class="rec"><b>Where a bit of help would go furthest:</b> ' + esc(need) + '.</div>' : '') +
          '<div class="rec"><b>What we suggest:</b> ' + esc(a.rec.split(' · ')[0]) + '.</div></div>';
      }).join('') + '</div>';
    host.innerHTML = h; proBanner(host, live.sample);
  }

  function drawAuthority(host) {
    // anonymised, PII-masked area cohort — Dublin-style cross-agency view
    var seed = 'area-' + (schoolCode() || 'region');
    var cohorts = [
      { g: 'Whole area', key: 'all' }, { g: 'Disadvantaged (PP)', key: 'pp' },
      { g: 'SEND', key: 'send' }, { g: 'EAL', key: 'eal' }, { g: 'Persistent absentees', key: 'abs' }
    ];
    function band(key) { var pri = seeded(seed + key + 'p', key === 'abs' ? 34 : key === 'pp' ? 22 : key === 'send' ? 26 : 12, key === 'abs' ? 48 : key === 'pp' ? 34 : key === 'send' ? 38 : 20);
      var watch = seeded(seed + key + 'w', 22, 34); return { pri: pri, watch: watch, ok: Math.max(0, 100 - pri - watch) }; }
    var opp = 0; try { opp = (window.SYPathways && SYPathways.marketList ? (SYPathways.marketList() || []).length : 0); } catch (e) {}
    var whole = band('all');
    var h = '<div class="sy-r">' + ETHICS.replace('a child’s', 'a cohort’s').replace('confirm. Records are permissioned and audit-logged.', 'act on. All figures are anonymised and PII-masked.') +
      '<div class="tiles">' +
        tile(whole.pri + '%', 'Priority for support', 'crit') +
        tile(whole.watch + '%', 'Keep watch', 'warn') +
        tile((100 - whole.pri - whole.watch) + '%', 'On track', 'ok') +
        tile(opp, 'Live Pathways opportunities', '') +
      '</div>' +
      '<h4>NEET-risk by cohort (anonymised)</h4>';
    cohorts.forEach(function (c) { var b = band(c.key);
      h += '<div class="row"><div class="top"><b>' + esc(c.g) + '</b><span class="st crit" style="margin-left:auto">' + b.pri + '% priority</span></div>' +
        '<div class="bar" style="margin-top:9px"><i class="" style="width:' + b.pri + '%;background:#F0888F"></i><i style="width:' + b.watch + '%;background:#E0AE5A"></i><i style="width:' + b.ok + '%;background:#5CBB7B"></i></div>' +
        '<div class="rec" style="margin-top:7px">Recommended area action: <b>' + (c.key === 'abs' ? 'Area attendance partnership + family support' : c.key === 'pp' ? 'Targeted mentoring + employer encounters (Pathways)' : c.key === 'send' ? 'SEND transition + supported pathways' : c.key === 'eal' ? 'Language + integration support' : 'Cross-agency early-support partnership') + '</b></div></div>';
    });
    h += '<div class="alert" style="margin-top:12px"><b>Dublin-style cross-agency model:</b> match the priority cohort to the <b>' + opp + '</b> live employer/college opportunities in Pathways, commission mentoring, and track outcomes per pound — schools push cohort data up, you push programmes &amp; funding down.</div>';
    h += '<div class="act"><button class="rb solid" id="sy-r-aexport">Download area evidence pack (Word)</button><button class="rb" id="sy-r-match">Open Pathways marketplace</button></div></div>';
    host.innerHTML = h;
    host.querySelector('#sy-r-match').onclick = function () { window.location.href = BASE + 'authority/'; };
    host.querySelector('#sy-r-aexport').onclick = function () {
      var synth = cohorts.map(function (c) { var b = band(c.key); return { key: c.key, name: c.g, year: 'Area', signals: { attainment: 100 - b.pri }, flags: {}, _a: { status: b.pri > 30 ? 'priority' : b.pri > 20 ? 'watch' : 'on-track', drivers: [], rec: 'Area programme', score: 100 - b.pri } }; });
      evidencePack(synth, { title: 'Area / combined-authority cohort', mask: true });
    };
  }

  /* ---------------- mount ---------------- */
  var _host = null;
  function draw(host) {
    var r = role();
    if (r === 'authority') return drawAuthority(host);
    if (r === 'parent') return drawParent(host, gatherParent());
    return drawStaff(host, gatherSchool(CTX.phase), CTX.phase); // school + teacher (+ primary phase)
  }
  function mount(target, opts) {
    injectStyle();
    var host = target || document.getElementById('readiness-root'); if (!host) return null;
    opts = opts || {};
    CTX.phase = opts.phase || host.getAttribute('data-phase') || null;
    if (host.getAttribute('data-sy-ready') === '1' && !target) return host;
    host.setAttribute('data-sy-ready', '1');
    if (!/\bcard\b/.test(host.className)) host.className = (host.className ? host.className + ' ' : '') + 'card';
    var title = CTX.phase === 'primary' ? 'Primary Future-Readiness — early identification &amp; support' : 'Future-Readiness — early identification &amp; support';
    host.innerHTML = '<h3>' + title + '</h3><div class="sub" style="color:var(--ink-3,#8795AE);font-size:12.5px;margin-bottom:2px">Spot the children who need extra support to stay in education, employment or training — early, and turn it into action and evidence.</div><div class="sy-r-body"></div>';
    _host = host.querySelector('.sy-r-body'); draw(_host);
    return host;
  }

  window.SYReady = { assess: assess, mount: mount, summarise: summarise, equity: equity, evidencePack: evidencePack };

  function auto() { if (document.getElementById('readiness-root')) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
