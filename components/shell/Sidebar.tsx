"use client";

import {
  Bell,
  FolderGit2,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NotifBadge } from "./NotifBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", badge: null as string | null },
  { label: "Proyek", icon: FolderGit2, href: "/proyek", badge: null as string | null },
  { label: "Riwayat", icon: History, href: "/riwayat", badge: null as string | null },
  { label: "Notifikasi", icon: Bell, href: "/notifikasi", badge: "live" },
  { label: "Pengaturan", icon: Settings, href: "/pengaturan", badge: null as string | null },
];

function UserBox() {
  const { data: session, status } = useSession();
  const [tanyaKeluar, setTanyaKeluar] = useState(false);

  if (status === "loading") {
    return (
      <div className="mt-auto border-t border-border px-2 pt-2.5 font-mono text-[11px] text-muted-foreground">
        Memuat sesi…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mt-auto border-t border-border px-2 pt-2.5">
        <button
          onClick={() => signIn("github")}
          className="flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-primary px-0 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5457E5]"
        >
          <LogIn className="h-3.5 w-3.5" /> Login GitHub
        </button>
      </div>
    );
  }

  const nama = session.user.name ?? session.user.email ?? "GitHub User";
  const inisial = nama.slice(0, 2).toUpperCase();

  return (
    <div className="mt-auto border-t border-border px-2 pt-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {session.user.image ? (
            <Image src={session.user.image} alt={nama} width={32} height={32} className="h-full w-full object-cover" />
          ) : (
            inisial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium">{nama}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
            <span className="h-[7px] w-[7px] rounded-full bg-emerald-500" />
            Connected
          </div>
        </div>
        <button
          onClick={() => setTanyaKeluar(true)}
          title="Keluar"
          aria-label="Keluar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
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

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-border bg-card px-3.5 py-[18px] lg:flex">
      <div className="flex items-center gap-2.5 px-1.5 pb-[22px]">
        <Image
          src="/logo-pdc.svg"
          alt="Logo PDC"
          width={34}
          height={34}
          className="h-[34px] w-[34px] rounded-[10px] shadow-[0_4px_12px_rgba(99,102,241,0.35)]"
        />
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Develop Center</div>
          <div className="text-[11px] font-medium text-muted-foreground">Project</div>
        </div>
      </div>

      <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Menu
      </div>
      <nav>
        {NAV.map((item) => {
          const aktif = item.href ? pathname === item.href : item.label === "Dashboard" && pathname === "/";
          const cls = cn(
            "mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
            aktif ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          );
          const isi = (
            <>
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
              {item.badge === "live" ? (
                <NotifBadge />
              ) : (
                item.badge && (
                  <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                )
              )}
            </>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} className={cls}>
              {isi}
            </Link>
          ) : (
            <div key={item.label} className={cls}>
              {isi}
            </div>
          );
        })}
      </nav>

      <UserBox />
    </aside>
  );
}
