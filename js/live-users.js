/**
 * Live Users Counter Client - Unique browser session presence tracking.
 * Uses persistent browser session ID, multi-tab sync, and periodic heartbeats.
 */
(function (global) {
  'use strict';

  var HEARTBEAT_INTERVAL = 12000; // 12 seconds
  var API_URL = '/api/live-users';
  var TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9);
  var STORAGE_KEY_SID = 'playup_browser_sid';
  var STORAGE_KEY_LAST_SEEN = 'playup_browser_last_seen';
  var STORAGE_KEY_COUNT = 'playup_live_count';
  var STORAGE_KEY_LEADER = 'playup_leader_tab';
  var STORAGE_KEY_LEADER_TIME = 'playup_leader_time';
  var SESSION_TTL = 30 * 60 * 1000; // 30 minutes inactivity resets session ID

  var timerId = null;
  var lastCount = 0;
  var isLeader = false;
  var bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('playup_live_users') : null;

  function getBrowserSessionId() {
    var now = Date.now();
    var sid = null;
    try {
      var lastSeen = parseInt(localStorage.getItem(STORAGE_KEY_LAST_SEEN) || '0', 10);
      sid = localStorage.getItem(STORAGE_KEY_SID);
      if (!sid || isNaN(lastSeen) || (now - lastSeen > SESSION_TTL)) {
        sid = 's_' + Math.random().toString(36).substring(2, 11) + now.toString(36);
        localStorage.setItem(STORAGE_KEY_SID, sid);
      }
      localStorage.setItem(STORAGE_KEY_LAST_SEEN, String(now));
    } catch (_) {
      sid = 's_' + Math.random().toString(36).substring(2, 11) + now.toString(36);
    }
    return sid;
  }

  function formatCount(num) {
    if (typeof num !== 'number' || isNaN(num) || num < 0) num = 0;
    return (num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toLocaleString()) + ' Online';
  }

  function updateBadges(count) {
    if (typeof count !== 'number' || isNaN(count)) count = 0;
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

    if (!currentLeader || currentLeader === TAB_ID || (now - leaderTime > 16000)) {
      localStorage.setItem(STORAGE_KEY_LEADER, TAB_ID);
      localStorage.setItem(STORAGE_KEY_LEADER_TIME, String(now));
      isLeader = true;
      return true;
    }
    isLeader = false;
    return false;
  }

  function sendHeartbeat(action) {
    var sid = getBrowserSessionId();
    var url = API_URL + '?sid=' + encodeURIComponent(sid);

    if (action === 'leave') {
      url += '&action=leave';
      var payload = JSON.stringify({ action: 'leave', sid: sid });
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
      if (!isNaN(cached)) updateBadges(cached);
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
        if (lastCount >= 0) updateBadges(lastCount);
      });
  }

  function initTabSync() {
    if (bc) {
      bc.onmessage = function (e) {
        if (e.data && e.data.type === 'COUNT_UPDATE' && typeof e.data.count === 'number') {
          updateBadges(e.data.count);
        } else if (e.data && e.data.type === 'LEADER_LEFT') {
          setTimeout(function () { sendHeartbeat(); }, 200);
        }
      };
    }

    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY_COUNT && e.newValue) {
        var count = parseInt(e.newValue, 10);
        if (!isNaN(count)) updateBadges(count);
      }
    });

    window.addEventListener('pagehide', function () {
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
    getSid: getBrowserSessionId
  };
})(window);
