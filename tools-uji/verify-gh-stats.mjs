import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hitungStreak } from "../lib/streak.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["lib/streak.ts", "lib/github-stats.ts", "app/api/github/stats/route.ts", "app/statistik/page.tsx"]) {
  cek(f, existsSync(join(root, f)));
}

const lib = readFileSync(join(root, "lib/github-stats.ts"), "utf8");
cek("query contributionsCollection", lib.includes("contributionsCollection") && lib.includes("contributionCalendar"));
cek("query languages", lib.includes("languages(first: 5") && lib.includes("stargazerCount"));
cek("token server-side", lib.includes("tokenGitHub") && !lib.includes("localStorage"));
cek("cache 1 jam", lib.includes("TTL_MS") && lib.includes("60 * 60 * 1000"));
cek("timeout 15 dtk", lib.includes("AbortSignal.timeout(15000)"));

const route = readFileSync(join(root, "app/api/github/stats/route.ts"), "utf8");
cek("route auth sesiUser", route.includes("sesiUser"));
cek("route 401/502 jujur", route.includes("401") && route.includes("502"));

const hal = readFileSync(join(root, "app/statistik/page.tsx"), "utf8");
cek("halaman streak+bahasa", hal.includes("Streak") && hal.includes("Bahasa"));
cek("halaman loading+error+retry", hal.includes("Memuat") && hal.includes("Coba lagi"));
cek("halaman gate login", hal.includes("LoginCard"));

const side = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("nav sidebar Statistik", side.includes('"/statistik"') && side.includes("ChartColumn"));
const bottom = readFileSync(join(root, "components/shell/BottomNav.tsx"), "utf8");
cek("nav HP Statistik", bottom.includes('"/statistik"'));

// Uji unit streak dengan fixture (bukan assert string).
const fx = [
  { tanggal: "2026-09-25", jumlah: 3 },
  { tanggal: "2026-09-26", jumlah: 0 },
  { tanggal: "2026-09-27", jumlah: 2 },
  { tanggal: "2026-09-28", jumlah: 1 },
  { tanggal: "2026-09-29", jumlah: 0 }, // ujung nol = hari ini, ditoleransi
];
const s = hitungStreak(fx);
cek("streak kini=2", s.kini === 2, `dapat ${s.kini}`);
cek("streak terpanjang=2", s.terpanjang === 2, `dapat ${s.terpanjang}`);
cek("streak total=6", s.total === 6, `dapat ${s.total}`);
cek("streak rentang", s.mulai === "2026-09-25" && s.sampai === "2026-09-29");
cek("streak kini rentang tanggal", s.kiniMulai === "2026-09-27" && s.kiniSampai === "2026-09-28");
cek("streak panjang rentang tanggal", s.panjangMulai === "2026-09-27" && s.panjangSampai === "2026-09-28");
const kosong = hitungStreak([]);
cek(
  "streak kosong aman",
  kosong.kini === 0 && kosong.total === 0 && kosong.mulai === null && kosong.kiniMulai === null && kosong.panjangMulai === null
);

if (gagal > 0) {
  console.log(`\nGH-STATS: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nGH-STATS: ALL-OK");
