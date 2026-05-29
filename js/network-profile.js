/**
 * Network awareness via Network Information API (graceful fallbacks).
 * Feeds buffer caps, initial quality cap, and ABR seed bitrate.
 */
(function (global) {
  'use strict';

  function conn() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }

  /**
   * @returns {{ tier: string, effectiveType: string, downlink: number, rtt: number, saveData: boolean,
   *            maxBufferLength: number, startLevel: number, maxBitrate: number, abrEwmaDefaultEstimate: number }}
   */
  function get() {
    var c = conn();
    var et = (c && c.effectiveType) || 'unknown';
    var dl = (c && typeof c.downlink === 'number') ? c.downlink : 10;
    var rtt = (c && typeof c.rtt === 'number') ? c.rtt : 80;
    var saveData = !!(c && c.saveData);

    var tier = 'mid';
    if (saveData || et === 'slow-2g' || et === '2g' || dl < 1.2 || rtt > 450) {
      tier = 'slow';
    } else if (et === '4g' && dl >= 8 && rtt < 120) {
      tier = 'fast';
    } else if (et === '3g' || dl < 4) {
      tier = 'mid';
    }

    // Live buffer depth (seconds)
    var maxBufferLength =
      tier === 'slow' ? 8 : tier === 'fast' ? 7 : 8;

    // Start at lowest rung on slow / save-data; one step up on fast for clarity
    var startLevel = tier === 'slow' || saveData ? 0 : tier === 'fast' ? 1 : 0;

    // Bitrate ceiling (bit/s) — soft cap for ABR on constrained links
    var maxBitrate =
      tier === 'slow' ? 900000 : tier === 'mid' ? 2800000 : 0;

    var abrEwmaDefaultEstimate =
      tier === 'slow' ? 280000 : tier === 'mid' ? 450000 : 1200000;

    return {
      tier: tier,
      effectiveType: et,
      downlink: dl,
      rtt: rtt,
      saveData: saveData,
      maxBufferLength: maxBufferLength,
      startLevel: startLevel,
      maxBitrate: maxBitrate,
      abrEwmaDefaultEstimate: abrEwmaDefaultEstimate,
    };
  }

  global.NetworkProfile = {
    get: get,
  };
})(window);
