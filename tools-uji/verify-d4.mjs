import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mcp = join(root, "mcp-server");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of [
  "lib/api-key.ts",
  "lib/id.ts",
  "app/api/keys/route.ts",
  "app/api/keys/[id]/route.ts",
  "app/pengaturan/page.tsx",
  "mcp-server/package.json",
  "mcp-server/tsconfig.json",
  "mcp-server/src/index.ts",
  "mcp-server/README.md",
]) {
  cek(f, existsSync(join(root, f)));
}

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel api_keys", schema.includes("CREATE TABLE IF NOT EXISTS api_keys"));

const ak = readFileSync(join(root, "lib/api-key.ts"), "utf8");
cek("hash SHA-256", ak.includes("sha256"));
cek("prefix pdc_", ak.includes("pdc_"));

const sa = readFileSync(join(root, "lib/server-auth.ts"), "utf8");
cek("auth Bearer alternatif sesi", sa.includes("bacaBearer") && sa.includes("verifikasiApiKey"));

const src = readFileSync(join(mcp, "src/index.ts"), "utf8");
for (const t of ["pdc_get_pending_commands", "pdc_report_progress", "pdc_report_completion", "pdc_report_error"]) {
  cek(`tool ${t}`, src.includes(t));
}
cek("transport stdio", src.includes("StdioServerTransport"));

const pkg = JSON.parse(readFileSync(join(mcp, "package.json"), "utf8"));
cek("dep MCP SDK", Boolean(pkg.dependencies?.["@modelcontextprotocol/server"]));
cek("mcp-server build OK", existsSync(join(mcp, "dist", "index.js")));

const keys = readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8");
cek("halaman kelola key", keys.includes("/api/keys") && keys.includes("Buat key baru"));

if (gagal > 0) {
  console.log(`\nD4-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nD4-CEK: ALL-OK");
