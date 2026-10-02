import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// Elemen yang merender waktu dinamis (Date.now/toLocale saat render) wajib
// suppressHydrationWarning agar SSR-vs-klien tak #418.
const WAJIB = [
  ["app/notifikasi/page.tsx", "waktuRelatif(e.created_at"],
  ["app/riwayat/page.tsx", "toLocaleString(lang"],
  ["app/statistik/page.tsx", "fmtTanggal(data.streak.mulai"],
  ["app/status/page.tsx", "waktuRelatif(data.deploy.waktu"],
  ["app/proyek/[id]/page.tsx", "toLocaleString(lang"],
  ["components/command/QueuePanel.tsx", "waktuRelatif(c.created_at"],
  ["components/activity/ActivityFeed.tsx", "waktuRelatif(e.time"],
];
for (const [f, jangkar] of WAJIB) {
  const isi = readFileSync(join(root, f), "utf8");
  const i = isi.indexOf(jangkar);
  const potong = i >= 0 ? isi.slice(Math.max(0, i - 400), i) : "";
  cek(`${f.split("/").pop()} anti-#418`, i >= 0 && potong.includes("suppressHydrationWarning"));
}

const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
cek("favicon eksplisit (tanpa 404)", layout.includes('"/icon.svg"') && layout.includes("icons"));

if (gagal > 0) {
  console.log(`\nHYDRATION: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nHYDRATION: ALL-OK");
