/**
 * StudYear Challenge Engine (window.SYChallenge)
 * -----------------------------------------------------------------------------
 * The whole system should push every learner to recover FASTER and improve
 * STRONGER — and show them how far ahead of a typical (unaided) learner their
 * current pace is putting them, with the explicit goal of pulling 80–100% ahead.
 *
 * HONESTY: the "% ahead" is MODELLED from the learner's OWN quiz results against
 * a transparent, conservative baseline for an unaided learner. It is a goal to
 * chase and a motivator, never a guarantee or a claim about real individuals.
 *
 * Mechanism: escalating stretch targets (each win raises the bar), fast-recovery
 * retrieval before a topic decays, and a single highest-leverage challenge now.
 */
(function () {
  'use strict';
  function get(k, d) { try { return window.SY ? SY.get(k, d) : d; } catch (e) { return d; } }
  function set(k, v) { try { if (window.SY) SY.set(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ts(x) { if (!x) return 0; if (typeof x === 'number') return x; var t = Date.parse(x); return isNaN(t) ? 0 : t; }
  var WEEK = 604800000, DAY = 86400000;
  var BASELINE = 1.5;           // typical unaided improvement, accuracy points per week (conservative)
  var GOAL_LOW = 80, GOAL_HIGH = 100; // the aim: 80–100% ahead of a typical learner

  function compute() {
    var quizzes = (get('quizzes', []) || []).filter(function (q) { return q && q.pct != null && ts(q.when); });
    quizzes.sort(function (a, b) { return ts(a.when) - ts(b.when); });
    var now = Date.now();
    var pts = quizzes.map(function (q) { return { p: +q.pct, t: ts(q.when) }; }).filter(function (x) { return !isNaN(x.p); });

    // improvement velocity (accuracy points per week): recent half vs older half
    var gainPerWeek = null;
    if (pts.length >= 3) {
      var half = Math.floor(pts.length / 2), older = pts.slice(0, half), recent = pts.slice(half);
      var avgP = function (a) { return a.reduce(function (x, y) { return x + y.p; }, 0) / a.length; };
      var avgT = function (a) { return a.reduce(function (x, y) { return x + y.t; }, 0) / a.length; };
      var dw = Math.max(0.5, (avgT(recent) - avgT(older)) / WEEK);
      gainPerWeek = Math.round((avgP(recent) - avgP(older)) / dw * 10) / 10;
    }
    var ratio = gainPerWeek == null ? null : gainPerWeek / BASELINE;
    var pctBetter = ratio == null ? null : Math.max(-60, Math.min(400, Math.round((ratio - 1) * 100)));

    // per-subject recent accuracy → weakest subject to challenge next
    var by = {};
    quizzes.forEach(function (q) { var p = +q.pct; if (isNaN(p)) return; (by[q.subj || 'General'] = by[q.subj || 'General'] || []).push({ p: p, t: ts(q.when) }); });
    var subs = Object.keys(by).map(function (s) { var arr = by[s].slice().sort(function (a, b) { return a.t - b.t; }); var r = arr.slice(-4);
      return { subj: s, acc: Math.round(r.reduce(function (x, y) { return x + y.p; }, 0) / r.length), days: Math.floor((now - arr[arr.length - 1].t) / DAY), n: arr.length }; });
    subs.sort(function (a, b) { return a.acc - b.acc; });
    var weakest = subs[0] || null;

    // escalating challenge state — a win raises the stretch (faster + stronger)
    var st = get('challenge', { wins: 0, level: 1, target: 0, subj: '', lastCount: 0 }) || { wins: 0, level: 1, target: 0, subj: '', lastCount: 0 };
    var justWon = false;
    if (st.target && st.subj && quizzes.length > (st.lastCount || 0)) {
      var fresh = quizzes.slice(st.lastCount || 0).filter(function (q) { return (q.subj || 'General') === st.subj; });
      var best = fresh.reduce(function (m, q) { return Math.max(m, +q.pct || 0); }, 0);
      if (best >= st.target) { st.wins = (st.wins || 0) + 1; st.level = (st.level || 1) + 1; justWon = true; }
    }
    st.lastCount = quizzes.length;

    var stretch = Math.min(20, 6 + (st.level || 1) * 2); // the bar rises as the learner wins
    var action;
    if (!weakest) {
      action = { text: 'Set your baseline — take a 5-question quiz so the Challenge Engine can push you.', cta: 'Take a quiz', td: 'create' };
    } else if (weakest.days >= 7) {
      action = { text: 'Lock in <b>' + esc(weakest.subj) + '</b> before it fades — retrieve it now (last practised ' + weakest.days + 'd ago). Fast recovery keeps you ahead.', cta: 'Re-test ' + esc(weakest.subj), td: 'create', subj: weakest.subj, target: Math.max(weakest.acc, 75) };
    } else if (weakest.acc < 90) {
      var tgt = Math.min(100, weakest.acc + stretch);
      action = { text: 'Beat your best: score <b>' + tgt + '%+</b> on <b>' + esc(weakest.subj) + '</b> (now ' + weakest.acc + '%). Every jump pulls you further ahead.', cta: 'Challenge: ' + esc(weakest.subj), td: 'create', subj: weakest.subj, target: tgt };
    } else {
      action = { text: 'You’ve secured the basics in <b>' + esc(weakest.subj) + '</b> — take a <b>harder</b> challenge to stretch further.', cta: 'Harder quiz', td: 'create', subj: weakest.subj, target: 95 };
    }
    if (action.target && action.subj) { st.target = action.target; st.subj = action.subj; }
    set('challenge', st);

    return { pctBetter: pctBetter, ratio: ratio, gainPerWeek: gainPerWeek, goalLow: GOAL_LOW, goalHigh: GOAL_HIGH,
      weakest: weakest, action: action, wins: st.wins || 0, level: st.level || 1, justWon: justWon, nQuizzes: quizzes.length, baseline: BASELINE };
  }

  function cardHTML() {
    var c; try { c = compute(); } catch (e) { return ''; }
    var cur = c.pctBetter;
    var inBand = cur != null && cur >= c.goalLow;
    var barPct = cur == null ? 0 : Math.max(0, Math.min(100, cur / c.goalHigh * 100));
    var col = inBand ? '#5CBB7B' : (cur != null && cur >= 40 ? '#E0AE5A' : '#4FA6E0');
    var headline = cur == null
      ? 'Take a few quizzes and the Challenge Engine will track how far ahead you are pulling.'
      : inBand ? 'You are improving <b>' + cur + '% faster</b> than a typical learner — in the goal zone. Keep pushing to stay there.'
      : cur >= 0 ? 'You are improving <b>' + cur + '% faster</b> than a typical learner. Goal: <b>' + c.goalLow + '–' + c.goalHigh + '% ahead</b> — keep pushing.'
      : 'Your pace has dipped <b>below</b> the typical learner right now — let’s turn that around. Goal: <b>' + c.goalLow + '–' + c.goalHigh + '% ahead</b>.';
    var a = c.action || {};
    var btn = a.cta ? '<button class="btn" data-ch-subj="' + esc(a.subj || '') + '" data-ch-target="' + (a.target || '') + '" data-td="' + esc(a.td || 'create') + '">' + esc(a.cta) + ' →</button>' : '';
    return '<div class="card" style="margin-bottom:14px;border:1px solid var(--gold-500);background:linear-gradient(180deg,rgba(77,157,224,.10),rgba(77,157,224,.04))">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-300);flex:1">⚡ Challenge — pull ahead</div>' +
        (c.wins ? '<span class="note" style="margin:0">🏆 ' + c.wins + ' smashed · stretch level ' + c.level + '</span>' : '') + '</div>' +
      '<div style="font-size:14.5px;margin:8px 0;line-height:1.5">' + headline + '</div>' +
      (cur != null ? ('<div style="height:10px;border-radius:6px;background:rgba(170,182,204,.16);overflow:hidden;position:relative;margin-bottom:4px">' +
        '<div style="height:100%;width:' + barPct + '%;background:' + col + '"></div>' +
        '<div style="position:absolute;top:-2px;bottom:-2px;left:' + (c.goalLow / c.goalHigh * 100) + '%;width:2px;background:#5CBB7B"></div></div>' +
        '<div class="note" style="margin:0 0 10px;display:flex;justify-content:space-between"><span>Typical learner</span><span style="color:#5CBB7B">Goal ' + c.goalLow + '–' + c.goalHigh + '% ahead</span></div>') : '') +
      '<div style="font-size:14px;margin-bottom:10px">' + (a.text || '') + '</div>' + btn +
      '<div class="note" style="margin-top:10px;font-size:11px">Your pace is modelled from your own quiz results against a typical unaided learner — a goal to chase, not a guarantee.</div>' +
      '</div>';
  }

  function wire(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll('[data-ch-subj]'), function (b) {
      b.addEventListener('click', function () {
        var subj = b.getAttribute('data-ch-subj');
        try {
          var qs = document.getElementById('g-qz-subj');
          if (qs && subj) { for (var i = 0; i < qs.options.length; i++) { if (qs.options[i].value === subj || qs.options[i].text === subj) { qs.value = qs.options[i].value; break; } } }
          var qt = document.getElementById('g-qz-topic'); if (qt && subj && !qt.value) qt.value = subj + ' — challenge';
        } catch (e) {}
        // the data-td on the same button routes to the quiz creator (renderToday's handler)
      });
    });
  }

  window.SYChallenge = { compute: compute, cardHTML: cardHTML, wire: wire };
})();
