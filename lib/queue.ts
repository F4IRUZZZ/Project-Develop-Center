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
const pendengar = new Set<() => void>();
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

// Simulasi hanya untuk mode lokal (lib/tasks.ts). Mode api TIDAK auto-simulasi:
// perintah tetap pending sampai AI asli (OpenCode via MCP bridge) melapor.

export async function kirimPerintah(projectId: string, text: string, sumber: Sumber): Promise<boolean> {
  if (sumber === "lokal") {
    enqueueLokal(projectId, text);
    return true;
  }
  // Mode api: TIDAK ada auto-simulasi. Perintah tetap pending sampai AI asli
  // (OpenCode via MCP bridge) mengambil dan melaporkannya. Simulasi hanya
  // untuk mode lokal (tanpa backend/AI).
  try {
    const res = await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, command_text: text }),
    });
    if (!res.ok) return false;
    await muatDariApi();
    return true;
  } catch {
    return false;
  }
}

export async function bersihkanAntrian(sumber: Sumber): Promise<boolean> {
  if (sumber === "lokal") {
    bersihkanSelesai();
    return true;
  }
  try {
    const res = await fetch("/api/commands", { method: "DELETE" });
    if (!res.ok) return false;
  } catch {
    return false;
  }
  await muatDariApi();
  return true;
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
