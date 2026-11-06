/* ============================================================================
   StudYear — password show/hide toggle.
   Adds a small eye button inside every <input type="password"> so a user can
   reveal what they typed (helps on phones and with long passwords), then hide
   it again. Self-contained, dependency-free, safe to load on any page: it
   never changes the input's own styles or its form, only wraps it so the eye
   can sit on the right. Idempotent — re-running never double-adds a toggle,
   and it watches for password fields added later (dynamic forms).
   ========================================================================== */
(function () {
  'use strict';
  function enhance(inp) {
    if (!inp || inp.getAttribute('data-sy-eye')) return;
    // don't touch fields that already carry a bespoke reveal control
    // (e.g. the admin gateway key rows have their own Show/Hide button)
    if (inp.closest && inp.closest('.keyrow')) { inp.setAttribute('data-sy-eye', 'skip'); return; }
    inp.setAttribute('data-sy-eye', '1');

    var wrap = document.createElement('span');
    wrap.className = 'sy-pw-wrap';
    wrap.style.cssText = 'position:relative;display:block';
    if (inp.parentNode) inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    // leave room for the eye so it never overlaps typed text
    try { inp.style.paddingRight = '42px'; } catch (e) {}

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sy-pw-eye';
    btn.setAttribute('aria-label', 'Show password');
    btn.setAttribute('title', 'Show password');
    btn.textContent = '👁';
    btn.style.cssText = 'position:absolute;right:6px;top:50%;transform:translateY(-50%);' +
      'background:none;border:none;cursor:pointer;font-size:16px;line-height:1;opacity:.65;' +
      'padding:6px;border-radius:8px;z-index:2';
    btn.onmouseenter = function () { btn.style.opacity = '1'; };
    btn.onmouseleave = function () { btn.style.opacity = '.65'; };
    btn.onclick = function (e) {
      e.preventDefault();
      var showing = inp.getAttribute('type') === 'text';
      inp.setAttribute('type', showing ? 'password' : 'text');
      btn.textContent = showing ? '👁' : '🙈';
      var lbl = showing ? 'Show password' : 'Hide password';
      btn.setAttribute('aria-label', lbl); btn.setAttribute('title', lbl);
      try { inp.focus(); } catch (er) {}
    };
    wrap.appendChild(btn);
  }
  function run() {
    var list = document.querySelectorAll('input[type="password"]:not([data-sy-eye])');
    for (var i = 0; i < list.length; i++) enhance(list[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  // catch password fields rendered after load (change-password panels, etc.),
  // debounced so heavy, frequently re-rendering pages never pay a cost
  try {
    var pending = false;
    var mo = new MutationObserver(function () {
      if (pending) return; pending = true;
      setTimeout(function () { pending = false; run(); }, 200);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
