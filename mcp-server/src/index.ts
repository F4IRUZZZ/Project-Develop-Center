import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

// Opsi B (AGENTS §6): default = production. Env eksplisit untuk dev lokal.
// Tanpa ini, instalasi tanpa env menembak laptop port 3000 lalu gagal diam.
const API = (process.env.PDC_API_URL ?? "https://project-develop-center.vercel.app").replace(/\/$/, "");
const KEY = process.env.PDC_API_KEY ?? "";

if (!process.env.PDC_API_URL) {
  console.error("[pdc] PDC_API_URL tak diset, pakai production default. Set eksplisit untuk dev lokal.");
}

if (!KEY) {
  console.error("[pdc] PDC_API_KEY kosong. Buat di webapp: Pengaturan -> Buat key baru.");
  process.exit(1);
}

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const msg = (data as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(`PDC ${method} ${path}: ${msg}`);
  }
  return data;
}

// Satu panggilan untuk id + project_id task (baris tasks memuat keduanya),
// gantikan pola lama 2 panggilan (tasks + scan semua /api/commands).
async function tugasUntuk(commandId: string): Promise<{ id: string; project_id: string } | null> {
  const rows = (await api(`/api/tasks?command_id=${encodeURIComponent(commandId)}`)) as Array<{
    id: string;
    project_id: string;
  }>;
  const r = rows[0];
  return r ? { id: r.id, project_id: String(r.project_id ?? "") } : null;
}

const server = new McpServer({ name: "project-develop-center", version: "0.1.0" });

server.registerTool(
  "pdc_get_pending_commands",
  {
    description: "Ambil perintah pengguna yang belum diproses (status pending). Panggil berkala saat bekerja.",
    inputSchema: { project_id: z.string().optional().describe("Filter per proyek, kosongkan untuk semua") },
  },
  async ({ project_id }) => {
    // Filter server (hemat) + saring ulang client (aman bila server lama
    // belum kenal ?status= — abaikan param tak dikenal).
    const q = `/api/commands?status=pending${project_id ? `&project_id=${encodeURIComponent(project_id)}` : ""}`;
    const semua = (await api(q)) as Array<Record<string, unknown>>;
    const pending = semua.filter(
      (c) => c.status === "pending" && (!project_id || c.project_id === project_id)
    );
    return { content: [{ type: "text", text: JSON.stringify(pending, null, 2) }] };
  }
);

server.registerTool(
  "pdc_report_progress",
  {
    description: "Laporkan progress pengerjaan perintah ke dashboard PDC.",
    inputSchema: {
      command_id: z.string(),
      message: z.string().describe("Contoh: Sedang mengimplementasikan komponen LoginForm"),
      progress_percent: z.number().min(0).max(100).optional(),
    },
  },
  async ({ command_id, message, progress_percent }) => {
    await api(`/api/commands/${command_id}`, "PATCH", { status: "processing" });
    const t = await tugasUntuk(command_id);
    if (t) await api(`/api/tasks/${t.id}`, "PATCH", { status: "working", progress: progress_percent ?? 45 });
    if (t?.project_id) await api("/api/activity", "POST", { project_id: t.project_id, type: "progress", message });
    return { content: [{ type: "text", text: "Progress tercatat di PDC." }] };
  }
);

server.registerTool(
  "pdc_report_completion",
  {
    description: "Laporkan perintah selesai ke dashboard PDC.",
    inputSchema: {
      command_id: z.string(),
      summary: z.string().describe("Ringkasan hasil kerja"),
      git_branch: z.string().optional(),
    },
  },
  async ({ command_id, summary, git_branch }) => {
    await api(`/api/commands/${command_id}`, "PATCH", { status: "completed", result: summary });
    const t = await tugasUntuk(command_id);
    if (t)
      await api(`/api/tasks/${t.id}`, "PATCH", { status: "completed", progress: 100, result_summary: summary });
    const projectId = t?.project_id ?? "";
    if (projectId)
      // Kontrak dengan /api/notifications: pesan selesai WAJIB berprefix
      // "Selesai:" agar masuk filter notifikasi (P3). Jangan ubah kalimat
      // tanpa selaraskan filter di app/api/notifications/route.ts.
      await api("/api/activity", "POST", {
        project_id: projectId,
        type: "info",
        message: `Selesai: ${summary}${git_branch ? ` (${git_branch})` : ""}`,
      });
    return { content: [{ type: "text", text: "Penyelesaian tercatat di PDC." }] };
  }
);

server.registerTool(
  "pdc_report_error",
  {
    description: "Laporkan perintah gagal/stuck ke dashboard PDC.",
    inputSchema: {
      command_id: z.string(),
      error_message: z.string(),
    },
  },
  async ({ command_id, error_message }) => {
    await api(`/api/commands/${command_id}`, "PATCH", { status: "failed", result: error_message });
    const t = await tugasUntuk(command_id);
    if (t) await api(`/api/tasks/${t.id}`, "PATCH", { status: "failed", result_summary: error_message });
    if (t?.project_id) await api("/api/activity", "POST", { project_id: t.project_id, type: "error", message: error_message });
    return { content: [{ type: "text", text: "Error tercatat di PDC." }] };
  }
);

// ---- D4b: tools baca (introspeksi, tanpa tulis) ----

server.registerTool(
  "pdc_get_projects",
  {
    description: "Ambil daftar proyek yang dipantau di PDC.",
  },
  async () => {
    const data = await api("/api/projects");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "pdc_get_project_status",
  {
    description: "Ambil status AI proyek tertentu (idle/working/waiting/completed/failed/stuck).",
    inputSchema: { project_id: z.string() },
  },
  async ({ project_id }) => {
    // Utang disadari (P5): ambil semua lalu find. Dipanggil jarang
    // (introspeksi), scope ?project_id= dashboard ditunda agar respons
    // Project[] + agregat sesi tak regresi.
    const semua = (await api("/api/dashboard")) as Array<Record<string, unknown>>;
    const p = semua.find((x) => x.id === project_id);
    if (!p) throw new Error(`Proyek ${project_id} tidak ketemu di dashboard`);
    return { content: [{ type: "text", text: JSON.stringify(p, null, 2) }] };
  }
);

server.registerTool(
  "pdc_get_task_history",
  {
    description: "Ambil riwayat tugas AI per proyek.",
    inputSchema: { project_id: z.string() },
  },
  async ({ project_id }) => {
    const data = await api(`/api/tasks?project_id=${encodeURIComponent(project_id)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "pdc_get_github_context",
  {
    description: "Ambil konteks GitHub repo: branch, PR terbuka, issue terbuka.",
    inputSchema: { project_id: z.string() },
  },
  async ({ project_id }) => {
    const data = await api(`/api/github?project_id=${encodeURIComponent(project_id)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  await server.connect(new StdioServerTransport());
  console.error("[pdc] MCP bridge jalan, menunggu perintah OpenCode…");
}

void main();
