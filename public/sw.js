// Asphalt Pro Service Worker - Advanced Offline Caching for Quotes & Price Catalog
const CACHE_VERSION = 'v3.2.0';
const STATIC_CACHE = `asphaltpro-core-${CACHE_VERSION}`;
const FONTS_CACHE = `asphaltpro-fonts-${CACHE_VERSION}`;
const IMAGES_CACHE = `asphaltpro-images-${CACHE_VERSION}`;

// Precache essential application shell and offline assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. INSTALL: Precache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset addAll notice:', err);
      });
    })
  );
  // Force immediate activation
  self.skipWaiting();
});

// 2. ACTIVATE: Cleanup older caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, FONTS_CACHE, IMAGES_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName) && cacheName.startsWith('asphaltpro-')) {
            console.log('[SW] Removendo cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Smart multi-tier caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore non-HTTP/HTTPS and browser extensions
  if (!url.protocol.startsWith('http')) return;

  // Strategy A: Google Fonts & Material Symbols (Cache-First)
  // Ensures all icons (quote, price, pdf, calculation) display even in zero-connectivity field conditions
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.pathname.includes('/fonts/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (e) {
          // If offline and not in cache, fallback gracefully
          return cachedResponse || new Response('', { status: 408, statusText: 'Font offline fallback' });
        }
      })
    );
    return;
  }

  // Strategy B: Static Images & Logos (Cache-First with Network Revalidation)
  if (
    event.request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i)
  ) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy C: HTML Navigation & Document Mode (Network-First with Instant App Shell Fallback)
  // Allows full offline loading of the ERP, Price Catalog, and Quotes view
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Fallback to cached index.html so the React SPA loads with full offline quote & catalog database
          const cached = await caches.match('/index.html') || await caches.match('/');
          if (cached) return cached;
          return new Response(
            `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Asphalt Pro Offline</title></head><body style="font-family:sans-serif;padding:24px;text-align:center;background:#1C1B1B;color:#F8F9FA;"><h2>Asphalt Pro - Usina Offline</h2><p>O aplicativo está pronto para uso local. Reconecte à internet se precisar sincronizar.</p><button onclick="location.reload()" style="background:#F2A93B;color:#010102;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;">Tentar Novamente</button></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Strategy D: Core JS/CSS Bundles & App Assets (Stale-While-Revalidate)
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. MESSAGE: Allow client to communicate with Service Worker
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CHECK_OFFLINE_READY') {
    event.ports[0]?.postMessage({
      status: 'ready',
      version: CACHE_VERSION,
      timestamp: Date.now()
    });
  }
});
