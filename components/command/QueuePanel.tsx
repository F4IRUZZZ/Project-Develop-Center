"use client";

import { Inbox, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { bersihkanAntrian, sumberDariStatus, useQueue } from "@/lib/queue";
import type { QueuedCommand } from "@/lib/tasks";
import { projects } from "@/lib/mock";
import { cn } from "@/lib/utils";

const WARNA: Record<QueuedCommand["status"], string> = {
  pending: "bg-amber-500/10 text-amber-500",
  processing: "bg-sky-500/10 text-sky-500",
  completed: "bg-emerald-500/10 text-emerald-500",
  failed: "bg-red-500/10 text-red-500",
};

const LABEL: Record<QueuedCommand["status"], string> = {
  pending: "Menunggu",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
};

function namaProyek(id: string): string {
  return projects.find((p) => p.id === id)?.repoName ?? id;
}

function waktuRelatif(iso: string): string {
  const dtk = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (dtk < 60) return `${dtk} dtk lalu`;
  const mnt = Math.round(dtk / 60);
  if (mnt < 60) return `${mnt} mnt lalu`;
  return `${Math.round(mnt / 60)} jam lalu`;
}

export function QueuePanel() {
  const { status } = useSession();
  const { antrian } = useQueue();
  const selesai = antrian.filter((c) => c.status === "completed" || c.status === "failed").length;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-semibold">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          Antrian Perintah
          <span className="font-mono text-xs font-normal text-muted-foreground">({antrian.length})</span>
        </div>
        {selesai > 0 && (
          <button
            onClick={() => void bersihkanAntrian(sumberDariStatus(status))}
            className="flex items-center gap-1.5 rounded-[9px] border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> Bersihkan selesai
          </button>
        )}
      </div>

      {antrian.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Belum ada perintah. Klik <b className="font-semibold">Perintah</b> pada kartu proyek untuk mengirim satu.
        </p>
      ) : (
        <div>
          {antrian.map((c) => (
            <div key={c.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 truncate text-[13px]">
                  {c.command_text}{" "}
                  <span className="font-mono text-[11px] text-muted-foreground">· {namaProyek(c.project_id)}</span>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", WARNA[c.status])}>
                  {LABEL[c.status]}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                {waktuRelatif(c.created_at)}
                {c.result ? ` · ${c.result}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
