"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Star, Users, UserPlus, BookMarked, RefreshCw } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { useBahasa } from "@/components/shell/BahasaProvider";
import type { Kunci, Lang } from "@/lib/kamus";
import type { StatsGitHub } from "@/lib/github-stats";

function waktuRelatif(iso: string, teks: (k: Kunci) => string): string {
  const mnt = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mnt < 1) return teks("profil.baruSaja");
  return teks("profil.mntLalu").replace("{n}", String(mnt));
}

export default function Profil() {
  const { data: session, status } = useSession();
  const { lang, teks } = useBahasa();
  const [data, setData] = useState<StatsGitHub | null>(null);
  const [galat, setGalat] = useState(false);
  const [segar, setSegar] = useState(false);

  const muat = useCallback((paksaSegar: boolean) => {
    setGalat(false);
    setSegar(paksaSegar);
    fetch(paksaSegar ? "/api/github/stats?segar=1" : "/api/github/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d as StatsGitHub))
      .catch(() => setGalat(true))
      .finally(() => setSegar(false));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    muat(false);
  }, [status, muat]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">{teks("shell.muatSesi")}</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight">{teks("profil.judul")}</h2>
        <button
          onClick={() => muat(true)}
          disabled={segar}
          className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${segar ? "animate-spin" : ""}`} />
          {teks(segar ? "profil.menyegar" : "profil.segarkan")}
        </button>
      </div>

      {galat ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
          <div className="text-[15px] font-semibold">{teks("stat.gagalJudul")}</div>
          <p className="max-w-xs text-[13px] text-muted-foreground">{teks("stat.gagalSub")}</p>
          <button
            onClick={() => muat(false)}
            className="rounded-[9px] border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {teks("stat.cobaLagi")}
          </button>
        </div>
      ) : !data ? (
        <p className="font-mono text-xs text-muted-foreground">{teks("stat.muat")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-[18px]">
            <div className="flex items-start gap-4">
              {data.avatar ? (
                <Image
                  src={data.avatar}
                  alt={data.login}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
                  {(data.login || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[19px] font-semibold tracking-tight">{data.nama || data.login}</div>
                <Link
                  href={`https://github.com/${data.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[13px] text-primary hover:underline"
                >
                  @{data.login}
                </Link>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{data.bio || teks("profil.bioKosong")}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-[13px]">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <strong className="font-semibold">{data.pengikut}</strong>
                <span className="text-muted-foreground">{teks("profil.pengikut")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <strong className="font-semibold">{data.mengikuti}</strong>
                <span className="text-muted-foreground">{teks("profil.mengikuti")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <BookMarked className="h-4 w-4 text-muted-foreground" />
                <strong className="font-semibold">{data.totalRepo}</strong>
                <span className="text-muted-foreground">{teks("profil.repo")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-muted-foreground" />
                <strong className="font-semibold">{data.bintang}</strong>
                <span className="text-muted-foreground">{teks("stat.bintang")}</span>
              </span>
            </div>
            <p className="mt-3 font-mono text-[10.5px] text-muted-foreground">
              {teks("profil.definisiBintang").replace("{n}", String(data.totalRepo))} ·{" "}
              {teks("profil.diperbarui").replace("{w}", waktuRelatif(data.diperbarui, teks))}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-[18px]">
            <div className="mb-3 text-[15px] font-semibold">{teks("profil.repoTop")}</div>
            {data.repoTop.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{teks("profil.repoKosong")}</p>
            ) : (
              <div className="flex flex-col">
                {data.repoTop.map((r) => (
                  <Link
                    key={r.nama}
                    href={`https://github.com/${data.login}/${r.nama}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 border-b border-border py-2 text-[13px] last:border-0 hover:text-primary"
                  >
                    <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {r.nama}
                      {r.fork && <span className="ml-1.5 font-mono text-[10.5px] text-muted-foreground">{teks("profil.fork")}</span>}
                    </span>
                    {r.bahasa && (
                      <span className="hidden shrink-0 text-[12px] text-muted-foreground sm:inline">{r.bahasa}</span>
                    )}
                    <span className="shrink-0 font-mono text-[12px] text-muted-foreground">{r.bintang}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/statistik"
            className="rounded-2xl border border-border bg-card p-[18px] text-[13px] font-medium text-primary hover:underline"
          >
            {teks("profil.lihatStatistik")} →
          </Link>
        </div>
      )}
    </div>
  );
}
