import { neon } from "@neondatabase/serverless";

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi (lihat .env.example)");
  return neon(url);
}

export function dbSiap(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
