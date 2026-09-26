// Tema PDC: gelap (Nebula, default) / terang. Pilihan persisten di localStorage.
export type Tema = "gelap" | "terang";

export const KUNCI_TEMA = "pdc-tema";
export const EVENT_TEMA = "pdc-tema";

export function bacaTema(): Tema {
  if (typeof window === "undefined") return "gelap";
  return window.localStorage.getItem(KUNCI_TEMA) === "terang" ? "terang" : "gelap";
}

export function terapkanTema(t: Tema) {
  document.documentElement.classList.toggle("dark", t === "gelap");
  document.documentElement.classList.toggle("light", t === "terang");
  window.localStorage.setItem(KUNCI_TEMA, t);
  window.dispatchEvent(new CustomEvent<Tema>(EVENT_TEMA, { detail: t }));
}
