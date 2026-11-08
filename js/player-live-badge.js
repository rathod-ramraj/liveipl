/**
 * Live Count Badge Component (Player Watermark & Navbar)
 * Web Component: <player-live-badge></player-live-badge>
 * Mirrors js/oneflix-badge.js architecture.
 * Modes:
 *   - Player mode (default): Absolute top-right corner over player containers.
 *   - Navbar mode (<player-live-badge in-nav></player-live-badge> or inside <nav>): Inline-flex pill in navbar.
 */
(function () {
  'use strict';

  var STORAGE_KEY_COUNT = 'playup_live_count';

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
    if (!badge || badge.hasAttribute('in-nav') || badge.closest('nav')) return;
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

  function formatCount(num) {
    if (typeof num !== 'number' || isNaN(num) || num < 0) num = 0;
    return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toLocaleString();
  }

  function getInitialCount() {
    try {
      var navEl = document.getElementById('navLiveUsersCount');
      if (navEl && navEl.textContent && navEl.textContent.trim()) {
        return navEl.textContent.trim();
      }
      var stored = localStorage.getItem(STORAGE_KEY_COUNT);
      if (stored) {
        var n = parseInt(stored, 10);
        if (!isNaN(n)) return formatCount(n);
      }
    } catch (_) { }
    return '1';
  }

  var CSS_TEXT = [
    '/* Player corner mode */',
    'player-live-badge:not([in-nav]) {',
    '  display: block !important;',
    '  position: absolute !important;',
    '  top: 0 !important;',
    '  right: 0 !important;',
    '  pointer-events: none !important;',
    '  z-index: 99999 !important;',
    '}',
    'player-live-badge:not([in-nav]) .player-live-count-badge {',
    '  position: absolute !important;',
    '  top: 14px !important;',
    '  right: 14px !important;',
    '  z-index: 99999 !important;',
    '  display: inline-flex !important;',
    '  align-items: center;',
    '  gap: 6px;',
    '  padding: 6px 11px 6px 9px;',
    '  background: rgba(14, 12, 22, 0.76);',
    '  backdrop-filter: blur(12px);',
    '  -webkit-backdrop-filter: blur(12px);',
    '  border: 1px solid rgba(255, 255, 255, 0.18);',
    '  border-radius: 999px;',
    '  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.15);',
    '  color: #ffffff;',
    '  user-select: none;',
    '  -webkit-user-select: none;',
    '  pointer-events: auto !important;',
    '  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),',
    '              background 0.22s ease,',
    '              border-color 0.22s ease,',
    '              box-shadow 0.22s ease;',
    '}',
    'player-live-badge:not([in-nav]) .player-live-count-badge:hover {',
    '  background: rgba(22, 16, 32, 0.95);',
    '  border-color: rgba(59, 130, 246, 0.6);',
    '  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);',
    '  transform: translateY(-1px) scale(1.03);',
    '}',
    '',
    '/* Navbar inline mode */',
    'player-live-badge[in-nav],',
    'nav player-live-badge {',
    '  display: inline-flex !important;',
    '  position: relative !important;',
    '  top: auto !important;',
    '  right: auto !important;',
    '  pointer-events: auto !important;',
    '  z-index: 2 !important;',
    '  margin-left: 4px;',
    '  flex-shrink: 0;',
    '  vertical-align: middle;',
    '  cursor: default !important;',
    '}',
    'player-live-badge[in-nav] *,',
    'nav player-live-badge * {',
    '  cursor: default !important;',
    '}',
    'player-live-badge[in-nav] .player-live-count-badge,',
    'nav player-live-badge .player-live-count-badge {',
    '  position: relative !important;',
    '  top: auto !important;',
    '  right: auto !important;',
    '  display: inline-flex !important;',
    '  align-items: center;',
    '  gap: 5px;',
    '  padding: 4px 10px 4px 8px;',
    '  background: rgba(14, 12, 22, 0.76);',
    '  backdrop-filter: blur(12px);',
    '  -webkit-backdrop-filter: blur(12px);',
    '  border: 1px solid rgba(255, 255, 255, 0.18);',
    '  border-radius: 999px;',
    '  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);',
    '  color: #ffffff;',
    '  cursor: default !important;',
    '  user-select: none;',
    '  -webkit-user-select: none;',
    '  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;',
    '}',
    'player-live-badge[in-nav] .player-live-count-badge:hover,',
    'nav player-live-badge .player-live-count-badge:hover {',
    '  background: rgba(22, 16, 32, 0.95);',
    '  border-color: rgba(59, 130, 246, 0.5);',
    '  transform: translateY(-1px);',
    '}',
    '',
    '/* Shared Icon & Count Typography */',
    '.player-live-eye-icon {',
    '  width: 13px;',
    '  height: 13px;',
    '  flex-shrink: 0;',
    '  stroke: #60a5fa;',
    '  display: block;',
    '  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.45));',
    '}',
    '.player-live-count-num {',
    '  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '  font-size: 11px;',
    '  font-weight: 700;',
    '  letter-spacing: 0.5px;',
    '  color: #ffffff;',
    '  line-height: 1;',
    '}',
    '',
    '/* Mobile Responsive */',
    '@media (max-width: 640px) {',
    '  player-live-badge:not([in-nav]) .player-live-count-badge {',
    '    top: 10px !important;',
    '    right: 10px !important;',
    '    padding: 4px 8px 4px 7px;',
    '    gap: 4px;',
    '  }',
    '  player-live-badge[in-nav] .player-live-count-badge,',
    '  nav player-live-badge .player-live-count-badge {',
    '    padding: 3px 8px 3px 6px;',
    '    gap: 4px;',
    '  }',
    '  .player-live-eye-icon {',
    '    width: 12px;',
    '    height: 12px;',
    '  }',
    '  .player-live-count-num {',
    '    font-size: 10px;',
    '    letter-spacing: 0.4px;',
    '  }',
    '}',
    '',
    '/* Fullscreen persistent visibility */',
    ':fullscreen player-live-badge:not([in-nav]),',
    ':-webkit-full-screen player-live-badge:not([in-nav]),',
    '.shaka-video-container:fullscreen player-live-badge:not([in-nav]),',
    '.shaka-video-container:-webkit-full-screen player-live-badge:not([in-nav]),',
    '.player-ratio:fullscreen player-live-badge:not([in-nav]),',
    '.player-ratio:-webkit-full-screen player-live-badge:not([in-nav]),',
    '#player-container:fullscreen player-live-badge:not([in-nav]),',
    '#player-container:-webkit-full-screen player-live-badge:not([in-nav]),',
    '.is-fullscreen player-live-badge:not([in-nav]),',
    '.player-mobile-fs player-live-badge:not([in-nav]) {',
    '  display: block !important;',
    '  visibility: visible !important;',
    '  opacity: 1 !important;',
    '  z-index: 2147483647 !important;',
    '}',
    '/* Avoid collision with fullscreen exit button */',
    '.player-ratio:fullscreen player-live-badge:not([in-nav]) .player-live-count-badge,',
    '.player-ratio:-webkit-full-screen player-live-badge:not([in-nav]) .player-live-count-badge,',
    '.is-fullscreen player-live-badge:not([in-nav]) .player-live-count-badge,',
    '.player-mobile-fs player-live-badge:not([in-nav]) .player-live-count-badge {',
    '  right: 56px !important;',
    '}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('player-live-badge-styles')) return;
    var style = document.createElement('style');
    style.id = 'player-live-badge-styles';
    style.textContent = CSS_TEXT;
    (document.head || document.documentElement).appendChild(style);
  }

  function createBadge(isNav) {
    var pill = document.createElement('div');
    pill.className = 'player-live-count-badge';
    pill.title = 'Live Views';

    // SVG Eye Icon
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'player-live-eye-icon');
    svg.setAttribute('width', '13');
    svg.setAttribute('height', '13');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', '#60a5fa');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z');
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '3');

    svg.appendChild(path);
    svg.appendChild(circle);

    var countSpan = document.createElement('span');
    countSpan.id = isNav ? 'navLiveUsersCount' : 'playerLiveUsersCount';
    countSpan.className = 'player-live-count-num';
    countSpan.textContent = getInitialCount();

    pill.appendChild(svg);
    pill.appendChild(countSpan);

    function blockEvent(e) {
      if (!e) return;
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return false;
    }

    pill.addEventListener('click', blockEvent, true);
    pill.addEventListener('dblclick', blockEvent, true);
    pill.addEventListener('pointerdown', blockEvent, true);
    pill.addEventListener('mousedown', blockEvent, true);
    pill.addEventListener('mouseup', blockEvent, true);
    pill.addEventListener('touchstart', blockEvent, { passive: false, capture: true });
    pill.addEventListener('touchend', blockEvent, { passive: false, capture: true });

    return pill;
  }

  // Register Web Component <player-live-badge>
  if (typeof customElements !== 'undefined' && !customElements.get('player-live-badge')) {
    var PlayerLiveBadgeElement = function () {
      return Reflect.construct(HTMLElement, [], PlayerLiveBadgeElement);
    };
    PlayerLiveBadgeElement.prototype = Object.create(HTMLElement.prototype);
    PlayerLiveBadgeElement.prototype.constructor = PlayerLiveBadgeElement;
    PlayerLiveBadgeElement.prototype.connectedCallback = function () {
      injectStyles();
      var self = this;
      var isNav = self.hasAttribute('in-nav') || !!self.closest('nav');

      if (!isNav) {
        updateBadgeVisibility(self);
      }

      if (!self.querySelector('.player-live-count-badge')) {
        self.appendChild(createBadge(isNav));
      }

      function blockHostEvent(e) {
        if (!e) return;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return false;
      }
      self.addEventListener('click', blockHostEvent, true);
      self.addEventListener('pointerdown', blockHostEvent, true);
      self.addEventListener('mousedown', blockHostEvent, true);
      self.addEventListener('touchstart', blockHostEvent, { passive: false, capture: true });

      if (!isNav) {
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
      }
    };
    customElements.define('player-live-badge', PlayerLiveBadgeElement);
  }

  function updateAllLiveCounters(count) {
    var formatted = formatCount(count);
    var navEl = document.getElementById('navLiveUsersCount');
    if (navEl) navEl.textContent = formatted;
    var playerEl = document.getElementById('playerLiveUsersCount');
    if (playerEl) playerEl.textContent = formatted;
  }

  // Multi-tab and storage live update listeners
  if (typeof window !== 'undefined') {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        var bc = new BroadcastChannel('playup_live_users');
        bc.onmessage = function (e) {
          if (e && e.data && e.data.type === 'COUNT_UPDATE') {
            updateAllLiveCounters(e.data.count);
          }
        };
      } catch (_) { }
    }

    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY_COUNT) {
        var n = parseInt(e.newValue, 10);
        if (!isNaN(n)) {
          updateAllLiveCounters(n);
        }
      }
    });
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
    var badge = container.querySelector('player-live-badge:not([in-nav])');
    var iframe = host.querySelector('iframe');
    if (!badge) {
      badge = document.createElement('player-live-badge');
      badge.appendChild(createBadge(false));
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
      var badges = document.querySelectorAll('player-live-badge:not([in-nav])');
      for (var i = 0; i < badges.length; i++) {
        updateBadgeVisibility(badges[i]);
      }
    });
  });
})();
