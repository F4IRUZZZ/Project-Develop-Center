"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useBahasa } from "@/components/shell/BahasaProvider";
import type { Kunci, Lang } from "@/lib/kamus";

interface StatusData {
  deploy: { repo: string; sha: string; waktu: string; status: string } | null;
  deployCatatan: string | null;
  bridge: { url: string; ok: boolean; latencyMs: number | null; galat: string | null };
  db: { latencyMs: number | null; sesi: number; event: number; feed: number; galat: string | null };
  repos: Array<{ repo_full: string; plugin_version: string | null; terakhir: string | null; basi: boolean }>;
  versiTerkini: string;
}

function Kartu({ judul, anak }: { judul: string; anak: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-[18px]">
      <h2 className="mb-3 text-[15px] font-semibold">{judul}</h2>
      {anak}
    </section>
  );
}

function waktuRelatif(iso: string | null, lang: Lang, teks: (k: Kunci) => string): string {
  if (!iso) return teks("status.belumPernahWaktu");
  const dtk = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (dtk < 60) return `${dtk} ${teks("notif.dtkLalu")}`;
  const mnt = Math.round(dtk / 60);
  if (mnt < 60) return `${mnt} ${teks("notif.mntLalu")}`;
  return new Date(iso).toLocaleString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Status() {
  const { data: session, status } = useSession();
  const { lang, teks } = useBahasa();
  const [data, setData] = useState<StatusData | null>(null);
  const [gagal, setGagal] = useState(false);

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData((await res.json()) as StatusData);
      setGagal(false);
    } catch {
      setGagal(true);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    void muat();
    const t = window.setInterval(muat, 30000);
    return () => window.clearInterval(t);
  }, [status, muat]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">{teks("shell.muatSesi")}</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-[17px] font-semibold tracking-tight">{teks("status.judul")}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">{teks("status.sub")}</p>
      {gagal && !data && (
        <p className="mt-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
          {teks("status.gagal")}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-4">
        <Kartu
          judul={teks("status.deployJudul")}
          anak={
            !data ? (
              <p className="font-mono text-xs text-muted-foreground">{teks("stat.muat")}</p>
            ) : data.deploy ? (
              <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
                <StatusBadge status={data.deploy.status === "success" ? "completed" : data.deploy.status === "failure" ? "failed" : "waiting"} label={data.deploy.status} />
                <span>{data.deploy.repo} · {data.deploy.sha}</span>
                <span className="text-muted-foreground">{waktuRelatif(data.deploy.waktu, lang, teks)}</span>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">{data.deployCatatan ?? teks("status.deployKosong")}</p>
            )
          }
        />
        <Kartu
          judul={teks("status.bridgeJudul")}
          anak={
            !data ? (
              <p className="font-mono text-xs text-muted-foreground">{teks("stat.muat")}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
                <StatusBadge status={data.bridge.ok ? "completed" : "failed"} label={data.bridge.ok ? teks("status.hidup") : teks("status.mati")} />
                <span className="truncate">{data.bridge.url}</span>
                {data.bridge.latencyMs !== null && <span className="text-muted-foreground">{data.bridge.latencyMs} ms</span>}
                {data.bridge.galat && <span className="text-red-500">{data.bridge.galat}</span>}
              </div>
            )
          }
        />
        <Kartu
          judul={teks("status.dbJudul")}
          anak={
            !data ? (
              <p className="font-mono text-xs text-muted-foreground">{teks("stat.muat")}</p>
            ) : data.db.galat ? (
              <p className="text-[13px] text-red-500">{data.db.galat}</p>
            ) : (
              <div className="font-mono text-[12px]">
                {data.db.latencyMs} ms · {data.db.sesi} sesi · {data.db.event} event · {data.db.feed} feed
              </div>
            )
          }
        />
        <Kartu
          judul={teks("status.pluginJudul").replace("{v}", data?.versiTerkini ?? "…")}
          anak={
            !data ? (
              <p className="font-mono text-xs text-muted-foreground">{teks("stat.muat")}</p>
            ) : data.repos.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{teks("status.pluginKosong")}</p>
            ) : (
              <div className="scroll-tipis max-h-[320px] overflow-y-auto pr-1">
                {data.repos.map((r) => (
                  <div key={r.repo_full} className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-b-0">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[12px]">{r.repo_full}</div>
                      <div className="font-mono text-[10.5px] text-muted-foreground">
                        {r.plugin_version ?? teks("status.tanpaVersi")} · {waktuRelatif(r.terakhir, lang, teks)}
                      </div>
                    </div>
                    <StatusBadge
                      status={!r.terakhir ? "idle" : r.basi ? "waiting" : "completed"}
                      label={!r.terakhir ? teks("status.belumPernah") : r.basi ? teks("status.basi") : teks("status.terkini")}
                    />
                  </div>
                ))}
              </div>
            )
          }
        />
      </div>
    </div>
  );
}
