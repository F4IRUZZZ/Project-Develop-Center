import { Bot, CheckCheck, FolderGit2 } from "lucide-react";

interface Props {
  proyekAktif?: number;
  aiBekerja?: number;
  tugasSelesai?: number;
}

function nilai(v: number | undefined): string {
  return v === undefined ? "—" : String(v);
}

export function Stats({ proyekAktif, aiBekerja, tugasSelesai }: Props) {
  const ITEMS = [
    { icon: FolderGit2, value: nilai(proyekAktif), label: "Proyek Aktif", tone: "bg-primary/10 text-primary" },
    { icon: Bot, value: nilai(aiBekerja), label: "AI Bekerja", tone: "bg-sky-500/10 text-sky-500" },
    { icon: CheckCheck, value: nilai(tugasSelesai), label: "Tugas Selesai", tone: "bg-emerald-500/10 text-emerald-500" },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      {ITEMS.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3.5"
        >
          <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] ${s.tone}`}>
            <s.icon className="h-[19px] w-[19px]" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[22px] font-bold leading-none tracking-tight">{s.value}</div>
            <div className="mt-1 text-[11.5px] font-medium text-muted-foreground">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
