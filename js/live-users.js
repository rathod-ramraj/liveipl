/**
 * Live Users Counter — lightweight heartbeat & active visitor tracking.
 * Deduplicates tabs via sessionStorage and updates online badges automatically.
 */
(function (global) {
  'use strict';

  var HEARTBEAT_INTERVAL = 30000; // Send heartbeat every 30 seconds
  var API_URL = '/api/live-users';
  var lastCount = 0;
  var timerId = null;

  function formatCount(num) {
    if (!num || isNaN(num)) return '1 Online';
    return (num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toLocaleString()) + ' Online';
  }

  function updateBadges(count) {
    if (!count || count <= 0) count = 1;
    lastCount = count;
    var formatted = formatCount(count);

    var navEl = document.getElementById('navLiveUsersCount');
    if (navEl) navEl.textContent = formatted;

    var playerEl = document.getElementById('playerLiveUsersCount');
    if (playerEl) playerEl.textContent = formatted;
  }

  function sendHeartbeat() {
    fetch(API_URL, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      credentials: 'omit',
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && typeof data.activeUsers === 'number') {
          updateBadges(data.activeUsers);
        }
      })
      .catch(function () {
        if (lastCount > 0) updateBadges(lastCount);
      });
  }

  function start() {
    sendHeartbeat();
    if (timerId) clearInterval(timerId);
    timerId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Send heartbeat when tab becomes visible again
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    });
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);

  global.LiveUsersCounter = {
    update: updateBadges,
    ping: sendHeartbeat,
  };
})(window);
