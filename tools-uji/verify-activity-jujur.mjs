import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "OK  " : "GAGAL"} ${nama}${detail ? ` — ${detail}` : ""}`);
  if (!ok) gagal += 1;
}

const feed = readFileSync(join(root, "components/activity/ActivityFeed.tsx"), "utf8");
cek("tanpa import mock", !feed.includes("lib/mock") && !feed.includes("mockFeed"));
cek("fallback daftar kosong", feed.includes("live ?? []"));
cek("empty-state ada", feed.includes("Belum ada aktivitas"));
cek("ikon success dipakai", feed.includes("success"));

const api = readFileSync(join(root, "app/api/activity/route.ts"), "utf8");
cek("Selesai: jadi success", api.includes("Selesai:") && api.includes('"success"'));
cek("NADA lain utuh", api.includes("progress") && api.includes("waiting") && api.includes("idle"));
cek("LEFT JOIN yatim tetap", api.includes("LEFT JOIN projects"));

if (gagal > 0) {
  console.log(`\nACTIVITY-JUJUR: ${gagal} gagal`);
  process.exit(1);
}
console.log("\nACTIVITY-JUJUR: ALL-OK");
