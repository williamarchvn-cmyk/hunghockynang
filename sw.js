/* Service worker — Hùng học kỹ năng */
const VERSION = 'hhkn-v1.2.0';
const SHELL = ['./', 'index.html', 'styles.css', 'config.js', 'manifest.webmanifest',
  'js/core.js', 'js/sync.js', 'js/charts.js', 'js/views.js', 'js/main.js', 'vendor/supabase.js',
  'fonts/bvp-vietnamese-400.woff2', 'fonts/bvp-latin-400.woff2', 'fonts/bvp-vietnamese-500.woff2', 'fonts/bvp-latin-500.woff2',
  'fonts/bvp-vietnamese-600.woff2', 'fonts/bvp-latin-600.woff2', 'fonts/bvp-vietnamese-700.woff2', 'fonts/bvp-latin-700.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same) return; // Supabase: luôn đi mạng
  // trang HTML: mạng trước, lỗi thì dùng cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  // tài nguyên: dùng cache ngay, cập nhật nền
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: same });
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});

/* ----- Thông báo đẩy ----- */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const title = d.title || 'Hùng học kỹ năng';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'Đến giờ luyện tập rồi!', icon: d.icon || 'icons/icon-192.png', badge: 'icons/badge-96.png',
    tag: d.tag || 'hhkn', renotify: true, data: { url: d.url || './#/today' },
    actions: [{ action: 'practice', title: 'Bắt đầu tập' }, { action: 'cards', title: 'Ôn thẻ' }]
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const hash = e.action === 'practice' ? '#/practice' : e.action === 'cards' ? '#/cards' : (new URL(e.notification.data?.url || './#/today', self.location.href).hash || '#/today');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.postMessage({ type: 'navigate', hash }); return c.focus(); } }
    return self.clients.openWindow('./' + hash);
  }));
});
