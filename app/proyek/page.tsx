"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw, Terminal } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { CommandModal } from "@/components/command/CommandModal";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { AIStatus, Project } from "@/lib/types";

export default function Proyek() {
  const { data: session, status } = useSession();
  const [daftar, setDaftar] = useState<Project[]>([]);
  const [syncing, setSyncing] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) setDaftar((await res.json()) as Project[]);
    } catch {
      /* abaikan */
    }
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/projects", { method: "POST" });
    } catch {
      /* abaikan */
    }
    await muat();
    setSyncing(false);
  }, [muat]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      await muat();
      setSyncing(false);
    })();
  }, [status, muat]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold tracking-tight">Proyek ({daftar.length})</h2>
        <button
          onClick={sync}
          disabled={syncing}
          className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#5457E5] disabled:opacity-50"
        >
          <RefreshCw className={`h-[15px] w-[15px] ${syncing ? "animate-spin" : ""}`} />{" "}
          {syncing ? "Memuat…" : "Sync GitHub"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Repo</th>
              <th className="px-4 py-3 font-semibold">Branch</th>
              <th className="px-4 py-3 font-semibold">Status AI</th>
              <th className="px-4 py-3 font-semibold">Tugas</th>
              <th className="px-4 py-3 font-semibold">Update</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="font-semibold">{p.repoName}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{p.repoFull}</div>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p.branch ?? "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status as AIStatus} label={p.statusLabel} />
                </td>
                <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground">{p.taskLabel}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p.meta}</td>
                <td className="px-4 py-3">
                  <button
                    title="Kirim perintah"
                    aria-label={`Perintah untuk ${p.repoName}`}
                    onClick={() => {
                      setSelectedId(p.id);
                      setModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-[9px] bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Terminal className="h-3.5 w-3.5" /> Perintah
                  </button>
                </td>
              </tr>
            ))}
            {daftar.length === 0 && !syncing && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada proyek. Klik Sync GitHub.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CommandModal
        open={modalOpen}
        initialProjectId={selectedId}
        projects={daftar}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
