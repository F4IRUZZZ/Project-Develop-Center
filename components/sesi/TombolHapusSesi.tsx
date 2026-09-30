"use client";

import { Trash2 } from "lucide-react";

// Tombol hapus sesi (dipakai tab Sesi/Ringkasan + halaman Sesi global).
// Konfirmasi + DELETE diurus pemilik (ConfirmModal + handler masing-masing).
export function TombolHapusSesi({ onHapus }: { onHapus: () => void }) {
  return (
    <button
      title="Hapus sesi"
      aria-label="Hapus sesi"
      onClick={onHapus}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
