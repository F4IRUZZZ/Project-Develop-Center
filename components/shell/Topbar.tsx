import { Bell, Search } from "lucide-react";
import { PemilihTema } from "./PemilihTema";

export function Topbar() {
  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6">
      <div className="relative min-w-0 flex-1 sm:max-w-[300px] sm:flex-none sm:basis-[300px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full rounded-[9px] border border-border bg-muted py-2 pl-9 pr-3 text-[13px] text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          placeholder="Cari proyek, tugas, atau log…"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          aria-label="Notifikasi"
          className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="h-[17px] w-[17px]" />
        </button>
        <PemilihTema />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          AD
        </div>
      </div>
    </header>
  );
}
