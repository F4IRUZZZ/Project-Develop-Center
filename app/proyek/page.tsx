"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { CommandModal } from "@/components/command/CommandModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { siarNotifikasi } from "@/lib/notifikasi";
import type { Project } from "@/lib/types";

interface Konfirmasi {
  jenis: "stop" | "visibility";
  projectId: string;
  repoName: string;
  saatIniPrivate: boolean;
}

export default function Proyek() {
  const { data: session, status } = useSession();
  const [daftar, setDaftar] = useState<Project[]>([]);
  const [syncing, setSyncing] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) setDaftar((await res.json()) as Project[]);
    } catch {
      /* abaikan */
    }
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch("/api/projects", { method: "POST" });
    } catch {
      /* abaikan */
    }
    await muat();
    setSyncing(false);
  }, [muat]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      await muat();
      setSyncing(false);
    })();
    const t = window.setInterval(() => {
      void muat();
    }, 10000);
    return () => window.clearInterval(t);
  }, [status, muat]);

  const jalankanKonfirmasi = useCallback(async () => {
    if (!konfirmasi) return;
    if (konfirmasi.jenis === "stop") {
      try {
        await fetch("/api/commands/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: konfirmasi.projectId }),
        });
      } catch {
        /* abaikan */
      }
    } else {
      try {
        await fetch("/api/repos/visibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: konfirmasi.projectId, private: !konfirmasi.saatIniPrivate }),
        });
      } catch {
        /* abaikan */
      }
    }
    setKonfirmasi(null);
    await muat();
    siarNotifikasi();
  }, [konfirmasi, muat]);

  const namaRepo = (id: string) => daftar.find((p) => p.id === id)?.repoName ?? id;

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6">
      <Dashboard
        projects={daftar}
        judul={`Proyek (${daftar.length})`}
        onCommand={(id) => {
          setSelectedId(id);
          setModalOpen(true);
        }}
        onStop={(id) =>
          setKonfirmasi({ jenis: "stop", projectId: id, repoName: namaRepo(id), saatIniPrivate: false })
        }
        onVisibility={(id, priv) =>
          setKonfirmasi({ jenis: "visibility", projectId: id, repoName: namaRepo(id), saatIniPrivate: priv })
        }
        aksiHeader={
          <button
            onClick={sync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#5457E5] disabled:opacity-50"
          >
            <RefreshCw className={`h-[15px] w-[15px] ${syncing ? "animate-spin" : ""}`} />{" "}
            {syncing ? "Memuat…" : "Sync GitHub"}
          </button>
        }
      />
      <CommandModal
        open={modalOpen}
        initialProjectId={selectedId}
        projects={daftar}
        onTerkirim={() => void muat()}
        onClose={() => setModalOpen(false)}
      />
      <ConfirmModal
        open={konfirmasi !== null}
        judul={konfirmasi?.jenis === "stop" ? "Hentikan kerja AI?" : "Ubah visibilitas repo?"}
        pesan={
          konfirmasi?.jenis === "stop"
            ? `Kerja AI di ${konfirmasi?.repoName} dihentikan. Perintah pending dibatalkan dan task ditandai gagal.`
            : konfirmasi?.saatIniPrivate
              ? `${konfirmasi?.repoName} jadi PUBLIC: semua orang bisa lihat + Pages aktif.`
              : `${konfirmasi?.repoName} jadi PRIVATE: hanya kamu + kolaborator yang bisa lihat.`
        }
        labelKonfirmasi={konfirmasi?.jenis === "stop" ? "Ya, hentikan" : "Ya, ubah"}
        danger={konfirmasi?.jenis === "stop"}
        onKonfirmasi={() => void jalankanKonfirmasi()}
        onBatal={() => setKonfirmasi(null)}
      />
    </div>
  );
}
