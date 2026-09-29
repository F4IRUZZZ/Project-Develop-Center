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
cek("plugin lazy-register + reopen", plug.includes("lazy-register") && plug.includes("reopen"));
cek("plugin rekonsiliasi session.list", plug.includes("session.list") && plug.includes("rekonsiliasi"));
cek("POST reopen + feed dilanjutkan", api.includes("reopen") && api.includes("Sesi AI dilanjutkan"));
cek("plugin tak baca isi file (privasi)",
  !plug.includes("readFile") && !plug.includes("Bun.file") && !plug.includes("readFileSync"));

const detail = readFileSync(join(root, "app/proyek/[id]/page.tsx"), "utf8");
cek("UI panel aktivitas", detail.includes("aktivitas.kerja") && detail.includes("Siaga") && detail.includes("komit"));
cek("UI label Selesai rapi", !detail.includes("Selesai (${s.status})"));
cek("plugin path relatif", plug.includes("relative(directory"));

const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("dashboard sesiKerja agregat", dash.includes("sesiKerja") && dash.includes("GROUP BY project_id"));

const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu chip 2 tingkat", card.includes("AI bekerja") && card.includes("AI aktif") && card.includes("sesiKerja"));

const tipe = readFileSync(join(root, "lib/types.ts"), "utf8");
cek("tipe sesiKerja", tipe.includes("sesiKerja"));

cek("feed dibuka anti-duplikat", api.includes("Sesi AI dibuka") && api.includes("SELECT status, ended_at FROM agent_sessions"));
cek("feed tutup", api.includes("Sesi AI selesai"));
cek("feed komit", actIsi.includes("AI mengomit") && actIsi.includes("activity_log"));

const beranda = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("beranda seksi Sedang Aktif", beranda.includes("Sedang Aktif") && beranda.includes("sesiAktif") && beranda.includes("sesiKerja"));

const ruteSesi = readFileSync(join(root, "app/api/sessions/route.ts"), "utf8");
cek("feed ID deterministik anti-race",
  ruteSesi.includes("act-buka-") && ruteSesi.includes("act-lanjut-") && ruteSesi.includes("act-tutup-") &&
  actIsi.includes("act-komit-") && ruteSesi.includes("ON CONFLICT (id) DO NOTHING"));
cek("feed tanpa klaim mode", !ruteSesi.includes("Sesi AI dibuka (") && !ruteSesi.includes("dilanjutkan ("));
cek("plugin mode defensif", plug.includes("ENV_MODE") && plug.includes("sessionMode"));

cek("skema ringkasan", schema.includes("ringkasan_terakhir") && schema.includes("ringkasan_waktu"));
cek("activity kind ringkasan + redaksi", actIsi.includes('kind === "ringkasan"') && actIsi.includes("function redaksi"));
cek("plugin ringkasan per-giliran", plug.includes("message.updated") && plug.includes("siramRingkasan"));
const dash2 = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("dashboard sesiRingkasan + tab Terakhir",
  dash2.includes("sesiRingkasan") && card.includes("sesiRingkasan") && detail.includes("Terakhir:"));

if (gagal > 0) {
  console.log(`\nP-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nP-CEK: ALL-OK");
