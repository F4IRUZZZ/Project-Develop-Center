import { Plus } from "lucide-react";
import { projects } from "@/lib/mock";
import { ProjectCard } from "./ProjectCard";
import { Stats } from "./Stats";

export function Dashboard({ onCommand }: { onCommand?: (projectId: string) => void }) {
  return (
    <div>
      <Stats />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold tracking-tight">Proyek Dipantau</h2>
        <button className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#5457E5]">
          <Plus className="h-[15px] w-[15px]" /> Tambah Proyek
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onCommand={onCommand} />
        ))}
      </div>
    </div>
  );
}
