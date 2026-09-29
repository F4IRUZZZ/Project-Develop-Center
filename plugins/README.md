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
5. Diam 30 menit pun tetap menyala (denyut interval tiap 60 dtk); tutup OpenCode → padam ≤~4 menit.

## Jejak aktivitas (opsi A: metadata saja)

- `file.edited` → path diantre, dikirim batch 30 dtk ke `POST /api/sessions/activity`.
- Tiap denyut 60 dtk: cek `git rev-parse HEAD` → komit baru = milestone (sha + shortstat).
- **Isi file tak pernah dibaca/dikirim** — hanya path, angka stat, sha. Kontrak privasi ini dikunci suite `verify-p`.
- Tab Sesi menampilkan: badge `Bekerja` (<2 mnt sejak sunting) / `Siaga` (hening >5 mnt) / `Nonaktif`, file terakhir, komit terakhir.

## Cara kerja & batas

- `session.created` → `POST /api/sessions` (buka) + sesi didaftarkan ke denyut.
- Denyut interval 60 dtk → `POST` ulang tiap sesi dikenal (mati sendiri saat proses tutup).
- `session.idle` / `session.status` → `PATCH idle` (heartbeat, bukan tutup).
- `session.deleted` → `PATCH selesai`; `session.error` → `PATCH error` (keduanya final).
- Semua kegagalan diabaikan diam-diam: presence tak boleh mengganggu sesi.
- Batas jujur: close/kill/crash tak memicu event apa pun — PDC mendeteksinya
  via timeout 3 menit (tampilan), jadi "hantu aktif" 0–4 menit tak terhapus total.
- Tanpa key (`PDC_API_KEY` kosong) plugin nonaktif sendiri.
