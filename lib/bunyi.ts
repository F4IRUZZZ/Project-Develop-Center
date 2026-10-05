// Bunyi notifikasi via Web Audio (tanpa file/aset biner). Konteks dibuka
// saat interaksi pertama (syarat autoplay browser); toggle bisu persisten.
export const KUNCI_BISU = "pdc-bisu";

export function bacaBisu(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KUNCI_BISU) === "1";
}

export function simpanBisu(bisu: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KUNCI_BISU, bisu ? "1" : "0");
  } catch {
    /* abaikan */
  }
}

let ctx: AudioContext | null = null;
let terbuka = false;

function konteks(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// Buka kunci audio dari gesture pengguna (klik/sentuh). Panggil sekali.
export function bukaKunciAudio() {
  if (terbuka) return;
  terbuka = true;
  konteks();
  if (typeof window !== "undefined") {
    const lepas = () => {
      konteks();
    };
    window.addEventListener("pointerdown", lepas, { once: true });
  }
}

function nada(mulaiHz: number, selesaiHz: number, tundaMs: number, durasiMs = 180) {
  const ac = konteks();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t0 = ac.currentTime + tundaMs / 1000;
    osc.type = "sine";
    osc.frequency.setValueAtTime(mulaiHz, t0);
    osc.frequency.linearRampToValueAtTime(selesaiHz, t0 + durasiMs / 1000);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durasiMs / 1000);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + durasiMs / 1000 + 0.05);
  } catch {
    /* abaikan */
  }
}

export type NadaPenting = "selesai" | "gagal" | "penting";

export function bunyikan(jenis: NadaPenting) {
  if (bacaBisu()) return;
  if (jenis === "selesai") {
    nada(660, 880, 0);
    nada(880, 1174, 160);
  } else if (jenis === "gagal") {
    nada(392, 262, 0, 220);
  } else {
    nada(740, 740, 0, 120);
    nada(740, 740, 180, 120);
  }
}
