/**
 * Core HLS + native-Safari + optimized iframe playback.
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

  function isPlaybackBusy() {
    if (global.PerfController && global.PerfController.isActive && global.PerfController.isActive()) {
      return true;
    }
    var root = document.documentElement;
    return (
      root.classList.contains('perf-streaming') ||
      root.classList.contains('perf-iframe-active') ||
      (document.body && document.body.classList.contains('wbid-active'))
    );
  }

  function detachIframe(container) {
    if (global.IframePlayer && global.IframePlayer.detachFrom) {
      global.IframePlayer.detachFrom(container);
      return;
    }
    var old = container && container.querySelector('iframe.live-iframe');
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function stopVideoElement(v) {
    if (!v) return;
    try {
      v.pause();
      v.muted = true;
      v.removeAttribute('src');
      v.load();
    } catch (_) {}
  }

  function removeVideos(elRatio) {
    if (!elRatio) return;
    var videos = elRatio.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      stopVideoElement(v);
      if (v.parentNode === document.body) document.body.removeChild(v);
      else if (v.parentNode) v.parentNode.removeChild(v);
    }
  }

  function destroy(elRatio) {
    if (bufferDebounce) {
      clearTimeout(bufferDebounce);
      bufferDebounce = null;
    }
    if (hlsInstance) {
      try {
        hlsInstance.destroy();
      } catch (_) {}
      hlsInstance = null;
    }
    if (videoEl) {
      stopVideoElement(videoEl);
      videoEl = null;
    }
    if (global.PlayerPrefetch && global.PlayerPrefetch.stopAllWarmHls) {
      global.PlayerPrefetch.stopAllWarmHls();
    }
    if (global.IframePlayer && global.IframePlayer.suspendAll) {
      global.IframePlayer.suspendAll();
    }
    if (elRatio) {
      detachIframe(elRatio);
      removeVideos(elRatio);
    }
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

  function wireHlsPlayback(hls, video, src, ch, ctx) {
    var HlsLib = getHls();
    hlsInstance = hls;
    videoEl = video;

    if (global.PerfController && global.PerfController.setIframeActive) {
      global.PerfController.setIframeActive(false);
    }

    video.className = 'live-video';
    video.removeAttribute('style');
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.controls = ctx.showControls !== false;
    if (video.controls) {
      video.setAttribute('controls', '');
      video.setAttribute('controlsList', 'nodownload noremoteplayback');
    }
    if (global.VolumeBoost && global.VolumeBoost.attach) {
      global.VolumeBoost.attach(video);
    }

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
        if (netFailStreak >= 3 && hls.levels && hls.levels.length) {
          var cap = hls.autoLevelCapping >= 0 ? hls.autoLevelCapping : hls.levels.length - 1;
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

    if (!video.parentNode) {
      ctx.container.insertBefore(video, ctx.bufOverlay);
    } else if (video.parentNode !== ctx.container) {
      video.parentNode.removeChild(video);
      ctx.container.insertBefore(video, ctx.bufOverlay);
    }

    if (!hls.media) {
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (hls.levels && hls.levels.length) {
      try {
        hls.startLoad();
      } catch (_) {}
      if (video.readyState >= 2) {
        ctx.onFragBuffered && ctx.onFragBuffered();
      }
    }

    video.play().catch(function () {});

    return true;
  }

  function attachHls(src, ch, ctx) {
    var HlsLib = getHls();
    if (!HlsLib || !HlsLib.isSupported()) return false;

    var warm =
      global.PlayerPrefetch && typeof global.PlayerPrefetch.acquireWarmHls === 'function'
        ? global.PlayerPrefetch.acquireWarmHls(src)
        : null;

    if (warm && warm.hls && warm.video) {
      return wireHlsPlayback(warm.hls, warm.video, src, ch, ctx);
    }

    var net = (global.NetworkProfile && global.NetworkProfile.get()) || null;
    var cfgBuilder = global.LiveStreamConfig && global.LiveStreamConfig.buildHlsConfig;
    var baseCfg =
      typeof cfgBuilder === 'function'
        ? cfgBuilder(net, { lowLatency: ctx.lowLatency !== false })
        : {};

    var hls = new HlsLib(baseCfg);
    var video = document.createElement('video');

    return wireHlsPlayback(hls, video, src, ch, ctx);
  }

  function attachNativeMse(src, ch, ctx) {
    detachIframe(ctx.container);

    var video = document.createElement('video');
    video.className = 'live-video';
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.controls = ctx.showControls !== false;
    if (video.controls) {
      video.setAttribute('controls', '');
      video.setAttribute('controlsList', 'nodownload noremoteplayback');
    }
    if (global.VolumeBoost && global.VolumeBoost.attach) {
      global.VolumeBoost.attach(video);
    }
    videoEl = video;

    video.src = src;

    video.addEventListener('waiting', ctx.showBuffer, { passive: true });
    video.addEventListener('playing', ctx.hideBuffer, { passive: true });
    video.addEventListener('canplay', ctx.hideBuffer, { passive: true });
    video.addEventListener(
      'loadeddata',
      function () {
        ctx.hideBuffer();
        ctx.onFragBuffered && ctx.onFragBuffered();
      },
      { passive: true }
    );
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
    if (!global.IframePlayer) {
      var iframe = document.createElement('iframe');
      iframe.className = 'live-iframe';
      iframe.src = src;
      iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
      iframe.setAttribute('allowfullscreen', '');
      iframe.addEventListener(
        'load',
        function () {
          ctx.hideBuffer();
          ctx.onFragBuffered && ctx.onFragBuffered();
        },
        { once: true }
      );
      ctx.container.insertBefore(iframe, ctx.bufOverlay);
      return true;
    }

    ctx.channel = ch;
    global.IframePlayer.mount(src, ctx, false);
    return 'iframe';
  }

  /**
   * @param ch — channel object (iframeSrc, id, …)
   */
  function load(ch, ctx) {
    destroy(ctx.container);

    var src = ch.iframeSrc || '';
    var isM3u8 = /\.m3u8(\?|$)/i.test(src);

    if (ctx.showControls == null) {
      ctx.showControls = isM3u8 || ch.type === 'hls';
    }

    ctx.showBuffer();

    if (!isM3u8 && global.IframePlayer) {
      global.IframePlayer.preconnect(src);
    } else if (global.PlayerPrefetch && PlayerPrefetch.scheduleWarm && !isPlaybackBusy()) {
      PlayerPrefetch.scheduleWarm(src);
    }

    if (isM3u8 && getHls() && getHls().isSupported()) {
      ctx.showBuffer();
      return attachHls(src, ch, ctx) ? 'hls' : null;
    }
    if (isM3u8 && document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) {
      ctx.showBuffer();
      return attachNativeMse(src, ch, ctx) ? 'native' : null;
    }

    return attachIframe(src, ch, ctx);
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
