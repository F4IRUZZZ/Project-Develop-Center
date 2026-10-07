// pdc-presence — plugin OpenCode: laporkan lifecycle sesi ke PDC.
// Taruh di: <repo>/.opencode/plugins/pdc-presence.js  (per repo)
// Format OpenCode v1.18: SATU named export function (lihat
// node_modules/@opencode-ai/plugin/dist/example.js: `export const X = ...`).
// JANGAN tambah export lain / default export (risiko registrasi ganda).
// JANGAN `import { Plugin } from "@opencode/plugin"`: tak ter-resolve dari
// file .js polos dan hanya helper type — object return lolos skema yang sama.
const VERSI_PLUGIN = "2026.10.13";
// Butuh env di mesin: PDC_API_URL (default production; set eksplisit
// untuk dev lokal), PDC_API_KEY (buat di webapp PDC > Pengaturan),
// opsional PDC_MODE (plan/build).
//
// Cara kerja: session.created -> POST (buka sesi); tiap 60 detik POST ulang
// (denyut interval — selama proses hidup, sesi dianggap aktif walau user diam);
// session.deleted -> PATCH selesai (tutup eksplisit); session.error -> PATCH
// error (final, butuh perhatian); session.idle/session.status -> PATCH idle
// (heartbeat + deteksi transisi bekerja->selesai di server). tool.execute.after
// (edit/write/patch) -> antre path suntingan (cadangan bila event file.edited
// tak datang); tool APA PUN + part pesan asisten -> sinyal "kerja" throttled
// (bukti sibuk walau tanpa suntingan — indikator AI Working jujur).
// Tanpa interaksi LLM, jadi sesi revisi/lanjutan yang tanpa perintah PDC
// pun tetap terlacak.
// Selesai sejati saat close/kill/crash terdeteksi via timeout 3 menit di flag
// sesiAktif dashboard (tak ada event tutup-proses di OpenCode, jadi
// goodbye-message tak bisa diandalkan).

