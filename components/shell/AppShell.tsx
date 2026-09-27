"use client";

import { useSession } from "next-auth/react";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { LoginLanding } from "./LoginLanding";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>
      </div>
    );
  }

  if (!session?.user) return <LoginLanding />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
