/** Lightweight analytics bridge - call LiveStreamAnalytics.get() from devtools or your pipeline. */
(function (global) {
  'use strict';

  global.LiveStreamAnalytics = {
    get: function () {
      return global.LivePlayerCore && global.LivePlayerCore.getMetrics
        ? global.LivePlayerCore.getMetrics()
        : null;
    },
    log: function () {
      var m = this.get();
      if (m && global.console && console.log) {
        console.log('[LiveStream metrics]', m);
      }
    },
  };
})(window);
