import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { bacaBahasa, simpanBahasa, t } from "../lib/kamus.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["lib/kamus.ts", "components/shell/BahasaProvider.tsx", "components/shell/PemilihBahasa.tsx"]) {
  cek(f, existsSync(join(root, f)));
}

const kamus = readFileSync(join(root, "lib/kamus.ts"), "utf8");
const pasangan = [...kamus.matchAll(/"([A-Za-z0-9.]+)":\s*\{\s*id:\s*"([^"]+)",\s*en:\s*"([^"]+)"/g)];
cek("kunci >= 30", pasangan.length >= 30, `dapat ${pasangan.length}`);
cek("semua en non-empty", pasangan.every((m) => m[3].trim().length > 0));
cek("SSR-aman + default id", kamus.includes('typeof window === "undefined"') && kamus.includes("pdc-bahasa"));
cek("fallback Indonesia", kamus.includes("?? KAMUS[kunci].id"));

// Uji fungsi beneran (bukan assert string). Node tanpa window = default id.
cek("default id tanpa window", bacaBahasa() === "id");
cek("t id", t("id", "nav.proyek") === "Proyek");
cek("t en", t("en", "nav.proyek") === "Projects");
simpanBahasa("en"); // tanpa window = no-op, tak boleh throw
cek("simpan tanpa window aman", bacaBahasa() === "id");

const shell = readFileSync(join(root, "components/shell/AppShell.tsx"), "utf8");
cek("provider di AppShell", shell.includes("BahasaProvider"));
for (const [f, kunci] of [
  ["components/shell/Sidebar.tsx", "nav.proyek"],
  ["components/shell/BottomNav.tsx", "nav.statistik"],
  ["components/shell/SearchBox.tsx", "search.placeholder"],
  ["components/shell/UserMenu.tsx", "user.keluar"],
  ["components/shell/LoginLanding.tsx", "landing.sambut"],
  ["components/dashboard/LoginCard.tsx", "gate.cta"],
  ["components/ui/ConfirmModal.tsx", "modal.batal"],
]) {
  const isi = readFileSync(join(root, f), "utf8");
  cek(`${f.split("/").pop()} pakai kamus`, isi.includes("useBahasa") && isi.includes(kunci));
}
const atur = readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8");
cek("picker di Pengaturan", atur.includes("PemilihBahasa"));
cek("tanpa window.confirm baru", !shell.includes("window.confirm") && !atur.includes("window.confirm"));

if (gagal > 0) {
  console.log(`\nI18N: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nI18N: ALL-OK");
