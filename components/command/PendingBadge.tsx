"use client";

import { useEffect, useState } from "react";
import { EVENT_QUEUE, pendingCount } from "@/lib/tasks";

export function PendingBadge({ projectId }: { projectId: string }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    setN(pendingCount(projectId));
    const fn = () => setN(pendingCount(projectId));
    window.addEventListener(EVENT_QUEUE, fn);
    return () => window.removeEventListener(EVENT_QUEUE, fn);
  }, [projectId]);

  if (n === 0) return null;
  return (
    <span
      title={`${n} perintah dalam antrian`}
      className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-semibold text-white"
    >
      {n}
    </span>
  );
}
