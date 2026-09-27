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
- [ ] D3: DB Postgres + API routes + SSE (PRD F2-F5)
- [ ] D4: MCP bridge `@pdc/mcp-server` + 8 tools (PRD F8 — risiko tertinggi)

## E. Riwayat Perubahan

| Tanggal | Perubahan | Uji |
|---|---|---|
| 2026-09-27 | D4 bridge merged (API key + 4 tools MCP stdio) | D4-CEK ALL-OK + tsc + build + handshake/tools-list + Bearer-401 |
| 2026-09-27 | D3b tabel penuh merged (projects/tasks/activity + dashboard API) | D3B-CEK ALL-OK + 8 suite hijau + tsc + build + 401-gate |
| 2026-09-27 | D3 Neon queue merged (API + polling + token terenkripsi) | D3-CEK ALL-OK + tsc + build + migrasi + 401-gate + crypto OK |
| 2026-09-27 | D2 OAuth merged (login + repo live, token server-side) | D2-CEK ALL-OK + tsc + build + login manual |
| 2026-09-27 | D1 queue mock merged (enqueue + panel + badge) | D1-CEK ALL-OK + tsc + build |
| 2026-09-27 | C4 polish merged (tema + responsif) | C4-CEK ALL-OK + tsc + build |
| 2026-09-27 | C3 feed + modal merged (4 item + wiring Perintah) | C3-CEK ALL-OK + tsc + build |
| 2026-09-27 | C2 dashboard grid merged (stats + 3 kartu) | C2-CEK ALL-OK + tsc + build |
| 2026-09-27 | C1 shell merged (Sidebar + Topbar) | C1-CEK ALL-OK + tsc + build |
| 2026-09-27 | C0 scaffold merged | tsc + build |
