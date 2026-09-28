"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchNotifikasi, EVENT_NOTIF } from "@/lib/notifikasi";
import { cn } from "@/lib/utils";

// Badge notifikasi live, dipakai Sidebar + BottomNav.
export function NotifBadge({ className }: { className?: string }) {
  const { status } = useSession();
  const [n, setN] = useState(0);
  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (status !== "authenticated") setN(0);
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    const muat = () =>
      fetchNotifikasi()
        .then((rows) => setN(rows.filter((r) => !r.dibaca).length))
        .catch(() => {});
    void muat();
    // Event aksi (stop/tandai) = instan; poll 30s = jaring pengaman.
    window.addEventListener(EVENT_NOTIF, muat);
    const t = window.setInterval(muat, 30000);
    return () => {
      window.removeEventListener(EVENT_NOTIF, muat);
      window.clearInterval(t);
    };
  }, [status]);

  if (n === 0) return null;
  return (
    <span
      className={cn(
        "flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white",
        className ?? "ml-auto"
      )}
    >
      {n > 9 ? "9+" : n}
    </span>
  );
}
