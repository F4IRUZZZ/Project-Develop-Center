"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, BellOff, CheckCheck, CircleCheck, GitPullRequest, TriangleAlert } from "lucide-react";
import { EVENT_NOTIF, fetchNotifikasi, siarNotifikasi, tandaiDibaca, type Notifikasi } from "@/lib/notifikasi";
import { NotifBadge } from "./NotifBadge";
import { useBahasa } from "./BahasaProvider";
import type { Kunci, Lang } from "@/lib/kamus";
import { cn } from "@/lib/utils";

function waktuRelatif(iso: string, lang: Lang, teks: (k: Kunci) => string): string {
  const dtk = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (dtk < 60) return `${dtk} ${teks("notif.dtkLalu")}`;
  const mnt = Math.floor(dtk / 60);
  if (mnt < 60) return `${mnt} ${teks("notif.mntLalu")}`;
  const jam = Math.floor(mnt / 60);
  if (jam < 24) return `${jam} ${teks("notif.jamLalu")}`;
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" });
}

// Panel cepat notifikasi di lonceng Topbar (#229): dropdown ringkas ganti
// navigasi langsung, sidebar tetap ke halaman penuh. Fetch hanya saat panel
// dibuka + dengar EVENT_NOTIF agar badge/halaman sinkron tanpa polling ganda.
export function PanelNotifikasi() {
  const { status } = useSession();
  const { lang, teks } = useBahasa();
  const [buka, setBuka] = useState(false);
  const [items, setItems] = useState<Notifikasi[] | null>(null);
  const [gagal, setGagal] = useState(false);
  const [gagalTandai, setGagalTandai] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tombolRef = useRef<HTMLButtonElement>(null);

  const muat = useCallback(() => {
    fetchNotifikasi()
      .then((rows) => {
        setItems(rows);
        setGagal(false);
      })
      .catch(() => setGagal(true));
  }, []);

  useEffect(() => {
    if (!buka || status !== "authenticated") return;
    setItems(null);
    setGagal(false);
    muat();
    window.addEventListener(EVENT_NOTIF, muat);
    return () => window.removeEventListener(EVENT_NOTIF, muat);
  }, [buka, status, muat]);

  useEffect(() => {
    if (!buka) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setBuka(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBuka(false);
        tombolRef.current?.focus();
      }
    };
    window.addEventListener("mousedown", fn);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", fn);
      window.removeEventListener("keydown", esc);
    };
  }, [buka ]);

  // Tandai optimistis + rollback (#231): status dibaca berubah seketika,
  // gagal API mengembalikan state + pesan, refetch via event meluruskan akhir.
  const tandai = async (id?: string) => {
    const sebelum = items;
    setGagalTandai(false);
    if (sebelum) setItems(sebelum.map((e) => (!id || e.id === id ? { ...e, dibaca: true } : e)));
    try {
      await tandaiDibaca(id);
    } catch {
      setItems(sebelum);
      setGagalTandai(true);
    }
    siarNotifikasi();
  };

  const tampil = (items ?? []).slice(0, 5);
  const belum = items?.filter((e) => !e.dibaca).length ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        ref={tombolRef}
        onClick={() => setBuka((v) => !v)}
        aria-label={teks("nav.notifikasi")}
        aria-expanded={buka}
        aria-haspopup="dialog"
        className="relative flex h-11 w-11 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-[17px] w-[17px]" />
        <span className="absolute -right-1 -top-1">
          <NotifBadge className="" />
        </span>
      </button>

      {buka && (
        <div role="dialog" aria-label={teks("notif.panelJudul")} className="fixed inset-x-3 top-[64px] z-50 rounded-2xl border border-border bg-card shadow-[0_12px_32px_rgba(0,0,0,0.45)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[360px]">
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <h2 className="text-[15px] font-semibold tracking-tight">{teks("notif.panelJudul")}</h2>
            {belum > 0 && (
              <button
                onClick={() => void tandai()}
                className="flex min-h-11 items-center gap-1.5 rounded-[9px] px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" /> {teks("notif.tandaiSemua")}
              </button>
            )}
          </div>
          {gagalTandai && (
            <p role="alert" className="px-4 pb-1 text-[12px] text-red-500">
              {teks("notif.gagalTandai")}
            </p>
          )}

          {status !== "authenticated" ? (
            <p className="px-4 pb-5 pt-2 text-center text-[13px] text-muted-foreground">{teks("notif.masukDulu")}</p>
          ) : gagal ? (
            <div className="px-4 pb-4">
              <p className="py-4 text-center text-[13px] text-muted-foreground">{teks("notif.gagal")}</p>
              <button
                onClick={() => muat()}
                className="flex min-h-11 w-full items-center justify-center rounded-[9px] bg-primary/10 px-3 text-[13px] font-medium text-primary hover:bg-primary/20"
              >
                {teks("notif.cobaLagi")}
              </button>
            </div>
          ) : !items ? (
            <div className="space-y-2 px-4 pb-4 pt-2" aria-live="polite">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-[9px] bg-muted" />
              ))}
            </div>
          ) : tampil.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 pb-6 pt-2 text-center">
              <BellOff className="h-6 w-6 text-muted-foreground" />
              <div className="text-[13px] font-semibold">{teks("notif.kosongJudul")}</div>
            </div>
          ) : (
            <div className="max-h-[50dvh] overflow-y-auto px-2 pb-1">
              {tampil.map((e) => {
                const pr = e.type === "pr";
                const selesai = e.type === "info";
                return (
                  <div key={e.id} className={cn("flex gap-2.5 rounded-[9px] px-2 py-2.5", e.dibaca && "opacity-55")}>
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        pr ? "bg-amber-500/10 text-amber-500" : selesai ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {pr ? <GitPullRequest className="h-3.5 w-3.5" /> : selesai ? <CircleCheck className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[12.5px] leading-snug">
                        {e.message} <b className="font-semibold">{e.repo_name}</b>
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground">
                        <span suppressHydrationWarning>{waktuRelatif(e.created_at, lang, teks)}</span>
                        {!e.dibaca && (
                          <button
                            onClick={() => void tandai(e.id)}
                            className="flex min-h-11 items-center rounded-full bg-primary/10 px-2.5 font-sans text-[10px] font-medium text-primary hover:bg-primary/20"
                          >
                            {teks("notif.tandai")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/notifikasi"
            onClick={() => setBuka(false)}
            className="mx-4 mb-3 mt-1 flex min-h-11 items-center justify-center rounded-[9px] bg-primary/10 text-[13px] font-medium text-primary hover:bg-primary/20"
          >
            {teks("notif.lihatSemua")}
          </Link>
        </div>
      )}
    </div>
  );
}
