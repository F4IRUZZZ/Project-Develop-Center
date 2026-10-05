"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Copy, KeyRound, Trash2, GitBranch, AlertTriangle, ShieldCheck, User, Palette, Sparkles, Sun, Moon, Monitor, Send, BellRing, Smartphone } from "lucide-react";
import { bacaTema, terapkanTema, type Tema } from "@/lib/tema";
import { LoginCard } from "@/components/dashboard/LoginCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PemilihBahasa } from "@/components/shell/PemilihBahasa";
import { useBahasa } from "@/components/shell/BahasaProvider";
import { bacaBisu, bukaKunciAudio, simpanBisu } from "@/lib/bunyi";
import { mintaIzinNotifikasi, statusIzinNotifikasi } from "@/lib/peringatan";
import { matikanPush, nyalakanPush, pushDidukung, statusPush } from "@/lib/push-client";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface TujuanTg {
  id: string;
  label: string;
  chat_id: string;
  aktif: boolean;
}

export default function Pengaturan() {
  const { data: session, status } = useSession();
  const { teks } = useBahasa();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [nama, setNama] = useState("opencode-local");
  const [baru, setBaru] = useState<string | null>(null);
  const [disalin, setDisalin] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  // Default gelap dulu (cocok SSR) + sinkron setelah mount (anti #418).
  const [tema, setTema] = useState<Tema>("gelap");
  const [tersimpan, setTersimpan] = useState<string[]>([]);
  const [gagalSimpan, setGagalSimpan] = useState<string | null>(null);
  const [bisu, setBisu] = useState<boolean>(false);
  const [izinNotif, setIzinNotif] = useState<string>("tanya");
  const [push, setPush] = useState<string>("tanya");
  const [tgList, setTgList] = useState<TujuanTg[]>([]);
  const [tgLabel, setTgLabel] = useState("Telegram");
  const [tgToken, setTgToken] = useState("");
  const [tgChat, setTgChat] = useState("");
  const [tgInfo, setTgInfo] = useState<string | null>(null);

  const [modal, setModal] = useState({
    open: false,
    judul: "",
    pesan: "",
    labelKonfirmasi: "",
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
    fetch("/api/notif-tujuan", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTgList(d as TujuanTg[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setTema(bacaTema());
    setBisu(bacaBisu());
    setIzinNotif(statusIzinNotifikasi());
    if (pushDidukung()) {
      void statusPush().then(setPush);
    } else {
      setPush("tak-dukung");
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const t = window.setTimeout(() => void muat(), 0);
    return () => window.clearTimeout(t);
  }, [status, muat]);

  if (status === "loading") return <p className="font-mono text-xs text-muted-foreground">{teks("shell.muatSesi")}</p>;
  if (!session?.user) return <LoginCard />;

  const triggerModal = (judul: string, pesan: string, action: () => void, labelKonfirmasi = teks("modal.yaLanjut"), danger = true) => {
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

  const prosesHapus = async (id: string) => {
    await fetch(`/api/keys/${id}?permanen=1`, { method: "DELETE" });
    muat();
    tutupModal();
  };

  const prosesBersihkanDicabut = async () => {
    const revokedKeys = keys.filter((k) => k.revoked);
    await Promise.all(revokedKeys.map((k) => fetch(`/api/keys/${k.id}?permanen=1`, { method: "DELETE" })));
    muat();
    tutupModal();
  };

  const simpanTg = async () => {
    setTgInfo(null);
    try {
      const res = await fetch("/api/notif-tujuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: tgLabel, bot_token: tgToken, chat_id: tgChat }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setTgInfo(d.error ?? teks("atur.gagalSimpan"));
      } else {
        setTgToken("");
        setTgChat("");
        setTgInfo(teks("atur.tgTersimpan"));
        muat();
      }
    } catch {
      setTgInfo(teks("atur.jaringanGagal"));
    }
  };

  const tesTg = async (id: string) => {
    setTgInfo(null);
    try {
      const res = await fetch(`/api/notif-tujuan/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "test" }),
      });
      setTgInfo(res.ok ? teks("atur.tgTerkirim") : teks("atur.tgGagalKirim"));
    } catch {
      setTgInfo(teks("atur.jaringanGagal"));
    }
  };

  const hapusTg = (id: string, label: string) => {
    triggerModal(
      teks("atur.tgHapusJudul"),
      teks("atur.tgHapusPesan").replace("{name}", label),
      async () => {
        await fetch(`/api/notif-tujuan/${id}`, { method: "DELETE" }).catch(() => {});
        muat();
        tutupModal();
      },
      teks("atur.hapusYa")
    );
  };

  const simpanGithubToken = () => {
    simpanProvider("github_pat", "Token GitHub", githubToken, () => setGithubToken(""));
  };

  const simpanProvider = (provider: string, label: string, nilai: string, resetFn: () => void) => {
    setGagalSimpan(null);
    triggerModal(
      teks("atur.simpanJudul").replace("{label}", label),
      teks("atur.simpanPesan").replace("{label}", label),
      async () => {
        try {
          const res = await fetch("/api/provider-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, key: nilai }),
          });
          if (!res.ok) {
            const d = (await res.json().catch(() => ({}))) as { error?: string };
            setGagalSimpan(d.error ?? teks("atur.gagalSimpan"));
          } else {
            resetFn();
            muat();
          }
        } catch {
          setGagalSimpan(teks("atur.jaringanGagal"));
        }
        tutupModal();
      },
      teks("atur.simpanYa"),
      false
    );
  };

  const salin = async () => {
    if (!baru) return;
    await navigator.clipboard.writeText(baru).catch(() => {});
    setDisalin(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <h2 className="mb-1 text-[17px] font-semibold tracking-tight">{teks("atur.judul")}</h2>
      <p className="mb-6 text-[13px] text-muted-foreground">{teks("atur.sub")}</p>
      {gagalSimpan && (
        <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-500">
          {gagalSimpan}
        </p>
      )}

      {/* SEKSI PROFIL & TEMA */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
          <User className="h-4 w-4" /> {teks("atur.profilJudul")}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[13px] font-medium text-foreground">{session?.user?.name || teks("atur.penggunaDefault")}</div>
            <div className="text-[12px] text-muted-foreground">{session?.user?.email || teks("atur.emailKosong")}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <PemilihBahasa />
          </div>
        </div>
      </div>

      {/* SEKSI PROVIDER AI */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <Sparkles className="h-4 w-4" /> {teks("atur.providerJudul")}
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          {teks("atur.providerSub")}
          {tersimpan.includes("openai") && <span className="text-emerald-500"> {teks("atur.tersimpan").replace("{p}", "OpenAI")}</span>}
          {tersimpan.includes("anthropic") && <span className="text-emerald-500"> {teks("atur.tersimpan").replace("{p}", "Anthropic")}</span>}
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
              <ShieldCheck className="h-4 w-4" /> {teks("atur.simpanBtn")}
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
              <ShieldCheck className="h-4 w-4" /> {teks("atur.simpanBtn")}
            </button>
          </div>
        </div>
      </div>

      {/* SEKSI GITHUB TOKEN */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <GitBranch className="h-4 w-4" /> {teks("atur.githubJudul")}
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          {teks("atur.githubSub")}
          {tersimpan.includes("github_pat") && <span className="text-emerald-500"> {teks("atur.tersimpan").replace("{p}", "GitHub")}</span>}
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
            <ShieldCheck className="h-4 w-4" /> {teks("atur.simpanBtn")}
          </button>
        </div>
      </div>

      {/* SEKSI API KEY MCP */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <KeyRound className="h-4 w-4" /> {teks("atur.mcpJudul")}
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">{teks("atur.mcpSub")}</p>
        <div className="mb-5 flex gap-2">
          <input
            id="mcpKeyName"
            name="mcpKeyName"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder={teks("atur.namaPlaceholder")}
            className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
          />
          <button
            onClick={buat}
            className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-border bg-transparent px-4 py-2 text-[13px] font-medium hover:bg-muted"
          >
            {teks("atur.buatKey")}
          </button>
        </div>
        {baru && (
          <div className="mb-5 mt-3 rounded-[9px] border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="mb-1 font-mono text-[11px] text-amber-500">{teks("atur.salinJudul")}</div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{baru}</code>
              <button
                onClick={salin}
                className="flex shrink-0 items-center gap-1 rounded-[9px] border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" /> {disalin ? teks("atur.tersalin") : teks("atur.salin")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border bg-muted/30">
          <div className="border-b border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground">
            {teks("atur.keyAktif").replace("{n}", String(keys.filter((k) => !k.revoked).length))}
          </div>
          {keys.length === 0 && <div className="px-3 py-3 text-[13px] text-muted-foreground">{teks("atur.belumKey")}</div>}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 last:border-b-0">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">
                  {k.name} <span className="font-mono text-[11px] text-muted-foreground">{k.prefix}…</span>
                </div>
                <div className="font-mono text-[10.5px] text-muted-foreground">
                  {k.revoked ? teks("atur.dicabut") : k.last_used_at ? teks("atur.dipakai").replace("{t}", k.last_used_at.slice(0, 16).replace("T", " ")) : teks("atur.belumDipakai")}
                </div>
              </div>
              {!k.revoked ? (
                <button
                  onClick={() => triggerModal(teks("atur.cabutJudul"), teks("atur.cabutPesan").replace("{name}", k.name), () => prosesCabut(k.id))}
                  title={teks("atur.cabutTitle")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() =>
                    triggerModal(
                      teks("atur.hapusJudul"),
                      teks("atur.hapusPesan").replace("{name}", k.name),
                      () => prosesHapus(k.id),
                      teks("atur.hapusYa")
                    )
                  }
                  title={teks("atur.hapusTitle")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEKSI TELEGRAM */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <BellRing className="h-4 w-4" /> {teks("atur.tgJudul")}
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">{teks("atur.tgSub")}</p>
        <div className="mb-3 flex flex-col gap-2">
          <input
            id="tgLabel"
            name="tgLabel"
            value={tgLabel}
            onChange={(e) => setTgLabel(e.target.value)}
            placeholder={teks("atur.tgLabelPh")}
            className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
          />
          <input
            id="tgToken"
            name="tgToken"
            type="password"
            value={tgToken}
            onChange={(e) => setTgToken(e.target.value)}
            placeholder={teks("atur.tgTokenPh")}
            className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 font-mono text-[13px] focus:border-primary focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              id="tgChat"
              name="tgChat"
              value={tgChat}
              onChange={(e) => setTgChat(e.target.value)}
              placeholder={teks("atur.tgChatPh")}
              className="min-w-0 flex-1 rounded-[9px] border border-border bg-muted px-3 py-2 font-mono text-[13px] focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => void simpanTg()}
              disabled={!tgToken || !tgChat}
              className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-[#5457E5] disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" /> {teks("atur.simpanBtn")}
            </button>
          </div>
        </div>
        {tgInfo && (
          <p className="mb-3 text-[12.5px] text-muted-foreground">{tgInfo}</p>
        )}
        {tgList.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/30">
            {tgList.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 last:border-b-0">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{t.label}</div>
                  <div className="font-mono text-[10.5px] text-muted-foreground">{t.chat_id}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => void tesTg(t.id)}
                    title={teks("atur.tgTes")}
                    className="flex h-8 w-8 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => hapusTg(t.id, t.label)}
                    title={teks("atur.hapusTitle")}
                    className="flex h-8 w-8 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEKSI NOTIFIKASI SUARA + POP-UP */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <BellRing className="h-4 w-4" /> {teks("notifSuara.judul")}
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">{teks("notifSuara.sub")}</p>
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">{teks("notifSuara.bunyi")}</span>
            <button
              role="switch"
              aria-checked={!bisu}
              onClick={() => {
                const v = !bisu;
                setBisu(v);
                simpanBisu(v);
                if (!v) bukaKunciAudio();
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${bisu ? "bg-muted" : "bg-primary"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${bisu ? "left-0.5" : "left-[22px]"}`}
              />
            </button>
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              {teks("notifSuara.izin")} ·{" "}
              <span className="font-mono text-[11px] text-muted-foreground">
                {izinNotif === "granted"
                  ? teks("notifSuara.izinOk")
                  : izinNotif === "denied"
                    ? teks("notifSuara.izinTolak")
                    : izinNotif === "tak-dukung"
                      ? teks("notifSuara.izinTakDukung")
                      : teks("notifSuara.izinTanya")}
              </span>
            </span>
            <button
              onClick={async () => {
                bukaKunciAudio();
                setIzinNotif(await mintaIzinNotifikasi());
              }}
              className="shrink-0 rounded-[9px] border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {teks("notifSuara.izin")}
            </button>
          </div>
        </div>
      </div>

      {/* SEKSI PUSH TRAY HP */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          <Smartphone className="h-4 w-4" /> {teks("push.judul")}
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">{teks("push.sub")}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-foreground">
            {push === "aktif" ? teks("push.nyala") : push === "tak-dukung" || push === "tanpa-kunci" ? teks(push === "tak-dukung" ? "push.takDukung" : "push.tanpaKunci") : teks("push.mati")}
          </span>
          {push === "aktif" ? (
            <button
              onClick={async () => {
                if (await matikanPush()) setPush("mati");
              }}
              className="shrink-0 rounded-[9px] border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {teks("push.matikan")}
            </button>
          ) : (
            <button
              onClick={async () => {
                if (await nyalakanPush()) setPush("aktif");
                else setPush(await statusPush());
              }}
              disabled={push === "tak-dukung" || push === "tanpa-kunci"}
              className="shrink-0 rounded-[9px] bg-primary px-4 py-2 text-[12px] font-medium text-white hover:bg-[#5457E5] disabled:opacity-50"
            >
              {teks("push.nyalakan")}
            </button>
          )}
        </div>
      </div>

      {/* SEKSI DANGER ZONE */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-[18px]">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-red-600 dark:text-red-500">
          <AlertTriangle className="h-4 w-4" /> {teks("atur.dangerJudul")}
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">{teks("atur.dangerSub")}</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-t border-red-500/10 pt-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">{teks("atur.cabutSemuaJudul")}</div>
              <div className="text-[12px] text-muted-foreground">{teks("atur.cabutSemuaSub")}</div>
            </div>
            <button
              onClick={() => triggerModal(
                teks("atur.cabutSemuaJudulModal"),
                teks("atur.cabutSemuaPesan"),
                prosesCabutSemua,
                teks("atur.cabutSemuaYa")
              )}
              disabled={keys.filter((k) => !k.revoked).length === 0}
              className="rounded-[9px] bg-red-500/10 px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:hover:bg-red-500/10 disabled:hover:text-red-600 transition-colors"
            >
              {teks("atur.cabutSemuaBtn")}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-red-500/10 pt-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">{teks("atur.bersihJudul")}</div>
              <div className="text-[12px] text-muted-foreground">{teks("atur.bersihSub")}</div>
            </div>
            <button
              onClick={() => triggerModal(
                teks("atur.bersihJudulModal"),
                teks("atur.bersihPesan"),
                prosesBersihkanDicabut,
                teks("atur.bersihYa")
              )}
              disabled={keys.filter((k) => k.revoked).length === 0}
              className="rounded-[9px] bg-red-500/10 px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:hover:bg-red-500/10 disabled:hover:text-red-600 transition-colors"
            >
              {teks("atur.bersihBtn")}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-red-500/10 pt-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">{teks("atur.hapusAkunJudul")}</div>
              <div className="text-[12px] text-muted-foreground">{teks("atur.hapusAkunSub")}</div>
            </div>
            <button
              onClick={() => triggerModal(
                teks("atur.hapusAkunJudulModal"),
                teks("atur.hapusAkunPesan"),
                async () => {
                  try {
                    const res = await fetch("/api/account", { method: "DELETE" });
                    if (!res.ok) {
                      setGagalSimpan(teks("atur.gagalHapusAkun"));
                      tutupModal();
                      return;
                    }
                  } catch {
                    setGagalSimpan(teks("atur.jaringanGagal"));
                    tutupModal();
                    return;
                  }
                  tutupModal();
                  await signOut();
                },
                teks("atur.hapusAkunYa")
              )}
              className="rounded-[9px] bg-red-500 px-4 py-2 text-[12px] font-medium text-white hover:bg-red-600 transition-colors"
            >
              {teks("atur.hapusAkunBtn")}
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