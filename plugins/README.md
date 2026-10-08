# Plugin pdc-presence — sesi AI terlihat di PDC

> Format OpenCode **v1.18** (Issue #154): SATU named export
> `export const PdcPresence = async (input) => ({ event, "tool.execute.after" })`
> (lihat `node_modules/@opencode-ai/plugin/dist/example.js`). Format V2 lama
> (`export default { id, setup }` + `ctx.event.subscribe()`) TIDAK dimuat
> v1.18 — jangan kembalikan pola itu.

Plugin OpenCode yang melaporkan lifecycle sesi (buka/tutup) ke PDC secara
otomatis, tanpa campur tangan LLM. Dengan ini revisi/sesi lanjutan yang
tanpa perintah PDC pun tetap terlacak per repo.

## Cara pasang (per repo, ±2 menit)

1. Salin file ke repo target:
   ```
   <repo>/.opencode/plugins/pdc-presence.js   <- dari plugins/pdc-presence.js repo ini
   ```
2. Pastikan env mesin (bukan di file!):
   - `PDC_API_URL` — default production (`https://project-develop-center.vercel.app`); isi `http://localhost:3000` hanya untuk dev lokal.
   - `PDC_API_KEY` — key mesin (buat di webapp PDC > Pengaturan). **Jangan taruh key di file plugin.**
   - `PDC_MODE` — opsional, `plan` bila sesi itu dipakai untuk rencana saja.
3. Restart total OpenCode (semua instance) agar plugin dimuat.
4. Buka sesi di repo itu → kartu repo di PDC tampil **AI aktif** <10 detik.
5. Diam 30 menit pun tetap menyala (denyut interval tiap 60 dtk); tutup OpenCode → padam ≤~4 menit.

## Sesi lanjutan (Continue/resume)

- Resume tak memancarkan `session.created` — plugin mendaftarkan malas: event
  ber-ID apa pun (`status/idle/updated/file.edited/message.*`) dari sesi tak
  dikenal → POST `{reopen: true}` + catat ke denyut. Server membuka kembali
  baris final + menulis feed "Sesi AI dilanjutkan". Denyut biasa tanpa flag
  tak pernah membuka ulang (anti-reopen-palsu).
- ID sesi diekstrak anti-rapuh: field umum dulu, lalu deep-scan rekursif
  cari string `^ses_[A-Za-z0-9]+` (format ID sesi OpenCode, stabil lintas versi).
- Rekonsiliasi via `input.client.session.list()` (v1.18 punya) — sesi resume
  nol-event tetap ketahuan bila se-direktori/proyek; tanpa cocok = dilewati.
- Deteksi edit ganda: `file.edited` + `tool.execute.after` (edit/write/patch)
  sebagai cadangan. Hanya path metadata — isi file tak pernah dibaca/dikirim.
- Batas: resume yang nol event selamanya + bukan di daftar tak terlihat —
  tidak ada yang bisa diamati.

## Ringkasan kerja (opsi B: prosa teredaksi, semua repo)

- `message.updated` (info.id→role) + `message.part.updated` (TextPart) →
  teks asisten diredaksi (buang blok kode + cap 1000 + ellipsis) → dikirim per-giliran
  saat idle/status via kind `ringkasan`. Fakta skema: message.updated tanpa
  teks; part tanpa role (peran dari peta); reasoning/synthetic/teks-user
  ditolak.
- Server meredaksi lapis kedua + simpan latest-only (`ringkasan_terakhir`,
  tanpa baris event/feed). Tampil di tab Sesi + tooltip chip kartu.
- Batas: regex bukan kedap — kolom ini retensi DB sendiri, jangan
  share/invoice isinya. Delta part tanpa role diabaikan (risiko potongan).

## Jejak aktivitas (opsi A: metadata saja)

- `file.edited` → path diantre, dikirim batch 30 dtk ke `POST /api/sessions/activity`.
- Tiap denyut 60 dtk: cek `git rev-parse HEAD` → komit baru = milestone (sha + shortstat).
- **Isi file tak pernah dibaca/dikirim** — hanya path, angka stat, sha. Pengecualian satu-satunya: `.git/config` dibaca via `fs` untuk resolve repo (pengganti spawn git yang flaky) — itu metadata repo, bukan isi kerja. Kontrak privasi ini dikunci suite `verify-p`.
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

## Diagnosis: log lokal per proses (#219)

Setiap proses menulis `pdc-presence-<repo>.log` (JSONL) di direktori temp OS
(`%TEMP%` Windows / `/tmp`), selalu-on sejak v2026.10.16. Isi: tiap event
lifecycle, tiap tool (nama + sid + fallback?), tiap kirim (hasil HTTP),
tiap lewati + alasannya (`tanpa-sid-tanpa-path`, `throttle`, `tanpa-key`).
TANPA secret, TANPA isi pesan/file. Rotasi 200KB (ekor 100KB).

Cara baca (PowerShell):

```powershell
Get-Content $env:TEMP\pdc-presence-NAMA-REPO.log -Tail 30
```

Peta cepat:

| Baris log | Arti |
|---|---|
| tak ada file log | plugin tak termuat di proses itu |
| `proses-mulai` tanpa baris berikut | tak ada event/tool masuk ke hook |
| `tool` + `fallback: true` | atribusi ke sesi terakhir (normal bila sid absen) |
| `tool-lewat` `tanpa-sid-tanpa-path` | tool tanpa sid dan tanpa path — dilewati |
| `kerja` `hasil: 401` | key ditolak → putar key + restart total |
| `kerja` `hasil: tanpa-key` | env proses tak punya key |
| `idle-lewat` `throttle` | normal (anti-flapping 15 dtk) |
| `denyut` gagal | jaringan/API bermasalah |

`PDC_DEBUG=1` = verbose (semua jenis event + kunci payload).
