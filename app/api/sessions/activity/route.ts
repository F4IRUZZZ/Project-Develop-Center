import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";

// Jejak aktivitas sesi (dipanggil plugin OpenCode, auth Bearer key mesin).
// METADATA SAJA: path file + angka stat + sha komit. Isi file/pesan DILARANG
// dikirim (kontrak privasi opsi A) — route ini menolak field di luar skema.
type Masuk = {
  kind?: string;
  file_path?: string;
  files_changed?: number;
  lines_added?: number;
  lines_removed?: number;
  commit_sha?: string;
  teks?: string;
};

// Redaksi sisi server (lapis kedua; plugin sudah meredaksi duluan): buang
// blok kode, rapatkan whitespace, cap 1000 + ellipsis bila terpotong.
// Regex bukan kedap — kontrak privasi mengandalkan ini + kepercayaan DB
// sendiri (lihat skema).
const BATAS_RINGKASAN = 1000;
function redaksi(teks: string): string {
  const bersih = teks
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return bersih.length > BATAS_RINGKASAN ? bersih.slice(0, BATAS_RINGKASAN - 1) + "…" : bersih;
}

const BATAS_EVENT = 50;

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { session_id?: string; events?: Masuk[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const sessionId = body.session_id?.trim() ?? "";
  if (!sessionId) return NextResponse.json({ error: galat(req, "sesiIdWajib") }, { status: 400 });
  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: galat(req, "eventsWajib") }, { status: 400 });
  }

  const sql = db();
  const ada =
    await sql`SELECT 1 FROM agent_sessions WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} LIMIT 1`;
  if (ada.length === 0) return NextResponse.json({ error: galat(req, "sesiHilang") }, { status: 404 });

  let adaSunting = false;
  let masuk = 0;
  for (const e of body.events.slice(0, BATAS_EVENT)) {
    // Ringkasan per-giliran: latest-only, tak jadi baris event, tak masuk feed.
    if (e?.kind === "ringkasan") {
      const mentah = typeof e?.teks === "string" ? e.teks.slice(0, 2000) : "";
      const bersih = redaksi(mentah);
      if (bersih) {
        await sql`UPDATE agent_sessions SET ringkasan_terakhir = ${bersih}, ringkasan_waktu = now(), last_seen_at = now() WHERE session_id = ${sessionId}`;
      }
      continue;
    }
    // Sinyal kerja (#182): bukti AI sibuk (tool/pesan apa pun, tanpa isi).
    // Latest-only: sentuh last_work_at, tanpa baris event, tanpa feed.
    if (e?.kind === "kerja") {
      await sql`UPDATE agent_sessions SET last_work_at = now(), last_seen_at = now() WHERE session_id = ${sessionId}`;
      continue;
    }
    const kind = e?.kind === "commit" ? "commit" : "edit";
    const path = typeof e?.file_path === "string" ? e.file_path.slice(0, 500) : null;
    const sha = typeof e?.commit_sha === "string" ? e.commit_sha.slice(0, 40) : null;
    const num = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1000000, Math.floor(v))) : null;
    if (kind === "edit") adaSunting = true;
    await sql`INSERT INTO session_file_events
      (session_id, user_id, kind, file_path, files_changed, lines_added, lines_removed, commit_sha)
      VALUES (${sessionId}, ${ctx.userId}, ${kind}, ${path}, ${num(e?.files_changed)}, ${num(e?.lines_added)}, ${num(e?.lines_removed)}, ${sha})`;
    masuk += 1;
  }
  if (adaSunting) {
    await sql`UPDATE agent_sessions SET last_edit_at = now(), last_work_at = now(), last_seen_at = now() WHERE session_id = ${sessionId}`;
  }
  // Milestone komit dicerminkan ke feed (suntingan per-event tidak: noise).
  // project_id null (repo tak terdaftar) dilewati — kolom NOT NULL.
  const komits = body.events
    .slice(0, BATAS_EVENT)
    .filter((e) => e?.kind === "commit" && typeof e?.commit_sha === "string" && e.commit_sha);
  if (komits.length > 0) {
    const sesi = (await sql`SELECT project_id FROM agent_sessions WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} LIMIT 1`) as Array<{
      project_id: string | null;
    }>;
    const pid = sesi[0]?.project_id ?? null;
    if (pid) {
      for (const k of komits) {
        const penuh = (k.commit_sha as string).slice(0, 40);
        const sha = penuh.slice(0, 7);
        const f = typeof k.files_changed === "number" ? k.files_changed : null;
        const a = typeof k.lines_added === "number" ? k.lines_added : 0;
        const r = typeof k.lines_removed === "number" ? k.lines_removed : 0;
        const pesan =
          f === null ? `AI mengomit ${sha}.` : `AI mengomit ${sha} · ${f} file +${a}-${r}.`;
        await sql`INSERT INTO activity_log (id, user_id, project_id, type, message)
          VALUES (${`act-komit-${penuh}`}, ${ctx.userId}, ${pid}, 'commit', ${pesan})
          ON CONFLICT (id) DO NOTHING`;
      }
    }
  }
  return NextResponse.json({ ok: true, inserted: masuk }, { status: 201 });
}
