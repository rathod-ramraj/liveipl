/**
 * Live Users Counter Client - High-performance, multi-tab deduplicated heartbeat client.
 * Uses 15s heartbeat, BroadcastChannel/localStorage tab coordination, and sendBeacon on unload.
 */
(function (global) {
  'use strict';

  var HEARTBEAT_INTERVAL = 15000; // 15 seconds
  var API_URL = '/api/live-users';
  var TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9);
  var STORAGE_KEY_COUNT = 'playup_live_count';
  var STORAGE_KEY_LEADER = 'playup_leader_tab';
  var STORAGE_KEY_LEADER_TIME = 'playup_leader_time';

  var timerId = null;
  var lastCount = 0;
  var isLeader = false;
  var bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('playup_live_users') : null;

  function formatCount(num) {
    if (!num || isNaN(num) || num <= 0) return '1 Online';
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

  function broadcastCount(count) {
    updateBadges(count);
    try {
      localStorage.setItem(STORAGE_KEY_COUNT, String(count));
    } catch (_) { }
    if (bc) {
      try {
        bc.postMessage({ type: 'COUNT_UPDATE', count: count });
      } catch (_) { }
    }
  }

  function checkIsLeader() {
    var now = Date.now();
    var currentLeader = localStorage.getItem(STORAGE_KEY_LEADER);
    var leaderTime = parseInt(localStorage.getItem(STORAGE_KEY_LEADER_TIME) || '0', 10);

    if (!currentLeader || currentLeader === TAB_ID || (now - leaderTime > 20000)) {
      localStorage.setItem(STORAGE_KEY_LEADER, TAB_ID);
      localStorage.setItem(STORAGE_KEY_LEADER_TIME, String(now));
      isLeader = true;
      return true;
    }
    isLeader = false;
    return false;
  }

  function sendHeartbeat(action) {
    var url = API_URL;
    if (action === 'leave') {
      url += '?action=leave';
      var payload = JSON.stringify({ action: 'leave' });
      if (navigator.sendBeacon) {
        try {
          var blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
          return;
        } catch (_) { }
      }
      fetch(url, { method: 'POST', body: payload, keepalive: true, credentials: 'omit' }).catch(function () { });
      return;
    }

    if (!checkIsLeader()) {
      var cached = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || '0', 10);
      if (cached > 0) updateBadges(cached);
      return;
    }

    fetch(url, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      credentials: 'omit',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && typeof data.activeUsers === 'number') {
          broadcastCount(data.activeUsers);
        }
      })
      .catch(function () {
        if (url === API_URL) {
          fetch('https://playup.vercel.app/api/live-users', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' },
            credentials: 'omit',
          })
            .then(function (res) { return res.json(); })
            .then(function (data) {
              if (data && typeof data.activeUsers === 'number') {
                broadcastCount(data.activeUsers);
              }
            })
            .catch(function () {
              if (lastCount > 0) updateBadges(lastCount);
            });
        } else if (lastCount > 0) {
          updateBadges(lastCount);
        }
      });
  }

  function initTabSync() {
    if (bc) {
      bc.onmessage = function (e) {
        if (e.data && e.data.type === 'COUNT_UPDATE' && typeof e.data.count === 'number') {
          updateBadges(e.data.count);
        } else if (e.data && e.data.type === 'LEADER_LEFT') {
          setTimeout(function () { sendHeartbeat(); }, 300);
        }
      };
    }

    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY_COUNT && e.newValue) {
        var count = parseInt(e.newValue, 10);
        if (count > 0) updateBadges(count);
      }
    });

    window.addEventListener('pagehide', function () {
      sendHeartbeat('leave');
      if (isLeader) {
        localStorage.removeItem(STORAGE_KEY_LEADER);
        localStorage.removeItem(STORAGE_KEY_LEADER_TIME);
        if (bc) {
          try { bc.postMessage({ type: 'LEADER_LEFT' }); } catch (_) { }
        }
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      } else if (document.visibilityState === 'hidden') {
        sendHeartbeat('leave');
      }
    });
  }

  function start() {
    initTabSync();
    sendHeartbeat();
    if (timerId) clearInterval(timerId);
    timerId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);

  global.LiveUsersCounter = {
    update: updateBadges,
    ping: sendHeartbeat,
  };
})(window);
