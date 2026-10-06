import { cn } from "@/lib/utils";
import type { AIStatus } from "@/lib/types";

const DOT: Record<AIStatus, string> = {
  working: "bg-sky-500 shadow-[0_0_7px_var(--color-sky-500,#3B82F6)]",
  waiting: "bg-amber-500 shadow-[0_0_7px_var(--color-amber-500,#F59E0B)]",
  idle: "bg-muted-foreground",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  stuck: "bg-amber-500 animate-pulse",
};

const TEXT: Record<AIStatus, string> = {
  working: "text-sky-500",
  waiting: "text-amber-500",
  idle: "text-muted-foreground",
  completed: "text-emerald-500",
  failed: "text-red-500",
  stuck: "text-amber-500",
};

export function StatusBadge({ status, label }: { status: AIStatus; label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
      <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", DOT[status])} />
      <span className={cn(TEXT[status])}>{label}</span>
    </span>
  );
}
