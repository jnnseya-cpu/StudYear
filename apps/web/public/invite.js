/**
 * StudYear invite / referral card (window.SYInvite)
 * Auto-mounts into #invite-root. Shows the signed-in user's personal invite
 * link and join stats. When a friend signs up through it, the backend credits
 * BOTH wallets 50 bonus ACUs (see functions register + refcode). Falls back to
 * a generic free-tool share when the cloud/refcode isn't available.
 */
(function () {
  'use strict';
  function email() { try { return (window.SY && SY.session && SY.session.email) || null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MSG = 'Try StudYear free — a 24/7 AI tutor, revision and real exam practice. If you join, we both get bonus credits:';

  function render(host, r) {
    var body = host.querySelector('#inv-body'); if (!body) return;
    var code = r && r.code ? r.code : '';
    var link = code ? ('https://www.studyear.com/?ref=' + encodeURIComponent(code)) : 'https://www.studyear.com/free/';
    body.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">' +
      '<input readonly id="inv-link" value="' + esc(link) + '" style="flex:1;min-width:220px;background:rgba(6,11,24,.4);border:1px solid var(--line,rgba(120,140,190,.3));border-radius:9px;color:inherit;padding:9px 11px;font-size:13px">' +
      '<button class="btn sm" id="inv-copy" type="button">Copy link</button>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(MSG + ' ' + link) + '">WhatsApp</a>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(MSG) + '&url=' + encodeURIComponent(link) + '">Share</a>' +
      '</div>' +
      (r && r.joined ? '<div style="margin-top:9px;font-size:12.5px;color:#5CBB7B">✓ ' + r.joined + ' friend' + (r.joined === 1 ? '' : 's') + ' joined · ' + r.bonus + ' bonus credits earned</div>'
        : '<div style="margin-top:9px;font-size:12px;color:var(--ink-3,#8795AE)">No friends yet — share your link to earn bonus credits.</div>');
    var c = body.querySelector('#inv-copy');
    if (c) c.onclick = function () { try { navigator.clipboard.writeText(link); c.textContent = '✓ Copied'; setTimeout(function () { c.textContent = 'Copy link'; }, 1600); } catch (e) {} };
  }

  function mount(target) {
    var host = target || document.getElementById('invite-root'); if (!host) return null;
    if (host.getAttribute('data-sy-invite') === '1') return host;
    host.setAttribute('data-sy-invite', '1');
    if (!/\bcard\b/.test(host.className)) host.className = (host.className ? host.className + ' ' : '') + 'card';
    host.innerHTML = '<h3>🎁 Invite a friend — you both get 50 free credits</h3>' +
      '<div class="sub" style="color:var(--ink-3,#8795AE);font-size:12.5px;margin:2px 0">Share your link. When a friend creates a free account, 50 bonus ACUs land in each of your wallets — up to 25 friends.</div>' +
      '<div id="inv-body"><span style="color:var(--ink-3,#8795AE);font-size:12.5px">Loading your invite link…</span></div>';
    var em = email();
    if (em && window.SYCloud && SYCloud.refCode) {
      SYCloud.refCode(em).then(function (r) { render(host, r); }).catch(function () { render(host, null); });
    } else { render(host, null); }
    return host;
  }

  window.SYInvite = { mount: mount };
  function auto() { if (document.getElementById('invite-root')) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
