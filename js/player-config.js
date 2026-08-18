/**
 * Live HLS player - configuration only.
 * Tuned for fast startup, 3–6s live buffer window, stable ABR, LL-HLS alignment.
 */
(function (global) {
  'use strict';

  /** Base defaults (overridden by network profile + runtime flags). */
  var BASE = {
    debug: false,

    // Low-latency live
    lowLatencyMode: true,
    liveDurationInfinity: true,

    // Sync closer to live edge (fewer segments behind = lower delay, slightly less cushion)
    liveSyncDurationCount: 2,
    liveMaxLatencyDurationCount: 8,

    // cap buffer depth for live (seconds) - slightly deeper for fewer stalls
    maxBufferLength: 8,
    maxMaxBufferLength: 18,
    backBufferLength: 12,

    // Stall / frag tuning
    highBufferWatchdogPeriod: 1,
    nudgeMaxRetry: 12,
    maxFragLookUpTolerance: 0.35,
    maxStarvationDelay: 3.5,
    maxLoadingDelay: 3.5,

    // Retries (error recovery)
    fragLoadingMaxRetry: 8,
    fragLoadingRetryDelay: 800,
    manifestLoadingMaxRetry: 8,
    manifestLoadingRetryDelay: 800,

    // ABR stability: less aggressive ramp than default, fewer rungs
    abrEwmaSlowLive: 6,
    abrEwmaFastLive: 3,
    abrBandWidthFactor: 0.85,
    abrBandWidthUpFactor: 0.65,
    abrMaxWithRealBitrate: true,

    // Manual first fragment control (paired with autoStartLoad in PlayerCore)
    autoStartLoad: false,
  };

  /**
   * Builds hls.js config merged with NetworkProfile hints.
   * @param {object|null} net - from NetworkProfile.get()
   * @param {{ lowLatency?: boolean, startLevel?: number }} opts
   */
  function buildHlsConfig(net, opts) {
    var o = opts || {};
    var low = o.lowLatency !== false;

    var maxBuf = net && typeof net.maxBufferLength === 'number' ? net.maxBufferLength : 8;
    var maxMax = Math.min(20, maxBuf + 6);

    var startLevel =
      typeof o.startLevel === 'number'
        ? o.startLevel
        : net && typeof net.startLevel === 'number'
          ? net.startLevel
          : 0;

    var cfg = Object.assign({}, BASE, {
      lowLatencyMode: low,
      maxBufferLength: maxBuf,
      maxMaxBufferLength: maxMax,
      backBufferLength: Math.min(10, maxBuf + 2),

      // Start on a lower rung for instant decode; ABR ramps using slow EWMA
      startLevel: startLevel,
      abrEwmaDefaultEstimate:
        net && typeof net.abrEwmaDefaultEstimate === 'number'
          ? net.abrEwmaDefaultEstimate
          : low
            ? 450000
            : 280000,

      // Shorter live catch-up when network is fast; slightly more slack when slow
      liveSyncDurationCount: net && net.tier === 'slow' ? 3 : 2,
      liveMaxLatencyDurationCount: net && net.tier === 'slow' ? 12 : 8,
    });

    return cfg;
  }

  global.LiveStreamConfig = {
    buildHlsConfig: buildHlsConfig,
    BASE: BASE,
  };
})(window);
