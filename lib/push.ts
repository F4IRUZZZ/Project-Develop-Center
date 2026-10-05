// Web Push keluar (system tray HP). VAPID private hanya server-side.
// Langganan mati (404/410) dihapus otomatis. Best-effort: gagal = diam.
import webpush from "web-push";
import { db } from "@/lib/db";

function vapid(): boolean {
  const priv = process.env.PUSH_VAPID_PRIVATE;
  if (!priv) return false;
  try {
    webpush.setVapidDetails("mailto:admin@project-develop-center", process.env.NEXT_PUBLIC_PUSH_VAPID_PUBLIC ?? "", priv);
    return true;
  } catch {
    return false;
  }
}

export interface HasilPush {
  terkirim: number;
  dibersihkan: number;
}

export async function kirimPush(userId: string, judul: string, body: string): Promise<HasilPush> {
  const hasil: HasilPush = { terkirim: 0, dibersihkan: 0 };
  if (!vapid()) return hasil;
  let daftar: Array<{ endpoint: string; p256dh: string; auth: string }> = [];
  try {
    daftar = (await db()`SELECT endpoint, p256dh, auth FROM push_langganan WHERE user_id = ${userId}`) as typeof daftar;
  } catch {
    return hasil;
  }
  const payload = JSON.stringify({ judul, body, url: "/notifikasi", tag: `pdc-${Date.now()}` });
  for (const s of daftar) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      hasil.terkirim += 1;
    } catch (e) {
      const kode = (e as { statusCode?: number })?.statusCode;
      if (kode === 404 || kode === 410) {
        try {
          await db()`DELETE FROM push_langganan WHERE endpoint = ${s.endpoint}`;
          hasil.dibersihkan += 1;
        } catch {
          /* abaikan */
        }
      }
    }
  }
  return hasil;
}
