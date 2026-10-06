import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Angka dashboard dari DB (bukan mock): proyek aktif, AI bekerja, task selesai.
// AI Bekerja = UNION front sesi-bekerja (active + denyut <3 mnt + sinyal
// kerja <2 mnt — ambang identik definisi "bekerja" di tab/kartu/beranda;
// COALESCE agar plugin lama (sunting-saja) tetap terhitung) dan task
// working/stuck, DISTINCT per proyek (tanpa duplikat bila beriringan).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();
  const [p, j, s] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM projects WHERE user_id = ${ctx.userId} AND is_active = true`,
    sql`SELECT COUNT(DISTINCT project_id)::int AS n FROM (
      SELECT project_id FROM tasks
      WHERE user_id = ${ctx.userId} AND status IN ('working', 'stuck') AND project_id IS NOT NULL
      UNION
      SELECT project_id FROM agent_sessions
      WHERE user_id = ${ctx.userId} AND status = 'active' AND mode = 'build'
        AND last_seen_at > now() - interval '3 minutes'
        AND COALESCE(last_work_at, last_edit_at) > now() - interval '2 minutes'
        AND (last_idle_at IS NULL OR COALESCE(last_work_at, last_edit_at) > last_idle_at)
        AND project_id IS NOT NULL
    ) t`,
    sql`SELECT COUNT(*)::int AS n FROM tasks WHERE user_id = ${ctx.userId} AND status = 'completed'`,
  ]);

  return NextResponse.json({
    proyekAktif: (p[0] as { n: number }).n,
    aiBekerja: (j[0] as { n: number }).n,
    tugasSelesai: (s[0] as { n: number }).n,
  });
}
