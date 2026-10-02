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
  "lib/sync.ts",
  "app/api/projects/route.ts",
  "app/api/dashboard/route.ts",
  "app/api/tasks/route.ts",
  "app/api/tasks/[id]/route.ts",
  "app/api/activity/route.ts",
]) {
  cek(f, existsSync(join(root, f)));
}

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel projects", schema.includes("CREATE TABLE IF NOT EXISTS projects"));
cek("tabel tasks", schema.includes("CREATE TABLE IF NOT EXISTS tasks"));
cek("tabel activity_log", schema.includes("CREATE TABLE IF NOT EXISTS activity_log"));
cek("status AI lengkap", schema.includes("'stuck'"));

const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("dashboard gabung task", dash.includes("tasks") && dash.includes("DISTINCT ON"));
cek("dashboard auto-sync", dash.includes("syncProjects"));

const cmd = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("enqueue buat task", cmd.includes("INSERT INTO tasks"));
cek("enqueue tulis activity", cmd.includes("INSERT INTO activity_log"));

const queue = readFileSync(join(root, "lib/queue.ts"), "utf8");
cek("api tanpa auto-simulasi (pending untuk AI)", !queue.includes("simulasiApi"));
cek("lokal tetap simulasi (fallback)", queue.includes("enqueueLokal"));

const modal = readFileSync(join(root, "components/command/CommandModal.tsx"), "utf8");
cek("modal dropdown live via props", modal.includes("projects = mockProjects") && modal.includes("projects.map"));

const feed = readFileSync(join(root, "components/activity/ActivityFeed.tsx"), "utf8");
cek("feed baca API + poll", feed.includes("/api/activity") && feed.includes("5000"));
cek("feed tanpa fallback mock (jujur, P4)", !feed.includes("mockFeed") && feed.includes("feed.kosong"));

const page = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("page pakai dashboard API", page.includes("fetchDashboard"));

if (gagal > 0) {
  console.log(`\nD3B-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nD3B-CEK: ALL-OK");
