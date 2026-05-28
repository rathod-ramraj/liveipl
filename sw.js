'use strict';

var CACHE = 'playup-v1';
var HLS_CACHE = 'playup-hls-segments-v1';
var PRECACHE = ['/', '/saved.html', '/favicon.png', '/robots.txt', '/sitemap.xml'];

function isHlsMediaUrl(url) {
  try {
    var p = url.pathname.toLowerCase();
    return (
      /\.(m3u8|ts|m4s|mp4|aac|cmfv|cmfa)(\?|$)/i.test(p) ||
      /\/(playlist|manifest|chunk|segment|frag)/i.test(p)
    );
  } catch (_) {
    return false;
  }
}

/** Network-first: fresher live data; clone into Cache API for rewind/reconnect speed. */
function networkFirstHls(request) {
  return fetch(request)
    .then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(HLS_CACHE).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return res;
    })
    .catch(function () {
      return caches.match(request);
    });
}

/** Shell assets: cache match then network (offline-friendly for app shell). */
function shellFetch(request) {
  return caches.match(request).then(function (cached) {
    var network = fetch(request).then(function (res) {
      if (res.ok) {
        caches.open(CACHE).then(function (c) {
          c.put(request, res.clone());
        });
      }
      return res;
    }).catch(function () {
      return cached;
    });
    return cached || network;
  });
}

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(function (c) {
        return c.addAll(PRECACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            return k !== CACHE && k !== HLS_CACHE;
          })
          .map(function (k) {
            return caches.delete(k);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  /* HLS across origins: warm connection + optional cache (CORS/CDN dependent). */
  if (isHlsMediaUrl(url)) {
    e.respondWith(networkFirstHls(e.request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith(shellFetch(e.request));
});
