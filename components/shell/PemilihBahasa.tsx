"use client";

import { Languages } from "lucide-react";
import { useBahasa } from "./BahasaProvider";
import type { Lang } from "@/lib/kamus";

// Segmen ID|EN untuk seksi Tampilan di Pengaturan (pola radiogroup tema).
export function PemilihBahasa() {
  const { lang, setLang, teks } = useBahasa();
  const opsi: Array<{ value: Lang; label: string }> = [
    { value: "id", label: "ID" },
    { value: "en", label: "EN" },
  ];
  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <div
        role="radiogroup"
        aria-label={teks("bahasa.label")}
        className="flex items-center gap-1 rounded-full bg-muted p-1"
      >
        {opsi.map(({ value, label }) => (
          <button
            key={value}
            role="radio"
            aria-checked={lang === value}
            onClick={() => setLang(value)}
            className={`flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              lang === value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
