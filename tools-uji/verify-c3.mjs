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
  "components/activity/ActivityFeed.tsx",
  "components/command/CommandModal.tsx",
  "components/dashboard/ProjectCard.tsx",
  "components/dashboard/Dashboard.tsx",
  "app/page.tsx",
]) {
  cek(f, existsSync(join(root, f)));
}

const feed = readFileSync(join(root, "components/activity/ActivityFeed.tsx"), "utf8");
cek("feed judul (kamus)", feed.includes("feed.judul"));
cek("feed tanpa mock (jujur, P4)", !feed.includes("activityFeed") && !feed.includes("mockFeed"));
cek("feed empty-state (kamus)", feed.includes("feed.kosong"));

const modal = readFileSync(join(root, "components/command/CommandModal.tsx"), "utf8");
cek("modal judul (kamus)", modal.includes("cmd.judul"));
cek("modal select proyek (kamus)", modal.includes("cmd.pilihProyek"));
cek("modal textarea (kamus)", modal.includes("cmd.instruksi"));
cek("modal tombol Kirim/Batal (kamus)", modal.includes("cmd.kirim") && modal.includes("modal.batal"));
cek("modal escape handler", modal.includes("Escape"));

const page = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("page pakai ActivityFeed", page.includes("ActivityFeed"));
cek("page pakai CommandModal", page.includes("CommandModal"));
cek("wiring onCommand", page.includes("onCommand"));

const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu teruskan onCommand", card.includes("onCommand"));

if (gagal > 0) {
  console.log(`\nC3-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nC3-CEK: ALL-OK");
