import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buatId, isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";
import type { ActivityEvent } from "@/lib/types";

const BOLEH = new Set(["progress", "commit", "pr", "issue", "error", "info"]);

// Feed tone wireframe dari tipe PRD.
const NADA: Record<string, ActivityEvent["type"]> = {
  progress: "working",
  pr: "waiting",
  issue: "waiting",
  commit: "idle",
  error: "idle",
  info: "idle",
};

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const projectId = new URL(req.url).searchParams.get("project_id");
  const mentah = new URL(req.url).searchParams.get("format") === "mentah";
  // LEFT JOIN agar aktivitas yatim (proyek dihapus/nonaktif) tetap terlihat.
  const rows = (await (projectId
    ? db()`SELECT a.*, p.repo_name FROM activity_log a LEFT JOIN projects p ON p.id = a.project_id WHERE a.user_id = ${ctx.userId} AND a.project_id = ${projectId} ORDER BY a.created_at DESC LIMIT 20`
    : db()`SELECT a.*, p.repo_name FROM activity_log a LEFT JOIN projects p ON p.id = a.project_id WHERE a.user_id = ${ctx.userId} ORDER BY a.created_at DESC LIMIT 20`)) as Record<string, unknown>[];

  if (mentah) return NextResponse.json(rows);

  // Kontrak dengan MCP/P3: info "Selesai:" = success (ikon hijau).
  const out: ActivityEvent[] = rows.map((r, i) => ({
    id: String(r.id ?? i),
    type:
      String(r.type) === "info" && String(r.message).startsWith("Selesai:")
        ? "success"
        : (NADA[String(r.type)] ?? "idle"),
    message: String(r.message),
    projectName: String(r.repo_name ?? ""),
    time: new Date(r.created_at as string).toISOString(),
  }));
  return NextResponse.json(out);
}

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { project_id?: string; type?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  if (!body.project_id || !body.message?.trim()) {
    return NextResponse.json({ error: galat(req, "actProjMsgWajib") }, { status: 400 });
  }
  if (body.type && !BOLEH.has(body.type)) {
    return NextResponse.json({ error: galat(req, "actTipeUnknown") }, { status: 400 });
  }

  const id = buatId("act");
  await db()`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${id}, ${ctx.userId}, ${body.project_id}, ${body.type ?? "info"}, ${body.message.trim()})`;
  return NextResponse.json({ id }, { status: 201 });
}
