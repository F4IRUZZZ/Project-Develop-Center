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

for (const f of ["lib/streak.ts", "lib/github-stats.ts", "app/api/github/stats/route.ts", "app/statistik/page.tsx", "app/profil/page.tsx"]) {
  cek(f, existsSync(join(root, f)));
}

const lib = readFileSync(join(root, "lib/github-stats.ts"), "utf8");
cek("query contributionsCollection", lib.includes("contributionsCollection") && lib.includes("contributionCalendar"));
cek("query languages", lib.includes("languages(first: 5") && lib.includes("stargazerCount"));
cek("query profil (avatar+bio+follow)", lib.includes("avatarUrl") && lib.includes("followers { totalCount }") && lib.includes("following { totalCount }"));
cek("query totalCount repo", lib.includes("repositories(first: 100") && lib.includes("totalCount"));
cek("pagination penuh pageInfo", lib.includes("pageInfo") && lib.includes("hasNextPage") && lib.includes("endCursor"));
cek("starred user (tab Stars)", lib.includes("starredRepositories") && lib.includes("STARRED_AT") && lib.includes("nameWithOwner"));
cek("starred kaya GitHub (fork+update)", lib.includes("forkCount") && lib.includes("updatedAt") && lib.includes("RepoBintang"));
cek("tanpa perolehan-bintang lama", !lib.includes("repoTop") && !lib.includes("isFork"));
cek("segar bypass cache", lib.includes("segar = false") && lib.includes("!segar && lawas"));
cek("token server-side", lib.includes("tokenGitHub") && !lib.includes("localStorage"));
cek("cache 15 mnt", lib.includes("TTL_MS") && lib.includes("15 * 60 * 1000"));
cek("cap halaman anti-ledak", lib.includes("hal < 20"));
cek("stempel diperbarui", lib.includes("diperbarui"));
cek("timeout 15 dtk", lib.includes("AbortSignal.timeout(15000)"));

const route = readFileSync(join(root, "app/api/github/stats/route.ts"), "utf8");
cek("route auth sesiUser", route.includes("sesiUser"));
cek("route 401/502 jujur", route.includes("401") && route.includes("502"));
cek("route teruskan segar", route.includes('get("segar") === "1"') && route.includes("max-age=900"));

const prof = readFileSync(join(root, "app/profil/page.tsx"), "utf8");
cek("profil header ala GitHub (kamus)", prof.includes("profil.pengikut") && prof.includes("profil.mengikuti") && prof.includes("profil.repo"));
cek("profil hitung dibintangi", prof.includes("profil.bintangDiberi") && prof.includes("bintangDiberi"));
cek("profil seksi starred ala GitHub", prof.includes("profil.repoBintang") && prof.includes("profil.sudahBintang") && prof.includes("GitFork"));
cek("profil tombol Segarkan", prof.includes("profil.segarkan") && prof.includes("?segar=1") && prof.includes("profil.diperbarui"));
cek("profil statistik lebur (streak+ana)", prof.includes("stat.kini") && prof.includes("stat.anaJudul") && prof.includes("/api/stats/analytics"));
cek("profil link github", prof.includes("https://github.com/"));
cek("profil gate login", prof.includes("LoginCard"));

const ali = readFileSync(join(root, "app/statistik/page.tsx"), "utf8");
cek("statistik redirect ke profil", ali.includes('redirect("/profil")'));

const kamus = readFileSync(join(root, "lib/kamus.ts"), "utf8");
cek(
  "kamus profil ID+EN",
  ["nav.profil", "profil.judul", "profil.pengikut", "profil.mengikuti", "profil.repo", "profil.bintangDiberi", "profil.segarkan", "profil.diperbarui", "profil.repoBintang", "profil.repoBintangSub", "profil.repoBintangKosong", "profil.sudahBintang", "profil.diperbaruiRepo"].every(
    (k) => kamus.includes(`"${k}"`)
  )
);

const hal = readFileSync(join(root, "app/profil/page.tsx"), "utf8");
cek("halaman streak+bahasa (kamus)", hal.includes("stat.kini") && hal.includes("stat.bahasa"));
cek("halaman fmtTanggal locale", hal.includes("en-US") && hal.includes("stat.belumMulai"));
cek("halaman loading+error+retry (kamus)", hal.includes("stat.muat") && hal.includes("stat.cobaLagi") && hal.includes("stat.gagalJudul"));
cek("halaman gate login", hal.includes("LoginCard"));

const side = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("sidebar tanpa nav statistik", !side.includes('kunci: "nav.statistik"'));
cek("sidebar tanpa nav profil", !side.includes('kunci: "nav.profil"'));
cek("avatar sidebar link profil", side.includes('href="/profil"'));
const drawer = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("drawer tanpa statistik/profil", !drawer.includes('"/statistik"') && !drawer.includes('href="/profil"'));
const umenu = readFileSync(join(root, "components/shell/UserMenu.tsx"), "utf8");
cek("menu pengguna link profil", umenu.includes('href="/profil"') && umenu.includes("nav.profil"));

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
