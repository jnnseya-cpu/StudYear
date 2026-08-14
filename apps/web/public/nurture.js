/**
 * StudYear Lifecycle & Nurture Agent (window.SYNurture)
 * ---------------------------------------------------------------------------
 * Growth agent #4. The free tools capture emails into `leads/` (via /lead) and
 * the referral loop brings people in — but a captured email that never gets a
 * follow-up is a dead letter. This agent closes that loop: it pulls the real
 * captured leads (admin-only, from the secure backend), segments them by
 * lifecycle stage, and uses the live AI to draft a persona-appropriate,
 * multi-touch email sequence for each segment — then exports a mail-merge CSV
 * so the owner can send from any provider.
 *
 * HONEST SCOPE: this AUTOMATES the audience segmentation + sequence WRITING,
 * not the actual send (that needs an email provider's keys). A human exports
 * the CSV + sequence and sends from their ESP (Brevo/Mailchimp/etc.), or wires
 * the sequence into a provider. Every AI draft is metered in ACUs via SYAI,
 * like every AI action — no free pass. Emails are MASKED in the on-screen list
 * (PII mandate); full addresses live only in the exported CSV on the owner's
 * machine, pulled fresh from the authenticated backend.
 */
(function () {
  'use strict';
  if (window.SYNurture) return;
  var BASE = (function () { try { var s = (document.currentScript && document.currentScript.src) || ''; return s ? s.replace(/nurture\.js.*$/, '') : '../'; } catch (e) { return '../'; } })();
  var FREE = 'studyear.com/free';

  /* ---- lifecycle segments: each a trigger + an ordered multi-touch plan ---- */
  var SEG = [
    {
      id: 'new-lead', name: 'New lead — captured, no account yet',
      who: 'Someone used a free tool (predicted grade / revision plan) and left their email, but has not created a StudYear account.',
      goal: 'Deliver more value, then convert to a free account.',
      touches: [
        { day: 0, goal: 'Deliver: here is your plan + one quick win they can do today. Warm, useful, zero hard sell.' },
        { day: 2, goal: 'Teach: one revision-science tip (retrieval/spacing) + how StudYear does it for them. Soft nudge to create a free account.' },
        { day: 5, goal: 'Convert: what they unlock with a free account (AI tutor, saved plan, progress) — clear CTA, honest that it is free (100 ACUs / 3 months).' }
      ]
    },
    {
      id: 'parent-lead', name: 'Parent lead — worried about a child',
      who: 'A parent captured via the free tool or a school flyer. Wants to help but may not be able to afford tuition.',
      goal: 'Reassure, show the parent dashboard + early alerts, convert to a free family account.',
      touches: [
        { day: 0, goal: 'Empathy + one thing they can do this week to help their child (a Parent Action Card). No jargon.' },
        { day: 3, goal: 'Show the parent dashboard: report cards are autopsies, you want a heartbeat — early alerts before grades slip.' },
        { day: 6, goal: 'Convert: free family account, free for the child, honest that every family can afford free StudYear. CTA.' }
      ]
    },
    {
      id: 'signup-inactive', name: 'Signed up — never got started',
      who: 'Created a StudYear account but has done little/nothing in the first few days.',
      goal: 'Re-onboard: get them to their first "aha" (a plan, a lesson, a quiz).',
      touches: [
        { day: 1, goal: 'One-tap first step: "do this one thing" (generate a plan or a 5-minute quiz). Remove friction.' },
        { day: 4, goal: 'Show a quick win others got + the single most valuable feature for their role. CTA back in.' }
      ]
    },
    {
      id: 'dormant', name: 'Dormant — no login for 30+ days',
      who: 'An existing user who has gone quiet.',
      goal: 'Win-back: a timely, relevant reason to return (exam season, a new feature, their saved plan).',
      touches: [
        { day: 0, goal: 'Win-back: "your revision plan is still here" + what changed since (new AI tools). Low-pressure, one CTA.' },
        { day: 4, goal: 'Last touch: a genuinely useful free resource (a plan for the next assessment) + easy return. Then stop.' }
      ]
    },
    {
      id: 'school-contact', name: 'School / MAT contact — pass to parents',
      who: 'A school staff contact (head, careers/pastoral lead) captured via outreach. Not every family can afford tuition; every family can afford free StudYear.',
      goal: 'Equip the school to pass free StudYear to families + show the school platform (incl. NEET early-warning / Future-Readiness).',
      touches: [
        { day: 0, goal: 'Equity hook: a ready-to-forward parent message + the free flyer. Make it one click for them to help families.' },
        { day: 4, goal: 'Sell the school platform: Future-Readiness / NEET early identification, cohort view, government-aligned. Offer a 3-min demo.' }
      ]
    }
  ];
  function seg(id) { for (var i = 0; i < SEG.length; i++) if (SEG[i].id === id) return SEG[i]; return SEG[0]; }

  /* ---- SYAI loader + metering ---- */
  var aiP = null;
  function ensureAI() {
    if (window.SYAI) return Promise.resolve(true);
    if (aiP) return aiP;
    aiP = new Promise(function (res) { var s = document.createElement('script'); s.src = BASE + 'ai.js'; s.onload = function () { res(!!window.SYAI); }; s.onerror = function () { res(false); }; (document.head || document.documentElement).appendChild(s); });
    return aiP;
  }
  function sys() {
    return 'You are StudYear\'s lifecycle-email copywriter, growing a UK edtech brand. StudYear is an AI study operating system with a genuinely free tier (100 ACUs every 3 months). Write warm, human, concise British-English emails that give value before asking for anything. Never spammy, never over-promise, no fake urgency. Every email has ONE clear call to action, and the free entry point is the tool at ' + FREE + ' (predicted grade + personalised revision plan, no sign-up).';
  }
  function userPrompt(s, ctx) {
    var lines = s.touches.map(function (t) { return 'Email ' + (s.touches.indexOf(t) + 1) + ' — send on day ' + t.day + ': ' + t.goal; }).join('\n');
    return 'Write a ' + s.touches.length + '-email lifecycle sequence for this segment.\n' +
      'SEGMENT: ' + s.name + '\nWHO THEY ARE: ' + s.who + '\nSEQUENCE GOAL: ' + s.goal + '\n' +
      (ctx && ctx.n ? 'AUDIENCE SIZE: ~' + ctx.n + ' contacts' + (ctx.top ? ' (most common interest: ' + ctx.top + ')' : '') + '.\n' : '') +
      'TOUCHES:\n' + lines + '\n\n' +
      'For EACH email return, clearly labelled:\n' +
      '=== EMAIL n (day X) ===\nSUBJECT: a short, honest subject line (no clickbait).\nPREVIEW: one-line preheader.\nBODY: 90–140 words, friendly, skimmable, British English. Use {{first_name}} as a merge field. End with ONE call to action.\nCTA: the exact button/link text and where it goes (' + FREE + ' or "create your free account").\n\n' +
      'Keep the whole thing paste-ready for an email provider.';
  }
  function generate(s, ctx) {
    return ensureAI().then(function (ok) {
      if (!ok || !window.SYAI) throw new Error('offline');
      return SYAI.ask(sys(), userPrompt(s, ctx), { maxTokens: 1200, temperature: 0.7, acus: 3, label: 'Lifecycle nurture' });
    });
  }
  function fallback(s) {
    var out = '';
    s.touches.forEach(function (t, i) {
      out += '=== EMAIL ' + (i + 1) + ' (day ' + t.day + ') ===\n' +
        'SUBJECT: ' + (i === 0 ? 'Your StudYear plan — one quick win inside' : (i === s.touches.length - 1 ? 'A free next step for {{first_name}}' : 'One small thing that helps, {{first_name}}')) + '\n' +
        'PREVIEW: Two minutes, genuinely useful, no pressure.\n' +
        'BODY: Hi {{first_name}}, ' + t.goal.charAt(0).toLowerCase() + t.goal.slice(1) + ' You can start free in 60 seconds — no sign-up needed for the tool itself.\n' +
        'CTA: ' + (i === s.touches.length - 1 ? 'Create your free account →' : 'Open my free plan → ' + FREE) + '\n\n';
    });
    return out + '_(Offline draft — reconnect for an AI-tailored, on-brand sequence.)_';
  }

  /* ---- leads (admin-only, from the secure backend) ---- */
  function sessionEmail() { try { return (window.SY && SY.session && SY.session.email) || ''; } catch (e) { return ''; } }
  function maskEmail(e) { e = String(e || ''); var at = e.indexOf('@'); if (at < 1) return '•••'; var u = e.slice(0, at), d = e.slice(at + 1); return (u.length <= 2 ? u[0] + '•' : u.slice(0, 2) + '•••') + '@' + d; }
  function loadLeads() {
    try {
      if (!(window.SYCloud && SYCloud.leadsList)) return Promise.resolve(null);
      return SYCloud.leadsList(sessionEmail()).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  function csvEscape(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function leadsCsv(items) {
    var head = 'email,first_name,source,subject,grade,ref,captured,contacted\n';
    return head + (items || []).map(function (l) {
      var fn = String(l.email || '').split('@')[0].replace(/[._-].*$/, '');
      return [l.email, fn, l.source, l.subject, l.grade, l.ref, l.createdAt, l.contacted ? 'yes' : 'no'].map(csvEscape).join(',');
    }).join('\n');
  }

  /* ---- UI helpers ---- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function download(name, text, type) { try { var b = new Blob([text], { type: type || 'text/plain' }); var u = URL.createObjectURL(b); var a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400); } catch (e) {} }
  var STYLE = '#nurture-root .nu-seg{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}' +
    '#nurture-root .nu-chip{font-size:12px;border:1px solid var(--line,rgba(120,140,190,.28));border-radius:999px;padding:6px 12px;cursor:pointer;background:rgba(6,11,24,.28);color:var(--ink-2,#c3ccdf)}' +
    '#nurture-root .nu-chip.on{border-color:#4FA6E0;background:rgba(79,166,224,.14);color:#fff}' +
    '#nurture-root .nu-meta{border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:12px 14px;background:rgba(6,11,24,.28);margin-top:10px}' +
    '#nurture-root .nu-meta b{display:block;font-size:14px;margin:2px 0}#nurture-root .nu-meta span{font-size:12px;color:var(--ink-3,#8795AE)}' +
    '#nurture-root .nu-leads{margin-top:10px;font-size:12.5px}#nurture-root .nu-leads .pill{display:inline-block;font-size:11px;border:1px solid var(--line,rgba(120,140,190,.24));border-radius:999px;padding:2px 9px;margin:3px 5px 0 0;color:var(--ink-3,#8795AE)}' +
    '#nurture-root .nu-out{margin-top:10px;background:rgba(6,11,24,.4);border:1px solid var(--line,rgba(120,140,190,.28));border-radius:12px;padding:14px;font-size:13px;white-space:pre-wrap;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}' +
    '#nurture-root .nu-act{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}';
  function injectStyle() { if (document.getElementById('nu-style')) return; var s = document.createElement('style'); s.id = 'nu-style'; s.textContent = STYLE; document.head.appendChild(s); }

  function render(host) {
    var cur = SEG[0];
    var leads = null; // {items, counts} once loaded

    host.innerHTML = '<h3>✉️ Lifecycle &amp; nurture agent</h3>' +
      '<div class="sub" style="color:var(--ink-3,#8795AE);font-size:12.5px">Turns captured free-tool leads into customers. Pick a lifecycle stage, let the AI draft the email sequence, export your audience as a mail-merge CSV, and send from your provider.</div>' +
      '<div class="nu-seg" id="nu-seg"></div>' +
      '<div class="nu-meta" id="nu-meta"></div>' +
      '<div class="nu-leads" id="nu-leads"></div>' +
      '<div class="nu-act"><button class="btn sm solid" id="nu-gen">Draft this sequence</button><button class="btn sm" id="nu-all">Draft all segments</button><button class="btn sm" id="nu-leadbtn">Load captured leads</button></div>' +
      '<div class="nu-out" id="nu-out" hidden></div>';

    var segBox = host.querySelector('#nu-seg');
    segBox.innerHTML = SEG.map(function (s) { return '<span class="nu-chip" data-seg="' + s.id + '">' + esc(s.name) + '</span>'; }).join('');
    var out = host.querySelector('#nu-out');

    function paintMeta() {
      host.querySelector('#nu-meta').innerHTML = '<b>' + esc(cur.name) + '</b><span>' + esc(cur.who) + '</span>' +
        '<span style="display:block;margin-top:5px">Sequence: ' + cur.touches.length + ' emails · goal: ' + esc(cur.goal) + '</span>';
      Array.prototype.forEach.call(segBox.children, function (c) { c.className = 'nu-chip' + (c.getAttribute('data-seg') === cur.id ? ' on' : ''); });
    }
    function selectSeg(id) { cur = seg(id); paintMeta(); }
    segBox.onclick = function (e) { var c = e.target.closest('[data-seg]'); if (c) selectSeg(c.getAttribute('data-seg')); };
    paintMeta();

    function ctxFor() {
      if (!leads || !leads.items) return null;
      var top = ''; if (leads.counts && leads.counts.bySubject) { var best = 0; for (var k in leads.counts.bySubject) if (leads.counts.bySubject[k] > best) { best = leads.counts.bySubject[k]; top = k; } }
      return { n: leads.items.length, top: top };
    }

    function renderLeads() {
      var box = host.querySelector('#nu-leads');
      if (leads === null) { box.innerHTML = ''; return; }
      if (leads === false) { box.innerHTML = '<div style="color:var(--ink-3,#8795AE)">Backend not reachable — you can still draft sequences above. Deploy the backend to load real captured leads and export them.</div>'; return; }
      var items = leads.items || [];
      if (!items.length) { box.innerHTML = '<div style="color:var(--ink-3,#8795AE)">No captured leads yet. Once visitors leave their email on a /free/ tool, they appear here.</div>'; return; }
      var c = leads.counts || {};
      var sources = c.bySource || {};
      var pills = Object.keys(sources).map(function (k) { return '<span class="pill">' + esc(k) + ': ' + sources[k] + '</span>'; }).join('');
      var sample = items.slice(0, 6).map(function (l) { return esc(maskEmail(l.email)) + (l.subject ? ' · ' + esc(l.subject) : '') + (l.contacted ? ' ✓' : ''); }).join('<br>');
      box.innerHTML = '<b style="color:var(--ink-2,#c3ccdf)">' + items.length + ' captured lead' + (items.length === 1 ? '' : 's') + '</b> ' +
        (c.notContacted != null ? '<span style="color:var(--ink-3,#8795AE)">· ' + c.notContacted + ' not yet contacted</span>' : '') +
        '<div style="margin-top:5px">' + pills + '</div>' +
        '<div style="margin-top:7px;color:var(--ink-3,#8795AE)">' + sample + (items.length > 6 ? '<br>…and ' + (items.length - 6) + ' more' : '') + '</div>' +
        '<div class="nu-act"><button class="btn sm solid" id="nu-csv">Export mail-merge CSV</button><button class="btn sm" id="nu-mark">Mark all contacted</button></div>';
      host.querySelector('#nu-csv').onclick = function () { download('studyear-leads-' + new Date().toISOString().slice(0, 10) + '.csv', leadsCsv(items), 'text/csv'); };
      var mk = host.querySelector('#nu-mark');
      if (mk) mk.onclick = function () {
        var ids = items.filter(function (l) { return !l.contacted; }).map(function (l) { return l.id; });
        if (!ids.length) { mk.textContent = 'All contacted ✓'; return; }
        mk.textContent = 'Marking…'; mk.disabled = true;
        (window.SYCloud && SYCloud.leadMark ? SYCloud.leadMark(ids, sessionEmail()) : Promise.resolve(false)).then(function (ok) {
          if (ok) { items.forEach(function (l) { l.contacted = true; }); leads.counts && (leads.counts.notContacted = 0); renderLeads(); }
          else { mk.textContent = 'Mark failed — retry'; mk.disabled = false; }
        });
      };
    }

    function fetchLeads(btn) {
      if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }
      loadLeads().then(function (r) {
        leads = r && r.ok ? { items: r.items || [], counts: r.counts || {} } : (r === null ? false : false);
        renderLeads();
        if (btn) { btn.textContent = 'Refresh leads'; btn.disabled = false; }
      });
    }

    function show(text, s) {
      out.hidden = false; out.textContent = text;
      var bar = document.createElement('div'); bar.className = 'nu-act';
      bar.innerHTML = '<button class="btn sm solid" data-copy>Copy</button><button class="btn sm" data-dl>Download</button><button class="btn sm" data-re>Regenerate</button>';
      out.after(bar);
      bar.querySelector('[data-copy]').onclick = function () { try { navigator.clipboard.writeText(text); this.textContent = '✓ Copied'; } catch (e) {} };
      bar.querySelector('[data-dl]').onclick = function () { download('studyear-nurture-' + s.id + '.txt', text); };
      bar.querySelector('[data-re]').onclick = function () { bar.remove(); run(s); };
    }
    function run(s) {
      out.hidden = false; out.textContent = 'Writing the ' + s.touches.length + '-email sequence for “' + s.name + '”…';
      generate(s, ctxFor()).then(function (txt) { show(txt, s); }).catch(function () { show(fallback(s), s); });
    }

    host.querySelector('#nu-gen').onclick = function () { run(cur); };
    host.querySelector('#nu-leadbtn').onclick = function () { fetchLeads(this); };
    host.querySelector('#nu-all').onclick = function () {
      out.hidden = false; out.textContent = 'Drafting all ' + SEG.length + ' sequences…';
      var acc = [];
      (function next(k) {
        if (k >= SEG.length) { var all = acc.join('\n\n' + '═'.repeat(46) + '\n\n'); out.textContent = all; download('studyear-nurture-all-segments.txt', all); return; }
        var s = SEG[k];
        generate(s, ctxFor()).then(function (t) { acc.push('SEGMENT: ' + s.name + '\n\n' + t); out.textContent = 'Drafted ' + (k + 1) + '/' + SEG.length + '…'; next(k + 1); })
          .catch(function () { acc.push('SEGMENT: ' + s.name + '\n\n' + fallback(s)); next(k + 1); });
      })(0);
    };

    // Best-effort auto-load of leads. cloud.js is injected async by guard.js,
    // so poll briefly for the bridge before giving up (button still works).
    (function waitCloud(n) {
      if (window.SYCloud && SYCloud.leadsList) { fetchLeads(null); return; }
      if (n > 0) setTimeout(function () { waitCloud(n - 1); }, 400);
    })(8);
  }

  function mount(target) {
    injectStyle();
    var host = target || document.getElementById('nurture-root'); if (!host) return null;
    if (host.getAttribute('data-sy-nurture') === '1') return host;
    host.setAttribute('data-sy-nurture', '1');
    if (!/\bcard\b/.test(host.className)) host.className = (host.className ? host.className + ' ' : '') + 'card';
    render(host); ensureAI();
    return host;
  }
  window.SYNurture = { mount: mount, segments: SEG };
  function auto() { if (document.getElementById('nurture-root')) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
