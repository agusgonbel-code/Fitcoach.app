const CACHE = 'fitcoach-2-0-2-runtime-stability-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=2.0.2',
  './data.js?v=2.0.2',
  './cross.js?v=2.0.2',
  './app.js?v=2.0.2',
  './manifest.webmanifest?v=2.0.2',
  './version.json',
  './icon-192.png?v=2.0.2',
  './icon-512.png?v=2.0.2'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(APP_SHELL.map(asset =>
        fetch(asset, {cache:'reload'})
          .then(response => {
            if (!response.ok) throw new Error(`No se pudo precargar ${asset}`);
            return cache.put(asset, response);
          })
      ))
    )
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
      self.registration.navigationPreload ? self.registration.navigationPreload.enable() : Promise.resolve()
    ]).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const response = preload || await fetch(request, {cache:'no-store'});
        if (response?.ok) {
          event.waitUntil(caches.open(CACHE).then(cache => cache.put('./index.html', response.clone())));
          return response;
        }
      } catch {}
      return (await caches.match('./index.html')) || Response.error();
    })());
    return;
  }

  const isCore = /\.(?:js|css|webmanifest|json)$/.test(url.pathname);
  if (isCore) {
    event.respondWith(
      fetch(request, {cache:'no-store'})
        .then(response => {
          if (response.ok && response.type === 'basic') {
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, response.clone())));
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
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, response.clone())));
      }
      return response;
    }))
  );
});
