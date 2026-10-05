import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { bacaBisu } from "../lib/bunyi.ts";
import { barisBaruPenting } from "../lib/peringatan-inti.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["lib/bunyi.ts", "lib/peringatan.ts", "components/shell/ToastNotifikasi.tsx"]) {
  cek(f, existsSync(join(root, f)));
}

const bunyi = readFileSync(join(root, "lib/bunyi.ts"), "utf8");
cek("tanpa file audio", !bunyi.includes(".mp3") && !bunyi.includes(".wav") && bunyi.includes("Oscillator"));
cek("bisu persisten + unlock gesture", bunyi.includes("pdc-bisu") && bunyi.includes("pointerdown"));

const ingat = readFileSync(join(root, "lib/peringatan.ts"), "utf8");
cek("hook di badge (satu titik)", readFileSync(join(root, "components/shell/NotifBadge.tsx"), "utf8").includes("cekPeringatan"));
cek("dedupe via inti murni", ingat.includes("barisBaruPenting"));
cek("izin dari klik", readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8").includes("mintaIzinNotifikasi"));
cek("tanpa service worker", !ingat.toLowerCase().includes("serviceworker") && !ingat.includes("PushManager"));

const toast = readFileSync(join(root, "components/shell/ToastNotifikasi.tsx"), "utf8");
cek("toast auto-hilang + klik", toast.includes("6000") && toast.includes("/notifikasi"));
cek("shell render toast", readFileSync(join(root, "components/shell/AppShell.tsx"), "utf8").includes("ToastNotifikasi"));

// Uji fungsi beneran: fetch pertama diam, kemunculan baru 1x, tak ulang.
cek("default tak bisu (tanpa window)", bacaBisu() === false);
let lihat = null;
const a = [{ id: "x1", type: "info", message: "Selesai: ok", dibaca: false }];
let r = barisBaruPenting(a, lihat);
cek("fetch pertama diam", r.baru.length === 0);
lihat = r.terlihat;
const b = [...a, { id: "x2", type: "error", message: "gagal", dibaca: false }];
r = barisBaruPenting(b, lihat);
cek("item baru 1 peringatan", r.baru.length === 1 && r.baru[0].id === "x2");
lihat = r.terlihat;
r = barisBaruPenting(b, lihat);
cek("sudah-dilihat tak ulang", r.baru.length === 0);
lihat = r.terlihat;
const c = [...b, { id: "x3", type: "commit", message: "c", dibaca: false }];
r = barisBaruPenting(c, lihat);
cek("tipe commit ikut (penting)", r.baru.length === 1);
lihat = r.terlihat;
r = barisBaruPenting(b.map((x) => ({ ...x, dibaca: true })), lihat);
cek("yang dibaca diabaikan", r.baru.length === 0);

if (gagal > 0) {
  console.log(`\nNOTIF-SUARA: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nNOTIF-SUARA: ALL-OK");
