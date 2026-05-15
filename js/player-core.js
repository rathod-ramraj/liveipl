/**
 * Core HLS + native-Safari playback. UI callbacks only — no DOM assumptions beyond container + overlay.
 */
(function (global) {
  'use strict';

  var hlsInstance = null;
  var videoEl = null;
  var bufferDebounce = null;
  var metrics = {
    streamStart: 0,
    manifestMs: null,
    firstFrameMs: null,
    levelSwitches: 0,
    bufferEvents: 0,
  };

  function getHls() {
    return global.Hls;
  }

  function destroy(elRatio) {
    if (bufferDebounce) {
      clearTimeout(bufferDebounce);
      bufferDebounce = null;
    }
    if (hlsInstance) {
      try { hlsInstance.destroy(); } catch (_) {}
      hlsInstance = null;
    }
    if (elRatio) {
      ['iframe', 'video'].forEach(function (tag) {
        var old = elRatio.querySelector(tag);
        if (old) elRatio.removeChild(old);
      });
    }
    videoEl = null;
  }

  function debouncedBuffer(showFn, hideFn, show) {
    if (bufferDebounce) {
      clearTimeout(bufferDebounce);
      bufferDebounce = null;
    }
    if (show) {
      bufferDebounce = setTimeout(function () {
        bufferDebounce = null;
        metrics.bufferEvents++;
        showFn();
      }, 220);
    } else {
      hideFn();
    }
  }

  function attachHls(src, ch, ctx) {
    var HlsLib = getHls();
    if (!HlsLib || !HlsLib.isSupported()) return false;

    var net = (global.NetworkProfile && global.NetworkProfile.get()) || null;
    var cfgBuilder = global.LiveStreamConfig && global.LiveStreamConfig.buildHlsConfig;
    var baseCfg =
      typeof cfgBuilder === 'function'
        ? cfgBuilder(net, { lowLatency: ctx.lowLatency !== false })
        : {};

    var hls = new HlsLib(baseCfg);
    hlsInstance = hls;

    var video = document.createElement('video');
    video.className = 'live-video';
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.controls = false;
    videoEl = video;

    metrics.streamStart = performance.now();
    metrics.manifestMs = null;
    metrics.firstFrameMs = null;

    var netFailStreak = 0;

    hls.on(HlsLib.Events.MANIFEST_PARSED, function () {
      metrics.manifestMs = Math.round(performance.now() - metrics.streamStart);
      hls.startLoad();
      var netCap = global.NetworkProfile && global.NetworkProfile.get();
      if (netCap && netCap.maxBitrate > 0 && hls.levels && hls.levels.length) {
        var capIdx = 0;
        for (var li = 0; li < hls.levels.length; li++) {
          if (hls.levels[li].bitrate <= netCap.maxBitrate) capIdx = li;
        }
        hls.autoLevelCapping = capIdx;
      }
    });

    hls.on(HlsLib.Events.FRAG_BUFFERED, function () {
      if (metrics.firstFrameMs == null && video.readyState >= 2) {
        metrics.firstFrameMs = Math.round(performance.now() - metrics.streamStart);
      }
      netFailStreak = 0;
      ctx.onFragBuffered && ctx.onFragBuffered();
    });

    hls.on(HlsLib.Events.LEVEL_SWITCHED, function () {
      metrics.levelSwitches++;
      ctx.onLevelSwitch && ctx.onLevelSwitch(hls);
    });

    hls.on(HlsLib.Events.ERROR, function (_, data) {
      if (!data.fatal) return;

      if (data.type === HlsLib.ErrorTypes.NETWORK_ERROR) {
        netFailStreak++;
        // After repeated failures, cap quality lower to ride out congestion
        if (netFailStreak >= 3 && hls.levels && hls.levels.length) {
          var cap = (hls.autoLevelCapping >= 0 ? hls.autoLevelCapping : hls.levels.length - 1);
          hls.autoLevelCapping = Math.max(0, cap - 1);
          netFailStreak = 0;
        }
        ctx.showBuffer && ctx.showBuffer();
        try {
          hls.startLoad();
        } catch (_) {}
      } else if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR) {
        try {
          hls.recoverMediaError();
        } catch (_) {
          ctx.onFatal && ctx.onFatal(ch);
        }
      } else {
        ctx.onFatal && ctx.onFatal(ch);
      }
    });

    video.addEventListener(
      'waiting',
      function () {
        debouncedBuffer(ctx.showBuffer, ctx.hideBuffer, true);
      },
      { passive: true }
    );
    video.addEventListener(
      'playing',
      function () {
        debouncedBuffer(ctx.showBuffer, ctx.hideBuffer, false);
      },
      { passive: true }
    );
    video.addEventListener(
      'canplay',
      function () {
        debouncedBuffer(ctx.showBuffer, ctx.hideBuffer, false);
      },
      { passive: true }
    );

    hls.loadSource(src);
    hls.attachMedia(video);
    ctx.container.insertBefore(video, ctx.bufOverlay);

    video.play().catch(function () {});

    return true;
  }

  function attachNativeMse(src, ch, ctx) {
    var video = document.createElement('video');
    video.className = 'live-video';
    video.src = src;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.controls = false;
    videoEl = video;

    video.addEventListener('waiting', ctx.showBuffer, { passive: true });
    video.addEventListener('playing', ctx.hideBuffer, { passive: true });
    video.addEventListener('canplay', ctx.hideBuffer, { passive: true });
    video.addEventListener('loadeddata', function () {
      ctx.hideBuffer();
      ctx.onFragBuffered && ctx.onFragBuffered();
    }, { passive: true });
    video.addEventListener(
      'error',
      function () {
        ctx.onFatal && ctx.onFatal(ch);
      },
      { once: true }
    );

    ctx.container.insertBefore(video, ctx.bufOverlay);
    video.play().catch(function () {});

    return true;
  }

  function attachIframe(src, ch, ctx) {
    var iframe = document.createElement('iframe');
    iframe.className = 'live-iframe';
    iframe.loading = 'eager';
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; accelerometer; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.src = src;
    iframe.addEventListener(
      'load',
      function () {
        ctx.hideBuffer();
        ctx.onFragBuffered && ctx.onFragBuffered();
      },
      { once: true }
    );
    iframe.addEventListener(
      'error',
      function () {
        ctx.onFatal && ctx.onFatal(ch);
      },
      { once: true }
    );
    ctx.container.insertBefore(iframe, ctx.bufOverlay);
    return true;
  }

  /**
   * @param ch — channel object (iframeSrc, id, …)
   * @param ctx {{ container, bufOverlay, lowLatency, showBuffer, hideBuffer, onFatal, onFragBuffered, onLevelSwitch }}
   */
  function load(ch, ctx) {
    destroy(ctx.container);
    ctx.showBuffer();

    var src = ch.iframeSrc || '';
    var isM3u8 = /\.m3u8(\?|$)/i.test(src);

    if (global.PlayerPrefetch && PlayerPrefetch.scheduleWarm) {
      PlayerPrefetch.scheduleWarm(src);
    }

    if (isM3u8 && getHls() && getHls().isSupported()) {
      return attachHls(src, ch, ctx) ? 'hls' : null;
    }
    if (isM3u8 && document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) {
      return attachNativeMse(src, ch, ctx) ? 'native' : null;
    }
    return attachIframe(src, ch, ctx) ? 'iframe' : null;
  }

  function getMetrics() {
    return metrics;
  }

  function getVideo() {
    return videoEl;
  }

  global.LivePlayerCore = {
    load: load,
    destroy: destroy,
    getMetrics: getMetrics,
    getVideo: getVideo,
    getHlsInstance: function () {
      return hlsInstance;
    },
  };
})(window);
