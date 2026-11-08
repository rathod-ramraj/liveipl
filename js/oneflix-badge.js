/**
 * OneFlix Player Watermark Component
 * Web Component: <oneflix-badge></oneflix-badge>
 * Usage: <oneflix-badge></oneflix-badge> or included via <script src=".../js/oneflix-badge.js"></script>
 * Displays the OneFlix red "1" logo with "ONEFLIX" brand name at the left corner of players,
 * linking to https://oneflixx.pages.dev/
 */
(function () {
  'use strict';

  var TARGET_URL = 'https://oneflixx.pages.dev/';

  function isEmbeddedInPlayUp() {
    try {
      return window.self !== window.top && window.parent.location.hostname === window.location.hostname;
    } catch (_) {
      return false;
    }
  }

  function isDocFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }

  function updateBadgeVisibility(badge) {
    if (!badge) return;
    if (isEmbeddedInPlayUp()) {
      if (isDocFullscreen()) {
        badge.style.removeProperty('display');
      } else {
        badge.style.setProperty('display', 'none', 'important');
      }
    } else {
      badge.style.removeProperty('display');
    }
  }

  function getLogoSrc() {
    var isSub = window.location.pathname.indexOf('/cricket/') !== -1;
    return isSub ? '../public/oneflix-icon.png' : '/public/oneflix-icon.png';
  }

  var CSS_TEXT = [
    'oneflix-badge {',
    '  display: block !important;',
    '  position: absolute !important;',
    '  top: 0 !important;',
    '  left: 0 !important;',
    '  pointer-events: none !important;',
    '  z-index: 99999 !important;',
    '}',
    '.oneflix-player-badge {',
    '  position: absolute !important;',
    '  top: 14px !important;',
    '  left: 14px !important;',
    '  z-index: 99999 !important;',
    '  display: inline-flex !important;',
    '  align-items: center;',
    '  gap: 7px;',
    '  padding: 6px 12px 6px 8px;',
    '  background: rgba(14, 12, 22, 0.76);',
    '  backdrop-filter: blur(12px);',
    '  -webkit-backdrop-filter: blur(12px);',
    '  border: 1px solid rgba(255, 255, 255, 0.18);',
    '  border-radius: 999px;',
    '  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.15);',
    '  text-decoration: none;',
    '  color: #ffffff;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-user-select: none;',
    '  pointer-events: auto !important;',
    '  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),',
    '              background 0.22s ease,',
    '              border-color 0.22s ease,',
    '              box-shadow 0.22s ease;',
    '}',
    '.oneflix-player-badge:hover {',
    '  background: rgba(22, 16, 32, 0.95);',
    '  border-color: rgba(229, 9, 20, 0.7);',
    '  box-shadow: 0 6px 24px rgba(229, 9, 20, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);',
    '  transform: translateY(-1px) scale(1.03);',
    '}',
    '.oneflix-player-badge:active {',
    '  transform: translateY(0) scale(0.97);',
    '}',
    '.oneflix-badge-logo {',
    '  width: 20px;',
    '  height: 20px;',
    '  object-fit: contain;',
    '  display: block;',
    '  filter: drop-shadow(0 0 6px rgba(229, 9, 20, 0.6));',
    '}',
    '.oneflix-badge-name {',
    '  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '  font-size: 11.5px;',
    '  font-weight: 800;',
    '  letter-spacing: 0.85px;',
    '  color: #ffffff;',
    '  line-height: 1;',
    '  text-transform: uppercase;',
    '}',
    '@media (max-width: 480px) {',
    '  .oneflix-player-badge {',
    '    top: 10px !important;',
    '    left: 10px !important;',
    '    padding: 4px 9px 4px 6px;',
    '    gap: 5px;',
    '  }',
    '  .oneflix-badge-logo {',
    '    width: 16px;',
    '    height: 16px;',
    '  }',
    '  .oneflix-badge-name {',
    '    font-size: 10px;',
    '    letter-spacing: 0.6px;',
    '  }',
    '}',
    '',
    '/* Fullscreen persistent visibility */',
    ':fullscreen oneflix-badge,',
    ':-webkit-full-screen oneflix-badge,',
    '.shaka-video-container:fullscreen oneflix-badge,',
    '.shaka-video-container:-webkit-full-screen oneflix-badge,',
    '.player-ratio:fullscreen oneflix-badge,',
    '.player-ratio:-webkit-full-screen oneflix-badge,',
    '#player-container:fullscreen oneflix-badge,',
    '#player-container:-webkit-full-screen oneflix-badge,',
    '.is-fullscreen oneflix-badge,',
    '.player-mobile-fs oneflix-badge {',
    '  display: block !important;',
    '  visibility: visible !important;',
    '  opacity: 1 !important;',
    '  z-index: 2147483647 !important;',
    '}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('oneflix-badge-styles')) return;
    var style = document.createElement('style');
    style.id = 'oneflix-badge-styles';
    style.textContent = CSS_TEXT;
    (document.head || document.documentElement).appendChild(style);
  }

  function createBadge() {
    var a = document.createElement('a');
    a.href = TARGET_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'oneflix-player-badge';
    a.setAttribute('aria-label', 'Visit OneFlix');

    var img = document.createElement('img');
    img.src = getLogoSrc();
    img.alt = '';
    img.className = 'oneflix-badge-logo';
    img.width = 20;
    img.height = 20;
    img.onerror = function () {
      if (this.src.indexOf('https://oneflixx.pages.dev') === -1) {
        this.src = 'https://oneflixx.pages.dev/logo.png';
      }
    };

    var span = document.createElement('span');
    span.className = 'oneflix-badge-name';
    span.textContent = 'ONEFLIX';

    a.appendChild(img);
    a.appendChild(span);

    function stopProp(e) {
      if (e && e.stopPropagation) e.stopPropagation();
    }
    a.addEventListener('click', stopProp);
    a.addEventListener('dblclick', stopProp);
    a.addEventListener('pointerdown', stopProp);
    a.addEventListener('touchstart', stopProp, { passive: true });

    return a;
  }

  // Register Web Component <oneflix-badge>
  if (typeof customElements !== 'undefined' && !customElements.get('oneflix-badge')) {
    var OneFlixBadgeElement = function () {
      return Reflect.construct(HTMLElement, [], OneFlixBadgeElement);
    };
    OneFlixBadgeElement.prototype = Object.create(HTMLElement.prototype);
    OneFlixBadgeElement.prototype.constructor = OneFlixBadgeElement;
    OneFlixBadgeElement.prototype.connectedCallback = function () {
      injectStyles();
      var self = this;
      if (!self.querySelector('.oneflix-player-badge')) {
        self.appendChild(createBadge());
      }
      updateBadgeVisibility(self);
      var parent = self.parentElement;
      if (parent) {
        var iframe = parent.querySelector('iframe');
        if (iframe && iframe.style.display !== 'none' && iframe.parentElement) {
          if (self.parentElement !== iframe.parentElement) {
            iframe.parentElement.appendChild(self);
          }
          return;
        }
        var shakaCont = parent.querySelector('.shaka-video-container');
        if (shakaCont && self.parentElement !== shakaCont) {
          shakaCont.appendChild(self);
        }
      }
    };
    customElements.define('oneflix-badge', OneFlixBadgeElement);
  }

  // Auto-mount into player containers if not already present
  var targets = ['#playerRatio', '#player-container', '#pc'];

  function resolveHost(container) {
    if (!container) return null;
    var iframe = container.querySelector('iframe');
    if (iframe && iframe.style.display !== 'none' && iframe.parentElement) {
      return iframe.parentElement;
    }
    var shakaCont = container.querySelector('.shaka-video-container');
    if (shakaCont) {
      return shakaCont;
    }
    return container;
  }

  function ensureBadgeIn(container) {
    var host = resolveHost(container);
    if (!host) return;
    var badge = container.querySelector('oneflix-badge');
    var iframe = host.querySelector('iframe');
    if (!badge) {
      badge = document.createElement('oneflix-badge');
      badge.appendChild(createBadge());
      host.appendChild(badge);
    } else if (badge.parentElement !== host) {
      host.appendChild(badge);
    }
    updateBadgeVisibility(badge);
    if (badge && iframe && iframe.parentElement === host) {
      var badgeIdx = Array.prototype.indexOf.call(host.children, badge);
      var iframeIdx = Array.prototype.indexOf.call(host.children, iframe);
      if (badgeIdx !== -1 && iframeIdx !== -1 && badgeIdx < iframeIdx) {
        host.appendChild(badge);
      }
    }
  }

  function autoMount() {
    injectStyles();
    for (var i = 0; i < targets.length; i++) {
      var container = document.querySelector(targets[i]);
      if (container) {
        ensureBadgeIn(container);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  // Monitor DOM for dynamic iframe or Shaka UI insertion so badge is always on top
  if (typeof MutationObserver !== 'undefined') {
    var isUpdating = false;
    var observer = new MutationObserver(function () {
      if (isUpdating) return;
      isUpdating = true;
      try {
        for (var i = 0; i < targets.length; i++) {
          var container = document.querySelector(targets[i]);
          if (container) {
            ensureBadgeIn(container);
          }
        }
      } finally {
        isUpdating = false;
      }
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // Fullscreen change listener to ensure badges update visibility when entering/exiting fullscreen
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      var badges = document.querySelectorAll('oneflix-badge');
      for (var i = 0; i < badges.length; i++) {
        updateBadgeVisibility(badges[i]);
      }
    });
  });
})();
