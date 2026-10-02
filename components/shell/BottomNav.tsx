"use client";

import { Activity, Bell, ChartColumn, FolderGit2, HeartPulse, History, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotifBadge } from "./NotifBadge";
import { useBahasa } from "./BahasaProvider";
import type { Kunci } from "@/lib/kamus";
import { cn } from "@/lib/utils";

const ITEMS: Array<{ kunci: Kunci; icon: typeof LayoutDashboard; href: string; live?: boolean }> = [
  { kunci: "nav.dashboard", icon: LayoutDashboard, href: "/" },
  { kunci: "nav.proyek", icon: FolderGit2, href: "/proyek" },
  { kunci: "nav.sesi", icon: Activity, href: "/sesi" },
  { kunci: "nav.status", icon: HeartPulse, href: "/status" },
  { kunci: "nav.riwayat", icon: History, href: "/riwayat" },
  { kunci: "nav.statistik", icon: ChartColumn, href: "/statistik" },
  { kunci: "nav.notifikasi", icon: Bell, href: "/notifikasi", live: true },
  { kunci: "nav.pengaturan", icon: Settings, href: "/pengaturan" },
];

// Navigasi bawah untuk HP (<lg). Sidebar hanya tampil di desktop.
export function BottomNav() {
  const pathname = usePathname();
  const { teks } = useBahasa();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      {ITEMS.map((item) => {
        const aktif = pathname === item.href;
        return (
          <Link
            key={item.kunci}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              aktif ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={1.75} />
            {teks(item.kunci)}
            {item.live && (
              <span className="absolute right-1/2 top-1 translate-x-5">
                <NotifBadge className="" />
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
