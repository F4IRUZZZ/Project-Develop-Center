"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { EVENT_TEMA, bacaTema, gelapAktif, pantauSistem, terapkanTema, type Tema } from "@/lib/tema";

export function PemilihTema() {
  const [tema, setTema] = useState<Tema>("gelap");
  const [gelap, setGelap] = useState(true);

  useEffect(() => {
    setTema(bacaTema());
    setGelap(gelapAktif());
    const fn = (e: Event) => {
      setTema((e as CustomEvent<Tema>).detail);
      setGelap(gelapAktif());
    };
    window.addEventListener(EVENT_TEMA, fn);
    const stop = pantauSistem();
    return () => {
      window.removeEventListener(EVENT_TEMA, fn);
      stop();
    };
  }, []);

  const berikut: Tema = gelap ? "terang" : "gelap";

  return (
    <button
      aria-label={gelap ? "Ganti ke terang" : "Ganti ke gelap"}
      title={gelap ? "Ganti ke terang" : "Ganti ke gelap"}
      onClick={() => terapkanTema(berikut)}
      className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
    >
      {gelap ? <Moon className="h-[17px] w-[17px]" /> : <Sun className="h-[17px] w-[17px]" />}
    </button>
  );
}
