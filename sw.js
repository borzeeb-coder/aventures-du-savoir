const CACHE = 'avent-du-savoir-v52';
const STATIC = [
  './',
  './manifest.json',
  './sw.js',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Quicksand:wght@500;600;700&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isHtml = url.pathname === '/' || url.pathname === '/index.html';
  const isFont = url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';

  if (isFont) {
    e.respondWith(fontStrategy(e.request));
    return;
  }
  if (url.origin === self.location.origin) {
    if (isHtml) {
      e.respondWith(networkFirst(e.request));
    } else {
      e.respondWith(cacheFirst(e.request));
    }
  }
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  } catch {
    const hit = await caches.match(req);
    if (hit) return hit;
    return new Response('Hors-ligne', { status: 503 });
  }
}

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
    const fallback = await caches.match('/');
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
