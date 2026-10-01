# Progress — Project Develop Center (PDC)

> Aturan: 1 fitur = 1 Issue + 1 PR + uji hijau (tsc + build + tools-uji).
> Stack: Next 16 + Tailwind v4 + shadcn + lucide-react + TS (ikuti keuangan-next).
> Acuan: `Project_Develop_Center_PRD.md` + `PDC_Design_System.md` + `PDC_Wireframe_v3.html`.
> Urutan disepakati: C0 scaffold → C1 shell → C2 grid → C3 feed+modal → C4 polish. Backend/MCP ditunda.

## Legenda

- [X] selesai + teruji + termerge · [ ] belum · [~] jalan sekarang

## C. Fondasi frontend dummy

- [X] C0: scaffold Next 16 + Tailwind v4 + shadcn + TS + build hijau + PROGRESS/bukti/tools-uji
- [X] C1: shell + token Nebula (Sidebar 232px + Topbar 58px, dark default)
- [X] C2: dashboard grid (stats 3 + 3 kartu proyek sesuai wireframe)
- [X] C3: activity feed + command modal
- [X] C4: polish responsif + toggle tema (localStorage)

## D. Backend & integrasi (D1 dummy, D2–D4 nyata bertahap)

- [X] D1: command queue mock (localStorage, lifecycle simulasi, kontrak PRD §10)
- [X] D2: GitHub OAuth + daftar repo live (token JWT server-side, max 10 repo)
- [X] D3: Neon queue (users + command_queue, token AES-256-GCM, API, polling 5s)
- [X] D3b: tabel projects/tasks/activity_log + API + UI baca DB (status AI dari DB)
- [X] D4: MCP bridge working loop (API key + 4 tools stdio, OpenCode bisa ambil/lapor)
- [X] D4b: 4 tools baca MCP (projects/status/history/github_context)
- [X] D0: deploy Vercel production (login + kirim + loop AI hijau di URL live)

## E. Menu penuh (pasca-MVP)

- [X] E1: halaman Proyek (tabel + Sync) + Riwayat (tab Tugas + Perintah)
- [X] E23: notifikasi turunan activity + restruktur monitor-vs-kelola (Proyek kelola, Dashboard monitor)

## G. Input pengguna (pasca-D0)

- [X] F-batch: visibility repo + login landing + logout confirm + ConfirmModal (mode dicabut total)
- [X] G: notif dibaca + bersihkan (bug) + scroll + refresh
- [X] H: approval merge PR dari webapp (tombol PR + PullModal + confirm, merge commit)
- [X] J: stats asli + stop kondisional + halaman detail proyek
- [X] F9: webhook GitHub + stuck display (PR)
- [X] K: Stop di detail hanya bila ada yang jalan
- [X] L: navigasi HP bottom tab bar
- [X] N: topbar hidup + scroll notif + search live + pengaturan lengkap
- [X] O: login ala referensi + logo Hexagon-P + favicon + avatar responsif (PR)

## H. Riwayat Perubahan

