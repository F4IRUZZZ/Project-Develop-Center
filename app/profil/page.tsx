"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Star, Users, UserPlus, BookMarked, RefreshCw, Flame, GitFork } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { useBahasa } from "@/components/shell/BahasaProvider";
import type { Kunci } from "@/lib/kamus";
import type { StatsGitHub } from "@/lib/github-stats";
import type { Analitik } from "@/app/api/stats/analytics/route";

function waktuRelatif(iso: string, teks: (k: Kunci) => string): string {
  const mnt = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mnt < 1) return teks("profil.baruSaja");
  return teks("profil.mntLalu").replace("{n}", String(mnt));
}

function fmtTanggal(iso: string | null, en: boolean, teks: (k: Kunci) => string): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString(en ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtWaktu(iso: string, en: boolean): string {
  return new Date(iso).toLocaleDateString(en ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Profil() {
  const { data: session, status } = useSession();
  const { lang, teks } = useBahasa();
  const en = lang === "en";
  const [data, setData] = useState<StatsGitHub | null>(null);
  const [ana, setAna] = useState<Analitik | null>(null);
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
    fetch("/api/stats/analytics", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setAna(d as Analitik))
      .catch(() => {});
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
                <strong className="font-semibold">{data.bintangDiberi}</strong>
                <span className="text-muted-foreground">{teks("profil.bintangDiberi")}</span>
              </span>
            </div>
            <p className="mt-3 font-mono text-[10.5px] text-muted-foreground">
              {teks("profil.diperbarui").replace("{w}", waktuRelatif(data.diperbarui, teks))}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-[18px]">
            <div className="mb-1 text-[15px] font-semibold">{teks("profil.repoBintang")}</div>
            <p className="mb-3 text-[12px] text-muted-foreground">{teks("profil.repoBintangSub")}</p>
            {data.repoBintang.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{teks("profil.repoBintangKosong")}</p>
            ) : (
              <div className="flex flex-col">
                {data.repoBintang.map((r) => (
                  <div key={r.url} className="border-b border-border py-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 text-[14px] font-medium text-primary hover:underline"
                      >
                        {r.pemilik} / <strong>{r.nama}</strong>
                      </Link>
                      <span className="flex shrink-0 items-center gap-1 rounded-[7px] border border-border px-2 py-1 font-mono text-[10.5px] text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-500" /> {teks("profil.sudahBintang")}
                      </span>
                    </div>
                    {r.deskripsi && <p className="mt-1 text-[12.5px] text-muted-foreground">{r.deskripsi}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                      {r.bahasa && (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: r.warnaBahasa ?? "#6366f1" }}
                          />
                          {r.bahasa}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" /> {r.bintang.toLocaleString(en ? "en-US" : "id-ID")}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-3.5 w-3.5" /> {r.fork.toLocaleString(en ? "en-US" : "id-ID")}
                      </span>
                      <span className="font-mono text-[11px]">
                        {teks("profil.diperbaruiRepo").replace("{w}", fmtWaktu(r.diperbarui, en))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card p-[18px] text-center">
            <div>
              <div className="text-[26px] font-bold text-primary">{data.streak.total}</div>
              <div className="mt-1 text-[12.5px] font-medium">{teks("stat.total")}</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground" suppressHydrationWarning>
                {fmtTanggal(data.streak.mulai, en, teks)} - {fmtTanggal(data.streak.sampai, en, teks)}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-[26px] font-bold text-primary">
                <Flame className="h-5 w-5 text-orange-500" />
                {data.streak.kini}
              </div>
              <div className="mt-1 text-[12.5px] font-medium">{teks("stat.kini")}</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground" suppressHydrationWarning>
                {data.streak.kini > 0
                  ? `${fmtTanggal(data.streak.kiniMulai, en, teks)} - ${fmtTanggal(data.streak.kiniSampai, en, teks)}`
                  : teks("stat.belumMulai")}
              </div>
            </div>
            <div>
              <div className="text-[26px] font-bold text-primary">{data.streak.terpanjang}</div>
              <div className="mt-1 text-[12.5px] font-medium">{teks("stat.terpanjang")}</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground" suppressHydrationWarning>
                {data.streak.terpanjang > 0
                  ? `${fmtTanggal(data.streak.panjangMulai, en, teks)} - ${fmtTanggal(data.streak.panjangSampai, en, teks)}`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { kunci: "stat.commit" as const, nilai: data.commitSetahun },
              { kunci: "stat.pr" as const, nilai: data.pr },
              { kunci: "stat.issue" as const, nilai: data.issue },
            ].map((s) => (
              <div key={s.kunci} className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className="text-[22px] font-bold text-primary">{s.nilai}</div>
                <div className="mt-1 text-[12px] text-muted-foreground">{teks(s.kunci)}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-[18px]">
            <div className="mb-3 text-[15px] font-semibold">{teks("stat.bahasa")}</div>
            {data.bahasa.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{teks("stat.bahasaKosong")}</p>
            ) : (
              <>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  {data.bahasa.map((b) => (
                    <div
                      key={b.nama}
                      title={`${b.nama} ${b.persen.toFixed(1)}%`}
                      style={{ width: `${b.persen}%`, backgroundColor: b.warna ?? "#6366f1" }}
                      className="h-full"
                    />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {data.bahasa.map((b) => (
                    <div key={b.nama} className="flex items-center gap-2 text-[12.5px]">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: b.warna ?? "#6366f1" }}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">{b.nama}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{b.persen.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-[18px]">
            <div className="mb-3 text-[15px] font-semibold">{teks("stat.anaJudul")}</div>
            {!ana || (ana.totalSelesai === 0 && ana.perMinggu.length === 0 && ana.repoTersibuk.length === 0) ? (
              <p className="text-[13px] text-muted-foreground">{teks("stat.anaKosong")}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-[22px] font-bold text-primary">{ana.totalSelesai}</div>
                    <div className="mt-1 text-[12px] text-muted-foreground">{teks("stat.anaSelesai")}</div>
                  </div>
                  <div>
                    <div className="text-[22px] font-bold text-primary">
                      {ana.rataMenit === null ? "—" : teks("stat.anaMenit").replace("{n}", String(Math.round(ana.rataMenit)))}
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground">{teks("stat.anaRata")}</div>
                  </div>
                  <div>
                    <div className="text-[22px] font-bold text-primary">{(ana.errorRate * 100).toFixed(0)}%</div>
                    <div className="mt-1 text-[12px] text-muted-foreground">{teks("stat.anaError")}</div>
                  </div>
                </div>
                {ana.perMinggu.length > 0 && (
                  <div className="mt-4 flex h-20 items-end gap-1.5">
                    {ana.perMinggu.map((m) => {
                      const maks = Math.max(1, ...ana.perMinggu.map((x) => x.selesai + x.gagal));
                      const tinggi = Math.max(6, Math.round(((m.selesai + m.gagal) / maks) * 72));
                      return (
                        <div
                          key={m.minggu}
                          title={`${m.minggu}: ${m.selesai} / ${m.gagal}`}
                          style={{ height: `${tinggi}px` }}
                          className="min-w-0 flex-1 rounded-sm bg-primary/70"
                        />
                      );
                    })}
                  </div>
                )}
                {ana.repoTersibuk.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-[12.5px] font-semibold">{teks("stat.anaRepo")}</div>
                    {ana.repoTersibuk.map((r) => (
                      <div key={r.repo} className="flex items-center justify-between gap-2 py-1 text-[12.5px]">
                        <span className="min-w-0 flex-1 truncate font-medium">{r.repo}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{r.n}</span>
                      </div>
                    ))}
                  </div>
                )}
                {ana.jamTersibuk !== null && (
                  <div className="mt-3 font-mono text-[11px] text-muted-foreground">
                    {teks("stat.anaJam")}: {String(ana.jamTersibuk).padStart(2, "0")}:00
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
