// Antrian perintah mock (D1) — kontrak selaras PRD §10 CommandQueue.
// Penyimpanan: localStorage (dummy). D4 (MCP bridge) mengganti implementasi
// tanpa mengubah tipe ini.
export type CommandStatus = "pending" | "processing" | "completed" | "failed";

// Penanda hasil pembatalan pengguna (Stop). Dashboard menampilkan ini sebagai
// idle ("seolah tak terjadi"); riwayat tetap catat failed (jujur).
export const TANDA_STOP = "Dihentikan pengguna dari webapp.";

export interface QueuedCommand {
  id: string;
  project_id: string;
  command_text: string;
  status: CommandStatus;
  created_at: string;
  processed_at: string | null;
  result: string | null;
}

export const KUNCI_QUEUE = "pdc-queue";
export const EVENT_QUEUE = "pdc-queue";

function aman(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function siar() {
  window.dispatchEvent(new CustomEvent(EVENT_QUEUE));
}

export function bacaQueue(): QueuedCommand[] {
  if (!aman()) return [];
  try {
    const mentah = window.localStorage.getItem(KUNCI_QUEUE);
    if (!mentah) return [];
    const arr = JSON.parse(mentah) as QueuedCommand[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function simpanQueue(q: QueuedCommand[]) {
  window.localStorage.setItem(KUNCI_QUEUE, JSON.stringify(q));
  siar();
}

function buatId(): string {
  return `cmd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Simulasi D1: pending -> processing (2 dtk) -> completed (+3 dtk).
// Diganti worker/MCP asli di D4.
function jadwalSimulasi(id: string) {
  window.setTimeout(() => {
    const q = bacaQueue().map((c) => (c.id === id && c.status === "pending" ? { ...c, status: "processing" as const } : c));
    simpanQueue(q);
    window.setTimeout(() => {
      const q2 = bacaQueue().map((c) =>
        c.id === id && c.status === "processing"
          ? {
              ...c,
              status: "completed" as const,
              processed_at: new Date().toISOString(),
              result: "Simulasi D1: perintah diterima. AI asli tersambung di D4.",
            }
          : c
      );
      simpanQueue(q2);
    }, 3000);
  }, 2000);
}

export function enqueue(projectId: string, text: string): QueuedCommand {
  const cmd: QueuedCommand = {
    id: buatId(),
    project_id: projectId,
    command_text: text.trim(),
    status: "pending",
    created_at: new Date().toISOString(),
    processed_at: null,
    result: null,
  };
  simpanQueue([cmd, ...bacaQueue()]);
  jadwalSimulasi(cmd.id);
  return cmd;
}

export function listByProject(projectId: string): QueuedCommand[] {
  return bacaQueue().filter((c) => c.project_id === projectId);
}

export function pendingCount(projectId: string): number {
  return bacaQueue().filter((c) => c.project_id === projectId && (c.status === "pending" || c.status === "processing")).length;
}

export function bersihkanSelesai() {
  simpanQueue(bacaQueue().filter((c) => c.status === "pending" || c.status === "processing"));
}
