self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || "Notification";
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
    body: data.body || "",
    icon: data.icon || undefined,
    image: data.image || undefined,
    badge: data.badge || undefined,
    actions: actions.length ? actions : undefined,
    data: { url: data.url || "/", actions: actionMap },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
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
