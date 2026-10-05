"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchNotifikasi, EVENT_NOTIF } from "@/lib/notifikasi";
import { cekPeringatan } from "@/lib/peringatan";
import { mulaiPolling } from "@/lib/polling";
import { cn } from "@/lib/utils";

// Badge notifikasi live, dipakai Sidebar + drawer Topbar.
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
    const muat = async (): Promise<boolean> => {
      try {
        const rows = await fetchNotifikasi();
        setN(rows.filter((r) => !r.dibaca).length);
        cekPeringatan(rows);
        return true;
      } catch {
        return false;
      }
    };
    // Event aksi (stop/tandai) = instan; poll 30s = jaring pengaman.
    const segarkan = () => {
      void muat();
    };
    window.addEventListener(EVENT_NOTIF, segarkan);
    const kendali = mulaiPolling(muat, { awalMs: 30000 });
    return () => {
      window.removeEventListener(EVENT_NOTIF, segarkan);
      kendali.berhenti();
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
