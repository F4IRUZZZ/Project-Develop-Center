"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, FolderGit2, Terminal } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CommandModal } from "@/components/command/CommandModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PullModal } from "@/components/command/PullModal";
import type { AIStatus, Project } from "@/lib/types";
import type { QueuedCommand } from "@/lib/tasks";
import type { ActivityEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "tugas" | "perintah" | "aktivitas" | "sesi";

interface SesiRow {
  session_id: string;
  mode: string;
  status: string;
  started_at: string;
  last_seen_at: string;
  ended_at: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  status: AIStatus;
  progress: number;
  created_at: string;
}

export default function DetailProyek({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [proyek, setProyek] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [commands, setCommands] = useState<QueuedCommand[]>([]);
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [tab, setTab] = useState<Tab>("tugas");
  const [sesi, setSesi] = useState<SesiRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pullOpen, setPullOpen] = useState(false);
  const [tanyaStop, setTanyaStop] = useState(false);

  const muat = useCallback(async () => {
    try {
      const [d, t, c, a, s] = await Promise.all([
        fetch("/api/dashboard", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/tasks?project_id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch("/api/commands", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/activity?project_id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`/api/sessions?project_id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : []
        ),
      ]);
      setProyek(((d as Project[]).find((p) => p.id === id) ?? null));
      setTasks(t as TaskRow[]);
      setCommands((c as QueuedCommand[]).filter((x) => x.project_id === id));
      setFeed(a as ActivityEvent[]);
      setSesi(s as SesiRow[]);
    } catch {
      /* abaikan */
    }
  }, [id]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const t0 = window.setTimeout(() => void muat(), 0);
    const t = window.setInterval(muat, 10000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, [status, muat]);

  const stop = async () => {
    await fetch("/api/commands/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: id }),
    }).catch(() => {});
    setTanyaStop(false);
    await muat();
  };

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;
  if (!proyek)
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Link href="/proyek" className="text-[13px] text-primary hover:underline">
          ← Kembali ke Proyek
        </Link>
        <p className="mt-4 font-mono text-xs text-muted-foreground">Memuat proyek…</p>
      </div>
    );

  const aktif = tasks.find((t) => ["working", "waiting", "stuck"].includes(t.status));
  const adaJalan =
    tasks.some((t) => ["working", "stuck"].includes(t.status)) ||
    commands.some((c) => ["pending", "processing"].includes(c.status));

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link href="/proyek" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Proyek
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-muted text-muted-foreground">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[17px] font-semibold tracking-tight">{proyek.repoName}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{proyek.repoFull}</div>
            </div>
          </div>
          <StatusBadge status={proyek.status} label={proyek.statusLabel} />
        </div>

        {aktif ? (
          <div className="mt-4">
            <div className="mb-1.5 text-[13px]">
              <span className="text-muted-foreground">Tugas: </span>
              {aktif.title}
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-muted">
              <div className="h-full rounded bg-primary transition-all" style={{ width: `${aktif.progress}%` }} />
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">{aktif.progress}%</div>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-muted-foreground">Tidak ada task aktif. Kirim perintah untuk memulai.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-[9px] bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <Terminal className="h-3.5 w-3.5" /> Perintah
          </button>
          {proyek.status === "waiting" && (
            <button
              onClick={() => setPullOpen(true)}
              className="rounded-[9px] bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-500 hover:bg-amber-500/20"
            >
              PR
            </button>
          )}
          {adaJalan && (
            <button
              onClick={() => setTanyaStop(true)}
              className="rounded-[9px] bg-red-500/10 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 mt-6 flex gap-2">
        {(["tugas", "perintah", "aktivitas", "sesi"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-[9px] px-4 py-2 text-[13px] font-medium capitalize transition-colors",
              tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "tugas" && (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {tasks.length === 0 && <p className="text-[13px] text-muted-foreground">Belum ada tugas.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 truncate text-[13px]">{t.title}</div>
                <StatusBadge status={t.status} label={t.status[0].toUpperCase() + t.status.slice(1)} />
              </div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{t.progress}%</div>
            </div>
          ))}
        </div>
      )}

      {tab === "perintah" && (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {commands.length === 0 && <p className="text-[13px] text-muted-foreground">Belum ada perintah.</p>}
          {commands.map((c) => (
            <div key={c.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="text-[13px]">{c.command_text}</div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                {c.status}
                {c.result ? ` · ${c.result}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "aktivitas" && (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {feed.length === 0 && <p className="text-[13px] text-muted-foreground">Belum ada aktivitas.</p>}
          {feed.map((e) => (
            <div key={e.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="text-[13px]">{e.message}</div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{e.time}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "sesi" && (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {sesi.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
              Belum ada sesi tercatat. Pasang plugin pdc-presence di repo ini agar sesi OpenCode terlacak otomatis.
            </p>
          )}
          {sesi.map((s) => (
            <div key={s.session_id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[11px] text-muted-foreground">
                  {s.session_id.slice(0, 8)}… · {s.mode}
                </div>
                <StatusBadge
                  status={s.status === "active" ? "working" : s.status === "error" ? "failed" : "idle"}
                  label={s.ended_at ? `Selesai (${s.status})` : "Aktif"}
                />
              </div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                mulai {new Date(s.started_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}

      <CommandModal
        open={modalOpen}
        initialProjectId={id}
        projects={proyek ? [proyek] : []}
        onTerkirim={() => void muat()}
        onClose={() => setModalOpen(false)}
      />
      <PullModal open={pullOpen} projectId={id} repoName={proyek.repoName} onMerged={() => void muat()} onClose={() => setPullOpen(false)} />
      <ConfirmModal
        open={tanyaStop}
        judul="Hentikan kerja AI?"
        pesan={`Kerja AI di ${proyek.repoName} dihentikan. Perintah pending dibatalkan.`}
        labelKonfirmasi="Ya, hentikan"
        danger
        onKonfirmasi={() => void stop()}
        onBatal={() => setTanyaStop(false)}
      />
    </div>
  );
}
