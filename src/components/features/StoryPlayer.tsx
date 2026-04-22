"use client";

import { useState, useRef, useCallback } from "react";
import Button from "@/components/ui/Button";

interface StoryPlayerProps {
  text: string;
  locale: string;
  audioUrl?: string;
}

/**
 * Озвучивание сказок только через Gemini TTS (browser SpeechSynthesis удалён).
 * Если TTS недоступен — показываем сообщение, без fallback.
 */
export default function StoryPlayer({ text, locale, audioUrl }: StoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playGemini = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    setLoading(true);
    setUnavailable(false);
    try {
      const r = await fetch("/api/stories/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.substring(0, 1000), language: locale }),
      });
      if (!r.ok) {
        setUnavailable(true);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setIsPlaying(true);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [text, locale, isPlaying]);

  const handlePlay = () => {
    if (audioUrl) {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
      return;
    }
    playGemini();
  };

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3"
      style={{ background: "var(--primary-light)", border: "1px solid var(--border)" }}
    >
      <Button onClick={handlePlay} variant="primary" size="sm" disabled={loading || unavailable}>
        {loading ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 60" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </Button>
      <span className="text-sm font-medium" style={{ color: "var(--primary-dark)" }}>
        {unavailable
          ? locale === "kk" ? "Дауыс уақытша қол жетімсіз" : "Озвучка временно недоступна"
          : loading
          ? locale === "kk" ? "Дайындалуда…" : "Готовлю аудио…"
          : isPlaying
          ? locale === "kk" ? "Ойнатылуда…" : "Воспроизведение…"
          : locale === "kk" ? "Тыңдау (Gemini AI)" : "Послушать (Gemini AI)"}
      </span>
    </div>
  );
}
