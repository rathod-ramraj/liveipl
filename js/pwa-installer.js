/**
 * PlayUp PWA Installation Handler
 * Manages beforeinstallprompt, appinstalled, and standalone detection.
 */
(function () {
  'use strict';

  var deferredPrompt = null;
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) return;

  function updateButtons(show) {
    var btns = document.querySelectorAll('.pwa-install-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].style.display = show ? 'inline-flex' : 'none';
    }
  }

  function handleInstallClick(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        if (choice && choice.outcome === 'accepted') {
          updateButtons(false);
        }
        deferredPrompt = null;
      });
    } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      alert('To install PlayUp on iOS:\n\n1. Tap the Share button in Safari.\n2. Scroll down and tap "Add to Home Screen".');
    }
  }

  function setupButton(btn) {
    if (!btn || btn._pwaBound) return;
    btn._pwaBound = true;
    btn.addEventListener('click', handleInstallClick);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    updateButtons(true);
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    updateButtons(false);
  });

  function init() {
    var btns = document.querySelectorAll('.pwa-install-btn');
    for (var i = 0; i < btns.length; i++) {
      setupButton(btns[i]);
    }
    // On iOS Safari, display the button so users learn how to Add to Home Screen
    if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone) {
      updateButtons(true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
