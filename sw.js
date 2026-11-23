const CACHE_NAME = 'domifect-pwa-v8';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon-192.png', './icon-512.png'];

let cachedActiveTasks = [];
let bgTimer = null;

function getDynamicIntervalMs(diffHours) {
  if (diffHours <= 2) return 30 * 1000; // 30 detik jika kritis
  return 60 * 1000;                    // 1 menit jika masih lama
}

function startSwBackgroundLoop() {
  if (bgTimer) return;
  bgTimer = setInterval(() => {
    checkSwTasks();
  }, 30000); // loop background tiap 30 detik
}

function checkSwTasks() {
  if (!cachedActiveTasks || !cachedActiveTasks.length) return;
  const now = Date.now();
  cachedActiveTasks.forEach(t => {
    if (t.status === 'active') {
      const targetTime = t.workSchedule ? new Date(t.workSchedule).getTime() : new Date(t.deadline).getTime();
      const diffHours = (targetTime - now) / 3600000;
      if (diffHours > -24) {
        const intervalMs = getDynamicIntervalMs(diffHours);
        const dynamicBucket = Math.floor(now / intervalMs);
        const urgencyLabel = diffHours <= 2 ? '🚨 KRITIS (30s)' : '⏰ PENGINGAT (1m)';
        const title = urgencyLabel + ' DOMIFECT: ' + (t.teacher || 'GURU').toUpperCase() + ' (' + (t.subject || 'TUGAS') + ')';
        const body = t.sampleMessage || ("Tugas '" + t.title + "' perlu segera dikerjakan.");
        self.registration.showNotification(title, {
          body: body,
          icon: './icon-192.png',
          badge: './icon-192.png',
          tag: 'task-' + t.id + '-' + dynamicBucket,
          renotify: true,
          vibrate: diffHours <= 2 ? [300, 100, 300] : [200, 100, 200],
          data: { url: './index.html' }
        }).catch(() => {});
      }
    }
  });
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
  startSwBackgroundLoop();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'DOMIFECT_SYNC_TASKS') {
    cachedActiveTasks = Array.isArray(data.tasks) ? data.tasks : [];
    startSwBackgroundLoop();
  } else if (data.type === 'DOMIFECT_NOTIFY' && data.title) {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || 'Ada pengingat tugas dari DOMIFECT.',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: data.tag || 'domifect-reminder',
        renotify: true,
        vibrate: [250, 100, 250],
        data: { url: './index.html' }
      })
    );
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'domifect-bg-check') {
    event.waitUntil(Promise.resolve(checkSwTasks()));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
