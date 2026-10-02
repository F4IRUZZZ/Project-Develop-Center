"use client";

import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { projects as mockProjects } from "@/lib/mock";
import type { Project } from "@/lib/types";
import { kirimPerintah, sumberDariStatus } from "@/lib/queue";
import { useBahasa } from "@/components/shell/BahasaProvider";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  initialProjectId?: string;
  projects?: Project[];
  onTerkirim?: () => void;
  onClose: () => void;
}

export function CommandModal({ open, initialProjectId, projects = mockProjects, onTerkirim, onClose }: Props) {
  const { status } = useSession();
  const { teks } = useBahasa();
  const [projectId, setProjectId] = useState(initialProjectId ?? projects[0]?.id ?? "");
  const [text, setText] = useState("");
  const [gagal, setGagal] = useState(false);

  // Reset saat modal dibuka (render-phase; projects TIDAK jadi pemicu agar
  // polling dashboard tak menghapus teks saat mengetik panjang).
  const [bukaSebelumnya, setBukaSebelumnya] = useState(open);
  if (open !== bukaSebelumnya) {
    setBukaSebelumnya(open);
    if (open) {
      setProjectId(initialProjectId ?? projects[0]?.id ?? "");
      setText("");
      setGagal(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[5px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={teks("cmd.judul")}
    >
      <div
        className="w-full max-w-[480px] rounded-[20px] border border-[#34344A] bg-card p-6 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="text-[17px] font-semibold">{teks("cmd.judul")}</div>
          <button
            onClick={onClose}
            aria-label={teks("modal.tutup")}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="pdc-cmd-project">
          {teks("cmd.pilihProyek")}
        </label>
        <select
          id="pdc-cmd-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mb-4 w-full rounded-[9px] border border-border bg-muted px-3 py-2.5 text-[13px] text-foreground focus:border-primary focus:outline-none"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.repoName}
            </option>
          ))}
        </select>

        <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="pdc-cmd-text">
          {teks("cmd.instruksi")}
        </label>
        <textarea
          id="pdc-cmd-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={teks("cmd.contoh")}
          className="mb-4 w-full resize-none rounded-[9px] border border-border bg-muted px-3 py-2.5 font-sans text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />

        {gagal && (
          <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
            {teks("cmd.gagal")}
          </p>
        )}
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-[9px] border border-border bg-transparent px-[18px] py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {teks("modal.batal")}
          </button>
          <button
            onClick={async () => {
              const ok = await kirimPerintah(projectId, text, sumberDariStatus(status));
              if (ok) {
                onTerkirim?.();
                onClose();
              } else setGagal(true);
            }}
            disabled={text.trim().length === 0 || projectId === ""}
            className={cn(
              "flex items-center gap-1.5 rounded-[9px] bg-primary/10 px-[18px] py-2 text-xs font-medium text-primary hover:bg-primary/20",
              (text.trim().length === 0 || projectId === "") && "cursor-not-allowed opacity-50 hover:bg-primary/10"
            )}
          >
            <Send className="h-3.5 w-3.5" /> {teks("cmd.kirim")}
          </button>
        </div>
      </div>
    </div>
  );
}
