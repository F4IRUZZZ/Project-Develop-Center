import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { buatApiKey } from "@/lib/api-key";

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const rows = await db()`SELECT id, name, prefix, revoked, last_used_at, created_at FROM api_keys WHERE user_id = ${ctx.userId} ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const name = body.name?.trim().slice(0, 60) || "opencode-local";
  const key = await buatApiKey(ctx.userId, name);
  return NextResponse.json(key, { status: 201 });
}
