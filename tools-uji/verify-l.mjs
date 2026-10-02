import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("components/shell/NotifBadge.tsx", existsSync(join(root, "components/shell/NotifBadge.tsx")));
cek("BottomNav dihapus", !existsSync(join(root, "components/shell/BottomNav.tsx")));

const nav = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("hamburger HP (lg:hidden)", nav.includes("menu.navigasi") && nav.includes("lg:hidden"));
cek("drawer 8 menu (kamus)", ["nav.dashboard", "nav.proyek", "nav.sesi", "nav.status", "nav.riwayat", "nav.statistik", "nav.notifikasi", "nav.pengaturan"].every((s) => nav.includes(s)));
cek("drawer tutup cerdas", nav.includes("setBuka(false)") && nav.includes("Escape"));
cek("drawer di dalam ref #121", nav.includes("nav drawer WAJIB di dalam div ref") && nav.indexOf("ref={ref}") < nav.indexOf("<nav"));
cek("badge ikut drawer", nav.includes("NotifBadge"));
cek("brand PDC HP", nav.includes(">PDC<"));

const shell = readFileSync(join(root, "components/shell/AppShell.tsx"), "utf8");
cek("shell tanpa BottomNav", !shell.includes("BottomNav"));
cek("tanpa padding bar HP", !shell.includes("pb-20"));

const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("sidebar pakai badge bersama", sidebar.includes("./NotifBadge") || sidebar.includes("NotifBadge"));
cek("brand PDC singkat", sidebar.includes(">PDC<") && !sidebar.includes("Develop Center"));

if (gagal > 0) {
  console.log(`\nL-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nL-CEK: ALL-OK");
