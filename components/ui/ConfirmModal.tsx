"use client";

import { useEffect } from "react";
import { TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  judul: string;
  pesan: string;
  labelKonfirmasi?: string;
  danger?: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

// Modal konfirmasi ala PDC (gaya CommandModal). Aturan: JANGAN pakai dialog
// bawaan browser — semua validasi lewat komponen ini.
export function ConfirmModal({
  open,
  judul,
  pesan,
  labelKonfirmasi = "Ya, lanjutkan",
  danger,
  onKonfirmasi,
  onBatal,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBatal();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onBatal]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[5px]"
      onClick={onBatal}
      role="alertdialog"
      aria-modal="true"
      aria-label={judul}
    >
      <div
        className="w-full max-w-[400px] rounded-[20px] border border-[#34344A] bg-card p-6 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                danger ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
              )}
            >
              <TriangleAlert className="h-[18px] w-[18px]" />
            </div>
            <div className="text-[16px] font-semibold">{judul}</div>
          </div>
          <button
            onClick={onBatal}
            aria-label="Tutup"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">{pesan}</p>

        <div className="flex justify-end gap-2.5">
          <button
            onClick={onBatal}
            className="rounded-[9px] border border-border bg-transparent px-[18px] py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Batal
          </button>
          <button
            onClick={onKonfirmasi}
            className={cn(
              "rounded-[9px] px-[18px] py-2 text-xs font-medium text-white",
              danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-[#5457E5]"
            )}
          >
            {labelKonfirmasi}
          </button>
        </div>
      </div>
    </div>
  );
}
