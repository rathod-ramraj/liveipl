/**
 * PlayUp Floating "SHARE SITE" Side Tab & Modal Component
 * Crafted following Emil Kowalski's Design Engineering & Apple fluid interface principles:
 * - Theme: PlayUp site theme blue (#3b82f6, #60a5fa, dark glassmorphism)
 * - Motion: Custom punchy ease-out (cubic-bezier(0.16, 1, 0.3, 1)), snappy sub-250ms transitions
 * - Tactile feedback: scale(0.97) instant press response on :active
 * - Hardware acceleration: only transform and opacity animations
 * - Responsive & accessible: hover-guarded for touch, prefers-reduced-motion support, auto-hide on fullscreen
 */
(function () {
  'use strict';

  // Do not render inside nested iframe embeds
  try {
    if (window.self !== window.top) return;
  } catch (_) {
    return;
  }

  var SHARE_URL = 'https://playupp.pages.dev/';
  var SHARE_TITLE = 'PlayUp — Live Sports & TV Channels';
  var SHARE_TEXT = 'Watch live cricket, football, sports and TV channels in HD on PlayUp!';

  function getQrSrc() {
    var isSub = window.location.pathname.indexOf('/cricket/') !== -1;
    return isSub ? '../public/playup-qr.png' : './public/playup-qr.png';
  }

  var FALLBACK_QR = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(SHARE_URL) + '&color=2563eb';

  var CSS_TEXT = [
    '/* ═══ PLAYUP SHARE FLOATING SIDE TAB ═══ */',
    '.playup-share-tab {',
    '  position: fixed !important;',
    '  right: 0 !important;',
    '  top: 50% !important;',
    '  transform: translateY(-50%) !important;',
    '  z-index: 99990 !important;',
    '  display: flex !important;',
    '  flex-direction: column !important;',
    '  align-items: center !important;',
    '  justify-content: center !important;',
    '  gap: 10px !important;',
    '  padding: 14px 9px 14px 11px !important;',
    '  background: rgba(11, 14, 22, 0.88) !important;',
    '  backdrop-filter: blur(18px) !important;',
    '  -webkit-backdrop-filter: blur(18px) !important;',
    '  border: 1px solid rgba(59, 130, 246, 0.22) !important;',
    '  border-right: none !important;',
    '  border-radius: 12px 0 0 12px !important;',
    '  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.6), -1px 0 12px rgba(59, 130, 246, 0.25) !important;',
    '  cursor: pointer !important;',
    '  user-select: none !important;',
    '  -webkit-user-select: none !important;',
    '  touch-action: manipulation !important;',
    '  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),',
    '              background 180ms ease,',
    '              border-color 180ms ease,',
    '              box-shadow 200ms ease !important;',
    '}',
    '.playup-share-tab::before {',
    '  content: "";',
    '  position: absolute;',
    '  left: 0;',
    '  top: 14%;',
    '  bottom: 14%;',
    '  width: 3px;',
    '  border-radius: 0 2px 2px 0;',
    '  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%);',
    '  box-shadow: 0 0 10px rgba(59, 130, 246, 0.85);',
    '}',
    '@media (hover: hover) and (pointer: fine) {',
    '  .playup-share-tab:hover {',
    '    transform: translateY(-50%) translateX(-4px) !important;',
    '    background: rgba(15, 20, 32, 0.96) !important;',
    '    border-color: rgba(59, 130, 246, 0.55) !important;',
    '    box-shadow: -8px 0 30px rgba(0, 0, 0, 0.7), -2px 0 18px rgba(59, 130, 246, 0.45) !important;',
    '  }',
    '  .playup-share-tab:hover .playup-share-tab-icon {',
    '    color: #60a5fa !important;',
    '    transform: scale(1.12);',
    '  }',
    '  .playup-share-tab:hover .playup-share-tab-text {',
    '    color: #ffffff !important;',
    '  }',
    '}',
    '.playup-share-tab:active {',
    '  transform: translateY(-50%) translateX(-1px) scale(0.96) !important;',
    '  transition-duration: 100ms !important;',
    '}',
    '.playup-share-tab-icon {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  width: 20px;',
    '  height: 20px;',
    '  color: #3b82f6;',
    '  transition: color 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);',
    '}',
    '.playup-share-tab-text {',
    '  writing-mode: vertical-rl;',
    '  text-orientation: mixed;',
    '  font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '  font-size: 10.5px;',
    '  font-weight: 700;',
    '  letter-spacing: 2px;',
    '  text-transform: uppercase;',
    '  color: #f0f4ff;',
    '  white-space: nowrap;',
    '  transition: color 180ms ease;',
    '}',
    '',
    '/* Fullscreen auto-hide (never block video) */',
    ':fullscreen .playup-share-tab,',
    ':-webkit-full-screen .playup-share-tab,',
    '.is-fullscreen .playup-share-tab,',
    '.player-mobile-fs .playup-share-tab,',
    'body.is-fullscreen-active .playup-share-tab {',
    '  display: none !important;',
    '  opacity: 0 !important;',
    '  pointer-events: none !important;',
    '}',
    '',
    '/* ═══ MODAL OVERLAY ═══ */',
    '.playup-share-overlay {',
    '  position: fixed !important;',
    '  inset: 0 !important;',
    '  z-index: 100000 !important;',
    '  background: rgba(4, 6, 10, 0.82) !important;',
    '  backdrop-filter: blur(14px) !important;',
    '  -webkit-backdrop-filter: blur(14px) !important;',
    '  display: flex !important;',
    '  align-items: center !important;',
    '  justify-content: center !important;',
    '  padding: 18px !important;',
    '  opacity: 0 !important;',
    '  visibility: hidden !important;',
    '  pointer-events: none !important;',
    '  transition: opacity 200ms ease, visibility 200ms ease !important;',
    '}',
    '.playup-share-overlay.is-open {',
    '  opacity: 1 !important;',
    '  visibility: visible !important;',
    '  pointer-events: auto !important;',
    '}',
    '',
    '/* ═══ MODAL CARD ═══ */',
    '.playup-share-modal {',
    '  position: relative !important;',
    '  width: 100% !important;',
    '  max-width: 370px !important;',
    '  background: linear-gradient(165deg, rgba(17, 22, 33, 0.96) 0%, rgba(10, 13, 19, 0.98) 100%) !important;',
    '  border: 1px solid rgba(59, 130, 246, 0.2) !important;',
    '  border-radius: 22px !important;',
    '  padding: 26px 22px 22px !important;',
    '  text-align: center !important;',
    '  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.75), 0 0 50px rgba(59, 130, 246, 0.16) !important;',
    '  transform: scale(0.95) translateY(12px) !important;',
    '  opacity: 0 !important;',
    '  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease !important;',
    '  font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;',
    '  color: #f0f4ff !important;',
    '  box-sizing: border-box !important;',
    '}',
    '.playup-share-overlay.is-open .playup-share-modal {',
    '  transform: scale(1) translateY(0) !important;',
    '  opacity: 1 !important;',
    '}',
    '',
    '/* Close Button */',
    '.playup-share-close {',
    '  position: absolute !important;',
    '  top: 14px !important;',
    '  right: 14px !important;',
    '  width: 32px !important;',
    '  height: 32px !important;',
    '  border-radius: 50% !important;',
    '  background: rgba(255, 255, 255, 0.05) !important;',
    '  border: 1px solid rgba(255, 255, 255, 0.1) !important;',
    '  color: #9ca3af !important;',
    '  display: flex !important;',
    '  align-items: center !important;',
    '  justify-content: center !important;',
    '  cursor: pointer !important;',
    '  padding: 0 !important;',
    '  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background 160ms ease, border-color 160ms ease, color 160ms ease !important;',
    '}',
    '@media (hover: hover) and (pointer: fine) {',
    '  .playup-share-close:hover {',
    '    background: rgba(59, 130, 246, 0.15) !important;',
    '    border-color: rgba(59, 130, 246, 0.4) !important;',
    '    color: #ffffff !important;',
    '    transform: rotate(90deg) scale(1.05) !important;',
    '  }',
    '}',
    '.playup-share-close:active {',
    '  transform: rotate(90deg) scale(0.95) !important;',
    '  transition-duration: 100ms !important;',
    '}',
    '',
    '/* Modal Top Icon */',
    '.playup-share-top-icon {',
    '  width: 48px;',
    '  height: 48px;',
    '  border-radius: 16px;',
    '  background: rgba(59, 130, 246, 0.12);',
    '  border: 1px solid rgba(59, 130, 246, 0.3);',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  color: #60a5fa;',
    '  margin-bottom: 12px;',
    '  box-shadow: 0 0 20px rgba(59, 130, 246, 0.25);',
    '}',
    '',
    '/* Title & Subtitle */',
    '.playup-share-title {',
    '  font-size: 22px !important;',
    '  font-weight: 800 !important;',
    '  letter-spacing: -0.3px !important;',
    '  color: #ffffff !important;',
    '  margin: 0 0 4px !important;',
    '}',
    '.playup-share-subtitle {',
    '  font-size: 13px !important;',
    '  color: #9ca3af !important;',
    '  margin: 0 0 18px !important;',
    '}',
    '',
    '/* QR Code Container */',
    '.playup-share-qr-wrap {',
    '  background: #ffffff;',
    '  border-radius: 16px;',
    '  padding: 10px;',
    '  display: inline-block;',
    '  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 24px rgba(59, 130, 246, 0.2);',
    '  margin-bottom: 16px;',
    '  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);',
    '}',
    '@media (hover: hover) and (pointer: fine) {',
    '  .playup-share-qr-wrap:hover {',
    '    transform: scale(1.02);',
    '  }',
    '}',
    '.playup-share-qr-img {',
    '  width: 176px;',
    '  height: 176px;',
    '  display: block;',
    '  object-fit: contain;',
    '  border-radius: 8px;',
    '}',
    '',
    '/* URL Pill */',
    '.playup-share-url-box {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 8px;',
    '  background: rgba(59, 130, 246, 0.08);',
    '  border: 1px solid rgba(59, 130, 246, 0.2);',
    '  border-radius: 10px;',
    '  padding: 9px 12px;',
    '  font-size: 12.5px;',
    '  font-weight: 600;',
    '  color: #60a5fa;',
    '  margin-bottom: 16px;',
    '  word-break: break-all;',
    '  user-select: all;',
    '  -webkit-user-select: all;',
    '  cursor: pointer;',
    '  transition: background 180ms ease, border-color 180ms ease, transform 150ms ease;',
    '}',
    '@media (hover: hover) and (pointer: fine) {',
    '  .playup-share-url-box:hover {',
    '    background: rgba(59, 130, 246, 0.14);',
    '    border-color: rgba(59, 130, 246, 0.4);',
    '  }',
    '}',
    '.playup-share-url-box:active {',
    '  transform: scale(0.98);',
    '}',
    '.playup-share-url-box svg {',
    '  flex-shrink: 0;',
    '  color: #93c5fd;',
    '}',
    '',
    '/* Actions */',
    '.playup-share-actions {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 8px;',
    '}',
    '',
    '/* Copy Link Button */',
    '.playup-share-btn-copy {',
    '  width: 100% !important;',
    '  display: inline-flex !important;',
    '  align-items: center !important;',
    '  justify-content: center !important;',
    '  gap: 8px !important;',
    '  padding: 13px 18px !important;',
    '  border-radius: 12px !important;',
    '  border: none !important;',
    '  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;',
    '  color: #ffffff !important;',
    '  font-family: inherit !important;',
    '  font-size: 14px !important;',
    '  font-weight: 700 !important;',
    '  cursor: pointer !important;',
    '  box-shadow: 0 4px 18px rgba(59, 130, 246, 0.4) !important;',
    '  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 160ms ease, background 200ms ease !important;',
    '}',
    '@media (hover: hover) and (pointer: fine) {',
    '  .playup-share-btn-copy:hover {',
    '    transform: translateY(-1px) !important;',
    '    box-shadow: 0 6px 22px rgba(59, 130, 246, 0.55) !important;',
    '  }',
    '}',
    '.playup-share-btn-copy:active {',
    '  transform: scale(0.97) !important;',
    '  transition-duration: 100ms !important;',
    '}',
    '.playup-share-btn-copy.is-copied {',
    '  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;',
    '  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.45) !important;',
    '}',
    '',
    '/* Web Share Button */',
    '.playup-share-btn-native {',
    '  width: 100% !important;',
    '  display: inline-flex !important;',
    '  align-items: center !important;',
    '  justify-content: center !important;',
    '  gap: 8px !important;',
    '  padding: 11px 18px !important;',
    '  border-radius: 12px !important;',
    '  border: 1px solid rgba(255, 255, 255, 0.12) !important;',
    '  background: rgba(255, 255, 255, 0.04) !important;',
    '  color: #f0f4ff !important;',
    '  font-family: inherit !important;',
    '  font-size: 13.5px !important;',
    '  font-weight: 600 !important;',
    '  cursor: pointer !important;',
    '  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), background 160ms ease, border-color 160ms ease !important;',
    '}',
    '@media (hover: hover) and (pointer: fine) {',
    '  .playup-share-btn-native:hover {',
    '    background: rgba(255, 255, 255, 0.09) !important;',
    '    border-color: rgba(59, 130, 246, 0.35) !important;',
    '  }',
    '}',
    '.playup-share-btn-native:active {',
    '  transform: scale(0.97) !important;',
    '  transition-duration: 100ms !important;',
    '}',
    '',
    '/* Reduced Motion (Accessibility) */',
    '@media (prefers-reduced-motion: reduce) {',
    '  .playup-share-tab,',
    '  .playup-share-modal,',
    '  .playup-share-btn-copy,',
    '  .playup-share-close,',
    '  .playup-share-btn-native {',
    '    transition: opacity 150ms ease, background 150ms ease !important;',
    '    transform: none !important;',
    '  }',
    '  .playup-share-overlay.is-open .playup-share-modal {',
    '    transform: none !important;',
    '  }',
    '}',
    '',
    '/* Responsive Mobile Styling */',
    '@media (max-width: 640px) {',
    '  .playup-share-tab {',
    '    padding: 11px 6px 11px 8px !important;',
    '    gap: 6px !important;',
    '  }',
    '  .playup-share-tab-icon {',
    '    width: 17px !important;',
    '    height: 17px !important;',
    '  }',
    '  .playup-share-tab-icon svg {',
    '    width: 13px !important;',
    '    height: 13px !important;',
    '  }',
    '  .playup-share-tab-text {',
    '    font-size: 9px !important;',
    '    letter-spacing: 1.5px !important;',
    '  }',
    '  .playup-share-modal {',
    '    max-width: 330px !important;',
    '    padding: 22px 18px 18px !important;',
    '  }',
    '  .playup-share-title {',
    '    font-size: 20px !important;',
    '  }',
    '  .playup-share-qr-img {',
    '    width: 150px !important;',
    '    height: 150px !important;',
    '  }',
    '}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('playup-share-site-styles')) return;
    var style = document.createElement('style');
    style.id = 'playup-share-site-styles';
    style.textContent = CSS_TEXT;
    document.head.appendChild(style);
  }

  function createTab() {
    if (document.getElementById('playupShareTab')) return;

    var tab = document.createElement('div');
    tab.className = 'playup-share-tab';
    tab.id = 'playupShareTab';
    tab.setAttribute('role', 'button');
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('aria-label', 'Share PlayUp');
    tab.setAttribute('title', 'Share PlayUp');

    tab.innerHTML = [
      '<div class="playup-share-tab-icon" aria-hidden="true">',
      '  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '    <circle cx="18" cy="5" r="3"></circle>',
      '    <circle cx="6" cy="12" r="3"></circle>',
      '    <circle cx="18" cy="19" r="3"></circle>',
      '    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>',
      '    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
      '  </svg>',
      '</div>',
      '<span class="playup-share-tab-text">SHARE SITE</span>'
    ].join('');

    tab.addEventListener('click', openModal);
    tab.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal();
      }
    });

    document.body.appendChild(tab);
  }

  function createModal() {
    if (document.getElementById('playupShareModalOverlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'playup-share-overlay';
    overlay.id = 'playupShareModalOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');

    var supportsShare = typeof navigator !== 'undefined' && !!navigator.share;
    var qrSrc = getQrSrc();

    overlay.innerHTML = [
      '<div class="playup-share-modal" role="document">',
      '  <button type="button" class="playup-share-close" id="playupShareCloseBtn" aria-label="Close share dialog">',
      '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '      <line x1="18" y1="6" x2="6" y2="18"></line>',
      '      <line x1="6" y1="6" x2="18" y2="18"></line>',
      '    </svg>',
      '  </button>',
      '  <div class="playup-share-top-icon">',
      '    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '      <circle cx="18" cy="5" r="3"></circle>',
      '      <circle cx="6" cy="12" r="3"></circle>',
      '      <circle cx="18" cy="19" r="3"></circle>',
      '      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>',
      '      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
      '    </svg>',
      '  </div>',
      '  <h2 class="playup-share-title">Share PlayUp</h2>',
      '  <p class="playup-share-subtitle">Share PlayUp with your friends</p>',
      '  <div class="playup-share-qr-wrap">',
      '    <img class="playup-share-qr-img" id="playupShareQrImg" src="' + qrSrc + '" alt="PlayUp QR Code" />',
      '  </div>',
      '  <div class="playup-share-url-box" title="Click to copy link" id="playupShareUrlPreview">',
      '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>',
      '      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
      '    </svg>',
      '    <span>' + SHARE_URL + '</span>',
      '  </div>',
      '  <div class="playup-share-actions">',
      '    <button type="button" class="playup-share-btn-copy" id="playupShareCopyBtn">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>',
      '        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
      '      </svg>',
      '      <span id="playupShareCopyText">Copy Link</span>',
      '    </button>',
      (supportsShare ? [
        '    <button type="button" class="playup-share-btn-native" id="playupShareNativeBtn">',
        '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
        '        <circle cx="18" cy="5" r="3"></circle>',
        '        <circle cx="6" cy="12" r="3"></circle>',
        '        <circle cx="18" cy="19" r="3"></circle>',
        '        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>',
        '        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
        '      </svg>',
        '      <span>Share via...</span>',
        '    </button>'
      ].join('') : ''),
      '  </div>',
      '</div>'
    ].join('');

    // Fallback QR image if local image fails
    var qrImg = overlay.querySelector('#playupShareQrImg');
    if (qrImg) {
      qrImg.onerror = function () {
        this.onerror = null;
        this.src = FALLBACK_QR;
      };
    }

    // Close button
    var closeBtn = overlay.querySelector('#playupShareCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Click outside modal to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    // Copy Link Button
    var copyBtn = overlay.querySelector('#playupShareCopyBtn');
    var copyText = overlay.querySelector('#playupShareCopyText');
    var copyTimeout = null;

    function handleCopy() {
      var copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(SHARE_URL).then(function () {
          showCopiedState();
        }).catch(function () {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        var input = document.createElement('textarea');
        input.value = SHARE_URL;
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        input.style.top = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        try {
          copied = document.execCommand('copy');
          if (copied) showCopiedState();
        } catch (_) {}
        document.body.removeChild(input);
      }

      function showCopiedState() {
        if (!copyBtn || !copyText) return;
        copyBtn.classList.add('is-copied');
        copyText.innerHTML = '✓ Copied!';
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(function () {
          copyBtn.classList.remove('is-copied');
          copyText.innerHTML = 'Copy Link';
        }, 2200);
      }
    }

    if (copyBtn) copyBtn.addEventListener('click', handleCopy);

    var urlPreview = overlay.querySelector('#playupShareUrlPreview');
    if (urlPreview) urlPreview.addEventListener('click', handleCopy);

    // Web Share API
    var nativeBtn = overlay.querySelector('#playupShareNativeBtn');
    if (nativeBtn && supportsShare) {
      nativeBtn.addEventListener('click', function () {
        navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SHARE_URL
        }).catch(function () {});
      });
    }

    document.body.appendChild(overlay);
  }

  function openModal() {
    var overlay = document.getElementById('playupShareModalOverlay');
    if (!overlay) {
      createModal();
      overlay = document.getElementById('playupShareModalOverlay');
    }
    if (overlay) {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    var overlay = document.getElementById('playupShareModalOverlay');
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  // Keyboard shortcut: Escape to close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var overlay = document.getElementById('playupShareModalOverlay');
      if (overlay && overlay.classList.contains('is-open')) {
        closeModal();
      }
    }
  });

  function init() {
    injectStyles();
    createTab();
    createModal();
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
