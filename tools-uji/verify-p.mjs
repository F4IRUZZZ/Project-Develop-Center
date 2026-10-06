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
cek("rekonsiliasi via client.session.list (v1.18)", plug.includes("client.session.list") && plug.includes("lazy-register"));
cek("POST reopen + feed dilanjutkan", api.includes("reopen") && api.includes("Sesi AI dilanjutkan"));
cek(
  "plugin tak baca isi file (privasi; .git/config dikecualikan)",
  !plug.includes("Bun.file") &&
    [...plug.matchAll(/readFileSync\(([^)]*)\)/g)].every(
      (m) => /\.git/.test(plug.slice(Math.max(0, m.index - 300), m.index + 120))
    )
);

const detail = readFileSync(join(root, "app/proyek/[id]/page.tsx"), "utf8");
cek("UI panel aktivitas (kamus)", detail.includes("aktivitas.kerja") && detail.includes("sesi.siagaHening") && detail.includes("pro.komitLabel"));
cek("UI label Selesai rapi", !detail.includes("Selesai (${s.status})"));
cek("plugin path relatif", plug.includes("relative(directory"));

const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("dashboard sesiKerja agregat", dash.includes("sesiKerja") && dash.includes("GROUP BY project_id"));

const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu chip 2 tingkat (kamus)", card.includes("kartu.aiBekerja") && card.includes("kartu.aiAktif") && card.includes("sesiKerja"));

const tipe = readFileSync(join(root, "lib/types.ts"), "utf8");
cek("tipe sesiKerja", tipe.includes("sesiKerja"));

cek("feed dibuka anti-duplikat", api.includes("Sesi AI dibuka") && api.includes("SELECT status, ended_at FROM agent_sessions"));
cek("feed tutup", api.includes("Sesi AI selesai"));
cek("feed komit", actIsi.includes("AI mengomit") && actIsi.includes("activity_log"));

const beranda = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("beranda seksi Sedang Aktif (kamus)", beranda.includes("dash.sedangAktif") && beranda.includes("sesiAktif") && beranda.includes("sesiKerja"));

const ruteSesi = readFileSync(join(root, "app/api/sessions/route.ts"), "utf8");
cek("feed ID deterministik anti-race",
  ruteSesi.includes("act-buka-") && ruteSesi.includes("act-lanjut-") && ruteSesi.includes("act-tutup-") &&
  actIsi.includes("act-komit-") && ruteSesi.includes("ON CONFLICT (id) DO NOTHING"));
cek("feed tanpa klaim mode", !ruteSesi.includes("Sesi AI dibuka (") && !ruteSesi.includes("dilanjutkan ("));
cek("plugin mode defensif", plug.includes("ENV_MODE") && plug.includes("sessionMode"));

cek("skema ringkasan", schema.includes("ringkasan_terakhir") && schema.includes("ringkasan_waktu"));
cek("activity kind ringkasan + redaksi", actIsi.includes('kind === "ringkasan"') && actIsi.includes("function redaksi"));
cek("cap ringkasan 1000 + ellipsis", actIsi.includes("BATAS_RINGKASAN = 1000") && plug.includes("BATAS_RINGKASAN = 1000"));

const stRoute = join(root, "app/api/status/route.ts");
cek("route status ada", existsSync(stRoute));
const stIsi = existsSync(stRoute) ? readFileSync(stRoute, "utf8") : "";
cek("status read-only + versi cocok",
  stIsi.includes("export async function GET") && !stIsi.includes("export async function POST") &&
  stIsi.includes('VERSI_PLUGIN_TERKINI = "2026.10.09"') && plug.includes('VERSI_PLUGIN = "2026.10.09"'));
cek("tabel repo_health", schema.includes("CREATE TABLE IF NOT EXISTS repo_health"));
const stPage = join(root, "app/status/page.tsx");
cek("halaman Status 4 seksi (kamus)", existsSync(stPage) && readFileSync(stPage, "utf8").includes("status.pluginJudul"));
const sideSt = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
const topSt = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("nav Status", sideSt.includes('"/status"') && topSt.includes('"/status"'));

const ping = join(root, "app/api/plugin-ping/route.ts");
cek("endpoint plugin-ping", existsSync(ping));
const pingIsi = existsSync(ping) ? readFileSync(ping, "utf8") : "";
cek("ping tanpa sesi/feed", pingIsi.includes("repo_health") && !pingIsi.includes("agent_sessions") && !pingIsi.includes("activity_log"));
cek("ping saat init", plug.includes("/api/plugin-ping") && plug.includes("VERSI_PLUGIN"));
cek("label Belum-pernah vs Basi (kamus)", readFileSync(join(root, "app/status/page.tsx"), "utf8").includes("status.belumPernah"));
cek("plugin ringkasan per-giliran", plug.includes("message.updated") && plug.includes("siramRingkasan"));
cek("plugin ringkasan via part+peran", plug.includes("message.part.updated") && plug.includes("peranPesan") && plug.includes('"text"'));
const dash2 = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("dashboard sesiRingkasan + tab Terakhir (kamus)",
  dash2.includes("sesiRingkasan") && card.includes("sesiRingkasan") && detail.includes("pro.terakhirLabel"));
cek("tab Ringkasan (kamus)", detail.includes('"ringkasan"') && detail.includes("pro.kosongRingkasan"));

cek("DELETE sesi + tombol + modal", api.includes("export async function DELETE") && detail.includes("TombolHapusSesi") && detail.includes("ConfirmModal") && detail.includes("galatHapus"));
cek("helper sesiSegar bersama", readFileSync(join(root, "lib/sesi.ts"), "utf8").includes("sesiSegar") && detail.includes("sesiSegar"));
const sesiPage = join(root, "app/sesi/page.tsx");
cek("halaman Sesi global", existsSync(sesiPage));
const sesiIsi = existsSync(sesiPage) ? readFileSync(sesiPage, "utf8") : "";
cek("sesi global filter+hapus+refresh (polling adaptif)", sesiIsi.includes('"aktif"') && sesiIsi.includes("TombolHapusSesi") && sesiIsi.includes("mulaiPolling"));
const side = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
const topSesi = readFileSync(join(root, "components/shell/Topbar.tsx"), "utf8");
cek("nav Sesi", side.includes('"/sesi"') && topSesi.includes('"/sesi"'));
cek("scroll-tipis tab proyek", detail.includes("scroll-tipis max-h-[420px]"));

if (gagal > 0) {
  console.log(`\nP-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nP-CEK: ALL-OK");

