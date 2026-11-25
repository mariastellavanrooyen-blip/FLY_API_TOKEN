// Dawn's Book service worker: lets the installed app open offline.
// Her book is NOT stored here. It lives in the phone's own database (IndexedDB).
const CACHE = 'dawns-book-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './apple-touch-icon.png', './img/bg-petals.jpg','./img/bg-rainbow.jpg','./img/bg-roses.jpg','./img/cover-swan.jpg','./img/frame-carousel.jpg','./img/frame-sweets.jpg','./img/frame-teddy.jpg','./img/garden-diary.jpg','./img/icon.jpg','./img/meadow.jpg','./img/puzzle.jpg','./img/st-bear.jpg','./img/st-bible.jpg','./img/st-cross.jpg','./img/st-duck.jpg','./img/st-girl.jpg','./img/st-horse.jpg','./img/st-tea.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('dawns-book-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The app page: network first so updates arrive, saved copy when offline.
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('/index.html'))) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Our own files and the fonts: saved copy first, refreshed in the background.
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin === location.origin || isFont) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
