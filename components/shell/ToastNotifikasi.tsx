"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { dengarPeringatan, type Peringatan } from "@/lib/peringatan";
import { useBahasa } from "./BahasaProvider";
import { cn } from "@/lib/utils";

// Tumpukan toast peringatan (kanan-bawah desktop, atas HP). Klik = buka
// /notifikasi. Auto-hilang 6 detik.
export function ToastNotifikasi() {
  const { teks } = useBahasa();
  const router = useRouter();
  const [daftar, setDaftar] = useState<Peringatan[]>([]);

  useEffect(() => {
    const timer = new Map<string, number>();
    const lepas = dengarPeringatan((p) => {
      setDaftar((d) => (d.some((x) => x.id === p.id) ? d : [...d.slice(-2), p]));
      if (typeof window !== "undefined") {
        timer.set(
          p.id,
          window.setTimeout(() => {
            setDaftar((d) => d.filter((x) => x.id !== p.id));
          }, 6000)
        );
      }
    });
    return () => {
      lepas();
      timer.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (daftar.length === 0) return null;
  return (
    <div className="fixed inset-x-3 top-[66px] z-[9997] flex flex-col gap-2 sm:left-auto sm:right-4 sm:top-auto sm:bottom-4 sm:w-[340px]">
      {daftar.map((p) => (
        <div
          key={p.id}
          role="alert"
          className={cn(
            "flex items-start gap-2.5 rounded-[14px] border border-border bg-card p-3.5",
            "shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
              p.jenis === "gagal" ? "bg-red-500/10 text-red-500" : p.jenis === "selesai" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            )}
          >
            <BellRing className="h-4 w-4" />
          </div>
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => {
              setDaftar((d) => d.filter((x) => x.id !== p.id));
              router.push("/notifikasi");
            }}
          >
            <div className="text-[13px] font-semibold">{p.judul}</div>
            <div className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{p.pesan}</div>
            <div className="mt-1 text-[11px] font-medium text-primary">{teks("notifToast.lihat")} →</div>
          </button>
          <button
            onClick={() => setDaftar((d) => d.filter((x) => x.id !== p.id))}
            aria-label={teks("modal.tutup")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
