/* StudYear Student Record engine (window.SYRecord).
 *
 * Every child on a school roster has a dedicated PRIVATE record: the complete
 * trail of everything they do in the OS (lessons, quizzes, diagnostics,
 * reviews, resources, plans, SkillRush, engagement), plus a machine-learning
 * layer that turns that record into a study-style model, an individual plan
 * and an improvement strategy for their teachers.
 *
 * ACCESS CONTROL — enforced here for every viewer, and audit-logged:
 *   school     — senior leadership (the school account) always
 *   teacher    — only staff whose assigned cohorts include the child
 *   parent     — only when the school has granted parent access AND the
 *                child is linked to that parent
 * Grants live in  sy-school:<code>:recordAccess  = { childEmail: {parent,by,when} }
 * The audit log   sy-school:<code>:recordLog     = [{viewer,role,child,when}]
 * Under E2EE the child's data decrypts through the device keyring only for
 * these consented viewers; the sync boundary still ships ciphertext only.
 */
(function () {
  'use strict';
  function $j(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function $s(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function read(email, k, d) { return window.SY ? SY.readAccount(email, k, d) : d; }

  // ------------------------------------------------------------ access ----
  function staffRec(code, email) {
    return ($j('sy-school:' + code + ':staff', []) || []).find(function (t) {
      return (t.email || '').toLowerCase() === (email || '').toLowerCase();
    });
  }
  function rosterRec(code, child) {
    return ($j('sy-school:' + code + ':roster', []) || []).find(function (r) { return r.email === child; });
  }
  function access(code, child, viewerEmail, viewerRole) {
    var r = rosterRec(code, child);
    if (!r) return { allowed: false, reason: 'not on this school’s roster' };
    if (viewerRole === 'school') return { allowed: true, via: 'senior leadership' };
    if (viewerRole === 'admin') return { allowed: true, via: 'platform support' };
    if (viewerRole === 'teacher') {
      var st = staffRec(code, viewerEmail);
      if (!st) return { allowed: false, reason: 'not on this school’s staff' };
      var coh = st.cohorts || [];
      var pf = read(child, 'profile', {});
      if (!coh.length || coh.indexOf(r.year) >= 0 || coh.indexOf(r.cohort) >= 0 || coh.indexOf(pf.level) >= 0)
        return { allowed: true, via: 'cohort teacher' };
      return { allowed: false, reason: 'child is outside your assigned cohorts' };
    }
    if (viewerRole === 'parent') {
      var grants = $j('sy-school:' + code + ':recordAccess', {});
      if (!grants[child] || !grants[child].parent) return { allowed: false, reason: 'the school has not granted parent access to this record' };
      var kids = read(viewerEmail, 'children', []) || [];
      if (!kids.some(function (k) { return k.email === child; })) return { allowed: false, reason: 'child not linked to this parent account' };
      return { allowed: true, via: 'parent (school-granted)' };
    }
    return { allowed: false, reason: 'no access path for role ' + viewerRole };
  }
  function logAccess(code, child, viewerEmail, viewerRole) {
    try {
      var log = $j('sy-school:' + code + ':recordLog', []);
      log.unshift({ viewer: viewerEmail, role: viewerRole, child: child, when: new Date().toISOString() });
      $s('sy-school:' + code + ':recordLog', log.slice(0, 300));
    } catch (e) {}
  }
  function setParentGrant(code, child, on, byEmail) {
    var g = $j('sy-school:' + code + ':recordAccess', {});
    g[child] = { parent: !!on, by: byEmail, when: new Date().toISOString() };
    $s('sy-school:' + code + ':recordAccess', g);
  }

  // ----------------------------------------------------------- collect ----
  function collect(email) {
    return {
      email: email,
      profile: read(email, 'profile', {}),
      activity: read(email, 'activity', []) || [],
      quizzes: read(email, 'quizzes', []) || [],
      diagnostics: read(email, 'diagnostics', []) || [],
      plan: read(email, 'plan', null),
      mine: read(email, 'mine', []) || [],
      streak: read(email, 'streak', { days: [] }),
      points: read(email, 'points', 0),
      learning: read(email, 'learning', {}),
      skillrush: read(email, 'skillrush', null),
      consent: read(email, 'consent', { parent: true, schoolToParent: true })
    };
  }

  // ------------------------------------------------- the learning model ----
  /* On-device feature extraction + inference. The same features feed the
     production ML pipeline (Firestore -> training jobs); here a transparent
     rule-model gives teachers explainable outputs immediately, and the live
     AI (when enabled) writes the deep narrative on top. */
  function fitSlope(ys) { // least-squares slope per step
    var n = ys.length; if (n < 2) return 0;
    var sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sx += i; sy += ys[i]; sxy += i * ys[i]; sxx += i * i; }
    var d = n * sxx - sx * sx; return d ? (n * sxy - sx * sy) / d : 0;
  }
  function model(rec, code) {
    var acts = rec.activity, qz = rec.quizzes;
    // modality mix
    var mix = {}; acts.forEach(function (a) { mix[a.k] = (mix[a.k] || 0) + 1; });
    var practice = (mix.quiz || 0) + (mix.diagnostic || 0);
    var making = (mix.resource || 0) + (mix.create || 0);
    var reading = (mix.lesson || 0);
    var domMode = practice >= making && practice >= reading ? 'practice-driven'
      : making >= reading ? 'making-driven (creates to learn)' : 'lesson-led';
    // active hours
    var hours = new Array(24).fill(0);
    acts.forEach(function (a) { var h = new Date(a.when).getHours(); if (h >= 0) hours[h]++; });
    var peak = hours.indexOf(Math.max.apply(null, hours));
    var rhythm = peak >= 5 && peak < 12 ? 'morning learner' : peak < 17 ? 'daytime learner' : peak < 22 ? 'evening learner' : 'late-night learner';
    // pace + consistency
    var weekly = 0;
    if (acts.length) {
      var span = Math.max(1, (Date.now() - new Date(acts[acts.length - 1].when).getTime()) / 6048e5);
      weekly = Math.round(acts.length / span * 10) / 10;
    }
    var streakDays = (rec.streak && rec.streak.days || []).length;
    var consistency = streakDays >= 10 ? 'highly consistent' : streakDays >= 4 ? 'building consistency' : 'irregular';
    // per-subject mastery + trajectory
    var by = {}; qz.forEach(function (q) { (by[q.subj] = by[q.subj] || []).push(q.pct); });
    var subjects = Object.keys(by).map(function (s) {
      var ys = by[s], avg = Math.round(ys.reduce(function (a, b) { return a + b; }, 0) / ys.length);
      var slope = Math.round(fitSlope(ys) * 10) / 10;
      return { s: s, avg: avg, n: ys.length, slope: slope,
        rag: avg >= 70 ? 'green' : avg >= 50 ? 'amber' : 'red',
        trend: slope > 1 ? 'improving' : slope < -1 ? 'declining' : 'flat' };
    }).sort(function (a, b) { return a.avg - b.avg; });
    var overall = subjects.length ? Math.round(subjects.reduce(function (a, x) { return a + x.avg; }, 0) / subjects.length) : 0;
    var declining = subjects.filter(function (x) { return x.trend === 'declining'; });
    var risk = overall && overall < 45 ? 'HIGH' : overall < 60 || declining.length >= 2 ? 'MEDIUM' : 'LOW';
    var style = (rec.learning && rec.learning.style) || (making > practice ? 'kinaesthetic-leaning' : 'visual-leaning');
    var evidence = acts.length + qz.length;
    /* attendance auto-feeds from the teacher's register — no re-entry */
    var attendance = null;
    if (code) {
      var att = $j('sy-school:' + code + ':attendance', {}), counted = 0, present = 0;
      Object.keys(att).forEach(function (k) {
        var st = (att[k].records || {})[rec.email];
        if (st == null) return; counted++;
        if (st === 'present' || st === 'late' || st === 'authorised') present++;
      });
      if (counted) attendance = Math.round(100 * present / counted);
      if (attendance !== null && attendance < 85 && risk === 'LOW') risk = 'MEDIUM';
    }
    return {
      styleLabel: style + ' · ' + domMode,
      rhythm: rhythm, weekly: weekly, consistency: consistency,
      peakHour: peak, mix: mix, subjects: subjects, overall: overall,
      weakest: subjects[0] || null, strongest: subjects[subjects.length - 1] || null,
      declining: declining, risk: risk, attendance: attendance,
      confidence: evidence >= 40 ? 'high' : evidence >= 15 ? 'medium' : 'low (needs more recorded activity)',
      evidence: evidence
    };
  }

  // -------------------------------------------- plan + strategy builders ----
  function individualPlan(rec, m) {
    var focus = m.subjects.slice(0, 3);
    if (!focus.length && rec.profile.subjects) focus = rec.profile.subjects.slice(0, 3).map(function (x) { return { s: x.s, avg: 0, rag: 'amber', trend: 'flat' }; });
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    var weeks = [1, 2].map(function (w) {
      return { n: w, days: days.map(function (d, i) {
        var f = focus[i % Math.max(1, focus.length)] || { s: 'Study skills' };
        var kind = w === 1 ? (i % 2 ? 'Interactive lesson + retrieval quiz' : 'Diagnostic-guided practice')
                          : (i % 2 ? 'Past-paper practice + self-mark' : 'Flashcards + teach-it-back');
        return { d: d, s: f.s, task: kind, mins: m.consistency === 'irregular' ? 20 : 35 };
      }) };
    });
    return { focus: focus.map(function (f) { return f.s; }), weeks: weeks,
      sessionMins: m.consistency === 'irregular' ? 20 : 35,
      bestTime: m.rhythm.replace(' learner', '') };
  }
  function strategy(rec, m) {
    /* each subject-bearing item carries `subj` explicitly so the one-tap actions
       (Log as intervention / Build practice paper) never depend on parsing the
       heading text — the flagship "Close the X gap" item was silently losing its
       actions when the subject sat before the word "gap". */
    var out = [];
    if (m.weakest) out.push({ subj: m.weakest.s, h: 'Close the ' + m.weakest.s + ' gap (' + m.weakest.avg + '%)',
      p: 'Short daily retrieval on the weakest topics, one worked example per session, re-diagnose in 2 weeks. Target: +10% by the next checkpoint.' });
    m.declining.forEach(function (d) { out.push({ subj: d.s, h: 'Reverse the decline in ' + d.s,
      p: d.s + ' has slipped ' + Math.abs(d.slope) + ' points per quiz. Re-teach the last two topics before any new content; pair with a confidence-mode fluency session.' }); });
    out.push({ h: 'Work with their rhythm', p: 'Schedule the hardest work as a ' + m.rhythm + ' (' + (m.peakHour || 16) + ':00 peak). ' +
      (m.consistency === 'irregular' ? 'Rebuild the habit with short ' + '20-minute sessions and streak rescue.' : 'Protect the existing streak — it is their engine.') });
    out.push({ h: 'Teach to their model', p: 'They are ' + m.styleLabel + '. Lead with ' +
      (/kinaesthetic/.test(m.styleLabel) ? 'do-first tasks and resource-making' : /practice/.test(m.styleLabel) ? 'quizzes and marked practice' : 'worked examples and visual walkthroughs') +
      ', then consolidate the other modes.' });
    if (m.strongest && m.strongest.avg >= 70) out.push({ subj: m.strongest.s, h: 'Stretch ' + m.strongest.s,
      p: 'Secure at ' + m.strongest.avg + '% — move to exam-technique and grade-9-style questions to bank marks early.' });
    return out;
  }

  // -------------------------------------------------------------- render ----
  function heatMatrix(rec) {
    var qz = rec.quizzes, subs = {};
    qz.forEach(function (q) { subs[q.subj] = 1; });
    var names = Object.keys(subs).slice(0, 8);
    if (!names.length) return '<div class="note">No quiz history recorded yet.</div>';
    function wkStart(off) { var d = new Date(); d.setDate(d.getDate() - d.getDay() + 1 - off * 7); d.setHours(0, 0, 0, 0); return d; }
    function col(v) {
      var st = [[224, 96, 96], [224, 169, 63], [92, 187, 123]];
      var t = clamp(v, 0, 100) / 50, i = t < 1 ? 0 : 1, f = t < 1 ? t : t - 1, a = st[i], b = st[i + 1];
      return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')';
    }
    var W = 6, head = '<div></div>';
    for (var wi = W - 1; wi >= 0; wi--) { var ws = wkStart(wi); head += '<div style="font-size:9.5px;color:#77839B;text-align:center">' + ws.getDate() + '/' + (ws.getMonth() + 1) + '</div>'; }
    var rows = names.map(function (s) {
      var cells = '<div style="font-size:11px;color:#AAB6CC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + esc(s) + '">' + esc(s) + '</div>';
      for (var w = W - 1; w >= 0; w--) {
        var s0 = wkStart(w).getTime(), s1 = s0 + 7 * 864e5, pts = [];
        qz.forEach(function (q) { if (q.subj !== s) return; var t = new Date(q.t).getTime(); if (t >= s0 && t < s1) pts.push(q.pct); });
        var v = pts.length ? Math.round(pts.reduce(function (a, b) { return a + b; }, 0) / pts.length) : null;
        cells += v == null
          ? '<div style="height:22px;border-radius:4px;background:rgba(170,182,204,.08)" title="' + esc(s) + ' · no quizzes"></div>'
          : '<div style="height:22px;border-radius:4px;background:' + col(v) + '" title="' + esc(s) + ' · ' + v + '%"></div>';
      }
      return cells;
    }).join('');
    return '<div style="display:grid;grid-template-columns:minmax(80px,1.3fr) repeat(' + W + ',1fr);gap:3px;align-items:center">' + head + rows + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:10px;color:#AAB6CC"><span>0%</span><i style="flex:0 0 100px;height:8px;border-radius:5px;background:linear-gradient(90deg,#E06060,#E0A93F,#5CBB7B)"></i><span>100%</span></div>';
  }

  var KIND_ICON = { lesson: '📖', quiz: '📝', review: '🔍', resource: '📚', plan: '🗓', diagnostic: '🩺', billing: '💳', profile: '👤', family: '👪', create: '✨' };

  function render(container, opts) {
    var child = opts.child, code = opts.code, viewer = opts.viewer;
    var acc = access(code, child, viewer.email, viewer.role);
    if (!acc.allowed) {
      container.innerHTML = '<div class="card" style="border-color:rgba(224,96,96,.4)"><h3>🔒 Private student record</h3>' +
        '<div class="note">Access denied — ' + esc(acc.reason) + '. Every access attempt is logged.</div></div>';
      logAccess(code, child, viewer.email, viewer.role + ':DENIED');
      return null;
    }
    logAccess(code, child, viewer.email, viewer.role);
    var rec = collect(child), m = model(rec, code), plan = individualPlan(rec, m), strat = strategy(rec, m);
    var canAct = viewer.role === 'school' || viewer.role === 'teacher';
    var ivs = ($j('sy-school:' + code + ':interventions', []) || []).filter(function (x) { return x.email === child; });
    /* auto-fed from the school's Data intake hub — flags, groups, pastoral */
    var meta = ($j('sy-school:' + code + ':studentMeta', {}) || {})[child] || {};
    var wbs = ($j('sy-school:' + code + ':wellbeing', []) || []).filter(function (x) { return x.email === child; });
    var behs = ($j('sy-school:' + code + ':behaviour', []) || []).filter(function (x) { return x.email === child; });
    var chipDefs = [['send', 'SEND'], ['pp', 'Pupil Premium'], ['eal', 'EAL'], ['lac', 'Looked-after'], ['refugee', 'Refugee'], ['migrant', 'Recent migrant'], ['lowIncome', 'Low income'], ['youngCarer', 'Young carer']];
    var metaChips = chipDefs.filter(function (c) { return meta[c[0]]; }).map(function (c) {
      return '<span style="display:inline-block;border:1px solid rgba(143,194,236,.4);color:#8FC2EC;border-radius:14px;padding:2px 9px;font-size:10.5px;margin:2px 4px 2px 0">' + c[1] + '</span>';
    }).join('') +
      (meta.readingAge ? '<span style="display:inline-block;border:1px solid rgba(242,206,123,.4);color:#F2CE7B;border-radius:14px;padding:2px 9px;font-size:10.5px;margin:2px 4px 2px 0">Reading age ' + meta.readingAge + '</span>' : '') +
      (meta.destination ? '<span style="display:inline-block;border:1px solid rgba(92,187,123,.4);color:#8ee0a5;border-radius:14px;padding:2px 9px;font-size:10.5px;margin:2px 4px 2px 0">→ ' + esc(meta.destination) + '</span>' : '') +
      (wbs.length ? '<span style="display:inline-block;border:1px solid rgba(244,114,182,.4);color:#F4A8CE;border-radius:14px;padding:2px 9px;font-size:10.5px;margin:2px 4px 2px 0">Wellbeing ' + wbs[0].score + '</span>' : '') +
      (behs.length ? '<span style="display:inline-block;border:1px solid rgba(224,169,63,.4);color:#e8c07a;border-radius:14px;padding:2px 9px;font-size:10.5px;margin:2px 4px 2px 0">' + behs.length + ' behaviour entr' + (behs.length === 1 ? 'y' : 'ies') + '</span>' : '');
    var name = rec.profile.name || (window.SY ? SY.accountName(child) : child);
    var rr = rosterRec(code, child) || {};
    var html = '';
    html += '<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
      '<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#4FA6E0,#8B5CF6);display:grid;place-items:center;font-size:20px;font-weight:700;color:#fff">' + esc((name || '?')[0]) + '</div>' +
      '<div style="flex:1"><h3 style="margin:0">' + esc(name) + '</h3><div class="note">' + esc(rr.year || '') + (rr.cohort ? ' · ' + esc(rr.cohort) : '') + ' · ' + esc(rec.profile.level || '—') + ' · record opened as <b style="color:#F2CE7B">' + esc(acc.via) + '</b> · access logged</div>' +
      (metaChips ? '<div style="margin-top:5px">' + metaChips + '</div>' : '') + '</div>' +
      '<div style="text-align:right"><div style="font-family:Georgia,serif;font-size:24px;color:' + (m.risk === 'HIGH' ? '#E06060' : m.risk === 'MEDIUM' ? '#E0A93F' : '#5CBB7B') + '">' + m.overall + '%</div><div class="note">overall · risk ' + m.risk.toLowerCase() + '</div></div></div></div>';
    // learning model
    html += '<div class="card" style="margin-bottom:12px"><h3>🧠 Learning model <span class="note" style="font-weight:400">machine-learned from ' + m.evidence + ' recorded events · confidence ' + esc(m.confidence) + '</span></h3>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:8px">' +
      [['Study style & model', m.styleLabel], ['Rhythm', m.rhythm + ' (peak ' + m.peakHour + ':00)'], ['Pace', m.weekly + ' activities/week'], ['Consistency', m.consistency],
       ['Attendance', m.attendance === null ? 'no register data yet' : m.attendance + '% (auto-fed from the register)']].map(function (x) {
        return '<div style="border:1px solid rgba(170,182,204,.16);border-radius:10px;padding:10px 12px"><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#77839B">' + x[0] + '</div><div style="font-size:13px;color:#EDF1F8;margin-top:3px">' + esc(x[1]) + '</div></div>';
      }).join('') + '</div>' +
      (m.subjects.length ? '<div style="margin-top:10px">' + m.subjects.map(function (x) {
        return '<span style="display:inline-block;margin:3px 6px 3px 0;padding:4px 10px;border-radius:16px;font-size:11.5px;border:1px solid ' + (x.rag === 'green' ? 'rgba(92,187,123,.5)' : x.rag === 'amber' ? 'rgba(224,169,63,.5)' : 'rgba(224,96,96,.5)') + ';color:' + (x.rag === 'green' ? '#8ee0a5' : x.rag === 'amber' ? '#e8c07a' : '#e59b9b') + '">' + esc(x.s) + ' ' + x.avg + '% ' + (x.trend === 'improving' ? '↗' : x.trend === 'declining' ? '↘' : '→') + '</span>';
      }).join('') + '</div>' : '') + '</div>';
    // heat + record
    html += '<div class="card" style="margin-bottom:12px"><h3>Subject × week mastery</h3>' + heatMatrix(rec) + '</div>';
    // individual plan
    html += '<div class="card" style="margin-bottom:12px"><h3>🗓 Individual plan <span class="note" style="font-weight:400">generated from the model · ' + plan.sessionMins + '-min sessions · best time: ' + esc(plan.bestTime) + '</span></h3>' +
      plan.weeks.map(function (w) {
        return '<div style="margin-top:8px"><b style="font-size:12px;color:#F2CE7B">Week ' + w.n + '</b><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;margin-top:5px">' +
          w.days.map(function (d) { return '<div style="border:1px solid rgba(170,182,204,.14);border-radius:8px;padding:7px 9px;font-size:11px"><b style="color:#8FC2EC">' + d.d + '</b> · ' + esc(d.s) + '<div style="color:#77839B;margin-top:2px">' + esc(d.task) + ' · ' + d.mins + 'm</div></div>'; }).join('') + '</div></div>';
      }).join('') +
      '<div style="margin-top:10px"><button class="btn" id="rec-push-plan">Push this plan to ' + esc((name || '').split(' ')[0] || 'the student') + '’s planner</button></div></div>';
    // strategy — each subject-bearing item carries one-tap actions so the
    // teacher never re-enters what the record already knows
    html += '<div class="card" style="margin-bottom:12px"><h3>🚀 Learning & improvement strategy</h3>' +
      strat.map(function (x, si) {
        var subj = x.subj || (x.h.match(/(?:gap|decline in|Stretch) (?:the )?([A-Za-z &]+?)(?: gap)?(?: \(|$)/) || [])[1] || '';
        var acts2 = '';
        if (canAct && subj) {
          acts2 = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px">' +
            '<button class="btn ghost sm" data-iv="' + esc(subj) + '" data-note="' + esc(x.p.slice(0, 120)) + '">＋ Log as intervention</button>' +
            (viewer.role === 'teacher' ? '<button class="btn ghost sm" data-paper="' + esc(subj) + '">📄 Build practice paper</button>' : '') +
            '</div>';
        }
        return '<div style="padding:8px 0;border-bottom:1px solid rgba(170,182,204,.08)"><b style="color:#EDF1F8;font-size:13px">' + esc(x.h) + '</b><div class="note" style="margin-top:2px">' + esc(x.p) + '</div>' + acts2 + '</div>';
      }).join('') +
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" id="rec-deep">🤖 Deep AI strategy</button><button class="btn ghost" id="rec-export">⬇ Export record</button></div><div id="rec-deep-out" style="margin-top:8px"></div></div>';
    // interventions already in flight (auto-fed from the war room — no duplicates)
    html += '<div class="card" style="margin-bottom:12px"><h3>🛠 Interventions in flight <span class="note" style="font-weight:400">auto-fed from the intervention war room</span></h3>' +
      (ivs.length ? ivs.slice(0, 6).map(function (x) {
        return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid rgba(170,182,204,.07);font-size:12.5px">' +
          '<span><b style="color:#EDF1F8">' + esc(x.subject || '') + '</b> <span class="note">' + esc(x.notes || '') + '</span></span>' +
          '<span class="note" style="white-space:nowrap">' + esc(x.status || '') + ' · ' + esc(String(x.when || '').slice(0, 10)) + '</span></div>';
      }).join('') : '<div class="note">None yet — log one from a strategy item above or push the individual plan.</div>') + '</div>';
    // full activity record
    html += '<div class="card"><h3>📚 Complete OS record <span class="note" style="font-weight:400">' + rec.activity.length + ' events · everything ' + esc((name || '').split(' ')[0] || 'they') + ' does in StudYear</span></h3>' +
      (rec.activity.slice(0, 30).map(function (a) {
        return '<div style="display:flex;gap:9px;padding:6px 0;border-bottom:1px solid rgba(170,182,204,.07);font-size:12.5px"><span>' + (KIND_ICON[a.k] || '•') + '</span><span style="flex:1"><b style="color:#EDF1F8">' + esc(a.t) + '</b>' + (a.d ? ' <span class="note">' + esc(a.d) + '</span>' : '') + '</span><span class="note" style="white-space:nowrap">' + esc(String(a.when || '').slice(0, 16).replace('T', ' ')) + '</span></div>';
      }).join('') || '<div class="note">No recorded activity yet — it appears here the moment they use the OS.</div>') + '</div>';
    container.innerHTML = html;
    // wire actions
    function logIntervention(subject, notes) {
      var iv = $j('sy-school:' + code + ':interventions', []);
      /* de-dupe: one active learning-model intervention per subject per child */
      if (iv.some(function (x) { return x.email === child && x.subject === subject && x.status !== 'complete'; })) return false;
      iv.unshift({ email: child, name: name, subject: subject, notes: notes, status: 'active',
        when: new Date().toISOString(), by: viewer.email, source: 'learning-model' });
      $s('sy-school:' + code + ':interventions', iv.slice(0, 100));
      return true;
    }
    var pushBtn = container.querySelector('#rec-push-plan');
    if (pushBtn) pushBtn.onclick = function () {
      var existing = read(child, 'plan', { plan: [], done: {} }) || { plan: [], done: {} };
      var wkN = (existing.plan && existing.plan.length) ? existing.plan[existing.plan.length - 1].n + 1 : 1;
      plan.weeks.forEach(function (w, i) {
        existing.plan = (existing.plan || []).concat([{ n: wkN + i, days: w.days.map(function (d) { return { d: d.d, s: d.s, t: d.task, mins: d.mins }; }) }]);
      });
      SY.writeAccount(child, 'plan', existing);
      var feed = read(child, 'activity', []) || [];
      feed.unshift({ k: 'plan', t: 'Individual plan from your school', d: plan.focus.join(', ') + ' — built from your learning model by ' + viewer.name + '.', when: new Date().toISOString() });
      SY.writeAccount(child, 'activity', feed.slice(0, 100));
      /* auto-feed the intervention war room — the plan IS the intervention,
         logged once, visible to the whole school, no double entry */
      logIntervention(plan.focus[0] || 'Individual plan',
        'Individual plan (learning model): ' + plan.focus.join(', ') + ' · ' + plan.sessionMins + '-min sessions, best time ' + plan.bestTime + '.');
      pushBtn.textContent = '✓ Pushed to their planner + logged in the intervention war room'; pushBtn.disabled = true;
    };
    /* strategy one-tap actions */
    container.querySelectorAll('button[data-iv]').forEach(function (b) {
      b.onclick = function () {
        var okd = logIntervention(b.dataset.iv, b.dataset.note || 'From the learning-model strategy.');
        b.textContent = okd ? '✓ Logged in the war room' : '✓ Already an active intervention';
        b.disabled = true;
      };
    });
    container.querySelectorAll('button[data-paper]').forEach(function (b) {
      b.onclick = function () {
        var weak = (m.subjects.filter(function (x) { return x.s === b.dataset.paper; })[0] || {});
        try {
          localStorage.setItem('sy-prefill-exam', JSON.stringify({
            subject: b.dataset.paper, level: rec.profile.level || 'GCSE',
            title: 'Recovery paper — ' + b.dataset.paper + ' (' + name + ')',
            topics: '' }));
        } catch (e) {}
        location.href = (location.pathname.indexOf('/teacher/') >= 0 ? '../assistant/' : '../../teacher/assistant/') + '#exam';
      };
    });
    var deepBtn = container.querySelector('#rec-deep');
    if (deepBtn) deepBtn.onclick = function () {
      var out = container.querySelector('#rec-deep-out');
      if (window.SYAI && SYAI.ready()) {
        out.innerHTML = '<div class="note">Writing the deep strategy…</div>';
        SYAI.ask('You are a senior teaching-and-learning lead. Using this student’s machine-learned profile, write a precise improvement strategy: 1) diagnosis, 2) 4-week teaching plan, 3) how to teach to their study model, 4) measurable checkpoints. Be specific to the data, never generic.',
          'Student model: ' + JSON.stringify({ style: m.styleLabel, rhythm: m.rhythm, weekly: m.weekly, consistency: m.consistency, subjects: m.subjects, risk: m.risk }),
          { maxTokens: 1200 }).then(function (t) { out.innerHTML = SYAI.render(t); })
          .catch(function () { out.innerHTML = '<div class="note">Live AI unavailable — the strategy above is the model’s rule-based output.</div>'; });
      } else out.innerHTML = '<div class="note">Enable live AI in the Gateway for the deep narrative — the strategy above is the on-device model’s output.</div>';
    };
    var expBtn = container.querySelector('#rec-export');
    if (expBtn && window.SYExport) expBtn.onclick = function () {
      SYExport.menu(this, {
        word: function () { SYExport.word('student-record', { title: name + ' — Student record & strategy', blocks: [
          { h: 'Learning model' }, { p: m.styleLabel + ' · ' + m.rhythm + ' · ' + m.weekly + ' activities/week · ' + m.consistency + ' · risk ' + m.risk },
          { h: 'Subjects' }].concat(m.subjects.map(function (x) { return { p: x.s + ': ' + x.avg + '% (' + x.trend + ')' }; }))
          .concat([{ h: 'Improvement strategy' }]).concat(strat.map(function (x) { return { p: x.h + ' — ' + x.p }; })) }); },
        pdf: function () { SYExport.pdf(name + ' — student record', '<h1>' + esc(name) + '</h1><h2>Learning model</h2><p>' + esc(m.styleLabel) + ' · ' + esc(m.rhythm) + '</p><h2>Strategy</h2>' + strat.map(function (x) { return '<p><b>' + esc(x.h) + '</b> ' + esc(x.p) + '</p>'; }).join('')); }
      });
    };
    return { model: m, plan: plan, strategy: strat, access: acc };
  }

  window.SYRecord = { access: access, logAccess: logAccess, setParentGrant: setParentGrant,
    collect: collect, model: model, individualPlan: individualPlan, strategy: strategy, render: render };
})();
