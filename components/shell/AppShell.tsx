"use client";

import { useSession } from "next-auth/react";
import { BahasaProvider, useBahasa } from "./BahasaProvider";
import { ToastNotifikasi } from "./ToastNotifikasi";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { LoginLanding } from "./LoginLanding";

function Memuat() {
  const { teks } = useBahasa();
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="font-mono text-xs text-muted-foreground">{teks("shell.muatSesi")}</p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  return (
    <BahasaProvider>
      {status === "loading" ? (
        <Memuat />
      ) : !session?.user ? (
        <LoginLanding />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
          <ToastNotifikasi />
        </div>
      )}
    </BahasaProvider>
  );
}
