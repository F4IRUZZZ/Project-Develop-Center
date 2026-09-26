import { Bell, Moon, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-border bg-card/85 px-6 backdrop-blur-md">
      <div className="relative w-[300px] max-w-[40vw]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full rounded-[9px] border border-border bg-muted py-2 pl-9 pr-3 text-[13px] text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          placeholder="Cari proyek, tugas, atau log…"
        />
      </div>
      <div className="flex items-center gap-2.5">
        <button
          aria-label="Notifikasi"
          className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="h-[17px] w-[17px]" />
        </button>
        <button
          aria-label="Tema"
          className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
        >
          <Moon className="h-[17px] w-[17px]" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          AD
        </div>
      </div>
    </header>
  );
}
