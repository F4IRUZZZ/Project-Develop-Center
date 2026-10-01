import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("lib/stuck-sweep.ts", existsSync(join(root, "lib/stuck-sweep.ts")));
cek("app/api/tasks/sweep/route.ts", existsSync(join(root, "app/api/tasks/sweep/route.ts")));

const lib = readFileSync(join(root, "lib/stuck-sweep.ts"), "utf8");
cek("ambang 30 mnt", lib.includes("30 minutes") && lib.includes("STUCK_MNT"));
cek("tulis tasks stuck", lib.includes("'stuck'") && lib.includes("UPDATE tasks"));
cek("idempoten (hanya working)", lib.includes("status = 'working'"));
cek("tulis activity error", lib.includes("'error'") && lib.includes("activity_log"));
cek("pending yatim tanpa ubah status", lib.includes("pendingYatim") && !lib.includes("UPDATE command_queue"));
cek("anti-spam yatim 60 mnt", lib.includes("60 minutes"));
cek("batas sweep 50", lib.includes("SWEEP_LIMIT"));

const route = readFileSync(join(root, "app/api/tasks/sweep/route.ts"), "utf8");
cek("route auth sesiUser", route.includes("sesiUser"));
cek("route dry-run", route.includes("dry"));
cek("route GET+POST", route.includes("export async function GET") && route.includes("export async function POST"));

const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("dashboard panggil sweep", dash.includes("sapuStuck"));
cek("dashboard sweep best-effort", dash.includes("sapuStuck") && dash.includes("catch"));
cek("dashboard fallback display tetap", dash.includes("30 * 60 * 1000"));

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("indeks idx_tasks_stuck", schema.includes("idx_tasks_stuck"));

const patchTask = readFileSync(join(root, "app/api/tasks/[id]/route.ts"), "utf8");
cek("PATCH tasks terima stuck", patchTask.includes('"stuck"'));

if (gagal > 0) {
  console.log(`\nSTUCK-SWEEP: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nSTUCK-SWEEP: ALL-OK");
