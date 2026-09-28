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
  };

  // Interval hidup selama proses OpenCode hidup; mati sendiri saat close/kill.
  const denyutTimer = setInterval(() => {
    denyut().catch(() => {});
  }, DENYUT_MS);
  if (typeof denyutTimer.unref === "function") denyutTimer.unref();

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
        if (hasilPost.ok) dikenal.set(s.id, { repo_full: repo, mode: s.mode });
        await log(hasilPost.ok ? "info" : "warn", `POST /api/sessions -> ${hasilPost.status}`, { sessionId: s.id });
        }
        // idle/status = heartbeat (masih terbuka, menunggu input) — bukan tutup.
        // (session.idle deprecated di OpenCode baru, diganti session.status.)
        if (tipe === "session.idle" || tipe === "session.status") {
          const s = infoSesi(event);
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
