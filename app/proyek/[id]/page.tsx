"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, FolderGit2, Terminal } from "lucide-react";
import { TombolHapusSesi } from "@/components/sesi/TombolHapusSesi";
import { sesiSegar } from "@/lib/sesi";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CommandModal } from "@/components/command/CommandModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PullModal } from "@/components/command/PullModal";
import { useBahasa } from "@/components/shell/BahasaProvider";
import { mulaiPolling } from "@/lib/polling";
import type { Lang } from "@/lib/kamus";
import type { AIStatus, Project } from "@/lib/types";
import type { QueuedCommand } from "@/lib/tasks";
import type { ActivityEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "tugas" | "perintah" | "aktivitas" | "sesi" | "ringkasan";

interface SesiRow {
  session_id: string;
  mode: string;
  status: string;
  started_at: string;
  last_seen_at: string;
  ringkasan_terakhir: string | null;
  ringkasan_waktu: string | null;
  ended_at: string | null;
  aktivitas?: {
    kerja: string;
    hening_mnt: number | null;
    file_terakhir: string[];
    komit_terakhir: {
      sha: string | null;
      files_changed: number | null;
      lines_added: number | null;
      lines_removed: number | null;
      waktu: string;
    } | null;
  };
}

interface TaskRow {
  id: string;
  title: string;
  status: AIStatus;
  progress: number;
  created_at: string;
}

export default function DetailProyek({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const { lang, teks } = useBahasa();
  const [proyek, setProyek] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [commands, setCommands] = useState<QueuedCommand[]>([]);
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [tab, setTab] = useState<Tab>("tugas");
  const [sesi, setSesi] = useState<SesiRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pullOpen, setPullOpen] = useState(false);
  const [tanyaStop, setTanyaStop] = useState(false);
  const [tanyaHapusSesi, setTanyaHapusSesi] = useState<string | null>(null);
  const [galatHapusSesi, setGalatHapusSesi] = useState(false);

  const muat = useCallback(async () => {
    try {
      const [d, t, c, a, s] = await Promise.all([
        fetch("/api/dashboard", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/tasks?project_id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch("/api/commands", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/activity?project_id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`/api/sessions?project_id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : []
        ),
      ]);
      setProyek(((d as Project[]).find((p) => p.id === id) ?? null));
      setTasks(t as TaskRow[]);
      setCommands((c as QueuedCommand[]).filter((x) => x.project_id === id));
      setFeed(a as ActivityEvent[]);
      setSesi(s as SesiRow[]);
      return true;
    } catch {
      /* abaikan */
      return false;
    }
  }, [id]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const kendali = mulaiPolling(muat, { awalMs: 10000 });
    return () => kendali.berhenti();
  }, [status, muat]);

  const stop = async () => {
    await fetch("/api/commands/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: id }),
    }).catch(() => {});
    setTanyaStop(false);
    await muat();
  };

  const hapusSesi = async () => {
    if (!tanyaHapusSesi) return;
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: tanyaHapusSesi }),
      });
      if (!res.ok) {
        setGalatHapusSesi(true);
        return;
      }
    } catch {
      setGalatHapusSesi(true);
      return;
    }
    setTanyaHapusSesi(null);
    setGalatHapusSesi(false);
    await muat();
  };

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">{teks("shell.muatSesi")}</p>;
  if (!session?.user) return <LoginCard />;
  if (!proyek)
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Link href="/proyek" className="text-[13px] text-primary hover:underline">
          {teks("pro.kembaliProyek")}
        </Link>
        <p className="mt-4 font-mono text-xs text-muted-foreground">{teks("pro.muatProyek")}</p>
      </div>
    );

  const aktif = tasks.find((t) => ["working", "waiting", "stuck"].includes(t.status));
  // Syarat tombol dari server (#212, selaras kartu): PR selalu (modal
  // menangani kosong), Stop hanya bila actions berisi "stop". Logika lokal
  // adaJalan dihapus — pernah divergen dari server (task basi tanpa sesi).

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link href="/proyek" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {teks("search.proyek")}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-muted text-muted-foreground">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[17px] font-semibold tracking-tight">{proyek.repoName}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{proyek.repoFull}</div>
            </div>
          </div>
          <StatusBadge status={proyek.status} label={proyek.statusLabel} />
        </div>

        {aktif ? (
          <div className="mt-4">
            <div className="mb-1.5 text-[13px]">
              <span className="text-muted-foreground">{teks("pro.tugasLabel")}</span>
              {aktif.title}
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-muted">
              <div className="h-full rounded bg-primary transition-all" style={{ width: `${aktif.progress}%` }} />
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">{aktif.progress}%</div>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-muted-foreground">{teks("pro.tidakAdaTask")}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-[9px] bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <Terminal className="h-3.5 w-3.5" /> {teks("kartu.perintah")}
          </button>
          <button
            onClick={() => setPullOpen(true)}
            className="rounded-[9px] bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-500 hover:bg-amber-500/20"
          >
            PR
          </button>
          {proyek.actions.includes("stop") && (
            <button
              onClick={() => setTanyaStop(true)}
              className="rounded-[9px] bg-red-500/10 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20"
            >
              {teks("kartu.stop")}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 mt-6 flex gap-2">
        {(
          [
            ["tugas", "riw.tugas"],
            ["perintah", "riw.perintah"],
            ["aktivitas", "pro.tabAktivitas"],
            ["sesi", "nav.sesi"],
            ["ringkasan", "pro.tabRingkasan"],
          ] as Array<[Tab, "riw.tugas" | "riw.perintah" | "pro.tabAktivitas" | "nav.sesi" | "pro.tabRingkasan"]>
        ).map(([t, kunci]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-[9px] px-4 py-2 text-[13px] font-medium transition-colors",
              tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {teks(kunci)}
          </button>
        ))}
      </div>

      {tab === "tugas" && (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {tasks.length === 0 && <p className="text-[13px] text-muted-foreground">{teks("riw.kosongTugas")}</p>}
          {tasks.map((t) => (
            <div key={t.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 truncate text-[13px]">{t.title}</div>
                <StatusBadge status={t.status} label={t.status[0].toUpperCase() + t.status.slice(1)} />
              </div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{t.progress}%</div>
            </div>
          ))}
        </div>
      )}

      {tab === "perintah" && (
        <div className="rounded-2xl border border-border bg-card p-[18px]">
          {commands.length === 0 && <p className="text-[13px] text-muted-foreground">{teks("riw.kosongPerintah")}</p>}
          {commands.map((c) => (
            <div key={c.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="text-[13px]">{c.command_text}</div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                {c.status}
                {c.result ? ` · ${c.result}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "aktivitas" && (
        <div className="scroll-tipis max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-card p-[18px]">
          {feed.length === 0 && <p className="text-[13px] text-muted-foreground">{teks("pro.kosongFeed")}</p>}
          {feed.map((e) => (
            <div key={e.id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="text-[13px]">{e.message}</div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{e.time}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "sesi" && (
        <div className="scroll-tipis max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-card p-[18px]">
          {sesi.length === 0 && (
            <p className="text-[13px] text-muted-foreground">{teks("pro.kosongSesiPlugin")}</p>
          )}
          {sesi.map((s) => (
            <div key={s.session_id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[11px] text-muted-foreground">
                  {s.session_id.slice(0, 8)}… · {s.mode}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <StatusBadge
                    status={sesiSegar(s) ? "working" : s.status === "error" ? "failed" : "idle"}
                    label={s.ended_at ? teks("sesi.selesai") : !sesiSegar(s) ? teks("sesi.nonaktif") : teks("sesi.aktif")}
                  />
                  <TombolHapusSesi onHapus={() => { setGalatHapusSesi(false); setTanyaHapusSesi(s.session_id); }} />
                </div>
              </div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground" suppressHydrationWarning>
                {teks("pro.mulaiLabel")}{new Date(s.started_at).toLocaleString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
              {s.aktivitas && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] text-muted-foreground">
                  <StatusBadge
                    status={s.aktivitas.kerja === "bekerja" ? "working" : s.aktivitas.kerja === "siaga" ? "waiting" : "idle"}
                    label={
                      s.aktivitas.kerja === "bekerja"
                        ? teks("sesi.bekerja")
                        : s.aktivitas.kerja === "siaga"
                          ? teks("sesi.siagaHening").replace("{n}", String(s.aktivitas.hening_mnt ?? 0))
                          : teks("sesi.nonaktif")
                    }
                  />
                  {s.aktivitas.file_terakhir.length > 0 && (
                    <span className="truncate">
                      {s.aktivitas.file_terakhir.slice(0, 3).join(", ")}
                      {s.aktivitas.file_terakhir.length > 3 ? ` +${s.aktivitas.file_terakhir.length - 3}` : ""}
                    </span>
                  )}
                  {s.aktivitas.komit_terakhir?.sha && (
                    <span>
                      {teks("pro.komitLabel")}{s.aktivitas.komit_terakhir.sha.slice(0, 7)}
                      {s.aktivitas.komit_terakhir.files_changed !== null
                        ? ` · ${s.aktivitas.komit_terakhir.files_changed} file +${s.aktivitas.komit_terakhir.lines_added ?? 0}-${s.aktivitas.komit_terakhir.lines_removed ?? 0}`
                        : ""}
                    </span>
                  )}
                </div>
              )}
              {s.ringkasan_terakhir && (
                <p className="mt-1 truncate text-[12px] text-foreground/80" title={s.ringkasan_terakhir} suppressHydrationWarning>
                  {teks("pro.terakhirLabel")}{s.ringkasan_terakhir}
                  {s.ringkasan_waktu
                    ? ` · ${Math.max(0, Math.round((Date.now() - new Date(s.ringkasan_waktu).getTime()) / 60000))} ${teks("notif.mntLalu")}`
                    : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "ringkasan" && (
        <div className="scroll-tipis max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-card p-[18px]">
          {sesi.length === 0 && (
            <p className="text-[13px] text-muted-foreground">{teks("pro.kosongSesi")}</p>
          )}
          {sesi.slice(0, 10).every((s) => !s.ringkasan_terakhir) && sesi.length > 0 && (
            <p className="mb-2 text-[13px] text-muted-foreground">{teks("pro.kosongRingkasan")}</p>
          )}
          {sesi.slice(0, 10).map((s) => (
            <div key={s.session_id} className="border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[11px] text-muted-foreground">
                  {s.session_id.slice(0, 8)}… · {s.mode}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <StatusBadge
                    status={sesiSegar(s) ? "working" : s.status === "error" ? "failed" : "idle"}
                    label={s.ended_at ? teks("sesi.selesai") : !sesiSegar(s) ? teks("sesi.nonaktif") : teks("sesi.aktif")}
                  />
                  <TombolHapusSesi onHapus={() => { setGalatHapusSesi(false); setTanyaHapusSesi(s.session_id); }} />
                </div>
              </div>
              {s.ringkasan_terakhir ? (
                <p className="mt-1 text-[13px] leading-relaxed">
                  {s.ringkasan_terakhir}
                  {s.ringkasan_waktu
                    ? <span className="font-mono text-[10.5px] text-muted-foreground" suppressHydrationWarning> · {Math.max(0, Math.round((Date.now() - new Date(s.ringkasan_waktu).getTime()) / 60000))} {teks("notif.mntLalu")}</span>
                    : null}
                </p>
              ) : (
                <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">{teks("pro.tanpaRingkasan")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <CommandModal
        open={modalOpen}
        initialProjectId={id}
        projects={proyek ? [proyek] : []}
        onTerkirim={() => void muat()}
        onClose={() => setModalOpen(false)}
      />
      <PullModal open={pullOpen} projectId={id} repoName={proyek.repoName} onMerged={() => void muat()} onClose={() => setPullOpen(false)} />
      <ConfirmModal
        open={tanyaStop}
        judul={teks("pro.stopJudul")}
        pesan={teks("pro.stopPesanDetail").replace("{repo}", proyek.repoName)}
        labelKonfirmasi={teks("pro.stopYa")}
        danger
        onKonfirmasi={() => void stop()}
        onBatal={() => setTanyaStop(false)}
      />
      <ConfirmModal
        open={tanyaHapusSesi !== null}
        judul={teks("pro.hapusJudul")}
        pesan={galatHapusSesi ? teks("pro.hapusPesanErr") : teks("pro.hapusPesan").replace("{id}", tanyaHapusSesi?.slice(0, 8) ?? "")}
        labelKonfirmasi={teks("pro.hapusYa")}
        danger
        onKonfirmasi={() => void hapusSesi()}
        onBatal={() => { setTanyaHapusSesi(null); setGalatHapusSesi(false); }}
      />
    </div>
  );
}
