import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser, tokenGitHub } from "@/lib/server-auth";

async function gh(token: string, path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} untuk ${path}`);
  return res.json() as Promise<unknown>;
}

// Konteks repo live: info + branch default + PR terbuka + issue terbuka (max 5).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const projectId = new URL(req.url).searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id wajib" }, { status: 400 });

  const proj = await db()`SELECT repo_full, repo_url, default_branch FROM projects WHERE id = ${projectId} AND user_id = ${ctx.userId}`;
  const row = proj[0] as { repo_full: string; repo_url: string | null; default_branch: string | null } | undefined;
  if (!row) return NextResponse.json({ error: "Proyek tidak ketemu" }, { status: 404 });

  const token = await tokenGitHub(ctx.userId);
  if (!token) return NextResponse.json({ error: "Token GitHub tidak tersedia, login ulang" }, { status: 401 });

  try {
    const [repo, pulls, issues] = await Promise.all([
      gh(token, `/repos/${row.repo_full}`) as Promise<{ default_branch: string; open_issues_count: number; pushed_at: string }>,
      gh(token, `/repos/${row.repo_full}/pulls?state=open&per_page=5`) as Promise<Array<{ number: number; title: string; head: { ref: string } }>>,
      gh(token, `/repos/${row.repo_full}/issues?state=open&per_page=5`) as Promise<Array<{ number: number; title: string; pull_request?: unknown }>>,
    ]);
    return NextResponse.json({
      repo_full: row.repo_full,
      repo_url: row.repo_url,
      default_branch: repo.default_branch ?? row.default_branch,
      pushed_at: repo.pushed_at,
      open_issues_count: repo.open_issues_count,
      open_prs: pulls.map((p) => ({ number: p.number, title: p.title, branch: p.head.ref })),
      open_issues: issues.filter((i) => !i.pull_request).map((i) => ({ number: i.number, title: i.title })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GitHub gagal";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
