/**
 * StudYear Results & Next Steps (window.SYNext)
 * ---------------------------------------------------------------------------
 * The "I didn't get the grades — now what?" safety net. Results day is the
 * highest-risk moment for a young person to drop out of education (NEET). This
 * tool turns that moment into a calm, concrete set of REAL UK routes forward —
 * for GCSE and for A-Level / Level 3 — with the exact first action and an
 * official link for each, and an optional AI-drafted personal plan.
 *
 * Self-contained and login-optional: it works with no account (so it can also
 * be a public wedge), degrades gracefully, and meters the AI plan via SYAI like
 * every AI action. Mounts into #nextsteps-root.
 */
(function () {
  'use strict';
  if (window.SYNext) return;
  var BASE = (function () { try { var s = (document.currentScript && document.currentScript.src) || ''; return s ? s.replace(/nextsteps\.js.*$/, '') : '../'; } catch (e) { return '../'; } })();

  /* Real UK routes. `stage`: which results. `when`: which situations it answers.
     `tone`: primary (do this first) / option / support. Links are official. */
  var ROUTES = [
    // ---------------- GCSE ----------------
    { stage: 'gcse', when: ['english_maths'], tone: 'primary', title: 'Resit GCSE English &/or Maths', timeline: 'Nov & next summer',
      what: 'If you\'re 16–18 and didn\'t get grade 4 in English or Maths, you keep studying them — it\'s a condition of post-16 funding. Most students resit at college alongside their main course.',
      who: 'Missed grade 4 in English or Maths.',
      action: 'Enrol at your local college now — they place you on a resit or Functional Skills. Many take late applications in Aug/Sep.',
      link: 'https://www.gov.uk/further-education-courses', linkLabel: 'Find a college course (gov.uk)' },
    { stage: 'gcse', when: ['english_maths'], tone: 'option', title: 'Functional Skills Level 2', timeline: 'Flexible, often faster',
      what: 'A widely-accepted alternative to a GCSE grade 4 for many jobs and apprenticeships — often quicker to pass than a full resit.',
      who: 'Need English/Maths for work or an apprenticeship, fast.',
      action: 'Ask your college or apprenticeship provider to put you on Functional Skills L2.',
      link: 'https://www.gov.uk/what-different-qualification-levels-mean', linkLabel: 'What the levels mean (gov.uk)' },
    { stage: 'gcse', when: ['close', 'english_maths', 'other'], tone: 'support', title: 'Ask for a Review of Marking (re-mark)', timeline: 'Deadline is weeks — act now',
      what: 'If you were close to a grade boundary, your school can ask the exam board to review the marking. There\'s a fee, refunded if the grade changes. Priority reviews exist if a place depends on it.',
      who: 'A grade looks lower than expected or is just below a boundary.',
      action: 'Speak to your school\'s exams officer today — only the school can request it, and deadlines are tight.',
      link: 'https://www.gov.uk/appeal-marking-a-level-gcse-marks', linkLabel: 'Appeals & reviews (gov.uk)' },
    { stage: 'gcse', when: ['other', 'unsure'], tone: 'option', title: 'A college course at the right level', timeline: 'Apply Aug–Sep',
      what: 'A Level 1 or 2 vocational course (BTEC/NVQ) builds real skills and progresses to Level 3, T-Levels or an apprenticeship.',
      who: 'Not ready for A-Levels/Level 3 yet, or want a practical route.',
      action: 'Apply to your local college — call them; most have places into September.',
      link: 'https://www.gov.uk/further-education-courses', linkLabel: 'Find a college course (gov.uk)' },
    { stage: 'gcse', when: ['other', 'unsure', 'english_maths'], tone: 'option', title: 'Start an apprenticeship', timeline: 'Year-round',
      what: 'Earn a wage while you train, with English & Maths built in. Levels run from intermediate (2) upwards.',
      who: 'Want to work and learn at the same time.',
      action: 'Search live vacancies and apply online — employers hire all year.',
      link: 'https://www.gov.uk/apply-apprenticeship', linkLabel: 'Find an apprenticeship (gov.uk)' },
    // ---------------- A-LEVEL / LEVEL 3 ----------------
    { stage: 'alevel', when: ['missed_offer', 'no_place'], tone: 'primary', title: 'UCAS Clearing', timeline: 'Open through summer',
      what: 'If you don\'t have a confirmed place, Clearing matches you to university courses that still have spaces — using the grades you actually got.',
      who: 'No confirmed place, or you want to change course/university.',
      action: 'Log in to UCAS Hub, get your Clearing number, then phone universities directly — they decide on the call.',
      link: 'https://www.ucas.com/undergraduate/results-confirmation-and-clearing/what-clearing', linkLabel: 'How Clearing works (UCAS)' },
    { stage: 'alevel', when: ['missed_offer'], tone: 'primary', title: 'Call your firm / insurance university', timeline: 'Today',
      what: 'If you narrowly missed your offer, the university may still accept you, or offer a foundation year or a related course. They often decide fast on results day and just after.',
      who: 'Just below the grades for a place you were holding.',
      action: 'Phone the admissions office now — be ready with your student ID and grades.',
      link: 'https://www.ucas.com/undergraduate/results-confirmation-and-clearing/results', linkLabel: 'Results day advice (UCAS)' },
    { stage: 'alevel', when: ['missed_offer', 'close'], tone: 'support', title: 'Priority re-mark (Review of Results)', timeline: 'Deadline is days — act now',
      what: 'If a place hinges on one or two marks, your school can request a Priority review with the exam board. The university may hold your place while it\'s reviewed.',
      who: 'A university offer depends on a borderline grade.',
      action: 'Tell your school\'s exams officer immediately and tell the university you\'ve requested a priority review.',
      link: 'https://www.gov.uk/appeal-marking-a-level-gcse-marks', linkLabel: 'Appeals & reviews (gov.uk)' },
    { stage: 'alevel', when: ['failed_subject', 'missed_offer', 'unsure'], tone: 'option', title: 'Foundation year or Access to HE', timeline: 'Start this year or next',
      what: 'A foundation year gets you onto a degree when your grades fell short; an Access to HE Diploma (usually 1 year at college) is built to get adults and returners into university.',
      who: 'Want a degree but your grades aren\'t there yet.',
      action: 'Search foundation-year courses in Clearing, or apply for an Access to HE course at a college.',
      link: 'https://www.accesstohe.ac.uk/', linkLabel: 'Access to HE (official)' },
    { stage: 'alevel', when: ['failed_subject', 'missed_offer'], tone: 'option', title: 'Resit your A-Levels', timeline: 'Next summer',
      what: 'Retake one or more A-Levels as a private candidate — at a college, sixth form or independently — then reapply with stronger grades.',
      who: 'Want the same course and grades are the only blocker.',
      action: 'Ask a local college/sixth form about resit places, or register as a private candidate with an exam centre.',
      link: 'https://www.gov.uk/exam-results-help', linkLabel: 'Exam results help (gov.uk)' },
    { stage: 'alevel', when: ['unsure', 'no_place', 'failed_subject'], tone: 'option', title: 'Degree apprenticeship', timeline: 'Year-round',
      what: 'A full degree paid for by an employer while you work — no tuition debt, real experience, a salary.',
      who: 'Want a degree without the debt, and to start working.',
      action: 'Search degree-apprenticeship vacancies and apply — competition is high, so apply early and widely.',
      link: 'https://www.gov.uk/apply-apprenticeship', linkLabel: 'Find an apprenticeship (gov.uk)' },
    { stage: 'alevel', when: ['unsure', 'no_place'], tone: 'option', title: 'BTEC / HNC / HND & vocational routes', timeline: 'Apply now',
      what: 'Level 4–5 qualifications (HNC/HND) give real skills and can "top up" to a full degree later — a practical alternative to a traditional degree.',
      who: 'Prefer applied, career-focused study.',
      action: 'Search Level 4/5 courses at colleges and universities, including in Clearing.',
      link: 'https://www.gov.uk/further-education-courses', linkLabel: 'Find a course (gov.uk)' },
    { stage: 'alevel', when: ['unsure', 'no_place'], tone: 'option', title: 'Take a year, then reapply', timeline: 'Reapply Sep–Jan',
      what: 'A planned gap year — work, volunteering or an internship — plus a UCAS application with confirmed grades is often a stronger application than reapplying under pressure now.',
      who: 'Nothing feels right today and you want to choose well.',
      action: 'Line up work or experience, then reapply through UCAS with your real grades.',
      link: 'https://www.ucas.com/', linkLabel: 'UCAS' },
  ];
  // Always-available support, shown to everyone.
  var SUPPORT = [
    { title: 'Exam Results Helpline', what: 'Free, confidential advice from qualified careers advisers on all your options.', action: 'Call 0800 100 900 (National Careers Service).', link: 'https://nationalcareers.service.gov.uk/', linkLabel: 'National Careers Service' },
  ];
  var SITU = {
    gcse: [
      { k: 'english_maths', label: 'Missed grade 4 in English or Maths' },
      { k: 'other', label: 'Missed other subjects' },
      { k: 'close', label: 'Just below a grade boundary' },
      { k: 'unsure', label: 'Not sure what to do next' }
    ],
    alevel: [
      { k: 'missed_offer', label: 'Narrowly missed my university offer' },
      { k: 'no_place', label: 'No confirmed place' },
      { k: 'failed_subject', label: 'Failed / underperformed a subject' },
      { k: 'close', label: 'A place hinges on a borderline mark' },
      { k: 'unsure', label: 'Rethinking whether uni is right' }
    ]
  };

  /* ---- SYAI (metered, optional) ---- */
  var aiP = null;
  function ensureAI() { if (window.SYAI) return Promise.resolve(true); if (aiP) return aiP; aiP = new Promise(function (res) { var s = document.createElement('script'); s.src = BASE + 'ai.js'; s.onload = function () { res(!!window.SYAI); }; s.onerror = function () { res(false); }; (document.head || document.documentElement).appendChild(s); }); return aiP; }
  function planAI(stage, picks, chosen) {
    var stageWord = stage === 'gcse' ? 'GCSE' : 'A-Level / Level 3';
    var sys = 'You are a warm, practical UK careers & education adviser talking to a 16–18 year-old (and their parent) just after ' + stageWord + ' results. Be calm, encouraging and specific to England\'s system. Never shame them. Keep it short and doable.';
    var user = 'Their results situation: ' + (picks.join('; ') || 'unspecified') + '.\nRoutes they\'re considering: ' + (chosen.join('; ') || 'open to advice') + '.\n' +
      'Write a personal "next 7 days" plan: 4–6 concrete steps in order, each one line starting with a verb (call, apply, email, ask), with WHO to contact and WHY. Then one short reassuring line. Plain text, no headings longer than a few words.';
    return ensureAI().then(function (ok) { if (!ok || !window.SYAI) throw new Error('offline'); return SYAI.ask(sys, user, { maxTokens: 700, temperature: 0.6, acus: 2, label: 'Next-steps plan' }); });
  }
  function planFallback(stage, picks) {
    return 'YOUR NEXT 7 DAYS\n' +
      '1. Call the National Careers Service on 0800 100 900 — free advice on every option below.\n' +
      (stage === 'alevel'
        ? '2. Phone your firm/insurance university\'s admissions office — ask if they\'ll still take you or offer a foundation year.\n3. If no place, log in to UCAS Hub, get your Clearing number, and call universities with spaces.\n4. If a place hinges on one mark, ask your school\'s exams officer for a Priority review today.\n'
        : '2. Apply to your local college — ask them to place you on a GCSE resit or Functional Skills for English/Maths.\n3. Search "Find an apprenticeship" on gov.uk and apply to two roles.\n4. If a grade is borderline, ask your school\'s exams officer about a Review of Marking (deadlines are tight).\n') +
      '5. Pick ONE route above and take its first action before the week ends.\n\n' +
      'You have not run out of options — thousands take these exact routes every year and go on to do brilliantly.\n\n_(Offline plan — reconnect for one tailored to you.)_';
  }

  /* ---- UI ---- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function download(name, text) { try { var b = new Blob([text], { type: 'text/plain' }); var u = URL.createObjectURL(b); var a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400); } catch (e) {} }
  var STYLE = '#nextsteps-root .ns-reassure{border:1px solid var(--line,rgba(120,140,190,.28));border-left:3px solid #5CBB7B;border-radius:12px;padding:12px 15px;background:rgba(92,187,123,.07);font-size:13.5px;margin-top:6px}' +
    '#nextsteps-root .ns-seg{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}' +
    '#nextsteps-root .ns-tab{font-size:13px;border:1px solid var(--line,rgba(120,140,190,.3));border-radius:999px;padding:7px 15px;cursor:pointer;background:rgba(6,11,24,.3);color:var(--ink-2,#AAB6CC)}' +
    '#nextsteps-root .ns-tab.on{border-color:#4FA6E0;background:rgba(79,166,224,.15);color:#EAF1FF;font-weight:600}' +
    '#nextsteps-root .ns-sit{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}@media(max-width:640px){#nextsteps-root .ns-sit{grid-template-columns:1fr}}' +
    '#nextsteps-root .ns-chk{display:flex;align-items:center;gap:9px;border:1px solid var(--line,rgba(120,140,190,.28));border-radius:10px;padding:9px 12px;background:rgba(6,11,24,.3);font-size:13px;cursor:pointer}' +
    '#nextsteps-root .ns-chk input{accent-color:#4FA6E0}' +
    '#nextsteps-root .ns-card{border:1px solid var(--line,rgba(120,140,190,.28));border-radius:13px;padding:15px 17px;background:rgba(6,11,24,.32);margin-top:12px}' +
    '#nextsteps-root .ns-card.primary{border-color:rgba(79,166,224,.5);background:rgba(79,166,224,.08)}' +
    '#nextsteps-root .ns-card.support{border-left:3px solid #E0AE5A}' +
    '#nextsteps-root .ns-card h4{font-family:var(--serif,Georgia,serif);font-weight:600;font-size:16px;margin:0 0 3px;color:var(--ink,#EAF1FF)}' +
    '#nextsteps-root .ns-pill{display:inline-block;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#4FA6E0;border:1px solid rgba(79,166,224,.4);border-radius:999px;padding:2px 9px;margin-bottom:6px}' +
    '#nextsteps-root .ns-card .who{font-size:12px;color:var(--ink-3,#8795AE);margin:2px 0 8px}' +
    '#nextsteps-root .ns-card p{font-size:13px;color:var(--ink-2,#AAB6CC);margin:0 0 9px;line-height:1.5}' +
    '#nextsteps-root .ns-do{font-size:13px;color:var(--ink,#EAF1FF)}#nextsteps-root .ns-do b{color:#4FA6E0}' +
    '#nextsteps-root .ns-card a.ns-link{display:inline-block;margin-top:9px;font-size:12.5px;color:#4FA6E0;text-decoration:none;border:1px solid rgba(79,166,224,.4);border-radius:8px;padding:6px 12px}' +
    '#nextsteps-root .ns-out{margin-top:12px;background:rgba(6,11,24,.42);border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:14px;font-size:13px;white-space:pre-wrap;line-height:1.55}' +
    '#nextsteps-root .ns-act{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}';
  function injectStyle() { if (document.getElementById('ns-style')) return; var s = document.createElement('style'); s.id = 'ns-style'; s.textContent = STYLE; document.head.appendChild(s); }

  function render(host) {
    var stage = 'gcse';
    host.innerHTML = '<div class="ns-reassure">📌 <b>First, breathe.</b> Results that aren\'t what you hoped for are a fork in the road, not the end of it. Tens of thousands take the routes below every year. Pick your situation and see your options.</div>' +
      '<div class="ns-seg" id="ns-seg"><span class="ns-tab" data-stage="gcse">GCSE results</span><span class="ns-tab" data-stage="alevel">A-Level / Level 3 results</span></div>' +
      '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3,#8795AE);margin-top:4px">What happened? (pick any)</div>' +
      '<div class="ns-sit" id="ns-sit"></div>' +
      '<div class="ns-act"><button class="btn sm solid" id="ns-go">Show my options</button><button class="btn sm" id="ns-plan">Make my 7-day plan</button></div>' +
      '<div id="ns-results"></div><div class="ns-out" id="ns-out" hidden></div>';
    var seg = host.querySelector('#ns-seg'), sit = host.querySelector('#ns-sit'), out = host.querySelector('#ns-out');
    function paintSit() {
      sit.innerHTML = SITU[stage].map(function (s) { return '<label class="ns-chk"><input type="checkbox" value="' + s.k + '"> ' + esc(s.label) + '</label>'; }).join('');
      Array.prototype.forEach.call(seg.children, function (c) { c.className = 'ns-tab' + (c.getAttribute('data-stage') === stage ? ' on' : ''); });
    }
    seg.onclick = function (e) { var c = e.target.closest('[data-stage]'); if (!c) return; stage = c.getAttribute('data-stage'); paintSit(); host.querySelector('#ns-results').innerHTML = ''; out.hidden = true; };
    paintSit();
    function picks() { return Array.prototype.map.call(sit.querySelectorAll('input:checked'), function (i) { return i.value; }); }
    function pickLabels() { var p = picks(); return SITU[stage].filter(function (s) { return p.indexOf(s.k) >= 0; }).map(function (s) { return s.label; }); }

    function matching() {
      var p = picks();
      var rs = ROUTES.filter(function (r) { return r.stage === stage && (!p.length || r.when.some(function (w) { return p.indexOf(w) >= 0; })); });
      // primary first, then options, then support
      var order = { primary: 0, option: 1, support: 2 };
      rs.sort(function (a, b) { return (order[a.tone] || 1) - (order[b.tone] || 1); });
      return rs;
    }
    function card(r) {
      return '<div class="ns-card ' + (r.tone === 'primary' ? 'primary' : r.tone === 'support' ? 'support' : '') + '">' +
        '<span class="ns-pill">' + (r.tone === 'primary' ? 'Start here' : r.tone === 'support' ? 'Support' : 'Option') + ' · ' + esc(r.timeline) + '</span>' +
        '<h4>' + esc(r.title) + '</h4>' +
        '<div class="who">For: ' + esc(r.who) + '</div>' +
        '<p>' + esc(r.what) + '</p>' +
        '<div class="ns-do"><b>Do first:</b> ' + esc(r.action) + '</div>' +
        (r.link ? '<a class="ns-link" href="' + esc(r.link) + '" target="_blank" rel="noopener noreferrer">' + esc(r.linkLabel || 'Learn more') + ' ↗</a>' : '') +
        '</div>';
    }
    host.querySelector('#ns-go').onclick = function () {
      var rs = matching();
      var box = host.querySelector('#ns-results');
      box.innerHTML = '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3,#8795AE);margin-top:16px">Your routes forward · ' + rs.length + '</div>' +
        rs.map(card).join('') +
        SUPPORT.map(function (s) { return '<div class="ns-card support"><span class="ns-pill">Free help · anytime</span><h4>' + esc(s.title) + '</h4><p>' + esc(s.what) + '</p><div class="ns-do"><b>Do first:</b> ' + esc(s.action) + '</div><a class="ns-link" href="' + esc(s.link) + '" target="_blank" rel="noopener noreferrer">' + esc(s.linkLabel) + ' ↗</a></div>'; }).join('');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    host.querySelector('#ns-plan').onclick = function () {
      var chosen = matching().slice(0, 5).map(function (r) { return r.title; });
      out.hidden = false; out.textContent = 'Writing your personal 7-day plan…';
      planAI(stage, pickLabels(), chosen).then(function (txt) { showPlan(txt); }).catch(function () { showPlan(planFallback(stage, pickLabels())); });
      function showPlan(text) {
        out.textContent = text;
        var old = host.querySelector('#ns-planbar'); if (old) old.remove();
        var bar = document.createElement('div'); bar.className = 'ns-act'; bar.id = 'ns-planbar';
        bar.innerHTML = '<button class="btn sm solid" data-copy>Copy</button><button class="btn sm" data-dl>Download</button>';
        out.after(bar);
        bar.querySelector('[data-copy]').onclick = function () { try { navigator.clipboard.writeText(text); this.textContent = '✓ Copied'; } catch (e) {} };
        bar.querySelector('[data-dl]').onclick = function () { download('studyear-next-steps-plan.txt', text); };
      }
    };
  }

  function mount(target) {
    injectStyle();
    var host = target || document.getElementById('nextsteps-root'); if (!host) return null;
    if (host.getAttribute('data-sy-next') === '1') return host;
    host.setAttribute('data-sy-next', '1');
    render(host); ensureAI();
    return host;
  }
  window.SYNext = { mount: mount, routes: ROUTES };
  function auto() { if (document.getElementById('nextsteps-root')) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
