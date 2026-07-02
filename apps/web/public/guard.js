/**
 * Route guard: every protected surface declares the account category it
 * belongs to; anyone without a matching signed-in session is redirected to
 * /auth/ before the page paints. Include synchronously right after <body>:
 *   <script src="../../guard.js" data-role="student" data-base="../../"></script>
 *
 * Preview build: sessions live in this browser's localStorage. The production
 * swap-in is Firebase Auth + custom role claims enforced by Firestore rules —
 * same guard contract, server-verified.
 */
(function () {
  'use strict';
  var el = document.currentScript;
  var role = el.getAttribute('data-role');
  var base = el.getAttribute('data-base') || '../../';
  var s = null;
  try { s = JSON.parse(localStorage.getItem('sy-session')); } catch (e) {}
  var here = encodeURIComponent(location.pathname + location.search + location.hash);
  if (!s || !s.role) {
    location.replace(base + 'auth/?role=' + role + '&next=' + here);
  } else if (s.role !== role) {
    location.replace(base + 'auth/?role=' + role + '&mismatch=' + encodeURIComponent(s.role) + '&next=' + here);
  }
})();
