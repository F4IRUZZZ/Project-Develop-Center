// Polling adaptif: setTimeout berantai + backoff eksponensial saat gagal.
// Gantikan setInterval mentah di 9 titik polling client: jeda berikutnya
// dihitung SETELAH respons selesai (tanpa request menumpuk saat lambat),
// melambat x2 (maks 60 dtk) saat gagal, reset saat sukses, dan menahan
// diri saat tab hidden. Perilaku sukses identik interval lama.
// Kontrak fn: resolve true = sukses (reset), false/throw = gagal (backoff).
// 4xx selain 429 dianggap kesalahan client: lanjut interval normal.
export interface OpsiPolling {
  awalMs: number;
  maksMs?: number;
  faktor?: number;
  hormatiHidden?: boolean;
}

export interface KendaliPolling {
  berhenti(): void;
  sedangJalan(): boolean;
}

const MAKS_DEFAULT = 60000;
const TUNDA_HIDDEN = 15000;

export function mulaiPolling(fn: () => Promise<boolean>, opsi: OpsiPolling): KendaliPolling {
  const maks = opsi.maksMs ?? MAKS_DEFAULT;
  const faktor = opsi.faktor ?? 2;
  const hormatiHidden = opsi.hormatiHidden ?? true;
  let jeda = opsi.awalMs;
  let timer: number | null = null;
  let jalan = true;

  const putaran = async () => {
    if (!jalan) return;
    if (
      hormatiHidden &&
      typeof document !== "undefined" &&
      document.hidden
    ) {
      timer = window.setTimeout(putaran, Math.min(jeda, TUNDA_HIDDEN));
      return;
    }
    let ok = false;
    try {
      ok = await fn();
    } catch {
      ok = false;
    }
    jeda = ok ? opsi.awalMs : Math.min(maks, jeda * faktor);
    if (!jalan) return;
    timer = window.setTimeout(putaran, jeda);
  };

  timer = window.setTimeout(putaran, 0);
  return {
    berhenti() {
      jalan = false;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    },
    sedangJalan() {
      return jalan;
    },
  };
}
