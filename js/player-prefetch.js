/**
 * Manifest + segment warm-up for faster HLS startup (Willow / m3u8 channels).
 */
(function (global) {
  'use strict';

  var warmed = new Set();
  var warmHlsInstances = {};

  function warmManifest(url) {
    if (!url || !/^https?:/i.test(url)) return Promise.resolve();
    return fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'default',
    }).catch(function () {
      return fetch(url, { mode: 'cors', credentials: 'omit' });
    });
  }

  function resolveSegmentUrl(manifestText, baseUrl) {
    var lines = manifestText.split('\n');
    for (var i = lines.length - 1; i >= 0; i--) {
      var line = lines[i].trim();
      if (!line || line.indexOf('#') === 0) continue;
      try {
        return new URL(line, baseUrl).href;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  /**
   * Fetches live playlist + first media segment into HTTP / SW cache.
   */
  function warmHlsDeep(url) {
    if (!url || warmed.has(url)) return Promise.resolve();
    warmed.add(url);

    return warmManifest(url).then(function (res) {
      if (!res || !res.ok) return;
      return res.text().then(function (text) {
        var seg = resolveSegmentUrl(text, url);
        if (!seg) return;
        return fetch(seg, { mode: 'cors', credentials: 'omit', cache: 'default' }).catch(
          function () {}
        );
      });
    });
  }

  function scheduleWarm(url) {
    if (!url) return;
    if (/\.m3u8(\?|$)/i.test(url)) {
      warmHlsDeep(url);
    } else if (/^https?:/i.test(url)) {
      var run = function () {
        fetch(url, { mode: 'no-cors', credentials: 'omit' }).catch(function () {});
      };
      if (global.requestIdleCallback) {
        global.requestIdleCallback(run, { timeout: 2000 });
      } else {
        setTimeout(run, 100);
      }
    }
  }

  function whenHlsReady(cb) {
    if (global.Hls && global.Hls.isSupported()) {
      cb();
      return;
    }
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if ((global.Hls && global.Hls.isSupported()) || tries > 100) {
        clearInterval(iv);
        if (global.Hls && global.Hls.isSupported()) cb();
      }
    }, 40);
  }

  function startBackgroundHls(url) {
    if (!url || !/\.m3u8(\?|$)/i.test(url)) return;
    if (warmHlsInstances[url]) return;
    whenHlsReady(function () {
      var HlsLib = global.Hls;
      if (!HlsLib || !HlsLib.isSupported() || warmHlsInstances[url]) return;

      var cfgBuilder = global.LiveStreamConfig && global.LiveStreamConfig.buildHlsConfig;
      var cfg =
        typeof cfgBuilder === 'function'
          ? cfgBuilder(global.NetworkProfile && global.NetworkProfile.get(), { lowLatency: true })
          : {};

      var video = document.createElement('video');
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.playsInline = true;
      video.preload = 'auto';
      video.style.cssText =
        'position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:-9999px;z-index:-1';

      var hls = new HlsLib(cfg);
      hls.loadSource(url);
      hls.attachMedia(video);
      document.body.appendChild(video);
      video.play().catch(function () {});

      warmHlsInstances[url] = { hls: hls, video: video, url: url };
    });
  }

  function acquireWarmHls(url) {
    var entry = warmHlsInstances[url];
    if (!entry) return null;
    delete warmHlsInstances[url];
    setTimeout(function () {
      startBackgroundHls(url);
    }, 1500);
    return entry;
  }

  function prefetchChannels(channels, priorityIds) {
    if (!channels || !channels.length) return;
    var prio = priorityIds || ['eng', 'willow2', 'willowhd'];
    var prioSet = {};
    for (var p = 0; p < prio.length; p++) prioSet[prio[p]] = true;

    function warmOne(ch, deep) {
      var src = ch.iframeSrc || ch.src || '';
      if (!src) return;
      if (/\.m3u8(\?|$)/i.test(src)) {
        if (deep) {
          warmHlsDeep(src);
          startBackgroundHls(src);
        } else {
          scheduleWarm(src);
        }
      } else {
        scheduleWarm(src);
      }
    }

    for (var i = 0; i < channels.length; i++) {
      if (prioSet[channels[i].id]) warmOne(channels[i], true);
    }
    for (var j = 0; j < channels.length; j++) {
      if (!prioSet[channels[j].id]) warmOne(channels[j], false);
    }
  }

  global.PlayerPrefetch = {
    warmManifest: warmManifest,
    warmHlsDeep: warmHlsDeep,
    scheduleWarm: scheduleWarm,
    prefetchChannels: prefetchChannels,
    acquireWarmHls: acquireWarmHls,
    startBackgroundHls: startBackgroundHls,
  };
})(window);
