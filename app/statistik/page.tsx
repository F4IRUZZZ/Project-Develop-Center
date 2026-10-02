"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Flame } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import type { StatsGitHub } from "@/lib/github-stats";

function fmtTanggal(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function Statistik() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<StatsGitHub | null>(null);
  const [galat, setGalat] = useState(false);

  const muat = useCallback(() => {
    setGalat(false);
    fetch("/api/github/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d as StatsGitHub))
      .catch(() => setGalat(true));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    muat();
  }, [status, muat]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <h2 className="mb-1 text-[17px] font-semibold tracking-tight">Statistik GitHub</h2>
      <p className="mb-6 text-[13px] text-muted-foreground">
        {data ? `Akun ${data.login} · setahun terakhir` : "Streak, kontribusi, dan bahasa setahun terakhir."}
      </p>

      {galat ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
          <div className="text-[15px] font-semibold">Gagal memuat statistik</div>
          <p className="max-w-xs text-[13px] text-muted-foreground">
            GitHub tidak menjawab atau token kedaluwarsa. Coba lagi atau login ulang.
          </p>
          <button
            onClick={muat}
            className="rounded-[9px] border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Coba lagi
          </button>
        </div>
      ) : !data ? (
        <p className="font-mono text-xs text-muted-foreground">Memuat…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card p-[18px] text-center">
            <div>
              <div className="text-[26px] font-bold text-primary">{data.streak.total}</div>
              <div className="mt-1 text-[12.5px] font-medium">Total Kontribusi</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                {fmtTanggal(data.streak.mulai)} - {fmtTanggal(data.streak.sampai)}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-[26px] font-bold text-primary">
                <Flame className="h-5 w-5 text-orange-500" />
                {data.streak.kini}
              </div>
              <div className="mt-1 text-[12.5px] font-medium">Streak Kini (hari)</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">tanpa jeda</div>
            </div>
            <div>
              <div className="text-[26px] font-bold text-primary">{data.streak.terpanjang}</div>
              <div className="mt-1 text-[12.5px] font-medium">Streak Terpanjang</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">hari berturut</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Bintang", nilai: data.bintang },
              { label: "Commit", nilai: data.commitSetahun },
              { label: "Pull Request", nilai: data.pr },
              { label: "Issue", nilai: data.issue },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className="text-[22px] font-bold text-primary">{s.nilai}</div>
                <div className="mt-1 text-[12px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-[18px]">
            <div className="mb-3 text-[15px] font-semibold">Bahasa Teratas</div>
            {data.bahasa.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Belum ada data bahasa.</p>
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
        </div>
      )}
    </div>
  );
}
