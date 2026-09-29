import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("skema last_edit_at", schema.includes("last_edit_at"));
cek("tabel session_file_events", schema.includes("CREATE TABLE IF NOT EXISTS session_file_events"));

const act = join(root, "app/api/sessions/activity/route.ts");
cek("route activity ada", existsSync(act));
const actIsi = existsSync(act) ? readFileSync(act, "utf8") : "";
cek("activity auth key + batas",
  actIsi.includes("sesiUser") && actIsi.includes("BATAS_EVENT") && actIsi.includes("session_file_events"));
cek("activity tanpa isi konten (privasi)",
  !actIsi.includes("content") && !actIsi.includes("diff_text") && !actIsi.includes("body_teks"));

const api = readFileSync(join(root, "app/api/sessions/route.ts"), "utf8");
cek("GET diperkaya aktivitas", api.includes("aktivitas") && api.includes("bekerja") && api.includes("siaga"));

const plug = readFileSync(join(root, "plugins/pdc-presence.js"), "utf8");
cek("plugin file.edited batch", plug.includes("file.edited") && plug.includes("/api/sessions/activity"));
cek("plugin deteksi komit", plug.includes("rev-parse") && plug.includes("shortstat"));
cek("plugin tak baca isi file (privasi)",
  !plug.includes("readFile") && !plug.includes("Bun.file") && !plug.includes("readFileSync"));

const detail = readFileSync(join(root, "app/proyek/[id]/page.tsx"), "utf8");
cek("UI panel aktivitas", detail.includes("aktivitas.kerja") && detail.includes("Siaga") && detail.includes("komit"));

if (gagal > 0) {
  console.log(`\nP-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nP-CEK: ALL-OK");
