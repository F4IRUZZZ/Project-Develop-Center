// Status ciut/bentang sidebar desktop. Pilihan persisten di localStorage
// (pola sama seperti lib/tema.ts). Default bentang. SSR-aman.
export const KUNCI_SIDEBAR = "pdc-sidebar";

export function bacaCiut(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KUNCI_SIDEBAR) === "ciut";
}

export function simpanCiut(ciut: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KUNCI_SIDEBAR, ciut ? "ciut" : "bentang");
  } catch {
    // localStorage penuh/diblokir: pilihan tak tersimpan, sidebar tetap jalan.
  }
}
