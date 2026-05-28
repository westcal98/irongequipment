const CACHE_NAME = 'irongequipment-v2.0';
const APP_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];
const ICON_FILES = [
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_FILES.concat(ICON_FILES));
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  var pathname = url.pathname;

  // Cache-first for icons
  if (ICON_FILES.indexOf(pathname) !== -1) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(res) {
          return caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(
    fetch(e.request).then(function(res) {
      return caches.open(CACHE_NAME).then(function(cache) {
        cache.put(e.request, res.clone());
        return res;
      });
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('/index.html');
      });
    })
  );
});
