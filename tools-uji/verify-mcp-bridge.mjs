import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const src = readFileSync(join(root, "mcp-server/src/index.ts"), "utf8");
cek("default production", src.includes("https://project-develop-center.vercel.app"));
cek("tanpa default localhost", !src.includes("http://localhost:3000"));
cek("warning bila env absen", src.includes("PDC_API_URL tak diset") || src.includes("PDC_API_URL) tak diset") || src.includes("tak diset"));
cek("tanpa scan projectUntuk", !src.includes("projectUntuk"));
cek("tugasUntuk satu panggilan", src.includes("tugasUntuk") && src.includes("/api/tasks?command_id="));
cek("pending filter server", src.includes("?status=pending"));
cek("pending saring client tetap", src.includes('c.status === "pending"'));
cek("8 nama tool utuh", ["pdc_get_pending_commands", "pdc_report_progress", "pdc_report_completion", "pdc_report_error", "pdc_get_projects", "pdc_get_project_status", "pdc_get_task_history", "pdc_get_github_context"].every((t) => src.includes(t)));
cek("kontrak Selesai: tetap", src.includes("Selesai: ${summary}"));
cek("mcp-server build OK", existsSync(join(root, "mcp-server", "dist", "index.js")));

const api = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("API filter status+project", api.includes("BOLEH_STATUS") && api.includes("project_id"));
cek("API tolak status liar 400", api.includes("400"));
cek("API default lama utuh", api.includes("LIMIT 100"));

const plug = readFileSync(join(root, "plugins/pdc-presence.js"), "utf8");
cek("presence default prod", plug.includes("https://project-develop-center.vercel.app") && !plug.includes('|| "http://localhost:3000"'));
cek("presence versi cocok status (v1.18: 2026.10.12)", plug.includes('VERSI_PLUGIN = "2026.10.12"'));

const readme = readFileSync(join(root, "mcp-server/README.md"), "utf8");
cek("readme contoh prod", readme.includes("https://project-develop-center.vercel.app"));

if (gagal > 0) {
  console.log(`\nMCP-BRIDGE: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nMCP-BRIDGE: ALL-OK");




