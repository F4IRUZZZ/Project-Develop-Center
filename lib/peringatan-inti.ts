// Inti murni deteksi notifikasi baru (tanpa I/O, tanpa import) agar bisa
// diuji langsung via node. Sisi efek (bunyi/notif/toast) di peringatan.ts.
export interface BarisBaru {
  id: string;
  type: string;
  message: string;
  repo_name?: string;
  dibaca: boolean;
}

// Kembalikan ID yang baru muncul dan penting. `terlihat` = set ID yang
// sudah dikenal; null = fetch pertama (inisialisasi diam, tanpa hasil).
export function barisBaruPenting(rows: BarisBaru[], terlihat: Set<string> | null): { baru: BarisBaru[]; terlihat: Set<string> } {
  const belum = rows.filter((r) => !r.dibaca);
  if (terlihat === null) {
    return { baru: [], terlihat: new Set(belum.map((r) => r.id)) };
  }
  const baru = belum.filter((r) => !terlihat.has(r.id));
  for (const r of baru) terlihat.add(r.id);
  if (terlihat.size > 500) {
    return { baru, terlihat: new Set(belum.map((r) => r.id)) };
  }
  return { baru, terlihat };
}
