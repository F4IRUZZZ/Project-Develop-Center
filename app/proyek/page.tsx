"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { CommandModal } from "@/components/command/CommandModal";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { Project } from "@/lib/types";

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

  const stop = useCallback(
    async (projectId: string) => {
      if (!window.confirm("Yakin hentikan kerja AI di proyek ini? Perintah pending dibatalkan."))
        return;
      try {
        await fetch("/api/commands/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId }),
        });
      } catch {
        /* abaikan */
      }
      await muat();
    },
    [muat]
  );

  const gantiVisibilitas = useCallback(
    async (projectId: string, saatIniPrivate: boolean) => {
      const target = saatIniPrivate ? "public" : "private";
      if (
        !window.confirm(
          `Jadikan ${target}? Public: semua orang bisa lihat + Pages aktif. Private: sebaliknya.`
        )
      )
        return;
      try {
        await fetch("/api/repos/visibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId, private: !saatIniPrivate }),
        });
      } catch {
        /* abaikan */
      }
      await muat();
    },
    [muat]
  );

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6">
      <Dashboard
        projects={daftar}
        judul={`Proyek (${daftar.length})`}
        onCommand={(id) => {
          setSelectedId(id);
          setModalOpen(true);
        }}
        onStop={(id) => void stop(id)}
        onVisibility={(id, priv) => void gantiVisibilitas(id, priv)}
        aksiHeader={
          <button
            onClick={sync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#5457E5] disabled:opacity-50"
          >
            <RefreshCw className={`h-[15px] w-[15px] ${syncing ? "animate-spin" : ""}`} />{" "}
            {syncing ? "Memuat…" : "Sync GitHub"}
          </button>
        }
      />
      <CommandModal
        open={modalOpen}
        initialProjectId={selectedId}
        projects={daftar}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
