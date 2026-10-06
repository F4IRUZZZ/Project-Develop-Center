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

// 4. PATCH idle: transisi -> task done sekali + feed + Telegram.
cek("idle ambang kerja", ses.includes("AMBANG_KERJA_MS"));
cek("idle dedupe done_at", ses.includes("sudahDicatat") && ses.includes("done_at"));
cek("idle INSERT task completed", ses.includes("INSERT INTO tasks") && ses.includes("'completed'"));
cek("idle feed Selesai:", ses.includes("Selesai: AI selesai bekerja"));
cek("idle siarTelegram", ses.includes("siarTelegram(ctx.userId"));
cek("idle catat done_at+task", ses.includes("SET done_at = now(), done_task_id"));
cek("idle tanpa project dilewati", ses.includes("!sudahDicatat && s.project_id"));
cek("idle balas flag selesai", ses.includes("selesai }") || ses.includes("selesai}"));
cek("idle proyek null = diam", ses.includes("s.project_id"));

// 5. Plugin: sinyal throttled + versi cocok status.
const plug = baca("plugins/pdc-presence.js");
const st = baca("app/api/status/route.ts");
const vPlug = (plug.match(/VERSI_PLUGIN = "([^"]+)"/) ?? [])[1];
const vSt = (st.match(/VERSI_PLUGIN_TERKINI = "([^"]+)"/) ?? [])[1];
cek("plugin sinyalKerja", plug.includes("sinyalKerja") && plug.includes('kind: "kerja"'));
cek("plugin throttle 45 dtk", plug.includes("SELA_KERJA_MS = 45000"));
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
