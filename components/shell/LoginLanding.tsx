"use client";

import { FolderGit2, Inbox, Radio } from "lucide-react";
import { signIn } from "next-auth/react";

const FITUR = [
  { icon: Radio, judul: "Pantau AI live", deskripsi: "Status, progress, dan activity semua repo dalam satu layar." },
  { icon: Inbox, judul: "Kelola antrian", deskripsi: "Kirim perintah, hentikan kerja, lihat riwayat per proyek." },
  { icon: FolderGit2, judul: "Terhubung GitHub", deskripsi: "Repo live + jembatan MCP ke OpenCode." },
];

export function LoginLanding() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-xl font-bold text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
          P
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Project Develop Center</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Satu dashboard untuk melihat, mengelola, dan mengarahkan AI agent di proyek GitHub-mu.
        </p>
      </div>

      <button
        onClick={() => signIn("github")}
        className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5457E5]"
      >
        <FolderGit2 className="h-4 w-4" /> Masuk dengan GitHub
      </button>

      <div className="grid w-full gap-3 text-left">
        {FITUR.map((f) => (
          <div key={f.judul} className="flex items-start gap-3 rounded-[14px] border border-border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <f.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-[13px] font-semibold">{f.judul}</div>
              <div className="text-xs text-muted-foreground">{f.deskripsi}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
