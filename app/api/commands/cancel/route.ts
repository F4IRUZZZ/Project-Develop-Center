import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buatId, isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";
import { TANDA_STOP } from "@/lib/tasks";

// Hentikan kerja proyek: batalkan command pending/processing -> failed,
// task terbaru -> failed, tulis activity error.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { project_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const projectId = body.project_id?.trim() ?? "";
  if (!projectId) return NextResponse.json({ error: galat(req, "proyekIdWajib") }, { status: 400 });

  const sql = db();
  const cmds = await sql`UPDATE command_queue SET status = 'failed', processed_at = now(), result = ${TANDA_STOP} WHERE user_id = ${ctx.userId} AND project_id = ${projectId} AND status IN ('pending', 'processing') RETURNING id`;
  await sql`UPDATE tasks SET status = 'failed', completed_at = now(), updated_at = now(), result_summary = ${TANDA_STOP} WHERE user_id = ${ctx.userId} AND project_id = ${projectId} AND status IN ('idle', 'working', 'waiting', 'stuck')`;
  await sql`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${buatId("act")}, ${ctx.userId}, ${projectId}, 'error', 'Stop: kerja AI dihentikan pengguna.')`;

  return NextResponse.json({ ok: true, dibatalkan: cmds.length });
}
