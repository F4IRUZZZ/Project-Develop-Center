// Done tepat-sekali (#184): 1 sesi bekerja = 1x task done + 1x feed
// "Selesai:" + 1x Telegram, kapan pun pemicunya (sweep hening / tutup
// eksplisit / double-PATCH balapan). Kuncinya klaim atomik: UPDATE
// bersyarat + RETURNING sebagai mutex — hanya 1 pemenang per sesi, sisanya
// kalah diam-diam. Best-effort: gagal = diam, respons tetap jalan.
import { db } from "@/lib/db";
import { buatId } from "@/lib/id";
import { siarTelegram } from "@/lib/telegram";

// Ambang hening: tanpa sinyal kerja selama ini = sesi dianggap selesai.
export const HENING_MNT = 3;
export const SWEEP_LIMIT = 50;

interface Klaim {
  session_id: string;
  project_id: string;
  ringkasan: string;
}

// Menangkan hak mencatat done untuk 1 sesi (atau kalah = null). Syarat:
// masih active, teratribusi proyek, pernah ada kerja, dan belum dicatat
// sejak kerja terakhir. Satu statement = atomik lawan balapan.
async function klaim(
  sql: ReturnType<typeof db>,
  userId: string,
  sessionId: string
): Promise<Klaim | null> {
  const menang = (await sql`
    UPDATE agent_sessions SET done_at = now()
    WHERE session_id = ${sessionId} AND user_id = ${userId}
      AND status = 'active' AND project_id IS NOT NULL
      AND COALESCE(last_work_at, last_edit_at) IS NOT NULL
      AND (done_at IS NULL OR COALESCE(last_work_at, last_edit_at) > done_at)
    RETURNING session_id, project_id, ringkasan_terakhir
  `) as unknown as Array<{
    session_id: string;
    project_id: string;
    ringkasan_terakhir: string | null;
  }>;
  if (menang.length === 0) return null;
  return {
    session_id: String(menang[0].session_id),
    project_id: String(menang[0].project_id),
    ringkasan: (menang[0].ringkasan_terakhir ?? "").trim().slice(0, 200),
  };
}

// Catat 1x done untuk sesi (pemenang klaim saja yang lanjut). Kembalikan
// true bila mencatat, false bila kalah/sudah dicatat.
export async function catatSelesai(userId: string, sessionId: string): Promise<boolean> {
  const sql = db();
  const m = await klaim(sql, userId, sessionId);
  if (!m) return false;
  const judul = m.ringkasan || "Sesi AI selesai bekerja";
  const taskId = buatId("task");
  await sql`INSERT INTO tasks (id, user_id, project_id, title, status, progress, result_summary, completed_at, updated_at)
    VALUES (${taskId}, ${userId}, ${m.project_id}, ${judul.slice(0, 200)}, 'completed', 100, ${m.ringkasan || null}, now(), now())`;
  let repo = "";
  try {
    const pj = (await sql`SELECT repo_name FROM projects WHERE id = ${m.project_id} AND user_id = ${userId} LIMIT 1`) as Array<{
      repo_name: string;
    }>;
    repo = pj[0]?.repo_name ?? "";
  } catch {
    /* abaikan: pesan tanpa nama repo tetap valid */
  }
  // Kontrak /api/notifications: prefix "Selesai:" = masuk filter penting
  // (picu bunyi + popup + Notification browser di klien).
  const pesanFeed = `Selesai: AI selesai bekerja${repo ? ` di ${repo}` : ""}${m.ringkasan ? ` — ${m.ringkasan}` : ""}`;
  await sql`INSERT INTO activity_log (id, user_id, project_id, type, message)
    VALUES (${buatId("act")}, ${userId}, ${m.project_id}, 'info', ${pesanFeed})`;
  await sql`UPDATE agent_sessions SET done_task_id = ${taskId} WHERE session_id = ${sessionId} AND user_id = ${userId}`;
  void siarTelegram(userId, pesanFeed).catch(() => {});
  return true;
}

// Sweep oportunistik: sesi active yang sinyal kerjanya basi >3 mnt dan belum
// dicatat sejak kerja terakhir. Dipanggil GET /api/dashboard (preseden
// sapuStuck). Kembalikan jumlah sesi yang dicatat.
export async function sapuSelesai(userId: string): Promise<number> {
  const sql = db();
  const calon = (await sql`
    SELECT session_id FROM agent_sessions
    WHERE user_id = ${userId} AND status = 'active' AND project_id IS NOT NULL
      AND COALESCE(last_work_at, last_edit_at) < now() - interval '3 minutes'
      AND (done_at IS NULL OR COALESCE(last_work_at, last_edit_at) > done_at)
    ORDER BY last_seen_at ASC LIMIT ${SWEEP_LIMIT}
  `) as unknown as Array<{ session_id: string }>;
  let dicatat = 0;
  for (const c of calon) {
    try {
      if (await catatSelesai(userId, String(c.session_id))) dicatat += 1;
    } catch {
      /* abaikan per sesi: lanjut ke calon berikut */
    }
  }
  return dicatat;
}
