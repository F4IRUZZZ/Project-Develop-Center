"use client";

import { Trash2 } from "lucide-react";
import { useBahasa } from "@/components/shell/BahasaProvider";

// Tombol hapus sesi (dipakai tab Sesi/Ringkasan + halaman Sesi global).
// Konfirmasi + DELETE diurus pemilik (ConfirmModal + handler masing-masing).
export function TombolHapusSesi({ onHapus }: { onHapus: () => void }) {
  const { teks } = useBahasa();
  return (
    <button
      title={teks("sesi.hapusSesi")}
      aria-label={teks("sesi.hapusSesi")}
      onClick={onHapus}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
