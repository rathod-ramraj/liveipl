/**
 * Watch by ID — movies & TV via third-party embed providers.
 */
(function (global) {
  'use strict';

  var SERVERS = [
    {
      id: '111movies',
      name: '111movies',
      badge: 'Default · Ads free',
      movie: function (id) {
        return 'https://111movies.net/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://111movies.net/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'vidup',
      name: 'Vidup',
      badge: 'Auto-play',
      movie: function (id) {
        return (
          'https://vidup.to/movie/' +
          encodeURIComponent(id) +
          '?autoPlay=true&fullscreenButton=true&chromecast=true'
        );
      },
      tv: function (id, season, episode) {
        return (
          'https://vidup.to/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?autoPlay=true&fullscreenButton=true&chromecast=true'
        );
      },
    },
    {
      id: 'vidlink',
      name: 'Vidlink Pro',
      badge: 'TMDB ID',
      movie: function (id) {
        return 'https://vidlink.pro/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://vidlink.pro/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'videasy',
      name: 'Videasy',
      badge: 'TMDB · Overlay',
      movie: function (id) {
        return (
          'https://player.videasy.net/movie/' +
          encodeURIComponent(id) +
          '?overlay=true&color=ff4d6d'
        );
      },
      tv: function (id, season, episode) {
        return (
          'https://player.videasy.net/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?overlay=true&nextEpisode=true&color=ff4d6d'
        );
      },
    },
  ];

  var state = {
    open: false,
    mediaId: null,
    isTv: false,
    season: 1,
    episode: 1,
    serverId: '111movies',
    title: '',
  };
  var savedLiveChannel = null;

  var els = {};

  function parseMediaId(raw) {
    var s = (raw || '').trim();
    if (!s) return null;
    var m = s.match(/tt\d{7,10}/i);
    if (m) return m[0].toLowerCase();
    m = s.match(/imdb\.com\/title\/(tt\d+)/i);
    if (m) return m[1].toLowerCase();
    m = s.match(/themoviedb\.org\/movie\/(\d+)/i);
    if (m) return m[1];
    m = s.match(/themoviedb\.org\/tv\/(\d+)/i);
    if (m) return m[1];
    if (/^tt\d{7,10}$/i.test(s)) return s.toLowerCase();
    if (/^\d{4,10}$/.test(s)) return s;
    return null;
  }

  function getServer(id) {
    for (var i = 0; i < SERVERS.length; i++) {
      if (SERVERS[i].id === id) return SERVERS[i];
    }
    return SERVERS[0];
  }

  function buildEmbedUrl() {
    var srv = getServer(state.serverId);
    if (!state.mediaId) return '';
    if (state.isTv) {
      return srv.tv(state.mediaId, state.season, state.episode);
    }
    return srv.movie(state.mediaId);
  }

  function pauseLiveSitePlayers() {
    savedLiveChannel = global.cur || null;
    if (global.IframePlayer && global.IframePlayer.suspendAll) {
      global.IframePlayer.suspendAll();
    }
    if (global.PlayerPrefetch && global.PlayerPrefetch.stopAllWarmHls) {
      global.PlayerPrefetch.stopAllWarmHls();
    }
    var ratio = global.elRatio;
    if (ratio) {
      var videos = ratio.querySelectorAll('video');
      for (var i = 0; i < videos.length; i++) {
        try {
          videos[i].pause();
          videos[i].muted = true;
        } catch (_) {}
      }
    }
    if (global.PerfController) {
      if (global.PerfController.setIframeActive) global.PerfController.setIframeActive(true);
      else global.PerfController.setStreaming(true);
    }
  }

  function resumeLiveSitePlayers() {
    if (els.iframe) {
      try {
        els.iframe.src = 'about:blank';
      } catch (_) {}
    }
    if (global.PerfController) {
      if (global.PerfController.setIframeActive) global.PerfController.setIframeActive(false);
      else global.PerfController.setStreaming(false);
    }
    if (savedLiveChannel && typeof global.setStream === 'function') {
      try {
        global.setStream(savedLiveChannel);
      } catch (_) {}
    }
    savedLiveChannel = null;
  }

  function setLoading(on) {
    if (els.loading) els.loading.classList.toggle('is-visible', !!on);
  }

  function updateServerSelect() {
    if (!els.serverSelect) return;
    var html = '';
    for (var i = 0; i < SERVERS.length; i++) {
      var s = SERVERS[i];
      var sel = s.id === state.serverId;
      var label = s.name + (s.badge ? ' — ' + s.badge : '');
      html +=
        '<option value="' +
        s.id +
        '"' +
        (sel ? ' selected' : '') +
        '>' +
        label +
        '</option>';
    }
    els.serverSelect.innerHTML = html;
  }

  function loadEmbed() {
    var url = buildEmbedUrl();
    if (!url || !els.iframe) return;
    setLoading(true);
    els.iframe.onload = function () {
      setLoading(false);
    };
    els.iframe.onerror = function () {
      setLoading(false);
    };
    els.iframe.src = url;
    preconnectHosts(url);
  }

  function preconnectHosts(url) {
    if (global.IframePlayer && global.IframePlayer.preconnect) {
      global.IframePlayer.preconnect(url);
    }
  }

  function openPlayer() {
    pauseLiveSitePlayers();
    state.open = true;
    document.body.classList.add('wbid-active');
    els.overlay.hidden = false;
    els.overlay.setAttribute('aria-hidden', 'false');
    updateServerSelect();
    loadEmbed();
    if (state.title && els.playerTitle) {
      els.playerTitle.textContent = state.title;
    }
  }

  function closePlayer() {
    state.open = false;
    document.body.classList.remove('wbid-active');
    els.overlay.hidden = true;
    els.overlay.setAttribute('aria-hidden', 'true');
    resumeLiveSitePlayers();
  }

  function openModal() {
    els.modal.hidden = false;
    els.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wbid-modal-open');
    if (els.idInput) els.idInput.focus();
  }

  function closeModal() {
    els.modal.hidden = true;
    els.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wbid-modal-open');
  }

  function readForm() {
    var id = parseMediaId(els.idInput ? els.idInput.value : '');
    if (!id) {
      if (typeof global.showToast === 'function') {
        global.showToast('Enter a valid IMDb or TMDB ID');
      }
      return false;
    }
    state.mediaId = id;
    state.isTv = els.tvCheck ? els.tvCheck.checked : false;
    state.season = els.seasonInput ? parseInt(els.seasonInput.value, 10) || 1 : 1;
    state.episode = els.episodeInput ? parseInt(els.episodeInput.value, 10) || 1 : 1;
    state.title = state.isTv
      ? 'TV · S' + state.season + 'E' + state.episode + ' · ' + id
      : 'Movie · ' + id;
    return true;
  }

  function onWatch() {
    if (!readForm()) return;
    closeModal();
    openPlayer();
  }

  function onDetails() {
    if (!readForm()) return;
    var id = state.mediaId;
    var url = /^tt/i.test(id)
      ? 'https://www.imdb.com/title/' + id + '/'
      : 'https://www.themoviedb.org/movie/' + id;
    if (state.isTv && !/^tt/i.test(id)) {
      url = 'https://www.themoviedb.org/tv/' + id;
    }
    global.open(url, '_blank', 'noopener,noreferrer');
  }

  function bindOpenTrigger(el) {
    if (!el) return;
    el.addEventListener(
      'click',
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      },
      false
    );
  }

  function bindEvents() {
    bindOpenTrigger(els.fab);
    bindOpenTrigger(els.navBtn);
    bindOpenTrigger(els.heroBtn);

    els.modalClose.addEventListener('click', closeModal);
    els.modal.addEventListener('click', function (e) {
      if (e.target === els.modal) closeModal();
    });

    els.watchBtn.addEventListener('click', onWatch);
    els.detailsBtn.addEventListener('click', onDetails);

    if (els.tvCheck) {
      els.tvCheck.addEventListener('change', function () {
        var on = els.tvCheck.checked;
        if (els.tvFields) els.tvFields.classList.toggle('is-visible', on);
      });
    }

    els.backBtn.addEventListener('click', closePlayer);

    els.serverSelect.addEventListener('change', function () {
      state.serverId = els.serverSelect.value;
      loadEmbed();
    });

    if (els.serverToggle) {
      els.serverToggle.addEventListener('click', function () {
        els.serverPanel.classList.toggle('is-collapsed');
        els.serverToggle.textContent = els.serverPanel.classList.contains('is-collapsed')
          ? 'Show'
          : 'Hide';
      });
    }

    if (els.idInput) {
      els.idInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onWatch();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (state.open) {
          e.preventDefault();
          closePlayer();
        } else if (!els.modal.hidden) {
          e.preventDefault();
          closeModal();
        }
      }
    });
  }

  function init() {
    els.modal = document.getElementById('wbid-modal');
    els.overlay = document.getElementById('wbid-overlay');
    if (!els.modal || !els.overlay) return;

    els.fab = document.getElementById('wbid-fab');
    els.navBtn = document.getElementById('wbid-nav-btn');
    els.heroBtn = document.getElementById('wbid-hero-btn');

    els.modalClose = document.getElementById('wbid-modal-close');
    els.idInput = document.getElementById('wbid-id-input');
    els.tvCheck = document.getElementById('wbid-tv-check');
    els.tvFields = document.getElementById('wbid-tv-fields');
    els.seasonInput = document.getElementById('wbid-season');
    els.episodeInput = document.getElementById('wbid-episode');
    els.watchBtn = document.getElementById('wbid-watch-btn');
    els.detailsBtn = document.getElementById('wbid-details-btn');
    els.backBtn = document.getElementById('wbid-back');
    els.serverSelect = document.getElementById('wbid-server-select');
    els.serverPanel = document.getElementById('wbid-server-panel');
    els.serverToggle = document.getElementById('wbid-server-toggle');
    els.iframe = document.getElementById('wbid-iframe');
    els.loading = document.getElementById('wbid-loading');
    els.playerTitle = document.getElementById('wbid-player-title');

    bindEvents();

    SERVERS.forEach(function (s) {
      var sample = s.movie('299534');
      preconnectHosts(sample);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.WatchById = {
    parseMediaId: parseMediaId,
    open: openModal,
    close: closePlayer,
    closeModal: closeModal,
  };
})(window);
