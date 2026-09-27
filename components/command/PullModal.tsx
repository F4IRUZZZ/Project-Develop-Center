"use client";

import { useEffect, useState } from "react";
import { GitMerge, GitPullRequest, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface PR {
  number: number;
  title: string;
  branch: string;
}

interface Props {
  open: boolean;
  projectId?: string;
  repoName?: string;
  onMerged?: () => void;
  onClose: () => void;
}

export function PullModal({ open, projectId, repoName, onMerged, onClose }: Props) {
  const [prs, setPrs] = useState<PR[] | null>(null);
  const [gagal, setGagal] = useState<string | null>(null);
  const [target, setTarget] = useState<PR | null>(null);
  const [menggabungkan, setMenggabungkan] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setPrs(null);
    setGagal(null);
    setTarget(null);
    fetch(`/api/github?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setPrs((d as { open_prs: PR[] }).open_prs ?? []))
      .catch(() => setGagal("Gagal memuat PR. Coba lagi."));
  }, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !target) onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, target, onClose]);

  const merge = async () => {
    if (!target || !projectId) return;
    setMenggabungkan(true);
    try {
      const res = await fetch("/api/pulls/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, number: target.number }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setGagal(data.error ?? "Merge gagal.");
      } else {
        setTarget(null);
        setPrs((prev) => (prev ?? []).filter((p) => p.number !== target.number));
        onMerged?.();
      }
    } catch {
      setGagal("Jaringan gagal. Coba lagi.");
    }
    setMenggabungkan(false);
  };

  if (!open) return null;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[5px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`PR terbuka ${repoName ?? ""}`}
    >
      <div
        className="w-full max-w-[480px] rounded-[20px] border border-[#34344A] bg-card p-6 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="text-[17px] font-semibold">PR Terbuka{repoName ? ` — ${repoName}` : ""}</div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {gagal && (
          <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
            {gagal}
          </p>
        )}

        {!prs ? (
          <p className="font-mono text-xs text-muted-foreground">Memuat PR…</p>
        ) : prs.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Tidak ada PR terbuka.</p>
        ) : (
          <div className="scroll-tipis max-h-[320px] overflow-y-auto pr-1">
            {prs.map((pr) => (
              <div key={pr.number} className="flex items-center justify-between gap-2 border-b border-border py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">
                    #{pr.number} {pr.title}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">{pr.branch}</div>
                </div>
                <button
                  onClick={() => setTarget(pr)}
                  className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20"
                >
                  <GitMerge className="h-3.5 w-3.5" /> Merge
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-[9px] border border-border bg-transparent px-[18px] py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

      <ConfirmModal
        open={target !== null}
        judul={`Merge PR #${target?.number}?`}
        pesan={`PR "${target?.title}" dari branch ${target?.branch} digabung dengan merge commit. Tindakan ini tidak bisa dibatalkan.`}
        labelKonfirmasi={menggabungkan ? "Menggabungkan…" : "Ya, merge"}
        onKonfirmasi={() => void merge()}
        onBatal={() => setTarget(null)}
      />
    </>
  );
}

export function PrButton({ count, onClick }: { count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-amber-500/10 px-0 py-2 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/20"
    >
      <GitPullRequest className="h-3.5 w-3.5" /> PR{count !== undefined ? ` (${count})` : ""}
    </button>
  );
}
