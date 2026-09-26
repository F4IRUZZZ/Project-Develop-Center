# Project Develop Center — Product Requirements Document

> **Versi:** 1.0  
> **Status:** Draft / Pra-Development  
> **Tujuan:** Webapp personal untuk memantau, mengelola, dan mengarahkan AI agent (OpenCode) yang sedang mengerjakan proyek-proyek di akun GitHub pengguna.

---

## 1. Executive Summary

**Project Develop Center (PDC)** adalah *command center* personal berbasis web untuk pengguna yang mengerjakan banyak proyek menggunakan AI agent — dalam kasus ini **OpenCode** yang terintegrasi dengan akun GitHub. PDC tidak hanya menampilkan "AI lagi ngapain", tapi juga menjadi jembatan komunikasi dua arah antara pengguna, GitHub, dan AI agent melalui protokol **Model Context Protocol (MCP)**.

PDC dirancang agar pengguna bisa:
- Melihat semua aktivitas AI dalam **satu layar**.
- Mendapatkan **notifikasi** ketika tugas AI selesai, gagal, atau stuck.
- Melihat **riwayat lengkap** setiap tugas AI.
- Memberikan perintah tambahan ke AI langsung dari webapp.
- Mengelola banyak repo/proyek GitHub secara terpusat.

---

## 2. Problem Statement

Saat ini, pengguna yang mengerjakan 2–3 proyek sekaligus dengan AI agent mengalami beberapa masalah:

| Masalah | Dampak |
|--------|--------|
| Harus buka banyak tab/repo GitHub satu per satu | Waktu terbuang, fokus terpecah |
| Tidak tahu AI sedang mengerjakan apa secara real-time | Khawatir AI stuck atau salah arah |
| Riwayat kerja AI tersebar di chat atau log lokal | Sulit menelusuri apa yang sudah dikerjakan |
| Tidak ada notifikasi jika AI selesai atau gagal | Harus cek manual berkali-kali |
| Susah memberi instruksi lanjutan tanpa membuka terminal/chat AI | Kurang kontrol |

### Hipotesis
Jika ada satu dashboard yang terintegrasi dengan GitHub + OpenCode via MCP, pengguna akan lebih tenang, lebih produktif, dan lebih mudah mengelola banyak proyek AI sekaligus.

---

## 3. Product Vision

> **"Satu dashboard untuk melihat, mengelola, dan mengarahkan semua AI agent yang sedang mengerjakan proyek GitHub-mu."**

PDC bertujuan menjadi *single source of truth* untuk:
- Status live dari setiap tugas AI.
- Riwayat pengerjaan seluruh proyek.
- Kontrol cepat atas AI agent (start, stop, instruksi lanjutan).
- Insight & laporan ringkas hasil kerja AI.

---

## 4. Target User

| Atribut | Deskripsi |
|--------|-----------|
| **Nama** | Andi (pengguna pribadi) |
| **Profesi** | Indie hacker / developer / builder |
| **Pengalaman** | Terbiasa menggunakan AI agent untuk coding |
| **Jumlah proyek** | 2–3 proyek aktif, berpotensi bertambah |
| **Kebutuhan utama** | Pantau progress AI, lihat riwayat, dapat notifikasi selesai |
| **Pain point** | Buka banyak tab, tidak tahu AI lagi ngapain |
| **Motivasi** | Mau lihat progres, takut AI stuck |

---

## 5. Core User Flows

### 5.1 Onboarding (Pertama Kali Buka)
1. Pengguna membuka PDC.
2. Sistem menampilkan halaman selamat datang + tombol **"Sambungkan Akun GitHub"**.
3. Pengguna mengautentikasi via OAuth GitHub.
4. PDC mengambil daftar repository yang dapat diakses.
5. Pengguna memilih proyek/proyek yang ingin dipantau.
6. PDC menampilkan dashboard utama.

