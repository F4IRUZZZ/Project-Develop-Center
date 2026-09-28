import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Daftarkan/segarkan sesi AI (dipanggil plugin OpenCode, auth Bearer key mesin).
// Upsert by session_id: buka sesi baru atau segarkan yang hidup.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { session_id?: string; repo_full?: string; project_id?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const sessionId = body.session_id?.trim() ?? "";
  if (!sessionId) return NextResponse.json({ error: "session_id wajib" }, { status: 400 });
  const mode = body.mode === "plan" ? "plan" : "build";

  const sql = db();
  let projectId: string | null = body.project_id?.trim() || null;
  if (!projectId && body.repo_full) {
    const cari = await sql`SELECT id FROM projects WHERE user_id = ${ctx.userId} AND repo_full = ${body.repo_full.trim()} LIMIT 1`;
    projectId = ((cari[0] as { id?: string } | undefined)?.id ?? null) as string | null;
  }

  await sql`
    INSERT INTO agent_sessions (session_id, user_id, project_id, repo_full, mode, status, last_seen_at)
    VALUES (${sessionId}, ${ctx.userId}, ${projectId}, ${body.repo_full?.trim() ?? null}, ${mode}, 'active', now())
    ON CONFLICT (session_id) DO UPDATE SET
      last_seen_at = now(),
      status = CASE WHEN agent_sessions.status = 'active' THEN 'active' ELSE agent_sessions.status END
  `;
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Heartbeat (idle) vs tutup (error).
// session.idle fire tiap agent selesai menjawab (menunggu input) — BUKAN sesi
// berakhir — jadi ia hanya menyegarkan status active + last_seen_at (ended_at
// dibersihkan). Selesai sejati: timeout 15 mnt di flag sesiAktif dashboard.
// session.error tetap final karena butuh perhatian user.
export async function PATCH(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { session_id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const sessionId = body.session_id?.trim() ?? "";
  if (!sessionId) return NextResponse.json({ error: "session_id wajib" }, { status: 400 });

  const sql = db();
  if (body.status === "error") {
    const tutup = await sql`UPDATE agent_sessions SET status = 'error', ended_at = now(), last_seen_at = now() WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} RETURNING session_id`;
    if (tutup.length === 0) return NextResponse.json({ error: "Sesi tidak ketemu" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const denyut = await sql`UPDATE agent_sessions SET status = 'active', ended_at = NULL, last_seen_at = now() WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} RETURNING session_id`;
  if (denyut.length === 0) return NextResponse.json({ error: "Sesi tidak ketemu" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Riwayat sesi (filter opsional ?project_id=), terbaru dulu.
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const projectId = new URL(req.url).searchParams.get("project_id");
  const rows = projectId
    ? await db()`SELECT session_id, project_id, repo_full, mode, status, started_at, last_seen_at, ended_at FROM agent_sessions WHERE user_id = ${ctx.userId} AND project_id = ${projectId} ORDER BY last_seen_at DESC LIMIT 20`
    : await db()`SELECT session_id, project_id, repo_full, mode, status, started_at, last_seen_at, ended_at FROM agent_sessions WHERE user_id = ${ctx.userId} ORDER BY last_seen_at DESC LIMIT 50`;
  return NextResponse.json(rows);
}
