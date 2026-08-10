const VERSION = '2.3.2';
const CACHE = 'fitcoach-runtime-2-3-2-hotpatch-20260810';

function patchAppJs(text) {
  let out = text;
  out = out.replace(/const APP_VERSION\s*=\s*['"]2\.2\.0['"]\s*;/, "const APP_VERSION = '2.3.2';");
  out = out.replace(/\n\s*if\s*\(\s*!CROSS_WODS\.length\s*\)\s*dataProblems\.push\(['"]WODs['"]\);?/, '');
  return out;
}

function patchHtml(text) {
  let out = text
    .replaceAll('2.2.0', '2.3.2')
    .replaceAll('FitCoach 2.2', 'FitCoach 2.3');

  // El core se sirve directamente; no dependemos de compat.js para arrancar.
  out = out.replace(/<script\s+src=["']compat\.js[^"']*["']><\/script>/gi, '');
  if (!out.includes('pro.js?v=2.3.2')) {
    out = out.replace('</body>', '<script src="pro.js?v=2.3.2"></script></body>');
  }
  return out;
}

function patchManifest(text) {
  try {
    const m = JSON.parse(text);
    m.name = 'FitCoach 2.3.2';
    m.short_name = 'FitCoach';
    m.version = VERSION;
    m.start_url = './?v=2.3.2';
    m.description = 'Entrenamiento adaptativo, nutrición y progreso.';
    return JSON.stringify(m, null, 2);
  } catch {
    return text;
  }
}

function textResponse(text, source, contentType) {
  const headers = new Headers(source.headers);
  headers.set('content-type', contentType);
  headers.set('cache-control', 'no-store, max-age=0, must-revalidate');
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(text, {status: source.status, statusText: source.statusText, headers});
}

async function network(request) {
  return fetch(request, {cache: 'no-store'});
}

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: siempre HTML fresco y parcheado.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const r = await network(req);
        if (!r.ok) return r;
        const t = await r.text();
        return textResponse(patchHtml(t), r, 'text/html; charset=utf-8');
      } catch {
        return Response.error();
      }
    })());
    return;
  }

  // app.js: aquí está la corrección real. El navegador ejecuta el core completo,
  // pero sin CROSS_WODS y con APP_VERSION 2.3.2.
  if (/\/app\.js$/.test(url.pathname)) {
    event.respondWith((async () => {
      const r = await network(req);
      if (!r.ok) return r;
      const t = await r.text();
      return textResponse(patchAppJs(t), r, 'text/javascript; charset=utf-8');
    })());
    return;
  }

  if (/\/manifest\.webmanifest$/.test(url.pathname)) {
    event.respondWith((async () => {
      const r = await network(req);
      if (!r.ok) return r;
      const t = await r.text();
      return textResponse(patchManifest(t), r, 'application/manifest+json; charset=utf-8');
    })());
    return;
  }

  // JS/CSS/JSON: network-first sin caché vieja.
  if (/\.(?:js|css|json|webmanifest)$/.test(url.pathname)) {
    event.respondWith(network(req));
  }
});
