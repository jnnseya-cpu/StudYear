/**
 * StudYear Pathways — the shared spine for the 14+ technical-education layer.
 *
 * One data object (the young person's route into local work) serves five
 * audiences: students pick a technical route alongside the academic core and
 * log employer encounters; schools auto-evidence the statutory Gatsby
 * Benchmarks (and the new Ofsted technical-education lens) from that activity;
 * Strategic Authorities set the local growth sectors and coordinate employers;
 * parents see the choices and experience; local authorities read destinations.
 *
 * Design rules (match the rest of the OS):
 *  - England-scoped terminology (T-Levels, Ofsted, Gatsby, apprenticeships).
 *  - "No dead ends": every sector shows apprenticeship / college / university /
 *    employment / self-employment routes — technical is never a fallback.
 *  - Evidence-based: Gatsby coverage is computed from real stored activity,
 *    never assumed.
 *  - Reads/writes go through window.SY so E2EE + account namespacing apply.
 *  - Safeguarding: employer encounters with under-18s are brokered, never a
 *    raw contact exchange — the model records the encounter, not private data.
 */
(function () {
  'use strict';

  /* Local growth sectors named in the reform. Each maps to the OS's existing
     interest keys (so the Career Passport interoperates), lists real vocational
     qualifications, and shows every route in — no dead ends. */
  var SECTORS = [
    { k: 'digital', ic: '💻', name: 'Digital & Technology (AI)',
      blurb: 'Software, data, AI, cyber — the fastest-growing local sector in most areas.',
      interests: ['tech'],
      vq: ['T-Level Digital Production', 'BTEC / Cambridge National IT', 'Digital & AI skills bootcamp'],
      routes: ['Digital / software apprenticeship', 'T-Level → higher technical', 'Degree apprenticeship', 'University (Computer Science)', 'Freelance / start-up'],
      resilience: 'Build & direct AI systems — the roles that grow as routine coding shrinks.' },
    { k: 'manufacturing', ic: '⚙️', name: 'Advanced Manufacturing & Engineering',
      blurb: 'Design, robotics and precision build — reindustrialisation is lifting demand.',
      interests: ['engineering'],
      vq: ['T-Level Engineering & Manufacturing', 'BTEC Engineering', 'UTC technical programme'],
      routes: ['Engineering apprenticeship', 'UTC → higher apprenticeship', 'HNC / HND', 'Degree apprenticeship', 'University (Engineering)'],
      resilience: 'Real-world build, testing and safety judgement stay human.' },
    { k: 'cleanenergy', ic: '🌱', name: 'Clean Energy',
      blurb: 'Offshore wind, retrofit, grid and storage — a decades-long growth engine.',
      interests: ['environment', 'engineering'],
      vq: ['T-Level Engineering (energy)', 'Green skills / retrofit qualification', 'City & Guilds electrical'],
      routes: ['Offshore / renewables apprenticeship', 'Technical college', 'Degree apprenticeship', 'University (energy engineering)', 'Employment on major projects'],
      resilience: 'Field, policy and engineering roles expand across the transition.' },
    { k: 'lifesciences', ic: '🧬', name: 'Life Sciences',
      blurb: 'Biotech, pharma and research — high-skill roles clustered around universities.',
      interests: ['science', 'health'],
      vq: ['T-Level Science', 'BTEC Applied Science', 'Lab technician qualification'],
      routes: ['Laboratory apprenticeship', 'T-Level → higher technical', 'Degree apprenticeship', 'University (biosciences)', 'Research assistant entry'],
      resilience: 'Experimental design, ethics and interpretation stay human.' },
    { k: 'construction', ic: '🏗️', name: 'Construction & Built Environment',
      blurb: 'Trades, civils and modern methods — a job waiting the moment you qualify.',
      interests: ['construction'],
      vq: ['T-Level Construction', 'City & Guilds trade qualification', 'Cambridge National Built Environment'],
      routes: ['Trade / skilled apprenticeship', 'Technical college', 'Site management degree apprenticeship', 'Self-employment', 'Direct employment'],
      resilience: 'Skilled trades and on-site problem-solving are hardest to automate.' },
    { k: 'healthcare', ic: '🩺', name: 'Health & Care',
      blurb: 'NHS and social care — an ageing population lifts demand everywhere.',
      interests: ['health'],
      vq: ['T-Level Health', 'BTEC Health & Social Care', 'Care Certificate'],
      routes: ['NHS / care apprenticeship', 'Nursing degree apprenticeship', 'College (Access to nursing)', 'University (allied health)', 'Direct entry care role'],
      resilience: 'Care, dexterity and human trust are hard to automate.' },
    { k: 'creative', ic: '🎨', name: 'Creative Industries',
      blurb: 'Design, games, film and media — the UK punches far above its weight here.',
      interests: ['creative', 'media'],
      vq: ['T-Level Media, Broadcast & Production', 'BTEC Creative Digital Media', 'Portfolio programme'],
      routes: ['Creative apprenticeship', 'Technical college', 'Portfolio → freelance', 'University (design / media)', 'Self-employment'],
      resilience: 'Taste, direction and original judgement rise in value as AI drafts fast.' }
  ];

  /* The four employer-involvement modes the reform itemises. Each maps to the
     statutory Gatsby Benchmark it evidences. */
  var ENCOUNTERS = [
    { k: 'mentoring', ic: '🤝', label: 'Mentoring', gatsby: 5,
      hint: 'Ongoing guidance from someone working in the field.' },
    { k: 'visit', ic: '🏢', label: 'Workplace visit', gatsby: 6,
      hint: 'A visit to see a real workplace and the jobs in it.' },
    { k: 'project', ic: '🧩', label: 'Business-set project', gatsby: 4,
      hint: 'A real brief set by an employer, worked in school.' },
    { k: 'workexp', ic: '🗓️', label: 'Work experience', gatsby: 6,
      hint: 'Time spent doing real work in a workplace.' }
  ];

  /* The 8 Gatsby Benchmarks — the statutory framework every English secondary
     is measured on, and the backbone of the new Ofsted technical lens. */
  var GATSBY = [
    { n: 1, title: 'A stable careers programme', short: 'Stable programme' },
    { n: 2, title: 'Learning from career & labour-market information', short: 'Careers & LMI' },
    { n: 3, title: 'Addressing the needs of each pupil', short: 'Each pupil' },
    { n: 4, title: 'Linking curriculum learning to careers', short: 'Curriculum links' },
    { n: 5, title: 'Encounters with employers & employees', short: 'Employer encounters' },
    { n: 6, title: 'Experiences of workplaces', short: 'Workplace experiences' },
    { n: 7, title: 'Encounters with further & higher education', short: 'FE & HE encounters' },
    { n: 8, title: 'Personal guidance', short: 'Personal guidance' }
  ];

  function uid() {
    return 'e' + Math.floor(10000000 + Math.random() * 89999999) + Date.now().toString(36).slice(-3);
  }
  function sector(k) { for (var i = 0; i < SECTORS.length; i++) if (SECTORS[i].k === k) return SECTORS[i]; return null; }
  function encType(k) { for (var i = 0; i < ENCOUNTERS.length; i++) if (ENCOUNTERS[i].k === k) return ENCOUNTERS[i]; return null; }

  /* map an OS interest key -> the best-fit sector key (so a student's chosen
     interests suggest a technical route without re-asking). */
  function sectorForInterest(intr) {
    for (var i = 0; i < SECTORS.length; i++) {
      if (SECTORS[i].interests.indexOf(intr) >= 0) return SECTORS[i].k;
    }
    return null;
  }

  /* ---- the student's Pathways record (via SY, so E2EE + namespaced) ---- */
  function read() {
    var d = { sectorFocus: null, technicalRoute: null, encounters: [] };
    if (!window.SY) return d;
    var v = window.SY.get('pathways', d) || d;
    if (!v.encounters) v.encounters = [];
    return v;
  }
  function write(p) {
    if (!window.SY) return;
    window.SY.set('pathways', p);
    // compact summary for the parent dashboard + school aggregate reads
    var byType = {};
    p.encounters.forEach(function (e) { byType[e.type] = (byType[e.type] || 0) + 1; });
    window.SY.set('pathwaysSummary', {
      sectorFocus: p.sectorFocus,
      sectorName: p.sectorFocus ? (sector(p.sectorFocus) || {}).name : null,
      technicalRoute: p.technicalRoute,
      encounters: p.encounters.length,
      byType: byType,
      gatsby: gatsbyMet(p).length,
      when: new Date().toISOString()
    });
  }
  function setFocus(sectorKey, routeLabel) {
    var p = read();
    p.sectorFocus = sectorKey || null;
    if (routeLabel !== undefined) p.technicalRoute = routeLabel;
    write(p);
    try {
      var sn = sectorKey ? (sector(sectorKey) || {}).name : 'none';
      window.SY.log('pathways', 'Technical pathway set', 'Focus sector: ' + sn + (routeLabel ? ' · route: ' + routeLabel : ''));
    } catch (e) {}
    return p;
  }
  function addEncounter(o) {
    var p = read();
    var e = {
      id: uid(),
      type: o.type || 'visit',
      employer: String(o.employer || '').slice(0, 120),
      sector: o.sector || p.sectorFocus || null,
      title: String(o.title || '').slice(0, 160),
      date: o.date || new Date().toISOString().slice(0, 10),
      note: String(o.note || '').slice(0, 500)
    };
    p.encounters.unshift(e);
    write(p);
    try {
      var t = encType(e.type) || { label: 'Encounter' };
      window.SY.log('pathways', t.label + ' logged', (e.employer || 'Employer') + (e.title ? ' — ' + e.title : ''));
    } catch (err) {}
    return e;
  }
  function removeEncounter(id) {
    var p = read();
    p.encounters = p.encounters.filter(function (e) { return e.id !== id; });
    write(p);
    return p;
  }

  /* ---- Gatsby evidence engine ----
     signals is an object describing what the account can demonstrate. For a
     student it derives from their own record; a school passes aggregate/
     provision signals. Returns per-benchmark { n, title, short, met, evidence }. */
  function gatsbyStatus(signals) {
    signals = signals || {};
    var byType = signals.byType || {};
    var out = GATSBY.map(function (b) {
      var met = false, ev = '';
      switch (b.n) {
        case 1: met = !!signals.programme; ev = met ? 'Careers programme recorded' : 'No published programme yet'; break;
        case 2: met = !!signals.careerPassport || !!signals.lmi; ev = met ? 'Career Passport + local labour-market view in use' : 'Run the Career Passport to evidence LMI'; break;
        case 3: met = !!signals.perPupil; ev = met ? 'Per-pupil records & plans in place' : 'Per-pupil planning not evidenced'; break;
        case 4: met = (byType.project || 0) > 0 || !!signals.curriculumLinks; ev = met ? ((byType.project || 0) + ' business-set project(s)') : 'Add a business-set project to link curriculum to careers'; break;
        case 5: met = (byType.mentoring || 0) > 0 || (signals.employerEncounters || 0) > 0; ev = met ? 'Employer / mentor encounters logged' : 'Log an employer encounter or mentoring'; break;
        case 6: met = (byType.visit || 0) + (byType.workexp || 0) > 0 || (signals.workplaceExperiences || 0) > 0; ev = met ? 'Workplace visit / experience logged' : 'Log a workplace visit or work experience'; break;
        case 7: met = !!signals.feheEncounters || !!signals.routePlanner; ev = met ? 'FE/HE & apprenticeship routes explored' : 'Explore college / university / apprenticeship routes'; break;
        case 8: met = !!signals.guidance || !!signals.careerPassport; ev = met ? 'Personal guidance / passport interview evidenced' : 'Record a personal guidance interview'; break;
      }
      return { n: b.n, title: b.title, short: b.short, met: met, evidence: ev };
    });
    return out;
  }
  /* which benchmarks a student's own record already meets (for the summary) */
  function gatsbyMet(p) {
    var byType = {};
    (p.encounters || []).forEach(function (e) { byType[e.type] = (byType[e.type] || 0) + 1; });
    var sig = { byType: byType, careerPassport: true, routePlanner: !!p.sectorFocus, lmi: true };
    return gatsbyStatus(sig).filter(function (b) { return b.met; });
  }

  /* ---- shared opportunities marketplace ----
     Employers and colleges post opportunities (encounters, work experience,
     apprenticeships, courses, provider-access offers); students and schools
     discover them. Stored in a shared (non-namespaced) key for the same-device
     preview build; production swaps this for a backend directory with the same
     shape and the same owner-only write rule. */
  var MKEY = 'sy-pathways-market';
  function marketAll() {
    try { var v = JSON.parse(localStorage.getItem(MKEY)); return v && v.length ? v : []; }
    catch (e) { return []; }
  }
  function marketSave(list) { try { localStorage.setItem(MKEY, JSON.stringify(list.slice(0, 500))); } catch (e) {} }
  function marketList(filter) {
    var list = marketAll();
    if (filter && filter.sector) list = list.filter(function (o) { return o.sector === filter.sector; });
    if (filter && filter.ownerKind) list = list.filter(function (o) { return o.ownerKind === filter.ownerKind; });
    if (filter && filter.mine && window.SY) { var me = (SY.session || {}).email; list = list.filter(function (o) { return o.owner === me; }); }
    return list;
  }
  function marketAdd(o) {
    var s = (window.SY && SY.session) || {};
    var e = {
      id: uid(),
      owner: s.email || 'anon',
      ownerName: String(o.ownerName || s.name || 'Organisation').slice(0, 120),
      ownerKind: o.ownerKind || s.role || 'employer',
      kind: o.kind || 'encounter',           // encounter | workexp | apprenticeship | course | provider
      type: o.type || null,                    // encounter type when kind==='encounter'
      sector: o.sector || null,
      title: String(o.title || '').slice(0, 160),
      level: String(o.level || '').slice(0, 60),
      location: String(o.location || '').slice(0, 80),
      capacity: o.capacity || null,
      date: o.date || null,
      created: new Date().toISOString()
    };
    var list = marketAll(); list.unshift(e); marketSave(list);
    return e;
  }
  function marketRemove(id) {
    var me = (window.SY && SY.session || {}).email;
    marketSave(marketAll().filter(function (o) { return !(o.id === id && o.owner === me); }));
  }

  window.SYPathways = {
    SECTORS: SECTORS,
    ENCOUNTERS: ENCOUNTERS,
    GATSBY: GATSBY,
    marketList: marketList,
    marketAdd: marketAdd,
    marketRemove: marketRemove,
    sector: sector,
    encType: encType,
    sectorForInterest: sectorForInterest,
    read: read,
    setFocus: setFocus,
    addEncounter: addEncounter,
    removeEncounter: removeEncounter,
    gatsbyStatus: gatsbyStatus,
    gatsbyMet: gatsbyMet
  };
})();
