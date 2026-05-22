/**
 * DevTools guard — reacts like net22.cc: leaves the site immediately.
 * Add ?dev=1 to the URL to disable while developing.
 *
 * Note: Browsers cannot open the real "new tab" page from JS or force-close
 * user-opened tabs. We use history back + about:blank (closest behavior).
 */
(function () {
  'use strict';

  if (/[?&]dev=1\b/.test(location.search)) return;

  let terminated = false;
  let pollTimer = null;
  const bait = new Image();

  Object.defineProperty(bait, 'id', {
    get: function () {
      terminateSession();
      return '';
    },
  });

  function terminateSession() {
    if (terminated) return;
    terminated = true;

    if (pollTimer) clearInterval(pollTimer);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisibility);

    try {
      document.documentElement.innerHTML = '';
      document.head && (document.head.innerHTML = '');
      document.body && (document.body.innerHTML = '');
    } catch (_) {}

    try {
      document.open();
      document.close();
    } catch (_) {}

    // Try to close tab (works only if opened by script)
    try {
      window.open('', '_self');
      window.close();
    } catch (_) {}

    // Go back to page before this site (feels like leaving the site)
    try {
      if (history.length > 1) {
        history.go(1 - history.length);
      }
    } catch (_) {}

    // Blank the tab (empty screen — closest to "new" tab from JS)
    try {
      location.replace('about:blank');
    } catch (_) {
      location.href = 'about:blank';
    }

    try {
      window.stop();
    } catch (_) {}
  }

  function checkDockedDevTools() {
    const threshold = 100;
    const h = window.outerHeight - window.innerHeight;
    const w = window.outerWidth - window.innerWidth;
    if (h > threshold || w > threshold) terminateSession();
  }

  function checkConsoleOpen() {
    console.log(bait);
    console.dir(bait);
    console.clear();
  }

  function checkDebuggerPause() {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 80) terminateSession();
  }

  function runChecks() {
    if (terminated) return;
    checkDockedDevTools();
    checkConsoleOpen();
    checkDebuggerPause();
  }

  function onResize() {
    checkDockedDevTools();
  }

  function onFocus() {
    runChecks();
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      setTimeout(runChecks, 0);
      setTimeout(runChecks, 100);
    }
  }

  function isDevToolsShortcut(e) {
    if (e.key === 'F12') return true;
    const key = e.key && e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) return true;
    if ((e.ctrlKey || e.metaKey) && key === 'u') return true;
    if (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) return true;
    return false;
  }

  document.addEventListener(
    'keydown',
    function (e) {
      if (isDevToolsShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        terminateSession();
      }
    },
    true
  );

  document.addEventListener(
    'contextmenu',
    function (e) {
      e.preventDefault();
      terminateSession();
    },
    true
  );

  window.addEventListener('resize', onResize);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisibility);

  pollTimer = setInterval(runChecks, 150);
  runChecks();
})();
