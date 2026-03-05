// AnthrosAI Service Worker — v10
// Network-first for API, Cache-first for assets, auto-clears old caches

const SW_VERSION = 'anthros-v10';
const CACHE_NAME = `anthros-cache-${SW_VERSION}`;
const STATIC_ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/css/style.css',
  '/js/app.js', '/js/auth.js', '/js/nutrition.js',
  '/js/workout.js', '/js/stripe.js',
  '/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  console.log(`[SW ${SW_VERSION}] install`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC_ASSETS).catch(e => console.warn('[SW] pre-cache partial fail:', e)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log(`[SW ${SW_VERSION}] activate — purging old caches`);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('anthros-cache-') && k !== CACHE_NAME)
            .map(k => { console.log('[SW] delete old cache:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first: API endpoints and third-party services
  const isAPI = url.pathname.startsWith('/api/')
             || ['groq.com','stripe.com','edamam.com','pagead2.googlesyndication.com']
                .some(h => url.hostname.includes(h));

  if (isAPI || request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(resp => {
        if (resp.ok && url.origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return resp;
      }).catch(() => {
        if (request.destination === 'document') return caches.match('/index.html');
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE') caches.delete(CACHE_NAME);
});
