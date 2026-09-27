import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Angka dashboard dari DB (bukan mock): proyek aktif, task jalan, task selesai.
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();
  const [p, j, s] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM projects WHERE user_id = ${ctx.userId} AND is_active = true`,
    sql`SELECT COUNT(*)::int AS n FROM tasks WHERE user_id = ${ctx.userId} AND status IN ('working', 'stuck')`,
    sql`SELECT COUNT(*)::int AS n FROM tasks WHERE user_id = ${ctx.userId} AND status = 'completed'`,
  ]);

  return NextResponse.json({
    proyekAktif: (p[0] as { n: number }).n,
    aiBekerja: (j[0] as { n: number }).n,
    tugasSelesai: (s[0] as { n: number }).n,
  });
}
