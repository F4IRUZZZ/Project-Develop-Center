import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["lib/telegram.ts", "app/api/notif-tujuan/route.ts", "app/api/notif-tujuan/[id]/route.ts"]) {
  cek(f, existsSync(join(root, f)));
}

const lib = readFileSync(join(root, "lib/telegram.ts"), "utf8");
cek("kirim via Bot API + timeout", lib.includes("api.telegram.org") && lib.includes("AbortSignal.timeout"));
cek("token terenkripsi (tak mentah)", lib.includes("dekrip") && !lib.includes("bot_token_enc AS bot_token"));
cek("gagal = diam", lib.includes("catch") && lib.includes("return hasil"));
cek("tanpa token ke client", lib.includes("SELECT id, label, chat_id") && !lib.includes("bot_token_enc, chat_id FROM notif_tujuan WHERE user_id"));

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel notif_tujuan", schema.includes("CREATE TABLE IF NOT EXISTS notif_tujuan") && schema.includes("bot_token_enc"));

const api = readFileSync(join(root, "app/api/notif-tujuan/route.ts"), "utf8");
cek("validasi format token", api.includes("bot_token") && api.includes("chat_id"));
cek("simpan terenkripsi", api.includes("enkrip("));

const aksi = readFileSync(join(root, "app/api/notif-tujuan/[id]/route.ts"), "utf8");
cek("aksi test + hapus", aksi.includes('"test"') && aksi.includes("DELETE FROM notif_tujuan"));
cek("uji jalur selesai (#227)", aksi.includes('"uji-selesai"') && aksi.includes("siarTelegramRinci"));
cek("uji tanpa bocor token (#227)", aksi.includes("return NextResponse.json({ ok: hasil.terkirim > 0, ...hasil })"));
const sel = readFileSync(join(root, "lib/selesai.ts"), "utf8");
cek("selesai await siar rinci (#227)", sel.includes("siarTelegramRinci") && sel.includes("Promise.race") && sel.includes("[selesai] telegram"));
cek("siar rinci terstruktur (#227)", lib.includes("siarTelegramRinci") && lib.includes("HasilSiar") && lib.includes("gagalDekrip") && lib.includes("gagalKirim"));
cek("siar kompatibel angka (#227)", lib.includes("export async function siarTelegram(userId: string, pesan: string): Promise<number>"));

const act = readFileSync(join(root, "app/api/activity/route.ts"), "utf8");
cek("hook activity error+Selesai", act.includes("siarTelegram") && act.includes('startsWith("Selesai:")'));
const cancel = readFileSync(join(root, "app/api/commands/cancel/route.ts"), "utf8");
cek("hook cancel Stop", cancel.includes("siarTelegram"));
const sweep = readFileSync(join(root, "lib/stuck-sweep.ts"), "utf8");
cek("hook sweep ringkas", sweep.includes("siarTelegram"));

const atur = readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8");
cek("UI seksi Telegram", atur.includes("atur.tgJudul") && atur.includes("notif-tujuan"));
cek("tanpa confirm() baru", !atur.includes("window.confirm"));

const kamus = readFileSync(join(root, "lib/kamus.ts"), "utf8");
cek("kunci tg ID+EN", ["atur.tgJudul", "atur.tgSub", "atur.tgTersimpan", "atur.tgTerkirim", "atur.tgHapusJudul"].every((k) => kamus.includes(`"${k}"`)));

if (gagal > 0) {
  console.log(`\nTELEGRAM: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nTELEGRAM: ALL-OK");
