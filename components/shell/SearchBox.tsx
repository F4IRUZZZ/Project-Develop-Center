"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import type { Project } from "@/lib/types";
import type { QueuedCommand } from "@/lib/tasks";

export const EVENT_SEARCH = "pdc-search";

interface Hasil {
  key: string;
  label: string;
  sub: string;
  href: string;
}

export function SearchBox() {
  const { status } = useSession();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<Hasil[]>([]);
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const updateSearch = (val: string) => {
    setQ(val);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_SEARCH, { detail: val }));
    }
  };

  useEffect(() => {
    if (!buka) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setBuka(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    window.addEventListener("mousedown", fn);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", fn);
      window.removeEventListener("keydown", esc);
    };
  }, [buka]);

  useEffect(() => {
    const kata = q.trim().toLowerCase();
    const t = window.setTimeout(async () => {
      if (status !== "authenticated" || kata.length < 2) {
        setHasil([]);
        return;
      }
      try {
        const [d, tk, c] = await Promise.all([
          fetch("/api/dashboard", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
          fetch("/api/tasks?all=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
          fetch("/api/commands", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        ]);
        const out: Hasil[] = [];
        for (const p of d as Project[]) {
          if (p.repoName.toLowerCase().includes(kata) || p.repoFull.toLowerCase().includes(kata)) {
            out.push({ key: p.id, label: p.repoName, sub: `Proyek · ${p.statusLabel}`, href: `/proyek/${p.id}` });
            if (out.length >= 8) break;
          }
        }
        if (out.length < 8) {
          for (const t of tk as Array<{ id: string; title: string; project_id: string }>) {
            if (t.title.toLowerCase().includes(kata)) {
              out.push({ key: t.id, label: t.title, sub: "Tugas · Riwayat", href: "/riwayat" });
              if (out.length >= 8) break;
            }
          }
        }
        if (out.length < 8) {
          for (const cmd of c as QueuedCommand[]) {
            if (cmd.command_text.toLowerCase().includes(kata)) {
              out.push({ key: cmd.id, label: cmd.command_text.slice(0, 60), sub: `Perintah · ${cmd.status}`, href: "/riwayat" });
              if (out.length >= 8) break;
            }
          }
        }
        setHasil(out);
        setBuka(true);
      } catch {
        /* abaikan */
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [q, status]);

  return (
    <div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[300px] sm:flex-none sm:basis-[300px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="searchBox"
        name="searchBox"
        value={q}
        onChange={(e) => updateSearch(e.target.value)}
        onFocus={() => hasil.length > 0 && setBuka(true)}
        className="w-full rounded-[9px] border border-border bg-muted py-2 pl-9 pr-3 text-[13px] text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        placeholder="Cari proyek, tugas, atau log…"
      />
      {buka && hasil.length > 0 && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          {hasil.map((h) => (
            <button
              key={h.key}
              onClick={() => {
                setBuka(false);
                updateSearch("");
                router.push(h.href);
              }}
              className="block w-full px-3.5 py-2.5 text-left hover:bg-muted"
            >
              <div className="truncate text-[13px] font-medium">{h.label}</div>
              <div className="font-mono text-[10.5px] text-muted-foreground">{h.sub}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
