const CACHE_NAME = 'anthros-ai-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

// Instalar y cachear recursos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Estrategia: Primero red, si falla, caché
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Notificaciones Push
self.addEventListener('push', (e) => {
  const options = {
    body: e.data.text(),
    icon: '/icon.png',
    badge: '/icon.png'
  };
  e.waitUntil(self.registration.showNotification('AnthrosAI', options));
});