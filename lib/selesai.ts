// Done tepat-sekali (#184, atomik penuh #210): 1 sesi build bekerja = 1x
// task done + 1x feed "Selesai:" + 1x Telegram, kapan pun pemicunya (sweep
// hening / tutup eksplisit / double-PATCH balapan). Merge PR juga hasilkan
// task via jalurnya sendiri. SELURUH tulis dalam
// SATU statement CTE: klaim (mutex done_at) + task + feed + done_task_id
// komit bersama — gagal tengah = tak ada yang tertulis, retry aman.
// ID deterministik per (sesi, detik-kerja) + ON CONFLICT: retry dedupe,
// kerja baru yang sah = baris baru. Best-effort: gagal = diam.
import { db } from "@/lib/db";
import { potong } from "@/lib/potong";
import { siarTelegram } from "@/lib/telegram";

// Ambang hening: tanpa sinyal kerja selama ini = sesi dianggap selesai.
export const HENING_MNT = 3;
export const SWEEP_LIMIT = 50;

interface Done {
  session_id: string;
  project_id: string;
  judul: string;
  ringkas: string;
  repo: string | null;
}

// Catat 1x done untuk sesi. Kembalikan true bila mencatat,
// false bila kalah/sudah dicatat.
export async function catatSelesai(userId: string, sessionId: string): Promise<boolean> {
  const sql = db();
  const rows = (await sql`
    WITH k AS (
      UPDATE agent_sessions SET done_at = now()
      WHERE session_id = ${sessionId} AND user_id = ${userId}
        AND status = 'active' AND mode = 'build' AND project_id IS NOT NULL
        AND COALESCE(last_work_at, last_edit_at) IS NOT NULL
        AND (done_at IS NULL OR COALESCE(last_work_at, last_edit_at) > done_at)
      RETURNING session_id, user_id, project_id,
        COALESCE(NULLIF(TRIM(LEFT(ringkasan_terakhir, 200)), ''), 'Sesi AI selesai bekerja') AS judul,
        TRIM(COALESCE(ringkasan_terakhir, '')) AS ringkas,
        EXTRACT(EPOCH FROM COALESCE(last_work_at, last_edit_at))::bigint AS ep,
        (SELECT repo_name FROM projects p WHERE p.id = agent_sessions.project_id) AS repo
    ),
    t AS (
      INSERT INTO tasks (id, user_id, project_id, title, status, progress, result_summary, completed_at, updated_at)
      SELECT 'task-done-' || k.session_id || '-' || k.ep, k.user_id, k.project_id, LEFT(k.judul, 200), 'completed', 100, NULLIF(LEFT(k.ringkas, 1000), ''), now(), now() FROM k
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    ),
    f AS (
      INSERT INTO activity_log (id, user_id, project_id, type, message)
      SELECT 'act-selesai-' || k.session_id || '-' || k.ep, k.user_id, k.project_id, 'info',
        'Selesai: AI selesai bekerja' || COALESCE(' di ' || (SELECT repo_name FROM projects p WHERE p.id = k.project_id), '') || CASE WHEN k.ringkas <> '' THEN ' — ' || LEFT(k.ringkas, 200) ELSE '' END
      FROM k
      ON CONFLICT (id) DO NOTHING
    )
    UPDATE agent_sessions s SET done_task_id = COALESCE((SELECT id FROM t LIMIT 1), 'task-done-' || k.session_id || '-' || k.ep)
    FROM k WHERE s.session_id = k.session_id AND s.user_id = k.user_id
    RETURNING k.session_id AS session_id, k.project_id AS project_id, k.judul AS judul, k.ringkas AS ringkas, k.repo AS repo
  `) as unknown as Done[];
  if (rows.length === 0) return false;
  const d = rows[0];
  // Kontrak /api/notifications: prefix "Selesai:" = masuk filter penting
  // (picu bunyi + popup + Notification browser di klien).
  const pesanFeed = `Selesai: AI selesai bekerja${d.repo ? ` di ${d.repo}` : ""}${d.ringkas ? ` — ${potong(d.ringkas, 200)}` : ""}`;
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
    WHERE user_id = ${userId} AND status = 'active' AND mode = 'build' AND project_id IS NOT NULL
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
