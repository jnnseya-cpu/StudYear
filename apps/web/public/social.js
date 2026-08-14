/**
 * StudYear Social/Content Autopilot (window.SYSocial)
 * ---------------------------------------------------------------------------
 * Proactive organic-growth engine for StudYear's OWN channels. It ships with a
 * rolling content calendar of acquisition angles (every one pointing at the free
 * tool at /free/), and generates a ready-to-film short-video script + caption +
 * hashtags + best-posting-time for today (or any day, or a 7-day batch) via the
 * live AI — with a strong deterministic fallback so it always produces something.
 * Tracks what's been posted. Mounts into #social-root (admin).
 *
 * HONEST SCOPE: this automates content CREATION + scheduling, not auto-posting
 * (that needs each platform's API keys). A human presses "post" — or pastes into
 * a scheduler. Metered in ACUs via SYAI like every AI action.
 */
(function () {
  'use strict';
  if (window.SYSocial) return;
  var BASE = (function () { try { var s = (document.currentScript && document.currentScript.src) || ''; return s ? s.replace(/social\.js.*$/, '') : '../'; } catch (e) { return '../'; } })();
  var FREE = 'studyear.com/free';

  /* ---- rolling 28-day acquisition content calendar (every angle → /free/) ---- */
  var CAL = [
    { t: 'How to predict your GCSE grade in 60 seconds (free, no sign-up)', a: 'the free predicted-grade tool', fmt: 'Reel 15–20s', hook: 'surprising-stat' },
    { t: 'POV: your exam is in 8 weeks and you have no plan', a: 'free revision plan tool', fmt: 'TikTok 20–30s', hook: 'relatable-problem' },
    { t: '3 revision mistakes that quietly cost you grades', a: 'study science (retrieval, spacing, past papers)', fmt: 'Reel 25–35s', hook: 'quick-tip' },
    { t: 'The AI tutor that refuses to do your homework for you', a: 'AI tutor teaches the method', fmt: 'Reel 15–25s', hook: 'bold-question' },
    { t: 'Stop re-reading your notes. Do this instead.', a: 'active recall / flashcards + quiz', fmt: 'TikTok 20–30s', hook: 'quick-tip' },
    { t: 'Free GCSE Maths revision plan in one minute', a: '/free/gcse-maths/ subject tool', fmt: 'Short 15s', hook: 'surprising-stat' },
    { t: 'Parents: report cards are autopsies. You want a heartbeat.', a: 'parent dashboard + early alerts', fmt: 'Reel 25–35s', hook: 'relatable-problem' },
    { t: 'What grade are you ACTUALLY on track for? (be honest)', a: 'predicted grade tool', fmt: 'TikTok 20–30s', hook: 'bold-question' },
    { t: 'A tutor is £40/hour. This is free.', a: 'free AI tutor vs private tuition cost', fmt: 'Reel 15–25s', hook: 'surprising-stat' },
    { t: 'Turn any topic into flashcards in 5 seconds', a: 'AI flashcard maker', fmt: 'Short 15s', hook: 'quick-tip' },
    { t: 'The 4-week revision plan that actually works', a: 'free revision plan tool', fmt: 'Reel 25–35s', hook: 'quick-tip' },
    { t: 'How to choose GCSE options without wrecking your future', a: 'Career Passport', fmt: 'TikTok 25–35s', hook: 'bold-question' },
    { t: 'Mark my essay: instant examiner feedback with targets', a: 'AI essay marking', fmt: 'Reel 20–30s', hook: 'behind-the-scenes' },
    { t: 'Free A-Level Biology predicted grade + plan', a: '/free/alevel-biology/ subject tool', fmt: 'Short 15s', hook: 'surprising-stat' },
    { t: 'Times tables still shaky? Fix it in a week.', a: 'SkillRush / Maths Heroes fluency', fmt: 'Reel 20–30s', hook: 'relatable-problem' },
    { t: 'The night-before-the-exam plan (if you left it late)', a: 'revision plan tool, exam mode', fmt: 'TikTok 25–35s', hook: 'relatable-problem' },
    { t: 'Why past papers early = higher grades', a: 'exam practice + predicted grades', fmt: 'Reel 20–30s', hook: 'surprising-stat' },
    { t: 'Parents: the one thing to do this week to help', a: 'Parent Action Cards', fmt: 'Reel 20–30s', hook: 'quick-tip' },
    { t: 'Get your revision plan emailed to you (free)', a: 'free tool + email plan', fmt: 'Short 15s', hook: 'quick-tip' },
    { t: 'How spaced repetition beats cramming (proof)', a: 'Smart Review / spaced repetition', fmt: 'TikTok 25–35s', hook: 'surprising-stat' },
    { t: 'Free GCSE English Literature plan + predicted grade', a: '/free/gcse-english-literature/', fmt: 'Short 15s', hook: 'surprising-stat' },
    { t: 'Struggling in one subject? Start here (free).', a: 'free tool → AI tutor', fmt: 'Reel 15–25s', hook: 'relatable-problem' },
    { t: 'The revision timetable maker that adapts to your mood', a: 'study planner + energy check-in', fmt: 'Reel 20–30s', hook: 'behind-the-scenes' },
    { t: 'Quiz yourself on any topic in seconds', a: 'AI quiz generator', fmt: 'Short 15s', hook: 'quick-tip' },
    { t: 'How to actually learn a topic (interactive lesson demo)', a: 'interactive AI lessons', fmt: 'TikTok 25–35s', hook: 'behind-the-scenes' },
    { t: 'Free predicted grade for every GCSE subject', a: '/free/ subject hub', fmt: 'Reel 15–25s', hook: 'surprising-stat' },
    { t: 'Invite a friend, you both get free credits', a: 'referral loop', fmt: 'Short 15s', hook: 'quick-tip' },
    { t: 'From "no idea where to start" to a plan, free, in 60s', a: 'free tool end-to-end', fmt: 'Reel 20–30s', hook: 'relatable-problem' }
  ];
  function idx() { try { return Math.floor(new Date().getTime() / 86400000) % CAL.length; } catch (e) { return 0; } }
  function today() { return CAL[idx()]; }
  function upcoming(n) { var out = [], b = idx(); for (var i = 0; i < n; i++) out.push(CAL[(b + i) % CAL.length]); return out; }

  /* ---- SYAI loader + metering ---- */
  var aiP = null;
  function ensureAI() {
    if (window.SYAI) return Promise.resolve(true);
    if (aiP) return aiP;
    aiP = new Promise(function (res) { var s = document.createElement('script'); s.src = BASE + 'ai.js'; s.onload = function () { res(!!window.SYAI); }; s.onerror = function () { res(false); }; (document.head || document.documentElement).appendChild(s); });
    return aiP;
  }
  function sys() { return 'You are StudYear\'s short-form video producer, growing a UK edtech brand organically on TikTok, Reels and Shorts. Native, punchy, honest, never cringe or salesy. The product: an AI study OS with a genuinely free tier. EVERY post ends with a clear call to action to the free tool at ' + FREE + ' (predicted grade + personalised revision plan, no sign-up).'; }
  function userPrompt(idea) {
    return 'Create a ready-to-film ' + idea.fmt + ' about: "' + idea.t + '" (angle: ' + idea.a + '). Hook style: ' + idea.hook + '.\n' +
      'Return clearly labelled sections:\n' +
      'HOOK — the first 3 seconds (spoken line + on-screen text).\n' +
      'SCRIPT — 3–5 scenes, each as [visual] / [on-screen text] / [voiceover].\n' +
      'CAPTION — 1–2 lines with a clear CTA to ' + FREE + '.\n' +
      'HASHTAGS — 8–12, UK study/GCSE, a mix of broad and niche (no spammy tags).\n' +
      'BEST TIME — the best time to post this in the UK and why (one line).';
  }
  function generate(idea) {
    return ensureAI().then(function (ok) {
      if (!ok || !window.SYAI) throw new Error('offline');
      return SYAI.ask(sys(), userPrompt(idea), { maxTokens: 950, temperature: 0.85, acus: 2, label: 'Social autopilot' });
    });
  }
  function fallback(idea) {
    return 'HOOK\n“' + idea.t + '” — on-screen text: big, bold, first frame.\n\n' +
      'SCRIPT\n[Scene 1 — talking to camera] Hook line above.\n[Scene 2 — screen-record the free tool] Show entering a mark + exam date → a grade appears.\n[Scene 3 — screen-record the plan] Scroll the week-by-week plan.\n[Scene 4 — you again] “It’s free, no sign-up. Link in bio.”\n\n' +
      'CAPTION\n' + idea.t + ' Try it free (no sign-up): ' + FREE + '\n\n' +
      'HASHTAGS\n#gcse #gcses #revision #alevels #studytok #gcse2026 #studytips #examseason #ukschool #studygram\n\n' +
      'BEST TIME\nUK after-school 4–7pm on weekdays, or Sunday evening (revision-planning mindset).\n\n_(Offline draft — reconnect for an AI-tailored script.)_';
  }

  /* ---- posted tracker ---- */
  function postedMap() { try { return (window.SY && SY.get('social-posted', {})) || {}; } catch (e) { return {}; } }
  function markPosted(t) { try { var m = postedMap(); m[t] = new Date().toISOString().slice(0, 10); SY.set('social-posted', m); } catch (e) {} }

  /* ---- UI ---- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function download(name, text) { try { var b = new Blob([text], { type: 'text/plain' }); var u = URL.createObjectURL(b); var a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400); } catch (e) {} }
  var STYLE = '#social-root .so-idea{border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:12px 14px;background:rgba(6,11,24,.28);margin-top:10px}' +
    '#social-root .so-idea .fmt{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#4FA6E0}' +
    '#social-root .so-idea b{display:block;font-size:14px;margin:3px 0}#social-root .so-idea span{font-size:12px;color:var(--ink-3,#8795AE)}' +
    '#social-root .so-out{margin-top:10px;background:rgba(6,11,24,.4);border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:14px;font-size:13px;white-space:pre-wrap;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}' +
    '#social-root .so-act{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}' +
    '#social-root .so-list{margin-top:10px}#social-root .so-row{display:flex;gap:8px;align-items:center;font-size:12.5px;padding:6px 0;border-bottom:1px solid var(--line,rgba(120,140,190,.12))}#social-root .so-row .p{color:#5CBB7B;margin-left:auto;font-size:11px}';
  function injectStyle() { if (document.getElementById('so-style')) return; var s = document.createElement('style'); s.id = 'so-style'; s.textContent = STYLE; document.head.appendChild(s); }

  function ideaCard(i) { return '<div class="so-idea"><div class="fmt">' + esc(i.fmt) + ' · today</div><b>' + esc(i.t) + '</b><span>Angle: ' + esc(i.a) + ' → ' + FREE + '</span></div>'; }

  function render(host) {
    var t = today();
    host.innerHTML = '<h3>📱 Social content autopilot</h3>' +
      '<div class="sub" style="color:var(--ink-3,#8795AE);font-size:12.5px">A ready-to-film short-video script, caption and hashtags for today — every post drives traffic to the free tool. Generate, copy, post.</div>' +
      ideaCard(t) +
      '<div class="so-act"><button class="btn sm solid" id="so-gen">Generate today\'s post</button><button class="btn sm" id="so-batch">Batch next 7 days</button><button class="btn sm" id="so-cal">Show calendar</button></div>' +
      '<div class="so-out" id="so-out" hidden></div><div id="so-cal-wrap"></div>';
    var out = host.querySelector('#so-out');
    function show(text, idea) {
      out.hidden = false; out.textContent = text;
      var bar = document.createElement('div'); bar.className = 'so-act';
      bar.innerHTML = '<button class="btn sm solid" data-copy>Copy</button><button class="btn sm" data-dl>Download</button><button class="btn sm" data-re>Regenerate</button><button class="btn sm" data-posted>Mark posted ✓</button>';
      out.after(bar);
      bar.querySelector('[data-copy]').onclick = function () { try { navigator.clipboard.writeText(text); this.textContent = '✓ Copied'; } catch (e) {} };
      bar.querySelector('[data-dl]').onclick = function () { download('studyear-social-' + new Date().toISOString().slice(0, 10) + '.txt', text); };
      bar.querySelector('[data-re]').onclick = function () { bar.remove(); run(idea); };
      bar.querySelector('[data-posted]').onclick = function () { markPosted(idea.t); this.textContent = '✓ Logged'; };
    }
    function run(idea) {
      out.hidden = false; out.textContent = 'Writing your ' + idea.fmt + '…';
      generate(idea).then(function (txt) { show(txt, idea); }).catch(function () { show(fallback(idea), idea); });
    }
    host.querySelector('#so-gen').onclick = function () { run(today()); };
    host.querySelector('#so-batch').onclick = function () {
      out.hidden = false; out.textContent = 'Generating 7 days of content…';
      var days = upcoming(7), acc = [];
      (function next(k) {
        if (k >= days.length) { var all = acc.join('\n\n' + '─'.repeat(40) + '\n\n'); out.textContent = all; download('studyear-social-7day.txt', all); return; }
        generate(days[k]).then(function (t) { acc.push('DAY ' + (k + 1) + ' · ' + days[k].t + '\n\n' + t); out.textContent = 'Generated ' + (k + 1) + '/7…'; next(k + 1); })
          .catch(function () { acc.push('DAY ' + (k + 1) + ' · ' + days[k].t + '\n\n' + fallback(days[k])); next(k + 1); });
      })(0);
    };
    host.querySelector('#so-cal').onclick = function () {
      var w = host.querySelector('#so-cal-wrap'); if (w.innerHTML) { w.innerHTML = ''; return; }
      var posted = postedMap();
      w.innerHTML = '<div class="so-list">' + upcoming(14).map(function (i, k) { return '<div class="so-row"><span style="color:var(--ink-3,#8795AE)">Day ' + (k + 1) + '</span> ' + esc(i.t) + (posted[i.t] ? '<span class="p">posted ' + posted[i.t] + '</span>' : '') + '</div>'; }).join('') + '</div>';
    };
  }

  function mount(target) {
    injectStyle();
    var host = target || document.getElementById('social-root'); if (!host) return null;
    if (host.getAttribute('data-sy-social') === '1') return host;
    host.setAttribute('data-sy-social', '1');
    if (!/\bcard\b/.test(host.className)) host.className = (host.className ? host.className + ' ' : '') + 'card';
    render(host); ensureAI();
    return host;
  }
  window.SYSocial = { mount: mount, today: today, upcoming: upcoming, calendar: CAL };
  function auto() { if (document.getElementById('social-root')) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
