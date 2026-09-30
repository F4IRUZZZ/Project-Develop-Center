// Helper status sesi hidup (satu kebenaran ambang 3 menit display).
// Dipakai kartu/tab beranda, detail proyek, dan halaman Sesi global.
export function sesiSegar(s: { status: string; last_seen_at: string }): boolean {
  return s.status === "active" && Date.now() - new Date(s.last_seen_at).getTime() <= 3 * 60 * 1000;
}
