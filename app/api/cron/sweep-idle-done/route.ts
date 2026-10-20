import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { catatIdleSelesai } from "@/lib/selesai";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sql = db();
  const calon = (await sql`
    SELECT session_id, user_id FROM agent_sessions
    WHERE status = 'active' AND mode = 'build' AND project_id IS NOT NULL
      AND last_work_at IS NOT NULL
      AND last_idle_at > last_work_at
      AND (last_idle_notified_at IS NULL OR last_idle_notified_at < last_work_at)
      AND last_idle_at < now() - interval '2 minutes'
    LIMIT 50
  `) as unknown as Array<{ session_id: string; user_id: string }>;

  let dicatat = 0;
  for (const c of calon) {
    if (await catatIdleSelesai(c.user_id, c.session_id)) dicatat++;
  }
  return NextResponse.json({ processed: dicatat });
}