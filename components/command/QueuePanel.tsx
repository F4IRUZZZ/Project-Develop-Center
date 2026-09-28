"use client";

import { useEffect, useState } from "react";
import { Inbox, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { bersihkanAntrian, sumberDariStatus, useQueue } from "@/lib/queue";
import type { QueuedCommand } from "@/lib/tasks";
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

function useNamaProyek(): (id: string) => string {
  const [peta, setPeta] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/projects", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setPeta(Object.fromEntries((d as Array<{ id: string; repo_name: string }>).map((p) => [p.id, p.repo_name])))
      )
      .catch(() => {});
  }, []);
  return (id: string) => peta[id] ?? id;
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
  const [gagalHapus, setGagalHapus] = useState(false);
  const namaProyek = useNamaProyek();

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
            onClick={async () => {
              const ok = await bersihkanAntrian(sumberDariStatus(status));
              setGagalHapus(!ok);
            }}
            className="flex items-center gap-1.5 rounded-[9px] border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> Bersihkan selesai
          </button>
        )}
      </div>
      {gagalHapus && (
        <p className="mb-3 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
          Gagal membersihkan. Coba lagi.
        </p>
      )}

      {antrian.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Belum ada perintah. Klik <b className="font-semibold">Perintah</b> pada kartu proyek untuk mengirim satu.
        </p>
      ) : (
        <div className="scroll-tipis max-h-[400px] overflow-y-auto pr-1">
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
