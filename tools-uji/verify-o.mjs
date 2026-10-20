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

// O1b — Monogram P solid (tanpa hexagon/gradien) + ikon bitmap nyata
const ikon = readFileSync(join(root, "app/icon.svg"), "utf8");
cek("monogram tanpa gradien/hexagon", !ikon.includes("linearGradient") && !ikon.includes("<polygon"));
cek("monogram ubin indigo + path evenodd", ikon.includes('fill="#6366F1"') && ikon.includes('fill-rule="evenodd"'));

const ico = readFileSync(join(root, "public/favicon.ico"));
cek("favicon.ico magic ICO", ico[0] === 0 && ico[1] === 0 && ico[2] === 1 && ico[3] === 0);

for (const [f, ukuran] of [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["app/apple-icon.png", 180],
]) {
  const p = readFileSync(join(root, f));
  const png = p[1] === 0x50 && p[2] === 0x4e && p[3] === 0x47;
  cek(`${f} PNG ${ukuran}px`, png && p.readUInt32BE(16) === ukuran && p.readUInt32BE(20) === ukuran);
}

const manifest = readFileSync(join(root, "app/manifest.ts"), "utf8");
cek("manifest ikon PWA maskable", manifest.includes("icon-192.png") && manifest.includes("icon-512.png") && manifest.includes('purpose: "maskable"'));

// O2 — Login ala referensi (split brand + pill CTA, dark Nebula)
const landing = readFileSync(join(root, "components/shell/LoginLanding.tsx"), "utf8");
cek("landing split brand (kamus)", landing.includes("landing.sambut") && landing.includes("md:grid-cols-2"));
cek("landing pill GitHub (kamus)", landing.includes("user.masukDenganGithub") && landing.includes("rounded-full"));
cek("landing pakai logo ubin gelap", landing.includes("/logo-pdc-dark.svg"));
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
