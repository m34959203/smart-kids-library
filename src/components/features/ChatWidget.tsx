"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SendIcon, MicIcon } from "@/components/icons/age-icons";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: string;
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
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [escalationContact, setEscalationContact] = useState("");
  const [escalationStatus, setEscalationStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [escalationMessage, setEscalationMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
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
        escalateTitle: "Кітапханашыға сұрақ",
        contactLabel: "Email немесе телефон (қалауыңыз бойынша)",
        sendEscalation: "Жіберу",
        cancel: "Болдырмау",
        escalationSent: "Сұрақ жіберілді!",
        escalationError: "Қате. Қайталап көріңіз.",
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
        escalateTitle: "Вопрос библиотекарю",
        contactLabel: "Email или телефон (необязательно)",
        sendEscalation: "Отправить",
        cancel: "Отмена",
        escalationSent: "Вопрос отправлен!",
        escalationError: "Ошибка. Попробуйте снова.",
      };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    const currentInput = input;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          mode,
          language: locale,
          history: messages.slice(-10),
          sessionId,
        }),
      });

      const data = await response.json();
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response ?? data.error ?? "...", source: data.source },
      ]);

      // Gamification: award points for asking (silent)
      fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "request_made" }),
      }).catch(() => undefined);
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

  const submitEscalation = async () => {
    if (!escalationMessage.trim() || escalationStatus === "sending") return;
    setEscalationStatus("sending");
    try {
      const res = await fetch("/api/chat/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: escalationMessage,
          contact: escalationContact || undefined,
          language: locale,
          sessionId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEscalationStatus("sent");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message ?? labels.escalationSent,
          source: "escalation",
        },
      ]);
      setEscalationMessage("");
      setEscalationContact("");
      setTimeout(() => {
        setEscalationOpen(false);
        setEscalationStatus("idle");
      }, 1200);
    } catch {
      setEscalationStatus("error");
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={labels.title}
        aria-expanded={isOpen}
        className={cn(
          "fixed bottom-20 lg:bottom-6 right-4 z-50 w-14 h-14 rounded-full shadow-xl overflow-hidden transition-all",
          "hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4",
          "ring-[var(--primary)]/30"
        )}
        style={{ backgroundColor: "var(--surface)" }}
      >
        {isOpen ? (
          <span
            className="absolute inset-0 flex items-center justify-center text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : (
          <Image
            src="/illustrations/ai-helper.jpg"
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={labels.title}
          className="fixed bottom-36 lg:bottom-24 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-purple-100 animate-slide-up flex flex-col max-h-[500px]"
        >
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
          {!escalationOpen && (
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
                      : msg.source === "escalation"
                      ? "bg-amber-50 text-amber-900 border border-amber-200"
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
          )}

          {/* Escalation form */}
          {escalationOpen && (
            <div className="flex-1 overflow-auto p-4 space-y-3 min-h-[200px]">
              <h4 className="font-bold text-purple-900">{labels.escalateTitle}</h4>
              <textarea
                value={escalationMessage}
                onChange={(e) => setEscalationMessage(e.target.value)}
                placeholder={labels.placeholder}
                rows={4}
                className="w-full bg-purple-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none"
              />
              <label className="block text-xs text-gray-500">
                {labels.contactLabel}
                <input
                  type="text"
                  value={escalationContact}
                  onChange={(e) => setEscalationContact(e.target.value)}
                  className="mt-1 w-full bg-purple-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </label>
              {escalationStatus === "error" && (
                <p className="text-xs text-red-600">{labels.escalationError}</p>
              )}
              {escalationStatus === "sent" && (
                <p className="text-xs text-green-600">{labels.escalationSent}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitEscalation}
                  disabled={!escalationMessage.trim() || escalationStatus === "sending"}
                  className="flex-1 px-3 py-2 rounded-xl bg-purple-600 text-white font-medium text-sm disabled:opacity-50"
                >
                  {labels.sendEscalation}
                </button>
                <button
                  type="button"
                  onClick={() => setEscalationOpen(false)}
                  className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm"
                >
                  {labels.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          {!escalationOpen && (
            <div className="p-3 border-t border-purple-100">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <button
                  type="button"
                  onClick={startVoice}
                  aria-label={isListening ? "stop" : "voice"}
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
                  aria-label={labels.placeholder}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label={labels.sendEscalation}
                  className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-colors shrink-0"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </form>
              <button
                type="button"
                onClick={() => setEscalationOpen(true)}
                className="w-full mt-2 text-xs text-purple-500 hover:text-purple-700 underline transition-colors"
              >
                {labels.escalate}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
