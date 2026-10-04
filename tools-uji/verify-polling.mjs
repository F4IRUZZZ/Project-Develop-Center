import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("lib/polling.ts", existsSync(join(root, "lib/polling.ts")));
const lib = readFileSync(join(root, "lib/polling.ts"), "utf8");
cek("backoff eksponensial", lib.includes("faktor") && lib.includes("maks"));
cek("reset saat sukses", lib.includes("opsi.awalMs") && lib.includes("ok ?"));
cek("tanpa setInterval mentah", !lib.includes("window.setInterval(") && lib.includes("window.setTimeout("));
cek("hormati tab hidden", lib.includes("document.hidden"));
cek("kontrak boolean", lib.includes("Promise<boolean>"));

const SITUS = [
  ["components/activity/ActivityFeed.tsx", "mulaiPolling", "5000"],
  ["lib/queue.ts", "mulaiPolling", "5000"],
  ["components/shell/NotifBadge.tsx", "mulaiPolling", "30000"],
  ["app/status/page.tsx", "mulaiPolling", "30000"],
  ["app/proyek/[id]/page.tsx", "mulaiPolling", "10000"],
  ["app/sesi/page.tsx", "mulaiPolling", "10000"],
  ["app/proyek/page.tsx", "mulaiPolling", "10000"],
  ["app/page.tsx", "mulaiPolling", "10000"],
];
for (const [f, fn, ms] of SITUS) {
  const isi = readFileSync(join(root, f), "utf8");
  cek(`${f} via helper`, isi.includes(fn) && isi.includes(ms));
}

const plug = readFileSync(join(root, "plugins/pdc-presence.js"), "utf8");
cek("presence denyut utuh (by design)", plug.includes("setInterval") && plug.includes("60000"));

if (gagal > 0) {
  console.log(`\nPOLLING: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nPOLLING: ALL-OK");
