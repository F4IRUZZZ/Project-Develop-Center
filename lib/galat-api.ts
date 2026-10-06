// Pesan error API bilingual via header Accept-Language (gelombang API).
// Default Indonesia (tanpa header = perilaku lama: MCP bridge tanpa header
// tetap dapat ID). Browser mengirim Accept-Language otomatis, jadi tanpa
// ubah client. Kontrak JSON tak berubah ({ error, status }).
// Pesan dinamis dari upstream (GitHub API dkk) diteruskan apa adanya.
export type LangApi = "id" | "en";

type Req = { headers: { get(nama: string): string | null } };

export function langApi(req: Req): LangApi {
  const h = (req.headers.get("accept-language") ?? "").toLowerCase();
  return h.startsWith("en") ? "en" : "id";
}

const ERR = {
  bodyInvalid: { id: "Body JSON tidak valid", en: "Invalid JSON body" },
  dbBelum: { id: "Database belum dikonfigurasi", en: "Database not configured" },
  keyInvalid: { id: "API key tidak valid / dicabut", en: "Invalid / revoked API key" },
  akunBelumLogin: { id: "Akun belum pernah login via web", en: "Account has never logged in via web" },
  belumLogin: { id: "Belum login GitHub", en: "GitHub login required" },
  proyekIdWajib: { id: "project_id wajib", en: "project_id is required" },
  proyekHilang: { id: "Proyek tidak ketemu", en: "Project not found" },
  proyekSyncDulu: { id: "Proyek tidak ketemu, sync dulu", en: "Project not found, sync first" },
  tokenGithub: { id: "Token GitHub tidak tersedia, login ulang", en: "GitHub token unavailable, please log in again" },
  repoFullWajib: { id: "repo_full wajib", en: "repo_full is required" },
  cmdProjTextWajib: { id: "project_id + command_text wajib", en: "project_id + command_text are required" },
  cmdStatusTrio: { id: "status harus processing|completed|failed", en: "status must be processing|completed|failed" },
  cmdStatusQuad: { id: "status harus pending|processing|completed|failed", en: "status must be pending|processing|completed|failed" },
  cmdHilang: { id: "Perintah tidak ketemu", en: "Command not found" },
  actProjMsgWajib: { id: "project_id + message wajib", en: "project_id + message are required" },
  actTipeUnknown: { id: "type tidak dikenal", en: "Unknown type" },
  taskStatusUnknown: { id: "status tidak dikenal", en: "Unknown status" },
  taskProgress: { id: "progress 0-100", en: "progress must be 0-100" },
  taskHilang: { id: "Task tidak ketemu", en: "Task not found" },
  sesiIdWajib: { id: "session_id wajib", en: "session_id is required" },
  sesiHilang: { id: "Sesi tidak ketemu", en: "Session not found" },
  eventsWajib: { id: "events wajib diisi", en: "events must not be empty" },
  keyHilang: { id: "Key tidak ketemu", en: "Key not found" },
  keyAktifDulu: {
    id: "Key masih aktif — cabut dulu sebelum hapus permanen",
    en: "Key is still active — revoke it before permanent deletion",
  },
  provDaftar: { id: "provider harus openai|anthropic|github_pat", en: "provider must be openai|anthropic|github_pat" },
  provMin8: { id: "key minimal 8 karakter", en: "key must be at least 8 characters" },
  visProjPrivWajib: { id: "project_id + private (bool) wajib", en: "project_id + private (bool) are required" },
  pullsNumWajib: { id: "project_id + number (int) wajib", en: "project_id + number (int) are required" },
  notifReadWajib: { id: "activity_id / semua wajib", en: "activity_id / semua is required" },
  hookBesar: { id: "Body terlalu besar", en: "Body too large" },
  hookSig: { id: "Signature tidak valid", en: "Invalid signature" },

  statsGagal: { id: "Gagal mengambil statistik GitHub", en: "Failed to fetch GitHub statistics" },
  statusRepoTakTerdaftar: { id: "Repo PDC tidak terdaftar sebagai proyek.", en: "PDC repo is not registered as a project." },
  statusDeployTakTerbaca: { id: "Deploy production tidak terbaca.", en: "Production deploy unreadable." },
  statusGagalDeploy: { id: "Gagal membaca deploy.", en: "Failed to read deploy." },
  statusGagalDb: { id: "Gagal membaca database.", en: "Failed to read database." },
  tgFormatInvalid: { id: "Format bot token tidak valid", en: "Invalid bot token format" },
  tgChatWajib: { id: "chat_id wajib", en: "chat_id is required" },
  tgHilang: { id: "Tujuan tidak ketemu", en: "Destination not found" },
  tgTokenRusak: { id: "Token rusak, buat ulang tujuan", en: "Token corrupted, recreate the destination" },
  tgGagalKirim: { id: "Gagal kirim ke Telegram", en: "Failed to send to Telegram" },
} as const;

export type KunciGalat = keyof typeof ERR;

export function galat(req: Req, kunci: KunciGalat): string {
  return pesan(kunci, langApi(req));
}

export function pesan(kunci: KunciGalat, lang: LangApi): string {
  const e = ERR[kunci];
  return lang === "en" ? e.en : e.id;
}
