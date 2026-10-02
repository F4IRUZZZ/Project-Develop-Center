import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";

const BOLEH = new Set(["idle", "working", "waiting", "completed", "failed", "stuck"]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  let body: { status?: string; progress?: number; result_summary?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  if (body.status !== undefined && !BOLEH.has(body.status)) {
    return NextResponse.json({ error: galat(req, "taskStatusUnknown") }, { status: 400 });
  }
  if (body.progress !== undefined && (body.progress < 0 || body.progress > 100)) {
    return NextResponse.json({ error: galat(req, "taskProgress") }, { status: 400 });
  }

  const selesai = body.status === "completed" || body.status === "failed";
  const rows = await db()`
    UPDATE tasks
    SET status = COALESCE(${body.status ?? null}, status),
        progress = COALESCE(${body.progress ?? null}, progress),
        result_summary = COALESCE(${body.result_summary ?? null}, result_summary),
        completed_at = CASE WHEN ${selesai} THEN now() ELSE completed_at END,
        updated_at = now()
    WHERE id = ${id} AND user_id = ${ctx.userId}
    RETURNING id
  `;
  if (rows.length === 0) return NextResponse.json({ error: galat(req, "taskHilang") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
