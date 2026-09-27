import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of [
  "db/schema.sql",
  "db/migrate.mjs",
  "lib/db.ts",
  "lib/crypto.ts",
  "lib/server-auth.ts",
  "lib/queue.ts",
  "app/api/commands/route.ts",
  "app/api/commands/[id]/route.ts",
]) {
  cek(f, existsSync(join(root, f)));
}

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel users", schema.includes("CREATE TABLE") && schema.includes("users"));
cek("tabel command_queue", schema.includes("command_queue"));
cek("token terenkripsi (kolom)", schema.includes("access_token_enc"));

const crypto = readFileSync(join(root, "lib/crypto.ts"), "utf8");
cek("AES-256-GCM", crypto.includes("aes-256-gcm"));

const api = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("GET + POST commands", api.includes("export async function GET") && api.includes("export async function POST"));
const authSrv = readFileSync(join(root, "lib/server-auth.ts"), "utf8");
cek("401 saat logout", authSrv.includes("401"));

const apiId = readFileSync(join(root, "app/api/commands/[id]/route.ts"), "utf8");
cek("PATCH + DELETE", apiId.includes("export async function PATCH") && apiId.includes("export async function DELETE"));

const queue = readFileSync(join(root, "lib/queue.ts"), "utf8");
cek("polling 5 detik", queue.includes("5000"));
cek("fallback lokal", queue.includes('"lokal"') && queue.includes("enqueueLokal"));

const panel = readFileSync(join(root, "components/command/QueuePanel.tsx"), "utf8");
cek("panel pakai useQueue", panel.includes("useQueue"));

const modal = readFileSync(join(root, "components/command/CommandModal.tsx"), "utf8");
cek("modal kirimPerintah", modal.includes("kirimPerintah"));

if (gagal > 0) {
  console.log(`\nD3-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nD3-CEK: ALL-OK");
