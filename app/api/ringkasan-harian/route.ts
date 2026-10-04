import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { siarTelegram } from "@/lib/telegram";

// Ringkasan harian otomatis (cron 20:00 WIB = 13:00 UTC).
// Guard: header Authorization Bearer CRON_SECRET ATAU sesi login (untuk
// uji manual/pratinjau dari webapp). Idempoten per tanggal via activity id.
function sah(req: NextRequest): boolean {
  const rahasia = process.env.CRON_SECRET ?? "";
  if (!rahasia) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${rahasia}`;
}

function tanggalWib(d = new Date()): string {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return f.format(d);
}

export async function GET(req: NextRequest) {
  if (!sah(req)) {
    // Fallback uji manual/pratinjau: sesi login webapp (hanya cek, tulis juga).
    const ctx = await sesiUser(req);
    if (isErr(ctx)) return NextResponse.json({ error: "Khusus cron terjadwal" }, { status: 401 });
    const ok = await tulisRingkasan(ctx.userId);
    return NextResponse.json({ ok, pratinjau: true });
  }
  // Cron Vercel tak membawa userId — proses SEMUA user yang punya tujuan aktif.
  const sql = db();
  const users = (await sql`SELECT DISTINCT user_id FROM notif_tujuan WHERE aktif = true`) as Array<{
    user_id: string;
  }>;
  let dibuat = 0;
  for (const u of users) {
    if (await tulisRingkasan(String(u.user_id))) dibuat += 1;
  }
  return NextResponse.json({ ok: true, dibuat });
}

async function tulisRingkasan(userId: string): Promise<boolean> {
  const sql = db();
  const hari = tanggalWib();
  const idMark = `act-harian-${userId}-${hari}`;
  const ada = (await sql`SELECT id FROM activity_log WHERE id = ${idMark} LIMIT 1`) as Array<{ id: string }>;
  if (ada.length > 0) return false;

  const rows = (await sql`
    SELECT COUNT(*)::int AS n FROM activity_log
    WHERE user_id = ${userId} AND created_at > now() - interval '24 hours'`) as Array<{ n: number }>;
  const total = rows[0]?.n ?? 0;

  const top = (await sql`
    SELECT p.repo_name AS repo, COUNT(*)::int AS n
    FROM activity_log a JOIN projects p ON p.id = a.project_id
    WHERE a.user_id = ${userId} AND a.created_at > now() - interval '24 hours'
    GROUP BY 1 ORDER BY n DESC LIMIT 1`) as Array<{ repo: string; n: number }>;

  const pesan =
    total === 0
      ? `Ringkasan harian PDC (${hari}): hari ini tenang, tidak ada aktivitas AI. 🌙`
      : `Ringkasan harian PDC (${hari}): ${total} aktivitas AI hari ini.` +
        (top.length > 0 ? ` Tersibuk: ${top[0].repo} (${top[0].n}).` : "") +
        ` Cek dashboard untuk detail. 📊`;

  const proyek = (await sql`SELECT id FROM projects WHERE user_id = ${userId} AND is_active = true ORDER BY updated_at DESC LIMIT 1`) as Array<{
    id: string;
  }>;
  if (proyek.length === 0) return false;
  await sql`INSERT INTO activity_log (id, user_id, project_id, type, message) VALUES (${idMark}, ${userId}, ${proyek[0].id}, 'info', ${pesan})`;
  void siarTelegram(userId, `[PDC] ${pesan}`).catch(() => {});
  return true;
}
