"use client";

import { useState, useCallback } from "react";
import { MicIcon } from "@/components/icons/age-icons";
import { cn } from "@/lib/utils";

interface VoiceAssistantProps {
  locale: string;
  onResult: (text: string) => void;
}

export default function VoiceAssistant({ locale, onResult }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = locale === "kk" ? "kk-KZ" : "ru-RU";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
      if (result.isFinal) {
        onResult(result[0].transcript);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      setTranscript("");
    };

    recognition.start();
  }, [locale, onResult]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={startListening}
        className={cn(
          "p-3 rounded-2xl transition-all",
          isListening
            ? "bg-red-500 text-white animate-pulse-glow shadow-lg"
            : "bg-purple-100 text-purple-600 hover:bg-purple-200"
        )}
      >
        <MicIcon className="w-6 h-6" />
      </button>
      {isListening && transcript && (
        <span className="text-sm text-gray-500 italic animate-pulse">{transcript}</span>
      )}
    </div>
  );
}
