import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const API = (process.env.PDC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const KEY = process.env.PDC_API_KEY ?? "";

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

async function taskIdUntuk(commandId: string): Promise<string | null> {
  const rows = (await api(`/api/tasks?command_id=${encodeURIComponent(commandId)}`)) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

async function projectUntuk(commandId: string): Promise<string> {
  const cmds = (await api("/api/commands")) as Array<Record<string, unknown>>;
  return String(cmds.find((c) => c.id === commandId)?.project_id ?? "");
}

const server = new McpServer({ name: "project-develop-center", version: "0.1.0" });

server.registerTool(
  "pdc_get_pending_commands",
  {
    description: "Ambil perintah pengguna yang belum diproses (status pending). Panggil berkala saat bekerja.",
    inputSchema: { project_id: z.string().optional().describe("Filter per proyek, kosongkan untuk semua") },
  },
  async ({ project_id }) => {
    const semua = (await api("/api/commands")) as Array<Record<string, unknown>>;
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
    const taskId = await taskIdUntuk(command_id);
    if (taskId) await api(`/api/tasks/${taskId}`, "PATCH", { status: "working", progress: progress_percent ?? 45 });
    const projectId = await projectUntuk(command_id);
    if (projectId) await api("/api/activity", "POST", { project_id: projectId, type: "progress", message });
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
    const taskId = await taskIdUntuk(command_id);
    if (taskId)
      await api(`/api/tasks/${taskId}`, "PATCH", { status: "completed", progress: 100, result_summary: summary });
    const projectId = await projectUntuk(command_id);
    if (projectId)
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
    const taskId = await taskIdUntuk(command_id);
    if (taskId) await api(`/api/tasks/${taskId}`, "PATCH", { status: "failed", result_summary: error_message });
    const projectId = await projectUntuk(command_id);
    if (projectId) await api("/api/activity", "POST", { project_id: projectId, type: "error", message: error_message });
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
