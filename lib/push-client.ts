// Langganan Web Push di browser (client-only). Kunci public via env;
// service worker tanpa cache manual agar tak ada shell basi.
function b64keU8(base64: string): Uint8Array {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const bin = window.atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function pushDidukung(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}

async function reg(): Promise<ServiceWorkerRegistration | null> {
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function statusPush(): Promise<"aktif" | "mati" | "tak-dukung" | "tanpa-kunci"> {
  if (!pushDidukung()) return "tak-dukung";
  if (!process.env.NEXT_PUBLIC_PUSH_VAPID_PUBLIC) return "tanpa-kunci";
  try {
    const r = await navigator.serviceWorker.ready;
    const sub = await r.pushManager.getSubscription();
    return sub ? "aktif" : "mati";
  } catch {
    return "mati";
  }
}

export async function nyalakanPush(): Promise<boolean> {
  try {
    const r = (await reg()) ?? (await navigator.serviceWorker.ready);
    const publik = process.env.NEXT_PUBLIC_PUSH_VAPID_PUBLIC;
    if (!publik) return false;
    const sub = await r.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64keU8(publik).buffer as ArrayBuffer,
    });
    const json = sub.toJSON();
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function matikanPush(): Promise<boolean> {
  try {
    const r = await navigator.serviceWorker.ready;
    const sub = await r.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    } else {
      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }
    return true;
  } catch {
    return false;
  }
}
