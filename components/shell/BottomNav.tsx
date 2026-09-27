"use client";

import { Bell, FolderGit2, History, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotifBadge } from "./NotifBadge";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Proyek", icon: FolderGit2, href: "/proyek" },
  { label: "Riwayat", icon: History, href: "/riwayat" },
  { label: "Notifikasi", icon: Bell, href: "/notifikasi", live: true },
  { label: "Pengaturan", icon: Settings, href: "/pengaturan" },
];

// Navigasi bawah untuk HP (<lg). Sidebar hanya tampil di desktop.
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      {ITEMS.map((item) => {
        const aktif = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              aktif ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={1.75} />
            {item.label}
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
