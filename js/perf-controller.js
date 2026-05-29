/**
 * Performance controller — pauses heavy work during playback without changing idle UI.
 * - ShapeGrid motion off while streaming / on mobile (static grid)
 * - CSS infinite animations paused while streaming
 * - Intersection Observer pauses off-screen section animations
 * - Lighter compositing (backdrop-filter) during active playback
 */
(function (global) {
  'use strict';

  var sg = null;
  var streaming = false;
  var iframeActive = false;
  var playerVisible = true;
  var io = null;
  var videoWatchTimer = null;
  var root = document.documentElement;

  var mqMobile = global.matchMedia('(max-width: 768px)');
  var mqReduceMotion = global.matchMedia('(prefers-reduced-motion: reduce)');
  var mqLowPower = global.matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce)');

  function isMobile() {
    return mqMobile.matches;
  }

  function isLowPowerDevice() {
    if (mqReduceMotion.matches) return true;
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    var saveData = navigator.connection && navigator.connection.saveData;
    return isMobile() || cores <= 4 || mem <= 4 || !!saveData;
  }

  function applyRootClasses() {
    root.classList.toggle('perf-mobile', isMobile());
    root.classList.toggle('perf-low-power', isLowPowerDevice());
    root.classList.toggle('perf-streaming', streaming);
    root.classList.toggle('perf-iframe-active', iframeActive);
    root.classList.toggle('perf-player-visible', playerVisible);
    var pauseFx =
      streaming ||
      iframeActive ||
      isMobile() ||
      mqReduceMotion.matches ||
      !playerVisible;
    root.classList.toggle('perf-pause-animations', pauseFx);
  }

  function syncShapeGrid() {
    if (!sg) return;
    if (isMobile()) {
      sg.freeze && sg.freeze();
      return;
    }
    if ((streaming || iframeActive) && playerVisible) {
      sg.freeze && sg.freeze();
    } else if (document.body.classList.contains('wbid-active')) {
      sg.freeze && sg.freeze();
    } else if (isLowPowerDevice() && sg.freeze) {
      sg.freeze();
    } else if (sg.unfreeze) {
      sg.unfreeze();
    } else if (sg.resume) {
      sg.resume();
    }
  }

  function setShapeGrid(handle) {
    sg = handle;
    if (isMobile() && sg && sg.freeze) {
      sg.freeze();
    } else {
      syncShapeGrid();
    }
    applyRootClasses();
  }

  function setStreaming(active) {
    streaming = !!active;
    applyRootClasses();
    syncShapeGrid();
  }

  function setIframeActive(active) {
    iframeActive = !!active;
    if (iframeActive) streaming = true;
    applyRootClasses();
    syncShapeGrid();
  }

  function setPlayerVisible(visible) {
    playerVisible = !!visible;
    applyRootClasses();
    syncShapeGrid();
  }

  function watchVideoIn(container) {
    if (videoWatchTimer) {
      clearInterval(videoWatchTimer);
      videoWatchTimer = null;
    }
    if (!container) return;

    function bindVideo(video) {
      if (!video || video._perfBound) return;
      video._perfBound = true;
      video.addEventListener(
        'playing',
        function () {
          setStreaming(true);
        },
        { passive: true }
      );
      video.addEventListener(
        'pause',
        function () {
          if (!video.ended) setStreaming(false);
        },
        { passive: true }
      );
      video.addEventListener(
        'ended',
        function () {
          setStreaming(false);
        },
        { passive: true }
      );
      if (!video.paused && !video.ended) setStreaming(true);
    }

    bindVideo(container.querySelector('video'));

    videoWatchTimer = setInterval(function () {
      var v = container.querySelector('video');
      if (v) {
        bindVideo(v);
        clearInterval(videoWatchTimer);
        videoWatchTimer = null;
      }
    }, 400);
  }

  /** Iframe / HLS load — treat as active playback */
  function onStreamStarted(container) {
    setStreaming(true);
    watchVideoIn(container);
  }

  function onStreamStopped() {
    setStreaming(false);
    if (videoWatchTimer) {
      clearInterval(videoWatchTimer);
      videoWatchTimer = null;
    }
  }

  function observeSections() {
    if (!('IntersectionObserver' in global)) return;
    var nodes = document.querySelectorAll('.section, .alt-section, .glass-wrap, .feat-card, footer');
    if (!nodes.length) return;

    io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var el = entries[i].target;
          el.classList.toggle('perf-offscreen', !entries[i].isIntersecting);
        }
      },
      { root: null, rootMargin: '80px 0px', threshold: 0.08 }
    );

    for (var j = 0; j < nodes.length; j++) {
      io.observe(nodes[j]);
    }
  }

  function observePlayer(elPlayer) {
    if (!elPlayer || !('IntersectionObserver' in global)) return;

    var playerIo = new IntersectionObserver(
      function (entries) {
        setPlayerVisible(entries[0] && entries[0].isIntersecting);
      },
      { threshold: 0.12 }
    );
    playerIo.observe(elPlayer);
  }

  function init(opts) {
    opts = opts || {};
    applyRootClasses();
    observeSections();
    if (opts.playerEl) observePlayer(opts.playerEl);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (sg && sg.freeze) sg.freeze();
      } else {
        syncShapeGrid();
      }
    });

    if (mqMobile.addEventListener) {
      mqMobile.addEventListener('change', function () {
        applyRootClasses();
        syncShapeGrid();
      });
    }
    if (mqReduceMotion.addEventListener) {
      mqReduceMotion.addEventListener('change', applyRootClasses);
    }
  }

  function isPlaybackActive() {
    return streaming || iframeActive || document.body.classList.contains('wbid-active');
  }

  global.PerfController = {
    init: init,
    setShapeGrid: setShapeGrid,
    setStreaming: setStreaming,
    setIframeActive: setIframeActive,
    onStreamStarted: onStreamStarted,
    onStreamStopped: onStreamStopped,
    isMobile: isMobile,
    isActive: isPlaybackActive,
  };
})(window);
