import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buatId, isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";
import { siarTelegram } from "@/lib/telegram";
import type { ActivityEvent } from "@/lib/types";
import { ringkasSatuBaris } from "@/lib/ringkas";

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

function rapikanPesanSelesai(pesan: string): string {
  // Format: "Selesai: AI selesai bekerja di repo — <ringkasan>"
  // Rapikan bagian setelah em-dash / " — " atau " - "
  const idx = pesan.indexOf(" — ");
  if (idx >= 0) {
    const prefix = pesan.slice(0, idx + 3);
    const tail = pesan.slice(idx + 3);
    return prefix + ringkasSatuBaris(tail, 200);
  }
  const idx2 = pesan.indexOf(" - ");
  if (idx2 >= 0) {
    const prefix = pesan.slice(0, idx2 + 3);
    const tail = pesan.slice(idx2 + 3);
    return prefix + ringkasSatuBaris(tail, 200);
  }
  return pesan;
}

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
  const out: ActivityEvent[] = rows.map((r, i) => {
    const msg = String(r.message);
    const cleanMsg = msg.startsWith("Selesai:") ? rapikanPesanSelesai(msg) : msg;
    return {
      id: String(r.id ?? i),
      type:
        String(r.type) === "info" && msg.startsWith("Selesai:")
          ? "success"
          : (NADA[String(r.type)] ?? "idle"),
      message: cleanMsg,
      projectName: String(r.repo_name ?? ""),
      time: new Date(r.created_at as string).toISOString(),
    };
  });
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
  const tipe = body.type ?? "info";
  const pesan = body.message.trim();
  await db()`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${id}, ${ctx.userId}, ${body.project_id}, ${tipe}, ${pesan})`;
  // Notif Telegram keluar (best-effort, gagal = diam): error apa pun +
  // penyelesaian "Selesai:" — selaras filter notifikasi in-app (P3).
  if (tipe === "error" || (tipe === "info" && pesan.startsWith("Selesai:"))) {
    void siarTelegram(ctx.userId, `[PDC] ${pesan}`).catch(() => {});
  }
  return NextResponse.json({ id }, { status: 201 });
}
