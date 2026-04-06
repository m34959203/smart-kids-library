"use client";

import { useState, useRef, useCallback } from "react";
import Button from "@/components/ui/Button";

interface StoryPlayerProps {
  text: string;
  locale: string;
  audioUrl?: string;
}

export default function StoryPlayer({ text, locale, audioUrl }: StoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [useServerTTS, setUseServerTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const playWithWebSpeech = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "kk" ? "kk-KZ" : "ru-RU";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [text, locale, isPlaying]);

  const playWithServerTTS = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      const response = await fetch("/api/stories/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.substring(0, 500), language: locale }),
      });

      if (!response.ok) {
        playWithWebSpeech();
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url); };
      audio.play();
      setIsPlaying(true);
    } catch {
      playWithWebSpeech();
    }
  }, [text, locale, isPlaying, playWithWebSpeech]);

  const handlePlay = () => {
    if (audioUrl) {
      if (audioRef.current) {
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

    if (useServerTTS) {
      playWithServerTTS();
    } else {
      playWithWebSpeech();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-3">
      <Button onClick={handlePlay} variant="primary" size="sm">
        {isPlaying ? (
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
      <span className="text-sm text-purple-700 font-medium">
        {isPlaying
          ? (locale === "kk" ? "Ойнатылуда..." : "Воспроизведение...")
          : (locale === "kk" ? "Тыңдау" : "Послушать")}
      </span>
      <button
        onClick={() => setUseServerTTS(!useServerTTS)}
        className="ml-auto text-xs text-purple-400 hover:text-purple-600"
      >
        {useServerTTS ? "AI Voice" : "Browser Voice"}
      </button>
    </div>
  );
}
