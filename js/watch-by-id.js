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
  var VIDSRC_WTF_COLOR = 'ff4d6d';
  var VIDSRC_WTF_PROGRESS_KEY = 'vidsrcwtf-Progress';

  function vidsrcWtfMovie(api, id) {
    return (
      'https://vidsrc.wtf/' +
      api +
      '/movie/' +
      encodeURIComponent(id) +
      '?color=' +
      VIDSRC_WTF_COLOR
    );
  }

  function vidsrcWtfTv(api, id, season, episode) {
    return (
      'https://vidsrc.wtf/' +
      api +
      '/tv/' +
      encodeURIComponent(id) +
      '/' +
      encodeURIComponent(season) +
      '/' +
      encodeURIComponent(episode) +
      '?color=' +
      VIDSRC_WTF_COLOR
    );
  }

  var SERVERS = [
    {
      id: 'videasy',
      name: 'Videasy',
      badge: 'Main 1 · TMDB',
      imdb: false,
      tmdb: true,
      movie: function (id) {
        return 'https://player.videasy.to/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://player.videasy.to/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true'
        );
      },
    },
    {
      id: 'vidsrc_wtf_1',
      name: 'VidSrc.wtf 1',
      badge: 'Main 2 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://www.vidsrc.wtf/api/1/movie/?color=' + VIDSRC_WTF_COLOR + '&id=' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return 'https://www.vidsrc.wtf/api/1/tv/?color=' + VIDSRC_WTF_COLOR + '&id=' + encodeURIComponent(id) + '&s=' + encodeURIComponent(season) + '&e=' + encodeURIComponent(episode);
      },
    },
    {
      id: 'vidup',
      name: 'Vidup',
      badge: 'Main 3 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return (
          'https://vidup.to/movie/' +
          encodeURIComponent(id) +
          '?autoPlay=true&title=true&poster=true&theme=' +
          VIDSRC_WTF_COLOR
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
          '?autoPlay=true&title=true&poster=true&theme=' +
          VIDSRC_WTF_COLOR +
          '&nextButton=false&autoNext=false'
        );
      },
    },
    {
      id: 'vidlink',
      name: 'Vidlink Pro',
      badge: 'Main 4 · TMDB',
      imdb: false,
      tmdb: true,
      movie: function (id) {
        return (
          'https://vidlink.pro/movie/' +
          encodeURIComponent(id) +
          '?primaryColor=' +
          VIDSRC_WTF_COLOR +
          '&secondaryColor=a2a2a2&iconColor=eefdec&icons=default&player=default&title=true&poster=true&autoplay=true'
        );
      },
      tv: function (id, season, episode) {
        return (
          'https://vidlink.pro/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?primaryColor=' +
          VIDSRC_WTF_COLOR +
          '&secondaryColor=a2a2a2&iconColor=eefdec&icons=default&player=default&title=true&poster=true&autoplay=true&nextbutton=false'
        );
      },
    },
    {
      id: 'vidfast',
      name: 'Vidfast',
      badge: 'Main 5 · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://vidfast.pro/movie/' + encodeURIComponent(id) + '?autoPlay=true';
      },
      tv: function (id, season, episode) {
        return (
          'https://vidfast.pro/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?autoPlay=true&nextButton=true&autoNext=true'
        );
      },
    },
    {
      id: '111movies',
      name: '111movies',
      badge: 'Main 6 · IMDb · TMDB',
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
      id: 'vidcore',
      name: 'Vidcore',
      badge: 'Main 7 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://vidcore.net/movie/' + encodeURIComponent(id) + '?autoPlay=true&theme=' + VIDSRC_WTF_COLOR;
      },
      tv: function (id, season, episode) {
        return (
          'https://vidcore.net/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?autoPlay=true&nextButton=true&autoNext=true&theme=' +
          VIDSRC_WTF_COLOR
        );
      },
    },
    {
      id: 'vidnest',
      name: 'Vidnest',
      badge: 'Main 8 · TMDB',
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
      id: 'vidsrc_wtf_2',
      name: 'VidSrc.wtf 2',
      badge: 'Multi Lang · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://www.vidsrc.wtf/api/2/movie/?color=' + VIDSRC_WTF_COLOR + '&id=' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return 'https://www.vidsrc.wtf/api/2/tv/?color=' + VIDSRC_WTF_COLOR + '&id=' + encodeURIComponent(id) + '&s=' + encodeURIComponent(season) + '&e=' + encodeURIComponent(episode);
      },
    },
    {
      id: 'screenscape',
      name: 'Screenscape',
      badge: 'Multi Lang 2 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://flix.screenscape.me/embed?type=movie&lan=eng&tmdb=' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://flix.screenscape.me/embed?type=tv&lan=eng&tmdb=' +
          encodeURIComponent(id) +
          '&s=' +
          encodeURIComponent(season) +
          '&e=' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'nxsha',
      name: 'Nxsha',
      badge: 'Multi Lang 3 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://nxsha.space/embed/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://nxsha.space/embed/tv/' +
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
      badge: 'Multi Lang 4 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://peachify.top/embed/movie/' + encodeURIComponent(id) + '?accent=' + VIDSRC_WTF_COLOR;
      },
      tv: function (id, season, episode) {
        return (
          'https://peachify.top/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?accent=' +
          VIDSRC_WTF_COLOR
        );
      },
    },
    {
      id: 'vidout',
      name: 'WatchOut',
      badge: 'Multi Lang 5 · TMDB',
      imdb: false,
      tmdb: true,
      movie: function (id) {
        return 'https://watchout-player.netlify.app/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://watchout-player.netlify.app/tv/' +
          encodeURIComponent(id) +
          '/S' +
          encodeURIComponent(season) +
          '/E' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'iqsmartgames',
      name: 'IQSmart Stream',
      badge: 'Download · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://streams.iqsmartgames.com/embed/movie/' + encodeURIComponent(id) + '?key=e11a7debaaa4f5d25b671706ffe4d2acb56efbd4';
      },
      tv: function (id, season, episode) {
        return (
          'https://streams.iqsmartgames.com/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?key=e11a7debaaa4f5d25b671706ffe4d2acb56efbd4'
        );
      },
    },
    {
      id: 'vidstorm',
      name: 'Vidstorm',
      badge: 'Download 2 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://vidstorm.ru/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://vidstorm.ru/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: '2embed',
      name: '2Embed',
      badge: 'Download 3 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://www.2embed.cc/embed/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return 'https://www.2embed.cc/embedtv/' + encodeURIComponent(id) + '&s=' + encodeURIComponent(season) + '&e=' + encodeURIComponent(episode);
      },
    },
    {
      id: 'vidsrc_wtf_4',
      name: 'VidSrc.wtf 4',
      badge: 'Premium · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://www.vidsrc.wtf/api/4/movie/?id=' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return 'https://www.vidsrc.wtf/api/4/tv/?id=' + encodeURIComponent(id) + '&s=' + encodeURIComponent(season) + '&e=' + encodeURIComponent(episode);
      },
    },
    {
      id: 'vidsrc_wtf_3',
      name: 'VidSrc.wtf 3',
      badge: 'Premium 2 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return vidsrcWtfMovie(3, id);
      },
      tv: function (id, season, episode) {
        return vidsrcWtfTv(3, id, season, episode);
      },
    },
    {
      id: 'primesrc',
      name: 'PrimeSrc',
      badge: 'Premium 3 · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://primesrc.me/embed/movie?tmdb=' + encodeURIComponent(id) + '&fallback=true';
      },
      tv: function (id, season, episode) {
        return (
          'https://primesrc.me/embed/tv?tmdb=' +
          encodeURIComponent(id) +
          '&season=' +
          encodeURIComponent(season) +
          '&episode=' +
          encodeURIComponent(episode) +
          '&fallback=true'
        );
      },
    },
    {
      id: 'xplay',
      name: 'XPlay',
      badge: 'XPass · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://play.xpass.top/e/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://play.xpass.top/e/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'nextgen',
      name: 'NextGen Cloud',
      badge: 'NextGen · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://nextgencloudfabric.com/embed/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://nextgencloudfabric.com/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode)
        );
      },
    },
    {
      id: 'nontongo',
      name: 'Nontongo',
      badge: 'Nontongo · IMDb · TMDB',
      imdb: true,
      tmdb: true,
      movie: function (id) {
        return 'https://www.nontongo.win/embed/movie/' + encodeURIComponent(id);
      },
      tv: function (id, season, episode) {
        return (
          'https://www.nontongo.win/embed/tv/' +
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
      badge: 'VidKing · TMDB',
      imdb: false,
      tmdb: true,
      movie: function (id) {
        return 'https://www.vidking.net/embed/movie/' + encodeURIComponent(id) + '?autoPlay=true';
      },
      tv: function (id, season, episode) {
        return (
          'https://www.vidking.net/embed/tv/' +
          encodeURIComponent(id) +
          '/' +
          encodeURIComponent(season) +
          '/' +
          encodeURIComponent(episode) +
          '?autoPlay=true'
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
  var embedFailTimer = null;
  var failoverTried = null;

  function resetFailover() {
    failoverTried = new Set();
    if (embedFailTimer) {
      clearTimeout(embedFailTimer);
      embedFailTimer = null;
    }
  }

  function clearEmbedFailTimer() {
    if (embedFailTimer) {
      clearTimeout(embedFailTimer);
      embedFailTimer = null;
    }
  }

  function isHttpFailure(status) {
    return status === 404 || status === 403 || status === 410 || status >= 500;
  }

  function probeEmbedUrl(url) {
    return fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' })
      .then(function (res) {
        return { ok: res.ok, status: res.status };
      })
      .catch(function () {
        return { ok: null, status: 0 };
      });
  }

  function tryFailover(token) {
    if (token !== loadToken || !state.open || !state.mediaId) return false;
    if (!failoverTried) resetFailover();
    failoverTried.add(state.serverId);
    var list = getServersForId(state.mediaId);
    var next = null;
    for (var i = 0; i < list.length; i++) {
      if (!failoverTried.has(list[i].id)) {
        next = list[i];
        break;
      }
    }
    if (!next) {
      finishLoading();
      if (typeof global.showToast === 'function') {
        global.showToast('No working server found — try another ID');
      }
      return false;
    }
    state.serverId = next.id;
    updateServerSelect();
    if (typeof global.showToast === 'function') {
      global.showToast('Switching to ' + next.name + '…', 2200);
    }
    loadEmbed();
    return true;
  }

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

  function syncPageTitle() {
    if (global.SITE_TITLE) {
      document.title = global.SITE_TITLE;
    }
  }

  function restorePageTitle() {
    if (global.SITE_TITLE) {
      document.title = global.SITE_TITLE;
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

  function mountEmbedUrl(url, token) {
    if (token !== loadToken || !els.iframe) return;

    setLoading(true);
    scheduleLoadingHide(token, 2800);

    function onFrameReady() {
      if (token !== loadToken) return;
      scheduleLoadingHide(token, 350);
      clearEmbedFailTimer();
      embedFailTimer = setTimeout(function () {
        if (token !== loadToken || !state.open) return;
        probeEmbedUrl(url).then(function (res) {
          if (token !== loadToken) return;
          if (res.ok === false && isHttpFailure(res.status)) tryFailover(token);
        });
      }, 1200);
    }

    function onFrameError() {
      if (token !== loadToken) return;
      tryFailover(token);
    }

    silenceOtherEmbeds(els.iframe);
    els.iframe.onload = onFrameReady;
    els.iframe.onerror = onFrameError;
    els.iframe.src = url;
    preconnectHosts(url);
  }

  function loadEmbed() {
    var url = buildEmbedUrl();
    if (!url || !els.iframe) return;

    var token = ++loadToken;
    clearLoadTimers();
    clearEmbedFailTimer();
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

    function startMount() {
      if (isActiveSrc(currentSrc)) {
        try {
          els.iframe.src = 'about:blank';
        } catch (_) {}
        embedSwapTimer = setTimeout(function () {
          embedSwapTimer = null;
          mountEmbedUrl(url, token);
        }, 120);
      } else {
        mountEmbedUrl(url, token);
      }
    }

    probeEmbedUrl(url).then(function (res) {
      if (token !== loadToken) return;
      if (res.ok === false && isHttpFailure(res.status)) {
        if (tryFailover(token)) return;
      }
      startMount();
    });
  }

  function openPlayer() {
    pauseLiveSitePlayers();
    resetFailover();
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
    resetFailover();
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
    resetFailover();
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
      resetFailover();
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

  function installVidsrcWtfProgress() {
    window.addEventListener('message', function (event) {
      var origin = event.origin;
      if (origin !== 'https://www.vidsrc.wtf' && origin !== 'https://vidsrc.wtf') return;
      var payload = event.data;
      if (payload && payload.type === 'MEDIA_DATA' && payload.data) {
        clearEmbedFailTimer();
        try {
          localStorage.setItem(VIDSRC_WTF_PROGRESS_KEY, JSON.stringify(payload.data));
        } catch (_) {}
      }
    });
  }

  function init() {
    installVidsrcWtfProgress();
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
