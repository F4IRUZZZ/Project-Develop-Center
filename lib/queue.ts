"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import {
  EVENT_QUEUE,
  KUNCI_QUEUE,
  bacaQueue,
  bersihkanSelesai,
  enqueue as enqueueLokal,
  type QueuedCommand,
} from "./tasks";
import { mulaiPolling, type KendaliPolling } from "./polling";

export type Sumber = "api" | "lokal";

let cache: QueuedCommand[] = [];
const pendengar = new Set<() => void>();
let polling: KendaliPolling | null = null;
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

let sudahMigrasi = false;
let infoMigrasi: number | null = null;

export function bacaInfoMigrasi(): number | null {
  return infoMigrasi;
}

export function tutupInfoMigrasi() {
  infoMigrasi = null;
  siar();
}

// Migrasi sekali saat login: pindahkan item pending/processing lokal
// ke POST /api/commands agar tidak hilang saat ganti sumber.
// Kontrak QueuedCommand tidak berubah (PRD §10); item 404 (proyek asing)
// dibiarkan di lokal agar tidak ada data loss.
export async function migrasiLokalKeApi(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const lokal = bacaQueue().filter((c) => c.status === "pending" || c.status === "processing");
  if (lokal.length === 0) return 0;
  const terpindah: string[] = [];
  for (const c of lokal) {
    const teks = c.command_text?.trim() ?? "";
    if (!c.project_id || !teks) continue;
    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: c.project_id, command_text: teks }),
      });
      if (res.ok) terpindah.push(c.id);
    } catch {
      // Jaringan gagal: biarkan di lokal, coba lagi saat login berikutnya.
    }
  }
  if (terpindah.length > 0) {
    try {
      const sisa = bacaQueue().filter((c) => !terpindah.includes(c.id));
      window.localStorage.setItem(KUNCI_QUEUE, JSON.stringify(sisa));
    } catch {
      // localStorage penuh/diblokir: abaikan, server sudah terima.
    }
    infoMigrasi = terpindah.length;
    siar();
  }
  return terpindah.length;
}

function mulai(sumber: Sumber) {
  if (polling) {
    polling.berhenti();
    polling = null;
  }
  if (sumber === "api") {
    polling = mulaiPolling(() => muatDariApi(), { awalMs: 5000 });
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
    let batal = false;
    if (sumberDariStatus(status) === "api") {
      if (!sudahMigrasi) {
        sudahMigrasi = true;
        void migrasiLokalKeApi().finally(() => {
          if (!batal) mulai("api");
        });
      } else {
        mulai("api");
      }
    } else {
      sudahMigrasi = false;
      infoMigrasi = null;
      mulai("lokal");
    }
    return () => {
      batal = true;
    };
  }, [status]);

  const semua = useSyncExternalStore(langganan, () => cache, () => []);
  const pending = semua.filter(
    (c) =>
      (!projectId || c.project_id === projectId) && (c.status === "pending" || c.status === "processing")
  ).length;
  const sumber = sumberDariStatus(status);
  return { antrian: projectId ? semua.filter((c) => c.project_id === projectId) : semua, pending, sumber };
}
