const CACHE = 'fitcoach-runtime-2-3-1-force-refresh-20260810';
const CORE = [
  './',
  './index.html',
  './styles.css?v=2.2.0',
  './data.js?v=2.2.0',
  './app.js?v=2.2.0',
  './compat.js?v=2.3.1',
  './pro.js?v=2.3.1',
  './manifest.webmanifest',
  './version.json'
];

function patchedHtml(text) {
  let html = text;
  if (!html.includes('compat.js?v=2.3.1')) {
    html = html.replace(
      /<script\s+src=["']app\.js\?v=[^"']+["']><\/script>/i,
      '<script src="compat.js?v=2.3.1"></script><script src="app.js?v=2.2.0"></script><script src="pro.js?v=2.3.1"></script>'
    );
  }
  // Fallback for an index without a versioned app.js tag.
  if (!html.includes('compat.js?v=2.3.1')) {
    html = html.replace(
      /<script\s+src=["']app\.js["']><\/script>/i,
      '<script src="compat.js?v=2.3.1"></script><script src="app.js"></script><script src="pro.js?v=2.3.1"></script>'
    );
  }
  // Last resort: inject before </body>. app.js currently defers init until DOMContentLoaded,
  // so compat still executes before init.
  if (!html.includes('compat.js?v=2.3.1')) {
    html = html.replace(
      '</body>',
      '<script src="compat.js?v=2.3.1"></script><script src="pro.js?v=2.3.1"></script></body>'
    );
  }
  return html;
}

async function patchResponse(response) {
  if (!response || !response.ok) return response;
  const text = await response.text();
  const headers = new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.delete('content-length');
  headers.set('cache-control','no-store, max-age=0');
  return new Response(patchedHtml(text), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(CORE.map(url =>
        fetch(url,{cache:'reload'}).then(r => r.ok ? cache.put(url,r) : Promise.reject())
      ))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_OLD_CACHES') {
    event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  }
});

self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try {
        // Never trust an old HTML shell when online.
        const fresh=await fetch(req,{cache:'no-store',headers:{'cache-control':'no-cache'}});
        if(fresh?.ok){
          const clone=fresh.clone();
          event.waitUntil(caches.open(CACHE).then(c=>c.put('./index.html',clone)));
          return patchResponse(fresh);
        }
      } catch {}
      const fallback=await caches.match('./index.html') || await caches.match('./');
      return fallback ? patchResponse(fallback) : Response.error();
    })());
    return;
  }

  if(/\.(?:js|css|webmanifest|json)$/.test(url.pathname)){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(r=>{
          if(r.ok) event.waitUntil(caches.open(CACHE).then(c=>c.put(req,r.clone())));
          return r;
        })
        .catch(()=>caches.match(req))
    );
    return;
  }

  event.respondWith(caches.match(req).then(c=>c||fetch(req)));
});
