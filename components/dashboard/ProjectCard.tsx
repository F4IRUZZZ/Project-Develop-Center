import { Clock, FolderGit2, Square, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { PendingBadge } from "@/components/command/PendingBadge";

const BAR: Record<Project["progressTone"], string> = {
  accent: "bg-primary",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
};

interface CardProps {
  project: Project;
  readOnly?: boolean;
  onCommand?: (projectId: string) => void;
  onStop?: (projectId: string) => void;
}

export function ProjectCard({ project, readOnly, onCommand, onStop }: CardProps) {
  const aksi = readOnly ? [] : project.actions;
  return (
    <article className="rounded-2xl border border-border bg-card p-[17px_18px] transition-all hover:-translate-y-px hover:border-[#34344A] hover:shadow-[0_6px_18px_rgba(0,0,0,0.4)]">
      <div className="mb-3.5 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground">
            <FolderGit2 className="h-[17px] w-[17px]" />
          </div>
          <div>
            <div className="flex items-center text-sm font-semibold tracking-tight">
              {project.repoName}
              <PendingBadge projectId={project.id} />
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">{project.repoFull}</div>
          </div>
        </div>
        <StatusBadge status={project.status} label={project.statusLabel} />
      </div>

      <div className="mb-2.5 text-[13px]">
        <span className="text-muted-foreground">{project.taskPrefix}: </span>
        {project.taskLabel}
      </div>
      <div className="mb-[9px] h-1 overflow-hidden rounded bg-muted">
        <div className={cn("h-full rounded transition-all", BAR[project.progressTone])} style={{ width: `${project.progress}%` }} />
      </div>
      <div className={cn("flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground", !readOnly && "mb-[15px]")}>
        <Clock className="h-3 w-3" /> {project.meta}
      </div>
      {aksi.length > 0 && (
        <div className="flex gap-2">
          {aksi.includes("command" as Project["actions"][number]) && (
            <button
              onClick={() => onCommand?.(project.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-primary/10 px-0 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Terminal className="h-3.5 w-3.5" /> Perintah
            </button>
          )}
          {aksi.includes("stop" as Project["actions"][number]) && (
            <button
              onClick={() => onStop?.(project.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-red-500/10 px-0 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20"
            >
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          )}
        </div>
      )}
    </article>
  );
}
