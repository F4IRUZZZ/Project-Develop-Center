"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { CommandModal } from "@/components/command/CommandModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PullModal } from "@/components/command/PullModal";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { EVENT_SEARCH } from "@/components/shell/SearchBox";
import { useBahasa } from "@/components/shell/BahasaProvider";
import { mulaiPolling } from "@/lib/polling";
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
  const { teks } = useBahasa();
  const [daftar, setDaftar] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(true);
  const [angka, setAngka] = useState<{ proyekAktif: number; aiBekerja: number; tugasSelesai: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [pullOpen, setPullOpen] = useState(false);
  const [pullId, setPullId] = useState<string | undefined>(undefined);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);

  const muat = useCallback(async (): Promise<boolean> => {
    let ok = true;
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) setDaftar((await res.json()) as Project[]);
      else ok = false;
    } catch {
      /* abaikan */
      ok = false;
    }
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      if (res.ok)
        setAngka((await res.json()) as { proyekAktif: number; aiBekerja: number; tugasSelesai: number });
    } catch {
      /* abaikan */
    }
    return ok;
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
    const kendali = mulaiPolling(muat, { awalMs: 10000 });
    return () => kendali.berhenti();
  }, [status, muat]);

  useEffect(() => {
    const onSearch = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSearchQuery(custom.detail || "");
    };
    window.addEventListener(EVENT_SEARCH, onSearch);
    return () => window.removeEventListener(EVENT_SEARCH, onSearch);
  }, []);

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

  const kataKunci = searchQuery.trim().toLowerCase();
  const projectsTampil = kataKunci
    ? daftar.filter(
        (p) =>
          p.repoName.toLowerCase().includes(kataKunci) ||
          p.repoFull.toLowerCase().includes(kataKunci)
      )
    : daftar;

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">{teks("shell.muatSesi")}</p>;
  if (!session?.user) return <LoginCard />;

  return (
    <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6">
      <Dashboard
        projects={projectsTampil}
        judul={
          kataKunci
            ? teks("pro.hasilCari").replace("{n}", String(projectsTampil.length))
            : teks("pro.judulProyek").replace("{n}", String(daftar.length))
        }
        teksKosong={
          kataKunci ? teks("pro.kosongCari").replace("{q}", searchQuery) : teks("pro.kosongUmum")
        }
        stats={angka ?? undefined}
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
        onPulls={(id) => {
          setPullId(id);
          setPullOpen(true);
        }}
        aksiHeader={
          <button
            onClick={sync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#5457E5] disabled:opacity-50"
          >
            <RefreshCw className={`h-[15px] w-[15px] ${syncing ? "animate-spin" : ""}`} />{" "}
            {syncing ? teks("notif.muat") : teks("pro.sync")}
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
      <PullModal
        open={pullOpen}
        projectId={pullId}
        repoName={pullId ? namaRepo(pullId) : undefined}
        onMerged={() => void muat()}
        onClose={() => setPullOpen(false)}
      />
      <ConfirmModal
        open={konfirmasi !== null}
        judul={konfirmasi?.jenis === "stop" ? teks("pro.stopJudul") : teks("pro.visJudul")}
        pesan={
          konfirmasi?.jenis === "stop"
            ? teks("pro.stopPesan").replace("{repo}", konfirmasi?.repoName ?? "")
            : konfirmasi?.saatIniPrivate
              ? teks("pro.visPesanPublic").replace("{repo}", konfirmasi?.repoName ?? "")
              : teks("pro.visPesanPrivate").replace("{repo}", konfirmasi?.repoName ?? "")
        }
        labelKonfirmasi={konfirmasi?.jenis === "stop" ? teks("pro.stopYa") : teks("pro.visYa")}
        danger={konfirmasi?.jenis === "stop"}
        onKonfirmasi={() => void jalankanKonfirmasi()}
        onBatal={() => setKonfirmasi(null)}
      />
    </div>
  );
}
