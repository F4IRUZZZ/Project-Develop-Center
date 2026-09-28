// Tema PDC: gelap (Nebula, default) / terang / sistem (ikut OS).
// Pilihan persisten di localStorage. Mode sistem mengikuti preferensi OS
// secara live via matchMedia.
export type Tema = "gelap" | "terang" | "sistem";

export const KUNCI_TEMA = "pdc-tema";
export const EVENT_TEMA = "pdc-tema";

export function bacaTema(): Tema {
  if (typeof window === "undefined") return "gelap";
  const s = window.localStorage.getItem(KUNCI_TEMA);
  return s === "terang" || s === "sistem" ? s : "gelap";
}

export function gelapAktif(): boolean {
  const t = bacaTema();
  if (t === "terang") return false;
  if (t === "gelap") return true;
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function terapkanTema(t: Tema) {
  const gelap = t === "gelap" || (t === "sistem" && typeof window !== "undefined" && typeof window.matchMedia !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", gelap);
    document.documentElement.classList.toggle("light", !gelap);
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KUNCI_TEMA, t);
    window.dispatchEvent(new CustomEvent<Tema>(EVENT_TEMA, { detail: t }));
  }
}

// Panggil sekali saat aplikasi dimuat agar mode sistem mengikuti perubahan OS.
export function pantauSistem(): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const fn = () => {
    if (bacaTema() === "sistem") terapkanTema("sistem");
  };
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}
