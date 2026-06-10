/**
 * Watch by ID — movies & TV via third-party embed providers.
 */
(function (global) {
  'use strict';

  var SITE = global.SITE_TITLE || 'LiveStream';
  var PREWARM_DELAY = 420;
  var prewarmTimer = null;
  var metaReq = 0;
  var embedSwapTimer = null;

  var SERVERS = [
    {
      id: '111movies',
      name: '111movies',
      badge: 'Default · IMDb · TMDB',
      imdb: true,
      tmdb: true,
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
      id: 'peachify',
      name: 'Peachify',
      badge: 'IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://peachify.top/embed/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://peachify.top/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'vidfast',
      name: 'Vidfast',
      badge: 'TMDB · Auto-play',
      imdb: false,
      tmdb: true,
      movie: function (id) {
        return (
          'https://vidfast.pro/movie/' +
          encodeURIComponent(id) +
          '?autoPlay=true&fullscreenButton=true&chromecast=true&theme=ff4d6d'
        );
      },
      tv: function (id, season, episode) {
        return (
          'https://vidfast.pro/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?autoPlay=true&nextButton=true&autoNext=true&fullscreenButton=true&theme=ff4d6d'
        );
      },
    },
    {
      id: 'vidup',
      name: 'Vidup',
      badge: 'TMDB · Auto-play',
      imdb: false,
      tmdb: true,
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
          '?autoPlay=true&nextButton=true&autoNext=true&fullscreenButton=true'
        );
      },
    },
    {
      id: 'vidsrc-fyi',
      name: 'VidSrc.fyi',
      badge: 'IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://vidsrc.fyi/embed/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://vidsrc.fyi/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'vidsrc-mov',
      name: 'VidSrc.mov',
      badge: 'IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://vidsrc.mov/embed/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://vidsrc.mov/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'vidking',
      name: 'VidKing',
      badge: 'IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://www.vidking.net/embed/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://www.vidking.net/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'vidnest',
      name: 'Vidnest',
      badge: 'TMDB only',
      imdb: false,
      tmdb: true,
      movie: function (id) {
        return 'https://vidnest.fun/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://vidnest.fun/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'vidlink',
      name: 'Vidlink Pro',
      badge: 'TMDB only',
      imdb: false,
      tmdb: true,
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
      badge: 'TMDB · Next ep',
      imdb: false,
      tmdb: true,
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
          '?overlay=true&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&color=ff4d6d'
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
    displayTitle: '',
    savedPageTitle: '',
    savedModalTitle: '',
  };
  var savedLiveChannel = null;
  var els = {};
  var loadToken = 0;
  var loadHideTimer = null;

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

  function getIdKind(id) {
    if (!id) return null;
    if (/^tt\d{7,10}$/i.test(id)) return 'imdb';
    if (/^\d{4,10}$/.test(id)) return 'tmdb';
    return null;
  }

  function serverSupports(server, kind) {
    if (!kind) return true;
    if (kind === 'imdb') return server.imdb !== false;
    if (kind === 'tmdb') return server.tmdb !== false;
    return false;
  }

  function getServersForId(mediaId) {
    var kind = getIdKind(mediaId);
    if (!kind) return SERVERS.slice();
    var out = [];
    for (var i = 0; i < SERVERS.length; i++) {
      if (serverSupports(SERVERS[i], kind)) out.push(SERVERS[i]);
    }
    return out;
  }

  function ensureServerForId(mediaId) {
    var list = getServersForId(mediaId);
    if (!list.length) return false;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === state.serverId) return true;
    }
    state.serverId = list[0].id;
    return true;
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

  function defaultLabel() {
    if (state.isTv) {
      return 'TV Show · S' + state.season + ' E' + state.episode;
    }
    return /^tt/i.test(state.mediaId) ? 'Movie · ' + state.mediaId : 'Movie';
  }

  function pageTitleText() {
    var label = state.displayTitle || defaultLabel();
    if (state.isTv) {
      return label + ' · S' + state.season + 'E' + state.episode + ' — ' + SITE;
    }
    return label + ' — ' + SITE;
  }

  function overlayTitleText() {
    var label = state.displayTitle || defaultLabel();
    if (state.isTv) {
      return label + ' · Season ' + state.season + ' · Episode ' + state.episode;
    }
    return label;
  }

  function applyPageTitle() {
    if (global.PageTitle && global.PageTitle.movie) {
      global.PageTitle.movie(
        state.displayTitle || defaultLabel(),
        state.isTv,
        state.season,
        state.episode
      );
      return;
    }
    document.title = pageTitleText();
  }

  function restorePageTitle() {
    if (global.cur && typeof global.updatePageTitle === 'function') {
      global.updatePageTitle(global.cur);
    } else if (state.savedPageTitle) {
      document.title = state.savedPageTitle;
    } else if (global.PageTitle && global.PageTitle.home) {
      global.PageTitle.home();
    } else {
      document.title = SITE;
    }
    state.savedPageTitle = '';
    state.savedModalTitle = '';
  }

  function updateOverlayTitle() {
    if (els.playerTitle) els.playerTitle.textContent = overlayTitleText();
  }

  function updateNextEpisodeUI() {
    if (!els.nextEp) return;
    if (!state.open || !state.isTv) {
      els.nextEp.hidden = true;
      els.nextEp.classList.remove('is-visible');
      return;
    }
    var nextEp = state.episode + 1;
    els.nextEp.hidden = false;
    els.nextEp.classList.add('is-visible');
    if (els.nextEpLabel) {
      els.nextEpLabel.textContent = 'Next · S' + state.season + ' E' + nextEp;
    }
  }

  function fetchMediaTitle() {
    if (!state.mediaId) return;
    var reqId = ++metaReq;
    var id = state.mediaId;
    var isTv = state.isTv;

    function apply(name) {
      if (reqId !== metaReq || !state.open) return;
      if (!name) return;
      state.displayTitle = name;
      applyPageTitle();
      updateOverlayTitle();
      updateNextEpisodeUI();
    }

    if (/^tt/i.test(id)) {
      fetch('https://v2.sg.media-imdb.com/suggestion/t/' + encodeURIComponent(id) + '.json')
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          var row = data && data.d && data.d[0];
          if (row && row.l) apply(row.l);
        })
        .catch(function () {});

      fetch('https://search.imdbot.workers.dev/?tt=' + encodeURIComponent(id))
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          var t =
            (data && data.short && data.short.name) ||
            (data && data.title) ||
            (data && data['#TITLE']);
          if (t) apply(String(t).trim());
        })
        .catch(function () {});
      return;
    }

    var tmdbKey = global.TMDB_API_KEY || '';
    if (!tmdbKey) return;

    var path = (isTv ? 'tv' : 'movie') + '/' + encodeURIComponent(id) + '?language=en-US';
    fetch('https://api.themoviedb.org/3/' + path + '&api_key=' + encodeURIComponent(tmdbKey))
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var t = (data && (data.title || data.name)) || '';
        if (t) apply(t);
      })
      .catch(function () {});
  }

  function preconnectHosts(url) {
    if (global.IframePlayer && global.IframePlayer.preconnect) {
      global.IframePlayer.preconnect(url);
    }
  }

  function isActiveSrc(src) {
    return src && src !== 'about:blank' && !/^about:/i.test(src);
  }

  /** Stop every iframe except the movie player — prevents double audio / lip-sync issues. */
  function silenceOtherEmbeds(keepEl) {
    var list = document.querySelectorAll('iframe');
    for (var i = 0; i < list.length; i++) {
      var frame = list[i];
      if (keepEl && frame === keepEl) continue;
      try {
        frame.src = 'about:blank';
        frame.removeAttribute('src');
      } catch (_) {}
    }
  }

  function preconnectCurrentEmbed() {
    var url = buildEmbedUrl();
    if (url) preconnectHosts(url);
  }

  function schedulePrewarm() {
    clearTimeout(prewarmTimer);
    prewarmTimer = setTimeout(function () {
      prewarmTimer = null;
      if (!readFormSilent()) return;
      preconnectCurrentEmbed();
    }, PREWARM_DELAY);
  }

  function readFormSilent() {
    var id = parseMediaId(els.idInput ? els.idInput.value : '');
    if (!id) return false;
    state.mediaId = id;
    state.isTv = els.tvCheck ? els.tvCheck.checked : false;
    state.season = els.seasonInput ? parseInt(els.seasonInput.value, 10) || 1 : 1;
    state.episode = els.episodeInput ? parseInt(els.episodeInput.value, 10) || 1 : 1;
    return true;
  }

  function pauseLiveSitePlayers() {
    savedLiveChannel = global.cur || null;
    if (global.IframePlayer && global.IframePlayer.suspendAll) {
      global.IframePlayer.suspendAll();
    }
    if (global.PlayerPrefetch && global.PlayerPrefetch.stopAllWarmHls) {
      global.PlayerPrefetch.stopAllWarmHls();
    }
    silenceOtherEmbeds(null);
    var ratio = global.elRatio;
    if (ratio) {
      var videos = ratio.querySelectorAll('video');
      for (var i = 0; i < videos.length; i++) {
        try {
          videos[i].pause();
          videos[i].muted = true;
          videos[i].removeAttribute('src');
          videos[i].load();
        } catch (_) {}
      }
    }
    if (global.PerfController) {
      if (global.PerfController.setIframeActive) global.PerfController.setIframeActive(true);
      else global.PerfController.setStreaming(true);
    }
  }

  function resumeLiveSitePlayers() {
    if (embedSwapTimer) {
      clearTimeout(embedSwapTimer);
      embedSwapTimer = null;
    }
    if (els.iframe) {
      try {
        els.iframe.src = 'about:blank';
        els.iframe.removeAttribute('src');
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
    if (!els.loading) return;
    els.loading.classList.toggle('is-visible', !!on);
    els.loading.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  function clearLoadTimers() {
    if (loadHideTimer) {
      clearTimeout(loadHideTimer);
      loadHideTimer = null;
    }
  }

  function finishLoading() {
    clearLoadTimers();
    setLoading(false);
  }

  function scheduleLoadingHide(token, ms) {
    clearLoadTimers();
    loadHideTimer = setTimeout(function () {
      if (token === loadToken) finishLoading();
    }, ms);
  }

  function updateServerSelect() {
    if (!els.serverSelect) return;
    var id = state.mediaId || parseMediaId(els.idInput ? els.idInput.value : '');
    ensureServerForId(id);
    var list = getServersForId(id);
    if (!list.length) list = SERVERS.slice();
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
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

    var token = ++loadToken;
    clearLoadTimers();
    if (embedSwapTimer) {
      clearTimeout(embedSwapTimer);
      embedSwapTimer = null;
    }

    var currentSrc = els.iframe.getAttribute('src') || els.iframe.src || '';
    var sameUrl = currentSrc === url;

    if (sameUrl) {
      finishLoading();
      return;
    }

    setLoading(true);
    scheduleLoadingHide(token, 2800);

    function onFrameReady() {
      if (token !== loadToken) return;
      scheduleLoadingHide(token, 350);
    }

    function mountUrl() {
      if (token !== loadToken || !els.iframe) return;
      silenceOtherEmbeds(els.iframe);
      els.iframe.onload = onFrameReady;
      els.iframe.onerror = onFrameReady;
      els.iframe.src = url;
      preconnectHosts(url);
    }

    /* Tear down previous embed before starting the next — avoids overlapping audio tracks */
    if (isActiveSrc(currentSrc)) {
      try {
        els.iframe.src = 'about:blank';
      } catch (_) {}
      embedSwapTimer = setTimeout(function () {
        embedSwapTimer = null;
        mountUrl();
      }, 120);
    } else {
      mountUrl();
    }
  }

  function openPlayer() {
    pauseLiveSitePlayers();
    state.open = true;
    state.savedPageTitle = document.title;
    state.savedModalTitle = '';
    state.displayTitle = defaultLabel();
    document.body.classList.add('wbid-active');
    els.overlay.hidden = false;
    els.overlay.setAttribute('aria-hidden', 'false');
    applyPageTitle();
    updateOverlayTitle();
    updateServerSelect();
    updateNextEpisodeUI();
    loadEmbed();
    fetchMediaTitle();
  }

  function closePlayer() {
    state.open = false;
    metaReq++;
    loadToken++;
    if (embedSwapTimer) {
      clearTimeout(embedSwapTimer);
      embedSwapTimer = null;
    }
    finishLoading();
    document.body.classList.remove('wbid-active');
    els.overlay.hidden = true;
    els.overlay.setAttribute('aria-hidden', 'true');
    if (els.nextEp) {
      els.nextEp.hidden = true;
      els.nextEp.classList.remove('is-visible');
    }
    resumeLiveSitePlayers();
    restorePageTitle();
  }

  function openModal() {
    if (!state.open && !state.savedModalTitle) {
      state.savedModalTitle = document.title;
    }
    if (global.PageTitle && global.PageTitle.wbid) {
      global.PageTitle.wbid();
    }
    els.modal.hidden = false;
    els.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wbid-modal-open');
    if (els.idInput) els.idInput.focus();
  }

  function closeModal() {
    els.modal.hidden = true;
    els.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wbid-modal-open');
    if (!state.open && state.savedModalTitle) {
      document.title = state.savedModalTitle;
      state.savedModalTitle = '';
    }
  }

  function readForm() {
    var id = parseMediaId(els.idInput ? els.idInput.value : '');
    if (!id) {
      if (typeof global.showToast === 'function') {
        global.showToast('Enter a valid IMDb or TMDB ID');
      }
      return false;
    }
    var isTv = els.tvCheck ? els.tvCheck.checked : false;
    if (!ensureServerForId(id)) {
      if (typeof global.showToast === 'function') {
        global.showToast('No server available for this ID type');
      }
      return false;
    }
    if (isTv) {
      var s = els.seasonInput ? parseInt(els.seasonInput.value, 10) : 0;
      var e = els.episodeInput ? parseInt(els.episodeInput.value, 10) : 0;
      if (!s || !e) {
        if (typeof global.showToast === 'function') {
          global.showToast('Season and episode are required for TV shows');
        }
        return false;
      }
    }
    state.mediaId = id;
    state.isTv = isTv;
    state.season = els.seasonInput ? parseInt(els.seasonInput.value, 10) || 1 : 1;
    state.episode = els.episodeInput ? parseInt(els.episodeInput.value, 10) || 1 : 1;
    state.displayTitle = defaultLabel();
    return true;
  }

  function onWatch() {
    if (!readForm()) return;
    preconnectCurrentEmbed();
    closeModal();
    openPlayer();
  }

  function goNextEpisode() {
    if (!state.isTv || !state.open) return;
    state.episode += 1;
    if (els.episodeInput) els.episodeInput.value = String(state.episode);
    applyPageTitle();
    updateOverlayTitle();
    updateNextEpisodeUI();
    loadEmbed();
    if (typeof global.showToast === 'function') {
      global.showToast('Loading S' + state.season + ' E' + state.episode + '…', 1400);
    }
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

    if (els.nextEp) {
      els.nextEp.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        goNextEpisode();
      });
    }

    if (els.tvCheck) {
      els.tvCheck.addEventListener('change', function () {
        var on = els.tvCheck.checked;
        if (els.tvFields) els.tvFields.classList.toggle('is-visible', on);
        schedulePrewarm();
      });
    }

    if (els.idInput) {
      els.idInput.addEventListener('input', function () {
        schedulePrewarm();
        if (state.open) updateServerSelect();
      });
      els.idInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onWatch();
        }
      });
    }
    if (els.seasonInput) els.seasonInput.addEventListener('input', schedulePrewarm);
    if (els.episodeInput) els.episodeInput.addEventListener('input', schedulePrewarm);

    els.backBtn.addEventListener('click', closePlayer);

    els.serverSelect.addEventListener('change', function () {
      state.serverId = els.serverSelect.value;
      if (state.mediaId && !ensureServerForId(state.mediaId)) {
        ensureServerForId(state.mediaId);
        updateServerSelect();
        return;
      }
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

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          e.preventDefault();
          var exit =
            document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.msExitFullscreen;
          if (exit) exit.call(document);
          return;
        }
        if (state.open) {
          e.preventDefault();
          closePlayer();
        } else if (!els.modal.hidden) {
          e.preventDefault();
          closeModal();
        }
      }
      if (state.open && state.isTv && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        goNextEpisode();
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
    els.nextEp = document.getElementById('wbid-next-ep');
    els.nextEpLabel = document.getElementById('wbid-next-ep-label');

    if (els.iframe) {
      els.iframe.setAttribute('loading', 'eager');
      els.iframe.setAttribute('importance', 'high');
    }

    bindEvents();

    var run = function () {
      for (var i = 0; i < SERVERS.length && i < 3; i++) {
        preconnectHosts(SERVERS[i].movie('299534'));
      }
    };
    if (global.requestIdleCallback) global.requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 800);
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
    nextEpisode: goNextEpisode,
  };
})(window);
