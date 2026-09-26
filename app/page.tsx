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
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 p-4 sm:p-6 xl:flex-row">
      <div className="min-w-0 flex-1">
        <Dashboard onCommand={openFor} />
      </div>
      <div className="w-full shrink-0 xl:w-[332px]">
        <ActivityFeed />
      </div>
      <CommandModal open={modalOpen} initialProjectId={selectedId} onClose={() => setModalOpen(false)} />
    </div>
  );
}
