"use client";

import { Inbox, Radio } from "lucide-react";
import { signIn } from "next-auth/react";
import { GithubMark } from "@/components/ui/GithubMark";

const FITUR: Array<{ icon: (props: { className?: string }) => React.ReactNode; judul: string; deskripsi: string }> = [
  { icon: Radio, judul: "Pantau AI live", deskripsi: "Status, progress, dan activity semua repo dalam satu layar." },
  { icon: Inbox, judul: "Kelola antrian", deskripsi: "Kirim perintah, hentikan kerja, lihat riwayat per proyek." },
  { icon: GithubMark, judul: "Terhubung GitHub", deskripsi: "Repo live + jembatan MCP ke OpenCode." },
];

// Struktur meniru referensi (split brand + CTA), adaptasi dark Nebula.
export function LoginLanding() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.55)] md:grid-cols-2">
        {/* Kiri: panel brand */}
        <div className="relative flex flex-col justify-center gap-5 overflow-hidden bg-gradient-to-br from-primary via-[#4F46E5] to-[#7C3AED] p-8 text-white sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/20 blur-2xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-pdc.svg" alt="Logo PDC" className="h-12 w-12" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Selamat Datang Kembali</h1>
            <p className="mt-2 max-w-xs text-sm text-white/80">
              Agar tetap terhubung, masuk dengan akun GitHub-mu untuk membuka command center AI.
            </p>
          </div>
          <button
            onClick={() => signIn("github")}
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/70 bg-transparent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <GithubMark className="h-4 w-4" /> Masuk dengan GitHub
          </button>
          <p className="font-mono text-[10.5px] text-white/60">
            Baca repo · merge PR hanya atas persetujuanmu.
          </p>
        </div>

        {/* Kanan: ilustrasi ambient Nebula */}
        <div className="relative hidden items-center justify-center overflow-hidden bg-[#0D0D17] p-8 md:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          />
          <svg viewBox="0 0 512 512" className="relative h-64 w-64" aria-hidden>
            <defs>
              <linearGradient id="login-g" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#6366F1" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle cx="256" cy="256" r="200" fill="none" stroke="url(#login-g)" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="6 10" />
            <circle cx="256" cy="256" r="150" fill="none" stroke="url(#login-g)" strokeOpacity="0.35" strokeWidth="2" />
            <polygon
              points="256,116 379.2,186 379.2,326 256,396 132.8,326 132.8,186"
              fill="none"
              stroke="url(#login-g)"
              strokeWidth="28"
              strokeLinejoin="round"
            />
            <text x="256" y="258" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, Arial, sans-serif" fontWeight="700" fontSize="150" fill="#FFFFFF">
              P
            </text>
            <circle cx="406" cy="120" r="8" fill="#22C55E" />
            <circle cx="106" cy="392" r="8" fill="#3B82F6" />
            <circle cx="420" cy="380" r="6" fill="#F59E0B" />
          </svg>
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-5">
            {FITUR.map((f) => (
              <div key={f.judul} className="flex items-center gap-1.5 text-[11px] text-white/60">
                <f.icon className="h-3.5 w-3.5" /> {f.judul}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
