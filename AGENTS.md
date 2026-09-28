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

## 3b. Konfirmasi selalu modal custom

- `window.confirm()` / `alert()` DILARANG di `app/` dan `components/`.
- Semua konfirmasi/validasi/error aksi lewat `components/ui/ConfirmModal.tsx` (gaya CommandModal).

## 4. Secret

- Hanya di `.env.local` (gitignored). Template di `.env.example` tanpa nilai asli.
- Cek `git status` bebas secret sebelum setiap commit.

## 5. Kontrak bertahap (D1 → D4)

- Tipe `QueuedCommand`/skema PRD §10 stabil; D4 mengganti implementasi tanpa mengubah kontrak.
- Token GitHub hanya server-side (JWT/DB terenkripsi AES-256-GCM), tidak pernah ke frontend.

## 6. Backend bridge = production (opsi B, aktif)

- MCP menunjuk `https://project-develop-center.vercel.app`, bukan localhost.
- Perilaku tools mengikuti deploy terbaru — tunggu Vercel Ready setelah push.
- Butuh internet; `npm run dev` tidak diperlukan untuk operasi.
- Troubleshooting "fetch failed" = cek deployment + env production, bukan port laptop.
- Rollback: restore `opencode.json.backup-before-pdc-prod-20260928` (disimpan) + restart OpenCode.
