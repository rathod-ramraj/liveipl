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

  function getLogoSrc() {
    var isSub = window.location.pathname.indexOf('/cricket/') !== -1;
    return isSub ? '../oneflix-icon.png' : '/oneflix-icon.png';
  }

  var CSS_TEXT = [
    'oneflix-badge { display: contents; }',
    '.oneflix-player-badge {',
    '  position: absolute;',
    '  top: 14px;',
    '  left: 14px;',
    '  z-index: 9999;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 7px;',
    '  padding: 6px 12px 6px 8px;',
    '  background: rgba(14, 12, 22, 0.72);',
    '  backdrop-filter: blur(12px);',
    '  -webkit-backdrop-filter: blur(12px);',
    '  border: 1px solid rgba(255, 255, 255, 0.16);',
    '  border-radius: 999px;',
    '  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);',
    '  text-decoration: none;',
    '  color: #ffffff;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-user-select: none;',
    '  pointer-events: auto;',
    '  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),',
    '              background 0.22s ease,',
    '              border-color 0.22s ease,',
    '              box-shadow 0.22s ease;',
    '}',
    '.oneflix-player-badge:hover {',
    '  background: rgba(22, 16, 32, 0.92);',
    '  border-color: rgba(229, 9, 20, 0.65);',
    '  box-shadow: 0 6px 24px rgba(229, 9, 20, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.22);',
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
    '.player-ratio.is-iframe-active > .oneflix-player-badge,',
    '.player-ratio.is-iframe-active > oneflix-badge {',
    '  display: none !important;',
    '}',
    '@media (max-width: 480px) {',
    '  .oneflix-player-badge {',
    '    top: 10px;',
    '    left: 10px;',
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
      var parent = self.parentElement;
      if (parent) {
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

  function autoMount() {
    injectStyles();
    for (var i = 0; i < targets.length; i++) {
      var container = document.querySelector(targets[i]);
      if (container) {
        var host = container.querySelector('.shaka-video-container') || container;
        var existing = container.querySelector('.oneflix-player-badge') || container.querySelector('oneflix-badge');
        if (!existing) {
          host.appendChild(createBadge());
        } else if (host !== container && existing.parentElement !== host) {
          host.appendChild(existing);
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  // Monitor DOM for dynamic Shaka UI insertion
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function () {
      for (var i = 0; i < targets.length; i++) {
        var container = document.querySelector(targets[i]);
        if (container) {
          var shakaCont = container.querySelector('.shaka-video-container');
          var badge = container.querySelector('.oneflix-player-badge') || container.querySelector('oneflix-badge');
          if (shakaCont && badge && badge.parentElement !== shakaCont) {
            shakaCont.appendChild(badge);
          }
        }
      }
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
})();