export const PdcPresence = async (input) => {
  // v1.18: lokasi = input.directory (fallback worktree/cwd). Semua state
  // per-proses di bawah ini. Timer unref agar tak menahan proses.
  const { client, project } = input ?? {};
  const directory = input?.directory || input?.worktree || process.cwd() || "";
  const directorySumber = input?.directory ? "input.directory" : input?.worktree ? "worktree" : process.cwd() ? "cwd(fallback)" : "kosong";
  const API = (process.env.PDC_API_URL || "https://project-develop-center.vercel.app").replace(/\/$/, "");
  const KEY = process.env.PDC_API_KEY || "";
  // Env eksplisit menang; bila tak diset, mode bersifat dinamis per-event
  // (TUI bisa pindah plan/build kapan saja — env statis tak mencerminkannya).
  // Jangan tampilkan "build" seolah pasti — tandai sebagai default.
  const ENV_MODE = process.env.PDC_MODE === "plan" || process.env.PDC_MODE === "build" ? process.env.PDC_MODE : null;
  const MODE = ENV_MODE ?? "build";
  const MODE_SUMBER = ENV_MODE ? "env" : "default(build, dinamis per-event)";
  // v1.18 tak punya ctx.app — baca versi dari env bila ada.
  const appVersion = process.env.OPENCODE_VERSION ?? "tak-dikenal";

  // Mode tenang default: sukses diam, gagal bersuara.
  // Set PDC_DEBUG=1 untuk log detail lengkap seperti dulu.
  const DEBUG = process.env.PDC_DEBUG === "1";

  // Log via client.app.log (server logs) agar TUI steril — console.log
  // dari proses plugin bocor ke area ketikan saat ngelag (#168). stdout
  // hanya fallback bila client tak ada. Fire-and-forget: tak pernah
  // di-await di jalur panas, tak pernah throw.
  const log = (level, message, extra) => {
    try {
      if (level === "info" && !DEBUG) return; // sukses diam
      const body = {
        service: "pdc-presence",
        level: level === "warn" || level === "error" ? level : "info",
        message: `[pdc-presence] ${message}`,
        extra: extra ?? {},
      };
      if (client?.app?.log) {
        void Promise.resolve()
          .then(() => client.app.log({ body }))
          .catch(() => {});
        return;
      }
      const tag = level === "warn" ? "WARN" : level === "error" ? "ERROR" : "INFO";
      console.log(`[pdc-presence] ${tag} ${message} ${JSON.stringify(extra ?? {})}`);
    } catch {
      /* abaikan: logging tak boleh mengganggu sesi */
    }
  };
  // Sunyi total: tak ada output saat sukses. Set PDC_DEBUG=1 untuk
  // satu baris siap + detail lengkap. Gagal (warn/error) tetap bersuara.
  const dirRingkas = (() => {
    try {
      const parts = String(directory).split(/[/\\]/).filter(Boolean);
      return parts.length ? parts[parts.length - 1] : "-";
    } catch {
      return "-";
    }
  })();
  if (DEBUG) {
    log("info", `siap (v1) dir=${dirRingkas} mode=${MODE}`, {
      directory,
      directorySumber,
      mode: MODE,
      modeSumber: MODE_SUMBER,
      keyAda: Boolean(KEY),
      appVersion,
    });
  }
  if (!directory) {
    log("warn", "directory kosong total, pelaporan repo dimatikan", {});
  }

  // Direct fetch di proses plugin. Mengembalikan {ok, status} agar
  // "terkirim" vs "diterima" tak ambigu.
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
  // reopen=true hanya dari bukti hidup (event nyata): membuka kembali
  // baris yang sudah final. Denyut biasa TANPA flag ini. eksplisit (#210):
  // apakah mode benar dari env/event (true) atau fallback default (false).
  const daftarkan = async (id, { lewat = "lazy", reopen = false, mode = MODE, eksplisit = Boolean(ENV_MODE) } = {}) => {
    if (!id || !KEY || dikenal.has(id)) return;
    const repo = await repoFull(`daftar:${lewat}`);
    const hasil = await kirim("/api/sessions", "POST", {
      session_id: id,
      repo_full: repo,
      mode,
      mode_eksplisit: eksplisit,
      plugin_version: VERSI_PLUGIN,
      ...(reopen ? { reopen: true } : {}),
    });
    if (hasil.ok) {
      dikenal.set(id, { repo_full: repo, mode, eksplisit });
      terakhir = id;
    }
    log(hasil.ok ? "info" : "warn", `lazy-register -> ${hasil.status} (${lewat})`, { sessionId: id });
  };

  // Throttle PATCH idle (#184, dipangkas #204): OpenCode memancarkan
  // session.idle DAN session.status di tiap akhir giliran. Sejak PATCH jadi
  // heartbeat murni (done pindah ke sweep), double-PATCH tak berbahaya —
  // throttle tinggal anti-flapping 15 dtk agar cap last_idle_at (flip
  // real-time #202) tak terlewat. Ringkasan tertunda ikut flush di PATCH
  // berikutnya (buffer dipertahankan).
  const idleTerkirim = new Map(); // sessionId -> epoch ms
  const SELA_IDLE_MS = 15000;

  // Status denyut terakhir per sesi untuk lapor TRANSISI saja:
  // gagal-pertama -> warn 1x, pulih -> info 1x, selebihnya diam (#160).
  // Outage panjang meninggalkan 2 baris, bukan tembok tiap 60 dtk.
  const denyutOk = new Map();
  const denyut = async () => {
    if (!KEY) return;
    await rekonsiliasi();
    if (dikenal.size === 0) return;
    // Retry #99: sesi yang terdaftar buta-repo coba resolve lagi tiap
    // denyut; begitu dapat, meta diperbarui dan POST di bawah membawa
    // repo (server backfill project_id bila masih kosong).
    for (const [id, meta] of dikenal) {
      if (!meta.repo_full) {
        const r = await repoFull("denyut");
        if (r) {
          meta.repo_full = r;
          log("info", `repo pulih saat denyut: ${r}`, { sessionId: id });
        }
      }
    }
    for (const [id, meta] of dikenal) {
      const hasil = await kirim("/api/sessions", "POST", {
        session_id: id,
        repo_full: meta.repo_full,
        mode: meta.mode,
        mode_eksplisit: meta.eksplisit ?? Boolean(ENV_MODE),
        plugin_version: VERSI_PLUGIN,
      });
      const dulu = denyutOk.get(id);
      denyutOk.set(id, hasil.ok);
      if (!hasil.ok && dulu !== false) {
        log("warn", `denyut gagal (mulai): ${hasil.status}`, { sessionId: id });
      } else if (hasil.ok && dulu === false) {
        log("info", `denyut pulih: ${hasil.status}`, { sessionId: id });
      }
    }
    await cekKomit();
  };

  // Interval hidup selama plugin hidup.
  const denyutTimer = setInterval(() => {
    denyut().catch(() => {});
  }, DENYUT_MS);
  if (typeof denyutTimer.unref === "function") denyutTimer.unref();

  // Ringkasan per-giliran (opsi B): teks balasan asisten, diredaksi (buang
  // blok kode + cap 1000 + ellipsis bila terpotong), dikirim saat
  // idle/status (akhir giliran). Bentuk payload event v1.18: info {id, role},
  // part {id, sessionID, messageID, type, text, synthetic, ignored} — field
  // yang tak dikenal diabaikan, bukan error.
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
    log(hasil.ok ? "info" : "warn", `ringkasan -> ${hasil.status}`, { sessionId });
  };

  // Sinyal kerja (#182, selaras idle #210): bukti AI sibuk ke server (kind
  // "kerja", latest-only, tanpa isi/payload). Throttle 15 dtk per sesi —
  // sama orde dengan idle agar giliran rapat tak false-siaga.
  const kerjaTerakhir = new Map(); // sessionId -> epoch ms
  const SELA_KERJA_MS = 15000;
  const sinyalKerja = async (id) => {
    try {
      if (!id || !KEY || !dikenal.has(id)) return;
      const kini = Date.now();
      if (kini - (kerjaTerakhir.get(id) ?? 0) < SELA_KERJA_MS) return;
      kerjaTerakhir.set(id, kini);
      const metaKirim = dikenal.get(id);
      const hasil = await kirim("/api/sessions/activity", "POST", {
        session_id: id,
        events: [{ kind: "kerja", mode: metaKirim?.mode ?? MODE, mode_eksplisit: metaKirim?.eksplisit ?? Boolean(ENV_MODE) }],
      });
      log(hasil.ok ? "info" : "warn", `kerja -> ${hasil.status}`, { sessionId: id });
    } catch {
      /* abaikan */
    }
  };

  // Jejak metadata (opsi A): antre path suntingan, flush batch tiap 30 dtk.
  // HANYA path + waktu yang dikirim — isi file tak pernah dibaca/diirim.
  const antreSunting = [];
  let terakhir = null; // session id terakhir terlihat (atribusi antrean)
  const BATCH_MS = 30000;

  // Normalisasi satu path mentah -> path relatif repo (atau null bila
  // tak layak antre). Absolut Windows tak boleh bocor layout mesin.
  const antrekan = async (mentah) => {
    try {
      if (typeof mentah !== "string" || !mentah || antreSunting.length >= 50) return;
      let tampil = mentah;
      try {
        const pathMod = await import("node:path");
        const rel = pathMod.relative(directory, mentah);
        if (rel && !rel.startsWith("..")) tampil = rel.split(pathMod.sep).join("/");
      } catch {
        /* pertahankan mentah */
      }
      antreSunting.push(tampil.slice(0, 500));
    } catch {
      /* abaikan */
    }
  };

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
    log(hasil.ok ? "info" : "warn", `aktivitas -> ${hasil.status} (${events.length} sunting)`, {
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
      log(hasil.ok ? "info" : "warn", `komit -> ${hasil.status} (${head.slice(0, 7)})`, { sessionId: id });
    }
  };

  // Cari ID sesi di berbagai bentuk payload. v1.18: field umum dulu
  // (sessionID/sessionId/session_id/info.id), lalu deep-scan rekursif cari
  // string ^ses_[A-Za-z0-9]+ (format ID sesi OpenCode, stabil lintas versi).
  // .id polos HANYA dari info — .id milik message/part BUKAN id sesi, dilarang.
  const POLA_SESI = /^ses_[A-Za-z0-9]+$/;
  const cariIdDalam = (o, dalam = 0, lihat = new Set()) => {
    if (o === null || o === undefined || dalam > 4) return null;
    if (typeof o === "string") return POLA_SESI.test(o) ? o : null;
    if (typeof o !== "object" || lihat.has(o)) return null;
    lihat.add(o);
    if (Array.isArray(o)) {
      for (const v of o) {
        const h = cariIdDalam(v, dalam + 1, lihat);
        if (h) return h;
      }
      return null;
    }
    for (const k of ["sessionID", "sessionId", "session_id"]) {
      const v = o[k];
      if (typeof v === "string" && POLA_SESI.test(v)) return v;
    }
    for (const v of Object.values(o)) {
      const h = cariIdDalam(v, dalam + 1, lihat);
      if (h) return h;
    }
    return null;
  };
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
      (typeof p.info?.id === "string" && p.info.id ? p.info.id : null) ??
      cariIdDalam(event);
    // Mode eksplisit (#206): hanya dari env atau field event. Tanpa keduanya
    // = tak-terdeteksi -> fallback build (kontrak: unknown dihitung build).
    // Pembedaan ini penting agar mode basi tak menimpa mode segar.
    let mode = MODE;
    let eksplisit = Boolean(ENV_MODE);
    if (!ENV_MODE) {
      for (const o of [p, p?.info, p?.message]) {
        const m = o?.mode ?? o?.sessionMode;
        if (m === "plan" || m === "build") {
          mode = m;
          eksplisit = true;
          break;
        }
      }
    }
    return { id, mode, eksplisit };
  };

  // Resolusi repo TANPA spawn (spawn git flaky dari proses plugin:
  // ETIMEDOUT persisten walau shell instan). Baca .git/config via fs
  // (format INI stabil) + dukung worktree (.git berupa file penunjuk).
  // URL non-GitHub / bukan repo = null wajar (tanpa warn). Spawn lama hanya
  // sebagai fallback terakhir. Gagal = null + warn BERSUARA (tandai) agar
  // sesi-buta-proyek (#99) langsung ketahuan — jangan pernah gagal diam-diam
  // lagi. Warn identik dibatasi 1x/10 mnt per penyebab agar tak banjir.
  const TENANG_WARN_MS = 10 * 60 * 1000;
  let warnRepoTerakhir = { kunci: null, at: 0 };
  const warnRepo = async (tandai, err) => {
    if (!tandai) return;
    const kunci = `${tandai}:${String((err && err.code) || err).slice(0, 40)}`;
    const kini = Date.now();
    if (warnRepoTerakhir.kunci !== kunci || kini - warnRepoTerakhir.at > TENANG_WARN_MS) {
      warnRepoTerakhir = { kunci, at: kini };
      await log("warn", `repo tak ter-resolve (${tandai}): dir=${directory} err=${String((err && err.message) || err).slice(0, 150)}`, {});
    }
  };
  const urlDariConfig = (isi) => {
    const m = String(isi || "").match(/\[remote\s+"origin"\][^\[]*?url\s*=\s*(\S+)/);
    const url = m ? m[1].trim() : null;
    const g = (url || "").match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/);
    return g ? g[1] : null;
  };
  const repoFull = async (tandai) => {
    try {
      const fsMod = await import("node:fs");
      const pathMod = await import("node:path");
      const baca = (p) => {
        try {
          return fsMod.readFileSync(p, "utf8");
        } catch {
          return null;
        }
      };
      // 1) .git/config langsung (kasus umum).
      const isiConfig = baca(pathMod.join(directory, ".git", "config"));
      const penunjuk = isiConfig === null ? baca(pathMod.join(directory, ".git")) : null;
      let repo = urlDariConfig(isiConfig);
      // 2) Worktree: .git adalah file "gitdir: <path>" (relatif thd dir).
      if (!repo && penunjuk) {
        const gm = penunjuk.match(/^gitdir:\s*(.+?)\s*$/m);
        if (gm) {
          const gitdir = pathMod.resolve(directory, gm[1].trim());
          repo = urlDariConfig(baca(pathMod.join(gitdir, "config")));
        }
      }
      if (repo) return repo;
      // 3) Bukan repo git / remote non-GitHub = null wajar, tanpa warn.
      // Bedakan dari error baca: bila .git ada tapi config hilang/rusak,
      // bersuara agar ketahuan.
      if (isiConfig !== null || penunjuk !== null) await warnRepo(tandai, "config-tak-terbaca");
      return null;
    } catch (e) {
      await warnRepo(tandai, e);
      return null;
    }
    // CATATAN: spawn git sengaja DIHAPUS dari jalur ini (#158) — fallback
    // lama justru sumber ETIMEDOUT. cekKomit tetap pakai git (gagal diam).
  };

  // Ping kesehatan sekali saat muat (tanpa sesi): halaman Status tahu salinan
  // ini ada + versinya, walau belum ada sesi dibuka. Gagal diam-diam.
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

  const tangani = async (event) => {
    const tipe = (() => {
      try {
        return String(event?.type ?? "tak-dikenal");
      } catch {
        return "tak-terbaca";
      }
    })();
    try {
      log("info", `event diterima: ${tipe}`, { sessionId: infoSesi(event).id });
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
          await daftarkan(sAwal.id, { lewat: tipe, reopen: true, mode: sAwal.mode, eksplisit: sAwal.eksplisit });
        }
        // Segarkan mode sesi (#206): TUI bisa pindah plan/build mid-session.
        // Hanya mode EKSPLISIT yang menimpa (fallback build tak boleh
        // menghapus plan yang sudah terdeteksi).
        if (sAwal.id && sAwal.eksplisit && dikenal.has(sAwal.id)) {
          const meta0 = dikenal.get(sAwal.id);
          if (meta0 && (meta0.mode !== sAwal.mode || !meta0.eksplisit)) {
            meta0.mode = sAwal.mode;
            meta0.eksplisit = true;
            log("info", `mode sesi -> ${sAwal.mode} (${tipe})`, { sessionId: sAwal.id });
          }
        }
      }
      if (tipe === "session.created") {
        const s = infoSesi(event);
        if (s.id && dikenal.has(s.id)) return; // sudah via lazy-register
        if (!s.id) {
          log("warn", "session.created tanpa id, dilewati");
          return;
        }
        if (!KEY) {
          log("warn", "PDC_API_KEY kosong, lewati lapor (set env User PDC_API_KEY)");
          return;
        }
        const repo = await repoFull("created");
        const hasilPost = await kirim("/api/sessions", "POST", {
          session_id: s.id,
          repo_full: repo,
          mode: s.mode,
          mode_eksplisit: s.eksplisit,
          plugin_version: VERSI_PLUGIN,
        });
        if (hasilPost.ok) {
          dikenal.set(s.id, { repo_full: repo, mode: s.mode, eksplisit: s.eksplisit });
          terakhir = s.id;
        }
        log(hasilPost.ok ? "info" : "warn", `POST /api/sessions -> ${hasilPost.status}`, { sessionId: s.id });
      }
      // file.edited = jejak metadata: antre path-nya saja (maks 50),
      // dinormalisasi relatif terhadap repo (absolut Windows bocor layout mesin).
      if (tipe === "file.edited") {
        try {
          const p = event?.properties ?? {};
          const mentah =
            p.file ?? p.path ?? p.filePath ?? p.filename ?? p.relativePath ?? p.info?.file ?? null;
          if (typeof mentah === "string" && mentah) await antrekan(mentah);
        } catch {
          /* abaikan */
        }
        return;
      }
      // idle/status = heartbeat (masih terbuka, menunggu input) — bukan tutup.
      if (tipe === "session.idle" || tipe === "session.status") {
        const s = infoSesi(event);
        if (s.id) terakhir = s.id;
        if (!s.id) {
          log("warn", `${tipe} tanpa id sesi, dilewati`);
          return;
        }
        const kiniIdle = Date.now();
        if (kiniIdle - (idleTerkirim.get(s.id) ?? 0) < SELA_IDLE_MS) {
          log("info", `idle dobel dilewati (${tipe})`, { sessionId: s.id });
          return;
        }
        idleTerkirim.set(s.id, kiniIdle);
        if (!KEY) {
          log("warn", "PDC_API_KEY kosong, lewati lapor (set env User PDC_API_KEY)");
          return;
        }
        const metaPatch = dikenal.get(s.id);
        const hasilPatch = await kirim("/api/sessions", "PATCH", {
          session_id: s.id,
          status: "idle",
          mode: metaPatch?.mode ?? s.mode,
          mode_eksplisit: metaPatch?.eksplisit ?? s.eksplisit,
        });
        log(hasilPatch.ok ? "info" : "warn", `PATCH /api/sessions -> ${hasilPatch.status} (${tipe})`, {
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
        try {
          await sinyalKerja(infoSesi(event).id);
        } catch {
          /* abaikan */
        }
        return;
      }
      if (tipe === "session.error" || tipe === "session.deleted") {
        // Tutup sejati: error (butuh perhatian) atau hapus eksplisit.
        const s = infoSesi(event);
        if (!s.id) {
          log("warn", `${tipe} tanpa id sesi, dilewati`);
          return;
        }
        if (!KEY) {
          log("warn", "PDC_API_KEY kosong, lewati lapor (set env User PDC_API_KEY)");
          return;
        }
        const akhir = tipe === "session.error" ? "error" : "selesai";
        const hasilTutup = await kirim("/api/sessions", "PATCH", {
          session_id: s.id,
          status: akhir,
        });
        if (hasilTutup.ok) {
          dikenal.delete(s.id);
          denyutOk.delete(s.id);
          idleTerkirim.delete(s.id);
        }
        log(hasilTutup.ok ? "info" : "warn", `PATCH /api/sessions -> ${hasilTutup.status} (${tipe})`, {
          sessionId: s.id,
        });
      }
    } catch (e) {
      try {
        log("error", `handler gagal di ${tipe}: ${String(e && e.message ? e.message : e)}`);
      } catch {
        /* abaikan */
      }
    }
  };

  // Rekonsiliasi via client SDK v1.18 (daftar sesi server): sesi resume yang
  // NOL event tetap ketahuan. Hanya yang se-direktori/proyek proses ini
  // (tanpa pencocokan = lewati, anti salah atribusi). Sekali jalan tiap
  // denyut; gagal sekali -> diam + warn (coba lagi denyut berikut).
  const rekonsiliasi = async () => {
    if (!KEY || !client) return;
    try {
      const daftar = await client.session.list();
      const arr = Array.isArray(daftar) ? daftar : daftar?.data ?? [];
      if (!Array.isArray(arr)) return;
      for (const it of arr) {
        const id = typeof it?.id === "string" && it.id ? it.id : null;
        if (!id || dikenal.has(id)) continue;
        const cocok =
          (typeof it?.directory === "string" && it.directory === directory) ||
          (typeof it?.projectID === "string" && project && it.projectID === project.id);
        if (!cocok) continue;
        await daftarkan(id, { lewat: "rekonsiliasi", reopen: true });
      }
    } catch (e) {
      log("warn", `rekonsiliasi gagal: ${String((e && e.message) || e).slice(0, 150)}`);
    }
  };

  // v1.18: hooks dikembalikan (bukan subscribe). Event stream + tool hook
  // untuk deteksi edit (cadangan file.edited): tool tulis -> antre path.
  // HANYA path metadata — isi file tak pernah dibaca/dikirim.
  const alatTulis = /edit|write|patch|apply/i;
  const kumpulPath = (o, dalam = 0, lihat = new Set(), out = []) => {
    if (o === null || o === undefined || dalam > 3 || out.length >= 10) return out;
    if (typeof o === "string") {
      if (/[/\\]/.test(o) && o.length < 500 && !/^(https?|data):/i.test(o)) out.push(o);
      return out;
    }
    if (typeof o !== "object" || lihat.has(o)) return out;
    lihat.add(o);
    if (Array.isArray(o)) {
      for (const v of o) kumpulPath(v, dalam + 1, lihat, out);
      return out;
    }
    for (const k of ["filePath", "path", "file", "filename", "relativePath"]) {
      const v = o[k];
      if (typeof v === "string" && v && !/^(https?|data):/i.test(v)) out.push(v);
    }
    for (const v of Object.values(o)) kumpulPath(v, dalam + 1, lihat, out);
    return out;
  };

  return {
    event: async ({ event }) => {
      await tangani(event);
    },
    "tool.execute.after": async (toolInput) => {
      try {
        const t = toolInput ?? {};
        const namaTool = typeof t.tool === "string" ? t.tool : "";
        const sid = typeof t.sessionID === "string" && t.sessionID ? t.sessionID : null;
        const paths = kumpulPath(t.args);
        if (!sid && paths.length === 0) return;
        if (sid && !dikenal.has(sid) && KEY) {
          await daftarkan(sid, { lewat: `tool:${namaTool || "?"}`, reopen: true, mode: MODE });
        }
        if (sid) terakhir = sid;
        if (sid) await sinyalKerja(sid); // tool apa pun = bukti sibuk
        if (paths.length > 0 && alatTulis.test(namaTool)) {
          for (const p of paths) await antrekan(p);
          log("info", `tool tulis -> ${paths.length} path (${namaTool})`, { sessionId: sid });
        }
      } catch {
        /* abaikan */
      }
    },
  };
};
