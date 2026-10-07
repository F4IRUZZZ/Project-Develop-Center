import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

function baca(p) {
  return readFileSync(join(root, p), "utf8");
}

// L1 — tombol mati hilang
cek("tanpa Tambah Proyek", !baca("components/dashboard/Dashboard.tsx").includes("Tambah Proyek"));

// L2 — skeleton, bukan mock
const stats = baca("components/dashboard/Stats.tsx");
cek("skeleton pulse (#214)", stats.includes("animate-pulse") && !stats.includes("mockStats") && !stats.includes('"—"'));

// L3 — shadcn di devDependencies
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
cek("shadcn devDeps", Boolean(pkg.devDependencies?.shadcn) && !pkg.dependencies?.shadcn);

// L4 — next/image
for (const f of ["components/shell/Sidebar.tsx", "components/shell/UserMenu.tsx", "components/shell/LoginLanding.tsx"]) {
  cek(`${f} next/image`, baca(f).includes('from "next/image"'));
}
cek("remotePatterns avatar", baca("next.config.ts").includes("avatars.githubusercontent.com"));

// L5 — tema terpusat
const peng = baca("app/pengaturan/page.tsx");
cek("pengaturan terapkanTema", peng.includes("terapkanTema(value)"));
cek("tanpa setItem manual", !peng.includes("localStorage.setItem"));

// L6 — dead code hilang
const notif = baca("lib/notifikasi.ts");
cek("tanpa fetchPenting/cs", !notif.includes("fetchPenting") && !notif.includes("saringPenting") && !notif.includes("adalahPenting"));
const tasks = baca("lib/tasks.ts");
cek("tanpa listByProject/pendingCount", !tasks.includes("listByProject") && !tasks.includes("pendingCount"));

if (gagal > 0) {
  console.log(`\nAUDIT3-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nAUDIT3-CEK: ALL-OK");
