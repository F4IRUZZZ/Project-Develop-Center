import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Jejak aktivitas sesi (dipanggil plugin OpenCode, auth Bearer key mesin).
// METADATA SAJA: path file + angka stat + sha komit. Isi file/pesan DILARANG
// dikirim (kontrak privasi opsi A) — route ini menolak field di luar skema.
type Masuk = {
  kind?: string;
  file_path?: string;
  files_changed?: number;
  lines_added?: number;
  lines_removed?: number;
  commit_sha?: string;
};

const BATAS_EVENT = 50;

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { session_id?: string; events?: Masuk[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const sessionId = body.session_id?.trim() ?? "";
  if (!sessionId) return NextResponse.json({ error: "session_id wajib" }, { status: 400 });
  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: "events wajib diisi" }, { status: 400 });
  }

  const sql = db();
  const ada =
    await sql`SELECT 1 FROM agent_sessions WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} LIMIT 1`;
  if (ada.length === 0) return NextResponse.json({ error: "Sesi tidak ketemu" }, { status: 404 });

  let adaSunting = false;
  let masuk = 0;
  for (const e of body.events.slice(0, BATAS_EVENT)) {
    const kind = e?.kind === "commit" ? "commit" : "edit";
    const path = typeof e?.file_path === "string" ? e.file_path.slice(0, 500) : null;
    const sha = typeof e?.commit_sha === "string" ? e.commit_sha.slice(0, 40) : null;
    const num = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1000000, Math.floor(v))) : null;
    if (kind === "edit") adaSunting = true;
    await sql`INSERT INTO session_file_events
      (session_id, user_id, kind, file_path, files_changed, lines_added, lines_removed, commit_sha)
      VALUES (${sessionId}, ${ctx.userId}, ${kind}, ${path}, ${num(e?.files_changed)}, ${num(e?.lines_added)}, ${num(e?.lines_removed)}, ${sha})`;
    masuk += 1;
  }
  if (adaSunting) {
    await sql`UPDATE agent_sessions SET last_edit_at = now(), last_seen_at = now() WHERE session_id = ${sessionId}`;
  }
  return NextResponse.json({ ok: true, inserted: masuk }, { status: 201 });
}
