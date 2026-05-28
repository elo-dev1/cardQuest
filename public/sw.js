const SW_VERSION = '2026-05-28-v1';
const CACHE_NAME = `cardquest-${SW_VERSION}`;
const STATIC_CACHE = `cardquest-static-${SW_VERSION}`;
const DYNAMIC_CACHE = `cardquest-dynamic-${SW_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff2)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Resource unavailable', { status: 504 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/index.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || caches.match('/index.html'));

  return cached || fetchPromise;
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncPendingTasks());
  }
});

async function syncPendingTasks() {
  // Read from IndexedDB and sync with Supabase
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Card Quest', {
      body: data.body || 'Новое обновление!',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let urlToOpen = event.notification.data?.url || '/shop';
  // Only allow relative URLs or same-origin absolute URLs
  if (urlToOpen.startsWith('http') && !urlToOpen.startsWith(self.location.origin)) {
    urlToOpen = '/';
    console.warn('Blocked navigation to external URL from notification click');
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      if (clients.openWindow) {
        clients.openWindow(self.location.origin + urlToOpen);
      }
    })
  );
});
