import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;

function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` - ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const lib = join(root, "lib/ringkas.ts");
cek("lib/ringkas.ts ada", existsSync(lib));

// Import fungsi normalizer (Node 24+ supports .ts)
let ringkasTeks, ringkasSatuBaris, ringkasTooltip, keTeks;
try {
  const mod = await import("../lib/ringkas.ts");
  ringkasTeks = mod.ringkasTeks;
  ringkasSatuBaris = mod.ringkasSatuBaris;
  ringkasTooltip = mod.ringkasTooltip;
  keTeks = mod.keTeks;
  cek("import ringkas.ts", true);
} catch (e) {
  cek("import ringkas.ts", false, String(e));
  process.exit(1);
}

// 1. Buang heading, bold, tabel, code fence, link
const md = "## Rencana final **Keputusan:** tanpa cron\n### Perubahan\n| File | Perubahan |\n|---|---|\n| a.ts | tambah |\n```js\nconsole.log('hi')\n```\nLihat [PR #123](https://github.com/x/y/pull/123) untuk detail.";
const r1 = ringkasTeks(md);
cek("heading dibuang", !/^#{1,6}\s/.test(r1.utama) && !r1.utama.startsWith("#"));
cek("bold dibuang", !r1.utama.includes("**"));
cek("tabel dibuang", !r1.utama.includes("|"));
cek("code fence dibuang", !r1.utama.includes("```"));
// Link text preserved somewhere in output (not necessarily utama)
const full1 = keTeks(r1);
cek("link → teks saja", full1.includes("PR #123") && !full1.includes("https://"));

// 2. Pilih kalimat "selesai" di atas rencana
const campur = "Rencana: akan buat file.\nSudah memperbaiki bug #123 dan deploy.\nKetik lanjut.";
const r2 = ringkasTeks(campur);
cek("pilih kalimat selesai", r2.utama.includes("memperbaiki") || r2.utama.includes("deploy"));
cek("bukan rencana", !r2.utama.toLowerCase().includes("rencana"));
cek("bukan CTA", !r2.utama.includes("Ketik lanjut"));

// 3. Fallback bila hanya rencana
const hanyaRencana = "## Rencana\nLangkah 1: buat file.\nLangkah 2: tes.";
const r3 = ringkasTeks(hanyaRencana);
cek("fallback kalimat pertama", r3.utama.length > 0 && r3.utama.length <= 160);

// 4. Disclaimer tidak dipilih jika ada kalimat kerja
const disclaimer = "Saya tidak bisa baca gambar. Sudah memperbaiki F11.\nBisa jelaskan?";
const r4 = ringkasTeks(disclaimer);
cek("disclaimer tidak menang", r4.utama.includes("memperbaiki") && !r4.utama.includes("tidak bisa"));

// 5. Emoji aman (tidak terpotong surrogate)
const emojiTeks = "Selesai 🎉 tes 🎉🎉";
const r5 = ringkasSatuBaris(emojiTeks, 10);
cek("emoji aman", !r5.includes("�") && [...r5].length <= 10);

// 6. Idempoten: teks sudah bersih dikembalikan apa adanya
const rapi = "Fix F11 selesai — Issue #67 + PR #68\n• test hijau\n• build ok";
const r6a = ringkasTeks(rapi);
const r6b = ringkasTeks(keTeks(r6a));
cek("idempoten", keTeks(r6a) === keTeks(r6b));

// 7. Bullet maks 3, total ≤900
const banyak = "Utama.\n- poin 1\n- poin 2\n- poin 3\n- poin 4\n- poin 5";
const r7 = ringkasTeks(banyak, { maksPoin: 3, maksTotal: 900 });
cek("bullet ≤3", r7.poin.length <= 3);
cek("total ≤900", keTeks(r7).length <= 900);

// 8. ringkasSatuBaris cap
const panjang = "a".repeat(500);
const r8 = ringkasSatuBaris(panjang, 50);
cek("cap ringkasSatuBaris", r8.length <= 51 && r8.endsWith("…"));

// 9. ringkasTooltip join dengan " · "
const tp = ringkasTooltip("Utama.\n• poin1\n• poin2", 280);
cek("tooltip format", tp.includes(" · ") && tp.startsWith("Utama"));

// 10. keTeks format
const kt = keTeks({ utama: "A", poin: ["B", "C"] });
cek("keTeks newline bullet", kt === "A\n• B\n• C");

// 11. Teks kosong
const r11 = ringkasTeks("");
cek("kosong aman", r11.utama === "" && r11.poin.length === 0);

// 12. Hanya whitespace
const r12 = ringkasTeks("   \n\n  ");
cek("whitespace aman", r12.utama === "" && r12.poin.length === 0);

if (gagal > 0) {
  console.log(`\nRINGKASAN: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nRINGKASAN: ALL-OK");