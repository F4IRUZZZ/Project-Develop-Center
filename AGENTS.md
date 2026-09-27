# Aturan Kerja — Project Develop Center

> File ini dibaca tiap sesi. Disiplin keuangan-next: 1 fitur = 1 Issue + 1 PR + uji hijau.

## 1. Dev server: jangan sisakan

- Setelah uji endpoint selesai, WAJIB taskkill proses di port 3000.
- Jangan sisakan background `npm run dev` — tabrakan dengan dev server user (`Another next dev server is already running`).
- Cek: port 3000 harus bebas sebelum lapor selesai.

## 2. Alur GitHub

- 1 fitur = 1 Issue + 1 branch + 1 PR + uji hijau.
- Berhenti di PR. `"oke merge"` = saya yang merge + pull `main` + verifikasi.
- Chore kecil khusus `tools-uji/` boleh langsung ke `main` (tulis alasannya di laporan).

## 3. Verifikasi sebelum PR

- `node tools-uji/verify-*.mjs` (semua suite) + `npx tsc --noEmit` + `npm run build` hijau.
- Skrip uji basi (assert teks/kode yang sudah diganti fase lain) = selaraskan skripnya, bukan dianggap regresi.

## 4. Secret

- Hanya di `.env.local` (gitignored). Template di `.env.example` tanpa nilai asli.
- Cek `git status` bebas secret sebelum setiap commit.

## 5. Kontrak bertahap (D1 → D4)

- Tipe `QueuedCommand`/skema PRD §10 stabil; D4 mengganti implementasi tanpa mengubah kontrak.
- Token GitHub hanya server-side (JWT/DB terenkripsi AES-256-GCM), tidak pernah ke frontend.
