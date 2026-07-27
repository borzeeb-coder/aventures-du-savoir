const CACHE = 'avent-du-savoir-v7';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];
const FONTS = [
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Quicksand:wght@500;600;700&display=swap',
  'https://fonts.gstatic.com'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (FONTS.some((f) => url.origin + url.pathname.startsWith(f))) {
    e.respondWith(fontStrategy(e.request));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(e.request));
  }
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  } catch {
    const fallback = await caches.match('./index.html');
    if (fallback) return fallback;
    return new Response('Hors-ligne', { status: 503 });
  }
}

async function fontStrategy(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}
