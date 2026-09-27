import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Task terbaru per proyek (opsional filter ?project_id=).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const projectId = new URL(req.url).searchParams.get("project_id");
  const rows = projectId
    ? await db()`SELECT * FROM tasks WHERE user_id = ${ctx.userId} AND project_id = ${projectId} ORDER BY created_at DESC LIMIT 20`
    : await db()`
        SELECT DISTINCT ON (project_id) * FROM tasks
        WHERE user_id = ${ctx.userId} ORDER BY project_id, created_at DESC
      `;
  return NextResponse.json(rows);
}
