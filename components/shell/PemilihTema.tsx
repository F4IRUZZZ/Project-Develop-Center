"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { EVENT_TEMA, gelapAktif, pantauSistem, terapkanTema, type Tema } from "@/lib/tema";

export function PemilihTema() {
  // Default gelap dulu (cocok SSR) + sinkron setelah mount (anti #418).
  const [gelap, setGelap] = useState<boolean>(true);

  useEffect(() => {
    setGelap(gelapAktif());
    const fn = () => {
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
