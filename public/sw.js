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
  // Ikon PNG (SVG digagalkan sebagian WebView) + fallback tanpa ikon:
  // teks polos tetap muncul daripada sunyi total.
  const dasar = {
    body: data.body || "",
    tag: data.tag,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/notifikasi" },
  };
  const tampil = async () => {
    try {
      await self.registration.showNotification(data.judul, {
        ...dasar,
        icon: "/apple-icon.png",
        badge: "/apple-icon.png",
      });
    } catch {
      await self.registration.showNotification(data.judul, dasar);
    }
  };
  if (event.waitUntil) event.waitUntil(tampil());
  else void tampil();
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
