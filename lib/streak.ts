// Hitung streak kontribusi dari kalender harian GitHub. Murni (tanpa I/O)
// agar bisa diuji langsung via node. Konvensi: hari terakhir nol =
// "hari ini belum berkontribusi" (toleransi 1 hari), selebihnya putus.
export interface Hari {
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
}

export interface InfoStreak {
  kini: number;
  terpanjang: number;
  total: number;
  mulai: string | null;
  sampai: string | null;
}

export function hitungStreak(hari: Hari[]): InfoStreak {
  const d = [...hari].sort((a, b) => (a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : 0));
  let total = 0;
  let terpanjang = 0;
  let jalan = 0;
  for (const h of d) {
    total += h.jumlah;
    if (h.jumlah > 0) {
      jalan += 1;
      if (jalan > terpanjang) terpanjang = jalan;
    } else {
      jalan = 0;
    }
  }
  let kini = 0;
  for (let i = d.length - 1; i >= 0; i--) {
    if (d[i].jumlah > 0) {
      kini += 1;
    } else if (i === d.length - 1) {
      continue;
    } else {
      break;
    }
  }
  return { kini, terpanjang, total, mulai: d[0]?.tanggal ?? null, sampai: d[d.length - 1]?.tanggal ?? null };
}
