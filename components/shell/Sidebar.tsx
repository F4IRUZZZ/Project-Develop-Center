"use client";

import {
  Activity,
  Bell,
  ChartColumn,
  ChevronsLeft,
  ChevronsRight,
  FolderGit2,
  HeartPulse,
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
import { useBahasa } from "./BahasaProvider";
import { bacaCiut, simpanCiut } from "@/lib/sidebar";
import type { Kunci } from "@/lib/kamus";
import { cn } from "@/lib/utils";

const NAV: Array<{ kunci: Kunci; icon: typeof LayoutDashboard; href: string; badge: string | null }> = [
  { kunci: "nav.dashboard", icon: LayoutDashboard, href: "/", badge: null },
  { kunci: "nav.proyek", icon: FolderGit2, href: "/proyek", badge: null },
  { kunci: "nav.sesi", icon: Activity, href: "/sesi", badge: null },
  { kunci: "nav.status", icon: HeartPulse, href: "/status", badge: null },
  { kunci: "nav.riwayat", icon: History, href: "/riwayat", badge: null },
  { kunci: "nav.statistik", icon: ChartColumn, href: "/statistik", badge: null },
  { kunci: "nav.notifikasi", icon: Bell, href: "/notifikasi", badge: "live" },
  { kunci: "nav.pengaturan", icon: Settings, href: "/pengaturan", badge: null },
];

function UserBox({ ciut }: { ciut?: boolean }) {
  const { data: session, status } = useSession();
  const { teks } = useBahasa();
  const [tanyaKeluar, setTanyaKeluar] = useState(false);

  if (status === "loading") {
    return (
      <div className="mt-auto border-t border-border px-2 pt-2.5 font-mono text-[11px] text-muted-foreground">
        {ciut ? "…" : teks("shell.muatSesi")}
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mt-auto border-t border-border px-2 pt-2.5">
        <button
          onClick={() => signIn("github")}
          title={teks("user.masukGithub")}
          aria-label={teks("user.masukGithub")}
          className="flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-primary px-0 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5457E5]"
        >
          <LogIn className="h-3.5 w-3.5" /> {!ciut && teks("user.masukGithub")}
        </button>
      </div>
    );
  }

  const nama = session.user.name ?? session.user.email ?? "GitHub User";
  const inisial = nama.slice(0, 2).toUpperCase();

  // Saat ciut ruang isi cuma 32px: susun vertikal (avatar + keluar)
  // agar tak meluber/kepotong kiri. px-0 rebut kembali ruang padding.
  return (
    <div className={cn("mt-auto border-t border-border pt-2.5", ciut ? "px-0" : "px-2")}>
      <div className={cn("flex items-center gap-2.5", ciut && "flex-col justify-center gap-2")}>
        <div
          title={nama}
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground"
        >
          {session.user.image ? (
            <Image src={session.user.image} alt={nama} width={32} height={32} className="h-full w-full object-cover" />
          ) : (
            inisial
          )}
        </div>
        {!ciut && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{nama}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
              <span className="h-[7px] w-[7px] rounded-full bg-emerald-500" />
              {teks("user.terhubung")}
            </div>
          </div>
        )}
        <button
          onClick={() => setTanyaKeluar(true)}
          title={teks("user.keluar")}
          aria-label={teks("user.keluar")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      <ConfirmModal
        open={tanyaKeluar}
        judul={teks("user.tanyaKeluar")}
        pesan={teks("user.pesanKeluar")}
        labelKonfirmasi={teks("user.yaKeluar")}
        onKonfirmasi={() => void signOut()}
        onBatal={() => setTanyaKeluar(false)}
      />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { teks } = useBahasa();
  const [ciut, setCiut] = useState<boolean>(() => bacaCiut());
  const jungkit = () => {
    setCiut((c) => {
      simpanCiut(!c);
      return !c;
    });
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-card py-[18px] transition-[width] lg:flex",
        ciut ? "w-[68px] px-2.5" : "w-[232px] px-3.5"
      )}
    >
      <div className={cn("flex items-center gap-2.5 px-1.5 pb-[22px]", ciut && "flex-col justify-center px-0")}>
        <Image
          src="/logo-pdc.svg"
          alt="Logo PDC"
          width={34}
          height={34}
          // Ubin gradasi agar P putih terbaca di tema terang maupun gelap.
          className="h-[34px] w-[34px] shrink-0 rounded-[10px] bg-gradient-to-br from-primary to-violet-500 p-[3px] shadow-[0_4px_12px_rgba(99,102,241,0.35)]"
        />
        {!ciut && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold tracking-tight">Develop Center</div>
            <div className="text-[11px] font-medium text-muted-foreground">Project</div>
          </div>
        )}
        <button
          onClick={jungkit}
          title={ciut ? teks("shell.bentangkan") : teks("shell.ciutkan")}
          aria-label={ciut ? teks("shell.bentangkan") : teks("shell.ciutkan")}
          aria-expanded={!ciut}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {ciut ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {!ciut && (
        <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {teks("shell.menu")}
        </div>
      )}
      <nav>
        {NAV.map((item) => {
          const nama = teks(item.kunci);
          const aktif = item.href ? pathname === item.href : item.kunci === "nav.dashboard" && pathname === "/";
          const cls = cn(
            "mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
            ciut && "justify-center px-0",
            aktif ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          );
          const isi = ciut ? (
            <span className="relative flex items-center justify-center">
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.badge === "live" && <NotifBadge className="absolute -right-2.5 -top-2" />}
            </span>
          ) : (
            <>
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {nama}
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
            <Link key={item.kunci} href={item.href} className={cls} title={ciut ? nama : undefined}>
              {isi}
            </Link>
          ) : (
            <div key={item.kunci} className={cls} title={ciut ? nama : undefined}>
              {isi}
            </div>
          );
        })}
      </nav>

      <UserBox ciut={ciut} />
    </aside>
  );
}
