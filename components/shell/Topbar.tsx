"use client";

import { Bell, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PemilihTema } from "./PemilihTema";
import { NotifBadge } from "./NotifBadge";
import { useBahasa } from "./BahasaProvider";
import { UserMenu } from "./UserMenu";
import { SearchBox } from "./SearchBox";

export function Topbar() {
  const { data: session } = useSession();
  const { teks } = useBahasa();
  const nama = session?.user?.name ?? session?.user?.email ?? "?";
  const inisial = nama.slice(0, 2).toUpperCase();

  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6">
      <SearchBox />
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
    </header>
  );
}
