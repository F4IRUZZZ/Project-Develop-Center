import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Notifikasi turunan: pr/error + info "Selesai:" 24 jam + flag dibaca.
// ?type= (allowlist) untuk filter eksplisit; default = himpunan penting.
// LEFT JOIN agar aktivitas yatim (proyek dihapus) tetap terlihat.
const BOLEH_FILTER = new Set(["pr", "error", "info", "commit", "issue", "progress"]);

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const tipe = new URL(req.url).searchParams.get("type");
  const rows = (tipe && BOLEH_FILTER.has(tipe)
    ? await db()`
      SELECT a.id, a.project_id, p.repo_name, a.type, a.message, a.created_at,
        (r.activity_id IS NOT NULL) AS dibaca
      FROM activity_log a
      LEFT JOIN projects p ON p.id = a.project_id
      LEFT JOIN notification_reads r ON r.activity_id = a.id AND r.user_id = a.user_id
      WHERE a.user_id = ${ctx.userId}
        AND a.type = ${tipe}
        AND a.created_at > now() - interval '24 hours'
      ORDER BY a.created_at DESC
      LIMIT 50
    `
    : await db()`
      SELECT a.id, a.project_id, p.repo_name, a.type, a.message, a.created_at,
        (r.activity_id IS NOT NULL) AS dibaca
      FROM activity_log a
      LEFT JOIN projects p ON p.id = a.project_id
      LEFT JOIN notification_reads r ON r.activity_id = a.id AND r.user_id = a.user_id
      WHERE a.user_id = ${ctx.userId}
        AND (a.type IN ('pr', 'error') OR (a.type = 'info' AND a.message LIKE 'Selesai:%'))
        AND a.created_at > now() - interval '24 hours'
      ORDER BY a.created_at DESC
      LIMIT 50
    `) as Record<string, unknown>[];

  return NextResponse.json(
    rows.map((r) => ({
      id: String(r.id),
      project_id: String(r.project_id),
      repo_name: String(r.repo_name ?? ""),
      type: String(r.type),
      message: String(r.message),
      created_at: new Date(r.created_at as string).toISOString(),
      dibaca: Boolean(r.dibaca),
    }))
  );
}
