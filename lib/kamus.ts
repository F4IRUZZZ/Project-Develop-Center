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
  "pro.hasilCari": { id: "Hasil Pencarian ({n})", en: "Search Results ({n})" },
  "pro.judulProyek": { id: "Proyek ({n})", en: "Projects ({n})" },
  "pro.kosongCari": { id: 'Tidak ada proyek yang cocok dengan "{q}".', en: 'No projects matching "{q}".' },
  "pro.kosongUmum": { id: "Belum ada proyek.", en: "No projects yet." },
  "pro.sync": { id: "Sync GitHub", en: "Sync GitHub" },
  "pro.muatProyek": { id: "Memuat proyek…", en: "Loading project…" },
  "pro.kembaliProyek": { id: "← Kembali ke Proyek", en: "← Back to Projects" },
  "pro.tugasLabel": { id: "Tugas: ", en: "Task: " },
  "pro.tidakAdaTask": { id: "Tidak ada task aktif. Kirim perintah untuk memulai.", en: "No active tasks. Send a command to start." },
  "pro.tabAktivitas": { id: "Aktivitas", en: "Activity" },
  "pro.tabRingkasan": { id: "Ringkasan", en: "Summary" },
  "pro.kosongFeed": { id: "Belum ada aktivitas.", en: "No activity yet." },
  "pro.kosongSesiPlugin": {
    id: "Belum ada sesi tercatat. Pasang plugin pdc-presence di repo ini agar sesi OpenCode terlacak otomatis.",
    en: "No sessions recorded. Install the pdc-presence plugin in this repo to track OpenCode sessions automatically.",
  },
  "pro.kosongSesi": { id: "Belum ada sesi tercatat.", en: "No sessions recorded." },
  "pro.kosongRingkasan": {
    id: "Belum ada ringkasan. Ringkasan ditulis di akhir tiap giliran jawaban agent.",
    en: "No summaries yet. Summaries are written at the end of each agent turn.",
  },
  "pro.tanpaRingkasan": { id: "tanpa ringkasan", en: "no summary" },
  "pro.terakhirLabel": { id: "Terakhir: ", en: "Latest: " },
  "pro.komitLabel": { id: "komit ", en: "commit " },
  "pro.mulaiLabel": { id: "mulai ", en: "started " },
  "pro.stopJudul": { id: "Hentikan kerja AI?", en: "Stop AI work?" },
  "pro.stopPesan": {
    id: "Kerja AI di {repo} dihentikan. Perintah pending dibatalkan dan task ditandai gagal.",
    en: "AI work in {repo} will be stopped. Pending commands are cancelled and tasks marked failed.",
  },
  "pro.stopPesanDetail": {
    id: "Kerja AI di {repo} dihentikan. Perintah pending dibatalkan.",
    en: "AI work in {repo} will be stopped. Pending commands are cancelled.",
  },
  "pro.stopYa": { id: "Ya, hentikan", en: "Yes, stop it" },
  "pro.visJudul": { id: "Ubah visibilitas repo?", en: "Change repo visibility?" },
  "pro.visPesanPublic": {
    id: "{repo} jadi PUBLIC: semua orang bisa lihat + Pages aktif.",
    en: "{repo} becomes PUBLIC: everyone can see it + Pages active.",
  },
  "pro.visPesanPrivate": {
    id: "{repo} jadi PRIVATE: hanya kamu + kolaborator yang bisa lihat.",
    en: "{repo} becomes PRIVATE: only you + collaborators can see it.",
  },
  "pro.visYa": { id: "Ya, ubah", en: "Yes, change it" },
  "pro.hapusJudul": { id: "Hapus sesi ini?", en: "Delete this session?" },
  "pro.hapusPesanErr": { id: "Gagal menghapus (server menolak). Coba lagi.", en: "Delete failed (server refused). Try again." },
  "pro.hapusPesan": {
    id: "Sesi {id}… dihapus dari daftar (jejak file ikut terhapus; feed riwayat tetap).",
    en: "Session {id}… removed from the list (file traces deleted too; history feed kept).",
  },
  "pro.hapusYa": { id: "Ya, hapus", en: "Yes, delete it" },
  "sesi.judul": { id: "Sesi AI", en: "AI Sessions" },
  "sesi.sub": { id: "Semua sesi OpenCode lintas repo. Baris feed riwayat tidak ikut terhapus.", en: "All OpenCode sessions across repos. History feed rows are kept." },
  "sesi.filterAktif": { id: "Aktif ({n})", en: "Active ({n})" },
  "sesi.filterSemua": { id: "Semua ({n})", en: "All ({n})" },
  "sesi.kosongAktif": { id: "Tidak ada sesi AI aktif di repo mana pun.", en: "No active AI sessions in any repo." },
  "sesi.kosongSemua": { id: "Belum ada sesi tercatat.", en: "No sessions recorded." },
  "sesi.tanpaProyek": { id: "tanpa proyek", en: "no project" },
  "sesi.selesai": { id: "Selesai", en: "Done" },
  "sesi.nonaktif": { id: "Nonaktif", en: "Inactive" },
  "sesi.aktif": { id: "Aktif", en: "Active" },
  "sesi.bekerja": { id: "Bekerja", en: "Working" },
  "sesi.siagaHening": { id: "Siaga · hening {n} mnt", en: "Idle · quiet {n} min" },
  "sesi.hapusSesi": { id: "Hapus sesi", en: "Delete session" },
  "status.judul": { id: "Status", en: "Status" },
  "status.sub": {
    id: "Observasi read-only: deploy, bridge, database, plugin. Tanpa tombol aksi.",
    en: "Read-only observability: deploy, bridge, database, plugins. No action buttons.",
  },
  "status.gagal": { id: "Gagal memuat status. Coba lagi.", en: "Failed to load status. Try again." },
  "status.deployJudul": { id: "Deploy Production", en: "Production Deploy" },
  "status.deployKosong": { id: "Tidak tersedia.", en: "Unavailable." },
  "status.bridgeJudul": { id: "Bridge MCP", en: "MCP Bridge" },
  "status.hidup": { id: "Hidup", en: "Up" },
  "status.mati": { id: "Mati", en: "Down" },
  "status.dbJudul": { id: "Database", en: "Database" },
  "status.pluginJudul": { id: "Plugin per Repo (terkini {v})", en: "Per-Repo Plugins (latest {v})" },
  "status.pluginKosong": { id: "Belum ada proyek terdaftar.", en: "No registered projects." },
  "status.tanpaVersi": { id: "tanpa versi", en: "no version" },
  "status.belumPernah": { id: "Belum pernah", en: "Never" },
  "status.basi": { id: "Basi", en: "Stale" },
  "status.terkini": { id: "Terkini", en: "Current" },
  "status.belumPernahWaktu": { id: "belum pernah", en: "never" },
} as const;

export type Kunci = keyof typeof KAMUS;

export function t(lang: Lang, kunci: Kunci): string {
  return KAMUS[kunci][lang] ?? KAMUS[kunci].id;
}
