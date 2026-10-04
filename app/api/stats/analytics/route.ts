import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Analitik produktivitas AI 30 hari (PRD F14). Murni agregat baca dari
// tabel yang ADA (tasks/command_queue/activity_log) — nol migrasi DB.
export interface Analitik {
  perMinggu: Array<{ minggu: string; selesai: number; gagal: number }>;
  rataMenit: number | null;
  totalSelesai: number;
  errorRate: number;
  repoTersibuk: Array<{ repo: string; n: number }>;
  jamTersibuk: number | null;
}

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();
  const [mingguan, durasi, total, repo, jam] = await Promise.all([
    sql`
      SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS minggu,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS selesai,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS gagal
      FROM tasks
      WHERE user_id = ${ctx.userId} AND created_at > now() - interval '30 days'
      GROUP BY 1 ORDER BY 1`,
    sql`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)::float AS rata
      FROM tasks
      WHERE user_id = ${ctx.userId} AND status = 'completed'
        AND completed_at IS NOT NULL
        AND created_at > now() - interval '30 days'`,
    sql`
      SELECT COUNT(*) FILTER (WHERE status = 'completed')::int AS selesai,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS gagal
      FROM tasks
      WHERE user_id = ${ctx.userId} AND created_at > now() - interval '30 days'`,
    sql`
      SELECT p.repo_name AS repo, COUNT(*)::int AS n
      FROM tasks t JOIN projects p ON p.id = t.project_id
      WHERE t.user_id = ${ctx.userId} AND t.created_at > now() - interval '30 days'
      GROUP BY 1 ORDER BY n DESC LIMIT 5`,
    sql`
      SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Jakarta')::int AS jam,
        COUNT(*)::int AS n
      FROM activity_log
      WHERE user_id = ${ctx.userId} AND created_at > now() - interval '30 days'
      GROUP BY 1 ORDER BY n DESC LIMIT 1`,
  ]);

  const t = (total[0] ?? { selesai: 0, gagal: 0 }) as unknown as { selesai: number; gagal: number };
  const semua = t.selesai + t.gagal;
  const data: Analitik = {
    perMinggu: mingguan as unknown as Analitik["perMinggu"],
    rataMenit: ((durasi[0] as unknown as { rata: number | null })?.rata ?? null) as number | null,
    totalSelesai: t.selesai,
    errorRate: semua > 0 ? t.gagal / semua : 0,
    repoTersibuk: repo as unknown as Analitik["repoTersibuk"],
    jamTersibuk: ((jam[0] as unknown as { jam: number } | undefined)?.jam ?? null) as number | null,
  };
  return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=600" } });
}
