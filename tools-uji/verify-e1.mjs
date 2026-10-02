import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

for (const f of ["app/proyek/page.tsx", "app/riwayat/page.tsx", "app/api/tasks/route.ts"]) {
  cek(f, existsSync(join(root, f)));
}

const tasks = readFileSync(join(root, "app/api/tasks/route.ts"), "utf8");
cek("tasks?all=1", tasks.includes('"1"') && tasks.includes("repo_name"));

const proyek = readFileSync(join(root, "app/proyek/page.tsx"), "utf8");
cek("proyek tabel + sync", proyek.includes("Sync GitHub") && proyek.includes("/api/dashboard"));
cek("proyek modal perintah", proyek.includes("CommandModal"));

const riwayat = readFileSync(join(root, "app/riwayat/page.tsx"), "utf8");
cek("riwayat tab tugas+perintah", riwayat.includes('"tugas"') && riwayat.includes('"perintah"'));
cek("riwayat filter proyek (kamus)", riwayat.includes("riw.semuaProyek"));

const sidebar = readFileSync(join(root, "components/shell/Sidebar.tsx"), "utf8");
cek("nav proyek hidup", sidebar.includes('href: "/proyek"'));
cek("nav riwayat hidup", sidebar.includes('href: "/riwayat"'));

if (gagal > 0) {
  console.log(`\nE1-CEK: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nE1-CEK: ALL-OK");
