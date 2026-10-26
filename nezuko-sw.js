self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    try {
      const text = event.data ? event.data.text() : "";
      data = { title: "Notification", body: text };
    } catch (_) {}
  }

  const title = (data && data.title) || "New notification";
  var actionMap = {};
  var actions = [];
  if (Array.isArray(data.actions)) {
    data.actions.slice(0, 2).forEach(function (a, i) {
      var id = "a" + i;
      actions.push({ action: id, title: String(a.label || "").slice(0, 24) });
      actionMap[id] = a.url;
    });
  }

  const opts = {
    body: (data && data.body) || "",
    icon: (data && data.icon) || undefined,
    image: (data && data.image) || undefined,
    badge: (data && (data.badge || data.icon)) || undefined,
    actions: actions.length ? actions : undefined,
    data: { url: (data && data.url) || "/", actions: actionMap },
    tag: (data && data.tag) || "nezuko-" + Date.now(),
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, opts).catch((err) => {
      console.error("[Nezuko SW] showNotification error:", err);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  const url = (event.action && d.actions && d.actions[event.action]) || d.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url === url && "focus" in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
