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
  "dash.proyekAktif": { id: "Proyek Aktif", en: "Active Projects" },
  "dash.aiBekerja": { id: "AI Bekerja", en: "AI Working" },
  "dash.tugasSelesai": { id: "Tugas Selesai", en: "Tasks Done" },
  "dash.sedangAktif": { id: "Sedang Aktif", en: "Currently Active" },
  "dash.butuhPerhatian": { id: "Perlu Perhatian", en: "Needs Attention" },
  "dash.kosongSesi": { id: "Tidak ada sesi AI aktif di repo mana pun.", en: "No active AI sessions in any repo." },
  "dash.kosongTenang": {
    id: "Semua tenang — tidak ada AI yang bekerja. Kirim perintah dari menu Proyek.",
    en: "All quiet — no AI working. Send a command from the Projects menu.",
  },
  "dash.gagalRepo": { id: "Gagal memuat repo GitHub — menampilkan data contoh.", en: "Failed to load GitHub repos — showing sample data." },
  "dash.muatRepo": { id: "Memuat repo GitHub…", en: "Loading GitHub repos…" },
  "kartu.aiBekerja": { id: "AI bekerja", en: "AI working" },
  "kartu.aiAktif": { id: "AI aktif", en: "AI active" },
  "kartu.titleBekerja": { id: "AI sedang menyunting kode di repo ini", en: "AI is editing code in this repo" },
  "kartu.titleAktif": { id: "Sesi AI aktif di repo ini", en: "Active AI session in this repo" },
  "kartu.jadikanPublic": { id: "Jadikan public", en: "Make public" },
  "kartu.jadikanPrivate": { id: "Jadikan private", en: "Make private" },
  "kartu.perintah": { id: "Perintah", en: "Command" },
  "kartu.stop": { id: "Stop", en: "Stop" },
  "antre.perintahDiAntre": { id: "perintah dalam antrian", en: "commands in queue" },
  "notif.judul": { id: "Notifikasi", en: "Notifications" },
  "notif.baru": { id: "baru", en: "new" },
  "notif.sub": {
    id: "PR, error, dan penyelesaian AI 24 jam terakhir dari semua proyek.",
    en: "PRs, errors, and AI completions in the last 24 hours across all projects.",
  },
  "notif.tandaiSemua": { id: "Tandai semua dibaca", en: "Mark all as read" },
  "notif.kosongJudul": { id: "Tidak ada notifikasi", en: "No notifications" },
  "notif.kosongSub": {
    id: "Semua tenang. PR baru dan error AI akan muncul di sini.",
    en: "All quiet. New PRs and AI errors will appear here.",
  },
  "notif.tandai": { id: "Tandai dibaca", en: "Mark as read" },
  "notif.muat": { id: "Memuat…", en: "Loading…" },
  "notif.dtkLalu": { id: "dtk lalu", en: "s ago" },
  "notif.mntLalu": { id: "mnt lalu", en: "m ago" },
  "notif.jamLalu": { id: "jam lalu", en: "h ago" },
  "stat.judul": { id: "Statistik GitHub", en: "GitHub Statistics" },
  "stat.subKosong": { id: "Streak, kontribusi, dan bahasa setahun terakhir.", en: "Streak, contributions, and languages from the past year." },
  "stat.subAkun": { id: "Akun {login} · setahun terakhir", en: "Account {login} · past year" },
  "stat.total": { id: "Total Kontribusi", en: "Total Contributions" },
  "stat.kini": { id: "Streak Kini (hari)", en: "Current Streak (days)" },
  "stat.belumMulai": { id: "belum mulai", en: "not started" },
  "stat.terpanjang": { id: "Streak Terpanjang", en: "Longest Streak" },
  "stat.bintang": { id: "Bintang", en: "Stars" },
  "stat.commit": { id: "Commit", en: "Commits" },
  "stat.pr": { id: "Pull Request", en: "Pull Requests" },
  "stat.issue": { id: "Issue", en: "Issues" },
  "stat.bahasa": { id: "Bahasa Teratas", en: "Top Languages" },
  "stat.bahasaKosong": { id: "Belum ada data bahasa.", en: "No language data yet." },
  "stat.gagalJudul": { id: "Gagal memuat statistik", en: "Failed to load statistics" },
  "stat.gagalSub": {
    id: "GitHub tidak menjawab atau token kedaluwarsa. Coba lagi atau login ulang.",
    en: "GitHub did not respond or the token expired. Try again or log in again.",
  },
  "stat.cobaLagi": { id: "Coba lagi", en: "Try again" },
  "stat.muat": { id: "Memuat…", en: "Loading…" },
  "riw.judul": { id: "Riwayat", en: "History" },
  "riw.filterProyek": { id: "Filter proyek", en: "Filter projects" },
  "riw.semuaProyek": { id: "Semua proyek", en: "All projects" },
  "riw.tugas": { id: "Tugas", en: "Tasks" },
  "riw.perintah": { id: "Perintah", en: "Commands" },
  "riw.kolTugas": { id: "Tugas", en: "Task" },
  "riw.kolProyek": { id: "Proyek", en: "Project" },
  "riw.kolStatus": { id: "Status", en: "Status" },
  "riw.kolProgress": { id: "Progress", en: "Progress" },
  "riw.kosongTugas": { id: "Belum ada tugas.", en: "No tasks yet." },
  "riw.kosongPerintah": { id: "Belum ada perintah.", en: "No commands yet." },
} as const;

export type Kunci = keyof typeof KAMUS;

export function t(lang: Lang, kunci: Kunci): string {
  return KAMUS[kunci][lang] ?? KAMUS[kunci].id;
}
