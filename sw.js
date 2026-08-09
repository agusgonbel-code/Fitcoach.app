const CACHE = 'fitcoach-2-2-0-pro-pack-20260809';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=2.2.0',
  './data.js?v=2.2.0',
  './app.js?v=2.2.0',
  './compat.js',
  './pro.js',
  './manifest.webmanifest?v=2.2.0',
  './version.json',
  './icon-192.png?v=2.2.0',
  './icon-512.png?v=2.2.0'
];

const ENHANCEMENTS = '<script src="./compat.js"></script><script src="./pro.js"></script>';

async function enhanceHtml(response) {
  if (!response || !response.ok) return response;
  try {
    const html = await response.text();
    if (html.includes('src="./pro.js"') || html.includes("src='./pro.js'")) {
      return new Response(html, {status:response.status,statusText:response.statusText,headers:response.headers});
    }
    const enhanced = html.replace('</body>', `${ENHANCEMENTS}</body>`);
    const headers = new Headers(response.headers);
    headers.set('content-type','text/html; charset=utf-8');
    headers.delete('content-length');
    return new Response(enhanced,{status:response.status,statusText:response.statusText,headers});
  } catch {
    return response;
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(APP_SHELL.map(asset =>
        fetch(asset,{cache:'reload'}).then(response => {
          if (!response.ok) throw new Error(`No se pudo precargar ${asset}`);
          return cache.put(asset,response);
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
        const response = preload || await fetch(request,{cache:'no-store'});
        if (response?.ok) {
          const cacheCopy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put('./index.html',cacheCopy)));
          return enhanceHtml(response);
        }
      } catch {}
      const fallback = await caches.match('./index.html');
      return fallback ? enhanceHtml(fallback) : Response.error();
    })());
    return;
  }

  const isCore = /\.(?:js|css|webmanifest|json)$/.test(url.pathname);
  if (isCore) {
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .then(response => {
          if (response.ok && response.type === 'basic') {
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request,response.clone())));
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
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request,response.clone())));
      }
      return response;
    }))
  );
});
