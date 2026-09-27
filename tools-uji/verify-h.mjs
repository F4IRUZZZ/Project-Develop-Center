import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("app/api/pulls/merge/route.ts", existsSync(join(root, "app/api/pulls/merge/route.ts")));
cek("components/command/PullModal.tsx", existsSync(join(root, "components/command/PullModal.tsx")));

const merge = readFileSync(join(root, "app/api/pulls/merge/route.ts"), "utf8");
cek("merge via PUT GitHub", merge.includes("/merge") && merge.includes('method: "PUT"'));
cek("merge_method merge commit", merge.includes('"merge"'));
cek("merge tulis activity", merge.includes("activity_log"));
cek("merge 405 jelas", merge.includes("405"));

const modal = readFileSync(join(root, "components/command/PullModal.tsx"), "utf8");
cek("pullmodal daftar + confirm", modal.includes("open_prs") && modal.includes("ConfirmModal"));

const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu tombol PR waiting", card.includes("onPulls") && card.includes("PrButton"));

const proyek = readFileSync(join(root, "app/proyek/page.tsx"), "utf8");
cek("proyek wiring PullModal", proyek.includes("PullModal") && proyek.includes("onMerged"));

if (gagal > 0) {
  console.log(`\nH-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nH-CEK: ALL-OK");