### 5.2 Sehari-hari
1. Pengguna membuka dashboard.
2. Melihat kartu proyek + status AI masing-masing.
3. Jika ada notifikasi baru (selesai/gagal), muncul badge/pesan.
4. Pengguna bisa klik proyek untuk detail, riwayat, atau memberi instruksi.

### 5.3 Memberi Instruksi ke AI
1. Pengguna pilih proyek aktif.
2. Klik tombol **"Kirim Perintah ke AI"**.
3. Tulis instruksi lanjutan.
4. PDC mengirimkan instruksi ke OpenCode via MCP / queue.
5. AI menerima, mulai mengerjakan, status diperbarui secara live.

---

## 6. Feature Requirements

### 6.1 Fitur Wajib (MVP)

| ID | Fitur | Deskripsi | Prioritas |
|----|-------|-----------|-----------|
| F1 | **GitHub OAuth Integration** | Login dan otorisasi via GitHub, ambil daftar repo, token disimpan aman. | Must Have |
| F2 | **Dashboard Multi-Proyek** | Satu layar menampilkan semua proyek GitHub yang dipantau beserta status AI-nya. | Must Have |
| F3 | **Live Activity Feed** | Menampilkan apa yang sedang AI kerjakan secara real-time (commit, PR, file changes, log). | Must Have |
| F4 | **Riwayat Tugas AI** | Daftar lengkap tugas yang pernah dikerjakan AI per proyek dengan filter dan pencarian. | Must Have |
| F5 | **Notifikasi Selesai/Gagal/Stuck** | Push notifikasi atau in-app alert ketika AI menyelesaikan tugas, gagal, atau tidak bergerak lama. | Must Have |
| F6 | **Start/Stop AI Task** | Tombol untuk memulai, menjeda, atau menghentikan tugas AI dari webapp. | Must Have |
| F7 | **Kirim Perintah ke AI dari Web** | Input untuk mengirim instruksi tambahan ke OpenCode tanpa buka terminal. | Must Have |
| F8 | **MCP Bridge** | Komponen teknis yang menjembatani PDC dengan OpenCode menggunakan Model Context Protocol. | Must Have |

### 6.2 Fitur Penting (Rilis Awal)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| F9 | **GitHub Events Integration** | Webhook/GitHub Events untuk mendeteksi commit, PR, issue, dan actions secara otomatis. |
| F10 | **AI Status Indicator** | Indikator visual: idle, working, waiting for approval, error, completed. |
| F11 | **Detail Proyek** | Halaman khusus per proyek: aktivitas terkini, riwayat, branch aktif, PR terbuka. |
| F12 | **Catatan Hasil Kerja AI** | Ringkasan otomatis hasil kerja AI per tugas (file yang diubah, fitur yang dibuat). |
| F13 | **Notifikasi Multi-Channel** | In-app, email, atau webhook ke Discord/Slack opsional. |

### 6.3 Fitur Lanjutan (Roadmap Masa Depan)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| F14 | **AI Performance Analytics** | Statistik produktivitas AI: jumlah tugas, rata-rata waktu pengerjaan, error rate. |
| F15 | **Approval Gate (Merge PR)** | AI membuat PR, lalu menunggu persetujuan pengguna di PDC sebelum melakukan **merge PR** (satu-satunya aksi write yang diizinkan dari webapp). |
| F16 | **Cost Tracking** | Estimasi biaya penggunaan AI/token jika OpenCode menyediakan datanya. |
| F17 | **Template Perintah** | Simpan template perintah sering digunakan (contoh: "buat fitur login", "fix bug di halaman X"). |
| F18 | **Multi-Agent Support** | Mendukung lebih dari satu AI agent atau provider selain OpenCode. |
| F19 | **Mobile Responsive / PWA** | Akses dashboard dari perangkat mobile. |

---

## 7. Technical Architecture

