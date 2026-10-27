/* OnlyBudget service worker: cache the app shell so the web version opens offline.
   Data never goes through here; SQLite lives in the browser's own storage. */
// A new name drops everything an older worker kept (v1 kept the pdf.js worker cache-first).
const CACHE = 'onlybudget-shell-v2';
const PRECACHE = ['/', '/sw-register.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  // Navigation requests: network first, fall back to the cached shell.
  if (request.mode === 'navigate') {
    // Only a good page becomes the offline shell: a 502 from the ingress must not be served for ever after.
    event.respondWith(fetch(request).then((res) => { if (res.ok) caches.open(CACHE).then((c) => c.put('/', res.clone())); return res; }).catch(() => caches.match('/')));
    return;
  }
  // Hashed bundles (a new build gives them new names): cache first.
  const { pathname } = new URL(request.url);
  if (pathname.startsWith('/_expo/') || pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
        return res;
      })),
    );
    return;
  }
  // Files that keep their name between builds (the pdf.js worker that reads statements, its fonts, icons):
  // network first, so a fixed version is used as soon as it is deployed; the cache is only for offline.
  event.respondWith(
    fetch(request).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
      return res;
    }).catch(() => caches.match(request)),
  );
});
