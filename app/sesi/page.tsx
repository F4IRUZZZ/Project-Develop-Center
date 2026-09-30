"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { TombolHapusSesi } from "@/components/sesi/TombolHapusSesi";
import { sesiSegar } from "@/lib/sesi";
import { cn } from "@/lib/utils";

interface SesiGlobal {
  session_id: string;
  project_id: string | null;
  repo_full: string | null;
  mode: string;
  status: string;
  started_at: string;
  last_seen_at: string;
  ringkasan_terakhir: string | null;
  ringkasan_waktu: string | null;
  ended_at: string | null;
  aktivitas?: {
    kerja: string;
    hening_mnt: number | null;
    file_terakhir: string[];
    komit_terakhir: {
      sha: string | null;
      files_changed: number | null;
      lines_added: number | null;
      lines_removed: number | null;
    } | null;
  };
}

type Filter = "aktif" | "semua";

export default function SesiGlobal() {
  const { data: session, status } = useSession();
  const [daftar, setDaftar] = useState<SesiGlobal[]>([]);
  const [namaRepo, setNamaRepo] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("aktif");
  const [tanyaHapus, setTanyaHapus] = useState<string | null>(null);
  const [galatHapus, setGalatHapus] = useState(false);

  const muat = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        fetch("/api/sessions", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/dashboard", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setDaftar(s as SesiGlobal[]);
      const peta: Record<string, string> = {};
      for (const p of d as Array<{ id: string; repoName: string }>) peta[String(p.id)] = p.repoName;
      setNamaRepo(peta);
    } catch {
      /* abaikan */
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    void muat();
    const t = window.setInterval(muat, 10000);
    return () => window.clearInterval(t);
  }, [status, muat]);

  const hapus = async () => {
    if (!tanyaHapus) return;
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: tanyaHapus }),
      });
      if (!res.ok) {
        setGalatHapus(true);
        return;
      }
    } catch {
      setGalatHapus(true);
      return;
    }
    setTanyaHapus(null);
    setGalatHapus(false);
    await muat();
  };

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  const tampil = daftar.filter((s) => (filter === "aktif" ? sesiSegar(s) : true));
  const nama = (s: SesiGlobal) =>
    (s.project_id && namaRepo[s.project_id]) || s.repo_full || "tanpa proyek";

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-[17px] font-semibold tracking-tight">Sesi AI</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Semua sesi OpenCode lintas repo. Baris feed riwayat tidak ikut terhapus.
      </p>
      <div className="mb-4 mt-4 flex gap-2">
        {(["aktif", "semua"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-[9px] px-4 py-2 text-[13px] font-medium capitalize transition-colors",
              filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f === "aktif" ? `Aktif (${daftar.filter(sesiSegar).length})` : `Semua (${daftar.length})`}
          </button>
        ))}
      </div>
      <div className="scroll-tipis max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-card p-[18px]">
        {tampil.length === 0 && (
          <p className="text-[13px] text-muted-foreground">
            {filter === "aktif" ? "Tidak ada sesi AI aktif di repo mana pun." : "Belum ada sesi tercatat."}
          </p>
        )}
        {tampil.map((s) => (
          <div key={s.session_id} className="border-b border-border py-2.5 last:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                {s.project_id ? (
                  <Link
                    href={`/proyek/${s.project_id}`}
                    className="text-[13px] font-semibold hover:text-primary hover:underline"
                  >
                    {nama(s)}
                  </Link>
                ) : (
                  <span className="text-[13px] font-semibold">{nama(s)}</span>
                )}
                <div className="font-mono text-[10.5px] text-muted-foreground">
                  {s.session_id.slice(0, 8)}… · {s.mode}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <StatusBadge
                  status={sesiSegar(s) ? "working" : s.status === "error" ? "failed" : "idle"}
                  label={s.ended_at ? "Selesai" : sesiSegar(s) ? (s.aktivitas?.kerja === "bekerja" ? "Bekerja" : "Aktif") : "Nonaktif"}
                />
                <TombolHapusSesi onHapus={() => { setGalatHapus(false); setTanyaHapus(s.session_id); }} />
              </div>
            </div>
            {s.ringkasan_terakhir && (
              <p className="mt-1 truncate text-[12px] text-foreground/80" title={s.ringkasan_terakhir}>
                {s.ringkasan_terakhir}
              </p>
            )}
          </div>
        ))}
      </div>
      <ConfirmModal
        open={tanyaHapus !== null}
        judul="Hapus sesi ini?"
        pesan={galatHapus ? "Gagal menghapus (server menolak). Coba lagi." : `Sesi ${tanyaHapus?.slice(0, 8)}… dihapus dari daftar (jejak file ikut terhapus; feed riwayat tetap).`}
        labelKonfirmasi="Ya, hapus"
        danger
        onKonfirmasi={() => void hapus()}
        onBatal={() => { setTanyaHapus(null); setGalatHapus(false); }}
      />
    </div>
  );
}
