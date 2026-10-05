// Service worker PDC: tampilkan Web Push sebagai notifikasi sistem
// (tray HP) + buka /notifikasi saat diketuk. Tanpa cache manual (biar
// tak ada risiko shell basi seperti kasus drawer kemarin).
self.addEventListener("push", (event) => {
  let data = { judul: "PDC", body: "", url: "/notifikasi", tag: "pdc" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* abaikan: pakai default */
  }
  const p = self.registration.showNotification(data.judul, {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/notifikasi" },
  });
  if (event.waitUntil) event.waitUntil(p);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifikasi";
  const p = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((daftar) => {
      for (const c of daftar) {
        if (c.url.includes(self.location.origin)) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    });
  if (event.waitUntil) event.waitUntil(p);
});
