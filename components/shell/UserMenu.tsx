"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Props {
  nama: string;
  inisial: string;
  gambar?: string | null;
}

export function UserMenu({ nama, inisial, gambar }: Props) {
  const [buka, setBuka] = useState(false);
  const [tanyaKeluar, setTanyaKeluar] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setBuka(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    window.addEventListener("mousedown", fn);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", fn);
      window.removeEventListener("keydown", esc);
    };
  }, [buka ]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setBuka((v) => !v)}
        aria-label="Menu pengguna"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        {gambar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gambar} alt={nama} className="h-full w-full object-cover" />
        ) : (
          inisial
        )}
      </button>

      {buka && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-[14px] border border-border bg-card p-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <div className="truncate px-2.5 py-2 text-[13px] font-medium">{nama}</div>
          <Link
            href="/pengaturan"
            onClick={() => setBuka(false)}
            className="flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" /> Pengaturan
          </Link>
          <button
            onClick={() => {
              setBuka(false);
              setTanyaKeluar(true);
            }}
            className="flex w-full items-center gap-2 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      )}

      <ConfirmModal
        open={tanyaKeluar}
        judul="Keluar dari PDC?"
        pesan="Sesi GitHub-mu di perangkat ini diakhiri. Antrian dan data di database tetap aman."
        labelKonfirmasi="Ya, keluar"
        onKonfirmasi={() => void signOut()}
        onBatal={() => setTanyaKeluar(false)}
      />
    </div>
  );
}
