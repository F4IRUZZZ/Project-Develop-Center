import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("app/api/github/hook/route.ts", existsSync(join(root, "app/api/github/hook/route.ts")));
cek("lib/github-hook.ts", existsSync(join(root, "lib/github-hook.ts")));

const hook = readFileSync(join(root, "app/api/github/hook/route.ts"), "utf8");
cek("verifikasi signature", hook.includes("verifikasiSignature"));
cek("mapping push/pr/issues/ping", hook.includes('"push"') && hook.includes("pull_request") && hook.includes('"issues"') && hook.includes('"ping"'));
cek("merge tutup waiting", hook.includes("'waiting'") && hook.includes("'completed'"));
cek("merge tutup working juga (#190)", hook.includes("'waiting', 'working'"));
cek("merge Telegram webhook (#190)", hook.includes("void siarTelegram("));
cek("merge anti-ganda 10 mnt (#190)", hook.includes("act-merge-webapp-") && hook.includes("interval '10 minutes'") && hook.includes("sudah dicatat webapp"));
cek("merge selalu +1 task (#208)", hook.includes("tutup.length === 0") && hook.includes("INSERT INTO tasks"));
cek("webhook Selesai: deterministik (#210)", hook.includes("act-merge-webhook-") && hook.includes("Selesai: PR #") && hook.includes("ON CONFLICT (id) DO NOTHING"));
cek("webhook task deterministik (#210)", hook.includes("task-merge-webhook-"));
cek("abaikan repo tak dipantau", hook.includes("tak dipantau"));

const lib = readFileSync(join(root, "lib/github-hook.ts"), "utf8");
cek("HMAC timingSafe", lib.includes("timingSafeEqual"));
cek("batas body", lib.includes("BATAS_BYTE"));

const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("stuck display >30mnt", dash.includes("30 * 60 * 1000") && dash.includes('"stuck"'));

const env = readFileSync(join(root, ".env.example"), "utf8");
cek("contoh webhook secret", env.includes("GITHUB_WEBHOOK_SECRET"));

if (gagal > 0) {
  console.log(`\nF9-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nF9-CEK: ALL-OK");
