/**
 * Player keyboard UX — isolated from core for thinner main bundle / readability.
 */
(function (global) {
  'use strict';

  function isActiveSrc(src) {
    return src && src !== 'about:blank' && !/^about:/i.test(src);
  }

  function resolveFullscreenTarget(elRatio) {
    if (document.body.classList.contains('wbid-active')) {
      var wbWrap = document.getElementById('wbid-frame-wrap');
      var wbIframe = document.getElementById('wbid-iframe');
      if (wbIframe && isActiveSrc(wbIframe.getAttribute('src') || wbIframe.src)) {
        return wbIframe;
      }
      if (wbWrap) return wbWrap;
      return document.getElementById('wbid-overlay');
    }

    if (!elRatio) return null;

    var video = elRatio.querySelector('video');
    if (video) {
      var vsrc = video.currentSrc || video.getAttribute('src') || '';
      if (!vsrc || video.readyState > 0) return video;
    }

    var iframe = elRatio.querySelector('iframe');
    if (iframe && isActiveSrc(iframe.getAttribute('data-stream-src') || iframe.getAttribute('src') || iframe.src)) {
      return iframe;
    }

    return elRatio;
  }

  function requestFs(el) {
    if (!el) return Promise.reject(new Error('no target'));
    var req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.webkitEnterFullscreen ||
      el.msRequestFullscreen;
    if (!req) return Promise.reject(new Error('unsupported'));
    return Promise.resolve(req.call(el));
  }

  function exitFs() {
    var exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (exit) return Promise.resolve(exit.call(document));
    return Promise.resolve();
  }

  function toggleFullscreen(elRatio, showToast) {
    if (!document.fullscreenElement) {
      var target = resolveFullscreenTarget(elRatio);
      return requestFs(target)
        .then(function () {
          showToast && showToast('Fullscreen (F)');
          if (global.PerfController) global.PerfController.setStreaming(true);
        })
        .catch(function () {
          if (target && target !== elRatio) {
            return requestFs(elRatio).then(function () {
              showToast && showToast('Fullscreen (F)');
            });
          }
          showToast && showToast('Fullscreen not available');
        });
    }
    return exitFs().then(function () {
      showToast && showToast('Exit fullscreen');
    });
  }

  function install(opts) {
    var elRatio = opts.elRatio;
    var onReload = opts.onReload;
    var showToast = opts.showToast;

    global.addEventListener(
      'keydown',
      function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        var key = e.key || '';

        if (key === 'f' || key === 'F') {
          e.preventDefault();
          toggleFullscreen(elRatio, showToast);
          return;
        }

        if (key === 'Escape' && document.fullscreenElement) {
          e.preventDefault();
          exitFs();
          return;
        }

        if (document.body.classList.contains('wbid-active')) return;

        if (key === 'r' || key === 'R') {
          e.preventDefault();
          onReload && onReload();
          showToast && showToast('Reloading stream');
          return;
        }

        if (key === ' ' || key === 'k' || key === 'K') {
          e.preventDefault();
          var video = elRatio.querySelector('video');
          if (video) {
            if (video.paused) {
              video.play().catch(function () {});
              showToast && showToast('Play');
            } else {
              video.pause();
              showToast && showToast('Pause');
            }
          } else {
            var ifr = elRatio.querySelector('iframe');
            if (ifr && ifr.contentWindow) {
              try {
                ifr.contentWindow.postMessage({ action: 'toggle' }, '*');
              } catch (_) {}
            }
            showToast && showToast('Play / Pause');
          }
          return;
        }

        if (key === 'm' || key === 'M') {
          e.preventDefault();
          var vid2 = elRatio.querySelector('video');
          if (vid2) {
            vid2.muted = !vid2.muted;
            showToast && showToast(vid2.muted ? 'Muted' : 'Unmuted');
          }
          return;
        }

        if (key === 'ArrowUp') {
          e.preventDefault();
          var vid3 = elRatio.querySelector('video');
          if (vid3) {
            vid3.volume = Math.min(1, +(vid3.volume + 0.1).toFixed(1));
            showToast && showToast('Volume ' + Math.round(vid3.volume * 100) + '%');
          }
          return;
        }

        if (key === 'ArrowDown') {
          e.preventDefault();
          var vid4 = elRatio.querySelector('video');
          if (vid4) {
            vid4.volume = Math.max(0, +(vid4.volume - 0.1).toFixed(1));
            showToast && showToast('Volume ' + Math.round(vid4.volume * 100) + '%');
          }
          return;
        }

        if (key === 'ArrowRight') {
          e.preventDefault();
          var vid5 = elRatio.querySelector('video');
          if (vid5 && isFinite(vid5.duration)) {
            vid5.currentTime = Math.min(vid5.duration, vid5.currentTime + 10);
            showToast && showToast('+10s');
          } else {
            showToast && showToast('Live — no forward seek');
          }
          return;
        }

        if (key === 'ArrowLeft') {
          e.preventDefault();
          var vid6 = elRatio.querySelector('video');
          if (vid6 && isFinite(vid6.duration)) {
            vid6.currentTime = Math.max(0, vid6.currentTime - 10);
            showToast && showToast('-10s');
          } else {
            showToast && showToast('Live — DVR when available');
          }
          return;
        }

        if (key === 'l' || key === 'L') {
          e.preventDefault();
          if (opts.toggleLowLatency) opts.toggleLowLatency();
          return;
        }
      },
      { passive: false }
    );
  }

  global.PlayerKeyboard = {
    install: install,
    resolveFullscreenTarget: resolveFullscreenTarget,
    toggleFullscreen: toggleFullscreen,
  };
})(window);
