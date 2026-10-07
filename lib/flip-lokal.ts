// Deteksi flip working->aktif di klien (#208): bandingkan himpunan proyek
// yang bekerja antar polling. Proyek yang hilang = giliran selesai ->
// toast + bunyi lokal instan via peringatanLokal (tanpa feed/Telegram/task).
// Inisialisasi diam: polling pertama hanya mencatat, tak membunyikan.
import { peringatanLokal } from "./peringatan";
import { bacaBahasa, t } from "./kamus";
import type { Project } from "./types";

export function idBekerja(daftar: Project[]): Set<string> {
  return new Set(daftar.filter((p) => p.sesiKerja === "bekerja").map((p) => p.id));
}

// Kembalikan himpunan terbaru untuk disimpan di ref. sebelum=null =
// polling pertama (diam).
export function cekFlip(sebelum: Set<string> | null, daftar: Project[]): Set<string> {
  const kini = idBekerja(daftar);
  if (sebelum !== null) {
    const nama = new Map(daftar.map((p) => [p.id, p.repoName]));
    for (const id of sebelum) {
      if (!kini.has(id) && nama.has(id)) {
        peringatanLokal(
          t(bacaBahasa(), "notifToast.selesai"),
          t(bacaBahasa(), "flip.pesan").replace("{repo}", nama.get(id) ?? id)
        );
      }
    }
  }
  return kini;
}