### 7.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Project Develop Center                    │
│                        (Next.js / Webapp)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Dashboard  │  │  Activity    │  │   Command Center │   │
│  │   (Projects) │  │  Feed / Logs │  │  (Send Commands) │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │      PDC Backend API        │
        │   (Node.js / Python / Go)   │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   GitHub     │ │ Database │ │  MCP Server  │
│   API +      │ │(Postgres/│ │   (Bridge)   │
│  Webhooks    │ │  SQLite) │ └──────┬───────┘
└──────────────┘ └──────────┘        │
                                     ▼
                            ┌────────────────┐
                            │   OpenCode     │
                            │  (AI Agent)    │
                            └────────────────┘
```

### 7.2 Komponen Teknis

| Komponen | Rekomendasi | Keterangan |
|----------|-------------|------------|
| **Frontend** | Next.js 14 (React) + Tailwind CSS + shadcn/ui | Next.js sudah berbasis React; Tailwind dipaketkan saat setup. Dashboard modern, responsif, SSR-friendly |
| **Backend** | Next.js API Routes (Serverless) | RESTful API + SSE untuk real-time (Vercel tidak support WebSocket lama) |
| **Database** | PostgreSQL (Neon atau Supabase) | Postgres cloud gratis, mudah connect ke Vercel. Tidak pakai Redis untuk MVP (queue cukup di DB) |
| **Real-time** | Server-Sent Events (SSE) / Pusher / Ably | Update status AI secara live tanpa WebSocket |
| **Auth** | NextAuth.js / OAuth2 GitHub | Autentikasi aman via GitHub |
| **Queue** | Database table (CommandQueue) | Antrian perintah ke AI agent, polling oleh MCP server |
| **MCP Server** | Custom Node.js server (dijalankan di terminal Windows user) | Jembatan PDC ↔ OpenCode, dikonfigurasi di OpenCode settings |
| **Hosting** | Vercel (frontend + API) + Neon/Supabase (database) | Next.js di-host di Vercel, DB di cloud Postgres |

---

## 8. MCP Integration Design

### 8.1 Mengapa MCP?

**Model Context Protocol (MCP)** adalah protokol standar untuk menghubungkan AI agent dengan tools/data eksternal. Berdasarkan setup pengguna, **OpenCode bertindak sebagai MCP Client** dan semua MCP server dijalankan sebagai **proses terminal (Windows)** yang dipanggil OpenCode.

> **📌 Keputusan Desain (Locked):** PDC menggunakan pendekatan **Custom Adapter / Bridge** — kita **membangun sendiri** MCP server (`@pdc/mcp-server`) yang menjadi jembatan antara OpenCode dan PDC Backend. Kita **tidak** mengandalkan dukungan MCP native dari OpenCode, karena:
> - OpenCode mungkin belum punya fitur bawaan untuk connect ke sistem eksternal seperti PDC.
> - Dengan custom bridge, kita punya kontrol penuh atas tools, auth, dan payload data.
> - Bridge berjalan sebagai proses terminal terpisah (konsisten dengan cara user memasang MCP lainnya).
> 
> Artinya: PDC **wajib** menyediakan MCP server custom yang diinstal dan dijalankan di terminal Windows pengguna, lalu dikonfigurasi di OpenCode settings.

PDC akan memanfaatkan MCP dengan cara:
- Membuat **PDC MCP Server** custom (script Node.js) yang dijalankan di terminal Windows pengguna.
- Mengonfigurasi server ini di settings OpenCode agar OpenCode bisa memanggil tools PDC.
- MCP server ini menjadi **jembatan** antara OpenCode dan PDC Backend (via HTTP/HTTPS).

Keuntungan:
- OpenCode bisa membaca status proyek dari PDC.
- OpenCode bisa mengirim update progress ke PDC.
- OpenCode bisa mengambil perintah baru dari PDC.
- PDC bisa memantau apa yang dikerjakan OpenCode secara real-time.

### 8.2 Arsitektur MCP (Model Terminal Windows)

```
┌──────────────────────────────────────────────────────────────┐
│              Terminal Windows (User)                          │
│                                                              │
│   ┌────────────────┐         MCP Protocol (stdio)            │
│   │    OpenCode    │  ◄──────────────────────────────►       │
│   │  (MCP Client)  │          tools + resources              │
│   └────────────────┘                                         │
│            │                                                 │
│            │ spawn process                                    │
│            ▼                                                 │
│   ┌─────────────────────┐                                    │
│   │   PDC MCP Server    │  (Node.js, dijalankan manual/      │
│   │   (custom bridge)  │   otomatis saat OpenCode start)     │
│   └─────────┬───────────┘                                    │
└─────────────┼────────────────────────────────────────────────┘
              │ HTTPS / WebSocket
              ▼
