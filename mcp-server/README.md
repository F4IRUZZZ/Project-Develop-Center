# @pdc/mcp-server — MCP Bridge PDC ↔ OpenCode

Jembatan agar OpenCode (MCP client) bisa mengambil antrian perintah dan
melaporkan progress ke webapp PDC. Dijalankan sebagai proses terminal
Windows, dikonfigurasi di settings OpenCode.

## Pasang sekali

```bash
npm install
npm run build
```

## Konfigurasi OpenCode

Tambahkan ke settings OpenCode (`mcpServers`):

```json
{
  "mcpServers": {
    "project-develop-center": {
      "command": "node",
      "args": ["D:\\Project Developments\\GITHUB\\Project-Develop-Center\\mcp-server\\dist\\index.js"],
      "env": {
        "PDC_API_URL": "http://localhost:3000",
        "PDC_API_KEY": "pdc_... (buat di webapp: Pengaturan -> Buat key baru)"
      }
    }
  }
}
```

Jalankan manual (debug):

```bash
PDC_API_URL=http://localhost:3000 PDC_API_KEY=pdc_... npm start
```

## Tools (working loop)

| Tool | Fungsi |
|---|---|
| `pdc_get_pending_commands` | Ambil perintah `pending` (filter opsional `project_id`) |
| `pdc_report_progress` | Lapor progress (`command_id`, `message`, `progress_percent?`) |
| `pdc_report_completion` | Lapor selesai (`command_id`, `summary`, `git_branch?`) |
| `pdc_report_error` | Lapor gagal (`command_id`, `error_message`) |

Setiap report menulis `command_queue` + `tasks` + `activity_log` via API PDC
(auth Bearer API key). 4 tools baca (`get_projects/status/history/github_context`)
menyusul di D4b.
