import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser, tokenGitHub } from "@/lib/server-auth";

// Status sistem read-only (halaman /status, auth sesi web): deploy production,
// bridge MCP->production, database, dan kesehatan plugin per repo. Tanpa aksi,
// tanpa kredensial baru. Deploy di-cache 5 menit per user.
export const VERSI_PLUGIN_TERKINI = "2026.10.02";
const PRODUKSI_URL = "https://project-develop-center.vercel.app";
const CACHE_DEPLOY_MS = 5 * 60 * 1000;

type DeployCache = { saat: number; data: unknown };
const deployCache = new Map<string, DeployCache>();

async function deployTerakhir(
  token: string,
  repoFull: string
): Promise<{ sha: string; waktu: string; status: string } | null> {
  try {
    const dep = await fetch(
      `https://api.github.com/repos/${repoFull}/deployments?per_page=1`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!dep.ok) return null;
    const daftar = (await dep.json()) as Array<{ id: number; sha: string; created_at: string }>;
    const d0 = daftar[0];
    if (!d0) return null;
    let status = "tak-diketahui";
    try {
      const st = await fetch(
        `https://api.github.com/repos/${repoFull}/deployments/${d0.id}/statuses?per_page=1`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (st.ok) {
        const ss = (await st.json()) as Array<{ state?: string }>;
        if (ss[0]?.state) status = ss[0].state;
      }
    } catch {
      /* abaikan: sha + waktu tetap berguna */
    }
    return { sha: d0.sha.slice(0, 7), waktu: d0.created_at, status };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();

  // Deploy (cache 5 mnt): repo PDC milik user.
  let deploy: { repo: string; sha: string; waktu: string; status: string } | null = null;
  let deployCatatan: string | null = null;
  try {
    const projs = (await sql`SELECT repo_full FROM projects WHERE user_id = ${ctx.userId}`) as Array<{
      repo_full: string;
    }>;
    const pdc = projs.find((p) => /\/Project-Develop-Center$/i.test(p.repo_full ?? ""));
    if (!pdc?.repo_full) {
      deployCatatan = "Repo PDC tidak terdaftar sebagai proyek.";
    } else {
      const kunci = `${ctx.userId}:${pdc.repo_full}`;
      const kena = deployCache.get(kunci);
      if (kena && Date.now() - kena.saat < CACHE_DEPLOY_MS) {
        deploy = kena.data as typeof deploy;
      } else {
        const token = await tokenGitHub(ctx.userId);
        if (!token) {
          deployCatatan = "Token GitHub tidak tersedia, login ulang.";
        } else {
          const d = await deployTerakhir(token, pdc.repo_full);
          deploy = d ? { repo: pdc.repo_full, ...d } : null;
          if (!deploy) deployCatatan = "Deploy production tidak terbaca.";
          deployCache.set(kunci, { saat: Date.now(), data: deploy });
        }
      }
    }
  } catch {
    deployCatatan = "Gagal membaca deploy.";
  }

  // Bridge: root production hidup + latensi (tanpa auth).
  let bridge: { url: string; ok: boolean; latencyMs: number | null; galat: string | null };
  try {
    const t0 = Date.now();
    const r = await fetch(PRODUKSI_URL, { signal: AbortSignal.timeout(10000) });
    bridge = { url: PRODUKSI_URL, ok: r.ok, latencyMs: Date.now() - t0, galat: r.ok ? null : `HTTP ${r.status}` };
  } catch (e) {
    bridge = { url: PRODUKSI_URL, ok: false, latencyMs: null, galat: String((e as Error)?.message ?? e).slice(0, 150) };
  }

  // Database: latensi + hitung baris kunci.
  let basisdata: { latencyMs: number | null; sesi: number; event: number; feed: number; galat: string | null };
  try {
    const t0 = Date.now();
    const [s, e, f] = await Promise.all([
      sql`SELECT COUNT(*)::int AS n FROM agent_sessions WHERE user_id = ${ctx.userId}`,
      sql`SELECT COUNT(*)::int AS n FROM session_file_events WHERE user_id = ${ctx.userId}`,
      sql`SELECT COUNT(*)::int AS n FROM activity_log WHERE user_id = ${ctx.userId}`,
    ]);
    basisdata = {
      latencyMs: Date.now() - t0,
      sesi: (s[0] as { n: number }).n,
      event: (e[0] as { n: number }).n,
      feed: (f[0] as { n: number }).n,
      galat: null,
    };
  } catch (e) {
    basisdata = { latencyMs: null, sesi: 0, event: 0, feed: 0, galat: "Gagal membaca database." };
  }

  // Plugin per repo: proyek terdaftar LEFT JOIN kesehatan (belum melapor = null).
  let repos: Array<{ repo_full: string; plugin_version: string | null; terakhir: string | null; basi: boolean }>;
  try {
    const rows = (await sql`
      SELECT p.repo_full AS repo_full, h.plugin_version AS plugin_version, h.last_seen_at AS terakhir
      FROM projects p LEFT JOIN repo_health h
        ON h.user_id = p.user_id AND h.repo_full = p.repo_full
      WHERE p.user_id = ${ctx.userId}
      ORDER BY p.repo_full
    `) as Array<{ repo_full: string; plugin_version: string | null; terakhir: string | null }>;
    const kini = Date.now();
    repos = rows.map((r) => ({
      repo_full: r.repo_full,
      plugin_version: r.plugin_version,
      terakhir: r.terakhir,
      basi:
        !r.terakhir ||
        kini - new Date(r.terakhir).getTime() > 15 * 60 * 1000 ||
        (r.plugin_version !== null && r.plugin_version !== VERSI_PLUGIN_TERKINI),
    }));
  } catch {
    repos = [];
  }

  return NextResponse.json({
    deploy,
    deployCatatan,
    bridge,
    db: basisdata,
    repos,
    versiTerkini: VERSI_PLUGIN_TERKINI,
  });
}
