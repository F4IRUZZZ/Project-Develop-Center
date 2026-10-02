// Hitung streak kontribusi dari kalender harian GitHub. Murni (tanpa I/O)
// agar bisa diuji langsung via node. Konvensi: hari terakhir nol =
// "hari ini belum berkontribusi" (toleransi 1 hari), selebihnya putus.
export interface Hari {
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
}

export interface InfoStreak {
  kini: number;
  kiniMulai: string | null;
  kiniSampai: string | null;
  terpanjang: number;
  panjangMulai: string | null;
  panjangSampai: string | null;
  total: number;
  mulai: string | null;
  sampai: string | null;
}

function kosong(): InfoStreak {
  return {
    kini: 0,
    kiniMulai: null,
    kiniSampai: null,
    terpanjang: 0,
    panjangMulai: null,
    panjangSampai: null,
    total: 0,
    mulai: null,
    sampai: null,
  };
}

export function hitungStreak(hari: Hari[]): InfoStreak {
  const d = [...hari].sort((a, b) => (a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : 0));
  if (d.length === 0) return kosong();
  let total = 0;
  let terpanjang = 0;
  let panjangMulai: string | null = null;
  let panjangSampai: string | null = null;
  let jalan = 0;
  let jalanMulai = "";
  for (const h of d) {
    total += h.jumlah;
    if (h.jumlah > 0) {
      if (jalan === 0) jalanMulai = h.tanggal;
      jalan += 1;
      if (jalan > terpanjang) {
        terpanjang = jalan;
        panjangMulai = jalanMulai;
        panjangSampai = h.tanggal;
      }
    } else {
      jalan = 0;
    }
  }
  // Lari kini = ekor kalender; hari terakhir nol ditoleransi 1 hari
  // (hari ini belum berkontribusi) tanpa dihitung.
  let kini = 0;
  let kiniMulai: string | null = null;
  let kiniSampai: string | null = null;
  for (let i = d.length - 1; i >= 0; i--) {
    if (d[i].jumlah > 0) {
      kini += 1;
      kiniMulai = d[i].tanggal;
      if (kiniSampai === null) kiniSampai = d[i].tanggal;
    } else if (i === d.length - 1 && kini === 0) {
      continue;
    } else {
      break;
    }
  }
  const adaKini = kini > 0;
  return {
    kini,
    kiniMulai,
    kiniSampai,
    terpanjang,
    panjangMulai,
    panjangSampai,
    total,
    mulai: d[0].tanggal,
    sampai: d[d.length - 1].tanggal,
  };
}
