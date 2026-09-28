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

export const PdcPresencePlugin = async ({ directory }) => {
  const API = (process.env.PDC_API_URL || "http://localhost:3000").replace(/\/$/, "");
  const KEY = process.env.PDC_API_KEY || "";
  const MODE = process.env.PDC_MODE === "plan" ? "plan" : "build";

  const kirim = async (path, method, body) => {
    if (!KEY) return;
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
        ",signal:AbortSignal.timeout(10000)}).catch(()=>{})";
      const { execFileSync } = await import("node:child_process");
      execFileSync(process.execPath, ["-e", script], { stdio: "ignore", timeout: 15000 });
    } catch {
      /* abaikan: presence tak boleh mengganggu sesi */
    }
  };

  const infoSesi = (event) => {
    const p = event?.properties ?? {};
    return {
      id: p?.info?.id ?? event?.sessionId ?? event?.id ?? null,
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
      if (event.type === "session.created") {
        const s = infoSesi(event);
        if (!s.id) return;
        await kirim("/api/sessions", "POST", { session_id: s.id, repo_full: await repoFull(), mode: s.mode });
      }
      if (event.type === "session.idle" || event.type === "session.error") {
        const s = infoSesi(event);
        if (!s.id) return;
        await kirim("/api/sessions", "PATCH", {
          session_id: s.id,
          status: event.type === "session.error" ? "error" : "idle",
        });
      }
    },
  };
};
