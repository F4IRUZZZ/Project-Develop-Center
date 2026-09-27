"use client";

import { FolderGit2 } from "lucide-react";
import { signIn } from "next-auth/react";

export function LoginCard() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 font-bold text-white">
        P
      </div>
      <h2 className="text-xl font-bold tracking-tight">Selamat datang di Project Develop Center</h2>
      <p className="text-sm text-muted-foreground">
        Sambungkan akun GitHub untuk melihat semua repositori yang kamu pantau dalam satu dashboard.
      </p>
      <button
        onClick={() => signIn("github")}
        className="flex items-center gap-2 rounded-[9px] bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#5457E5]"
      >
        <FolderGit2 className="h-4 w-4" /> Sambungkan Akun GitHub
      </button>
    </div>
  );
}
