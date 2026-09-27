import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Tandai dibaca: satu activity atau semua.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { activity_id?: string; semua?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const sql = db();
  if (body.semua) {
    await sql`
      INSERT INTO notification_reads (activity_id, user_id)
      SELECT a.id, a.user_id FROM activity_log a
      WHERE a.user_id = ${ctx.userId} AND a.type IN ('pr', 'error')
        AND a.created_at > now() - interval '24 hours'
      ON CONFLICT DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  }

  if (!body.activity_id?.trim()) {
    return NextResponse.json({ error: "activity_id / semua wajib" }, { status: 400 });
  }
  await sql`INSERT INTO notification_reads (activity_id, user_id) VALUES (${body.activity_id.trim()}, ${ctx.userId}) ON CONFLICT DO NOTHING`;
  return NextResponse.json({ ok: true });
}
