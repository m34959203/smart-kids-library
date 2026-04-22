"use client";

import { useRef, useState } from "react";

interface Props {
  text: string;
  language: "ru" | "kk";
  label?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Универсальная кнопка озвучивания через Gemini TTS (наш /api/stories/tts).
 * Используется для аннотаций книг, страниц читалки, любого блока с текстом.
 */
export default function BookTTS({ text, language, label, size = "md" }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const isError = state === "error";

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState("idle");
  };

  const play = async () => {
    if (isPlaying) return stop();
    setState("loading");
    try {
      const r = await fetch("/api/stories/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.substring(0, 4000), language }),
      });
      if (!r.ok) {
        setState("error");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setState("idle");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setState("error");
      };
      await audio.play();
      setState("playing");
    } catch {
      setState("error");
    }
  };

  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-sm" : "px-4 py-2 text-sm";
  const baseLabel =
    label ?? (language === "kk" ? "Тыңдау" : "Послушать");
  const display = isError
    ? language === "kk" ? "Дауыс қол жетімсіз" : "Озвучка недоступна"
    : isLoading
    ? language === "kk" ? "Дайындалуда…" : "Готовлю…"
    : isPlaying
    ? language === "kk" ? "Тоқтату" : "Остановить"
    : baseLabel;

  return (
    <button
      onClick={play}
      disabled={isError || isLoading}
      className={`inline-flex items-center gap-2 rounded-full font-semibold transition-all disabled:opacity-50 ${sz}`}
      style={{
        background: isPlaying ? "var(--accent)" : "var(--primary-light)",
        color: isPlaying ? "white" : "var(--primary-dark)",
        border: "1px solid var(--border)",
      }}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 60" />
        </svg>
      ) : isPlaying ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
      {display}
    </button>
  );
}
