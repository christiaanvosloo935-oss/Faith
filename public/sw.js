// Offline support and push notifications.
const CACHE = 'faith-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('./index.html'))),
  );
});

self.addEventListener('push', (e) => {
  let data = { title: 'Faith', body: '', url: '#/' };
  try {
    data = { ...data, ...e.data.json() };
  } catch {
    /* plain text or empty */
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon.svg',
      badge: './icon.svg',
      data: { url: data.url },
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL(self.registration.scope).href + (e.notification.data?.url || '#/');
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
