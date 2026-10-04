import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

cek("app/api/stats/analytics/route.ts", existsSync(join(root, "app/api/stats/analytics/route.ts")));
const api = readFileSync(join(root, "app/api/stats/analytics/route.ts"), "utf8");
cek("agregat mingguan", api.includes("perMinggu") && api.includes("date_trunc"));
cek("rata-rata durasi", api.includes("rataMenit") && api.includes("completed_at"));
cek("error rate", api.includes("errorRate"));
cek("repo + jam tersibuk", api.includes("repoTersibuk") && api.includes("jamTersibuk"));
cek("nol migrasi DB", !api.includes("CREATE TABLE") && !api.includes("ALTER TABLE"));
cek("auth sesiUser", api.includes("sesiUser"));
cek("cache privat", api.includes("max-age"));

const hal = readFileSync(join(root, "app/statistik/page.tsx"), "utf8");
cek("seksi analitik", hal.includes("stat.anaJudul") && hal.includes("/api/stats/analytics"));
cek("bar mingguan CSS", hal.includes("perMinggu") && hal.includes("bg-primary/70"));
cek("fallback kosong", hal.includes("stat.anaKosong"));

const kamus = readFileSync(join(root, "lib/kamus.ts"), "utf8");
cek("kunci ana ID+EN", ["stat.anaJudul", "stat.anaSelesai", "stat.anaRata", "stat.anaError", "stat.anaRepo", "stat.anaJam", "stat.anaKosong"].every((k) => kamus.includes(`"${k}"`)));

if (gagal > 0) {
  console.log(`\nANALYTICS: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nANALYTICS: ALL-OK");
