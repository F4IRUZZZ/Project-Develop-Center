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
  "lib/tasks.ts",
  "components/command/PendingBadge.tsx",
  "components/command/QueuePanel.tsx",
  "components/command/CommandModal.tsx",
  "components/dashboard/ProjectCard.tsx",
  "app/page.tsx",
]) {
  cek(f, existsSync(join(root, f)));
}

const tasks = readFileSync(join(root, "lib/tasks.ts"), "utf8");
cek("tipe QueuedCommand", tasks.includes("QueuedCommand"));
cek("lifecycle pending/processing/completed", tasks.includes('"pending"') && tasks.includes('"processing"') && tasks.includes('"completed"'));
cek("key pdc-queue", tasks.includes("pdc-queue"));
cek("fn enqueue", tasks.includes("export function enqueue"));
cek("fn bersihkanSelesai", tasks.includes("bersihkanSelesai"));

const modal = readFileSync(join(root, "components/command/CommandModal.tsx"), "utf8");
cek("modal enqueue saat Kirim", modal.includes("enqueue(projectId, text)"));

const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu badge pending", card.includes("PendingBadge"));

const panel = readFileSync(join(root, "components/command/QueuePanel.tsx"), "utf8");
cek("panel judul Antrian", panel.includes("Antrian Perintah"));
cek("panel tombol bersihkan", panel.includes("Bersihkan selesai"));

const page = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("page pakai QueuePanel", page.includes("QueuePanel"));

if (gagal > 0) {
  console.log(`\nD1-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nD1-CEK: ALL-OK");
