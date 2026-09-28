# Plugin pdc-presence — sesi AI terlihat di PDC

Plugin OpenCode yang melaporkan lifecycle sesi (buka/tutup) ke PDC secara
otomatis, tanpa campur tangan LLM. Dengan ini revisi/sesi lanjutan yang
tanpa perintah PDC pun tetap terlacak per repo.

## Cara pasang (per repo, ±2 menit)

1. Salin file ke repo target:
   ```
   <repo>/.opencode/plugins/pdc-presence.js   <- dari plugins/pdc-presence.js repo ini
   ```
2. Pastikan env mesin (bukan di file!):
   - `PDC_API_URL` — default `http://localhost:3000`; isi URL webapp PDC (mis. production) bila sesi tidak di mesin dev.
   - `PDC_API_KEY` — key mesin (buat di webapp PDC > Pengaturan). **Jangan taruh key di file plugin.**
   - `PDC_MODE` — opsional, `plan` bila sesi itu dipakai untuk rencana saja.
3. Restart total OpenCode (semua instance) agar plugin dimuat.
4. Buka sesi di repo itu → kartu repo di PDC tampil **AI aktif** <10 detik.
5. Tutup/biarkan idle → indikator padam (atau padam sendiri bila basi >15 menit).

## Cara kerja & batas

- `session.created` → `POST /api/sessions` (buka/segarkan).
- `session.idle` / `session.error` → `PATCH /api/sessions` (tutup).
- Semua kegagalan diabaikan diam-diam: presence tak boleh mengganggu sesi.
- Blind spot: resume (`--continue`) di sebagian versi OpenCode tidak memicu
  event — PDC menutupnya via timeout basi 15 menit (tampilan).
- Tanpa key (`PDC_API_KEY` kosong) plugin nonaktif sendiri.
