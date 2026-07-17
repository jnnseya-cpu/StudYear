/**
 * StudYear offline service worker — cache-first for same-origin static assets,
 * network-first for HTML navigations (so deploys show up), offline fallback to
 * the cached page. Scope-relative so it works at / (Vercel) and /StudYear/ (Pages).
 */
const CACHE = 'studyear-v24';
const PRECACHE = ['./', './app/', './study/', './auth/', './manifest.json', './logo.svg', './icon.svg',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  // don't let one missing asset abort the whole precache
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(
    PRECACHE.map((u) => c.add(u).catch(function () {}))
  )).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./')))
    );
  } else if (url.pathname.includes('/_next/static/')) {
    // content-hashed bundles never change under the same name — cache-first
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }))
    );
  } else if (/\.(css|js|json)$/.test(url.pathname)) {
    // platform CSS/JS/config are unhashed — network-first so a page never
    // renders with the previous deploy's stylesheet (mismatched HTML+CSS
    // reads as broken/overlapping layout); cache only as offline fallback
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req))
    );
  } else {
    // images/fonts: stale-while-revalidate — instant, refreshed in background
    e.respondWith(
      caches.match(req).then((hit) => {
        const refresh = fetch(req).then((res) => {
          const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
        }).catch(() => hit);
        return hit || refresh;
      })
    );
  }
});
