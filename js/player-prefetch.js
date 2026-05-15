/**
 * Manifest warm-up + optional Cache API priming.
 * Cross-origin segments only cache if CORS exposes the response to the SW/page.
 */
(function (global) {
  'use strict';

  /**
   * Fetches the master / media playlist early to populate HTTP cache and service worker.
   * Does not parse — hls.js remains source of truth.
   */
  function warmManifest(url) {
    if (!url || !/^https?:/i.test(url)) return Promise.resolve();
    return fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache',
    }).catch(function () {
      return fetch(url, { mode: 'cors', credentials: 'omit' });
    });
  }

  /**
   * Non-blocking warm-up via requestIdleCallback when available.
   */
  function scheduleWarm(url) {
    var run = function () { warmManifest(url); };
    if (global.requestIdleCallback) {
      global.requestIdleCallback(run, { timeout: 1200 });
    } else {
      setTimeout(run, 0);
    }
  }

  global.PlayerPrefetch = {
    warmManifest: warmManifest,
    scheduleWarm: scheduleWarm,
  };
})(window);
