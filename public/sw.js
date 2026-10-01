const CACHE_NAME = 'starmotos-v49';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logoheader.webp',
  '/starmotos-logo.jpg',
  '/starmotos-logo.png',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-512.png',
  '/manifest.json',
  '/manifest-admin.json',
  '/manifest-taller.json',
  '/manifest-garante.json',
  '/manifest-cliente.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  let targetRequest = event.request;

  // Reencaminar peticiones a dominios de almacenamiento antiguos de Supabase hacia el nuevo dominio activo
  if (url.includes('djbvtgjykrkygkdhfhos.supabase.co')) {
    const fixedUrl = url.replace(/djbvtgjykrkygkdhfhos\.supabase\.co/g, 'nphfdolcupkyvjyglgjx.supabase.co');
    try {
      targetRequest = new Request(fixedUrl, {
        method: event.request.method,
        headers: event.request.headers,
        mode: event.request.mode,
        credentials: event.request.credentials,
        redirect: event.request.redirect,
      });
    } catch (_) {
      targetRequest = fixedUrl;
    }
  }

  event.respondWith(
    fetch(targetRequest)
      .then((networkResponse) => {
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          // Siempre retornar un Response válido para evitar "Failed to convert value to Response"
          return new Response(null, { status: 404, statusText: 'Not Found' });
        });
      })
  );
});
