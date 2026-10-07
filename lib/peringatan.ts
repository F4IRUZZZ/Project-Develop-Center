// Peringatan notifikasi penting baru: toast + bunyi + Notification browser.
// Dipanggil dari NotifBadge.muat (satu titik, Topbar + drawer tercakup).
// Fetch pertama = inisialisasi diam (tumpukan lama tak dibunyikan).
import { bukaKunciAudio, bunyikan, type NadaPenting } from "./bunyi";
import { bacaBahasa, t, type Kunci } from "./kamus";
import type { Notifikasi } from "./notifikasi";

export interface Peringatan {
  id: string;
  judul: string;
  pesan: string;
  jenis: NadaPenting;
}

type Dengar = (p: Peringatan) => void;

const pendengar = new Set<Dengar>();
let terlihat: Set<string> | null = null;

export function dengarPeringatan(fn: Dengar): () => void {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}

function jenisDari(n: { type: string }): NadaPenting {
  if (n.type === "error") return "gagal";
  if (n.type === "info") return "selesai";
  return "penting";
}

import { barisBaruPenting } from "./peringatan-inti";

function judulDari(n: { type: string }): string {
  const lang = bacaBahasa();
  const kunci: Kunci =
    n.type === "error" ? "notifToast.gagal" : n.type === "info" ? "notifToast.selesai" : "notifToast.penting";
  return t(lang, kunci);
}

// Panggil tiap daftar segar. Kembalikan jumlah peringatan baru.
export function cekPeringatan(rows: Notifikasi[]): number {
  const hasil = barisBaruPenting(rows, terlihat);
  terlihat = hasil.terlihat;
  for (const r of hasil.baru) {
    const p: Peringatan = {
      id: r.id,
      judul: judulDari(r),
      pesan: `${r.message} · ${r.repo_name}`,
      jenis: jenisDari(r),
    };
    bukaKunciAudio();
    bunyikan(p.jenis);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(p.judul, { body: p.pesan, tag: p.id });
      } catch {
        /* abaikan */
      }
    }
    pendengar.forEach((fn) => {
      try {
        fn(p);
      } catch {
        /* abaikan */
      }
    });
  }
  return hasil.baru.length;
}

// Peringatan lokal (#208): toast + bunyi (+ Notification browser) TANPA
// baris feed — untuk momen flip working->aktif yang terdeteksi klien.
// Tanpa spam server/feed/Telegram/task; cocok untuk sinyal cepat per giliran.
export function peringatanLokal(judul: string, pesan: string, jenis: NadaPenting = "selesai"): void {
  const p: Peringatan = {
    id: `lokal-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    judul,
    pesan,
    jenis,
  };
  try {
    bukaKunciAudio();
  } catch {
    /* abaikan */
  }
  try {
    bunyikan(p.jenis);
  } catch {
    /* abaikan */
  }
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(p.judul, { body: p.pesan, tag: p.id });
    } catch {
      /* abaikan */
    }
  }
  pendengar.forEach((fn) => {
    try {
      fn(p);
    } catch {
      /* abaikan */
    }
  });
}

export function mintaIzinNotifikasi(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return Promise.resolve("denied" as NotificationPermission);
  }
  return Notification.requestPermission();
}

export function statusIzinNotifikasi(): string {
  if (typeof window === "undefined" || !("Notification" in window)) return "tak-dukung";
  return Notification.permission;
}
