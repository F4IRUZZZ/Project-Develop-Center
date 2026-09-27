import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("GAGAL: DATABASE_URL kosong. Isi .env.local dulu (lihat .env.example).");
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(join(root, "db", "schema.sql"), "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const st of statements) {
  await sql.query(st);
}
console.log(`MIGRASI-OK: ${statements.length} statement (users + command_queue siap)`);
