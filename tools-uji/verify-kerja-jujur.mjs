import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baca = (f) => readFileSync(join(root, f), "utf8");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// 1. Schema: kolom + migrasi idempoten + backfill.
const sch = baca("db/schema.sql");
cek("schema last_work_at", sch.includes("last_work_at"));
cek("schema done_at + done_task_id", sch.includes("done_at") && sch.includes("done_task_id"));
cek(
  "schema ALTER IF NOT EXISTS x3",
  (sch.match(/ADD COLUMN IF NOT EXISTS (last_work_at|done_at|done_task_id)/g) ?? []).length === 3
);
cek("schema backfill kerja", sch.includes("SET last_work_at = COALESCE(last_edit_at, last_seen_at)"));

// 2. Endpoint activity: sinyal kerja latest-only.
const act = baca("app/api/sessions/activity/route.ts");
cek("activity kind kerja", act.includes('"kerja"'));
cek("kerja sentuh last_work_at", act.includes("SET last_work_at = now()"));
cek("sunting ikut bump kerja", act.includes("SET last_edit_at = now(), last_work_at = now()"));

// 3. Definisi bekerja = COALESCE(last_work_at, last_edit_at) di 3 pembaca.
for (const f of ["app/api/stats/route.ts", "app/api/dashboard/route.ts"]) {
  cek(`${f} COALESCE kerja`, baca(f).includes("COALESCE(last_work_at, last_edit_at)"));
}
const ses = baca("app/api/sessions/route.ts");
cek("sessions GET COALESCE kerja", ses.includes("r.last_work_at ?? r.last_edit_at"));
cek("sessions GET select last_work_at", ses.includes("last_edit_at, last_work_at"));

// 4. PATCH idle: heartbeat MURNI (tak pernah mencatat done). Done oleh
// lib/selesai (sweep hening / tutup eksplisit).
cek("idle tanpa INSERT task", !ses.includes("INSERT INTO tasks"));
cek("idle tanpa siarTelegram langsung", !ses.includes("siarTelegram"));
cek("idle heartbeat active", ses.includes("ended_at = NULL, last_seen_at = now()"));
cek("idle balas flag selesai:false", ses.includes("selesai: false"));
cek("tutup panggil catatSelesai", ses.includes("await catatSelesai(ctx.userId, sessionId)"));
cek("tutup catat sebelum update status", ses.indexOf("catatSelesai") < ses.indexOf("SET status = ${akhir}"));
cek("error tak catat done", ses.includes('akhir === "selesai"'));

// 4b. lib/selesai: mutex atomik + ambang hening 3 mnt + sweep.
const sel = baca("lib/selesai.ts");
cek("selesai mutex UPDATE+RETURNING", sel.includes("UPDATE agent_sessions SET done_at = now()") && sel.includes("RETURNING session_id"));
cek("selesai syarat klaim lengkap", sel.includes("status = 'active'") && sel.includes("project_id IS NOT NULL") && sel.includes("COALESCE(last_work_at, last_edit_at) IS NOT NULL"));
cek("selesai kalah diam", sel.includes("if (rows.length === 0) return false"));
cek("selesai INSERT task completed", sel.includes("INSERT INTO tasks") && sel.includes("'completed'"));
cek("selesai feed Selesai:", sel.includes("Selesai: AI selesai bekerja"));
cek("selesai siarTelegram best-effort", sel.includes("void siarTelegram(userId, pesanFeed)"));
cek("selesai tulis done_task_id", sel.includes("SET done_task_id ="));
cek("sweep hening 3 menit", sel.includes("sapuSelesai") && sel.includes("interval '3 minutes'"));
cek("sweep limit anti-ledak", sel.includes("LIMIT ${SWEEP_LIMIT}"));
cek("dashboard panggil sapuSelesai", baca("app/api/dashboard/route.ts").includes("await sapuSelesai(ctx.userId)"));

// 4c. Flip real-time via last_idle_at (#202): idle stempel + predikat
// kerja-lebih-baru-dari-idle di SEMUA indikator.
cek("schema last_idle_at", sch.includes("last_idle_at"));
cek(
  "schema ALTER idle idempoten",
  (sch.match(/ADD COLUMN IF NOT EXISTS last_idle_at/g) ?? []).length === 1
);
cek("idle stempel last_idle_at", ses.includes("last_seen_at = now(), last_idle_at = now()"));
cek("stats hormat idle", baca("app/api/stats/route.ts").includes("last_idle_at IS NULL OR COALESCE(last_work_at, last_edit_at) > last_idle_at"));
cek("dashboard hormat idle", baca("app/api/dashboard/route.ts").includes("MAX(last_idle_at) AS henti"));
cek("sesi hormat idle", ses.includes("sudahTurun") && ses.includes("last_idle_at"));

