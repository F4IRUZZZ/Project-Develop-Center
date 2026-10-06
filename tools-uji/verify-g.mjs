import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// G2
const delId = readFileSync(join(root, "app/api/commands/[id]/route.ts"), "utf8");
cek("DELETE pindah dari [id]", !delId.includes("export async function DELETE"));
const delCol = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("DELETE di koleksi", delCol.includes("export async function DELETE"));
const queue = readFileSync(join(root, "lib/queue.ts"), "utf8");
cek("bersihkan lapor gagal", queue.includes("if (!res.ok) return false"));
const panel = readFileSync(join(root, "components/command/QueuePanel.tsx"), "utf8");
cek("panel tampilkan error hapus (kamus)", panel.includes("antre.gagalHapus"));

// G1
for (const f of ["app/api/notifications/route.ts", "app/api/notifications/read/route.ts"]) {
  cek(f, existsSync(join(root, f)));
}
const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel notification_reads", schema.includes("CREATE TABLE IF NOT EXISTS notification_reads"));
const halNotif = readFileSync(join(root, "app/notifikasi/page.tsx"), "utf8");
cek("tombol tandai per item+semua (kamus)", halNotif.includes("notif.tandai") && halNotif.includes("notif.tandaiSemua"));
const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
const badge = readFileSync(join(root, "components/shell/NotifBadge.tsx"), "utf8");
cek("badge minus dibaca", badge.includes("fetchNotifikasi"));
const dashApi = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("stop-cancel tampil idle, riwayat jujur", dashApi.includes("TANDA_STOP") && dashApi.includes('"idle"'));
const notif = readFileSync(join(root, "lib/notifikasi.ts"), "utf8");
cek("badge event-driven + poll fallback", notif.includes("EVENT_NOTIF") && badge.includes("EVENT_NOTIF"));
const bacaSemua = readFileSync(join(root, "app/api/notifications/read/route.ts"), "utf8");
cek("tandai-semua selaras filter daftar (#194)", bacaSemua.includes("Selesai:%") && bacaSemua.includes("body.semua"));

// G4
const modal = readFileSync(join(root, "components/command/CommandModal.tsx"), "utf8");
cek("modal callback terkirim", modal.includes("onTerkirim"));
const proyek = readFileSync(join(root, "app/proyek/page.tsx"), "utf8");
cek("proyek polling 10s", proyek.includes("10000"));

// G3
const css = readFileSync(join(root, "app/globals.css"), "utf8");
cek("css scroll-tipis", css.includes(".scroll-tipis"));
cek("panel max-h scroll", panel.includes("max-h-[400px]"));
const feed = readFileSync(join(root, "components/activity/ActivityFeed.tsx"), "utf8");
cek("feed max-h scroll", feed.includes("max-h-[520px]"));

if (gagal > 0) {
  console.log(`\nG-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nG-CEK: ALL-OK");
