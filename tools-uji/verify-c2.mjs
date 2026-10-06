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
  "lib/types.ts",
  "lib/mock.ts",
  "components/dashboard/Stats.tsx",
  "components/dashboard/StatusBadge.tsx",
  "components/dashboard/ProjectCard.tsx",
  "components/dashboard/Dashboard.tsx",
  "app/page.tsx",
]) {
  cek(f, existsSync(join(root, f)));
}

const mock = readFileSync(join(root, "lib/mock.ts"), "utf8");
cek("mock 3 proyek", mock.includes("my-awesome-project") && mock.includes("ecommerce-api") && mock.includes("portfolio-site"));
cek("mock progress 45", mock.includes("progress: 45"));

const card = readFileSync(join(root, "components/dashboard/ProjectCard.tsx"), "utf8");
cek("kartu tanpa Merge PR (dihapus E3)", !card.includes("Merge PR"));
cek("kartu aksi Stop", card.includes("Stop"));
cek("kartu aksi Perintah (kamus)", card.includes("kartu.perintah"));
cek("chip aktif dot tanpa teks", card.includes('role="img"') && card.includes("h-5 w-5"));
cek("chip bekerja dot + aria", card.includes("kartu.titleBekerja") && card.includes('aria-label={teks("kartu.aiBekerja")}'));
cek("header kartu anti-jepit (#192)", card.includes("min-w-0 flex-1") && card.includes("justify-between gap-3"));
cek("nama + repoFull truncate + title", card.includes("flex-1 truncate") && card.includes("title={project.repoName}") && card.includes("title={project.repoFull}"));
cek("dot sesi shrink-0", card.includes("h-5 w-5 shrink-0"));

const badge = readFileSync(join(root, "components/dashboard/StatusBadge.tsx"), "utf8");
cek("badge utuh anti-lipat", badge.includes("shrink-0") && badge.includes("whitespace-nowrap"));
cek("tombol PR selalu tampil (#194)", card.includes("tampilPr = !readOnly") && !card.includes('status === "waiting"'));
cek("stop terikat actions (#200)", card.includes("bolehStop") && card.includes('"stop"') && !card.includes("tampilPr ?"));
cek("perintah dari actions (#200)", card.includes("bolehPerintah") && card.includes('"command"'));

const page = readFileSync(join(root, "app/page.tsx"), "utf8");
cek("page pakai Dashboard", page.includes("Dashboard"));

if (gagal > 0) {
  console.log(`\nC2-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nC2-CEK: ALL-OK");
