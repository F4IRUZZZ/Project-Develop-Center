import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db, dbSiap } from "@/lib/db";
import { enkrip } from "@/lib/crypto";

export interface Ctx {
  userId: string;
}

export interface ApiError {
  error: string;
  status: number;
}

export function isErr(x: Ctx | ApiError): x is ApiError {
  return (x as ApiError).error !== undefined;
}

// Auth via JWT + upsert user + simpan token terenkripsi (PRD §14.2).
export async function sesiUser(req: NextRequest): Promise<Ctx | ApiError> {
  if (!dbSiap()) return { error: "Database belum dikonfigurasi", status: 503 };
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return { error: "Belum login GitHub", status: 401 };

  const userId = `u_${token.sub}`;
  const username =
    token.username ?? (token.name as string | undefined) ?? (token.email as string | undefined) ?? "github-user";
  const sql = db();
  const enc = token.accessToken ? enkrip(token.accessToken) : "";

  await sql`
    INSERT INTO users (id, github_id, github_username, email, avatar_url, access_token_enc, updated_at)
    VALUES (${userId}, ${token.sub}, ${username}, ${(token.email as string | undefined) ?? null}, ${(token.picture as string | undefined) ?? null}, ${enc}, now())
    ON CONFLICT (id) DO UPDATE SET
      github_username = EXCLUDED.github_username,
      email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url,
      access_token_enc = CASE WHEN EXCLUDED.access_token_enc <> '' THEN EXCLUDED.access_token_enc ELSE users.access_token_enc END,
      updated_at = now()
  `;

  return { userId };
}

export function buatId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
