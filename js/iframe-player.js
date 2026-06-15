/**
 * Iframe player — lazy load, connection warm-up, single-instance reuse per URL.
 */
(function (global) {
  'use strict';

  var pool = Object.create(null);
  var parkEl = null;

  function ensurePark() {
    if (parkEl) return parkEl;
    parkEl = document.createElement('div');
    parkEl.id = 'iframe-park';
    parkEl.setAttribute('aria-hidden', 'true');
    parkEl.style.cssText =
      'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict';
    document.body.appendChild(parkEl);
    return parkEl;
  }

  function preconnect(url) {
    if (!url || !/^https?:/i.test(url)) return;
    var origin;
    try {
      origin = new URL(url).origin;
    } catch (_) {
      return;
    }
    if (document.querySelector('link[data-iframe-warm="' + origin + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    link.setAttribute('data-iframe-warm', origin);
    document.head.appendChild(link);
    var dns = document.createElement('link');
    dns.rel = 'dns-prefetch';
    dns.href = origin;
    dns.setAttribute('data-iframe-warm', origin + '-dns');
    document.head.appendChild(dns);
  }

  function removePoster(container) {
    if (!container) return;
    var poster = container.querySelector('.iframe-poster');
    if (poster && poster.parentNode) poster.parentNode.removeChild(poster);
  }

  function stopIframe(iframe) {
    if (!iframe) return;
    try {
      iframe.src = 'about:blank';
    } catch (_) {}
    iframe.removeAttribute('src');
    iframe.style.display = 'none';
  }

  /** Stop every pooled iframe so only one stream can play audio. */
  function suspendAll() {
    var key;
    for (key in pool) {
      if (!Object.prototype.hasOwnProperty.call(pool, key)) continue;
      stopIframe(pool[key].iframe);
      pool[key].loaded = false;
      pool[key].mounted = false;
    }
  }

  function park(iframe) {
    if (!iframe) return;
    var src = iframe.getAttribute('data-stream-src') || iframe.src || '';
    stopIframe(iframe);
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    ensurePark().appendChild(iframe);
    if (src && pool[src]) {
      pool[src].mounted = false;
      pool[src].loaded = false;
    }
  }

  function createIframe() {
    var iframe = document.createElement('iframe');
    iframe.className = 'live-iframe';
    iframe.title = 'Live stream player';
    iframe.loading = 'eager';
    iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
    iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('importance', 'high');
    return iframe;
  }

  function mount(src, ctx, userActivated) {
    if (!src || !ctx || !ctx.container) return null;

    suspendAll();

    if (ctx.onBeforeLoad) ctx.onBeforeLoad();

    preconnect(src);
    removePoster(ctx.container);

    var entry = pool[src];
    if (!entry) {
      entry = pool[src] = { iframe: createIframe(), loaded: false, mounted: false };
    }

    var iframe = entry.iframe;
    if (iframe.parentNode === ensurePark()) {
      ensurePark().removeChild(iframe);
    }

    iframe.style.display = 'block';
    ctx.container.insertBefore(iframe, ctx.bufOverlay || null);
    entry.mounted = true;

    if (global.PerfController) {
      if (global.PerfController.setIframeActive) global.PerfController.setIframeActive(true);
      else global.PerfController.setStreaming(true);
    }

    if (entry.loaded && iframe.src === src) {
      if (ctx.hideBuffer) ctx.hideBuffer();
      if (ctx.onFragBuffered) ctx.onFragBuffered();
      return iframe;
    }

    if (!ctx.skipBuffer && ctx.showBuffer) ctx.showBuffer();

    function onReady() {
      entry.loaded = true;
      if (ctx.hideBuffer) ctx.hideBuffer();
      if (ctx.onFragBuffered) ctx.onFragBuffered();
      if (global.PerfController && global.PerfController.onStreamStarted) {
        global.PerfController.onStreamStarted(ctx.container);
      }
    }

    if (!entry.loaded || iframe.getAttribute('data-stream-src') !== src) {
      iframe.setAttribute('data-stream-src', src);
      iframe.addEventListener('load', onReady, { once: true });
      iframe.addEventListener(
        'error',
        function () {
          entry.loaded = false;
          if (ctx.onFatal) ctx.onFatal(ctx.channel);
        },
        { once: true }
      );
      iframe.src = src;
    } else {
      onReady();
    }

    return iframe;
  }

  function detachFrom(container) {
    if (!container) return;
    removePoster(container);
    var iframe = container.querySelector('iframe.live-iframe');
    if (iframe) park(iframe);
    else suspendAll();
    if (global.PerfController) {
      var hasOther = container.querySelector('video');
      if (!hasOther && global.PerfController.setIframeActive) {
        global.PerfController.setIframeActive(false);
      }
    }
  }

  function warmChannels(channels) {
    if (!channels || !channels.length) return;
    var run = function () {
      for (var i = 0; i < channels.length; i++) {
        var src = channels[i].iframeSrc || '';
        if (src && !/\.m3u8(\?|$)/i.test(src)) preconnect(src);
      }
    };
    if (global.requestIdleCallback) global.requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 200);
  }

  global.IframePlayer = {
    preconnect: preconnect,
    mount: mount,
    detachFrom: detachFrom,
    park: park,
    suspendAll: suspendAll,
    warmChannels: warmChannels,
  };
})(window);
