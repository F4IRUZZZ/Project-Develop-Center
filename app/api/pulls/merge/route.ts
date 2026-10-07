import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser, tokenGitHub } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";
import { potong } from "@/lib/potong";
import { siarTelegram } from "@/lib/telegram";

// Merge PR terbuka (satu-satunya aksi write ke GitHub dari webapp, PRD F15).
// Metode: merge commit. Tidak bisa dibatalkan — UI wajib konfirmasi dulu.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { project_id?: string; number?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const projectId = body.project_id?.trim() ?? "";
  const prNumber = Number(body.number);
  if (!projectId || !Number.isInteger(prNumber) || prNumber <= 0) {
    return NextResponse.json({ error: galat(req, "pullsNumWajib") }, { status: 400 });
  }

  const proj = await db()`SELECT repo_full FROM projects WHERE id = ${projectId} AND user_id = ${ctx.userId}`;
  const row = proj[0] as { repo_full: string } | undefined;
  if (!row) return NextResponse.json({ error: galat(req, "proyekHilang") }, { status: 404 });

  const token = await tokenGitHub(ctx.userId);
  if (!token) return NextResponse.json({ error: galat(req, "tokenGithub") }, { status: 401 });

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

  // Judul PR untuk pesan notif (best-effort: tanpa judul tetap jalan).
  let judul = "";
  try {
    const info = await fetch(`https://api.github.com/repos/${row.repo_full}/pulls/${prNumber}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(10000),
    });
    if (info.ok) judul = potong((await info.json() as { title?: string }).title ?? "", 120);
  } catch {
    /* abaikan */
  }

  const sql = db();
  // Perlakuan selesai penuh (#190): SATU feed "Selesai:" (picu bunyi+popup,
  // id deterministik anti-ganda) + task waiting/working selesai + Telegram.
  // Webhook GitHub yang datang belakangan untuk PR yang sama diam via
  // penjaga 10 mnt di hook (tak ada toast kedua).
  const pesanFeed = `Selesai: PR #${prNumber}${judul ? ` "${judul}"` : ""} di-merge dari PDC.`;
  await sql`INSERT INTO activity_log (id, user_id, project_id, type, message)
    VALUES (${`act-merge-webapp-${projectId}-${prNumber}`}, ${ctx.userId}, ${projectId}, 'info', ${pesanFeed})
    ON CONFLICT (id) DO NOTHING`;
  const tutup = (await sql`UPDATE tasks SET status = 'completed', progress = 100, completed_at = now(), updated_at = now(), result_summary = ${`Merged via webapp PR #${prNumber}.`} WHERE user_id = ${ctx.userId} AND project_id = ${projectId} AND status IN ('waiting', 'working') RETURNING id`) as Array<{
    id: string;
  }>;
  // Tiap merge PASTI +1 task done (#208): bila tak ada task terbuka yang
  // diselesaikan, buatkan baris completed-nya (mis. sesi langsung / sudah
  // auto-done) agar angka Tasks Done selalu bertambah.
  if (tutup.length === 0) {
    const judulTask = `Merge PR #${prNumber}${judul ? ` "${judul}"` : ""}`.slice(0, 200);
    // ID deterministik + ON CONFLICT (#210): balapan webapp<->webhook untuk
    // PR yang sama tak bisa +2 (kalah diam-diam, tepat-sekali).
    await sql`INSERT INTO tasks (id, user_id, project_id, title, status, progress, result_summary, completed_at, updated_at)
      VALUES (${`task-merge-webapp-${projectId}-${prNumber}`}, ${ctx.userId}, ${projectId}, ${judulTask}, 'completed', 100, ${pesanFeed.slice(0, 500)}, now(), now())
      ON CONFLICT (id) DO NOTHING`;
  }
  void siarTelegram(ctx.userId, pesanFeed).catch(() => {});
  return NextResponse.json({ ok: true, merged: true });
}
