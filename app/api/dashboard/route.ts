import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { syncProjects } from "@/lib/sync";
import { sapuStuck } from "@/lib/stuck-sweep";
import { TANDA_STOP } from "@/lib/tasks";
import type { AIStatus, Project } from "@/lib/types";

interface TaskRow {
  project_id: string;
  title: string;
  status: AIStatus;
  progress: number;
  git_branch: string | null;
  result_summary: string | null;
  updated_at: string;
}

// Dashboard: projects + task terbaru -> bentuk Project (status AI dari DB).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();

  // P2: sweep stuck oportunistik (best-effort) agar status stuck tertulis
  // di DB, bukan cuma display. Gagal = diam, respons tetap jalan.
  try {
    await sapuStuck(ctx.userId);
  } catch {
    // Abaikan: fallback display-level di bawah tetap tampilkan stuck.
  }

  let projects = (await sql`SELECT * FROM projects WHERE user_id = ${ctx.userId} AND is_active = true ORDER BY updated_at DESC`) as Record<string, unknown>[];

  if (projects.length === 0) {
    try {
      projects = await syncProjects(ctx.userId);
    } catch {
      // GitHub/token bermasalah -> kembalikan daftar kosong, klien tampilkan fallback
    }
  }

  const tasks = (await sql`
    SELECT DISTINCT ON (project_id) project_id, title, status, progress, git_branch, result_summary, updated_at
    FROM tasks WHERE user_id = ${ctx.userId} ORDER BY project_id, created_at DESC
  `) as unknown as TaskRow[];
  const perProyek = new Map(tasks.map((t) => [t.project_id, t]));

  // Proyek "jalan": ada command pending/processing ATAU task working/stuck.
  const jalan = (await sql`
    SELECT project_id FROM command_queue WHERE user_id = ${ctx.userId} AND status IN ('pending', 'processing')
    UNION
    SELECT project_id FROM tasks WHERE user_id = ${ctx.userId} AND status IN ('working', 'stuck')
  `) as unknown as Array<{ project_id: string }>;
  const jalanSet = new Set(jalan.map((r) => r.project_id));

  // Sesi AI aktif: status active + denyut <3 mnt. Denyut dikirim plugin tiap
  // 60 dtk selama proses OpenCode hidup, jadi timeout pendek aman dari kedip
  // dan padam ≤~4 mnt setelah close/kill/crash (tanpa event tutup-proses).
  const sesi = (await sql`
    SELECT project_id FROM agent_sessions
    WHERE user_id = ${ctx.userId} AND status = 'active'
      AND last_seen_at > now() - interval '3 minutes'
  `) as unknown as Array<{ project_id: string | null }>;
  const sesiSet = new Set(sesi.map((r) => r.project_id));

  // Tingkat kerja per proyek: bekerja (sunting <2 mnt) vs siaga (denyut
  // segar tapi hening). Satu query agregat, ambang sama dengan tab Sesi.
  const kerjaRows = (await sql`
    SELECT project_id, MAX(last_edit_at) AS sunting
    FROM agent_sessions
    WHERE user_id = ${ctx.userId} AND status = 'active'
      AND last_seen_at > now() - interval '3 minutes'
      AND project_id IS NOT NULL
    GROUP BY project_id
  `) as unknown as Array<{ project_id: string; sunting: string | null }>;
  const kini = Date.now();
  const kerjaMap = new Map(
    kerjaRows.map((r) => [
      r.project_id,
      r.sunting && kini - new Date(r.sunting).getTime() <= 2 * 60 * 1000 ? "bekerja" : "siaga",
    ] as const),
  );

  // Ringkasan terbaru per proyek (untuk tooltip chip kartu; null bila tak ada).
  const ringkasRows = (await sql`
    SELECT project_id, ringkasan_terakhir AS ringkasan
    FROM agent_sessions
    WHERE user_id = ${ctx.userId} AND status = 'active'
      AND last_seen_at > now() - interval '3 minutes'
      AND ringkasan_terakhir IS NOT NULL
    ORDER BY ringkasan_waktu DESC
  `) as unknown as Array<{ project_id: string | null; ringkasan: string }>;
  const ringkasMap = new Map<string, string>();
  for (const r of ringkasRows) {
    if (r.project_id && !ringkasMap.has(r.project_id)) ringkasMap.set(r.project_id, r.ringkasan);
  }

  const out: Project[] = projects.map((p) => {
    const id = String(p.id);
    const t = perProyek.get(id);
    // Stop-cancel tampil idle ("seolah tak terjadi"); failed-asli tetap merah.
    // Riwayat (/api/tasks) tidak tersentuh: tetap catat failed.
    const dibatalkan = t?.status === "failed" && t?.result_summary === TANDA_STOP;
    // Stuck display-level (F9): working tanpa update >30 mnt. Tanpa tulis DB.
    const macet =
      t?.status === "working" && Date.now() - new Date(t.updated_at).getTime() > 30 * 60 * 1000;
    const status = (dibatalkan ? "idle" : macet ? "stuck" : (t?.status ?? "idle")) as AIStatus;
    const progress = dibatalkan ? 100 : t ? Number(t.progress) : 100;
    return {
      id,
      repoName: String(p.repo_name),
      repoFull: String(p.repo_full),
      status,
      statusLabel: status[0].toUpperCase() + status.slice(1),
      taskLabel: t ? t.title : `Branch ${String(p.default_branch ?? "main")}`,
      taskPrefix: (!t || dibatalkan ? "Terakhir" : "Tugas") as Project["taskPrefix"],
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
      sesiAktif: sesiSet.has(id),
      sesiKerja: (kerjaMap.get(id) ?? null) as Project["sesiKerja"],
      sesiRingkasan: ringkasMap.get(id) ?? null,
      actions: (status === "waiting" ? [] : jalanSet.has(id) ? (["command", "stop"] as Project["actions"]) : (["command"] as Project["actions"])),
    };
  });

  return NextResponse.json(out);
}
