import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db, dbSiap } from "@/lib/db";
import { dekrip, enkrip } from "@/lib/crypto";
import { bacaBearer, verifikasiApiKey } from "@/lib/api-key";
import { buatId } from "@/lib/id";

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

// Auth via sesi JWT (browser) ATAU Bearer API key (MCP bridge, D4).
export async function sesiUser(req: NextRequest): Promise<Ctx | ApiError> {
  if (!dbSiap()) return { error: "Database belum dikonfigurasi", status: 503 };

  const bearer = bacaBearer(req);
  if (bearer) {
    const userId = await verifikasiApiKey(bearer);
    if (!userId) return { error: "API key tidak valid / dicabut", status: 401 };
    const ada = await db()`SELECT id FROM users WHERE id = ${userId}`;
    if (ada.length === 0) return { error: "Akun belum pernah login via web", status: 401 };
    return { userId };
  }

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

export { buatId };

// Ambil token GitHub user (dekrip) untuk fetch server-side.
export async function tokenGitHub(userId: string): Promise<string | null> {
  const rows = await db()`SELECT access_token_enc FROM users WHERE id = ${userId}`;
  const enc = (rows[0] as { access_token_enc?: string } | undefined)?.access_token_enc;
  if (!enc) return null;
  try {
    return dekrip(enc);
  } catch {
    return null;
  }
}
