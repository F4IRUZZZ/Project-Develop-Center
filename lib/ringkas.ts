// Ringkasan manusiawi: buang Markdown/struktur, pilih kalimat "selesai", format 1 baris + bullet.
// Dipakai oleh ingest (server) dan read-time (API lama).
export type Ringkasan = {
  utama: string;     // baris pertama ≤160, aman-emoji
  poin: string[];    // maks 3, tiap ≤100, aman-emoji
};

const KATA_SELESAI = /\b(selesai|berhasil|sudah|telah|done|fixed|merged|deployed|hijau|green|passing|lulus|ALL-OK|OK\b|sukses|beres)\b/i;
const KATA_AKSI = /\b(menambahkan|memperbaiki|mengubah|membuat|menghapus|mengganti|memindahkan|menambah|memperbarui|mengimplementasikan|menyimpan|menjalankan|menguji|added|fixed|updated|removed|changed|implemented|created|deployed|merged|refactor|refactored)\b/i;
const ARTEFAK = /(#\d+|PR\s*#?\d+|Issue\s*#?\d+|commit\b|[A-Za-z0-9_./-]+\.(ts|tsx|js|mjs|json|sql|css|md)\b)/i;
const KATA_RENCANA = /\b(rencana|plan|langkah|next|selanjutnya|berikutnya|opsional|pilihan|opsi|catatan|asumsi|risiko|akan|mau saya|saya akan|bisa saya|silakan|ketik|lanjut|konfirmasi|setuju|bagaimana|apakah)\b/i;
const KATA_BATASAN = /\b(tidak bisa|belum bisa|tidak dapat|saya tidak|maaf)\b/i;
const KATA_TUTUP = /^(siap|oke|ok|baik|selamat|sampai jumpa|terima kasih)\b/i;

function bersihkanMarkdown(teks: string): string {
  let t = teks;
  // Hapus code fence
  t = t.replace(/```[\s\S]*?```/g, "\n");
  // Hapus HTML comment
  t = t.replace(/<!--[\s\S]*?-->/g, "");
  // Gambar → drop
  t = t.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
  // Link → ambil teks
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Autolink <https://...> → drop
  t = t.replace(/<https?:\/\/[^>]+>/g, "");
  // URL mentah → drop (PR # number dijaga oleh ARTEFAK)
  t = t.replace(/https?:\/\/[^\s]+/g, "");
  // Inline code `x` → x
  t = t.replace(/`([^`\n]+)`/g, "$1");
  // Bold/italic/struck: ** **, __ __, * *, _ _, ~~ ~~
  t = t.replace(/\*\*([^*\n]+)\*\*/g, "$1");
  t = t.replace(/__([^_\n]+)__/g, "$1");
  t = t.replace(/\*([^*\n]+)\*/g, "$1");
  t = t.replace(/_([^_\n]+)_/g, "$1");
  t = t.replace(/~~([^~\n]+)~~/g, "$1");
  // Heading markers di awal baris
  t = t.replace(/^#{1,6}\s+/gm, "");
  // Horizontal rule
  t = t.replace(/^([-*_])\s*\1\s*\1\s*$/gm, "");
  // Table rows → drop seluruhnya
  t = t.replace(/^\s*\|.*\|\s*$/gm, "");
  // List markers → strip marker
  t = t.replace(/^[\s]*[-*+]\s+/gm, "");
  t = t.replace(/^[\s]*\d+\.\s+/gm, "");
  // Blockquote
  t = t.replace(/^>\s?/gm, "");
  // Checkbox
  t = t.replace(/^\s*[-*]\s*\[[ xX]\]\s+/gm, "");
  // Rapatkan whitespace tapi jaga newline
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function pecahKalimat(teks: string): string[] {
  // Split by . ! ? diikuti spasi/baru, plus newline boundaries
  const parts = teks.split(/(?<=[.!?])\s+|\n+/);
  return parts.map(s => s.trim()).filter(s => s.length >= 20);
}

function sudahRapi(teks: string): boolean {
  // Sudah bersih jika tidak ada tanda markdown & baris pertama ≤160 & bullet di baris selanjutnya
  if (/[#*`_\[\]\\|]/.test(teks)) return false;
  const lines = teks.split("\n");
  if (lines[0].length > 180) return false;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].startsWith("• ")) return false;
  }
  return true;
}

