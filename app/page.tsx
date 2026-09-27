"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { CommandModal } from "@/components/command/CommandModal";
import { QueuePanel } from "@/components/command/QueuePanel";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { fetchDashboard } from "@/lib/github";
import { projects as mockProjects } from "@/lib/mock";
import type { Project } from "@/lib/types";

export default function Home() {
  const { data: session, status } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [live, setLive] = useState<Project[] | null>(null);
  const [gagalRepo, setGagalRepo] = useState(false);

  const openFor = (projectId?: string) => {
    setSelectedId(projectId);
    setModalOpen(true);
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDashboard()
      .then(setLive)
      .catch(() => setGagalRepo(true));
    const t = window.setInterval(() => {
      fetchDashboard()
        .then(setLive)
        .catch(() => {});
    }, 10000);
    return () => window.clearInterval(t);
  }, [status]);

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 p-4 sm:p-6 xl:flex-row">
      <div className="min-w-0 flex-1">
        {status === "loading" ? (
          <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>
        ) : !session?.user ? (
          <LoginCard />
        ) : live ? (
          <Dashboard projects={live} onCommand={openFor} />
        ) : gagalRepo ? (
          <>
            <p className="mb-4 rounded-[9px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-500">
              Gagal memuat repo GitHub — menampilkan data contoh.
            </p>
            <Dashboard projects={mockProjects} onCommand={openFor} />
          </>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">Memuat repo GitHub…</p>
        )}
        {session?.user && <QueuePanel />}
      </div>
      <div className="w-full shrink-0 xl:w-[332px]">
        <ActivityFeed />
      </div>
      <CommandModal open={modalOpen} initialProjectId={selectedId} onClose={() => setModalOpen(false)} />
    </div>
  );
}
