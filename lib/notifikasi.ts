// Notifikasi turunan (E2, diperluas P3): tanpa tabel baru, via
// /api/notifications. Penting = pr/error + info "Selesai:" 24 jam terakhir.
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

export interface Notifikasi extends ActivityMentah {
  dibaca: boolean;
}

export async function fetchNotifikasi(): Promise<Notifikasi[]> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) throw new Error(`API notifications ${res.status}`);
  return (await res.json()) as Notifikasi[];
}

export async function tandaiDibaca(activityId?: string): Promise<void> {
  const res = await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activityId ? { activity_id: activityId } : { semua: true }),
  });
  if (!res.ok) throw new Error(`API notifications/read ${res.status}`);
}
