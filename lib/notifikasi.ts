// Notifikasi turunan (E2): tanpa tabel baru, dibaca dari activity_log mentah
// via /api/activity?format=mentah. Penting = tipe pr/error 24 jam terakhir.
export const EVENT_NOTIF = "pdc-notif";

export function siarNotifikasi() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT_NOTIF));
}
export interface ActivityMentah {
  id: string;
  project_id: string;
  repo_name?: string;
  type: string;
  message: string;
  created_at: string;
}

const TIPE_PENTING = new Set(["pr", "error"]);
const BATAS_MS = 24 * 3600 * 1000;

export function adalahPenting(r: ActivityMentah, kini = Date.now()): boolean {
  if (!TIPE_PENTING.has(r.type)) return false;
  return kini - new Date(r.created_at).getTime() < BATAS_MS;
}

export function saringPenting(rows: ActivityMentah[], kini = Date.now()): ActivityMentah[] {
  return rows.filter((r) => adalahPenting(r, kini));
}

export async function fetchPenting(): Promise<ActivityMentah[]> {
  const res = await fetch("/api/activity?format=mentah", { cache: "no-store" });
  if (!res.ok) throw new Error(`API activity ${res.status}`);
  const rows = (await res.json()) as ActivityMentah[];
  return saringPenting(rows);
}

export interface Notifikasi extends ActivityMentah {
  dibaca: boolean;
}

export async function fetchNotifikasi(): Promise<Notifikasi[]> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) throw new Error(`API notifications ${res.status}`);
  return (await res.json()) as Notifikasi[];
}

export async function tandaiDibaca(activityId?: string): Promise<void> {
  await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activityId ? { activity_id: activityId } : { semua: true }),
  });
}
