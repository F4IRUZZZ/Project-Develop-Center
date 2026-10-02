"use client";

import { Activity, Bell, ChartColumn, FolderGit2, HeartPulse, History, LayoutDashboard, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { PemilihTema } from "./PemilihTema";
import { NotifBadge } from "./NotifBadge";
import { useBahasa } from "./BahasaProvider";
import type { Kunci } from "@/lib/kamus";
import { UserMenu } from "./UserMenu";
import { SearchBox } from "./SearchBox";
import { cn } from "@/lib/utils";

const DRAWER: Array<{ kunci: Kunci; icon: typeof LayoutDashboard; href: string; live?: boolean }> = [
  { kunci: "nav.dashboard", icon: LayoutDashboard, href: "/" },
  { kunci: "nav.proyek", icon: FolderGit2, href: "/proyek" },
  { kunci: "nav.sesi", icon: Activity, href: "/sesi" },
  { kunci: "nav.status", icon: HeartPulse, href: "/status" },
  { kunci: "nav.riwayat", icon: History, href: "/riwayat" },
  { kunci: "nav.statistik", icon: ChartColumn, href: "/statistik" },
  { kunci: "nav.notifikasi", icon: Bell, href: "/notifikasi", live: true },
  { kunci: "nav.pengaturan", icon: Settings, href: "/pengaturan" },
];

export function Topbar() {
  const { data: session } = useSession();
  const { teks } = useBahasa();
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // DEBUG SEMENTARA (#123): jejak tap drawer tampil di layar. HAPUS setelah vonis.
  const [dbg, setDbg] = useState<string[]>([]);
  const catat = (s: string) => setDbg((d) => [...d.slice(-3), `${new Date().toLocaleTimeString("id-ID")}.${String(Date.now() % 1000).padStart(3, "0")} ${s}`]);
  const nama = session?.user?.name ?? session?.user?.email ?? "?";
  const inisial = nama.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!buka) return;
    const fn = (e: MouseEvent) => {
      const t = e.target as Node | null;
      const tag = t instanceof Element ? `<${t.tagName.toLowerCase()}>` : "?";
      if (ref.current && t && !ref.current.contains(t)) {
        catat(`luar ${tag} -> tutup`);
        setBuka(false);
      } else {
        catat(`dalam ${tag} -> aman`);
      }
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
    <header className="relative flex h-[58px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* nav drawer WAJIB di dalam div ref (#121): tap item tak boleh dianggap klik-luar */}
        <div ref={ref} className="shrink-0 lg:hidden">
          <button
            onClick={() => {
              catat("tombol hamburger");
              setBuka((v) => !v);
            }}
            title={teks("menu.navigasi")}
            aria-label={teks("menu.navigasi")}
            aria-expanded={buka}
            className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            <Menu className="h-[17px] w-[17px]" />
          </button>
          {buka && (
            <nav className="absolute inset-x-0 top-[58px] z-50 border-b border-border bg-card/98 p-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md lg:hidden">
              {DRAWER.map((item) => {
                const aktif = pathname === item.href;
                return (
                  <Link
                    key={item.kunci}
                    href={item.href}
                    onClick={() => {
                      catat(`tap ${item.href}`);
                      setBuka(false);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[13.5px] font-medium transition-colors",
                      aktif ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="relative flex items-center">
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      {item.live && <NotifBadge className="absolute -right-2.5 -top-2" />}
                    </span>
                    {teks(item.kunci)}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <span className="shrink-0 text-[15px] font-bold tracking-tight lg:hidden">PDC</span>
        <SearchBox />
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <Link
          href="/notifikasi"
          aria-label={teks("nav.notifikasi")}
          className="relative flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="h-[17px] w-[17px]" />
          <span className="absolute -right-1 -top-1">
            <NotifBadge className="" />
          </span>
        </Link>
        <PemilihTema />
        {/* Avatar hanya di HP: desktop memakai UserBox sidebar */}
        <div className="lg:hidden">
          {session?.user ? (
            <UserMenu nama={nama} inisial={inisial} gambar={session.user.image} />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
      {dbg.length > 0 && (
        <div className="fixed inset-x-2 bottom-2 z-[9998] rounded-[10px] border border-amber-500/50 bg-black/85 p-2 font-mono text-[10px] leading-relaxed text-amber-200 lg:hidden">
          <div className="flex items-center justify-between">
            <span>DBG route={pathname}</span>
            <button onClick={() => setDbg([])} className="rounded bg-amber-500/20 px-2 py-0.5">
              clear
            </button>
          </div>
          {dbg.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
      )}
    </header>
  );
}
