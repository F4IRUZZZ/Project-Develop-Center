import { Bot, CheckCheck, FolderGit2 } from "lucide-react";
import { useBahasa } from "@/components/shell/BahasaProvider";
import type { Kunci } from "@/lib/kamus";

interface Props {
  proyekAktif?: number;
  aiBekerja?: number;
  tugasSelesai?: number;
}

export function Stats({ proyekAktif, aiBekerja, tugasSelesai }: Props) {
  const { teks } = useBahasa();
  const ITEMS: Array<{ icon: typeof FolderGit2; value: number | undefined; kunci: Kunci; tone: string }> = [
    { icon: FolderGit2, value: proyekAktif, kunci: "dash.proyekAktif", tone: "bg-primary/10 text-primary" },
    { icon: Bot, value: aiBekerja, kunci: "dash.aiBekerja", tone: "bg-sky-500/10 text-sky-500" },
    { icon: CheckCheck, value: tugasSelesai, kunci: "dash.tugasSelesai", tone: "bg-emerald-500/10 text-emerald-500" },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      {ITEMS.map((s) => (
        <div
          key={s.kunci}
          className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3.5"
        >
          <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] ${s.tone}`}>
            <s.icon className="h-[19px] w-[19px]" strokeWidth={1.75} />
          </div>
          <div>
            {s.value === undefined ? (
              // Skeleton pulse saat loading (#214): tanpa lompat layout,
              // tanpa em-dash berkedip.
              <div aria-hidden className="h-[22px] w-10 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-[22px] font-bold leading-none tracking-tight">{s.value}</div>
            )}
            <div className="mt-1 text-[11.5px] font-medium text-muted-foreground">{teks(s.kunci)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
