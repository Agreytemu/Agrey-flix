const CACHE_NAME = 'agreyflix-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://img.icons8.com/color/192/clapperboard.png',
  'https://img.icons8.com/color/512/clapperboard.png'
];

// Install Event - Pre-cache critical application assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline portal page and manifest');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean old caches to preserve storage spaces
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache registry:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Handle requests with stale-while-revalidate & single-page navigation fallbacks
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // We only intercept GET requests
  if (request.method !== 'GET') return;

  // 1. Single Page App Navigation Routes fallback to index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 2. Local App Assets & External Resources strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache (Stale-While-Revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignore background fetch failure, use cached one silently
        });
        return cachedResponse;
      }

      // If not in cache, fetch from network and dynamically cache if it is a safe static asset asset
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        
        // Caching non-API static files (CSS, JS, SVG, images)
        if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/v3')) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
        // Safe fallback for images when completely offline
        if (request.destination === 'image') {
          // Can return a generic placeholder or the default cache icon
          return caches.match('https://img.icons8.com/color/192/clapperboard.png');
        }
        return Promise.reject(err);
      });
    })
  );
});
