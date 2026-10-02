import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const q = readFileSync(join(root, "lib/queue.ts"), "utf8");
cek("fn migrasiLokalKeApi", q.includes("export async function migrasiLokalKeApi"));
cek("migrasi POST /api/commands", q.includes("/api/commands") && q.includes("POST"));
cek("migrasi hapus lokal yg terpindah", q.includes("KUNCI_QUEUE") && q.includes("terpindah"));
cek("migrasi sekali per login", q.includes("sudahMigrasi"));
cek("info migrasi + tutup", q.includes("bacaInfoMigrasi") && q.includes("tutupInfoMigrasi"));
cek("useQueue kembalikan sumber", q.includes("sumber")); 
cek("tanpa auto-simulasi api", !q.includes("jadwalSimulasi"));

const panel = readFileSync(join(root, "components/command/QueuePanel.tsx"), "utf8");
cek("panel label Server/Lokal (kamus)", panel.includes("antre.server") && panel.includes("antre.lokal"));
cek("panel banner migrasi", panel.includes("infoMigrasi"));
cek("panel warning lokal (kamus)", panel.includes("antre.lokalWarn"));

const tasks = readFileSync(join(root, "lib/tasks.ts"), "utf8");
cek("kontrak QueuedCommand stabil", tasks.includes("QueuedCommand") && tasks.includes("pdc-queue"));

if (gagal > 0) {
  console.log(`\nQUEUE-UNIFIED: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nQUEUE-UNIFIED: ALL-OK");
