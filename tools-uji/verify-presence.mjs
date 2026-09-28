import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["app/api/sessions/route.ts", "plugins/pdc-presence.js", "plugins/README.md"]) {
  cek(f, existsSync(join(root, f)));
}

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel agent_sessions", schema.includes("CREATE TABLE IF NOT EXISTS agent_sessions"));

const api = readFileSync(join(root, "app/api/sessions/route.ts"), "utf8");
cek("POST upsert + PATCH tutup + GET riwayat",
  api.includes("ON CONFLICT (session_id)") && api.includes("ended_at") && api.includes("project_id"));

const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("flag sesiAktif 15 mnt", dash.includes("sesiAktif") && dash.includes("15 minutes"));

const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("indikator AI aktif", card.includes("AI aktif") && card.includes("animate-pulse"));

const plug = readFileSync(join(root, "plugins/pdc-presence.js"), "utf8");
cek("plugin session.created/idle/error", plug.includes("session.created") && plug.includes("session.idle") && plug.includes("session.error"));
cek("plugin tanpa key mentah", !plug.includes("pdc_") || plug.includes("process.env.PDC_API_KEY"));

const detail = readFileSync(join(root, "app/proyek/[id]/page.tsx"), "utf8");
cek("detail tab sesi", detail.includes('"sesi"') && detail.includes("/api/sessions"));

if (gagal > 0) {
  console.log(`\nPRESENCE-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nPRESENCE-CEK: ALL-OK");
