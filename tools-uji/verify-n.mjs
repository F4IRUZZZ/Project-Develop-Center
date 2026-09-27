import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// N2 — Topbar hidup
for (const f of ["components/shell/UserMenu.tsx", "components/shell/SearchBox.tsx"]) {
  cek(f, existsSync(join(root, f)));
}
const topbar = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("N2 bell link /notifikasi", topbar.includes("/notifikasi"));
cek("N2 UserMenu", topbar.includes("UserMenu"));
cek("N2 SearchBox", topbar.includes("SearchBox"));

// N3 — Scroll notifikasi
const notifPage = readFileSync(join(root, "app/notifikasi/page.tsx"), "utf8");
cek("N3 scroll notifikasi max-h", notifPage.includes("max-h-[520px]"));

// N4 — Search event + filter live
const searchBox = readFileSync(join(root, "components/shell/SearchBox.tsx"), "utf8");
cek("N4 EVENT_SEARCH export", searchBox.includes("EVENT_SEARCH"));
cek("N4 dispatch pdc-search", searchBox.includes("pdc-search"));
const proyekPage = readFileSync(join(root, "app/proyek/page.tsx"), "utf8");
cek("N4 proyek dengar EVENT_SEARCH", proyekPage.includes("EVENT_SEARCH"));
cek("N4 filter kataKunci proyek", proyekPage.includes("kataKunci"));
const homePage = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("N4 home dengar EVENT_SEARCH", homePage.includes("EVENT_SEARCH"));

// N1 — Pengaturan
const pengaturan = readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8");
cek("N1 seksi Profil", pengaturan.includes("Profil") || pengaturan.includes("profil"));
cek("N1 seksi Tampilan/Tema", pengaturan.includes("Tampilan") || pengaturan.includes("tema"));
cek("N1 Danger Zone / Cabut", pengaturan.includes("Danger") || pengaturan.includes("danger") || pengaturan.includes("Cabut"));

if (gagal > 0) {
  console.log(`\nN-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nN-CEK: ALL-OK");
