"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function Pengaturan() {
  const { data: session, status } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [nama, setNama] = useState("opencode-local");
  const [baru, setBaru] = useState<string | null>(null);
  const [disalin, setDisalin] = useState(false);

  const muat = useCallback(() => {
    fetch("/api/keys", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setKeys(d as ApiKey[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "authenticated") void muat();
  }, [status, muat]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  const buat = async () => {
    setBaru(null);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nama }),
    });
    if (!res.ok) return;
    const d = (await res.json()) as { key: string };
    setBaru(d.key);
    setDisalin(false);
    muat();
  };

  const cabut = async (id: string) => {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    muat();
  };

  const salin = async () => {
    if (!baru) return;
    await navigator.clipboard.writeText(baru).catch(() => {});
    setDisalin(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <h2 className="mb-1 text-[17px] font-semibold tracking-tight">Pengaturan</h2>
      <p className="mb-6 text-[13px] text-muted-foreground">
        API key untuk MCP bridge (OpenCode). Key hanya tampil sekali saat dibuat.
      </p>

      <div className="mb-4 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 text-[15px] font-semibold">Buat key baru</div>
        <div className="flex gap-2">
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama key, mis. opencode-local"
            className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
          />
          <button
            onClick={buat}
            className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-[#5457E5]"
          >
            <KeyRound className="h-4 w-4" /> Buat
          </button>
        </div>
        {baru && (
          <div className="mt-3 rounded-[9px] border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="mb-1 font-mono text-[11px] text-amber-500">Salin sekarang — tidak ditampilkan lagi:</div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{baru}</code>
              <button
                onClick={salin}
                className="flex shrink-0 items-center gap-1 rounded-[9px] border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" /> {disalin ? "Tersalin" : "Salin"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-4 text-[15px] font-semibold">Key aktif ({keys.filter((k) => !k.revoked).length})</div>
        {keys.length === 0 && <p className="text-[13px] text-muted-foreground">Belum ada key.</p>}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-2 border-b border-border py-2.5 last:border-b-0">
            <div className="min-w-0">
              <div className="text-[13px] font-medium">
                {k.name} <span className="font-mono text-[11px] text-muted-foreground">{k.prefix}…</span>
              </div>
              <div className="font-mono text-[10.5px] text-muted-foreground">
                {k.revoked ? "dicabut" : k.last_used_at ? `dipakai ${k.last_used_at.slice(0, 16).replace("T", " ")}` : "belum dipakai"}
              </div>
            </div>
            {!k.revoked && (
              <button
                onClick={() => void cabut(k.id)}
                title="Cabut key"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
