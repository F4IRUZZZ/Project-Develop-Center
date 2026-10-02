"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { bacaBahasa, simpanBahasa, t, type Kunci, type Lang } from "@/lib/kamus";

interface Nilai {
  lang: Lang;
  setLang: (l: Lang) => void;
  teks: (k: Kunci) => string;
}

const Konteks = createContext<Nilai>({ lang: "id", setLang: () => {}, teks: (k) => t("id", k) });

export function BahasaProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => bacaBahasa());

  const setLang = useCallback((l: Lang) => {
    simpanBahasa(l);
    setLangState(l);
  }, []);

  useEffect(() => {
    setLangState(bacaBahasa());
  }, []);

  const teks = useCallback((k: Kunci) => t(lang, k), [lang]);

  return <Konteks.Provider value={{ lang, setLang, teks }}>{children}</Konteks.Provider>;
}

export function useBahasa(): Nilai {
  return useContext(Konteks);
}
