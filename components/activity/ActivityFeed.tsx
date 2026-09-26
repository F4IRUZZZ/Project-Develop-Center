import { Check, GitCommitHorizontal, GitPullRequest, RefreshCw, Rss } from "lucide-react";
import { activityFeed } from "@/lib/mock";
import type { ActivityEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICO: Record<ActivityEvent["type"], { icon: typeof Check; tone: string }> = {
  working: { icon: RefreshCw, tone: "bg-sky-500/10 text-sky-500" },
  waiting: { icon: GitPullRequest, tone: "bg-amber-500/10 text-amber-500" },
  success: { icon: Check, tone: "bg-emerald-500/10 text-emerald-500" },
  idle: { icon: GitCommitHorizontal, tone: "bg-muted text-muted-foreground" },
};

export function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-border bg-card p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-semibold">Activity Feed</div>
        <Rss className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        {activityFeed.map((e) => {
          const c = ICO[e.type];
          return (
            <div
              key={e.id}
              className="flex gap-2.5 border-b border-border py-2.5 transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  c.tone
                )}
              >
                <c.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] leading-snug">
                  <b className="font-semibold">{e.message.split(" — ")[0]}</b>
                  {" — "}
                  {e.message.split(" — ")[1]} di <b className="font-semibold">{e.projectName}</b>
                </div>
                <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{e.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
