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

// Filter opsional ?status= (allowlist) + ?project_id= untuk MCP bridge (P5).
// Backward-compatible: tanpa param = perilaku lama (semua, LIMIT 100).
const BOLEH_STATUS = new Set(["pending", "processing", "completed", "failed"]);

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const params = new URL(req.url).searchParams;
  const status = params.get("status");
  const projectId = params.get("project_id");
  if (status && !BOLEH_STATUS.has(status)) {
    return NextResponse.json({ error: "status harus pending|processing|completed|failed" }, { status: 400 });
  }

  const rows =
    status && projectId
      ? await db()`SELECT * FROM command_queue WHERE user_id = ${ctx.userId} AND status = ${status} AND project_id = ${projectId} ORDER BY created_at DESC LIMIT 100`
      : status
        ? await db()`SELECT * FROM command_queue WHERE user_id = ${ctx.userId} AND status = ${status} ORDER BY created_at DESC LIMIT 100`
        : projectId
          ? await db()`SELECT * FROM command_queue WHERE user_id = ${ctx.userId} AND project_id = ${projectId} ORDER BY created_at DESC LIMIT 100`
          : await db()`SELECT * FROM command_queue WHERE user_id = ${ctx.userId} ORDER BY created_at DESC LIMIT 100`;
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
  const taskId = buatId("task");
  const sql = db();
  // Tolak project_id asing agar tabel projects tak tercemar baris placeholder.
  const cekProyek = await sql`SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${ctx.userId}`;
  if (cekProyek.length === 0) {
    return NextResponse.json({ error: "Proyek tidak ketemu, sync dulu" }, { status: 404 });
  }
  await sql`INSERT INTO command_queue (id, user_id, project_id, command_text, status) VALUES (${id}, ${ctx.userId}, ${projectId}, ${text}, 'pending')`;
  await sql`INSERT INTO tasks (id, user_id, project_id, command_id, title, status, progress) VALUES (${taskId}, ${ctx.userId}, ${projectId}, ${id}, ${text}, 'working', 0)`;
  await sql`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${buatId("act")}, ${ctx.userId}, ${projectId}, 'info', ${`Perintah baru: ${text}`})`;
  const rows = await sql`SELECT * FROM command_queue WHERE id = ${id}`;
  return NextResponse.json({ ...baris(rows[0] as Record<string, unknown>), task_id: taskId }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  // RETURNING agar hitungan jujur (tanpanya driver kembalikan array kosong).
  const hasil = await db()`DELETE FROM command_queue WHERE user_id = ${ctx.userId} AND status IN ('completed', 'failed') RETURNING id`;
  return NextResponse.json({ ok: true, dihapus: hasil.length });
}