┌─────────────────────────────────────────────────────────────┐
│                     PDC Backend (Vercel)                     │
│                  + Database (Neon/Supabase)                  │
└─────────────────────────────────────────────────────────────┘
```

**Cara kerja:**
1. Pengguna menjalankan OpenCode di terminal Windows.
2. OpenCode (MCP client) otomatis spawn/connect ke PDC MCP Server (proses Node.js).
3. PDC MCP Server connect ke PDC Backend via HTTPS untuk ambil/tulis data.
4. OpenCode memanggil tools PDC untuk melaporkan progress, ambil perintah, dll.

### 8.3 MCP Tools yang Disediakan PDC

| Tool Name | Fungsi |
|-----------|--------|
| `pdc_get_projects` | Ambil daftar proyek yang dipantau |
| `pdc_get_project_status` | Ambil status AI untuk proyek tertentu |
| `pdc_get_task_history` | Ambil riwayat tugas AI per proyek |
| `pdc_get_pending_commands` | Ambil perintah baru dari pengguna yang belum diproses |
| `pdc_report_progress` | AI melaporkan progress ke PDC |
| `pdc_report_completion` | AI melaporkan tugas selesai |
| `pdc_report_error` | AI melaporkan error atau stuck |
| `pdc_get_github_context` | Ambil konteks repo (branch, PR, issue) dari GitHub via PDC |

### 8.4 MCP Resources

| Resource | Deskripsi |
|----------|-----------|
| `pdc://projects/{id}` | Data proyek termasuk repo, branch, status |
| `pdc://projects/{id}/tasks` | Riwayat tugas proyek |
| `pdc://projects/{id}/commands` | Antrian perintah yang menunggu diproses |
| `pdc://projects/{id}/github` | Event GitHub terkait proyek (PR, commit, issue) |

### 8.5 Alur Kerja MCP

1. OpenCode start → spawn PDC MCP Server → MCP Server connect ke PDC Backend.
2. OpenCode memanggil `pdc_get_projects` untuk tahu proyek apa saja yang dipantau.
3. Saat AI mengerjakan tugas, OpenCode memanggil `pdc_report_progress` secara berkala (setiap milestone).
4. Ketika selesai/gagal, OpenCode memanggil `pdc_report_completion` atau `pdc_report_error`.
5. PDC Backend push update ke webapp via SSE.
6. Jika pengguna kirim perintah dari webapp, PDC menyimpannya di `CommandQueue`.
7. OpenCode (via MCP) memanggil `pdc_get_pending_commands` secara berkala untuk mengambil perintah baru.

### 8.6 Setup MCP Server di OpenCode

Pengguna menambahkan konfigurasi di file settings OpenCode (contoh):

```json
{
  "mcpServers": {
    "project-develop-center": {
      "command": "npx",
      "args": ["-y", "@pdc/mcp-server"],
      "env": {
        "PDC_API_URL": "https://pdc.vercel.app",
        "PDC_API_KEY": "user-specific-token"
      }
    }
  }
}
```

Atau dijalankan manual di terminal terpisah:
```bash
npx -y @pdc/mcp-server --api-url https://pdc.vercel.app --api-key YOUR_TOKEN
```

---

## 9. GitHub Integration

### 9.1 OAuth Scopes yang Dibutuhkan

