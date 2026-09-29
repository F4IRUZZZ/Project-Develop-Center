import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

// J1
cek("app/api/stats/route.ts", existsSync(join(root, "app/api/stats/route.ts")));
const stats = readFileSync(join(root, "app/api/stats/route.ts"), "utf8");
cek("stats hitung DB", stats.includes("COUNT(*)") && stats.includes("tugasSelesai"));
cek("aiBekerja union sesi+task", stats.includes("UNION") && stats.includes("last_edit_at") && stats.includes("COUNT(DISTINCT project_id)"));
const page = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("stats pakai API", page.includes("/api/stats"));
const halProyek = readFileSync(join(root, "app/proyek/page.tsx"), "utf8");
cek("proyek stats asli (bukan mock)", halProyek.includes("/api/stats"));

// J2
const dash = readFileSync(join(root, "app/api/dashboard/route.ts"), "utf8");
cek("flag adaJalan", dash.includes("jalanSet") && dash.includes("pending") && dash.includes("'working'"));

// J3
cek("app/proyek/[id]/page.tsx", existsSync(join(root, "app/proyek/[id]/page.tsx")));
const detail = readFileSync(join(root, "app/proyek/[id]/page.tsx"), "utf8");
cek("detail tab 3", detail.includes('"tugas"') && detail.includes('"perintah"') && detail.includes('"aktivitas"'));
cek("detail progress task", detail.includes("aktif") && detail.includes("progress"));
const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu link detail", card.includes("/proyek/${project.id}") || card.includes("/proyek/"));
cek("detail stop kondisional", detail.includes("adaJalan"));

if (gagal > 0) {
  console.log(`\nJ-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nJ-CEK: ALL-OK");