function potongAman(s: string, n: number): string {
  if ([...s].length <= n) return s;
  return [...s].slice(0, n).join("").trimEnd() + "…";
}

function skorKalimat(kalimat: string, idx: number, total: number): number {
  let skor = 0;
  if (KATA_SELESAI.test(kalimat)) skor += 4;
  if (KATA_AKSI.test(kalimat)) skor += 2;
  if (ARTEFAK.test(kalimat)) skor += 2;
  if (idx >= total * 0.6) skor += 1; // bagian akhir
  if (KATA_RENCANA.test(kalimat)) skor -= 5;
  if (KATA_BATASAN.test(kalimat)) skor -= 4;
  if (kalimat.endsWith("?")) skor -= 3;
  if (KATA_TUTUP.test(kalimat)) skor -= 2;
  if (kalimat.length < 40) skor -= 1;
  return skor;
}

export function ringkasTeks(teks: string, opts?: { maksUtama?: number; maksPoin?: number; maksTotal?: number }): Ringkasan {
  const maksUtama = opts?.maksUtama ?? 160;
  const maksPoin = opts?.maksPoin ?? 3;
  const maksTotal = opts?.maksTotal ?? 900;

  if (!teks?.trim()) return { utama: "", poin: [] };
  if (sudahRapi(teks)) {
    const lines = teks.split("\n");
    return { utama: potongAman(lines[0], maksUtama), poin: lines.slice(1).map(l => potongAman(l.slice(2), 100)).filter(Boolean) };
  }

  const bersih = bersihkanMarkdown(teks);
  if (!bersih) return { utama: "", poin: [] };

  const kalimat = pecahKalimat(bersih);
  if (kalimat.length === 0) {
    // Fallback: ambil 160 char pertama teks bersih
    return { utama: potongAman(bersih, maksUtama), poin: [] };
  }

  // Hitung skor
  const withScore = kalimat.map((k, i) => ({ teks: k, skor: skorKalimat(k, i, kalimat.length) }));
  withScore.sort((a, b) => b.skor - a.skor);
  const terbaik = withScore[0];

  let utama = terbaik.skor >= 2 ? terbaik.teks : kalimat[0];
  // Fallback: jika terbaik di awal tapi rencana, ambil kalimat berikut yang punya aksi
  if (terbaik.skor < 2) {
    for (const k of kalimat) {
      if (KATA_AKSI.test(k) || KATA_SELESAI.test(k) || ARTEFAK.test(k)) {
        utama = k;
        break;
      }
    }
  }

  utama = potongAman(utama, maksUtama);

  // Poin tambahan dari kalimat skor tinggi yang bukan utama
  const kandidatPoin = withScore
    .filter(x => x.teks !== utama && x.skor >= 2)
    .slice(0, maksPoin)
    .map(x => potongAman(x.teks, 100));

  // Dedup
  const poin: string[] = [];
  for (const p of kandidatPoin) {
    if (!poin.includes(p)) poin.push(p);
  }

  // Total cap
  let totalLen = utama.length + poin.reduce((a, b) => a + b.length + 2, 0);
  if (totalLen > maksTotal) {
    while (poin.length > 0 && totalLen > maksTotal) {
      poin.pop();
      totalLen = utama.length + poin.reduce((a, b) => a + b.length + 2, 0);
    }
  }

  return { utama, poin };
}

export function ringkasSatuBaris(teks: string, maks = 200): string {
  const r = ringkasTeks(teks, { maksUtama: maks });
  return r.utama;
}

export function ringkasTooltip(teks: string, maks = 280): string {
  const r = ringkasTeks(teks, { maksUtama: 160 });
  if (r.poin.length === 0) return r.utama;
  let out = r.utama + " · " + r.poin.join(" · ");
  if (out.length > maks) out = potongAman(out, maks);
  return out;
}

export function keTeks(r: Ringkasan): string {
  if (r.poin.length === 0) return r.utama;
  return r.utama + "\n" + r.poin.map(p => "• " + p).join("\n");
}