| Scope | Fungsi |
|-------|--------|
| `repo` | Akses repo pribadi (baca + **merge PR** via webapp) |
| `read:user` | Baca profil pengguna |
| `read:org` | Jika ada repo organisasi |
| `admin:repo_hook` | Setup webhook untuk event real-time |

> **Catatan scope write:** Berdasarkan preferensi pengguna, PDC **hanya** boleh melakukan **merge PR** (bukan membuat branch atau commit). Pembuatan branch tetap dilakukan oleh OpenCode secara langsung. Oleh karena itu, permission write dibatasi secara ketat pada endpoint merge PR saja.

### 9.2 Data yang Diambil dari GitHub

- Daftar repository
- Commit terbaru
- Pull requests (terbuka/tertutup)
- Issues
- GitHub Actions workflow runs
- Branches
- File changes

### 9.3 Webhook Events yang Ditangani

| Event | Kegunaan |
|-------|----------|
| `push` | Update aktivitas terbaru |
| `pull_request` | Pantau PR yang dibuat AI |
| `issues` | Pantau issue yang dikerjakan AI |
| `workflow_run` | Pantau status CI/CD |
| `status` | Update status commit |

---

## 10. Data Model

### 10.1 Entitas Utama

```
User
├── id
├── github_id
├── github_username
├── email
├── avatar_url
├── access_token (encrypted)
├── created_at
└── updated_at

Project
├── id
├── user_id
├── github_repo_id
├── repo_name
├── repo_full_name
├── repo_url
├── default_branch
├── description
├── is_active
├── webhook_id
├── created_at
└── updated_at

Task
├── id
├── project_id
├── title
├── description
├── status (queued | running | paused | completed | failed | stuck)
├── ai_agent_id
├── started_at
├── completed_at
├── duration_seconds
├── result_summary
├── error_message
├── git_branch
├── git_commit_sha
├── pull_request_url
├── created_at
└── updated_at

ActivityLog
├── id
├── task_id
├── project_id
├── type (progress | commit | pr | issue | error | info)
├── message
├── metadata (JSON)
├── created_at

CommandQueue
├── id
├── project_id
├── task_id
├── command_text
├── status (pending | processing | completed | failed)
├── created_at
├── processed_at
└── result
```

---

## 11. UI/UX Design

### 11.1 Halaman Utama

**Layout:** Sidebar kiri + Main content.

#### Sidebar
- Logo PDC
- Menu: Dashboard, Proyek, Riwayat, Notifikasi, Pengaturan
- Profil pengguna

#### Main Content
- **Header:** Judul halaman + tombol "Kirim Perintah Baru"
- **Grid Proyek:** Kartu per proyek yang menampilkan:
  - Nama repo + icon GitHub
  - Status AI (badge warna)
  - Tugas terakhir
  - Waktu update terakhir
  - Tombol: Lihat Detail, Kirim Perintah
- **Activity Feed (kanan):** Stream aktivitas terbaru dari semua proyek.

### 11.2 Kartu Proyek

```
┌─────────────────────────────────────┐
│  📁 my-awesome-project    🟢 Working │
│  github.com/andi/my-awesome-project │
├─────────────────────────────────────┤
│  Tugas: Implementasi login page     │
│  Update: 2 menit yang lalu          │
├─────────────────────────────────────┤
│  [Lihat Detail]  [Kirim Perintah]   │
└─────────────────────────────────────┘
```

### 11.3 Status AI

| Status | Warna Badge | Keterangan |
|--------|-------------|------------|
| Idle | Abu-abu | AI sedang tidak mengerjakan apa-apa |
| Working | Biru | AI sedang aktif mengerjakan tugas |
| Waiting for Approval | Kuning | AI menunggu konfirmasi pengguna |
| Completed | Hijau | Tugas selesai |
| Failed | Merah | Tugas gagal |
| Stuck | Oranye | AI tidak bergerak lama |

