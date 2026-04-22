"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AgeGroup } from "./utils";

interface AgeProfileContextValue {
  ageGroup: AgeGroup | null;
  setAgeGroup: (g: AgeGroup | null) => void;
  /** True once the stored profile has been read from localStorage. */
  hydrated: boolean;
}

const AgeProfileContext = createContext<AgeProfileContextValue | null>(null);
const STORAGE_KEY = "skl.ageProfile";

export function AgeProfileProvider({ children }: { children: React.ReactNode }) {
  const [ageGroup, setAgeGroupState] = useState<AgeGroup | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "6-9" || saved === "10-13" || saved === "14-17") {
        setAgeGroupState(saved);
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  const setAgeGroup = useCallback((g: AgeGroup | null) => {
    setAgeGroupState(g);
    try {
      if (g) localStorage.setItem(STORAGE_KEY, g);
      else localStorage.removeItem(STORAGE_KEY);
      document.cookie = `skl_age=${g ?? ""}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent("age-profile-changed", { detail: g }));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ ageGroup, setAgeGroup, hydrated }), [ageGroup, setAgeGroup, hydrated]);

  return <AgeProfileContext.Provider value={value}>{children}</AgeProfileContext.Provider>;
}

export function useAgeProfile(): AgeProfileContextValue {
  const ctx = useContext(AgeProfileContext);
  if (!ctx) {
    return { ageGroup: null, setAgeGroup: () => {}, hydrated: true };
  }
  return ctx;
}

export const AGE_MENU: Record<AgeGroup, Array<{ key: string; href: (locale: string) => string; label: Record<string, string> }>> = {
  "6-9": [
    { key: "kids-home", href: (l) => `/${l}/kids`, label: { ru: "Главная", kk: "Басты" } },
    { key: "stories", href: (l) => `/${l}/kids/stories`, label: { ru: "Сказки", kk: "Ертегілер" } },
    { key: "coloring", href: (l) => `/${l}/kids/coloring`, label: { ru: "Раскраски", kk: "Бояулар" } },
    { key: "events", href: (l) => `/${l}/events`, label: { ru: "События", kk: "Оқиғалар" } },
  ],
  "10-13": [
    { key: "catalog", href: (l) => `/${l}/catalog`, label: { ru: "Каталог", kk: "Каталог" } },
    { key: "quizzes", href: (l) => `/${l}/kids/quizzes`, label: { ru: "Викторины", kk: "Викториналар" } },
    { key: "workshop", href: (l) => `/${l}/kids/workshop`, label: { ru: "Книжный клуб", kk: "Кітап клубы" } },
    { key: "events", href: (l) => `/${l}/events`, label: { ru: "События", kk: "Оқиғалар" } },
  ],
  "14-17": [
    { key: "catalog", href: (l) => `/${l}/catalog`, label: { ru: "Новинки", kk: "Жаңалықтар" } },
    { key: "essay", href: (l) => `/${l}/kids/workshop`, label: { ru: "Рефераты", kk: "Рефераттар" } },
    { key: "education", href: (l) => `/${l}/resources`, label: { ru: "К экзаменам", kk: "Емтихандарға" } },
    { key: "events", href: (l) => `/${l}/events`, label: { ru: "События", kk: "Оқиғалар" } },
  ],
};
