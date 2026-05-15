/**
 * Player keyboard UX — isolated from core for thinner main bundle / readability.
 */
(function (global) {
  'use strict';

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
          if (!document.fullscreenElement) {
            elRatio.requestFullscreen && elRatio.requestFullscreen();
            showToast && showToast('Fullscreen');
          } else {
            document.exitFullscreen && document.exitFullscreen();
            showToast && showToast('Exit fullscreen');
          }
          return;
        }

        if (key === 'Escape' && document.fullscreenElement) {
          document.exitFullscreen && document.exitFullscreen();
          return;
        }

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

  global.PlayerKeyboard = { install: install };
})(window);
