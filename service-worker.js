const CACHE_VERSION = 'crochet-v1';
const ASSET_CACHE = 'crochet-assets-v1';
const PATRON_CACHE = 'crochet-patrons-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/patrons.html',
  '/details.html',
  '/admin.html',
  '/manifest.json',
  '/assets/styles.css',
  '/js/app.js',
  '/js/router.js',
  '/js/cache.js',
  '/js/auth.js',
  '/js/driveSync.js',
  '/js/data.js',
  '/js/admin.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('Installation error:', error))
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION && 
              cacheName !== ASSET_CACHE && 
              cacheName !== PATRON_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Google API calls - Network first
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('google.com') ||
      url.hostname.includes('gstatic.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // HTML pages - Network first with cache fallback
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets et styles - Cache first
  if (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Par défaut: Cache first avec fallback réseau
  event.respondWith(cacheFirst(request));
});

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return offlineFallback(request);
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return offlineFallback(request);
  }
}

// Offline fallback
function offlineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/index.html');
  }
  
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50" text-anchor="middle" x="50">📷</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  return new Response('Offline - Resource not available', { status: 503 });
}

// Background Sync for Drive sync (optionnel)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-drive') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_DRIVE'
          });
        });
      })
    );
  }
});

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('Service Worker loaded');
