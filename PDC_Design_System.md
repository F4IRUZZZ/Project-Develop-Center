# Project Develop Center — Design System

> Sistem desain untuk PDC. Prinsip utama: **Modern, Simple, Clean**.
> Ditujukan untuk developer/tools dashboard — fokus pada kejelasan informasi, tidak pada dekorasi berlebih.

---

## 1. Design Principles

| Prinsip | Penerapan |
|---------|-----------|
| **Clarity First** | Informasi status AI harus langsung terbaca dalam 1 detik (warna + label). |
| **Calm Dark Surface** | Background gelap netral, bukan hitam pekat — nyaman dipandang lama. |
| **Single Accent** | Satu warna aksen dominan (indigo), sisanya netral/semantik. |
| **Consistent Spacing** | Grid 4px-based, radius seragam, tidak ada nilai acak. |
| **Subtle Depth** | Shadow halus + border 1px untuk memisahkan layer, bukan warna kontras keras. |
| **Mono for Data** | Angka, log, hash, dan kode pakai font monospace. |

---

## 2. Color System

### 2.1 Theme: "Nebula" (Dark-first, recommended)

Background gelap dengan sedikit tint navy, aksen indigo modern.

| Token | Hex | Kegunaan |
|-------|-----|----------|
| `--bg-base` | `#0A0A0F` | Background aplikasi utama |
| `--bg-surface` | `#14141B` | Card, panel, sidebar |
| `--bg-elevated` | `#1C1C26` | Dropdown, modal, hover state |
| `--border` | `#262633` | Separator, card border |
| `--border-strong` | `#34344A` | Focus ring, active border |
| `--text-primary` | `#EDEDF0` | Teks utama |
| `--text-secondary` | `#A0A0B0` | Teks sub-label |
| `--text-muted` | `#6B6B7B` | Placeholder, metadata |

### 2.2 Accent & Semantic

| Token | Hex | Kegunaan |
|-------|-----|----------|
| `--accent` | `#6366F1` | Primary action, brand, link aktif |
| `--accent-hover` | `#5457E5` | Hover primary button |
| `--accent-soft` | `#6366F11A` | Background badge/icon accent (10% opacity) |
| `--success` | `#22C55E` | Completed, healthy |
| `--warning` | `#F59E0B` | Waiting approval, stuck |
| `--danger` | `#EF4444` | Failed, error |
| `--info` | `#3B82F6` | Working, progress, info |

### 2.3 Status AI (semantic mapping)

| Status | Warna | Makna |
|--------|-------|-------|
| Idle | `--text-muted` (abu) | Tidak ada tugas aktif |
| Working | `--info` (biru) | AI sedang bekerja |
| Waiting Approval | `--warning` (amber) | Menunggu merge PR |
| Completed / Merged | `--success` (hijau) | Selesai |
| Failed | `--danger` (merah) | Error |
| Stuck | `--warning` (amber, berkedip) | Tidak bergerak > threshold |

> **Alternatif ringan:** Jika ingin light mode, gunakan `--bg-base: #FAFAFB`, `--bg-surface: #FFFFFF`, `--text-primary: #18181B`, tetap dengan aksen indigo.

---

## 3. Typography

### 3.1 Font Families

| Peran | Font | Alasan |
|-------|------|--------|
| **UI / Heading / Body** | **Inter** | Sans-serif modern, clean, sangat readable di layar. Gratis (Google Fonts / Fontsource). |
| **Data / Code / Log** | **JetBrains Mono** | Monospace dengan karakter jelas untuk hash, angka, log AI. |

```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SF Mono", monospace;
```

### 3.2 Type Scale

| Name | Size | Weight | Kegunaan |
|------|------|--------|----------|
| Display | 24px / 1.3 | 700 | Judul halaman |
| Title | 18px / 1.4 | 600 | Section, card header |
| Body | 14px / 1.5 | 400 | Teks konten utama |
| Small | 12px / 1.4 | 400 | Metadata, caption |
| Micro | 11px / 1.3 | 500 | Badge, tag |

> Dashboard menggunakan **base 14px** (compact) bukan 16px, agar lebih banyak info muat di layar tanpa scroll berlebih.

---

## 4. Spacing & Radius

### 4.1 Spacing Scale (4px-based)
`4, 8, 12, 16, 20, 24, 32, 40, 48`

Contoh: padding card = `16px 20px`, gap antar card = `16px`, margin section = `24px`.

