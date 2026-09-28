import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// O1 — Logo & favicon
for (const f of ["public/logo-pdc.svg", "public/logo-pdc-dark.svg", "app/icon.svg", "app/apple-icon.png", "app/manifest.ts"]) {
  cek(f, existsSync(join(root, f)));
}

// O2 — Login ala referensi (split brand + pill CTA, dark Nebula)
const landing = readFileSync(join(root, "components/shell/LoginLanding.tsx"), "utf8");
cek("landing split brand", landing.includes("Selamat Datang Kembali") && landing.includes("md:grid-cols-2"));
cek("landing pill GitHub", landing.includes("Masuk dengan GitHub") && landing.includes("rounded-full"));
cek("landing pakai logo", landing.includes("/logo-pdc.svg"));
cek("landing tanpa shell", !landing.includes("Sidebar"));
cek("landing logo GitHub asli", landing.includes("GithubMark"));

const mark = readFileSync(join(root, "components/ui/GithubMark.tsx"), "utf8");
cek("octocat path", mark.includes("M8 0C3.58"));

const tema = readFileSync(join(root, "lib/tema.ts"), "utf8");
cek("mode sistem + matchMedia", tema.includes('"sistem"') && tema.includes("matchMedia"));
const peng = readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8");
cek("segmented Light/Dark/System", peng.includes("System") && peng.includes("radiogroup"));

// O3 — Avatar hanya HP
const topbar = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("avatar lg:hidden", topbar.includes("lg:hidden") && topbar.includes("UserMenu"));

if (gagal > 0) {
  console.log(`\nO-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nO-CEK: ALL-OK");
