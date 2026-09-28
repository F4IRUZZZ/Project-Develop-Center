"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { AIStatus } from "@/lib/types";
import type { QueuedCommand } from "@/lib/tasks";
import { cn } from "@/lib/utils";

interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  status: AIStatus;
  progress: number;
  created_at: string;
  repo_name?: string;
}

type Tab = "tugas" | "perintah";

const WARNA_CMD: Record<QueuedCommand["status"], string> = {
  pending: "bg-amber-500/10 text-amber-500",
  processing: "bg-sky-500/10 text-sky-500",
  completed: "bg-emerald-500/10 text-emerald-500",
  failed: "bg-red-500/10 text-red-500",
};

export default function Riwayat() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>("tugas");
  const [filter, setFilter] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [commands, setCommands] = useState<QueuedCommand[]>([]);
  const [namaRepo, setNamaRepo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/tasks?all=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTasks(d as TaskRow[]))
      .catch(() => {});
    fetch("/api/commands", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setCommands(d as QueuedCommand[]))
      .catch(() => {});
    fetch("/api/projects", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setNamaRepo(
          Object.fromEntries(
            (d as Array<{ id: string; repo_name: string }>).map((p) => [p.id, p.repo_name])
          )
        )
      )
      .catch(() => {});
  }, [status]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  const proyekIds = [...new Set([...tasks.map((t) => t.project_id), ...commands.map((c) => c.project_id)])];
  const namaUntuk = (id: string) =>
    namaRepo[id] ?? tasks.find((t) => t.project_id === id)?.repo_name ?? id;
  const tasksTampil = filter ? tasks.filter((t) => t.project_id === filter) : tasks;
  const commandsTampil = filter ? commands.filter((c) => c.project_id === filter) : commands;

  return (
    <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Riwayat</h2>
        <label htmlFor="filter-proyek" className="sr-only">
          Filter proyek
        </label>
        <select
          id="filter-proyek"
          name="filter-proyek"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-[9px] border border-border bg-muted px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
        >
          <option value="">Semua proyek</option>
          {proyekIds.map((id) => (
            <option key={id} value={id}>
              {namaUntuk(id)}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex gap-2">
        {(["tugas", "perintah"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-[9px] px-4 py-2 text-[13px] font-medium capitalize transition-colors",
              tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t} ({t === "tugas" ? tasksTampil.length : commandsTampil.length})
          </button>
        ))}
      </div>

      {tab === "tugas" ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Tugas</th>
                <th className="px-4 py-3 font-semibold">Proyek</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {tasksTampil.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {t.repo_name ?? t.project_id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} label={t.status[0].toUpperCase() + t.status.slice(1)} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.progress}%</td>
                </tr>
              ))}
              {tasksTampil.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada tugas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {commandsTampil.map((c) => (
            <div key={c.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 truncate text-[13px]">
                  {c.command_text}{" "}
                  <span className="font-mono text-[11px] text-muted-foreground">· {namaUntuk(c.project_id)}</span>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", WARNA_CMD[c.status])}>
                  {c.status}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                {new Date(c.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                {c.result ? ` · ${c.result}` : ""}
              </div>
            </div>
          ))}
          {commandsTampil.length === 0 && (
            <p className="py-8 text-center text-[13px] text-muted-foreground">Belum ada perintah.</p>
          )}
        </div>
      )}
    </div>
  );
}
