import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { syncProjects } from "@/lib/sync";
import type { AIStatus, Project } from "@/lib/types";

interface TaskRow {
  project_id: string;
  title: string;
  status: AIStatus;
  progress: number;
  git_branch: string | null;
  updated_at: string;
}

// Dashboard: projects + task terbaru -> bentuk Project (status AI dari DB).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();
  let projects = (await sql`SELECT * FROM projects WHERE user_id = ${ctx.userId} AND is_active = true ORDER BY updated_at DESC`) as Record<string, unknown>[];

  if (projects.length === 0) {
    try {
      projects = await syncProjects(ctx.userId);
    } catch {
      // GitHub/token bermasalah -> kembalikan daftar kosong, klien tampilkan fallback
    }
  }

  const tasks = (await sql`
    SELECT DISTINCT ON (project_id) project_id, title, status, progress, git_branch, updated_at
    FROM tasks WHERE user_id = ${ctx.userId} ORDER BY project_id, created_at DESC
  `) as unknown as TaskRow[];
  const perProyek = new Map(tasks.map((t) => [t.project_id, t]));

  const out: Project[] = projects.map((p) => {
    const id = String(p.id);
    const t = perProyek.get(id);
    const status = (t?.status ?? "idle") as AIStatus;
    const progress = t ? Number(t.progress) : 100;
    return {
      id,
      repoName: String(p.repo_name),
      repoFull: String(p.repo_full),
      status,
      statusLabel: status[0].toUpperCase() + status.slice(1),
      taskLabel: t ? t.title : `Branch ${String(p.default_branch ?? "main")}`,
      taskPrefix: (t ? "Tugas" : "Terakhir") as Project["taskPrefix"],
      progress,
      progressTone: (status === "idle" || status === "completed"
        ? "success"
        : status === "waiting" || status === "stuck"
          ? "warning"
          : "accent") as Project["progressTone"],
      meta: t
        ? `${new Date(t.updated_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}${t.git_branch ? ` · ${t.git_branch}` : ""}`
        : `push · ${String(p.default_branch ?? "main")}`,
      branch: (t?.git_branch ?? (p.default_branch as string | null) ?? undefined) as string | undefined,
      isPrivate: (p.is_private as boolean | null) ?? undefined,
      actions: (status === "waiting" ? [] : ["command", "stop"]) as Project["actions"],
    };
  });

  return NextResponse.json(out);
}
