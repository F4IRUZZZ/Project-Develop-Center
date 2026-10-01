// pdc-presence — plugin OpenCode: laporkan lifecycle sesi ke PDC.
// Taruh di: <repo>/.opencode/plugins/pdc-presence.js  (per repo)
// VERSI_PLUGIN: naikkan tiap template berubah (halaman Status bandingkan).
const VERSI_PLUGIN = "2026.10.01";
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

export const PdcPresencePlugin = async ({ directory, client, project }) => {
  const API = (process.env.PDC_API_URL || "http://localhost:3000").replace(/\/$/, "");
  const KEY = process.env.PDC_API_KEY || "";
  // Env eksplisit menang; bila tak diset, coba baca mode dari event (TUI bisa
  // pindah plan/build kapan saja — env statis tak mencerminkannya).
  const ENV_MODE = process.env.PDC_MODE === "plan" || process.env.PDC_MODE === "build" ? process.env.PDC_MODE : null;
  const MODE = ENV_MODE ?? "build";

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

  // Daftarkan sesi (baru maupun lanjutan/Continue) — POST idempoten.
  // reopen=true hanya dari bukti hidup (event nyata / daftar sesi): membuka
  // kembali baris yang sudah final. Denyut biasa TANPA flag ini.
  const daftarkan = async (id, { lewat = "lazy", reopen = false, mode = MODE } = {}) => {
    if (!id || !KEY || dikenal.has(id)) return;
    const repo = await repoFull();
    const hasil = await kirim("/api/sessions", "POST", {
      session_id: id,
      repo_full: repo,
      mode,
      plugin_version: VERSI_PLUGIN,
      ...(reopen ? { reopen: true } : {}),
    });
    if (hasil.ok) {
      dikenal.set(id, { repo_full: repo, mode });
      terakhir = id;
    }
    await log(hasil.ok ? "info" : "warn", `lazy-register -> ${hasil.status} (${lewat})`, { sessionId: id });
  };

  // Rekonsiliasi: sesi resume yang NOL event tetap ketahuan via daftar sesi
  // server OpenCode. Hanya yang se-direktori/proyek proses ini (tanpa
  // pencocokan = lewati, anti salah atribusi). Gagal sekali → diam + warn.
  let rekonsiliasiMati = false;
  const rekonsiliasi = async () => {
    if (!KEY || rekonsiliasiMati) return;
    try {
      const r = await client.session.list();
      const daftar = Array.isArray(r) ? r : (r?.data ?? []);
      if (!Array.isArray(daftar)) return;
      for (const it of daftar) {
        const id = it?.id ?? it?.sessionId ?? it?.sessionID ?? null;
        if (!id || typeof id !== "string" || dikenal.has(id)) continue;
        const cocok =
          (typeof it?.directory === "string" && it.directory === directory) ||
          (typeof it?.projectID === "string" && project && it.projectID === project.id) ||
          (typeof it?.projectId === "string" && project && it.projectId === project.id);
        if (!cocok) continue;
        await daftarkan(id, { lewat: "rekonsiliasi", reopen: true });
      }
    } catch (e) {
      rekonsiliasiMati = true;
      await log("warn", `rekonsiliasi mati: ${String((e && e.message) || e).slice(0, 150)}`);
    }
  };

  const denyut = async () => {
    if (!KEY) return;
    await rekonsiliasi();
    if (dikenal.size === 0) return;
    for (const [id, meta] of dikenal) {
      const hasil = await kirim("/api/sessions", "POST", {
        session_id: id,
        repo_full: meta.repo_full,
        mode: meta.mode,
        plugin_version: VERSI_PLUGIN,
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

  // Ringkasan per-giliran (opsi B): teks balasan asisten, diredaksi (buang
  // blok kode + cap 1000 + ellipsis bila terpotong), dikirim saat
  // idle/status (akhir giliran).
  // Fakta skema resmi: message.updated HANYA bawa info (tanpa teks); teks
  // ada di message.part.updated (TextPart, TANPA role). Peran didapat dari
  // peta messageID->role yang dibangun dari message.updated. Part bertipe
  // reasoning/synthetic/ignored dan teks user DITOLAK. Server redaksi lapis 2.
  const peranPesan = new Map(); // messageID -> 'assistant' | 'user'
  const teksPerPesan = new Map(); // sessionID -> Map(partID -> text)
  const BATAS_RINGKASAN = 1000;
  const redaksi = (teks) => {
    const bersih = String(teks)
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return bersih.length > BATAS_RINGKASAN ? bersih.slice(0, BATAS_RINGKASAN - 1) + "…" : bersih;
  };
  const catatPeran = (event) => {
    try {
      const info = event?.properties?.info;
      if (info && typeof info.id === "string" && (info.role === "assistant" || info.role === "user")) {
        peranPesan.set(info.id, info.role);
        if (peranPesan.size > 200) {
          const pertama = peranPesan.keys().next().value;
          peranPesan.delete(pertama);
        }
      }
    } catch {
      /* abaikan */
    }
  };
  const catatPart = (event) => {
    try {
      const part = event?.properties?.part;
      if (!part || typeof part !== "object" || part.type !== "text") return;
      if (part.synthetic || part.ignored) return;
      if (typeof part.text !== "string" || !part.text.trim()) return;
      if (typeof part.sessionID !== "string" || !part.sessionID) return;
      if (typeof part.messageID !== "string" || !part.messageID) return;
      if (peranPesan.get(part.messageID) === "user") return; // teks user dilarang
      if (!teksPerPesan.has(part.sessionID)) teksPerPesan.set(part.sessionID, new Map());
      teksPerPesan.get(part.sessionID).set(part.id ?? part.messageID, part.text);
    } catch {
      /* abaikan */
    }
  };
  const siramRingkasan = async (sessionId) => {
    if (!KEY || !dikenal.has(sessionId)) return;
    const per = teksPerPesan.get(sessionId);
    teksPerPesan.delete(sessionId);
    if (!per || per.size === 0) return;
    const teks = redaksi([...per.values()].join("\n"));
    if (teks.length < 20) return;
    const hasil = await kirim("/api/sessions/activity", "POST", {
      session_id: sessionId,
      events: [{ kind: "ringkasan", teks }],
    });
    await log(hasil.ok ? "info" : "warn", `ringkasan -> ${hasil.status}`, { sessionId });
  };

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

  // Cari ID sesi di berbagai bentuk payload. Urutan penting: kunci
  // session* tepercaya di mana pun; .id polos HANYA dari info (created/
  // updated/deleted) — .id milik message/part BUKAN id sesi, dilarang.
  const infoSesi = (event) => {
    const p = event?.properties ?? {};
    const ambil = (o) => {
      if (!o || typeof o !== "object") return null;
      const v = o.sessionID ?? o.sessionId ?? o.session_id ?? null;
      return typeof v === "string" && v ? v : null;
    };
    const id =
      ambil(p) ??
      ambil(p.info) ??
      ambil(p.message) ??
      ambil(p.part) ??
      ambil(p.session) ??
      ambil(event) ??
      (typeof p.info?.id === "string" && p.info.id ? p.info.id : null);
    let mode = MODE;
    if (!ENV_MODE) {
      for (const o of [p, p?.info, p?.message]) {
        const m = o?.mode ?? o?.sessionMode;
        if (m === "plan" || m === "build") {
          mode = m;
          break;
        }
      }
    }
    return { id, mode };
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

  // Ping kesehatan sekali saat muat (tanpa sesi): halaman Status tahu salinan
  // ini ada + versinya, walau belum ada sesi dibuka. Gagal diam-diam.
  // (Di sini karena butuh repoFull + kirim yang didefinisikan di atas.)
  try {
    if (KEY) {
      const repoAwal = await repoFull();
      if (repoAwal) {
        kirim("/api/plugin-ping", "POST", { repo_full: repoAwal, plugin_version: VERSI_PLUGIN })
          .then((h) => log(h.ok ? "info" : "warn", `ping -> ${h.status}`, {}))
          .catch(() => {});
      }
    }
  } catch {
    /* abaikan */
  }

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
        // Registrasi malas: event ber-ID dari sesi tak dikenal (Continue/
        // resume tak memancarkan created) = bukti hidup → daftarkan +
        // buka-kembali. Dikecualikan deleted/error (cabang tutup mengurusnya).
        if (tipe !== "session.deleted" && tipe !== "session.error") {
          const sAwal = infoSesi(event);
          if (sAwal.id && !dikenal.has(sAwal.id) && KEY) {
            await daftarkan(sAwal.id, { lewat: tipe, reopen: true, mode: sAwal.mode });
          }
        }
        if (tipe === "session.created") {
          const s = infoSesi(event);
          if (s.id && dikenal.has(s.id)) return; // sudah via lazy-register
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
          plugin_version: VERSI_PLUGIN,
        });
        if (hasilPost.ok) {
          dikenal.set(s.id, { repo_full: repo, mode: s.mode });
          terakhir = s.id;
        }
        await log(hasilPost.ok ? "info" : "warn", `POST /api/sessions -> ${hasilPost.status}`, { sessionId: s.id });
        }
        // file.edited = jejak metadata: antre path-nya saja (maks 50),
        // dinormalisasi relatif terhadap repo (absolut Windows bocor layout mesin).
        if (tipe === "file.edited") {
          try {
            const p = event?.properties ?? {};
            const mentah =
              p.file ?? p.path ?? p.filePath ?? p.filename ?? p.relativePath ?? p.info?.file ?? null;
            if (typeof mentah === "string" && mentah && antreSunting.length < 50) {
              let tampil = mentah;
              try {
                const pathMod = await import("node:path");
                const rel = pathMod.relative(directory, mentah);
                if (rel && !rel.startsWith("..")) tampil = rel.split(pathMod.sep).join("/");
              } catch {
                /* pertahankan mentah */
              }
              antreSunting.push(tampil.slice(0, 500));
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
        await siramRingkasan(s.id);
        }
        if (tipe === "message.updated") {
          catatPeran(event);
          return;
        }
        if (tipe === "message.part.updated") {
          catatPart(event);
          return;
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
