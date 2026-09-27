import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { buatId } from "./id";

const PREFIX = "pdc_";

// API key untuk MCP bridge (D4). Secret mentah hanya tampil sekali saat generate;
// di DB hanya tersimpan hash SHA-256.
export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function buatApiKey(userId: string, name: string): Promise<{ id: string; key: string; prefix: string }> {
  const raw = `${PREFIX}${randomBytes(32).toString("hex")}`;
  const id = buatId("key");
  const prefix = raw.slice(0, 12);
  await db()`INSERT INTO api_keys (id, user_id, name, key_hash, prefix) VALUES (${id}, ${userId}, ${name}, ${hashKey(raw)}, ${prefix})`;
  return { id, key: raw, prefix };
}

export async function verifikasiApiKey(key: string): Promise<string | null> {
  if (!key.startsWith(PREFIX)) return null;
  const rows = await db()`SELECT id, user_id, revoked FROM api_keys WHERE key_hash = ${hashKey(key)}`;
  const row = rows[0] as { id: string; user_id: string; revoked: boolean } | undefined;
  if (!row || row.revoked) return null;
  await db()`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.id}`;
  return row.user_id;
}

export function bacaBearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
