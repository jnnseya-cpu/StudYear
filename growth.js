/**
 * StudYear AI Growth Engine (window.SYGrowth)
 *
 * A built-in, role-aware marketing suite that drops into any PARTNER console
 * (tutor, school, employer, college, local/combined authority) to maximise
 * their reach. Ten live-AI tools:
 *   1  AI social media post generator
 *   2  AI advert creator
 *   3  AI email campaign generator
 *   4  AI landing page builder (downloadable standalone HTML)
 *   5  AI hashtag generator
 *   6  AI video script generator
 *   7  AI performance recommendations
 *   8  AI audience optimisation
 *   9  AI campaign analytics (computes CTR/CPC/CPA/ROAS + AI reading)
 *   10 AI best posting time recommendations
 *
 * Every tool routes through SYAI (the same server-side gateway as the rest of
 * the OS) and is metered in ACUs against the account wallet (admin/demo free).
 * If the model can't be reached, each tool still returns a strong deterministic
 * draft so a partner is never dead-ended. "depending on the platform" — the
 * prompts and copy adapt to the signed-in role.
 *
 * Mounts automatically into #growth-root; also SYGrowth.mount(el, opts).
 */
(function () {
  'use strict';

  var BASE = (function () {
    try { var s = (document.currentScript && document.currentScript.src) || ''; return s ? s.replace(/growth\.js.*$/, '') : '../'; }
    catch (e) { return '../'; }
  })();
  var FREE = 'studyear.com/free';

  /* ---- role framing: how each partner talks and who they reach ---- */
  var ROLES = {
    admin: { noun: 'StudYear platform', who: 'students, parents and schools across the UK',
      goal: 'drive sign-ups to the free tools at ' + FREE, voice: 'warm, credible, student-first' },
    tutor: { noun: 'tutoring service', who: 'parents and students looking for a tutor',
      goal: 'win new tutoring enquiries and bookings', voice: 'warm, expert, reassuring to parents' },
    school: { noun: 'school', who: 'local families, prospective pupils and the school community',
      goal: 'boost admissions, attendance at events, and community engagement', voice: 'trusted, community-minded, professional' },
    employer: { noun: 'employer', who: 'young people, schools and the local community',
      goal: 'attract young talent and showcase social value through opportunities offered', voice: 'inspiring, credible, community-spirited' },
    college: { noun: 'college / training provider', who: 'prospective students, parents and referring schools',
      goal: 'drive course applications, open-day attendance and apprenticeship starts', voice: 'aspirational, practical, outcomes-focused' },
    authority: { noun: 'local or combined authority', who: 'residents, employers, schools and providers across the region',
      goal: 'grow participation in skills programmes and employer/provider engagement', voice: 'civic, clear, action-oriented' },
    teacher: { noun: 'teacher', who: 'students, parents and colleagues',
      goal: 'promote clubs, revision sessions, trips and class initiatives', voice: 'friendly, clear, motivating' }
  };
  function roleInfo() {
    var r = 'partner';
    try { r = (window.SY && SY.session && SY.session.role) || 'partner'; } catch (e) {}
    return ROLES[r] || { noun: 'organisation', who: 'your audience', goal: 'grow reach and engagement', voice: 'clear and professional' };
  }
  function myName() { try { return (window.SY && SY.session && SY.session.name) || ''; } catch (e) { return ''; } }

  /* ---- ACU metering ----
     Every tool is metered and gated by available ACUs — no free passes for any
     role. The actual debit happens centrally in SYAI.ask (charged on success),
     so here we only PRE-CHECK the balance for a clean early message; askAI()
     passes the tool's cost through so ask() debits the right amount. */
  function canAfford(n) { try { return !window.SYAI || !SYAI.canAfford || SYAI.canAfford(n); } catch (e) { return true; } }
  function balanceText() { try { return (window.SYAI && SYAI.balance ? SYAI.balance() : 0) + ' ACUs'; } catch (e) { return '—'; } }

  /* ---- SYAI loader (partner consoles may not include ai.js) ---- */
  var aiPromise = null;
  function ensureAI() {
    if (window.SYAI) return Promise.resolve(true);
    if (aiPromise) return aiPromise;
    aiPromise = new Promise(function (res) {
      var s = document.createElement('script'); s.src = BASE + 'ai.js';
      s.onload = function () { res(!!window.SYAI); }; s.onerror = function () { res(false); };
      (document.head || document.documentElement).appendChild(s);
    });
    return aiPromise;
  }
  function askAI(system, user, opts) {
    opts = opts || {};
    return ensureAI().then(function (ok) {
      if (!ok || !window.SYAI) throw new Error('offline');
      return SYAI.ask(system, user, { maxTokens: opts.maxTokens || 900, temperature: 0.7, acus: opts.acus || 1, label: opts.label || 'AI Growth' });
    });
  }

  /* ---- helpers ---- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function md(t) { return window.SYAI && SYAI.render ? SYAI.render(t) : ('<p>' + esc(t).replace(/\n/g, '<br>') + '</p>'); }
  function download(name, text, mime) {
    try {
      var b = new Blob([text], { type: mime || 'text/plain' }); var u = URL.createObjectURL(b);
      var a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400);
    } catch (e) { toast('Download failed'); }
  }
  var _tt; function toast(t) {
    var el = document.getElementById('sy-g-toast');
    if (!el) { el = document.createElement('div'); el.id = 'sy-g-toast'; el.className = 'sy-g-toast'; document.body.appendChild(el); }
    el.textContent = t; el.style.opacity = '1'; clearTimeout(_tt); _tt = setTimeout(function () { el.style.opacity = '0'; }, 2600);
  }

  /* ============================ TOOL DEFINITIONS ============================ */
  var PLAT = ['LinkedIn', 'Facebook', 'Instagram', 'X (Twitter)', 'TikTok', 'YouTube', 'WhatsApp / Nextdoor'];
  var TONE = ['Warm & friendly', 'Professional', 'Bold & punchy', 'Inspiring', 'Playful', 'Formal / civic'];

  function selField(k, label, opts, val) { return { k: k, label: label, type: 'select', opts: opts, val: val }; }
  function txt(k, label, ph) { return { k: k, label: label, type: 'text', ph: ph }; }
  function area(k, label, ph) { return { k: k, label: label, type: 'area', ph: ph }; }

  var TOOLS = [
    {
      id: 'social', icon: '📣', name: 'Social media post generator',
      desc: 'On-brand posts tailored to each platform, ready to publish.',
      fields: [selField('platform', 'Platform', PLAT), txt('topic', 'What are you posting about?', 'e.g. free GCSE maths taster this Saturday'), selField('tone', 'Tone', TONE), txt('cta', 'Call to action', 'e.g. Book a free trial')],
      cost: 2,
      prompt: function (v, R) {
        return {
          sys: 'You are a senior social media manager for a UK ' + R.noun + '. Voice: ' + R.voice + '. Goal: ' + R.goal + '. Audience: ' + R.who + '. Write ready-to-publish posts — no placeholders, no "insert here".',
          user: 'Write THREE distinct ' + v.platform + ' posts about: "' + v.topic + '".\nTone: ' + v.tone + '. Call to action: "' + (v.cta || 'Learn more') + '".\nFor each post: an attention hook first line, 2–4 short lines of body, the CTA, then a compact line of 3–6 relevant hashtags. Number them 1–3. Keep within ' + v.platform + ' norms (concise for X, richer for LinkedIn/Facebook).'
        };
      }
    },
    {
      id: 'advert', icon: '🎯', name: 'Advert creator',
      desc: 'Paid-ad copy (search, social & display) with headline and CTA variations.',
      fields: [selField('channel', 'Ad channel', ['Google Search', 'Meta (Facebook/Instagram)', 'Display banner', 'YouTube pre-roll', 'Local press / print']), txt('offer', 'Offer / product', 'e.g. 1-to-1 A-level tutoring'), txt('audience', 'Target audience', 'e.g. parents of Year 12 students in Leeds'), txt('usp', 'Main benefit / USP', 'e.g. average one-grade uplift')],
      cost: 2,
      prompt: function (v, R) {
        return {
          sys: 'You are a direct-response advertising copywriter for a UK ' + R.noun + '. Voice: ' + R.voice + '. Write compliant, honest, high-converting ad copy. No unverifiable claims.',
          user: 'Create ' + v.channel + ' advert copy for: "' + v.offer + '".\nAudience: ' + (v.audience || R.who) + '. Key benefit: ' + (v.usp || 'quality and results') + '.\nProvide: 5 headline variations (≤30 chars for Google), 3 primary-text/description variations, 3 call-to-action button options, and 2 suggested targeting angles. Label each section clearly.'
        };
      }
    },
    {
      id: 'email', icon: '✉️', name: 'Email campaign generator',
      desc: 'Subject lines, a full email and a follow-up — ready to send.',
      fields: [txt('goal', 'Campaign goal', 'e.g. fill our summer revision course'), txt('audience', 'Who is it going to?', 'e.g. existing parents'), txt('offer', 'Offer / news', 'e.g. 10% early-bird until 30th'), selField('tone', 'Tone', TONE)],
      cost: 2,
      prompt: function (v, R) {
        return {
          sys: 'You are an email marketing specialist for a UK ' + R.noun + '. Voice: ' + R.voice + '. Follow best practice: strong subject lines, scannable body, one clear CTA, GDPR-friendly footer note.',
          user: 'Write an email campaign to ' + (v.audience || R.who) + ' with the goal: "' + v.goal + '".\nOffer/news: ' + (v.offer || '—') + '. Tone: ' + v.tone + '.\nProvide: 5 subject-line options (with 1 preheader), the full email body (greeting, hook, body, single clear CTA, sign-off), and a short 1-paragraph follow-up email for non-openers. Label the sections.'
        };
      }
    },
    {
      id: 'landing', icon: '🖥️', name: 'Landing page builder',
      desc: 'Full conversion page copy — preview and download a standalone HTML page.',
      fields: [txt('offer', 'What is the page for?', 'e.g. Book a free assessment'), txt('audience', 'Audience', 'e.g. parents of GCSE students'), area('benefits', 'Key benefits (one per line)', 'Qualified tutors\nProven results\nFlexible online sessions'), txt('cta', 'Primary call to action', 'e.g. Book your free assessment')],
      cost: 3, landing: true,
      prompt: function (v, R) {
        return {
          sys: 'You are a conversion copywriter and landing-page strategist for a UK ' + R.noun + '. Voice: ' + R.voice + '. Output clean markdown with clear ## section headings so it can be rendered to a page.',
          user: 'Write full landing-page copy to: "' + v.offer + '" for ' + (v.audience || R.who) + '.\nBenefits to feature:\n' + (v.benefits || '—') + '\nPrimary CTA: "' + (v.cta || 'Get started') + '".\nStructure with these ## sections: Hero (headline + subhead + CTA), Why choose us (3–5 benefits), How it works (3 steps), Social proof (2 short testimonial-style quotes clearly marked as examples to replace), FAQ (4 Q&As), Final CTA. Keep it concrete and benefit-led.'
        };
      }
    },
    {
      id: 'hashtags', icon: '#️⃣', name: 'Hashtag generator',
      desc: 'Ranked hashtag sets — broad reach, niche and local.',
      fields: [selField('platform', 'Platform', PLAT), txt('topic', 'Topic / post theme', 'e.g. GCSE revision tips'), txt('place', 'Location (for local reach)', 'e.g. Manchester')],
      cost: 1,
      prompt: function (v, R) {
        return {
          sys: 'You are a social growth strategist. Return real, relevant, currently-plausible hashtags — no spaces, no banned/spammy tags. UK context.',
          user: 'Generate hashtags for a ' + v.platform + ' post about "' + v.topic + '" for a ' + R.noun + (v.place ? ' in ' + v.place : '') + '.\nGive THREE groups, ~8 tags each: (1) High-reach broad tags, (2) Niche/high-intent tags, (3) Local/community tags' + (v.place ? ' for ' + v.place : '') + '. Then a recommended ready-to-paste set of 10. Plain text, each group labelled.'
        };
      }
    },
    {
      id: 'video', icon: '🎬', name: 'Video script generator',
      desc: 'Scene-by-scene short-video script with hook, shots and captions.',
      fields: [selField('length', 'Format', ['15s Reel/TikTok', '30s Reel/TikTok', '60s short', '90s explainer', '2–3 min YouTube']), txt('topic', 'Video topic', 'e.g. why spaced revision works'), selField('hook', 'Hook style', ['Bold question', 'Surprising stat', 'Relatable problem', 'Behind the scenes', 'Quick tip']), txt('cta', 'Ending call to action', 'e.g. Follow for weekly tips')],
      cost: 2,
      prompt: function (v, R) {
        return {
          sys: 'You are a short-form video scriptwriter for a UK ' + R.noun + '. Voice: ' + R.voice + '. Write shoot-ready scripts a non-expert can film on a phone.',
          user: 'Write a ' + v.length + ' video script about "' + v.topic + '". Hook style: ' + v.hook + '. End CTA: "' + (v.cta || 'Follow for more') + '".\nFormat as a table-like list of scenes: for each scene give [Time], [On-screen visual / shot], [Voiceover / dialogue], [On-screen caption]. Start with a 3-second scroll-stopping hook. Keep language punchy. Add a one-line caption + 5 hashtags for the post at the end.'
        };
      }
    },
    {
      id: 'perf', icon: '📈', name: 'Performance recommendations',
      desc: 'Prioritised, specific actions to lift your marketing results.',
      fields: [txt('goal', 'Primary goal', 'e.g. more free-trial bookings'), area('current', 'What you are doing now / results so far', 'e.g. posting 2x/week on Facebook, ~5 enquiries/month, no ads'), txt('budget', 'Monthly budget (optional)', 'e.g. £150')],
      cost: 2,
      prompt: function (v, R) {
        return {
          sys: 'You are a growth marketing consultant for UK ' + R.noun + 's. Give specific, prioritised, realistic advice — no fluff. Assume limited time and budget.',
          user: 'Goal: ' + v.goal + '.\nCurrent activity/results:\n' + (v.current || '—') + '\nBudget: ' + (v.budget || 'unspecified') + '.\nReturn: (1) Top 5 prioritised recommendations, each with the expected impact and the first concrete step; (2) 3 quick wins for this week; (3) 2 things to stop or fix. Be concrete and reference the goal.'
        };
      }
    },
    {
      id: 'audience', icon: '👥', name: 'Audience optimisation',
      desc: 'Sharper audience personas, channels and messaging angles.',
      fields: [txt('offer', 'Offer / service', 'e.g. GCSE booster classes'), txt('place', 'Area you serve', 'e.g. Birmingham & West Midlands'), txt('current', 'Who you reach now (optional)', 'e.g. mostly existing parents')],
      cost: 2,
      prompt: function (v, R) {
        return {
          sys: 'You are an audience strategist for a UK ' + R.noun + '. Ground personas in realistic UK demographics and behaviour.',
          user: 'Optimise the audience for "' + v.offer + '"' + (v.place ? ' in ' + v.place : '') + '. Currently reaching: ' + (v.current || 'unclear') + '.\nReturn: (1) 3 priority personas (who they are, what they want, where they spend time online, the message that lands); (2) best channels ranked for each; (3) 3 under-tapped audience segments to test; (4) targeting parameters to use on Meta/Google. Keep it actionable.'
        };
      }
    },
    {
      id: 'analytics', icon: '📊', name: 'Campaign analytics',
      desc: 'Paste your numbers — get computed KPIs and an AI reading.',
      fields: [txt('impr', 'Impressions', 'e.g. 12000'), txt('clicks', 'Clicks', 'e.g. 240'), txt('spend', 'Spend (£)', 'e.g. 150'), txt('conv', 'Conversions / enquiries', 'e.g. 18'), txt('rev', 'Revenue (£, optional)', 'e.g. 900')],
      cost: 1, analytics: true
    },
    {
      id: 'timing', icon: '⏰', name: 'Best posting time recommendations',
      desc: 'A weekly posting schedule tuned to your platform and audience.',
      fields: [selField('platform', 'Platform', PLAT), txt('audience', 'Audience', 'e.g. working parents'), selField('freq', 'How often can you post?', ['Daily', '4–5 / week', '2–3 / week', 'Weekly'])],
      cost: 1, timing: true,
      prompt: function (v, R) {
        return {
          sys: 'You are a social media scheduling analyst. Use realistic UK engagement patterns by platform and audience. Times in UK local time (GMT/BST).',
          user: 'Recommend the best posting times on ' + v.platform + ' for a UK ' + R.noun + ' reaching ' + (v.audience || R.who) + ', posting ' + v.freq + '.\nReturn a Monday–Sunday schedule with the specific recommended time window(s) each active day, a one-line reason per slot, and 3 general tips for this platform+audience.'
        };
      }
    }
  ];

  /* ============ OWNER-ONLY TOOLS (admin mount) ============================
     These two absorb the former standalone social.js + nurture.js: a ready
     acquisition content calendar, and the captured free-tool lead feed with
     CSV export + mark-contacted. Both are platform-owner tools, so they only
     appear when the signed-in session is a StudYear admin. Copy generation
     itself still routes through the same 10 tools above. */
  function isAdmin() { try { return (window.SY && SY.session && SY.session.role) === 'admin'; } catch (e) { return false; } }
  function sessionEmail() { try { return (window.SY && SY.session && SY.session.email) || ''; } catch (e) { return ''; } }
  function maskEmail(e) { e = String(e || ''); var at = e.indexOf('@'); if (at < 1) return '•••'; var u = e.slice(0, at), d = e.slice(at + 1); return (u.length <= 2 ? u[0] + '•' : u.slice(0, 2) + '•••') + '@' + d; }
  function csvEsc(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

  /* rolling acquisition content calendar — every angle points at the free tool */
  var CAL = [
    { t: 'How to predict your GCSE grade in 60 seconds (free, no sign-up)', a: 'the free predicted-grade tool', fmt: 'Reel 15–20s', hook: 'Surprising stat' },
    { t: 'POV: your exam is in 8 weeks and you have no plan', a: 'free revision plan tool', fmt: 'TikTok 20–30s', hook: 'Relatable problem' },
    { t: '3 revision mistakes that quietly cost you grades', a: 'study science (retrieval, spacing, past papers)', fmt: 'Reel 25–35s', hook: 'Quick tip' },
    { t: 'The AI tutor that refuses to do your homework for you', a: 'AI tutor teaches the method', fmt: 'Reel 15–25s', hook: 'Bold question' },
    { t: 'Stop re-reading your notes. Do this instead.', a: 'active recall / flashcards + quiz', fmt: 'TikTok 20–30s', hook: 'Quick tip' },
    { t: 'Free GCSE Maths revision plan in one minute', a: '/free/gcse-maths/ subject tool', fmt: '15s short', hook: 'Surprising stat' },
    { t: 'Parents: report cards are autopsies. You want a heartbeat.', a: 'parent dashboard + early alerts', fmt: 'Reel 25–35s', hook: 'Relatable problem' },
    { t: 'What grade are you ACTUALLY on track for? (be honest)', a: 'predicted grade tool', fmt: 'TikTok 20–30s', hook: 'Bold question' },
    { t: 'A tutor is £40/hour. This is free.', a: 'free AI tutor vs private tuition cost', fmt: 'Reel 15–25s', hook: 'Surprising stat' },
    { t: 'Turn any topic into flashcards in 5 seconds', a: 'AI flashcard maker', fmt: '15s short', hook: 'Quick tip' },
    { t: 'The 4-week revision plan that actually works', a: 'free revision plan tool', fmt: 'Reel 25–35s', hook: 'Quick tip' },
    { t: 'How to choose GCSE options without wrecking your future', a: 'Career Passport', fmt: 'TikTok 25–35s', hook: 'Bold question' },
    { t: 'Mark my essay: instant examiner feedback with targets', a: 'AI essay marking', fmt: 'Reel 20–30s', hook: 'Behind the scenes' },
    { t: 'Free A-Level Biology predicted grade + plan', a: '/free/alevel-biology/ subject tool', fmt: '15s short', hook: 'Surprising stat' },
    { t: 'Times tables still shaky? Fix it in a week.', a: 'SkillRush / Maths Heroes fluency', fmt: 'Reel 20–30s', hook: 'Relatable problem' },
    { t: 'The night-before-the-exam plan (if you left it late)', a: 'revision plan tool, exam mode', fmt: 'TikTok 25–35s', hook: 'Relatable problem' },
    { t: 'Why past papers early = higher grades', a: 'exam practice + predicted grades', fmt: 'Reel 20–30s', hook: 'Surprising stat' },
    { t: 'Parents: the one thing to do this week to help', a: 'Parent Action Cards', fmt: 'Reel 20–30s', hook: 'Quick tip' },
    { t: 'Get your revision plan emailed to you (free)', a: 'free tool + email plan', fmt: '15s short', hook: 'Quick tip' },
    { t: 'How spaced repetition beats cramming (proof)', a: 'Smart Review / spaced repetition', fmt: 'TikTok 25–35s', hook: 'Surprising stat' },
    { t: 'Free GCSE English Literature plan + predicted grade', a: '/free/gcse-english-literature/', fmt: '15s short', hook: 'Surprising stat' },
    { t: 'Struggling in one subject? Start here (free).', a: 'free tool → AI tutor', fmt: 'Reel 15–25s', hook: 'Relatable problem' },
    { t: 'The revision timetable maker that adapts to your mood', a: 'study planner + energy check-in', fmt: 'Reel 20–30s', hook: 'Behind the scenes' },
    { t: 'Quiz yourself on any topic in seconds', a: 'AI quiz generator', fmt: '15s short', hook: 'Quick tip' },
    { t: 'How to actually learn a topic (interactive lesson demo)', a: 'interactive AI lessons', fmt: 'TikTok 25–35s', hook: 'Behind the scenes' },
    { t: 'Free predicted grade for every GCSE subject', a: '/free/ subject hub', fmt: 'Reel 15–25s', hook: 'Surprising stat' },
    { t: 'Invite a friend, you both get free credits', a: 'referral loop', fmt: '15s short', hook: 'Quick tip' },
    { t: 'From "no idea where to start" to a plan, free, in 60s', a: 'free tool end-to-end', fmt: 'Reel 20–30s', hook: 'Relatable problem' }
  ];
  function calIdx() { try { return Math.floor(new Date().getTime() / 86400000) % CAL.length; } catch (e) { return 0; } }
  function calUpcoming(n) { var out = [], b = calIdx(); for (var i = 0; i < n; i++) out.push(CAL[(b + i) % CAL.length]); return out; }
  function calScript(idea) {
    return {
      sys: 'You are StudYear\'s short-form video producer, growing a UK edtech brand organically on TikTok, Reels and Shorts. Native, punchy, honest, never cringe or salesy. Every post ends with a clear call to action to the free tool at ' + FREE + ' (predicted grade + personalised revision plan, no sign-up).',
      user: 'Create a ready-to-film ' + idea.fmt + ' about: "' + idea.t + '" (angle: ' + idea.a + '). Hook style: ' + idea.hook + '.\nReturn labelled sections: HOOK (first 3s spoken + on-screen), SCRIPT (3–5 scenes as [visual]/[on-screen text]/[voiceover]), CAPTION (1–2 lines + CTA to ' + FREE + '), HASHTAGS (8–12 UK study tags), BEST TIME (one line).'
    };
  }

  /* lifecycle segments for the captured-lead nurture drafts */
  var SEG = [
    { id: 'new-lead', name: 'New lead → account', who: 'Used a free tool and left an email but has no account.', goal: 'Give more value, then convert to a free account.' },
    { id: 'parent-lead', name: 'Parent lead', who: 'A parent who wants to help their child but may not afford tuition.', goal: 'Reassure, show the parent dashboard, convert to a free family account.' },
    { id: 'dormant', name: 'Dormant win-back', who: 'An existing user who has gone quiet for 30+ days.', goal: 'A timely, relevant reason to return.' },
    { id: 'school', name: 'School contact', who: 'A school staff contact who can pass free StudYear to families.', goal: 'Equip them to forward it + show the school platform (NEET early-warning).' }
  ];

  function loadLeads() {
    try { if (!(window.SYCloud && SYCloud.leadsList)) return Promise.resolve(null); return SYCloud.leadsList(sessionEmail()).catch(function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  function leadsCsv(items) {
    var head = 'email,first_name,source,subject,grade,ref,captured,contacted\n';
    return head + (items || []).map(function (l) {
      var fn = String(l.email || '').split('@')[0].replace(/[._-].*$/, '');
      return [l.email, fn, l.source, l.subject, l.grade, l.ref, l.createdAt, l.contacted ? 'yes' : 'no'].map(csvEsc).join(',');
    }).join('\n');
  }

  /* --- custom render: content calendar --- */
  function renderCalendar(panel) {
    panel.hidden = false;
    var t = CAL[calIdx()];
    panel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span class="sy-g-ic">📅</span><b style="font-size:16px">Content calendar</b>' +
      '<button class="sy-g-close" style="margin-left:auto;background:none;border:0;color:var(--ink-3,#8795AE);cursor:pointer;font-size:20px" title="Close">×</button></div>' +
      '<p class="sub" style="color:var(--ink-3,#8795AE);margin:0 0 8px">A ready-to-film short-video idea for today — every post drives traffic to the free tool. Generate, copy, post.</p>' +
      '<div style="border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:12px 14px;background:rgba(6,11,24,.28)"><div style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#4FA6E0">' + esc(t.fmt) + ' · today</div><b style="display:block;font-size:14px;margin:3px 0">' + esc(t.t) + '</b><span style="font-size:12px;color:var(--ink-3,#8795AE)">Angle: ' + esc(t.a) + ' → ' + FREE + '</span></div>' +
      '<div class="sy-g-actions"><button class="btn solid sy-g-run">Generate today’s post · 2 ACUs</button><button class="btn sm sy-g-batch">Batch next 7 days</button></div>' +
      '<div class="sy-g-out" id="sy-g-out" hidden></div>';
    panel.querySelector('.sy-g-close').onclick = function () { panel.hidden = true; panel.innerHTML = ''; };
    var out = panel.querySelector('#sy-g-out');
    function runOne(idea, btn) {
      if (!canAfford(2)) { toast((window.SYAI && SYAI.NO_ACUS) || 'Not enough ACUs.'); return; }
      out.hidden = false; if (btn) btn.disabled = true; out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Writing your ' + esc(idea.fmt) + '…</span>';
      var p = calScript(idea);
      askAI(p.sys, p.user, { maxTokens: 950, temperature: 0.85, acus: 2, label: 'Growth: content calendar' }).then(function (txt) {
        out.innerHTML = md(txt) + '<div class="sy-g-actions"><button class="btn sm sy-g-copy">Copy</button><button class="btn sm sy-g-dl">Download</button></div>';
        out.querySelector('.sy-g-copy').onclick = function () { try { navigator.clipboard.writeText(txt); toast('Copied'); } catch (e) {} };
        out.querySelector('.sy-g-dl').onclick = function () { download('studyear-content-' + new Date().toISOString().slice(0, 10) + '.txt', txt, 'text/plain'); };
        if (btn) btn.disabled = false;
      }).catch(function () { out.innerHTML = md('HOOK\n“' + idea.t + '”\n\nSCRIPT\n[Talk to camera] Hook line.\n[Screen-record the free tool] Enter a mark + exam date → a grade appears.\n[Screen-record the plan] Scroll the week-by-week plan.\n[You] “Free, no sign-up. Link in bio.”\n\nCAPTION\n' + idea.t + ' Try it free: ' + FREE + '\n\nHASHTAGS\n#gcse #revision #alevels #studytok #gcse2026 #studytips #examseason #ukschool\n\n_(Offline draft — reconnect for an AI-tailored script.)_'); if (btn) btn.disabled = false; });
    }
    panel.querySelector('.sy-g-run').onclick = function () { runOne(CAL[calIdx()], this); };
    panel.querySelector('.sy-g-batch').onclick = function () {
      if (!canAfford(2)) { toast((window.SYAI && SYAI.NO_ACUS) || 'Not enough ACUs.'); return; }
      out.hidden = false; out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Generating 7 days…</span>';
      var days = calUpcoming(7), acc = [];
      (function next(k) {
        if (k >= days.length) { var all = acc.join('\n\n' + '─'.repeat(40) + '\n\n'); out.innerHTML = md(all) + '<div class="sy-g-actions"><button class="btn sm sy-g-dl">Download 7-day plan</button></div>'; out.querySelector('.sy-g-dl').onclick = function () { download('studyear-content-7day.txt', all, 'text/plain'); }; return; }
        var p = calScript(days[k]);
        askAI(p.sys, p.user, { maxTokens: 950, temperature: 0.85, acus: 2, label: 'Growth: content calendar' }).then(function (t) { acc.push('DAY ' + (k + 1) + ' · ' + days[k].t + '\n\n' + t); out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Generated ' + (k + 1) + '/7…</span>'; next(k + 1); })
          .catch(function () { acc.push('DAY ' + (k + 1) + ' · ' + days[k].t + '\n\n(offline draft)'); next(k + 1); });
      })(0);
    };
  }

  /* --- custom render: captured leads + nurture --- */
  function renderLeadsTool(panel) {
    panel.hidden = false;
    var state = { leads: null };
    panel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span class="sy-g-ic">✉️</span><b style="font-size:16px">Captured leads &amp; nurture</b>' +
      '<button class="sy-g-close" style="margin-left:auto;background:none;border:0;color:var(--ink-3,#8795AE);cursor:pointer;font-size:20px" title="Close">×</button></div>' +
      '<p class="sub" style="color:var(--ink-3,#8795AE);margin:0 0 8px">Emails captured by the free tools. Addresses are masked here; export the full list as a mail-merge CSV to send from your provider. Draft a lifecycle sequence with AI, then mark contacted.</p>' +
      '<div id="sy-g-leads" style="font-size:12.5px"></div>' +
      '<label class="fl" style="margin-top:10px">Lifecycle segment for the draft</label><select id="sy-g-seg">' + SEG.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select>' +
      '<div class="sy-g-actions"><button class="btn solid sy-g-draft">Draft nurture sequence · 3 ACUs</button><button class="btn sm sy-g-refresh">Load captured leads</button></div>' +
      '<div class="sy-g-out" id="sy-g-out" hidden></div>';
    panel.querySelector('.sy-g-close').onclick = function () { panel.hidden = true; panel.innerHTML = ''; };
    var box = panel.querySelector('#sy-g-leads'), out = panel.querySelector('#sy-g-out');

    function paintLeads() {
      if (state.leads === null) { box.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Loading captured leads…</span>'; return; }
      if (state.leads === false) { box.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Backend not reachable — you can still draft sequences. Deploy the backend to load and export real leads.</span>'; return; }
      var items = state.leads.items || [], c = state.leads.counts || {};
      if (!items.length) { box.innerHTML = '<span style="color:var(--ink-3,#8795AE)">No captured leads yet. Emails left on a /free/ tool appear here.</span>'; return; }
      var sources = c.bySource || {};
      var pills = Object.keys(sources).map(function (k) { return '<span style="display:inline-block;font-size:11px;border:1px solid var(--line,rgba(120,140,190,.24));border-radius:999px;padding:2px 9px;margin:3px 5px 0 0;color:var(--ink-3,#8795AE)">' + esc(k) + ': ' + sources[k] + '</span>'; }).join('');
      var sample = items.slice(0, 6).map(function (l) { return esc(maskEmail(l.email)) + (l.subject ? ' · ' + esc(l.subject) : '') + (l.contacted ? ' ✓' : ''); }).join('<br>');
      box.innerHTML = '<b style="color:var(--ink-2,#c3ccdf)">' + items.length + ' captured lead' + (items.length === 1 ? '' : 's') + '</b>' + (c.notContacted != null ? ' <span style="color:var(--ink-3,#8795AE)">· ' + c.notContacted + ' not yet contacted</span>' : '') +
        '<div style="margin-top:5px">' + pills + '</div><div style="margin-top:7px;color:var(--ink-3,#8795AE)">' + sample + (items.length > 6 ? '<br>…and ' + (items.length - 6) + ' more' : '') + '</div>' +
        '<div class="sy-g-actions"><button class="btn sm sy-g-csv">Export mail-merge CSV</button><button class="btn sm sy-g-mark">Mark all contacted</button></div>';
      box.querySelector('.sy-g-csv').onclick = function () { download('studyear-leads-' + new Date().toISOString().slice(0, 10) + '.csv', leadsCsv(items), 'text/csv'); };
      box.querySelector('.sy-g-mark').onclick = function () {
        var ids = items.filter(function (l) { return !l.contacted; }).map(function (l) { return l.id; });
        if (!ids.length) { this.textContent = 'All contacted ✓'; return; }
        var b = this; b.textContent = 'Marking…'; b.disabled = true;
        (window.SYCloud && SYCloud.leadMark ? SYCloud.leadMark(ids, sessionEmail()) : Promise.resolve(false)).then(function (ok) {
          if (ok) { items.forEach(function (l) { l.contacted = true; }); if (state.leads.counts) state.leads.counts.notContacted = 0; paintLeads(); }
          else { b.textContent = 'Mark failed — retry'; b.disabled = false; }
        });
      };
    }
    function fetchLeads() { paintLeads(); loadLeads().then(function (r) { state.leads = r && r.ok ? { items: r.items || [], counts: r.counts || {} } : false; paintLeads(); }); }
    panel.querySelector('.sy-g-refresh').onclick = function () { state.leads = null; fetchLeads(); };

    panel.querySelector('.sy-g-draft').onclick = function () {
      if (!canAfford(3)) { toast((window.SYAI && SYAI.NO_ACUS) || 'Not enough ACUs.'); return; }
      var s = SEG.filter(function (x) { return x.id === panel.querySelector('#sy-g-seg').value; })[0] || SEG[0];
      var n = (state.leads && state.leads.items) ? state.leads.items.length : 0;
      out.hidden = false; var btn = this; btn.disabled = true; out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Writing the sequence for “' + esc(s.name) + '”…</span>';
      var sys = 'You are StudYear\'s lifecycle-email copywriter for a UK edtech brand with a genuinely free tier (100 ACUs every 3 months). Warm, human, concise British English; value before any ask; one clear CTA per email; free entry point is the tool at ' + FREE + '.';
      var user = 'Write a 3-email lifecycle sequence.\nSEGMENT: ' + s.name + '\nWHO: ' + s.who + '\nGOAL: ' + s.goal + (n ? '\nAUDIENCE SIZE: ~' + n + ' contacts.' : '') + '\nFor each email return: === EMAIL n (day X) ===, SUBJECT, PREVIEW, BODY (90–140 words, {{first_name}} merge field, one CTA), CTA (button text + where it goes). Paste-ready.';
      askAI(sys, user, { maxTokens: 1200, temperature: 0.7, acus: 3, label: 'Growth: lifecycle nurture' }).then(function (txt) {
        out.innerHTML = md(txt) + '<div class="sy-g-actions"><button class="btn sm sy-g-copy">Copy</button><button class="btn sm sy-g-dl">Download</button></div>';
        out.querySelector('.sy-g-copy').onclick = function () { try { navigator.clipboard.writeText(txt); toast('Copied'); } catch (e) {} };
        out.querySelector('.sy-g-dl').onclick = function () { download('studyear-nurture-' + s.id + '.txt', txt, 'text/plain'); };
        btn.disabled = false;
      }).catch(function () {
        out.innerHTML = md('=== EMAIL 1 (day 0) ===\nSUBJECT: Your StudYear plan — one quick win inside\nBODY: Hi {{first_name}}, ' + s.goal.charAt(0).toLowerCase() + s.goal.slice(1) + ' Start free in 60 seconds — no sign-up for the tool.\nCTA: Open my free plan → ' + FREE + '\n\n_(Offline draft — reconnect for an AI-tailored sequence.)_'); btn.disabled = false;
      });
    };
    fetchLeads();
  }

  /* --- custom render: weekly newsletter (automatic send + owner controls) --- */
  function renderNewsletter(panel) {
    panel.hidden = false;
    panel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span class="sy-g-ic">📰</span><b style="font-size:16px">Weekly newsletter</b>' +
      '<button class="sy-g-close" style="margin-left:auto;background:none;border:0;color:var(--ink-3,#8795AE);cursor:pointer;font-size:20px" title="Close">×</button></div>' +
      '<p class="sub" style="color:var(--ink-3,#8795AE);margin:0 0 8px">Sent automatically to every registered user every Monday 09:00 (UK), selling the platform’s features with links back to the site. One-click unsubscribe is included on every email. Preview this week, send yourself a test, or send now.</p>' +
      '<div id="sy-g-nlstatus" style="font-size:12.5px;color:var(--ink-3,#8795AE)">Checking status…</div>' +
      '<div class="sy-g-actions"><button class="btn solid sy-g-nlprev">Preview this week</button><button class="btn sm sy-g-nltest">Send test to me</button><button class="btn sm sy-g-nlsend">Send now to all</button></div>' +
      '<div class="sy-g-out" id="sy-g-out" hidden></div>';
    panel.querySelector('.sy-g-close').onclick = function () { panel.hidden = true; panel.innerHTML = ''; };
    var out = panel.querySelector('#sy-g-out'), statusEl = panel.querySelector('#sy-g-nlstatus');
    function api(op) { return (window.SYCloud && SYCloud.newsletter) ? SYCloud.newsletter(op, sessionEmail()) : Promise.resolve(null); }
    function loadStatus() {
      api('status').then(function (r) {
        if (!r || !r.ok) { statusEl.textContent = 'Backend not reachable — deploy the backend to enable sending. You can still preview.'; return; }
        var last = (r.runs && r.runs[0]) || null;
        statusEl.innerHTML = (r.mailConfigured ? '<span style="color:#5CBB7B">✓ Mail configured</span>' : '<span style="color:#E0AE5A">⚠ Mail not configured (set MAIL_* env)</span>') +
          (last ? ' · last issue <b>' + esc(last.id) + '</b>' + (last.finishedAt ? ' — sent ' + (last.sent || 0) + ', skipped ' + (last.skipped || 0) + (last.failed ? ', failed ' + last.failed : '') : ' — in progress') + (last.by ? ' (' + esc(last.by) + ')' : '') : ' · no issue sent yet');
      });
    }
    panel.querySelector('.sy-g-nlprev').onclick = function () {
      out.hidden = false; out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Building this week’s issue…</span>';
      api('preview').then(function (r) {
        if (!r || !r.ok) { out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Preview needs the backend. Deploy it to preview and send.</span>'; return; }
        out.innerHTML = '<div style="font-size:12.5px;color:var(--ink-3,#8795AE);margin-bottom:6px">Week ' + esc(r.weekKey) + ' · subject: <b style="color:var(--ink-2,#c3ccdf)">' + esc(r.subject) + '</b></div>' +
          '<iframe title="Newsletter preview" style="width:100%;height:520px;border:1px solid var(--line,rgba(120,140,190,.28));border-radius:10px;background:#fff"></iframe>';
        var f = out.querySelector('iframe'); try { f.srcdoc = r.html; } catch (e) { f.contentDocument.write(r.html); }
      });
    };
    panel.querySelector('.sy-g-nltest').onclick = function () {
      var btn = this; btn.disabled = true; out.hidden = false; out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Sending a test to your admin email…</span>';
      api('test').then(function (r) {
        btn.disabled = false;
        out.innerHTML = (r && r.ok) ? '<span style="color:#5CBB7B">✓ Test sent to ' + esc(r.to || 'your email') + ' (week ' + esc(r.weekKey) + ').</span>' : '<span style="color:var(--ink-3,#8795AE)">Could not send — check the backend is deployed and MAIL_* is configured.</span>';
      });
    };
    panel.querySelector('.sy-g-nlsend').onclick = function () {
      if (!confirm('Send this week’s newsletter to ALL registered users now?\n\nThis is idempotent — if this week’s issue was already sent, it won’t send again.')) return;
      var btn = this; btn.disabled = true; out.hidden = false; out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Sending to all registered users…</span>';
      api('send').then(function (r) {
        btn.disabled = false; loadStatus();
        out.innerHTML = (r && r.ok) ? (r.alreadySent ? '<span style="color:#5CBB7B">✓ This week’s issue was already sent — nothing to resend.</span>' : '<span style="color:#5CBB7B">✓ Sent ' + (r.sent || 0) + ', skipped ' + (r.skipped || 0) + (r.failed ? ', failed ' + r.failed : '') + ' (week ' + esc(r.weekKey) + ').</span>') : '<span style="color:var(--ink-3,#8795AE)">Could not send — check the backend is deployed and MAIL_* is configured.</span>';
      });
    };
    loadStatus();
  }

  var ADMIN_TOOLS = [
    { id: 'calendar', icon: '📅', name: 'Content calendar', desc: 'A daily short-video idea + AI script driving traffic to the free tool.', custom: renderCalendar },
    { id: 'leads', icon: '✉️', name: 'Captured leads & nurture', desc: 'Your free-tool leads: export a mail-merge CSV and AI-draft a lifecycle sequence.', custom: renderLeadsTool },
    { id: 'newsletter', icon: '📰', name: 'Weekly newsletter', desc: 'Automatic weekly email to all users selling features. Preview, test or send now.', custom: renderNewsletter }
  ];
  function allTools() { return isAdmin() ? TOOLS.concat(ADMIN_TOOLS) : TOOLS; }
  function findTool(id) { return allTools().filter(function (t) { return t.id === id; })[0]; }

  /* deterministic drafts so a tool never dead-ends when the model is unreachable */
  function fallback(tool, v, R) {
    var name = myName();
    if (tool.id === 'social') {
      var tags = '#' + (v.topic || 'StudYear').split(/\s+/).slice(0, 2).join('') + ' #UKeducation #' + ((R.noun || 'learning').replace(/[^a-z]/gi, ''));
      return ['1. ' + (v.topic || 'Big news') + '!\n' + (v.cta || 'Get in touch today') + '.\n' + tags,
        '2. Did you know? ' + (v.topic || 'We can help') + '. ' + (v.cta || 'Message us to find out more') + '.\n' + tags,
        '3. ' + (name ? name + ': ' : '') + (v.topic || 'Here to help') + '. ' + (v.cta || 'Book now') + '.\n' + tags].join('\n\n') + '\n\n_(Offline draft — reconnect for AI-tailored copy.)_';
    }
    if (tool.id === 'hashtags') {
      var base = (v.topic || 'education').split(/\s+/).join('');
      return 'Broad: #education #learning #UK #students #' + base + '\nNiche: #' + base + 'tips #tutoring #revision #studygram\nLocal: ' + (v.place ? '#' + v.place.replace(/[^a-z]/gi, '') + ' #' + v.place.replace(/[^a-z]/gi, '') + 'schools' : '#local #community') + '\n\nReady set: #' + base + ' #education #UK #learning #students #tutoring #revision #study #community #StudYear\n\n_(Offline draft.)_';
    }
    return 'The AI service is not reachable right now, so here is a starting outline you can edit:\n\n• Goal: ' + (v.goal || v.offer || v.topic || '—') + '\n• Audience: ' + (v.audience || R.who) + '\n• Key message: ' + (v.usp || v.offer || v.topic || '—') + '\n• Call to action: ' + (v.cta || 'Get in touch') + '\n\nReconnect to StudYear to generate the full version with AI.';
  }

  /* campaign analytics computes KPIs locally, then AI interprets */
  function computeKPIs(v) {
    var impr = +v.impr || 0, clicks = +v.clicks || 0, spend = +v.spend || 0, conv = +v.conv || 0, rev = +v.rev || 0;
    var ctr = impr ? clicks / impr * 100 : 0, cpc = clicks ? spend / clicks : 0, cpm = impr ? spend / impr * 1000 : 0;
    var cr = clicks ? conv / clicks * 100 : 0, cpa = conv ? spend / conv : 0, roas = spend ? rev / spend : 0;
    return { impr: impr, clicks: clicks, spend: spend, conv: conv, rev: rev, ctr: ctr, cpc: cpc, cpm: cpm, cr: cr, cpa: cpa, roas: roas };
  }
  function kpiTable(k) {
    function row(l, val) { return '<tr><td style="padding:4px 12px 4px 0;color:var(--ink-3,#8795AE)">' + l + '</td><td style="padding:4px 0;font-weight:600">' + val + '</td></tr>'; }
    return '<table style="border-collapse:collapse;font-size:14px;margin:6px 0">' +
      row('Click-through rate (CTR)', k.ctr.toFixed(2) + '%') +
      row('Cost per click (CPC)', '£' + k.cpc.toFixed(2)) +
      row('Cost per 1,000 (CPM)', '£' + k.cpm.toFixed(2)) +
      row('Conversion rate', k.cr.toFixed(2) + '%') +
      row('Cost per acquisition (CPA)', k.conv ? '£' + k.cpa.toFixed(2) : '—') +
      row('Return on ad spend (ROAS)', k.rev ? k.roas.toFixed(2) + '×' : '—') +
      '</table>';
  }

  /* ---- landing page: wrap AI markdown copy into a standalone HTML page ---- */
  function landingHTML(title, bodyHTML) {
    return '<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + esc(title) + '</title>\n<style>' +
      '*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.7;background:#f8fafc}' +
      '.wrap{max-width:820px;margin:0 auto;padding:48px 24px 80px}h1{font-size:38px;line-height:1.15;margin:0 0 12px;color:#0b3a66}h2{font-size:24px;margin:34px 0 10px;color:#0b3a66}h3{font-size:18px;margin:18px 0 6px}' +
      'p{margin:10px 0}ul{margin:10px 0 10px 22px}li{margin:5px 0}a.cta,.cta{display:inline-block;margin:16px 0;background:linear-gradient(135deg,#2E6BC4,#4FA6E0);color:#fff;text-decoration:none;font-weight:700;border-radius:10px;padding:14px 26px}' +
      'blockquote{border-left:3px solid #4FA6E0;margin:12px 0;padding:6px 16px;color:#334155;font-style:italic;background:#eef5fc}footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px}' +
      '</style></head><body><div class="wrap">' + bodyHTML + '<footer>Built with the StudYear AI Growth Engine · replace the example testimonials before publishing.</footer></div></body></html>';
  }

  /* ================================ UI ================================ */
  var STYLE = '.sy-growth .sy-g-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin:14px 0}' +
    '.sy-growth .sy-g-tile{text-align:left;border:1px solid var(--line,rgba(120,140,190,.28));background:rgba(120,140,190,.06);border-radius:12px;padding:12px;cursor:pointer;transition:.15s;color:inherit;font:inherit}' +
    '.sy-growth .sy-g-tile:hover{border-color:#4FA6E0;background:rgba(79,166,224,.12);transform:translateY(-1px)}' +
    '.sy-growth .sy-g-tile b{display:block;font-size:14px;margin:6px 0 2px}.sy-growth .sy-g-tile span{font-size:12px;color:var(--ink-3,#8795AE);line-height:1.4}.sy-growth .sy-g-ic{font-size:20px}' +
    '.sy-growth .sy-g-panel{margin-top:14px;border-top:1px solid var(--line,rgba(120,140,190,.28));padding-top:14px}' +
    '.sy-growth .sy-g-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sy-growth .sy-g-form .full{grid-column:1/-1}' +
    '.sy-growth label.fl{display:block;font-size:12px;color:var(--ink-3,#8795AE);margin-bottom:3px}' +
    '.sy-growth .sy-g-form input,.sy-growth .sy-g-form select,.sy-growth .sy-g-form textarea{width:100%;background:rgba(6,11,24,.35);border:1px solid var(--line,rgba(120,140,190,.3));border-radius:8px;color:inherit;padding:8px 10px;font:inherit}' +
    '.sy-growth .sy-g-form textarea{min-height:72px;resize:vertical}' +
    '.sy-growth .sy-g-out{margin-top:12px;background:rgba(6,11,24,.35);border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:14px;font-size:14px}' +
    '.sy-growth .sy-g-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
    '.sy-g-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#0b3a66;color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;opacity:0;transition:.3s;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.35)}' +
    '.sy-growth .sy-g-bal{font-size:12px;color:var(--ink-3,#8795AE)}';

  function injectStyle() { if (document.getElementById('sy-g-style')) return; var s = document.createElement('style'); s.id = 'sy-g-style'; s.textContent = STYLE; document.head.appendChild(s); }

  function updateBalance() {
    var b = document.getElementById('sy-g-bal'); if (b) b.textContent = 'AI Growth credits: ' + balanceText();
    var b2 = document.getElementById('sy-g-bal2'); if (b2) b2.textContent = balanceText();
  }
  try { window.addEventListener('sy-acus', updateBalance); } catch (e) {}

  function field(f) {
    var full = (f.type === 'area') ? ' class="full"' : '';
    var inner;
    if (f.type === 'select') inner = '<select data-k="' + f.k + '">' + f.opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    else if (f.type === 'area') inner = '<textarea data-k="' + f.k + '" placeholder="' + esc(f.ph || '') + '"></textarea>';
    else inner = '<input data-k="' + f.k + '" placeholder="' + esc(f.ph || '') + '">';
    return '<div' + full + '><label class="fl">' + esc(f.label) + '</label>' + inner + '</div>';
  }

  function openTool(panel, tool) {
    if (tool.custom) { tool.custom(panel); try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} return; }
    var R = roleInfo();
    panel.hidden = false;
    panel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span class="sy-g-ic">' + tool.icon + '</span><b style="font-size:16px">' + esc(tool.name) + '</b>' +
      '<button class="sy-g-close" style="margin-left:auto;background:none;border:0;color:var(--ink-3,#8795AE);cursor:pointer;font-size:20px" title="Close">×</button></div>' +
      '<div class="sy-g-form">' + tool.fields.map(field).join('') + '</div>' +
      '<div class="sy-g-actions"><button class="btn solid sy-g-run">Generate · ' + (tool.cost || 1) + ' ACU' + ((tool.cost || 1) > 1 ? 's' : '') + '</button>' +
      '<span class="sy-g-bal" id="sy-g-bal2" style="align-self:center"></span></div>' +
      '<div class="sy-g-out" id="sy-g-out" hidden></div>';
    try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    var b2 = panel.querySelector('#sy-g-bal2'); if (b2) b2.textContent = balanceText();
    panel.querySelector('.sy-g-close').onclick = function () { panel.hidden = true; panel.innerHTML = ''; };
    panel.querySelector('.sy-g-run').onclick = function () { runTool(panel, tool, this); };
  }

  function collect(panel) {
    var v = {};
    panel.querySelectorAll('[data-k]').forEach(function (el) { v[el.getAttribute('data-k')] = el.value.trim(); });
    return v;
  }

  function runTool(panel, tool, btn) {
    var R = roleInfo(), v = collect(panel), out = panel.querySelector('#sy-g-out');
    /* light validation: need at least one meaningful input */
    var filled = Object.keys(v).some(function (k) { return v[k]; });
    if (!filled && !tool.analytics && !tool.timing) { toast('Fill in the fields first'); return; }
    if (!canAfford(tool.cost || 1)) { toast((window.SYAI && SYAI.NO_ACUS) || 'Not enough ACUs — top up in Account → Plans.'); return; }
    out.hidden = false; btn.disabled = true; var old = btn.textContent; btn.textContent = 'Generating…';
    out.innerHTML = '<span style="color:var(--ink-3,#8795AE)">Working…</span>';

    function show(text, extraTop, dl) {
      var body = (extraTop || '') + md(text);
      out.innerHTML = body +
        '<div class="sy-g-actions">' +
        '<button class="btn sm sy-g-copy">Copy</button>' +
        '<button class="btn sm sy-g-dl">Download</button>' +
        (dl ? '<button class="btn sm sy-g-html">Download web page (HTML)</button>' : '') +
        '</div>';
      out.querySelector('.sy-g-copy').onclick = function () { try { navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { toast('Copy failed'); } };
      out.querySelector('.sy-g-dl').onclick = function () { download('studyear-' + tool.id + '.txt', text, 'text/plain'); };
      if (dl) out.querySelector('.sy-g-html').onclick = function () { download('landing-page.html', dl(), 'text/html'); };
      btn.disabled = false; btn.textContent = old;
    }

    /* ---- analytics: compute then interpret ---- */
    if (tool.analytics) {
      var k = computeKPIs(v), tbl = kpiTable(k);
      var sys = 'You are a paid-media analyst for a UK ' + R.noun + '. Interpret the metrics plainly for a non-expert. Benchmark against typical UK small-business results and give clear next actions.';
      var user = 'Campaign metrics — impressions ' + k.impr + ', clicks ' + k.clicks + ', spend £' + k.spend + ', conversions ' + k.conv + (k.rev ? ', revenue £' + k.rev : '') + '.\nComputed: CTR ' + k.ctr.toFixed(2) + '%, CPC £' + k.cpc.toFixed(2) + ', conversion rate ' + k.cr.toFixed(2) + '%' + (k.conv ? ', CPA £' + k.cpa.toFixed(2) : '') + (k.rev ? ', ROAS ' + k.roas.toFixed(2) + '×' : '') + '.\nGive: a 2-line verdict (is this good?), what stands out, the single biggest lever to pull next, and 3 concrete optimisations.';
      askAI(sys, user, { maxTokens: 700, acus: tool.cost, label: 'Growth: ' + tool.name }).then(function (t) { show(t, '<b style="display:block;margin-bottom:4px">Your KPIs</b>' + tbl); })
        .catch(function () { show('These KPIs are computed from your inputs. Reconnect to StudYear for the AI reading.\n\nRule of thumb: a CTR above ~1–2% and a conversion rate above ~2–5% are healthy for most UK small-business campaigns. Watch your CPA against the value of one customer.', '<b style="display:block;margin-bottom:4px">Your KPIs</b>' + tbl); });
      return;
    }

    /* ---- standard AI tools ---- */
    var p = tool.prompt(v, R);
    askAI(p.sys, p.user, { maxTokens: tool.landing ? 1500 : 950, acus: tool.cost, label: 'Growth: ' + tool.name }).then(function (t) {
      if (tool.landing) {
        var title = (v.offer || 'Landing page') + (myName() ? ' · ' + myName() : '');
        show(t, '', function () { return landingHTML(title, md(t)); });
      } else { show(t); }
    }).catch(function () { show(fallback(tool, v, R)); });
  }

  function sectionHTML(R) {
    var tools = allTools();
    var count = tools.length;
    return '<div class="k" style="letter-spacing:.22em;text-transform:uppercase;font-size:11px;color:#4FA6E0">AI Growth Engine</div>' +
      '<h3 style="margin:4px 0 2px">Maximise your reach — ' + count + ' built-in AI marketing tools</h3>' +
      '<p class="sub" style="color:var(--ink-3,#8795AE);margin:0 0 2px">Purpose-built for your ' + esc(R.noun) + ' to ' + esc(R.goal) + '. Pick a tool, add a few details, and get publish-ready output in seconds.</p>' +
      '<div class="sy-g-bal" id="sy-g-bal"></div>' +
      '<div class="sy-g-grid">' + tools.map(function (t) {
        return '<button class="sy-g-tile" data-tool="' + t.id + '"><span class="sy-g-ic">' + t.icon + '</span><b>' + esc(t.name) + '</b><span>' + esc(t.desc) + '</span></button>';
      }).join('') + '</div><div class="sy-g-panel" hidden></div>';
  }

  function mount(target, opts) {
    injectStyle();
    var R = roleInfo();
    var host = target || document.getElementById('growth-root');
    if (!host) return null;
    if (host.getAttribute('data-sy-growth') === '1') return host; // idempotent
    host.setAttribute('data-sy-growth', '1');
    if (!/\bcard\b/.test(host.className)) host.className = (host.className ? host.className + ' ' : '') + 'card';
    host.classList.add('sy-growth');
    host.innerHTML = sectionHTML(R);
    updateBalance();
    var panel = host.querySelector('.sy-g-panel');
    host.querySelectorAll('.sy-g-tile').forEach(function (tile) {
      tile.onclick = function () {
        var tool = findTool(tile.getAttribute('data-tool'));
        if (tool) openTool(panel, tool);
      };
    });
    ensureAI(); // warm the gateway
    return host;
  }

  window.SYGrowth = { mount: mount, tools: TOOLS };

  /* auto-mount into #growth-root when present */
  function auto() { if (document.getElementById('growth-root')) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
