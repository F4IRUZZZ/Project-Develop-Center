"use client";

import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { projects as mockProjects } from "@/lib/mock";
import type { Project } from "@/lib/types";
import { kirimPerintah, sumberDariStatus } from "@/lib/queue";
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
  const [projectId, setProjectId] = useState(initialProjectId ?? projects[0]?.id ?? "");
  const [text, setText] = useState("");
  const [gagal, setGagal] = useState(false);

  // Reset hanya saat modal dibuka / pemicu berubah.
  // projects TIDAK masuk deps: referensinya berganti tiap polling dashboard,
  // dan itu dulu yang menghapus teks saat mengetik panjang.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      setProjectId(initialProjectId ?? projects[0]?.id ?? "");
      setText("");
      setGagal(false);
    }
  }, [open, initialProjectId]);

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
      aria-label="Kirim Perintah ke AI"
    >
      <div
        className="w-full max-w-[480px] rounded-[20px] border border-[#34344A] bg-card p-6 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="text-[17px] font-semibold">Kirim Perintah ke AI</div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="pdc-cmd-project">
          Pilih Proyek
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
          Instruksi
        </label>
        <textarea
          id="pdc-cmd-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Contoh: Tambahkan fitur lupa password di halaman login"
          className="mb-4 w-full resize-none rounded-[9px] border border-border bg-muted px-3 py-2.5 font-sans text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />

        {gagal && (
          <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
            Gagal menyimpan ke database. Coba lagi.
          </p>
        )}
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-[9px] border border-border bg-transparent px-[18px] py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Batal
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
            <Send className="h-3.5 w-3.5" /> Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
