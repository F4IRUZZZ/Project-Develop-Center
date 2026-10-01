import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const notif = readFileSync(join(root, "app/api/notifications/route.ts"), "utf8");
cek("selesai masuk filter", notif.includes("Selesai:%"));
cek("pr+error tetap", notif.includes("'pr', 'error'"));
cek("info hanya via Selesai:", notif.includes("a.type = 'info' AND a.message LIKE 'Selesai:%'"));
cek("LEFT JOIN yatim", notif.includes("LEFT JOIN projects"));
cek("batas 24 jam", notif.includes("24 hours"));
cek("filter ?type= allowlist", notif.includes("BOLEH_FILTER") && notif.includes('"progress"'));
cek("auth sesiUser", notif.includes("sesiUser"));

const act = readFileSync(join(root, "app/api/activity/route.ts"), "utf8");
cek("activity LEFT JOIN", act.includes("LEFT JOIN projects") && !act.includes(" a JOIN projects"));
cek("activity limit 20 tetap", act.includes("LIMIT 20"));

const hook = readFileSync(join(root, "lib/github-hook.ts"), "utf8");
cek("tulisActivity error+info", hook.includes('"error"') && hook.includes('"info"'));

const mcp = readFileSync(join(root, "mcp-server/src/index.ts"), "utf8");
cek("kontrak prefix Selesai:", mcp.includes("Selesai: ${summary}") && mcp.includes("P3"));

const hal = readFileSync(join(root, "app/notifikasi/page.tsx"), "utf8");
cek("halaman ikon selesai", hal.includes("CircleCheck") && hal.includes('e.type === "info"'));
cek("halaman empty tetap", hal.includes("Tidak ada notifikasi"));

if (gagal > 0) {
  console.log(`\nNOTIF-LUAS: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nNOTIF-LUAS: ALL-OK");
