import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// E2
for (const f of ["lib/notifikasi.ts", "app/notifikasi/page.tsx"]) {
  cek(f, existsSync(join(root, f)));
}
const notif = readFileSync(join(root, "lib/notifikasi.ts"), "utf8");
cek("definisi penting pr+error 24 jam (server-side)", readFileSync(join(root, "app/api/notifications/route.ts"), "utf8").includes("24 hours"));
const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("badge live (tanpa hardcode 2)", sidebar.includes("NotifBadge") && !sidebar.includes('badge: "2"'));
cek("nav notifikasi hidup", sidebar.includes('href: "/notifikasi"'));
const act = readFileSync(join(root, "app/api/activity/route.ts"), "utf8");
cek("activity format mentah", act.includes("format") && act.includes("mentah"));
const halNotif = readFileSync(join(root, "app/notifikasi/page.tsx"), "utf8");
cek("halaman notifikasi + empty", halNotif.includes("fetchNotifikasi") && halNotif.includes("Tidak ada notifikasi"));

// E3
for (const f of ["app/api/commands/cancel/route.ts"]) {
  cek(f, existsSync(join(root, f)));
}
const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu readOnly + onStop", card.includes("readOnly") && card.includes("onStop"));
cek("detail/merge dihapus", !card.includes("Detail") && !card.includes("Merge PR") && !card.includes("GitMerge"));
const dash = readFileSync(join(root, "components/dashboard/Dashboard.tsx"), "utf8");
cek("dashboard props monitor/kelola", dash.includes("readOnly") && dash.includes("teksKosong"));
const proyek = readFileSync(join(root, "app/proyek/page.tsx"), "utf8");
cek("proyek grid kartu + stop", proyek.includes("Dashboard") && proyek.includes("/api/commands/cancel"));
const home = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("home filter perhatian (kamus)", home.includes("PERHATIAN") && home.includes("dash.butuhPerhatian"));
const cancel = readFileSync(join(root, "app/api/commands/cancel/route.ts"), "utf8");
cek("cancel batalkan + tulis error", (cancel.includes("Dihentikan pengguna") || cancel.includes("TANDA_STOP")) && cancel.includes("activity_log"));

if (gagal > 0) {
  console.log(`\nE23-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nE23-CEK: ALL-OK");
