/* StudYear mobile / PWA shell (loaded by guard.js on every console).
   Two presentations, one OS: desktop keeps its sidebars; installed-PWA and
   phone sessions get an app bar, a slide-in drawer built from the page's own
   navigation, and a thumb-reach bottom tab bar. No per-page changes. */
(function () {
  'use strict';
  function isMobile() {
    try {
      var standalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      return standalone || window.matchMedia('(max-width: 860px)').matches;
    } catch (e) { return false; }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    if (!isMobile() || document.querySelector('.sy-appbar')) {
      document.body.classList.toggle('sy-mobile', isMobile());
      return;
    }
    var s = (window.SY && SY.session) || {};
    var base = (window.SY && SY.base) || '../';
    document.body.classList.add('sy-mobile');

    /* app bar */
    var bar = document.createElement('div');
    bar.className = 'sy-appbar';
    var title = (document.title || 'StudYear').replace(/^StudYear\s*[—-]\s*/, '');
    bar.innerHTML = '<button id="sy-menu" aria-label="Menu">☰</button>' +
      '<span class="t">' + esc(title) + '</span>' +
      (s.role ? '<span class="r">' + esc(s.role) + '</span>' : '');
    document.body.appendChild(bar);

    /* drawer: clone this page's own nav so every console keeps its full menu */
    var drawer = document.createElement('div');
    drawer.className = 'sy-drawer';
    var links = '';
    var nav = document.querySelector('aside nav, aside.side nav');
    if (nav) {
      Array.prototype.forEach.call(nav.children, function (el) {
        if (el.tagName === 'A') {
          links += '<a href="' + esc(el.getAttribute('href') || '#') + '"' +
            (el.id ? ' data-proxy="' + esc(el.id) + '"' : '') + '>' + el.innerHTML + '</a>';
        } else if (el.classList && (el.classList.contains('sgroup') || el.classList.contains('grp'))) {
          links += '<div class="grp">' + el.innerHTML + '</div>';
        }
      });
    }
    if (!links) {
      /* pages without a sidebar (e.g. the study workspace) get the standard
         role menu so the drawer is always a full navigator */
      var MENUS = {
        student: [['Study workspace','study/'],['🏫 My School','myschool/'],['Dashboard','dashboards/student/'],
          ['SkillRush™','skillrush/'],['Live Classroom','live/'],['Career Passport','career/'],
          ['Find tutors','tutors/'],['My Account','account/'],['Plans & top-up','account/topup/']],
        parent: [['Command Centre','parent/'],['Plans','parent/plans/'],['My Account','parent/account/']],
        teacher: [['Command Centre','teacher/'],['Take the register','teacher/attendance/'],
          ['Student records','teacher/students/'],['Fluency heatmap','teacher/fluency/'],['AI Assistant','teacher/assistant/']],
        school: [['Command Centre','school/'],['Student records','school/students/'],['Data intake','school/data/'],
          ['People','school/people/'],['Interventions','school/interventions/'],['Analytics','school/analytics/']],
        tutor: [['Command Centre','tutor/'],['Calendar','tutor/calendar/'],['Pipeline','tutor/pipeline/'],
          ['Earnings','tutor/earnings/'],['AI Assistant','tutor/assistant/']],
        authority: [['Command Centre','authority/']],
        admin: [['Dashboard','admin/'],['AI Gateway','admin/gateway/'],['Comms','admin/comms/']]
      };
      links = (MENUS[s.role] || [['Home','']]).map(function (m) {
        return '<a href="' + esc(base + m[1]) + '">' + esc(m[0]) + '</a>';
      }).join('');
      links += '<div class="grp">Session</div><a href="#" data-signout="1">Sign out</a>';
    }
    drawer.innerHTML = '<div class="scrim"></div><div class="panel">' +
      '<div class="hd">⌂ Stud<b>Year</b>' + (s.name ? '<div style="font-family:inherit;font-size:12px;color:#77839B;margin-top:4px">' + esc(s.name) + '</div>' : '') + '</div>' +
      links + '</div>';
    document.body.appendChild(drawer);

    function toggle(open) { drawer.classList.toggle('open', open); }
    document.getElementById('sy-menu').onclick = function () { toggle(true); };
    drawer.querySelector('.scrim').onclick = function () { toggle(false); };
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.getAttribute('data-signout')) { e.preventDefault(); toggle(false); if (window.SY) SY.signOut(); return; }
        var proxy = a.getAttribute('data-proxy');
        if (proxy) { /* buttons like Sign out live as anchors with ids */
          var real = document.getElementById(proxy);
          if (real && real !== a) { e.preventDefault(); toggle(false); real.click(); return; }
        }
        toggle(false);
      });
    });

    /* bottom tab bar — core destinations per role */
    var HOME = { student: 'study/', parent: 'parent/', teacher: 'teacher/', tutor: 'tutor/',
      school: 'school/', authority: 'authority/', admin: 'admin/' };
    var tabs = [];
    if (s.role === 'student') {
      tabs = [['🏠', 'Study', base + 'study/'], ['🏫', 'My School', base + 'myschool/'],
        ['⚡', 'SkillRush', base + 'skillrush/'], ['👤', 'Account', base + 'account/']];
    } else if (s.role === 'parent') {
      tabs = [['🏠', 'Home', base + 'parent/'], ['💳', 'Plans', base + 'parent/plans/'], ['👤', 'Account', base + 'parent/account/']];
    } else if (s.role === 'teacher') {
      tabs = [['🏠', 'Home', base + 'teacher/'], ['📋', 'Register', base + 'teacher/attendance/'],
        ['🎓', 'Students', base + 'teacher/students/'], ['🤖', 'AI tools', base + 'teacher/assistant/']];
    } else if (s.role === 'school') {
      tabs = [['🏠', 'Home', base + 'school/'], ['🎓', 'Records', base + 'school/students/'],
        ['📥', 'Intake', base + 'school/data/'], ['👥', 'People', base + 'school/people/']];
    } else if (s.role === 'tutor') {
      tabs = [['🏠', 'Home', base + 'tutor/'], ['🗓', 'Calendar', base + 'tutor/calendar/'], ['📈', 'Earnings', base + 'tutor/earnings/']];
    } else if (s.role === 'authority') {
      tabs = [['🏠', 'Home', base + 'authority/']];
    } else if (s.role === 'admin') {
      tabs = [['🏠', 'Home', base + 'admin/'], ['⚙️', 'Gateway', base + 'admin/gateway/']];
    } else {
      tabs = [['🏠', 'Home', base]];
    }
    var tb = document.createElement('nav');
    tb.className = 'sy-tabbar';
    var here = location.pathname;
    tb.innerHTML = tabs.map(function (t) {
      var on = here.indexOf(t[2].replace(/^\.\.\//g, '').replace(/^\.\//, '')) >= 0 &&
        here.replace(/\/+$/, '').endsWith(t[2].replace(base, '').replace(/\/+$/, ''));
      return '<a href="' + esc(t[2]) + '" class="' + (on ? 'on' : '') + '"><span class="ic">' + t[0] + '</span>' + esc(t[1]) + '</a>';
    }).join('') + '<button id="sy-more"><span class="ic">☰</span>Menu</button>';
    document.body.appendChild(tb);
    document.getElementById('sy-more').onclick = function () { toggle(true); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
  try {
    window.matchMedia('(max-width: 860px)').addEventListener('change', function () { location.reload(); });
  } catch (e) {}
})();
