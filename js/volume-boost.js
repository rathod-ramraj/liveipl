/**
 * Boost HTML5 video volume above 1.0 via Web Audio (live HLS / native only).
 */
(function (global) {
  'use strict';

  var DEFAULT_GAIN = 1.45;
  var audioCtx = null;

  function getContext() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (global.AudioContext || global.webkitAudioContext)();
    } catch (_) {}
    return audioCtx;
  }

  function resumeContext() {
    var ctx = getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
  }

  function attach(video, gain) {
    if (!video || video._volBoosted) return;
    video.muted = false;
    video.volume = 1;
    video.defaultMuted = false;

    var ctx = getContext();
    if (!ctx) return;

    try {
      var source = ctx.createMediaElementSource(video);
      var gainNode = ctx.createGain();
      gainNode.gain.value = typeof gain === 'number' ? gain : DEFAULT_GAIN;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      video._volBoosted = true;
      video._gainNode = gainNode;
      resumeContext();
    } catch (_) {
      video.volume = 1;
      video.muted = false;
    }
  }

  if (!global._volBoostResumeBound) {
    global._volBoostResumeBound = true;
    global.addEventListener('click', resumeContext, { passive: true });
    global.addEventListener('keydown', resumeContext, { passive: true });
  }

  global.VolumeBoost = {
    attach: attach,
    resume: resumeContext,
    GAIN: DEFAULT_GAIN,
  };
})(window);
