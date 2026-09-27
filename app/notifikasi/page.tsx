"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BellOff, GitPullRequest, TriangleAlert } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { fetchPenting, type ActivityMentah } from "@/lib/notifikasi";
import { cn } from "@/lib/utils";

function waktuRelatif(iso: string): string {
  const dtk = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (dtk < 60) return `${dtk} dtk lalu`;
  const mnt = Math.round(dtk / 60);
  if (mnt < 60) return `${mnt} mnt lalu`;
  const jam = Math.round(mnt / 60);
  if (jam < 24) return `${jam} jam lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function Notifikasi() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<ActivityMentah[] | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchPenting()
      .then(setItems)
      .catch(() => setItems([]));
  }, [status]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <h2 className="mb-1 text-[17px] font-semibold tracking-tight">
        Notifikasi {items && items.length > 0 && <span className="font-mono text-xs font-normal text-muted-foreground">({items.length})</span>}
      </h2>
      <p className="mb-6 text-[13px] text-muted-foreground">PR dan error 24 jam terakhir dari semua proyek.</p>

      {!items ? (
        <p className="font-mono text-xs text-muted-foreground">Memuat…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground" />
          <div className="text-[15px] font-semibold">Tidak ada notifikasi</div>
          <p className="max-w-xs text-[13px] text-muted-foreground">
            Semua tenang. PR baru dan error AI akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {items.map((e) => {
            const pr = e.type === "pr";
            return (
              <div key={e.id} className="flex gap-2.5 border-b border-border py-2.5 last:border-b-0">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    pr ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                  )}
                >
                  {pr ? <GitPullRequest className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] leading-snug">
                    {e.message} <b className="font-semibold">{e.repo_name ?? e.project_id}</b>
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{waktuRelatif(e.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
