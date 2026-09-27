import { Plus } from "lucide-react";
import { projects as mockProjects } from "@/lib/mock";
import type { Project } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";
import { Stats } from "./Stats";

interface Props {
  projects?: Project[];
  judul?: string;
  stats?: { proyekAktif: number; aiBekerja: number; tugasSelesai: number };
  readOnly?: boolean;
  sembunyiStats?: boolean;
  sembunyiAksiHeader?: boolean;
  teksKosong?: string;
  onCommand?: (projectId: string) => void;
  onStop?: (projectId: string) => void;
  onVisibility?: (projectId: string, saatIniPrivate: boolean) => void;
  onPulls?: (projectId: string) => void;
  aksiHeader?: React.ReactNode;
}

export function Dashboard({
  projects = mockProjects,
  judul = "Proyek Dipantau",
  stats,
  readOnly,
  sembunyiStats,
  sembunyiAksiHeader,
  teksKosong = "Belum ada proyek.",
  onCommand,
  onStop,
  onVisibility,
  onPulls,
  aksiHeader,
}: Props) {
  return (
    <div>
      {!sembunyiStats && (
        <Stats
          proyekAktif={stats?.proyekAktif ?? projects.length}
          aiBekerja={stats?.aiBekerja}
          tugasSelesai={stats?.tugasSelesai}
        />
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold tracking-tight">{judul}</h2>
        {!sembunyiAksiHeader &&
          (aksiHeader ?? (
            <button className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#5457E5]">
              <Plus className="h-[15px] w-[15px]" /> Tambah Proyek
            </button>
          ))}
      </div>
      {projects.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-[13px] text-muted-foreground">
          {teksKosong}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} readOnly={readOnly} onCommand={onCommand} onStop={onStop} onVisibility={onVisibility} onPulls={onPulls} />
          ))}
        </div>
      )}
    </div>
  );
}
