"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { EVENT_TEMA, bacaTema, terapkanTema, type Tema } from "@/lib/tema";

export function PemilihTema() {
  const [tema, setTema] = useState<Tema>("gelap");

  useEffect(() => {
    setTema(bacaTema());
    const fn = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENT_TEMA, fn);
    return () => window.removeEventListener(EVENT_TEMA, fn);
  }, []);

  const berikut: Tema = tema === "gelap" ? "terang" : "gelap";

  return (
    <button
      aria-label={tema === "gelap" ? "Ganti ke terang" : "Ganti ke gelap"}
      title={tema === "gelap" ? "Ganti ke terang" : "Ganti ke gelap"}
      onClick={() => terapkanTema(berikut)}
      className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
    >
      {tema === "gelap" ? <Moon className="h-[17px] w-[17px]" /> : <Sun className="h-[17px] w-[17px]" />}
    </button>
  );
}
