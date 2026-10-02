"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, GitCommitHorizontal, GitPullRequest, RefreshCw, Rss } from "lucide-react";
import { useBahasa } from "@/components/shell/BahasaProvider";
import type { Kunci, Lang } from "@/lib/kamus";
import type { ActivityEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICO: Record<ActivityEvent["type"], { icon: typeof Check; tone: string }> = {
  working: { icon: RefreshCw, tone: "bg-sky-500/10 text-sky-500" },
  waiting: { icon: GitPullRequest, tone: "bg-amber-500/10 text-amber-500" },
  success: { icon: Check, tone: "bg-emerald-500/10 text-emerald-500" },
  idle: { icon: GitCommitHorizontal, tone: "bg-muted text-muted-foreground" },
};

function waktuRelatif(iso: string, lang: Lang, teks: (k: Kunci) => string): string {
  const dtk = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (dtk < 60) return `${dtk} ${teks("notif.dtkLalu")}`;
  const mnt = Math.round(dtk / 60);
  if (mnt < 60) return `${mnt} ${teks("notif.mntLalu")}`;
  const jam = Math.round(mnt / 60);
  if (jam < 24) return `${jam} ${teks("notif.jamLalu")}`;
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" });
}

export function ActivityFeed() {
  const { status } = useSession();
  const { lang, teks } = useBahasa();
  const [live, setLive] = useState<ActivityEvent[] | null>(null);

  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (status !== "authenticated") setLive(null);
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    let batal = false;
    const poll = () => {
      fetch("/api/activity", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          if (!batal) setLive(d as ActivityEvent[]);
        })
        .catch(() => {});
    };
    const t0 = window.setTimeout(poll, 0);
    const t = window.setInterval(poll, 5000);
    return () => {
      batal = true;
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, [status]);

  // Jujur: tanpa data = daftar kosong + empty-state, bukan mock.
  const items: ActivityEvent[] = live ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-semibold">{teks("feed.judul")}</div>
        <Rss className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="scroll-tipis max-h-[520px] overflow-y-auto pr-1">
        {items.length === 0 && (
          <p className="text-[13px] text-muted-foreground">{teks("feed.kosong")}</p>
        )}
        {items.map((e) => {
          const c = ICO[e.type];
          const parts = e.message.split(" — ");
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
                  {parts.length > 1 ? (
                    <>
                      <b className="font-semibold">{parts[0]}</b> — {parts[1]} {teks("feed.di")}{" "}
                      <b className="font-semibold">{e.projectName}</b>
                    </>
                  ) : (
                    <>
                      {e.message} <b className="font-semibold">{e.projectName}</b>
                    </>
                  )}
                </div>
                <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                  {e.time.includes("T") ? waktuRelatif(e.time, lang, teks) : e.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
