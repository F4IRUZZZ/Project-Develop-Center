"use client";

import { useEffect, useState } from "react";
import { Inbox, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { bersihkanAntrian, bacaInfoMigrasi, sumberDariStatus, tutupInfoMigrasi, useQueue } from "@/lib/queue";
import { useBahasa } from "@/components/shell/BahasaProvider";
import type { Kunci, Lang } from "@/lib/kamus";
import type { QueuedCommand } from "@/lib/tasks";
import { cn } from "@/lib/utils";

const WARNA: Record<QueuedCommand["status"], string> = {
  pending: "bg-amber-500/10 text-amber-500",
  processing: "bg-sky-500/10 text-sky-500",
  completed: "bg-emerald-500/10 text-emerald-500",
  failed: "bg-red-500/10 text-red-500",
};

const LABEL: Record<QueuedCommand["status"], Kunci> = {
  pending: "antre.labelPending",
  processing: "antre.labelProcessing",
  completed: "antre.labelCompleted",
  failed: "antre.labelFailed",
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

function waktuRelatif(iso: string, lang: Lang, teks: (k: Kunci) => string): string {
  const dtk = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (dtk < 60) return `${dtk} ${teks("notif.dtkLalu")}`;
  const mnt = Math.round(dtk / 60);
  if (mnt < 60) return `${mnt} ${teks("notif.mntLalu")}`;
  return `${Math.round(mnt / 60)} ${teks("notif.jamLalu")}`;
}

export function QueuePanel() {
  const { status } = useSession();
  const { lang, teks } = useBahasa();
  const { antrian, sumber } = useQueue();
  const infoMigrasi = bacaInfoMigrasi();
  const selesai = antrian.filter((c) => c.status === "completed" || c.status === "failed").length;
  const [gagalHapus, setGagalHapus] = useState(false);
  const namaProyek = useNamaProyek();

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-semibold">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          {teks("antre.judul")}
          <span className="font-mono text-xs font-normal text-muted-foreground">({antrian.length})</span>
          <span
            title={sumber === "api" ? teks("antre.serverTitle") : teks("antre.lokalTitle")}
            className="rounded-full border border-border px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
          >
            {sumber === "api" ? teks("antre.server") : teks("antre.lokal")}
          </span>
        </div>
        {selesai > 0 && (
          <button
            onClick={async () => {
              const ok = await bersihkanAntrian(sumberDariStatus(status));
              setGagalHapus(!ok);
            }}
            className="flex items-center gap-1.5 rounded-[9px] border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> {teks("antre.bersihkan")}
          </button>
        )}
      </div>
      {gagalHapus && (
        <p className="mb-3 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
          {teks("antre.gagalHapus")}
        </p>
      )}
      {sumber === "lokal" && antrian.length > 0 && (
        <p className="mb-3 rounded-[9px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-600 dark:text-amber-400">
          {teks("antre.lokalWarn")}
        </p>
      )}
      {infoMigrasi !== null && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-[9px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12.5px] text-emerald-600 dark:text-emerald-400">
          <span>{teks("antre.migrasi").replace("{n}", String(infoMigrasi))}</span>
          <button
            onClick={tutupInfoMigrasi}
            aria-label={teks("modal.tutup")}
            className="shrink-0 rounded-md px-1.5 py-0.5 hover:bg-emerald-500/20"
          >
            {teks("modal.tutup")}
          </button>
        </div>
      )}

      {antrian.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          {teks("antre.kosongA")} <b className="font-semibold">{teks("kartu.perintah")}</b> {teks("antre.kosongB")}
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
                  {teks(LABEL[c.status])}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground" suppressHydrationWarning>
                {waktuRelatif(c.created_at, lang, teks)}
                {c.result ? ` · ${c.result}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
