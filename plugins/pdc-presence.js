// pdc-presence — plugin OpenCode: laporkan lifecycle sesi ke PDC.
// Taruh di: <repo>/.opencode/plugins/pdc-presence.js  (per repo)
// Butuh env di mesin: PDC_API_URL (default http://localhost:3000),
// PDC_API_KEY (buat di webapp PDC > Pengaturan), opsional PDC_MODE (plan/build).
//
// Cara kerja: session.created -> POST /api/sessions (buka sesi),
// session.idle/session.error -> PATCH (tutup sesi). Tanpa interaksi LLM,
// jadi sesi revisi/lanjutan yang tanpa perintah PDC pun tetap terlacak.
// Blind spot yang diketahui: resume (--continue) di sebagian versi OpenCode
// tidak memicu event; PDC menutupnya via timeout basi 15 menit (display).

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

  // Mengembalikan {ok, status} agar "terkirim" vs "diterima" tak ambigu.
  // stdout anak dibaca (bukan ignore) supaya kode status tercatat di log.
  const kirim = async (path, method, body) => {
    if (!KEY) return { ok: false, status: "tanpa-key" };
    try {
      const script =
        "fetch(" +
        JSON.stringify(`${API}${path}`) +
        ",{method:" +
        JSON.stringify(method) +
        ",headers:{'Authorization':'Bearer " +
        KEY +
        "','Content-Type':'application/json'},body:" +
        JSON.stringify(JSON.stringify(body)) +
        ",signal:AbortSignal.timeout(10000)}).then(r=>console.log('HTTP:'+r.status)).catch(e=>console.log('ERR:'+String(e&&e.message?e.message:e).slice(0,120)))";
      const { execFileSync } = await import("node:child_process");
      const out = execFileSync(process.execPath, ["-e", script], {
        encoding: "utf8",
        timeout: 15000,
      }).trim();
      const m = out.match(/HTTP:(\d+)/);
      if (m) return { ok: Number(m[1]) >= 200 && Number(m[1]) < 300, status: m[1] };
      const err = out.match(/ERR:([\s\S]*)/);
      return { ok: false, status: "anak:" + (err ? err[1].trim().slice(0, 300) : out.slice(0, 300) || "tanpa-respons") };
    } catch (e) {
      const std = e && e.stdout ? String(e.stdout).slice(0, 300) : "";
      const ste = e && e.stderr ? String(e.stderr).slice(0, 300) : "";
      const msg = String((e && e.message) || e).slice(0, 200);
      return { ok: false, status: `exec-gagal:${msg} stdout:[${std}] stderr:[${ste}]` };
    }
  };

  const bentukEvent = (event) => {
    try {
      return {
        keys: Object.keys(event ?? {}),
        propKeys: Object.keys(event?.properties ?? {}),
        infoKeys: Object.keys(event?.properties?.info ?? {}),
      };
    } catch {
      return { keys: [], propKeys: [], infoKeys: [] };
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
        const hasilPost = await kirim("/api/sessions", "POST", {
          session_id: s.id,
          repo_full: await repoFull(),
          mode: s.mode,
        });
        await log(hasilPost.ok ? "info" : "warn", `POST /api/sessions -> ${hasilPost.status}`, { sessionId: s.id });
        }
        if (tipe === "session.idle" || tipe === "session.error") {
          await log("info", `idle-masuk: ${tipe}`);
          let bentuk = { keys: [], propKeys: [], infoKeys: [] };
          try {
            bentuk = bentukEvent(event);
            await log("info", `bentuk event ${tipe}`, bentuk);
          } catch (e) {
            await log("warn", `idle-gagal-bentuk: ${String(e && e.message ? e.message : e)}`);
          }
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
          status: tipe === "session.error" ? "error" : "idle",
        });
        await log(hasilPatch.ok ? "info" : "warn", `PATCH /api/sessions -> ${hasilPatch.status} (${tipe})`, {
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
