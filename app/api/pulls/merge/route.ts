import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buatId, isErr, sesiUser, tokenGitHub } from "@/lib/server-auth";

// Merge PR terbuka (satu-satunya aksi write ke GitHub dari webapp, PRD F15).
// Metode: merge commit. Tidak bisa dibatalkan — UI wajib konfirmasi dulu.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { project_id?: string; number?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const projectId = body.project_id?.trim() ?? "";
  const prNumber = Number(body.number);
  if (!projectId || !Number.isInteger(prNumber) || prNumber <= 0) {
    return NextResponse.json({ error: "project_id + number (int) wajib" }, { status: 400 });
  }

  const proj = await db()`SELECT repo_full FROM projects WHERE id = ${projectId} AND user_id = ${ctx.userId}`;
  const row = proj[0] as { repo_full: string } | undefined;
  if (!row) return NextResponse.json({ error: "Proyek tidak ketemu" }, { status: 404 });

  const token = await tokenGitHub(ctx.userId);
  if (!token) return NextResponse.json({ error: "Token GitHub tidak tersedia, login ulang" }, { status: 401 });

  const res = await fetch(`https://api.github.com/repos/${row.repo_full}/pulls/${prNumber}/merge`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ merge_method: "merge" }),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { message?: string };
    const jelas =
      res.status === 405
        ? "PR tidak bisa di-merge otomatis (sudah merge / konflik perlu resolusi manual)."
        : (detail.message ?? `GitHub API ${res.status}`);
    return NextResponse.json({ error: jelas }, { status: 502 });
  }

  const sql = db();
  await sql`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${buatId("act")}, ${ctx.userId}, ${projectId}, 'pr', ${`Merge PR #${prNumber} dari webapp.`})`;
  await sql`UPDATE tasks SET status = 'completed', progress = 100, completed_at = now(), updated_at = now(), result_summary = ${`Merged via webapp PR #${prNumber}.`} WHERE user_id = ${ctx.userId} AND project_id = ${projectId} AND status = 'waiting'`;
  return NextResponse.json({ ok: true, merged: true });
}
