const CACHE = 'fitcoach-stable-1-6-1-forced-update-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=1.6.1',
  './data.js?v=1.6.1',
  './cross.js?v=1.6.1',
  './app.js?v=1.6.1',
  './manifest.webmanifest?v=1.6.1',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, {cache:'no-store'})
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put('./index.html', clone)));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  const isCore = /\.(?:js|css|webmanifest)$/.test(url.pathname);
  if (isCore) {
    event.respondWith(
      fetch(request, {cache:'no-store'})
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, clone)));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const clone = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, clone)));
      }
      return response;
    }))
  );
});