### 11.4 Detail Proyek

- **Tab Overview:** Info repo, status AI, tugas aktif.
- **Tab Riwayat:** Daftar tugas yang pernah dikerjakan.
- **Tab Aktivitas:** Log event GitHub + log AI.
- **Tab Perintah:** Form kirim perintah ke AI + status queue.

---

## 12. Real-Time Updates

### 12.1 Mekanisme Update

| Sumber | Mekanisme | Update |
|--------|-----------|--------|
| OpenCode | MCP / Webhook | Status AI, progress tugas |
| GitHub Webhook | HTTP POST | Commit, PR, issue, workflow |
| PDC Backend | WebSocket / SSE | Push ke frontend |

### 12.2 Event yang Dipush Real-Time

- `task.started`
- `task.progress`
- `task.completed`
- `task.failed`
- `task.stuck`
- `github.push`
- `github.pull_request`
- `github.workflow_run`

---

## 13. Notification System

> **Keputusan pengguna:** Mengikuti rekomendasi — notifikasi via **In-app + Email**. (Discord/Slack opsional di masa depan.)

### 13.1 Jenis Notifikasi

| Event | Pesan Contoh | Channel |
|-------|--------------|---------|
| Tugas selesai | "AI selesai mengerjakan 'Implementasi login' di my-project" | In-app + Email |
| Tugas gagal | "AI gagal: Build error di my-project" | In-app + Email |
| AI stuck | "AI tidak bergerak >30 menit di my-project" | In-app |
| PR dibuat | "AI membuat PR #12 untuk my-project" | In-app |
| Butuh approval (merge) | "AI butuh persetujuan untuk merge PR #12" | In-app + Email |

### 13.2 Pengaturan Notifikasi

- Aktifkan/nonaktifkan per channel.
- Atur threshold "stuck" (default 30 menit).
- Pilih event yang mau diberitahu.

---

## 14. Security & Privacy

### 14.1 Autentikasi
- OAuth2 GitHub dengan PKCE.
- Session JWT dengan expiry pendek + refresh token.
- Logout invalidate token.

### 14.2 Penyimpanan Token
- GitHub access token dienkripsi di database (misal: AES-256).
- Tidak pernah expose token ke frontend.

### 14.3 Akses Data
- Pengguna hanya bisa melihat repo miliknya sendiri.
- Webhook signature diverifikasi agar hanya menerima event dari GitHub.

### 14.4 Rate Limiting
- Batasi request ke GitHub API.
- Retry dengan exponential backoff.

---

## 15. Non-Functional Requirements

| Aspek | Target |
|-------|--------|
| **Availability** | 99% uptime |
| **Latency** | Dashboard load < 2 detik |
| **Real-time latency** | Update status < 3 detik setelah event |
| **Security** | OAuth, encrypted tokens, webhook verification |
| **Scalability** | Support hingga 10+ proyek tanpa redesign besar |
| **Mobile** | Responsive minimal tablet & smartphone |

---

## 16. Success Metrics

| Metrik | Definisi | Target MVP |
|--------|----------|------------|
| **Time to Insight** | Waktu dari buka app sampai tahu status AI | < 10 detik |
| **Manual Check Reduction** | Berkurangnya frekuensi buka GitHub manual | -50% |
| **Task Response Time** | Waktu dari notifikasi selesai sampai pengguna merespons | < 1 jam |
| **User Retention** | Frekuensi pengguna kembali buka PDC | Harian |
| **Error Rate** | Persentase tugas AI yang gagal tanpa terdeteksi | < 5% |

---

## 17. Development Roadmap

### Fase 1: MVP (4–6 minggu)
- [ ] Setup project & autentikasi GitHub OAuth
- [ ] Integrasi GitHub API (daftar repo, commit, PR)
- [ ] Dashboard multi-proyek sederhana
- [ ] Activity feed dasar
- [ ] MCP server skeleton + koneksi OpenCode
- [ ] Riwayat tugas AI
- [ ] Notifikasi in-app
- [ ] Kirim perintah ke AI dari webapp

