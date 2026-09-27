import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Task terbaru per proyek (opsional filter ?project_id= / ?command_id= / ?all=1).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const params = new URL(req.url).searchParams;
  const projectId = params.get("project_id");
  const commandId = params.get("command_id");
  if (commandId) {
    const rows = await db()`SELECT * FROM tasks WHERE user_id = ${ctx.userId} AND command_id = ${commandId} ORDER BY created_at DESC LIMIT 1`;
    return NextResponse.json(rows);
  }
  if (params.get("all") === "1") {
    const rows = await db()`SELECT t.*, p.repo_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE t.user_id = ${ctx.userId} ORDER BY t.created_at DESC LIMIT 100`;
    return NextResponse.json(rows);
  }
  const rows = projectId
    ? await db()`SELECT * FROM tasks WHERE user_id = ${ctx.userId} AND project_id = ${projectId} ORDER BY created_at DESC LIMIT 20`
    : await db()`
        SELECT DISTINCT ON (project_id) * FROM tasks
        WHERE user_id = ${ctx.userId} ORDER BY project_id, created_at DESC
      `;
  return NextResponse.json(rows);
}
