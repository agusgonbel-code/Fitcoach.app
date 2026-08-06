const CACHE = 'fitcoach-stable-1-6-0-crosstraining-v1';
const APP_SHELL = ['./','./index.html','./styles.css','./data.js','./cross.js','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
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

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
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

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, clone)));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
