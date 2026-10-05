import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["lib/push.ts", "lib/push-client.ts", "public/sw.js", "app/api/push/route.ts"]) {
  cek(f, existsSync(join(root, f)));
}

const lib = readFileSync(join(root, "lib/push.ts"), "utf8");
cek("VAPID env server-side", lib.includes("PUSH_VAPID_PRIVATE") && !lib.includes("NEXT_PUBLIC_PUSH_VAPID_PRIVATE\","));
cek("bersihkan langganan mati", lib.includes("404") && lib.includes("410") && lib.includes("DELETE FROM push_langganan"));
cek("tanpa throw (best-effort)", (lib.match(/\} catch \{/g) || []).length >= 2 && !lib.includes("throw "));

const klien = readFileSync(join(root, "lib/push-client.ts"), "utf8");
cek("daftar SW /sw.js", klien.includes("/sw.js") && klien.includes("pushManager"));
cek("VAPID public via env", klien.includes("NEXT_PUBLIC_PUSH_VAPID_PUBLIC"));
cek("unsubscribe bersih", klien.includes("unsubscribe"));

const sw = readFileSync(join(root, "public/sw.js"), "utf8");
cek("SW push + klik", sw.includes('"push"') && sw.includes("showNotification") && sw.includes("notificationclick"));
cek("SW tanpa cache manual", !sw.includes("caches.open") && !sw.includes("cache.addAll"));

const api = readFileSync(join(root, "app/api/push/route.ts"), "utf8");
cek("API POST + DELETE auth", api.includes("export async function POST") && api.includes("export async function DELETE") && api.includes("sesiUser"));
cek("upsert endpoint unik", api.includes("ON CONFLICT (endpoint)"));

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel push_langganan", schema.includes("CREATE TABLE IF NOT EXISTS push_langganan"));

const atur = readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8");
cek("UI seksi push", atur.includes("push.judul") && atur.includes("nyalakanPush") && atur.includes("matikanPush"));

const kamus = readFileSync(join(root, "lib/kamus.ts"), "utf8");
cek("kamus push.*", kamus.includes("push.judul") && kamus.includes("push.nyalakan") && kamus.includes("push.tanpaKunci"));

const contoh = readFileSync(join(root, ".env.example"), "utf8");
cek("env contoh tanpa nilai", contoh.includes("PUSH_VAPID_PRIVATE=isi-") && !contoh.includes("zDnSYPuik"));

if (gagal > 0) {
  console.log(`\nPUSH: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nPUSH: ALL-OK");
