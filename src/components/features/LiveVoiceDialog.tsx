"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { createPcmBlob, decodeAudioData, decodeBase64 } from "@/lib/audio/pcm";

interface Props {
  locale: string;
  topic?: string;
}

interface Line {
  role: "user" | "model";
  text: string;
  at: number;
}

type AudioCtxCtor = typeof AudioContext;
type WebkitWindow = Window & { webkitAudioContext?: AudioCtxCtor };
function getAudioCtxCtor(): AudioCtxCtor {
  return window.AudioContext || (window as WebkitWindow).webkitAudioContext!;
}

/**
 * Живой голосовой диалог с Кітапханом через Gemini Live (native-audio).
 * KK/RU. Mic → PCM 16kHz → Gemini → audio out 24kHz + транскрипция.
 */
export default function LiveVoiceDialog({ locale, topic }: Props) {
  const isKk = locale === "kk";
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [draftUser, setDraftUser] = useState("");
  const [draftAi, setDraftAi] = useState("");

  type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>["live"]["connect"]>>;
  const sessionRef = useRef<LiveSession | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const scriptRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const outSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isSpeakingRef = useRef(false);
  const isGreetedRef = useRef(false);
  const userTextRef = useRef("");
  const aiTextRef = useRef("");
  const closedRef = useRef(false);

  const cleanupAudio = useCallback(() => {
    try { scriptRef.current?.disconnect(); } catch { /* ignore */ }
    try { sourceNodeRef.current?.disconnect(); } catch { /* ignore */ }
    scriptRef.current = null;
    sourceNodeRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    outSourcesRef.current.forEach((s) => { try { s.stop(); } catch { /* ignore */ } });
    outSourcesRef.current.clear();
    try { inputCtxRef.current?.close(); } catch { /* ignore */ }
    try { outputCtxRef.current?.close(); } catch { /* ignore */ }
    inputCtxRef.current = null;
    outputCtxRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    closedRef.current = true;
    try { sessionRef.current?.close(); } catch { /* ignore */ }
    sessionRef.current = null;
    sessionPromiseRef.current = null;
    cleanupAudio();
    setConnected(false);
    setConnecting(false);
    setMicOn(false);
    setSpeaking(false);
    isSpeakingRef.current = false;
    nextStartTimeRef.current = 0;
    isGreetedRef.current = false;
    userTextRef.current = "";
    aiTextRef.current = "";
  }, [cleanupAudio]);

  useEffect(() => () => disconnect(), [disconnect]);

  const connect = useCallback(async () => {
    if (connecting || connected) return;
    setError(null);
    setConnecting(true);
    closedRef.current = false;
    isGreetedRef.current = false;
    isSpeakingRef.current = false;
    userTextRef.current = "";
    aiTextRef.current = "";
    nextStartTimeRef.current = 0;
    outSourcesRef.current.clear();
    setTranscript([]);
    setDraftUser("");
    setDraftAi("");

    try {
      const tokenRes = await fetch("/api/ai/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: locale === "kk" ? "kk" : "ru", topic }),
      });
      if (!tokenRes.ok) throw new Error(`token HTTP ${tokenRes.status}`);
      const { token, model } = await tokenRes.json();
      if (!token) throw new Error("no token");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const Ctor = getAudioCtxCtor();
      inputCtxRef.current = new Ctor({ sampleRate: 16000 });
      outputCtxRef.current = new Ctor({ sampleRate: 24000 });

      const ai = new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" } as { apiKey: string; apiVersion: string });

      const sessionPromise = ai.live.connect({
        model,
        callbacks: {
          onopen: () => {
            if (closedRef.current) return;
            setConnected(true);
            setConnecting(false);
            setMicOn(true);

            const source = inputCtxRef.current!.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = inputCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (!isGreetedRef.current) return;
              if (isSpeakingRef.current) return;
              if (!sessionRef.current) return;
              const floats = e.inputBuffer.getChannelData(0);
              const blob = createPcmBlob(floats);
              sessionRef.current.sendRealtimeInput({ media: blob });
            };

            source.connect(processor);
            processor.connect(inputCtxRef.current!.destination);

            const greet = isKk
              ? `Сәлеметсің бе! Мен — Кітапхан, кітапхана көмекшісі. ${topic ? `Тақырыбы: ${topic}. ` : ""}Қысқа амандасып, не туралы әңгіме қалайтыныңды сұра.`
              : `Привет! Я Кітапхан, цифровой библиотекарь. ${topic ? `Тема: ${topic}. ` : ""}Поздоровайся коротко и спроси, о чём поговорим.`;
            queueMicrotask(() => {
              const p = sessionPromiseRef.current;
              if (!p) return;
              p.then((s) => {
                if (closedRef.current) return;
                s.sendClientContent({
                  turns: [{ role: "user", parts: [{ text: greet }] }],
                  turnComplete: true,
                });
              }).catch(() => { /* ignore */ });
            });
          },

          onmessage: async (message) => {
            if (closedRef.current) return;
            const sc = message.serverContent;
            if (!sc) return;

            if (sc.inputTranscription?.text) {
              userTextRef.current += sc.inputTranscription.text;
              setDraftUser(userTextRef.current);
            }
            if (sc.outputTranscription?.text) {
              aiTextRef.current += sc.outputTranscription.text;
              setDraftAi(aiTextRef.current);
            }

            const audioPart = sc.modelTurn?.parts?.find((p) => p.inlineData?.mimeType?.startsWith("audio/"));
            if (audioPart?.inlineData?.data && outputCtxRef.current) {
              try {
                isSpeakingRef.current = true;
                setSpeaking(true);
                const ctx = outputCtxRef.current;
                const bytes = decodeBase64(audioPart.inlineData.data);
                const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
                const node = ctx.createBufferSource();
                node.buffer = buffer;
                node.connect(ctx.destination);
                outSourcesRef.current.add(node);
                const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
                node.start(startTime);
                nextStartTimeRef.current = startTime + buffer.duration;
                node.onended = () => {
                  outSourcesRef.current.delete(node);
                  if (outSourcesRef.current.size === 0) {
                    isSpeakingRef.current = false;
                    setSpeaking(false);
                  }
                };
                isGreetedRef.current = true;
              } catch (e) {
                console.warn("audio decode error", e);
              }
            }

            if (sc.turnComplete) {
              if (userTextRef.current.trim()) {
                setTranscript((t) => [...t, { role: "user", text: userTextRef.current.trim(), at: Date.now() }]);
              }
              if (aiTextRef.current.trim()) {
                setTranscript((t) => [...t, { role: "model", text: aiTextRef.current.trim(), at: Date.now() }]);
              }
              userTextRef.current = "";
              aiTextRef.current = "";
              setDraftUser("");
              setDraftAi("");
            }
          },

          onerror: (e) => {
            console.error("Live error", e);
            if (closedRef.current) return;
            setError(String(e));
            disconnect();
          },

          onclose: () => {
            if (!closedRef.current) {
              setConnected(false);
              setMicOn(false);
            }
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("connect error", e);
      setError(String(e));
      disconnect();
    }
  }, [connecting, connected, locale, isKk, topic, disconnect]);

  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: connected ? "#22c55e" : "var(--foreground-muted)" }} />
            {isKk ? "Тірі дауыстық диалог" : "Живой голосовой диалог"}
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
            {isKk ? "Қазақша және орысша · табиғи дауыс" : "Казахский и русский · естественный голос"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!connected ? (
            <button
              onClick={connect}
              disabled={connecting}
              className="px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {connecting ? (isKk ? "Қосылуда..." : "Подключаюсь...") : (isKk ? "🎙 Бастау" : "🎙 Начать диалог")}
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {isKk ? "Аяқтау" : "Завершить"}
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="text-sm rounded-lg p-3" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
          {error}
        </div>
      )}

      {connected && (
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1" style={{ color: micOn ? "#22c55e" : "var(--foreground-muted)" }}>
            <span className={`inline-block w-2 h-2 rounded-full ${micOn ? "animate-pulse" : ""}`} style={{ background: "currentColor" }} />
            {isKk ? "Микрофон" : "Микрофон"}
          </span>
          <span style={{ color: "var(--foreground-muted)" }}>·</span>
          <span style={{ color: speaking ? "var(--primary)" : "var(--foreground-muted)" }}>
            {speaking ? (isKk ? "Кітапхан сөйлеп жатыр…" : "Кітапхан говорит…") : (isKk ? "Күтіп тұр" : "Жду вопрос")}
          </span>
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {transcript.map((l, i) => (
          <div key={i} className={`text-sm rounded-xl px-3 py-2 ${l.role === "user" ? "ml-8 text-right" : "mr-8"}`}
            style={{ background: l.role === "user" ? "var(--muted)" : "var(--primary-light)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--foreground-muted)" }}>
              {l.role === "user" ? (isKk ? "Сен" : "Ты") : "Кітапхан"}
            </div>
            <div>{l.text}</div>
          </div>
        ))}
        {draftUser && (
          <div className="text-sm rounded-xl px-3 py-2 ml-8 text-right opacity-60" style={{ background: "var(--muted)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1">{isKk ? "Сен" : "Ты"}</div>
            <div className="italic">{draftUser}</div>
          </div>
        )}
        {draftAi && (
          <div className="text-sm rounded-xl px-3 py-2 mr-8 opacity-60" style={{ background: "var(--primary-light)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1">Кітапхан</div>
            <div className="italic">{draftAi}</div>
          </div>
        )}
        {!connected && transcript.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: "var(--foreground-muted)" }}>
            {isKk
              ? "Микрофонды қосыңыз да, кітаптар, мектеп немесе кітапхана туралы сұраңыз."
              : "Включи микрофон и спроси о книгах, школе или библиотеке."}
          </p>
        )}
      </div>
    </div>
  );
}
