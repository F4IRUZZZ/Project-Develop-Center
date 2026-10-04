import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import type { Project } from "@/lib/types";

interface SearchResult {
  projects: Array<{ id: string; repo_name: string; repo_full: string }>;
  tasks: Array<{ id: string; title: string; project_id: string; status: string }>;
  commands: Array<{ id: string; command_text: string; project_id: string; status: string }>;
}

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) {
    return NextResponse.json({ projects: [], tasks: [], commands: [] });
  }

  const kataKunci = q.toLowerCase();
  const sql = db();

  const [proyekRows, tugasRows, cmdRows] = await Promise.all([
    sql`
      SELECT id, repo_name, repo_full
      FROM projects
      WHERE user_id = ${ctx.userId}
        AND (repo_name ILIKE ${"%" + kataKunci + "%"} OR repo_full ILIKE ${"%" + kataKunci + "%"})
      LIMIT 10
    `,
    sql`
      SELECT id, project_id, title, status, created_at
      FROM tasks
      WHERE user_id = ${ctx.userId}
        AND title ILIKE ${"%" + kataKunci + "%"}
      ORDER BY created_at DESC
      LIMIT 10
    `,
    sql`
      SELECT id, project_id, command_text, status, created_at
      FROM command_queue
      WHERE user_id = ${ctx.userId}
        AND command_text ILIKE ${"%" + kataKunci + "%"}
      ORDER BY created_at DESC
      LIMIT 10
    `,
  ]);

  return NextResponse.json({
    projects: proyekRows,
    tasks: tugasRows,
    commands: cmdRows,
  });
}