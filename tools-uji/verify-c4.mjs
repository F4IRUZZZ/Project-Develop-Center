import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["lib/tema.ts", "components/shell/PemilihTema.tsx", "app/layout.tsx", "app/globals.css", "app/page.tsx"]) {
  cek(f, existsSync(join(root, f)));
}

const tema = readFileSync(join(root, "lib/tema.ts"), "utf8");
cek("tema key pdc-tema", tema.includes("pdc-tema"));
cek("tema gelap default", tema.includes('"gelap"'));

const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
cek("layout FOUC script", layout.includes("pdc-tema"));

const css = readFileSync(join(root, "app/globals.css"), "utf8");
cek("css .light", css.includes(".light"));
cek("css light bg", css.includes("#fafafb"));

const topbar = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("topbar pakai PemilihTema", topbar.includes("PemilihTema"));

const stats = readFileSync(join(root, "components/dashboard/Stats.tsx"), "utf8");
cek("stats stack HP", stats.includes("grid-cols-1") && stats.includes("sm:grid-cols-3"));
cek("stats skeleton pulse (#214)", stats.includes("animate-pulse") && stats.includes("value === undefined") && !stats.includes('"—"'));
const beranda = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("slot proyekAktif bisa skeleton (#216)", beranda.includes("proyekAktif={angka?.proyekAktif}"));
cek("visible-refetch proyek+detail (#216)", readFileSync(join(root, "app/proyek/page.tsx"), "utf8").includes("visibilitychange") && readFileSync(join(root, "app/proyek/[id]/page.tsx"), "utf8").includes("visibilitychange"));
cek("muatUlang segarkan angka (#216)", /const muatUlang[\s\S]{0,400}muatAngka\(\)/.test(beranda));

const dash = readFileSync(join(root, "components/dashboard/Dashboard.tsx"), "utf8");
cek("grid auto-fill 300px", dash.includes("minmax(300px,1fr)"));

const page = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("feed tampil di HP (stack)", page.includes("flex-col") && page.includes("xl:flex-row"));

if (gagal > 0) {
  console.log(`\nC4-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nC4-CEK: ALL-OK");
