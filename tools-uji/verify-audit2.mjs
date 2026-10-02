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

// H3 — eslint nol error (dijaga via pipeline, bukan file tunggal)
cek("lib/queue pendengar const", readFileSync(join(root, "lib/queue.ts"), "utf8").includes("const pendengar"));
cek("ConfirmModal lazy mounted", readFileSync(join(root, "components/ui/ConfirmModal.tsx"), "utf8").includes("useState(() => typeof document"));
cek("tema default-dulu pengaturan (anti #418)", readFileSync(join(root, "app/pengaturan/page.tsx"), "utf8").includes('useState<Tema>("gelap")'));

// M2 — LIMIT antrian
const cmd = readFileSync(join(root, "app/api/commands/route.ts"), "utf8");
cek("commands LIMIT 100", cmd.includes("LIMIT 100"));

// M4 — timeout bridge
const src = readFileSync(join(mcp, "src/index.ts"), "utf8");
cek("AbortSignal.timeout", src.includes("AbortSignal.timeout(15000)"));
cek("mcp-server build OK", existsSync(join(mcp, "dist", "index.js")));

// M7 — dedup webhook
const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
cek("tabel webhook_deliveries", schema.includes("CREATE TABLE IF NOT EXISTS webhook_deliveries"));
const hook = readFileSync(join(root, "app/api/github/hook/route.ts"), "utf8");
cek("cek x-github-delivery", hook.includes("x-github-delivery") && hook.includes("duplikat delivery"));

if (gagal > 0) {
  console.log(`\nAUDIT2-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nAUDIT2-CEK: ALL-OK");