### Fase 2: Polish & Real-Time (3–4 minggu)
- [ ] WebSocket / SSE untuk live update
- [ ] GitHub webhook integration
- [ ] Status AI indicator lengkap
- [ ] Notifikasi email
- [ ] Detail proyek + filter riwayat

### Fase 3: Advanced (2–3 bulan ke depan)
- [ ] Approval gate
- [ ] AI performance analytics
- [ ] Template perintah
- [ ] Multi-agent support
- [ ] Mobile PWA
- [ ] Cost tracking (jika tersedia)

---

## 18. Open Questions & Risks

| Pertanyaan | Dampak |
|------------|--------|
| ~~Apakah OpenCode sudah mendukung MCP secara native?~~ | **SUDAH DIJAWAB:** Kita pakai custom bridge, tidak bergantung native. |
| Apakah OpenCode menyediakan API/event untuk progress? | Menentukan seberapa real-time monitoringnya |
| Berapa banyak proyek yang akan dipantau? | Berpengaruh pada arsitektur dan cost |
| ~~Apakah perlu kontrol write ke repo dari webapp?~~ | **SUDAH DIJAWAB:** Hanya merge PR, bukan create branch. |
| Bagaimana format laporan progress dari OpenCode? | Perlu kesepakatan payload JSON |

### Risiko Teknis
- **R1:** OpenCode belum stabil/terdokumentasi untuk integrasi eksternal.
  - *Mitigasi:* **Custom bridge** (`@pdc/mcp-server`) dibuat abstrak sehingga bisa ganti provider jika perlu.
- **R2:** Rate limit GitHub.
  - *Mitigasi:* Cache data, gunakan webhook, optimasi API call.
- **R3:** Webhook lambat atau gagal.
  - *Mitigasi:* Fallback polling + retry queue.
- **R4:** MCP server di terminal Windows crash / tidak jalan.
  - *Mitigasi:* Health check + auto-restart script, status indicator di PDC jika MCP server tidak merespons.

---

## 19. Glossary

| Istilah | Definisi |
|---------|----------|
| **OpenCode** | AI agent yang digunakan pengguna untuk coding |
| **MCP** | Model Context Protocol, protokol standar untuk AI tools |
| **PDC** | Project Develop Center, webapp yang sedang dirancang |
| **Webhook** | HTTP callback dari GitHub ke PDC saat ada event |
| **SSE** | Server-Sent Events, mekanisme push data ke browser |

---

## 20. Appendix

### Appendix A: Contoh Payload MCP

**pdc_report_progress:**
```json
{
  "task_id": "task_123",
  "project_id": "proj_456",
  "status": "working",
  "message": "Sedang mengimplementasikan komponen LoginForm",
  "progress_percent": 45,
  "timestamp": "2024-05-20T10:30:00Z"
}
```

**pdc_report_completion:**
```json
{
  "task_id": "task_123",
  "project_id": "proj_456",
  "status": "completed",
  "message": "Login page berhasil dibuat dan di-push ke branch feature/login",
  "summary": "Menambahkan LoginForm, validasi, dan integrasi API login.",
  "git_branch": "feature/login",
  "git_commit_sha": "abc123",
  "pull_request_url": "https://github.com/andi/project/pull/12",
  "timestamp": "2024-05-20T11:00:00Z"
}
```

### Appendix B: Contoh Flow Kirim Perintah

1. Pengguna di webapp mengetik: *"Tambahkan fitur lupa password di halaman login"*
2. PDC menyimpan perintah ke `CommandQueue` dengan status `pending`.
3. OpenCode (via MCP) mengambil perintah pending.
4. OpenCode memulai tugas baru dan lapor `task.started`.
5. PDC update dashboard secara real-time.

---

*Dokumen ini dapat direvisi seiring perkembangan pemahaman teknis dan kebutuhan pengguna.*