// 5. Plugin: sinyal throttled + versi cocok status.
const plug = baca("plugins/pdc-presence.js");
const st = baca("app/api/status/route.ts");
const vPlug = (plug.match(/VERSI_PLUGIN = "([^"]+)"/) ?? [])[1];
const vSt = (st.match(/VERSI_PLUGIN_TERKINI = "([^"]+)"/) ?? [])[1];
cek("plugin sinyalKerja", plug.includes("sinyalKerja") && plug.includes('kind: "kerja"'));
cek("plugin throttle lama dibuang", !plug.includes("SELA_KERJA_MS = 45000"));
cek("plugin throttle idle 15 dtk (#204)", plug.includes("SELA_IDLE_MS = 15000") && plug.includes("idle dobel dilewati"));
cek("beranda refetch on-visible (#204)", baca("app/page.tsx").includes("visibilitychange") && baca("app/page.tsx").includes("/api/stats"));
cek("semua jalur muat lewat catatFlip (#212)", (baca("app/page.tsx").match(/catatFlip\(d\)/g) ?? []).length >= 3);
cek("plugin bypass cerdas (#212)", plug.includes("idleTerkirim.get(id)") && plug.includes("> kerjaLalu"));

// 4d. Build-only (#206): plan dikecualikan dari working + done.
const plug2 = plug;
cek("plugin mode eksplisit", plug2.includes("eksplisit") && plug2.includes("mode sesi ->"));
cek("plugin kerja bawa mode", plug2.includes('kind: "kerja", mode:'));
cek("plugin idle bawa mode", plug2.includes('status: "idle"'));
cek("activity terima mode", act.includes("modeDari") && act.includes("mode = ${modeBaru}"));
cek("idle terima mode", ses.includes('body.mode === "plan"'));
cek("stats build-only", baca("app/api/stats/route.ts").includes("mode = 'build'"));
cek("dashboard build-only", baca("app/api/dashboard/route.ts").includes("AND mode = 'build'"));
cek("sesi plan = siaga", ses.includes('r.mode !== "build"'));
cek("klaim + sweep build-only", baca("lib/selesai.ts").includes("AND mode = 'build'"));
cek("done satu statement CTE (#210)", baca("lib/selesai.ts").includes("WITH k AS (") && baca("lib/selesai.ts").includes("task-done-") && baca("lib/selesai.ts").includes("act-selesai-"));
cek("POST hormat mode eksplisit (#210)", ses.includes("mode_eksplisit") && ses.includes("CASE WHEN ${modeUp} IS NULL"));
cek("activity + idle hormat eksplisit (#210)", baca("app/api/sessions/activity/route.ts").includes("mode_eksplisit") && ses.includes("body.mode_eksplisit === true"));
cek("plugin kirim eksplisit (#210)", plug2.includes("mode_eksplisit"));
cek("throttle kerja 15 dtk (#210)", plug2.includes("SELA_KERJA_MS = 15000"));
cek("indeks aktif parsial (#210)", sch.includes("idx_agent_sessions_aktif") && sch.includes("WHERE status = 'active' AND mode = 'build'"));

// 4e. Flip lokal instan (#208): deteksi transisi di polling klien.
cek("helper flip-lokal", baca("lib/flip-lokal.ts").includes("cekFlip") && baca("lib/flip-lokal.ts").includes("idBekerja"));
cek("flip inisialisasi diam", baca("lib/flip-lokal.ts").includes("sebelum: Set<string> | null"));
cek("peringatanLokal tanpa feed", baca("lib/peringatan.ts").includes("peringatanLokal") && baca("lib/peringatan.ts").includes("TANPA"));
cek("kamus flip.pesan", baca("lib/kamus.ts").includes('"flip.pesan"'));
cek("beranda pakai cekFlip", baca("app/page.tsx").includes("cekFlip(kerjaLalu.current"));
cek("proyek pakai cekFlip", baca("app/proyek/page.tsx").includes("cekFlip(kerjaLalu.current"));
cek("plugin reset throttle saat tutup", plug.includes("idleTerkirim.delete(s.id)"));
cek("plugin tool hook sinyal", plug.includes("await sinyalKerja(sid)"));
cek("plugin part pesan sinyal", plug.includes("await sinyalKerja(infoSesi(event).id)"));
cek("versi plugin cocok status", Boolean(vPlug) && vPlug === vSt, `plugin=${vPlug} status=${vSt}`);

// 6. Versi lama di-lock di verify lain ikut naik (diassert di sini agar tak lupa).
for (const f of ["tools-uji/verify-mcp-bridge.mjs", "tools-uji/verify-p.mjs", "tools-uji/verify-presence-v1.mjs"]) {
  const isi = baca(f);
  cek(`${f} versi ${vSt}`, isi.includes(vSt), "masih menunjuk versi lama bila GAGAL");
}

if (gagal > 0) {
  console.log(`\nKERJA-JUJUR: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nKERJA-JUJUR: ALL-OK");
