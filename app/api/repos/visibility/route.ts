import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser, tokenGitHub } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";

// Ubah visibilitas repo GitHub (public <-> private) + cache di DB.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { project_id?: string; private?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const projectId = body.project_id?.trim() ?? "";
  if (!projectId || typeof body.private !== "boolean") {
    return NextResponse.json({ error: galat(req, "visProjPrivWajib") }, { status: 400 });
  }

  const proj = await db()`SELECT repo_full FROM projects WHERE id = ${projectId} AND user_id = ${ctx.userId}`;
  const row = proj[0] as { repo_full: string } | undefined;
  if (!row) return NextResponse.json({ error: galat(req, "proyekHilang") }, { status: 404 });

  const token = await tokenGitHub(ctx.userId);
  if (!token) return NextResponse.json({ error: galat(req, "tokenGithub") }, { status: 401 });

  const res = await fetch(`https://api.github.com/repos/${row.repo_full}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ private: body.private }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json({ error: `GitHub API ${res.status}: ${detail.message ?? "gagal"}` }, { status: 502 });
  }

  await db()`UPDATE projects SET is_private = ${body.private}, updated_at = now() WHERE id = ${projectId} AND user_id = ${ctx.userId}`;
  return NextResponse.json({ ok: true, private: body.private });
}
