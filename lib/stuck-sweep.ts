// P2: writer stuck. Display-level di dashboard (working >30 mnt) tetap ada
// sebagai fallback, tapi sweep ini MENULIS ke DB agar stuck tercatat di
// /api/tasks, ikut query jalanSet/cancel, dan berbunyi via notif (activity
// type error masuk filter pr,error 24 jam).
// Dipakai oportunistik oleh GET /api/dashboard + manual/cron via
// /api/tasks/sweep (dry-run: ?dry=1). Best-effort: gagal = diam.

import { db } from "@/lib/db";
import { buatId } from "@/lib/id";
import { kirimPush } from "@/lib/push";
import { siarTelegram } from "@/lib/telegram";

export const STUCK_MNT = 30;
export const SWEEP_LIMIT = 50;

export interface HasilSweep {
  tasks: number;
  pendingYatim: number;
}

export async function sapuStuck(userId: string): Promise<HasilSweep> {
  const sql = db();
  let tasks = 0;
  let pendingYatim = 0;

  // 1. tasks working basi -> stuck (idempoten: yang sudah stuck tak tersentuh).
  const basi = (await sql`
    SELECT id, project_id, title FROM tasks
    WHERE user_id = ${userId} AND status = 'working'
      AND updated_at < now() - interval '30 minutes'
    ORDER BY updated_at ASC LIMIT ${SWEEP_LIMIT}
  `) as unknown as Array<{ id: string; project_id: string; title: string }>;

  for (const t of basi) {
    await sql`UPDATE tasks SET status = 'stuck', updated_at = now() WHERE id = ${t.id} AND user_id = ${userId} AND status = 'working'`;
    await sql`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${buatId("act")}, ${userId}, ${t.project_id}, 'error', ${`Stuck: "${t.title}" tanpa update >30 mnt.`})`;
    tasks += 1;
  }
  if (tasks > 0) {
    void siarTelegram(userId, `[PDC] ${tasks} tugas macet (stuck) tanpa update >30 mnt.`).catch(() => {});
    void kirimPush(userId, "PDC: AI macet", `${tasks} tugas stuck tanpa update >30 mnt.`).catch(() => {});
  }

  // 2. command pending/processing yatim (bridge mati): status TIDAK diubah
  // (CHECK command_queue larang stuck) — hanya tulis activity error agar
  // masuk notif. Anti-spam: 1x/jam per command (cocokkan id di pesan).
  const yatim = (await sql`
    SELECT id, project_id, command_text FROM command_queue
    WHERE user_id = ${userId} AND status IN ('pending', 'processing')
      AND created_at < now() - interval '30 minutes'
    ORDER BY created_at ASC LIMIT ${SWEEP_LIMIT}
  `) as unknown as Array<{ id: string; project_id: string; command_text: string }>;

  for (const c of yatim) {
    const sudah = (await sql`
      SELECT id FROM activity_log WHERE user_id = ${userId}
        AND message LIKE ${`%${c.id}%`} AND created_at > now() - interval '60 minutes' LIMIT 1
    `) as unknown as Array<{ id: string }>;
    if (sudah.length > 0) continue;
    await sql`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${buatId("act")}, ${userId}, ${c.project_id}, 'error', ${`Yatim: perintah ${c.id} ("${c.command_text.slice(0, 60)}") tanpa update >30 mnt.`})`;
    pendingYatim += 1;
  }
  if (pendingYatim > 0) {
    void siarTelegram(userId, `[PDC] ${pendingYatim} perintah yatim tanpa update >30 mnt.`).catch(() => {});
    void kirimPush(userId, "PDC: perintah yatim", `${pendingYatim} perintah tanpa update >30 mnt.`).catch(() => {});
  }

  return { tasks, pendingYatim };
}
