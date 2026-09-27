import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buatId, isErr, sesiUser } from "@/lib/server-auth";
import type { QueuedCommand } from "@/lib/tasks";

function baris(r: Record<string, unknown>): QueuedCommand {
  return {
    id: String(r.id),
    project_id: String(r.project_id),
    command_text: String(r.command_text),
    status: r.status as QueuedCommand["status"],
    created_at: new Date(r.created_at as string).toISOString(),
    processed_at: r.processed_at ? new Date(r.processed_at as string).toISOString() : null,
    result: (r.result as string | null) ?? null,
  };
}

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const rows = await db()`SELECT * FROM command_queue WHERE user_id = ${ctx.userId} ORDER BY created_at DESC`;
  return NextResponse.json((rows as Record<string, unknown>[]).map(baris));
}

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { project_id?: string; command_text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const projectId = body.project_id?.trim() ?? "";
  const text = body.command_text?.trim() ?? "";
  if (!projectId || !text) {
    return NextResponse.json({ error: "project_id + command_text wajib" }, { status: 400 });
  }

  const id = buatId("cmd");
  await db()`INSERT INTO command_queue (id, user_id, project_id, command_text, status) VALUES (${id}, ${ctx.userId}, ${projectId}, ${text}, 'pending')`;
  const rows = await db()`SELECT * FROM command_queue WHERE id = ${id}`;
  return NextResponse.json(baris(rows[0] as Record<string, unknown>), { status: 201 });
}