### 4.2 Radius
| Token | Value | Kegunaan |
|-------|-------|----------|
| `--radius-sm` | 6px | Badge, chip, input kecil |
| `--radius-md` | 10px | Button, input |
| `--radius-lg` | 14px | Card, panel |
| `--radius-xl` | 20px | Modal, large surface |

### 4.3 Elevation (Shadow)
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.35);
--shadow-lg: 0 12px 32px rgba(0,0,0,0.45);
```
Gunakan shadow halus; jangan terlalu dalam di dark theme.

---

## 5. Layout

### 5.1 App Shell
```
┌─────────┬─────────────────────────────────────┐
│         │  Topbar: search | notif | avatar    │
│ Sidebar ├─────────────────────────────────────┤
│ (slim)  │                                     │
│         │   Main: Project Grid (2-3 col)       │
│  icon   │                                     │
│  +      ├─────────────────────────────────────┤
│  label  │   Right Panel: Activity Feed         │
└─────────┴─────────────────────────────────────┘
```
- **Sidebar**: lebar 220px (collapsible ke 64px icon-only).
- **Topbar**: tinggi 56px, sticky.
- **Konten**: max-width 1440px, centered, padding 24px.
- **Grid proyek**: `repeat(auto-fill, minmax(300px, 1fr))`.

### 5.2 Why this layout
- Satu layar cukup untuk melihat semua proyek + aktivitas terkini (sesuai kebutuhan user).
- Activity feed di panel kanan agar tidak mengganggu grid utama.
- Sidebar slim menjaga fokus di konten.

---

## 6. Components

### 6.1 Project Card (key component)
```
┌──────────────────────────────────────────┐
│ ● repo-icon   my-awesome-project    [badge]│   <- header: icon + name + status badge
│ ──────────────────────────────────────── │
│ Task: Implementasi login page             │   <- current task (body)
│ ▓▓▓▓▓▓▓░░░ 45%                            │   <- thin progress bar
│ 2m ago · feature/login                    │   <- meta (mono, muted)
│ [Detail] [Command] [Stop]                  │   <- actions (subtle buttons)
└──────────────────────────────────────────┘
```
- Border 1px `--border`, hover → `--border-strong` + shadow-md.
- Status sebagai **dot berwarna + label** (bukan badge besar), lebih clean.
- Progress bar tipis (4px) di bawah task.

### 6.2 Status Badge
- Dot 8px + text 11px. Tidak pakai background penuh, cukup `accent-soft` (10% opacity) agar tenang.

### 6.3 Button
| Variant | Style |
|---------|-------|
| Primary | bg `--accent`, text white, radius-md |
| Secondary | bg transparent, border `--border`, text `--text-secondary` |
| Danger | border `--danger`, text `--danger`, bg `--danger` 10% |
| Ghost | text only, hover bg `--bg-elevated` |

### 6.4 Modal
- Overlay `rgba(0,0,0,0.6)` + blur 4px (backdrop-filter).
- Panel radius-xl, bg `--bg-surface`, shadow-lg, max-width 520px.
- Header dengan title + close (X) di kanan.

### 6.5 Empty State
- Centered, icon besar (abu), title + description + CTA button.
- Contoh: "Belum ada proyek" → tombol "Tambah Proyek".

### 6.6 Activity Feed Item
```
● [icon type] message ............ time
   project-name (mono, muted)
```
- Border-left 2px warna semantic sesuai tipe event.
- Hover → bg `--bg-elevated`.

---

## 7. Iconography
- Gunakan **Lucide** (line icons, konsisten, modern) atau Heroicons.
- Stroke 1.5px, ukuran 16–20px.
- Warna mengikuti `--text-secondary` kecuali status.

---

## 8. Dark/Light Mode
- Default **Dark (Nebula)**.
- Toggle ke Light menggunakan token yang sama (swap nilai variable).
- Simpan preferensi di `localStorage`.

---

## 9. Do & Don't

**Do:**
- ✅ Gunakan satu aksen (indigo), sisanya netral.
- ✅ Spasi konsisten (scale 4px).
- ✅ Status pakai dot + label, bukan badge besar berwarna penuh.
- ✅ Font mono untuk data/hash/log.

**Don't:**
- ❌ Jangan pakai >2 warna aksen.
- ❌ Jangan pakai shadow terlalu dalam di dark mode.
- ❌ Jangan padatkan terlalu banyak info tanpa whitespace.
- ❌ Jangan gunakan gradient menyala (neon) untuk elemen besar.

---

*Design system ini menjadi acuan saat membangun UI PDC. Revisi warna/font cukup di sini, tidak perlu ubah PRD.*
