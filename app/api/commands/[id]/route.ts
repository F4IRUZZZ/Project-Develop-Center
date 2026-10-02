import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";

const BOLEH = new Set(["processing", "completed", "failed"]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  let body: { status?: string; result?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  if (!body.status || !BOLEH.has(body.status)) {
    return NextResponse.json({ error: galat(req, "cmdStatusTrio") }, { status: 400 });
  }

  const selesai = body.status === "completed" || body.status === "failed";
  const rows = await db()`
    UPDATE command_queue
    SET status = ${body.status},
        processed_at = CASE WHEN ${selesai} THEN now() ELSE processed_at END,
        result = COALESCE(${body.result ?? null}, result)
    WHERE id = ${id} AND user_id = ${ctx.userId}
    RETURNING id
  `;
  if (rows.length === 0) return NextResponse.json({ error: galat(req, "cmdHilang") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
