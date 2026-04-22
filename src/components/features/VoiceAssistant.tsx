"use client";

import { useState, useCallback, useRef } from "react";
import { MicIcon } from "@/components/icons/age-icons";
import { cn } from "@/lib/utils";
import { detectLanguage } from "@/lib/lang-detect";

interface VoiceAssistantProps {
  locale: string;
  /** Если задан — компонент только слушает и отдаёт текст наружу (legacy-режим). */
  onResult?: (text: string) => void;
  /** Если true — встроенный полный голосовой loop: mic → /api/chatbot → /api/stories/tts → автопроигрывание. */
  voiceLoop?: boolean;
}

export default function VoiceAssistant({ locale, onResult, voiceLoop = !onResult }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, lang: "ru" | "kk") => {
    try {
      const r = await fetch("/api/stories/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        await audio.play();
        return;
      }
    } catch {
      /* fallback */
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang === "kk" ? "kk-KZ" : "ru-RU";
      window.speechSynthesis.speak(utt);
    }
  }, []);

  const handleFinal = useCallback(async (text: string) => {
    if (onResult) {
      onResult(text);
      return;
    }
    if (!voiceLoop) return;

    const lang = detectLanguage(text, locale === "kk" ? "kk" : "ru");
    setIsThinking(true);
    setReply("");
    try {
      const r = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: lang, mode: "general" }),
      });
      const data = await r.json();
      const answer = data.response || data.answer || "";
      setReply(answer);
      if (answer) await speak(answer, lang);
    } catch (e) {
      console.error("voice loop error", e);
    } finally {
      setIsThinking(false);
    }
  }, [locale, onResult, voiceLoop, speak]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SR as any)();
    recognition.lang = locale === "kk" ? "kk-KZ" : "ru-RU";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setReply("");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
      if (result.isFinal) handleFinal(result[0].transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [locale, handleFinal]);

  const labelHint = locale === "kk" ? "Микрофонды басып, сұрақ қойыңыз" : "Нажмите микрофон и задайте вопрос";
  const labelThinking = locale === "kk" ? "Ойлануда…" : "Думаю…";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={startListening}
          disabled={isThinking}
          aria-label={labelHint}
          className={cn(
            "p-3 rounded-2xl transition-all",
            isListening
              ? "bg-red-500 text-white animate-pulse-glow shadow-lg"
              : isThinking
              ? "bg-amber-300 text-amber-900"
              : "bg-purple-100 text-purple-600 hover:bg-purple-200"
          )}
        >
          <MicIcon className="w-6 h-6" />
        </button>
        <div className="text-sm text-gray-600 min-h-[1.25rem]">
          {isListening && transcript && <span className="italic">{transcript}</span>}
          {isThinking && <span>{labelThinking}</span>}
          {!isListening && !isThinking && !reply && <span className="text-gray-400">{labelHint}</span>}
        </div>
      </div>
      {reply && voiceLoop && (
        <div className="rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-900">
          {reply}
        </div>
      )}
    </div>
  );
}
