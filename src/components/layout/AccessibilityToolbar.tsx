"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  locale: string;
}

type TextSize = "normal" | "large" | "x-large";
type Contrast = "default" | "high";

const STORAGE_KEY = "skl.a11y";

interface A11yPrefs {
  textSize: TextSize;
  contrast: Contrast;
  dyslexic: boolean;
}

const DEFAULT: A11yPrefs = { textSize: "normal", contrast: "default", dyslexic: false };

function applyPrefs(p: A11yPrefs) {
  const root = document.documentElement;
  root.dataset.a11yText = p.textSize;
  root.dataset.a11yContrast = p.contrast;
  root.dataset.a11yDyslexic = String(p.dyslexic);
  const sizeMap = { normal: "100%", large: "115%", "x-large": "130%" };
  root.style.fontSize = sizeMap[p.textSize];
  if (p.contrast === "high") {
    root.style.setProperty("--a11y-bg", "#000");
    root.style.setProperty("--a11y-fg", "#fff200");
    root.classList.add("a11y-high-contrast");
  } else {
    root.classList.remove("a11y-high-contrast");
  }
}

export default function AccessibilityToolbar({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const p = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefs(p);
      applyPrefs(p);
    } catch {
      applyPrefs(DEFAULT);
    }
  }, []);

  const update = (patch: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      applyPrefs(next);
      return next;
    });
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const readPage = async () => {
    if (reading && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setReading(false);
      return;
    }
    const main = document.getElementById("main");
    if (!main) return;
    const text = main.innerText.slice(0, 4000);
    setReading(true);
    try {
      const r = await fetch("/api/stories/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: locale === "kk" ? "kk" : "ru" }),
      });
      if (!r.ok) {
        setReading(false);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setReading(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      await audio.play();
    } catch {
      setReading(false);
    }
  };

  const labels = {
    ru: {
      open: "Специальные возможности",
      textSize: "Размер текста",
      contrast: "Контраст",
      read: reading ? "Остановить озвучку" : "Озвучить страницу",
      dyslexic: "Удобный для дислексии шрифт",
      reset: "Сбросить",
      sizes: { normal: "Обычный", large: "Крупный", "x-large": "Очень крупный" },
      contrasts: { default: "Обычный", high: "Высокий" },
      close: "Закрыть",
    },
    kk: {
      open: "Қолжетімділік",
      textSize: "Мәтін өлшемі",
      contrast: "Контраст",
      read: reading ? "Оқуды тоқтату" : "Бетті дауыстап оқу",
      dyslexic: "Дислексияға ыңғайлы қаріп",
      reset: "Қалпына келтіру",
      sizes: { normal: "Қалыпты", large: "Ірі", "x-large": "Өте ірі" },
      contrasts: { default: "Қалыпты", high: "Жоғары" },
      close: "Жабу",
    },
  };
  const l = labels[locale === "kk" ? "kk" : "ru"];

  return (
    <>
      <button
        type="button"
        aria-label={l.open}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 left-4 z-40 w-12 h-12 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus-visible:ring-4 focus-visible:ring-purple-300 flex items-center justify-center"
      >
        <span aria-hidden="true" className="text-xl">♿</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={l.open}
          className="fixed bottom-40 left-4 z-40 w-72 bg-white rounded-2xl shadow-2xl border border-purple-100 p-4 text-sm"
        >
          <div className="font-bold text-purple-900 mb-3">{l.open}</div>

          <fieldset className="mb-3">
            <legend className="text-xs text-gray-600 mb-1">{l.textSize}</legend>
            <div className="flex gap-1">
              {(["normal", "large", "x-large"] as TextSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update({ textSize: s })}
                  className={`px-2 py-1 rounded-lg text-xs border ${
                    prefs.textSize === s
                      ? "bg-purple-100 border-purple-400 text-purple-700"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {l.sizes[s]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-3">
            <legend className="text-xs text-gray-600 mb-1">{l.contrast}</legend>
            <div className="flex gap-1">
              {(["default", "high"] as Contrast[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ contrast: c })}
                  className={`px-2 py-1 rounded-lg text-xs border ${
                    prefs.contrast === c
                      ? "bg-purple-100 border-purple-400 text-purple-700"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {l.contrasts[c]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={prefs.dyslexic}
              onChange={(e) => update({ dyslexic: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-xs">{l.dyslexic}</span>
          </label>

          <button
            type="button"
            onClick={readPage}
            className="w-full px-3 py-2 rounded-lg bg-purple-600 text-white font-medium text-xs mb-2 hover:bg-purple-700"
          >
            {l.read}
          </button>

          <button
            type="button"
            onClick={() => update(DEFAULT)}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs hover:bg-gray-200"
          >
            {l.reset}
          </button>
        </div>
      )}
    </>
  );
}
