/**
 * Cricket Updates & Embed Links Client Helper
 * Fetches live cricket matches and iframe embed links from /api/cricket or ondemand.st API
 */
(function (global) {
  'use strict';

  var API_URL = '/api/cricket';
  var FALLBACK_URL = 'https://ondemand.st/papi/matches/all';

  function fetchCricketUpdates() {
    return fetch(API_URL, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && data.success && Array.isArray(data.matches)) {
          return data.matches;
        }
        throw new Error('Invalid response structure');
      })
      .catch(function () {
        // Direct fallback to ondemand.st API
        return fetch(FALLBACK_URL, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        })
          .then(function (res) { return res.json(); })
          .then(function (matches) {
            if (!Array.isArray(matches)) return [];
            return matches.filter(function (m) {
              var cat = (m.category || '').toLowerCase();
              var lgn = (m.league || '').toLowerCase();
              var ttl = (m.title || '').toLowerCase();
              return cat === 'cricket' || lgn.indexOf('cricket') !== -1 || ttl.indexOf('cricket') !== -1;
            }).map(function (m) {
              var streams = [];
              if (m.embedUrl) {
                streams.push({ id: m.id, name: m.title || 'Main Stream', iframe: m.embedUrl });
              }
              if (m.substreams && Array.isArray(m.substreams)) {
                m.substreams.forEach(function (sub) {
                  if (sub.iframe) {
                    streams.push({ id: sub.id || (m.id + '-' + sub.name), name: sub.name || 'Stream', iframe: sub.iframe });
                  }
                });
              }
              return {
                id: m.id,
                title: m.title,
                league: m.league || 'Cricket',
                status: m.status || 'live',
                poster: m.poster || '',
                teams: m.teams || {},
                viewers: m.viewers || m.viewerCount || 0,
                streams: streams
              };
            });
          })
          .catch(function () {
            return [];
          });
      });
  }

  global.CricketUpdates = {
    getMatches: fetchCricketUpdates
  };

  // Expose promise on window for early initializers
  if (!global._cricketUpdatesFetch) {
    global._cricketUpdatesFetch = fetchCricketUpdates();
  }
})(window);
