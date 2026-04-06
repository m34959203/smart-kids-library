"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SendIcon, MicIcon } from "@/components/icons/age-icons";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  locale: string;
}

export default function ChatWidget({ locale }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"general" | "search" | "education">("general");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const labels = locale === "kk"
    ? {
        title: "Кітапханашы-көмекші",
        placeholder: "Сұрақ қойыңыз...",
        welcome: "Сәлем! Мен цифрлық кітапханашымын. Нені көмектесе аламын?",
        thinking: "Ойланамын...",
        general: "Жалпы",
        search: "Кітап іздеу",
        education: "Оқу",
        escalate: "Кітапханашымен байланысу",
      }
    : {
        title: "Библиотекарь-помощник",
        placeholder: "Задайте вопрос...",
        welcome: "Привет! Я цифровой библиотекарь. Чем могу помочь?",
        thinking: "Думаю...",
        general: "Общий",
        search: "Поиск книг",
        education: "Учеба",
        escalate: "Связаться с библиотекарем",
      };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          mode,
          language: locale,
          history: messages.slice(-10),
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response ?? data.error ?? "..." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: locale === "kk" ? "Қате орын алды. Кейінірек көріңіз." : "Произошла ошибка. Попробуйте позже." },
      ]);
    }

    setLoading(false);
  };

  const startVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = locale === "kk" ? "kk-KZ" : "ru-RU";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 lg:bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all",
          "bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-2xl",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-36 lg:bottom-24 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-purple-100 animate-slide-up flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-2xl">
            <h3 className="font-bold">{labels.title}</h3>
            <div className="flex gap-1 mt-2">
              {(["general", "search", "education"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-xs transition-colors",
                    mode === m ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  {labels[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <div className="bg-purple-50 rounded-2xl p-3 text-sm text-purple-700">
                {labels.welcome}
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl p-3 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-purple-500 text-white"
                    : "bg-purple-50 text-purple-900"
                )}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-purple-50 rounded-2xl p-3 text-sm text-purple-500 animate-pulse">
                {labels.thinking}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-purple-100">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <button
                type="button"
                onClick={startVoice}
                className={cn(
                  "p-2 rounded-xl transition-colors shrink-0",
                  isListening ? "bg-red-100 text-red-500 animate-pulse" : "bg-purple-50 text-purple-500 hover:bg-purple-100"
                )}
              >
                <MicIcon className="w-5 h-5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={labels.placeholder}
                className="flex-1 bg-purple-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-colors shrink-0"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
            <button className="w-full mt-2 text-xs text-purple-400 hover:text-purple-600 transition-colors">
              {labels.escalate}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
