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
cek("components/shell/BottomNav.tsx", existsSync(join(root, "components/shell/BottomNav.tsx")));

const nav = readFileSync(join(root, "components/shell/BottomNav.tsx"), "utf8");
cek("item menu (kamus)", ["nav.dashboard", "nav.proyek", "nav.riwayat", "nav.notifikasi", "nav.pengaturan"].every((s) => nav.includes(s)));
cek("hanya HP (lg:hidden)", nav.includes("lg:hidden"));
cek("badge dipakai bersama", nav.includes("NotifBadge"));

const shell = readFileSync(join(root, "components/shell/AppShell.tsx"), "utf8");
cek("shell render BottomNav", shell.includes("BottomNav"));
cek("konten padding bawah HP", shell.includes("pb-20"));

const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("sidebar pakai badge bersama", sidebar.includes("./NotifBadge") || sidebar.includes("NotifBadge"));

if (gagal > 0) {
  console.log(`\nL-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nL-CEK: ALL-OK");