| Tanggal    | Perubahan                                                                                       | Uji                                                               |
| ---------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 2026-09-27 | O login referensi + logo + favicon merged (+octocat, tema Sistem, a11y)                         | O-CEK ALL-OK + 18 suite hijau + tsc + build                       |
| 2026-09-28 | Audit-1 remediasi merged (provider-keys + hapus akun + M1/M3/M5)                                | AUDIT1-CEK ALL-OK + 20 suite hijau + tsc + build + 401-gate       |
| 2026-09-28 | Audit-2 ketahanan merged (eslint nol + LIMIT + timeout + dedup)                                 | AUDIT2-CEK ALL-OK + 21 suite hijau + tsc + build + replay 1 baris |
| 2026-09-28 | Audit-3 ringan merged (tombol mati + skeleton + deps + image + tema + dead code)                | AUDIT3-CEK ALL-OK + 22 suite hijau + tsc + eslint nol + build     |
| 2026-09-28 | Presence sesi AI (PR, agent_sessions + API + indikator + plugin)                                | PRESENCE-CEK ALL-OK + tsc + build + siklus live + bersih          |
| 2026-09-28 | Bridge pindah ke production (opsi B, backup disimpan)                                           | tools OK tanpa dev lokal                                          |
| 2026-09-28 | Presence sesi AI merged (indikator + tab Sesi, spawnSync diganti direct-fetch)                  | PRESENCE-CEK ALL-OK + 23 suite hijau + tsc + build + loop live    |
| 2026-09-28 | Presence realtime (#47/#48): denyut 60 dtk + timeout 3 mnt + tutup via deleted + label Nonaktif | 24/24 suite + tsc + build + live (denyut 201, deleted→selesai)   |
| 2026-09-29 | Aktivitas sesi (#49/#50): jejak metadata + badge bekerja/siaga/nonaktif + milestone komit       | 25/25 suite + tsc + build + live time-travel                      |
| 2026-09-29 | Sesi di dashboard+feed (#51/#52): chip AI bekerja/siaga + feed buka/komit/tutup                 | P-CEK 17 cek + tsc + build + live feed                            |
| 2026-09-29 | Polish aktivitas (#53/#54): path relatif + label Selesai                                        | P-CEK + tsc + build                                               |
| 2026-09-29 | Sesi lanjutan (#55/#56): lazy-register + reopen + rekonsiliasi session.list                     | LANJUT-OK + 25/25 suite + tsc + build                             |
| 2026-09-29 | Visibilitas sesi (#57/#58): seksi Sedang Aktif + feed anti-dupe + tanpa klaim mode              | DUPE-OK + 25/25 suite + tsc + build                               |
| 2026-09-29 | Stat AI Bekerja (#59/#60): union sesi-bekerja + task-jalan                                      | STAT-OK + 25/25 suite + tsc + build                               |
| 2026-09-29 | Opsi B ringkasan kerja (#61/#62): per-giliran teredaksi, semua repo                             | RINGKAS-OK + 25/25 suite + tsc + build                            |
| 2026-09-29 | Tab Ringkasan (#63/#64): akses utama ringkasan sejajar Sesi (merge langsung, instruksi khusus) | P-CEK + tsc + build + 24 suite |
| 2026-09-30 | Cap ringkasan 1000 + ellipsis (#69/#70) | CAP-OK + 25/25 suite + tsc + build |
| 2026-10-01 | Halaman Status (#71/#72): deploy + bridge + DB + plugin per repo | STATUS-OK + 25/25 suite + tsc + build |
| 2026-09-30 | Rapi UI + delete + Sesi global (#67/#68): scroll-tipis tab, DELETE API, halaman /sesi, code-review bersih | HAPUS-OK + 25/25 suite + tsc + build |
| 2026-09-28 | Audit-3 ringan (PR, tombol mati + skeleton + deps + image + tema + dead code)                   | AUDIT3-CEK ALL-OK + 22 suite hijau + tsc + eslint nol + build     |
| 2026-09-28 | Audit-2 ketahanan (PR, eslint nol + LIMIT + timeout + dedup)                                    | AUDIT2-CEK ALL-OK + 21 suite hijau + tsc + build + replay 1 baris |
| 2026-09-28 | Audit-1 remediasi (PR, provider-keys + hapus akun + M1/M3/M5)                                   | AUDIT1-CEK ALL-OK + 19 suite hijau + tsc + build + 401-gate       |
| 2026-09-27 | D0 re-verifikasi production (deploy PR#35 + fitur baru + perintah)                              | providers OK + visual baru + perintah masuk                       |
| 2026-09-27 | L bottom nav HP (PR, 5 item + badge bersama)                                                    | L-CEK ALL-OK + 14 suite hijau + tsc + build                       |
| 2026-09-27 | K stop detail kondisional merged                                                                | J-CEK ALL-OK + tsc + build                                        |
| 2026-09-27 | F9 webhook merged + uji live hijau (ping/push/PR)                                               | F9-CEK ALL-OK + tsc + build + live manual penuh                   |
| 2026-09-27 | J stats+stop+detail (PR, angka DB + stop jalan + /proyek/[id])                                  | J-CEK ALL-OK + 14 suite hijau + tsc + build + stats 401-gate      |
| 2026-09-27 | H approval merge merged (tombol PR + tutup task + Stop waiting)                                 | H-CEK ALL-OK + 13 suite hijau + tsc + build + merge live          |
| 2026-09-27 | G notif+refresh (PR, reads + DELETE fix + scroll + refetch)                                     | G-CEK ALL-OK + 13 suite hijau + tsc + build                       |
| 2026-09-27 | F-batch merged (visibility + landing + confirm + ConfirmModal)                                  | F-CEK ALL-OK + 12 suite hijau + tsc + build + uji manual          |
| 2026-09-27 | E23 notifikasi + restruktur (PR, badge live + kartu kelola/monitor)                             | E23-CEK ALL-OK + 11 suite hijau + tsc + build                     |
| 2026-09-27 | E1 menu Proyek + Riwayat (PR, tabel + tab)                                                      | E1-CEK ALL-OK + 10 suite hijau + tsc + build                      |
| 2026-09-27 | D4b 8 tools (PR, tools/list 8 + github 401-gate)                                                | D4-CEK ALL-OK + tsc + build mcp-server & webapp                   |
| 2026-09-27 | D0 live (deploy + login prod + kirim prod + loop AI prod)                                       | URL live + OAuth prod + kirim manual                              |
| 2026-09-27 | D4 bridge merged (API key + 4 tools MCP stdio)                                                  | D4-CEK ALL-OK + tsc + build + handshake/tools-list + Bearer-401   |
| 2026-09-27 | D3b tabel penuh merged (projects/tasks/activity + dashboard API)                                | D3B-CEK ALL-OK + 8 suite hijau + tsc + build + 401-gate           |
| 2026-09-27 | D3 Neon queue merged (API + polling + token terenkripsi)                                        | D3-CEK ALL-OK + tsc + build + migrasi + 401-gate + crypto OK      |
| 2026-09-27 | D2 OAuth merged (login + repo live, token server-side)                                          | D2-CEK ALL-OK + tsc + build + login manual                        |
| 2026-09-27 | D1 queue mock merged (enqueue + panel + badge)                                                  | D1-CEK ALL-OK + tsc + build                                       |
| 2026-09-27 | C4 polish merged (tema + responsif)                                                             | C4-CEK ALL-OK + tsc + build                                       |
| 2026-09-27 | C3 feed + modal merged (4 item + wiring Perintah)                                               | C3-CEK ALL-OK + tsc + build                                       |
| 2026-09-27 | C2 dashboard grid merged (stats + 3 kartu)                                                      | C2-CEK ALL-OK + tsc + build                                       |
| 2026-09-27 | C1 shell merged (Sidebar + Topbar)                                                              | C1-CEK ALL-OK + tsc + build                                       |
| 2026-09-27 | C0 scaffold merged                                                                              | tsc + build                                                       |
