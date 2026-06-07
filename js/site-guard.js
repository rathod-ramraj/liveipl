/**
 * Site guard — blocks bots/scrapers, copy, and common capture shortcuts.
 * Add ?dev=1 to the URL to disable while developing.
 */
(function () {
  'use strict';

  if (/[?&]dev=1\b/.test(location.search)) return;

  var ALLOWED_BOTS = [/Googlebot/i, /Bingbot/i, /DuckDuckBot/i, /Applebot(?!-Extended)/i];

  var BLOCKED_UA = [
    /GPTBot/i, /ChatGPT-User/i, /ClaudeBot/i, /Claude-Web/i, /anthropic-ai/i,
    /Google-Extended/i, /CCBot/i, /cohere-ai/i, /PerplexityBot/i, /Bytespider/i,
    /meta-externalagent/i, /Applebot-Extended/i, /Diffbot/i, /Omgilibot/i,
    /ImagesiftBot/i, /img2dataset/i, /Amazonbot/i, /FacebookBot/i,
    /SemrushBot/i, /AhrefsBot/i, /DotBot/i, /PetalBot/i, /BLEXBot/i,
    /DataForSeoBot/i, /Scrapy/i, /HeadlessChrome/i, /PhantomJS/i,
    /Puppeteer/i, /Playwright/i, /Selenium/i, /python-requests/i,
    /httpx\//i, /aiohttp/i, /curl\//i, /wget\//i, /Go-http-client/i,
    /Java\//i, /libwww-perl/i, /axios\//i, /node-fetch/i,
    /\bbot\b/i, /\bcrawler\b/i, /\bspider\b/i, /\bscraper\b/i,
  ];

  var shieldTimer = null;

  function isEditable(el) {
    return el && el.closest && el.closest('input, textarea, [contenteditable="true"]');
  }

  function denyAccess(reason) {
    try {
      document.documentElement.classList.add('guard-blocked');
      document.body.innerHTML =
        '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;' +
        'flex-direction:column;gap:12px;padding:32px;font-family:system-ui,sans-serif;' +
        'background:#121019;color:#fff;text-align:center">' +
        '<h1 style="font-size:22px;margin:0">Access Restricted</h1>' +
        '<p style="margin:0;color:rgba(255,255,255,0.55);max-width:360px;font-size:14px">' +
        (reason || 'Automated access is not permitted on this site.') +
        '</p></div>';
    } catch (_) {}
  }

  function isBlockedClient() {
    var ua = navigator.userAgent || '';
    for (var a = 0; a < ALLOWED_BOTS.length; a++) {
      if (ALLOWED_BOTS[a].test(ua)) return false;
    }
    for (var i = 0; i < BLOCKED_UA.length; i++) {
      if (BLOCKED_UA[i].test(ua)) return true;
    }
    if (navigator.webdriver) return true;
    if (/HeadlessChrome/.test(ua)) return true;
    return false;
  }

  function flashShield(ms) {
    var shield = document.getElementById('guard-shield');
    if (!shield) return;
    clearTimeout(shieldTimer);
    document.documentElement.classList.add('guard-blur');
    shield.classList.add('is-active');
    shieldTimer = setTimeout(function () {
      shield.classList.remove('is-active');
      document.documentElement.classList.remove('guard-blur');
    }, ms || 2200);
  }

  function blockEvent(e) {
    if (isEditable(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  if (isBlockedClient()) {
    denyAccess('Bots and automated browsers are not allowed.');
    return;
  }

  document.addEventListener('contextmenu', blockEvent, true);
  document.addEventListener('copy', blockEvent, true);
  document.addEventListener('cut', blockEvent, true);
  document.addEventListener('selectstart', blockEvent, true);
  document.addEventListener('dragstart', blockEvent, true);

  document.addEventListener('keydown', function (e) {
    var key = (e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;

    if (key === 'printscreen' || e.keyCode === 44) {
      e.preventDefault();
      flashShield(2800);
      return;
    }

    if (!mod) return;
    if (isEditable(e.target)) return;

    if (key === 'c' || key === 'x' || key === 'a' || key === 'p' || key === 's' || key === 'u') {
      e.preventDefault();
      if (key === 'p' || key === 's') flashShield(1600);
    }
  }, true);

  document.addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen' || e.keyCode === 44) flashShield(2800);
  }, true);

  window.addEventListener('blur', function () {
    document.documentElement.classList.add('guard-blur');
  });
  window.addEventListener('focus', function () {
    document.documentElement.classList.remove('guard-blur');
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      document.documentElement.classList.add('guard-blur');
    } else {
      document.documentElement.classList.remove('guard-blur');
    }
  });
})();
