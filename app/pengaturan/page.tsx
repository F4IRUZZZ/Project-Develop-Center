"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Copy, KeyRound, Trash2, GitBranch, AlertTriangle, ShieldCheck, User, Palette, Sparkles, Sun, Moon, Monitor } from "lucide-react";
import { terapkanTema, type Tema } from "@/lib/tema";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function Pengaturan() {
  const { data: session, status } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [nama, setNama] = useState("opencode-local");
  const [baru, setBaru] = useState<string | null>(null);
  const [disalin, setDisalin] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [tema, setTema] = useState<Tema>("gelap");
  const [tersimpan, setTersimpan] = useState<string[]>([]);
  const [gagalSimpan, setGagalSimpan] = useState<string | null>(null);

  const [modal, setModal] = useState({
    open: false,
    judul: "",
    pesan: "",
    labelKonfirmasi: "Ya, lanjutkan",
    danger: true,
    action: () => {},
  });

  const muat = useCallback(() => {
    fetch("/api/keys", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setKeys(d as ApiKey[]))
      .catch(() => {});
    fetch("/api/provider-keys", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTersimpan((d as Array<{ provider: string }>).map((x) => x.provider)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("pdc-tema");
      setTema(s === "terang" || s === "sistem" ? (s as Tema) : "gelap");
    }
    if (status === "authenticated") void muat();
  }, [status, muat]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">Memuat sesi…</p>;
  if (!session?.user) return <LoginCard />;

  const triggerModal = (judul: string, pesan: string, action: () => void, labelKonfirmasi = "Ya, lanjutkan", danger = true) => {
    setModal({ open: true, judul, pesan, action, labelKonfirmasi, danger });
  };

  const tutupModal = () => setModal((m) => ({ ...m, open: false }));

  const buat = async () => {
    setBaru(null);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nama }),
    });
    if (!res.ok) return;
    const d = (await res.json()) as { key: string };
    setBaru(d.key);
    setDisalin(false);
    muat();
  };

  const prosesCabut = async (id: string) => {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    muat();
    tutupModal();
  };

  const prosesCabutSemua = async () => {
    const activeKeys = keys.filter((k) => !k.revoked);
    await Promise.all(activeKeys.map((k) => fetch(`/api/keys/${k.id}`, { method: "DELETE" })));
    muat();
    tutupModal();
  };

  const simpanGithubToken = () => {
    simpanProvider("github_pat", "Token GitHub", githubToken, () => setGithubToken(""));
  };

  const simpanProvider = (provider: string, label: string, nilai: string, resetFn: () => void) => {
    setGagalSimpan(null);
    triggerModal(
      `Simpan API Key ${label}`,
      `API Key untuk ${label} akan dienkripsi di server (BYOK) dan tidak diekspos ke antarmuka. Lanjutkan?`,
      async () => {
        try {
          const res = await fetch("/api/provider-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, key: nilai }),
          });
          if (!res.ok) {
            const d = (await res.json().catch(() => ({}))) as { error?: string };
            setGagalSimpan(d.error ?? "Gagal menyimpan.");
          } else {
            resetFn();
            muat();
          }
        } catch {
          setGagalSimpan("Jaringan gagal. Coba lagi.");
        }
        tutupModal();
      },
      "Simpan Key",
      false
    );
  };

  const salin = async () => {
    if (!baru) return;
    await navigator.clipboard.writeText(baru).catch(() => {});
    setDisalin(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 pb-20">
      <h2 className="mb-1 text-[17px] font-semibold tracking-tight">Pengaturan</h2>
      <p className="mb-6 text-[13px] text-muted-foreground">
        Kelola preferensi, kredensial integrasi, dan keamanan proyek Anda.
      </p>
      {gagalSimpan && (
        <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
          {gagalSimpan}
        </p>
      )}

      {/* SEKSI PROFIL & TEMA */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
          <User className="h-4 w-4" /> Profil & Tampilan
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[13px] font-medium text-foreground">{session?.user?.name || "Pengguna"}</div>
            <div className="text-[12px] text-muted-foreground">{session?.user?.email || "Email tidak tersedia"}</div>
          </div>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <div
              role="radiogroup"
              aria-label="Pilih tema tampilan"
              className="flex items-center gap-1 rounded-full bg-muted p-1"
            >
              {(
                [
                  { value: "terang", label: "Light", Icon: Sun },
                  { value: "gelap", label: "Dark", Icon: Moon },
                  { value: "sistem", label: "System", Icon: Monitor },
                ] as const
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={tema === value}
                  onClick={() => {
                    setTema(value);
                    terapkanTema(value);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    tema === value
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEKSI PROVIDER AI */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <Sparkles className="h-4 w-4" /> Provider LLM (BYOK)
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Simpan API key untuk mengaktifkan asisten AI eksternal. Kredensial akan dienkripsi.
          {tersimpan.includes("openai") && <span className="text-emerald-500"> OpenAI tersimpan ✓</span>}
          {tersimpan.includes("anthropic") && <span className="text-emerald-500"> Anthropic tersimpan ✓</span>}
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              id="openaiKey"
              name="openaiKey"
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-xxxxxxxxxxxx (OpenAI)"
              className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => simpanProvider("openai", "OpenAI", openaiKey, () => setOpenaiKey(""))}
              disabled={!openaiKey}
              className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-[#5457E5] disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" /> Simpan
            </button>
          </div>
          <div className="flex gap-2">
            <input
              id="anthropicKey"
              name="anthropicKey"
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-xxxxxxxxxxxx (Anthropic)"
              className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => simpanProvider("anthropic", "Anthropic", anthropicKey, () => setAnthropicKey(""))}
              disabled={!anthropicKey}
              className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-[#5457E5] disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" /> Simpan
            </button>
          </div>
        </div>
      </div>

      {/* SEKSI GITHUB TOKEN */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <GitBranch className="h-4 w-4" /> Integrasi GitHub
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Simpan Personal Access Token (PAT) untuk keperluan CI/CD dan PR. Token dijamin aman.
          {tersimpan.includes("github_pat") && <span className="text-emerald-500"> Tersimpan ✓</span>}
        </p>
        <div className="flex gap-2">
          <input
            id="githubToken"
            name="githubToken"
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
          />
          <button
            onClick={simpanGithubToken}
            disabled={!githubToken}
            className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-[#5457E5] disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" /> Simpan
          </button>
        </div>
      </div>

      {/* SEKSI API KEY MCP */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <KeyRound className="h-4 w-4" /> Jembatan MCP (OpenCode)
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          API key untuk mengizinkan akses ke endpoint MCP. Key hanya tampil sekali.
        </p>
        <div className="mb-5 flex gap-2">
          <input
            id="mcpKeyName"
            name="mcpKeyName"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama key, mis. opencode-local"
            className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
          />
          <button
            onClick={buat}
            className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-border bg-transparent px-4 py-2 text-[13px] font-medium hover:bg-muted"
          >
            Buat Key
          </button>
        </div>
        {baru && (
          <div className="mb-5 mt-3 rounded-[9px] border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="mb-1 font-mono text-[11px] text-amber-500">Salin sekarang — tidak ditampilkan lagi:</div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{baru}</code>
              <button
                onClick={salin}
                className="flex shrink-0 items-center gap-1 rounded-[9px] border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" /> {disalin ? "Tersalin" : "Salin"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border bg-muted/30">
          <div className="border-b border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground">
            Key aktif ({keys.filter((k) => !k.revoked).length})
          </div>
          {keys.length === 0 && <div className="px-3 py-3 text-[13px] text-muted-foreground">Belum ada key.</div>}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 last:border-b-0">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">
                  {k.name} <span className="font-mono text-[11px] text-muted-foreground">{k.prefix}…</span>
                </div>
                <div className="font-mono text-[10.5px] text-muted-foreground">
                  {k.revoked ? "dicabut" : k.last_used_at ? `dipakai ${k.last_used_at.slice(0, 16).replace("T", " ")}` : "belum dipakai"}
                </div>
              </div>
              {!k.revoked && (
                <button
                  onClick={() => triggerModal("Cabut Key?", `Yakin ingin mencabut akses untuk key '${k.name}'?`, () => prosesCabut(k.id))}
                  title="Cabut key"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEKSI DANGER ZONE */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-red-600 dark:text-red-500">
          <AlertTriangle className="h-4 w-4" /> Danger Zone
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Tindakan di bawah ini bersifat destruktif dan tidak dapat dibatalkan.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-t border-red-500/10 pt-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">Cabut Semua API Key Aktif</div>
              <div className="text-[12px] text-muted-foreground">Memutus semua koneksi MCP yang menggunakan key saat ini.</div>
            </div>
            <button
              onClick={() => triggerModal(
                "Cabut Semua Key?",
                "Apakah Anda yakin ingin mencabut semua API key yang aktif? Semua agen atau integrasi yang terhubung akan kehilangan akses saat ini juga.",
                prosesCabutSemua,
                "Ya, cabut semua"
              )}
              disabled={keys.filter((k) => !k.revoked).length === 0}
              className="rounded-[9px] bg-red-500/10 px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:hover:bg-red-500/10 disabled:hover:text-red-600 transition-colors"
            >
              Cabut Semua
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-red-500/10 pt-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">Hapus Akun & Data</div>
              <div className="text-[12px] text-muted-foreground">Menghapus profil beserta seluruh konfigurasi secara permanen.</div>
            </div>
            <button
              onClick={() => triggerModal(
                "Hapus Akun?",
                "Tindakan ini akan menghapus seluruh data proyek, log, dan pengaturan Anda secara permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?",
                async () => {
                  try {
                    const res = await fetch("/api/account", { method: "DELETE" });
                    if (!res.ok) {
                      setGagalSimpan("Gagal menghapus akun. Coba lagi.");
                      tutupModal();
                      return;
                    }
                  } catch {
                    setGagalSimpan("Jaringan gagal. Coba lagi.");
                    tutupModal();
                    return;
                  }
                  tutupModal();
                  await signOut();
                },
                "Hapus Permanen"
              )}
              className="rounded-[9px] bg-red-500 px-4 py-2 text-[12px] font-medium text-white hover:bg-red-600 transition-colors"
            >
              Hapus Akun
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={modal.open}
        judul={modal.judul}
        pesan={modal.pesan}
        labelKonfirmasi={modal.labelKonfirmasi}
        danger={modal.danger}
        onKonfirmasi={modal.action}
        onBatal={tutupModal}
      />
    </div>
  );
}