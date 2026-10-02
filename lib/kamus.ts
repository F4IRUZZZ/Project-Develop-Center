// Kamus bilingual PDC (gelombang-1: shell). Pilihan persisten di
// localStorage (pola lib/tema.ts). Default Indonesia. Fallback: bila kunci
// hilang di bahasa aktif, pakai teks Indonesia agar tak ada blank.
// Halaman + pesan API menyusul gelombang berikut (tetap Indonesia dulu).
export type Lang = "id" | "en";

export const KUNCI_BAHASA = "pdc-bahasa";

export function bacaBahasa(): Lang {
  if (typeof window === "undefined") return "id";
  return window.localStorage.getItem(KUNCI_BAHASA) === "en" ? "en" : "id";
}

export function simpanBahasa(l: Lang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KUNCI_BAHASA, l);
  } catch {
    // localStorage penuh/diblokir: pilihan sesi ini saja.
  }
}

const KAMUS = {
  "nav.dashboard": { id: "Dashboard", en: "Dashboard" },
  "nav.proyek": { id: "Proyek", en: "Projects" },
  "nav.sesi": { id: "Sesi", en: "Sessions" },
  "nav.status": { id: "Status", en: "Status" },
  "nav.riwayat": { id: "Riwayat", en: "History" },
  "nav.statistik": { id: "Statistik", en: "Statistics" },
  "nav.notifikasi": { id: "Notifikasi", en: "Notifications" },
  "nav.pengaturan": { id: "Pengaturan", en: "Settings" },
  "shell.menu": { id: "Menu", en: "Menu" },
  "shell.muatSesi": { id: "Memuat sesi…", en: "Loading session…" },
  "shell.ciutkan": { id: "Ciutkan sidebar", en: "Collapse sidebar" },
  "shell.bentangkan": { id: "Bentangkan sidebar", en: "Expand sidebar" },
  "user.masukGithub": { id: "Login GitHub", en: "GitHub Login" },
  "user.masukDenganGithub": { id: "Masuk dengan GitHub", en: "Sign in with GitHub" },
  "user.keluar": { id: "Keluar", en: "Log out" },
  "user.tanyaKeluar": { id: "Keluar dari PDC?", en: "Log out of PDC?" },
  "user.pesanKeluar": {
    id: "Sesi GitHub-mu di perangkat ini diakhiri. Antrian dan data di database tetap aman.",
    en: "Your GitHub session on this device will end. Queue and database data stay safe.",
  },
  "user.yaKeluar": { id: "Ya, keluar", en: "Yes, log out" },
  "user.pengaturan": { id: "Pengaturan", en: "Settings" },
  "user.menuPengguna": { id: "Menu pengguna", en: "User menu" },
  "user.terhubung": { id: "Connected", en: "Connected" },
  "search.placeholder": { id: "Cari proyek, tugas, atau log…", en: "Search projects, tasks, or logs…" },
  "search.proyek": { id: "Proyek", en: "Project" },
  "search.tugas": { id: "Tugas", en: "Task" },
  "search.perintah": { id: "Perintah", en: "Command" },
  "modal.batal": { id: "Batal", en: "Cancel" },
  "modal.tutup": { id: "Tutup", en: "Close" },
  "modal.yaLanjut": { id: "Ya, lanjutkan", en: "Yes, continue" },
  "landing.sambut": { id: "Selamat Datang Kembali", en: "Welcome Back" },
  "landing.sub": {
    id: "Agar tetap terhubung, masuk dengan akun GitHub-mu untuk membuka command center AI.",
    en: "To stay connected, sign in with your GitHub account to open the AI command center.",
  },
  "landing.catatan": { id: "Baca repo · merge PR hanya atas persetujuanmu.", en: "Read repos · merge PRs only with your approval." },
  "landing.fitur1j": { id: "Pantau AI live", en: "Monitor AI live" },
  "landing.fitur1d": {
    id: "Status, progress, dan activity semua repo dalam satu layar.",
    en: "Status, progress, and activity of all repos on one screen.",
  },
  "landing.fitur2j": { id: "Kelola antrian", en: "Manage queue" },
  "landing.fitur2d": {
    id: "Kirim perintah, hentikan kerja, lihat riwayat per proyek.",
    en: "Send commands, stop work, view history per project.",
  },
  "landing.fitur3j": { id: "Terhubung GitHub", en: "Connected to GitHub" },
  "landing.fitur3d": { id: "Repo live + jembatan MCP ke OpenCode.", en: "Live repos + MCP bridge to OpenCode." },
  "gate.judul": { id: "Selamat datang di Project Develop Center", en: "Welcome to Project Develop Center" },
  "gate.sub": {
    id: "Sambungkan akun GitHub untuk melihat semua repositori yang kamu pantau dalam satu dashboard.",
    en: "Connect your GitHub account to see all monitored repositories in one dashboard.",
  },
  "gate.cta": { id: "Sambungkan Akun GitHub", en: "Connect GitHub Account" },
  "bahasa.label": { id: "Bahasa", en: "Language" },
} as const;

export type Kunci = keyof typeof KAMUS;

export function t(lang: Lang, kunci: Kunci): string {
  return KAMUS[kunci][lang] ?? KAMUS[kunci].id;
}
