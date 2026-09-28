import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { enkrip } from "@/lib/crypto";
import { isErr, sesiUser } from "@/lib/server-auth";

const PROVIDERS = new Set(["openai", "anthropic", "github_pat"]);

// Daftar provider tersimpan TANPA nilai (nilai tak pernah dibaca balik).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const rows = await db()`SELECT provider, updated_at FROM provider_keys WHERE user_id = ${ctx.userId} ORDER BY provider`;
  return NextResponse.json(rows);
}

// Simpan/rotasi key (upsert, terenkripsi AES-256-GCM).
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { provider?: string; key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const provider = body.provider?.trim().toLowerCase() ?? "";
  const key = body.key?.trim() ?? "";
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "provider harus openai|anthropic|github_pat" }, { status: 400 });
  }
  if (key.length < 8) {
    return NextResponse.json({ error: "key minimal 8 karakter" }, { status: 400 });
  }

  await db()`
    INSERT INTO provider_keys (user_id, provider, key_enc, updated_at)
    VALUES (${ctx.userId}, ${provider}, ${enkrip(key)}, now())
    ON CONFLICT (user_id, provider) DO UPDATE SET key_enc = EXCLUDED.key_enc, updated_at = now()
  `;
  return NextResponse.json({ ok: true, provider }, { status: 201 });
}
