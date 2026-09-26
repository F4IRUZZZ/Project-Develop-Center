"use client";

import { useState } from "react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { CommandModal } from "@/components/command/CommandModal";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const openFor = (projectId?: string) => {
    setSelectedId(projectId);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] gap-6 p-6">
      <div className="min-w-0 flex-1">
        <Dashboard onCommand={openFor} />
      </div>
      <div className="hidden w-[332px] shrink-0 xl:block">
        <ActivityFeed />
      </div>
      <CommandModal open={modalOpen} initialProjectId={selectedId} onClose={() => setModalOpen(false)} />
    </div>
  );
}
