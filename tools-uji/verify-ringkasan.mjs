import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("vercel.json", existsSync(join(root, "vercel.json")));
const vc = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
cek("cron 20:00 WIB (13 UTC)", (vc.crons ?? []).some((c) => c.path === "/api/ringkasan-harian" && c.schedule === "0 13 * * *"));

cek("app/api/ringkasan-harian/route.ts", existsSync(join(root, "app/api/ringkasan-harian/route.ts")));
const api = readFileSync(join(root, "app/api/ringkasan-harian/route.ts"), "utf8");
cek("guard CRON_SECRET", api.includes("CRON_SECRET") && api.includes("Bearer"));
cek("idempoten per tanggal", api.includes("act-harian-") && api.includes("LIMIT 1"));
cek("agregat 24 jam", api.includes("24 hours"));
cek("tulis info + siar", api.includes("siarTelegram") && api.includes("'info'"));
cek("tanpa tanggal kemarin (WIB)", api.includes("Asia/Jakarta"));

if (gagal > 0) {
  console.log(`\nRINGKASAN: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nRINGKASAN: ALL-OK");
