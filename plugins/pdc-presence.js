// pdc-presence — plugin OpenCode: laporkan lifecycle sesi ke PDC.
// Taruh di: <repo>/.opencode/plugins/pdc-presence.js  (per repo)
// Butuh env di mesin: PDC_API_URL (default http://localhost:3000),
// PDC_API_KEY (buat di webapp PDC > Pengaturan), opsional PDC_MODE (plan/build).
//
// Cara kerja: session.created -> POST (buka sesi); tiap 60 detik POST ulang
// (denyut interval — selama proses hidup, sesi dianggap aktif walau user diam);
// session.deleted -> PATCH selesai (tutup eksplisit); session.error -> PATCH
// error (final, butuh perhatian); session.idle/session.status -> PATCH idle
// (heartbeat, bukan tutup). Tanpa interaksi LLM, jadi sesi revisi/lanjutan
// yang tanpa perintah PDC pun tetap terlacak. Selesai sejati saat close/kill/
// crash terdeteksi via timeout 3 menit di flag sesiAktif dashboard (tak ada
// event tutup-proses di OpenCode, jadi goodbye-message tak bisa diandalkan).

export const PdcPresencePlugin = async ({ directory, client }) => {
  const API = (process.env.PDC_API_URL || "http://localhost:3000").replace(/\/$/, "");
  const KEY = process.env.PDC_API_KEY || "";
  const MODE = process.env.PDC_MODE === "plan" ? "plan" : "build";

  const log = async (level, message, extra) => {
    try {
      await client.app.log({ body: { service: "pdc-presence", level, message, extra: extra ?? {} } });
    } catch {
      /* abaikan: logging tak boleh mengganggu sesi */
    }
  };

  await log("info", "pdc-presence loaded", {
    directory,
    mode: MODE,
    keyAda: Boolean(KEY),
    node: typeof process !== "undefined" ? process.version : "tak-dikenal",
    execPath: typeof process !== "undefined" ? process.execPath : "tak-dikenal",
  });

  // Direct fetch di proses plugin (tanpa anak-proses): execFileSync(process.execPath)
  // terbukti gagal di lingkungan ini (spawnSync ditolak). Mengembalikan
  // {ok, status} agar "terkirim" vs "diterima" tak ambigu.
  const kirim = async (path, method, body) => {
    if (!KEY) return { ok: false, status: "tanpa-key" };
    if (typeof fetch !== "function") return { ok: false, status: "tanpa-fetch" };
    try {
      const res = await fetch(`${API}${path}`, {
        method,
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      return { ok: res.ok, status: String(res.status) };
    } catch (e) {
      return { ok: false, status: "jaringan:" + String((e && e.message) || e).slice(0, 200) };
    }
  };

  // Sesi yang dikenal proses ini (untuk denyut interval). Kunci = session id,
  // nilai = {repo_full, mode} dari saat sesi dibuka.
  const dikenal = new Map();
  const DENYUT_MS = 60000;

  const denyut = async () => {
    if (!KEY || dikenal.size === 0) return;
    for (const [id, meta] of dikenal) {
      const hasil = await kirim("/api/sessions", "POST", {
        session_id: id,
        repo_full: meta.repo_full,
        mode: meta.mode,
      });
      await log(hasil.ok ? "info" : "warn", `denyut -> ${hasil.status}`, { sessionId: id });
    }
    await cekKomit();
  };

  // Interval hidup selama proses OpenCode hidup; mati sendiri saat close/kill.
  const denyutTimer = setInterval(() => {
    denyut().catch(() => {});
  }, DENYUT_MS);
  if (typeof denyutTimer.unref === "function") denyutTimer.unref();

  // Jejak metadata (opsi A): antre path suntingan, flush batch tiap 30 dtk.
  // HANYA path + waktu yang dikirim — isi file tak pernah dibaca/diirim.
  const antreSunting = [];
  let terakhir = null; // session id terakhir terlihat (atribusi antrean)
  const BATCH_MS = 30000;

  const git = async (args) => {
    try {
      const { execFileSync } = await import("node:child_process");
      return execFileSync("git", ["-C", directory, ...args], { encoding: "utf8", timeout: 5000 }).trim();
    } catch {
      return null;
    }
  };

  const siramSunting = async () => {
    if (!KEY || antreSunting.length === 0 || dikenal.size === 0) {
      antreSunting.length = 0;
      return;
    }
    const target = terakhir && dikenal.has(terakhir) ? terakhir : [...dikenal.keys()][0];
    const events = antreSunting.splice(0, 50).map((file_path) => ({ kind: "edit", file_path }));
    const hasil = await kirim("/api/sessions/activity", "POST", { session_id: target, events });
    await log(hasil.ok ? "info" : "warn", `aktivitas -> ${hasil.status} (${events.length} sunting)`, {
      sessionId: target,
    });
  };

  const siramTimer = setInterval(() => {
    siramSunting().catch(() => {});
  }, BATCH_MS);
  if (typeof siramTimer.unref === "function") siramTimer.unref();

  // Deteksi komit baru tiap denyut: milestone "perubahan dikomit".
  // Diatribusikan ke semua sesi dikenal proses ini (satu repo per proses).
  let headTerakhir = null;
  const cekKomit = async () => {
    if (!KEY || dikenal.size === 0) return;
    const head = await git(["rev-parse", "HEAD"]);
    if (!head) return;
    if (headTerakhir === null) {
      headTerakhir = head;
      return;
    }
    if (head === headTerakhir) return;
    headTerakhir = head;
    const stat = (await git(["show", "--shortstat", "--format=%H", "HEAD"])) || "";
    const m = stat.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
    const milestone = {
      kind: "commit",
      commit_sha: head.slice(0, 40),
      files_changed: m ? Number(m[1]) : null,
      lines_added: m && m[2] ? Number(m[2]) : null,
      lines_removed: m && m[3] ? Number(m[3]) : null,
    };
    for (const id of dikenal.keys()) {
      const hasil = await kirim("/api/sessions/activity", "POST", { session_id: id, events: [milestone] });
      await log(hasil.ok ? "info" : "warn", `komit -> ${hasil.status} (${head.slice(0, 7)})`, { sessionId: id });
    }
  };

  const infoSesi = (event) => {
    const p = event?.properties ?? {};
    const info = p?.info ?? {};
    return {
      id:
        info.id ??
        p.sessionId ??
        p.sessionID ??
        event?.sessionId ??
        event?.sessionID ??
        null,
      mode: MODE,
    };
  };

  const repoFull = async () => {
    try {
      const { execFileSync } = await import("node:child_process");
      const url = execFileSync("git", ["-C", directory, "config", "--get", "remote.origin.url"], {
        encoding: "utf8",
        timeout: 5000,
      }).trim();
      const m = url.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/);
      if (m) return m[1];
    } catch {
      /* abaikan */
    }
    return null;
  };

  return {
    event: async ({ event }) => {
      const tipe = (() => {
        try {
          return String(event?.type ?? "tak-dikenal");
        } catch {
          return "tak-terbaca";
        }
      })();
      try {
        await log("info", `event diterima: ${tipe}`, { sessionId: infoSesi(event).id });
      } catch {
        /* abaikan */
      }
      try {
        if (tipe === "session.created") {
          const s = infoSesi(event);
          if (!s.id) {
            await log("warn", "session.created tanpa id, dilewati");
            return;
          }
          if (!KEY) {
            await log("warn", "PDC_API_KEY kosong, lewati lapor (set env User PDC_API_KEY)");
            return;
          }
        const repo = await repoFull();
        const hasilPost = await kirim("/api/sessions", "POST", {
          session_id: s.id,
          repo_full: repo,
          mode: s.mode,
        });
        if (hasilPost.ok) {
          dikenal.set(s.id, { repo_full: repo, mode: s.mode });
          terakhir = s.id;
        }
        await log(hasilPost.ok ? "info" : "warn", `POST /api/sessions -> ${hasilPost.status}`, { sessionId: s.id });
        }
        // file.edited = jejak metadata: antre path-nya saja (maks 50).
        if (tipe === "file.edited") {
          try {
            const p = event?.properties ?? {};
            const mentah =
              p.file ?? p.path ?? p.filePath ?? p.filename ?? p.relativePath ?? p.info?.file ?? null;
            if (typeof mentah === "string" && mentah && antreSunting.length < 50) {
              antreSunting.push(mentah.slice(0, 500));
            }
          } catch {
            /* abaikan */
          }
          return;
        }
        // idle/status = heartbeat (masih terbuka, menunggu input) — bukan tutup.
        // (session.idle deprecated di OpenCode baru, diganti session.status.)
        if (tipe === "session.idle" || tipe === "session.status") {
          const s = infoSesi(event);
          if (s.id) terakhir = s.id;
          if (!s.id) {
            await log("warn", `${tipe} tanpa id sesi, dilewati`);
            return;
          }
          if (!KEY) {
            await log("warn", "PDC_API_KEY kosong, lewati lapor (set env User PDC_API_KEY)");
            return;
          }
        const hasilPatch = await kirim("/api/sessions", "PATCH", {
          session_id: s.id,
          status: "idle",
        });
        await log(hasilPatch.ok ? "info" : "warn", `PATCH /api/sessions -> ${hasilPatch.status} (${tipe})`, {
          sessionId: s.id,
        });
        }
        if (tipe === "session.error" || tipe === "session.deleted") {
          // Tutup sejati: error (butuh perhatian) atau hapus eksplisit.
          const s = infoSesi(event);
          if (!s.id) {
            await log("warn", `${tipe} tanpa id sesi, dilewati`);
            return;
          }
          if (!KEY) {
            await log("warn", "PDC_API_KEY kosong, lewati lapor (set env User PDC_API_KEY)");
            return;
          }
        const akhir = tipe === "session.error" ? "error" : "selesai";
        const hasilTutup = await kirim("/api/sessions", "PATCH", {
          session_id: s.id,
          status: akhir,
        });
        if (hasilTutup.ok) dikenal.delete(s.id);
        await log(hasilTutup.ok ? "info" : "warn", `PATCH /api/sessions -> ${hasilTutup.status} (${tipe})`, {
          sessionId: s.id,
        });
        }
      } catch (e) {
        try {
          await log("error", `handler gagal di ${tipe}: ${String(e && e.message ? e.message : e)}`);
        } catch {
          /* abaikan */
        }
      }
    },
  };
};
