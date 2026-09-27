"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import {
  EVENT_QUEUE,
  bacaQueue,
  bersihkanSelesai,
  enqueue as enqueueLokal,
  type QueuedCommand,
} from "./tasks";

export type Sumber = "api" | "lokal";

let cache: QueuedCommand[] = [];
let pendengar = new Set<() => void>();
let interval: number | null = null;
let langgananLokal = false;

function siar() {
  pendengar.forEach((fn) => fn());
}

async function muatDariApi(): Promise<boolean> {
  try {
    const res = await fetch("/api/commands", { cache: "no-store" });
    if (!res.ok) return false;
    cache = (await res.json()) as QueuedCommand[];
    siar();
    return true;
  } catch {
    return false;
  }
}

function muatDariLokal() {
  cache = bacaQueue();
  siar();
}

// Simulasi D3b untuk baris DB (diganti worker/MCP di D4).
// Menulis command + task + activity agar konsisten.
async function json(url: string, method: string, body: unknown) {
  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

function simulasiApi(cmd: QueuedCommand & { task_id?: string }) {
  const { id, project_id, command_text, task_id } = cmd;
  window.setTimeout(async () => {
    await json(`/api/commands/${id}`, "PATCH", { status: "processing" });
    if (task_id) await json(`/api/tasks/${task_id}`, "PATCH", { status: "working", progress: 45 });
    await json("/api/activity", "POST", { project_id, type: "progress", message: `Mengerjakan: ${command_text}` });
    await muatDariApi();
    window.setTimeout(async () => {
      const hasil = "Simulasi D3b: perintah + task + activity tersimpan di Neon. AI asli tersambung di D4.";
      await json(`/api/commands/${id}`, "PATCH", { status: "completed", result: hasil });
      if (task_id)
        await json(`/api/tasks/${task_id}`, "PATCH", { status: "completed", progress: 100, result_summary: hasil });
      await json("/api/activity", "POST", { project_id, type: "info", message: `Selesai: ${command_text}` });
      await muatDariApi();
    }, 3000);
  }, 2000);
}

export async function kirimPerintah(projectId: string, text: string, sumber: Sumber): Promise<boolean> {
  if (sumber === "lokal") {
    enqueueLokal(projectId, text);
    return true;
  }
  try {
    const res = await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, command_text: text }),
    });
    if (!res.ok) return false;
    const cmd = (await res.json()) as QueuedCommand & { task_id?: string };
    simulasiApi({ ...cmd, command_text: text, project_id: projectId });
    await muatDariApi();
    return true;
  } catch {
    return false;
  }
}

export async function bersihkanAntrian(sumber: Sumber) {
  if (sumber === "lokal") {
    bersihkanSelesai();
    return;
  }
  try {
    await fetch("/api/commands", { method: "DELETE" });
  } catch {
    /* abaikan */
  }
  await muatDariApi();
}

function mulai(sumber: Sumber) {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  if (sumber === "api") {
    void muatDariApi();
    interval = window.setInterval(() => void muatDariApi(), 5000);
  } else {
    muatDariLokal();
    if (!langgananLokal) {
      langgananLokal = true;
      window.addEventListener(EVENT_QUEUE, muatDariLokal);
    }
  }
}

function langganan(fn: () => void) {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}

export function sumberDariStatus(status: string): Sumber {
  return status === "authenticated" ? "api" : "lokal";
}

export function useQueue(projectId?: string) {
  const { status } = useSession();
  useEffect(() => {
    mulai(sumberDariStatus(status));
  }, [status]);

  const semua = useSyncExternalStore(langganan, () => cache, () => []);
  const pending = semua.filter(
    (c) =>
      (!projectId || c.project_id === projectId) && (c.status === "pending" || c.status === "processing")
  ).length;
  return { antrian: projectId ? semua.filter((c) => c.project_id === projectId) : semua, pending };
}
