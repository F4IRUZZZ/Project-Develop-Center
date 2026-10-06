// Sekali jalan (#184): hapus task/feed "Selesai:" duplikat akibat bug
// done-per-giliran. DEFAULT DRY-RUN (lapor saja); tambah --eksekusi untuk
// benar-benar hapus. Dijalankan user dengan DATABASE_URL produksi:
//   $env:DATABASE_URL = '...' ; node tools-uji/bersih-duplikat-selesai.mjs [--eksekusi]
// Aturan simpan: task auto yang dirujuk agent_sessions.done_task_id dipertahankan;
// feed "Selesai: AI selesai bekerja%" dikelompokkan per pesan identik,
// dipertahankan yang terbaru. Task perintah PDC (command_id NOT NULL) dan
// feed lain TAK PERNAH tersentuh.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("GAGAL: DATABASE_URL kosong.");
  process.exit(1);
}
const eksekusi = process.argv.includes("--eksekusi");
const sql = neon(url);

// 1. Task auto (completed + tanpa command = lahir dari pencatatan done).
const auto = await sql`
  SELECT t.id, t.project_id, p.repo_name, t.title, t.created_at
  FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
  WHERE t.status = 'completed' AND t.command_id IS NULL
  ORDER BY t.created_at DESC`;
const dirujukRows = await sql`SELECT DISTINCT done_task_id AS id FROM agent_sessions WHERE done_task_id IS NOT NULL`;
const dirujuk = new Set(dirujukRows.map((r) => String(r.id)));
const hapusTask = auto.filter((t) => !dirujuk.has(String(t.id)));

// 2. Feed duplikat: pesan identik -> simpan terbaru.
const feed = await sql`
  SELECT id, project_id, message, created_at FROM activity_log
  WHERE type = 'info' AND message LIKE 'Selesai: AI selesai bekerja%'
  ORDER BY created_at DESC`;
const jumpa = new Set();
const hapusFeed = [];
for (const f of feed) {
  const kunci = `${f.project_id}::${f.message}`;
  if (jumpa.has(kunci)) hapusFeed.push(f);
  else jumpa.add(kunci);
}

console.log(`TASK AUTO: ${auto.length} baris, dirujuk sesi ${dirujuk.size}, akan dihapus ${hapusTask.length}`);
for (const t of hapusTask.slice(0, 20)) {
  console.log(`  - ${t.id} [${t.repo_name ?? "?"}] "${String(t.title).slice(0, 70)}" ${t.created_at}`);
}
if (hapusTask.length > 20) console.log(`  ... +${hapusTask.length - 20} lagi`);
console.log(`FEED DUPLIKAT: ${feed.length} baris Selesai:, akan dihapus ${hapusFeed.length}`);
for (const f of hapusFeed.slice(0, 20)) {
  console.log(`  - ${f.id} "${String(f.message).slice(0, 80)}" ${f.created_at}`);
}
if (hapusFeed.length > 20) console.log(`  ... +${hapusFeed.length - 20} lagi`);

if (!eksekusi) {
  console.log("\nDRY-RUN: tanpa --eksekusi, tak ada yang dihapus.");
  process.exit(0);
}
let n = 0;
for (const t of hapusTask) {
  await sql`DELETE FROM tasks WHERE id = ${t.id}`;
  n += 1;
}
let m = 0;
for (const f of hapusFeed) {
  await sql`DELETE FROM activity_log WHERE id = ${f.id}`;
  m += 1;
}
console.log(`\nEKSEKUSI-OK: ${n} task + ${m} feed dihapus.`);
