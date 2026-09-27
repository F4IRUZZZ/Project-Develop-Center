"use client";

import { useQueue } from "@/lib/queue";

export function PendingBadge({ projectId }: { projectId: string }) {
  const { pending } = useQueue(projectId);

  if (pending === 0) return null;
  return (
    <span
      title={`${pending} perintah dalam antrian`}
      className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-semibold text-white"
    >
      {pending}
    </span>
  );
}
