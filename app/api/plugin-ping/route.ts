import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Ping kesehatan plugin (dipanggil sekali saat plugin dimuat, auth Bearer key
// mesin). Tanpa sesi, tanpa feed — murni "salinan ini ada + versinya ini".
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { repo_full?: string; plugin_version?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const repo = body.repo_full?.trim() || null;
  if (!repo) return NextResponse.json({ error: "repo_full wajib" }, { status: 400 });
  const ver =
    typeof body.plugin_version === "string" && body.plugin_version
      ? body.plugin_version.slice(0, 20)
      : null;

  const sql = db();
  await sql`
    INSERT INTO repo_health (user_id, repo_full, plugin_version, last_seen_at)
    VALUES (${ctx.userId}, ${repo}, ${ver}, now())
    ON CONFLICT (user_id, repo_full) DO UPDATE SET
      last_seen_at = now(),
      plugin_version = COALESCE(${ver}, repo_health.plugin_version)
  `;
  return NextResponse.json({ ok: true }, { status: 201 });
}
