"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { CommandModal } from "@/components/command/CommandModal";
import { QueuePanel } from "@/components/command/QueuePanel";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { Stats } from "@/components/dashboard/Stats";
import { SkeletonCard, SkeletonTable, SkeletonText } from "@/components/ui/Skeleton";
import { fetchDashboard } from "@/lib/github";
import { projects as mockProjects } from "@/lib/mock";
import { EVENT_SEARCH } from "@/components/shell/SearchBox";
import { useBahasa } from "@/components/shell/BahasaProvider";
import { mulaiPolling } from "@/lib/polling";
import { cekFlip } from "@/lib/flip-lokal";
import type { Project } from "@/lib/types";

const PERHATIAN = new Set(["working", "waiting", "stuck", "failed"]);

export default function Home() {
  const { data: session, status } = useSession();
  const { teks } = useBahasa();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [live, setLive] = useState<Project[] | null>(null);
  const [gagalRepo, setGagalRepo] = useState(false);
  const [angka, setAngka] = useState<{ proyekAktif: number; aiBekerja: number; tugasSelesai: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Himpunan proyek-bekerja polling sebelumnya (flip lokal #208). null =
  // belum ada polling (diam, anti false positif saat buka halaman).
  const kerjaLalu = useRef<Set<string> | null>(null);

  const muatAngka = () => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setAngka(d as { proyekAktif: number; aiBekerja: number; tugasSelesai: number }))
      .catch(() => {});
  };

  const openFor = (projectId?: string) => {
    setSelectedId(projectId);
    setModalOpen(true);
  };

  // Satu-satunya penulis kerjaLalu (#212): semua jalur muat (polling,
  // visible-refetch, manual) wajib lewat sini agar toast flip tak bocor.
  const catatFlip = (daftar: Project[]) => {
    kerjaLalu.current = cekFlip(kerjaLalu.current, daftar);
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDashboard()
      .then((d) => {
        setLive(d);
        catatFlip(d);
      })
      .catch(() => setGagalRepo(true));
    muatAngka();
    const segarkan = async (): Promise<boolean> => {
      try {
        const d = await fetchDashboard();
        setLive(d);
        catatFlip(d);
        muatAngka();
        return true;
      } catch {
        return false;
      }
    };
    const kendali = mulaiPolling(segarkan, { awalMs: 10000 });
    return () => kendali.berhenti();
  }, [status]);

  useEffect(() => {
    const onSearch = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSearchQuery(custom.detail || "");
    };
    window.addEventListener(EVENT_SEARCH, onSearch);
    return () => window.removeEventListener(EVENT_SEARCH, onSearch);
  }, []);

  // Pulang ke tab = segar seketika (#204): polling menahan diri saat hidden
  // + browser me-throttle timer background, jadi tanpa ini flip real-time
  // (#202) baru terlihat puluhan detik setelah tab dibuka kembali.
  // SEMUA jalur muat dialirkan lewat catatFlip (#212): tanpanya toast flip
  // hilang di jalur ini lalu muncul basi di polling berikut.
  useEffect(() => {
    if (status !== "authenticated") return;
    const onNampak = () => {
      if (document.hidden) return;
      fetchDashboard()
        .then((d) => {
          setLive(d);
          catatFlip(d);
        })
        .catch(() => {});
      fetch("/api/stats", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setAngka(d as { proyekAktif: number; aiBekerja: number; tugasSelesai: number }))
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onNampak);
    return () => document.removeEventListener("visibilitychange", onNampak);
  }, [status]);

  const muatUlang = () => {
    fetchDashboard()
      .then((d) => {
        setLive(d);
        catatFlip(d);
      })
      .catch(() => {});
    muatAngka();
  };

  const semua = live ?? mockProjects;
  const kataKunci = searchQuery.trim().toLowerCase();
  const cocokCari = (p: Project) =>
    !kataKunci ||
    p.repoName.toLowerCase().includes(kataKunci) ||
    p.repoFull.toLowerCase().includes(kataKunci);
  const perhatian = (live ?? []).filter((p) => PERHATIAN.has(p.status) && cocokCari(p));
  // Repo dengan sesi AI hidup (bekerja dulu), hormati pencarian. Data sudah
  // ada di `live` (sesiAktif/sesiKerja dari /api/dashboard, refresh 10 dtk).
  const aktif = (live ?? [])
    .filter((p) => p.sesiAktif && cocokCari(p))
    .sort((a, b) => (a.sesiKerja === "bekerja" ? 0 : 1) - (b.sesiKerja === "bekerja" ? 0 : 1));

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 p-4 sm:p-6 xl:flex-row">
      <div className="min-w-0 flex-1">
        {status === "loading" ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonTable rows={3} cols={4} />
          </div>
        ) : !session?.user ? (
          <LoginCard />
        ) : live ? (
          <>
            <Stats
              proyekAktif={angka?.proyekAktif}
              aiBekerja={angka?.aiBekerja}
              tugasSelesai={angka?.tugasSelesai}
            />
            <div className="mb-6">
              <Dashboard
                projects={aktif}
                judul={teks("dash.sedangAktif")}
                readOnly
                sembunyiStats
                sembunyiAksiHeader
                teksKosong={teks("dash.kosongSesi")}
              />
            </div>
            <Dashboard
              projects={perhatian}
              judul={teks("dash.butuhPerhatian")}
              readOnly
              sembunyiStats
              sembunyiAksiHeader
              teksKosong={teks("dash.kosongTenang")}
            />
          </>
        ) : gagalRepo ? (
          <>
            <p className="mb-4 rounded-[9px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-500">
              {teks("dash.gagalRepo")}
            </p>
            <Dashboard projects={mockProjects} onCommand={openFor} />
          </>
        ) : (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonTable rows={3} cols={4} />
          </div>
        )}
        {session?.user && <QueuePanel />}
      </div>
      <div className="w-full shrink-0 xl:w-[332px]">
        <ActivityFeed />
      </div>
      <CommandModal
        open={modalOpen}
        initialProjectId={selectedId}
        projects={live ?? mockProjects}
        onTerkirim={muatUlang}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
