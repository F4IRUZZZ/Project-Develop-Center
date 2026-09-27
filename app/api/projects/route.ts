import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { syncProjects } from "@/lib/sync";

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const rows = await db()`SELECT * FROM projects WHERE user_id = ${ctx.userId} AND is_active = true ORDER BY updated_at DESC`;
  return NextResponse.json(rows);
}

// Sinkronisasi daftar repo GitHub -> tabel projects (upsert).
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    return NextResponse.json(await syncProjects(ctx.userId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync gagal";
    const status = msg.startsWith("GitHub API") ? 502 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
