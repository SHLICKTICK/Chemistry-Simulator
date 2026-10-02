/* ChemSim service worker — generated at build time (see vite.config.ts). */
const CACHE = 'chemsim-7c6da2a6f5';
const PRECACHE = ["/","/index.html","/assets/OrbitControls-Dh36RsEH.js","/assets/index-BDApXuvu.js","/assets/index-Dp-uoHGi.css","/assets/three.module-4gI5Z-_B.js","/manifest.webmanifest","/icons/favicon.svg","/icons/icon-192.png","/icons/icon-512.png","/icons/maskable-512.png","/icons/apple-touch-icon.png"];

self.addEventListener('install', (event) => {
  // New workers wait until the user accepts the "new version" prompt (SKIP_WAITING message).
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('chemsim-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Page loads: try the network for freshness, fall back to the cached app shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('__BASE__'))));
    return;
  }
  // Everything else is precached and content-hashed: cache first, fill from network if missing.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
});
