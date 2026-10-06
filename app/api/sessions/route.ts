import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buatId, isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";
import { catatSelesai } from "@/lib/selesai";

// Daftarkan/segarkan sesi AI (dipanggil plugin OpenCode, auth Bearer key mesin).
// Upsert by session_id: buka sesi baru atau segarkan yang hidup.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { session_id?: string; repo_full?: string; project_id?: string; mode?: string; reopen?: boolean; plugin_version?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const sessionId = body.session_id?.trim() ?? "";
  if (!sessionId) return NextResponse.json({ error: galat(req, "sesiIdWajib") }, { status: 400 });
  const mode = body.mode === "plan" ? "plan" : "build";
  // reopen=true HANYA dari bukti hidup (lazy-register plugin): mengaktifkan
  // kembali baris final. Denyut biasa tanpa flag tak pernah membuka ulang.
  const bukaUlang = body.reopen === true;

  const sql = db();
  let projectId: string | null = body.project_id?.trim() || null;
  if (!projectId && body.repo_full) {
    const cari = await sql`SELECT id FROM projects WHERE user_id = ${ctx.userId} AND repo_full = ${body.repo_full.trim()} LIMIT 1`;
    projectId = ((cari[0] as { id?: string } | undefined)?.id ?? null) as string | null;
  }

  // Penjaga feed: "dibuka" hanya baris baru; "dilanjutkan" hanya reopen atas
  // baris final (denyut 60 dtk memakai POST yang sama — tanpa ini feed banjir).
  const lama = (await sql`SELECT status, ended_at FROM agent_sessions WHERE session_id = ${sessionId} LIMIT 1`) as Array<{
    status: string;
    ended_at: string | null;
  }>;
  const final = lama.length > 0 && (lama[0].status !== "active" || lama[0].ended_at !== null);

  // Backfill #99: sesi yang terdaftar buta-repo (NULL) dilengkapi saat
  // denyut berikutnya membawa repo — COALESCE agar tak pernah menimpa
  // atribusi lama dengan NULL / memindahkan sesi antar proyek diam-diam.
  await sql`
    INSERT INTO agent_sessions (session_id, user_id, project_id, repo_full, mode, status, last_seen_at)
    VALUES (${sessionId}, ${ctx.userId}, ${projectId}, ${body.repo_full?.trim() ?? null}, ${mode}, 'active', now())
    ON CONFLICT (session_id) DO UPDATE SET
      last_seen_at = now(),
      status = CASE WHEN ${bukaUlang} THEN 'active' WHEN agent_sessions.status = 'active' THEN 'active' ELSE agent_sessions.status END,
      ended_at = CASE WHEN ${bukaUlang} THEN NULL ELSE agent_sessions.ended_at END,
      repo_full = COALESCE(NULLIF(agent_sessions.repo_full, ''), EXCLUDED.repo_full),
      project_id = COALESCE(agent_sessions.project_id, ${projectId})
  `;
  // Kesehatan plugin per repo (halaman Status): versi tak disediakan salinan
  // lama → pertahankan yang ada; last_seen selalu segar saat ada laporan.
  const repoBersih = body.repo_full?.trim() || null;
  const verBersih = typeof body.plugin_version === "string" && body.plugin_version ? body.plugin_version.slice(0, 20) : null;
  if (repoBersih) {
    await sql`
      INSERT INTO repo_health (user_id, repo_full, plugin_version, last_seen_at)
      VALUES (${ctx.userId}, ${repoBersih}, ${verBersih}, now())
      ON CONFLICT (user_id, repo_full) DO UPDATE SET
        last_seen_at = now(),
        plugin_version = COALESCE(${verBersih}, repo_health.plugin_version)
    `;
  }

  // ID feed deterministik + DO NOTHING: kebal race check-then-insert
  // (dua event konkuren tak lagi ganda). Pesan tanpa klaim mode — mode
  // env tak mencerminkan mode aktual TUI (kolom mode tetap untuk tab).
  if (projectId) {
    if (lama.length === 0) {
      await sql`INSERT INTO activity_log (id, user_id, project_id, type, message)
        VALUES (${`act-buka-${sessionId}`}, ${ctx.userId}, ${projectId}, 'info', 'Sesi AI dibuka.')
        ON CONFLICT (id) DO NOTHING`;
    } else if (bukaUlang && final) {
      const menit = Math.floor(Date.now() / 60000);
      await sql`INSERT INTO activity_log (id, user_id, project_id, type, message)
        VALUES (${`act-lanjut-${sessionId}-${menit}`}, ${ctx.userId}, ${projectId}, 'info', 'Sesi AI dilanjutkan.')
        ON CONFLICT (id) DO NOTHING`;
    }
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Heartbeat (idle) vs tutup (error/selesai).
// session.idle/session.status fire tiap agent selesai menjawab (menunggu
// input) — BUKAN sesi berakhir — jadi heartbeat murni: status active +
// last_seen_at (ended_at dibersihkan). Done TEPAT-SEKALI dicatat
// sapuSelesai() setelah hening 3 mnt (#184), bukan di sini.
// Tutup sejati: session.error (final,
// butuh perhatian), session.deleted (selesai eksplisit), atau timeout 3 mnt
// di flag sesiAktif dashboard (untuk close/kill/crash tanpa event).
export async function PATCH(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { session_id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const sessionId = body.session_id?.trim() ?? "";
  if (!sessionId) return NextResponse.json({ error: galat(req, "sesiIdWajib") }, { status: 400 });

  const sql = db();
  if (body.status === "error" || body.status === "selesai") {
    const akhir = body.status === "error" ? "error" : "selesai";
    // Tutup eksplisit = pasti selesai: catat done DULU (sesi masih active
    // agar lolos mutex), baru tutup. Error tak mencatat task completed.
    if (akhir === "selesai") {
      try {
        await catatSelesai(ctx.userId, sessionId);
      } catch {
        /* abaikan: penutupan tetap jalan */
      }
    }
    const tutup = (await sql`UPDATE agent_sessions SET status = ${akhir}, ended_at = now(), last_seen_at = now() WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} RETURNING session_id, project_id`) as Array<{
      session_id: string;
      project_id: string | null;
    }>;
    if (tutup.length === 0) return NextResponse.json({ error: galat(req, "sesiHilang") }, { status: 404 });
    if (tutup[0].project_id) {
      await sql`INSERT INTO activity_log (id, user_id, project_id, type, message)
        VALUES (${`act-tutup-${sessionId}-${akhir}`}, ${ctx.userId}, ${tutup[0].project_id}, ${akhir === "error" ? "error" : "info"}, ${akhir === "error" ? "Sesi AI error." : "Sesi AI selesai."})
        ON CONFLICT (id) DO NOTHING`;
    }
    return NextResponse.json({ ok: true });
  }

  // Heartbeat murni (#184): idle TAK PERNAH mencatat done (tiap akhir
  // giliran fire idle+status ganda + sesi multi-turn = spam per-giliran).
  // Done dicatat tepat-sekali oleh sapuSelesai() (hening 3 mnt) atau cabang
  // tutup-eksplisit di atas. Flag selesai:false menjaga bentuk respons.
  const denyut = await sql`UPDATE agent_sessions SET status = 'active', ended_at = NULL, last_seen_at = now() WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} RETURNING session_id`;
  if (denyut.length === 0) return NextResponse.json({ error: galat(req, "sesiHilang") }, { status: 404 });
  return NextResponse.json({ ok: true, selesai: false });
}

// Hapus 1 sesi milik user (jejak file ikut via CASCADE; feed riwayat abadi
// dan tetap). Auth key mesin ATAU sesi web (sesiUser menerima keduanya).
export async function DELETE(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { session_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const sessionId = body.session_id?.trim() ?? "";
  if (!sessionId) return NextResponse.json({ error: galat(req, "sesiIdWajib") }, { status: 400 });

  const rows = await db()`DELETE FROM agent_sessions WHERE session_id = ${sessionId} AND user_id = ${ctx.userId} RETURNING session_id`;
  if (rows.length === 0) return NextResponse.json({ error: galat(req, "sesiHilang") }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Riwayat sesi (filter opsional ?project_id=), terbaru dulu.
// Diperkaya jejak metadata: file terakhir disentuh, komit terakhir, dan
// status turunan (bekerja <2 mnt sejak sinyal kerja | siaga = buka tapi
// hening | nonaktif = denyut mati >3 mnt / sudah ditutup).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();
  const projectId = new URL(req.url).searchParams.get("project_id");
  const rows = (
    projectId
      ? await sql`SELECT session_id, project_id, repo_full, mode, status, started_at, last_seen_at, last_edit_at, last_work_at, ringkasan_terakhir, ringkasan_waktu, ended_at FROM agent_sessions WHERE user_id = ${ctx.userId} AND project_id = ${projectId} ORDER BY last_seen_at DESC LIMIT 20`
      : await sql`SELECT session_id, project_id, repo_full, mode, status, started_at, last_seen_at, last_edit_at, last_work_at, ringkasan_terakhir, ringkasan_waktu, ended_at FROM agent_sessions WHERE user_id = ${ctx.userId} ORDER BY last_seen_at DESC LIMIT 50`
  ) as Array<{
    session_id: string;
    project_id: string | null;
    repo_full: string | null;
    mode: string;
    status: string;
    started_at: string;
    last_seen_at: string;
    last_edit_at: string | null;
    last_work_at: string | null;
    ringkasan_terakhir: string | null;
    ringkasan_waktu: string | null;
    ended_at: string | null;
  }>;

  const ids = rows.map((r) => r.session_id);
  const jejak =
    ids.length === 0
      ? []
      : ((await sql`SELECT session_id, kind, file_path, files_changed, lines_added, lines_removed, commit_sha, created_at
          FROM session_file_events WHERE user_id = ${ctx.userId} AND session_id = ANY(${ids})
          ORDER BY created_at DESC LIMIT 200`) as Array<{
          session_id: string;
          kind: string;
          file_path: string | null;
          files_changed: number | null;
          lines_added: number | null;
          lines_removed: number | null;
          commit_sha: string | null;
          created_at: string;
        }>);

  const kini = Date.now();
  const out = rows.map((r) => {
    const ev = jejak.filter((j) => j.session_id === r.session_id);
    const sunting = ev.filter((j) => j.kind !== "commit" && j.file_path).slice(0, 5);
    const komit = ev.find((j) => j.kind === "commit") ?? null;
    const lihatMs = kini - new Date(r.last_seen_at).getTime();
    const kerjaTs = r.last_work_at ?? r.last_edit_at;
    const suntingMs = kerjaTs ? kini - new Date(kerjaTs).getTime() : null;
    const kerja =
      r.ended_at || r.status !== "active" || lihatMs > 3 * 60 * 1000
        ? "nonaktif"
        : suntingMs !== null && suntingMs <= 2 * 60 * 1000
          ? "bekerja"
          : "siaga";
    return {
      ...r,
      aktivitas: {
        kerja,
        hening_mnt: suntingMs === null ? null : Math.floor(suntingMs / 60000),
        file_terakhir: sunting.map((j) => j.file_path as string),
        komit_terakhir: komit
          ? {
              sha: komit.commit_sha,
              files_changed: komit.files_changed,
              lines_added: komit.lines_added,
              lines_removed: komit.lines_removed,
              waktu: komit.created_at,
            }
          : null,
      },
    };
  });
  return NextResponse.json(out);
}
