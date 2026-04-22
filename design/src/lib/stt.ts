// Speech-to-Text utility (client-side only, uses Web Speech API)
// This file provides helper types and functions for STT integration

export interface STTResult {
  transcript: string;
  confidence: number;
  language: string;
}

export interface STTConfig {
  language: "ru-RU" | "kk-KZ";
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (result: STTResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function isSTTSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function createSTTInstance(config: STTConfig) {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = new (SpeechRecognition as any)();
  recognition.lang = config.language;
  recognition.continuous = config.continuous ?? false;
  recognition.interimResults = config.interimResults ?? true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    if (result.isFinal && config.onResult) {
      config.onResult({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        language: config.language,
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    config.onError?.(event.error);
  };

  recognition.onend = () => {
    config.onEnd?.();
  };

  return recognition;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
