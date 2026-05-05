/**
 * LLM dispatcher: Groq → Gemini failover на 429.
 *
 *   LLM_PROVIDER=groq      → Groq всегда первый (failover на Gemini при rate limit)
 *   LLM_PROVIDER=auto      → если GROQ_API_KEY есть, идём через Groq, иначе сразу Gemini
 *   LLM_PROVIDER=gemini    → только Gemini (по умолчанию для совместимости)
 *
 * Используется в /api/chatbot и других chat-эндпоинтах когда нужно «дешевое»
 * прохождение в Groq free-tier и страховка Gemini на случай падения. Vision
 * и TTS остаются на Gemini (Groq их не поддерживает).
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { groqChat, AIRateLimitError, GROQ_MODELS, type GroqMessage } from "./groq";
import { assertQuota, QuotaExceededError } from "../ai-quota";
import { logGeneration, approxTokens } from "../ai-log";

export type Provider = "gemini" | "groq";

export interface DispatchMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DispatchOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  /** Назначение, пишется в ai_generations.purpose */
  purpose?: string;
  userId?: number | null;
}

export interface DispatchResult {
  content: string;
  provider: Provider;
  model: string;
  tokensUsed: number;
}

const groqKey = process.env.GROQ_API_KEY || "";
const geminiKey = process.env.GEMINI_API_KEY || "";
const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

function useGroqFirst(): boolean {
  if (!groqKey) return false;
  if (provider === "groq") return true;
  return provider === "auto" && !geminiKey;
}

function hasGeminiFallback(): boolean {
  return !!geminiKey;
}

let genAI: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!genAI) {
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(geminiKey);
  }
  return genAI;
}

async function chatViaGroq(opts: {
  systemPrompt: string;
  userMessage: string;
  history: DispatchMessage[];
  options: DispatchOptions;
}): Promise<DispatchResult> {
  const messages: GroqMessage[] = [
    { role: "system", content: opts.systemPrompt },
    ...opts.history.map((h) => ({
      role: (h.role === "system" ? "user" : h.role) as GroqMessage["role"],
      content: h.content,
    })),
    { role: "user", content: opts.userMessage },
  ];
  const startedAt = Date.now();
  const res = await groqChat({
    messages,
    model: GROQ_MODELS.text,
    temperature: opts.options.temperature,
    maxTokens: opts.options.maxTokens,
  });
  const promptTok = res.usage?.prompt_tokens ?? approxTokens(messages.map(m => m.content).join("\n"));
  const complTok = res.usage?.completion_tokens ?? approxTokens(res.content);
  await logGeneration({
    provider: "groq", model: GROQ_MODELS.text,
    purpose: opts.options.purpose ?? "chat",
    promptTokens: promptTok, completionTokens: complTok,
    durationMs: Date.now() - startedAt,
    userId: opts.options.userId ?? null,
  });
  return {
    content: res.content,
    provider: "groq",
    model: GROQ_MODELS.text,
    tokensUsed: (res.usage?.total_tokens) ?? promptTok + complTok,
  };
}

async function chatViaGemini(opts: {
  systemPrompt: string;
  userMessage: string;
  history: DispatchMessage[];
  options: DispatchOptions;
}): Promise<DispatchResult> {
  const modelName = "gemini-2.5-flash-lite";
  await assertQuota(modelName);
  const model = getGemini().getGenerativeModel({ model: modelName });
  const startedAt = Date.now();
  const chat = model.startChat({
    history: opts.history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    systemInstruction: { role: "system", parts: [{ text: opts.systemPrompt }] },
    generationConfig: {
      maxOutputTokens: opts.options.maxTokens ?? 800,
      temperature: opts.options.temperature ?? 0.7,
    },
  });
  const result = await chat.sendMessage(opts.userMessage);
  const response = result.response;
  const text = response.text();
  const usage = response.usageMetadata;
  const promptTok = usage?.promptTokenCount ?? 0;
  const complTok = usage?.candidatesTokenCount ?? 0;
  await logGeneration({
    provider: "gemini", model: modelName,
    purpose: opts.options.purpose ?? "chat",
    promptTokens: promptTok, completionTokens: complTok,
    durationMs: Date.now() - startedAt,
    userId: opts.options.userId ?? null,
  });
  return {
    content: text,
    provider: "gemini",
    model: modelName,
    tokensUsed: usage?.totalTokenCount ?? promptTok + complTok,
  };
}

/**
 * Главный entry: попробовать Groq если он первый, при rate-limit
 * автоматически failover на Gemini (если ключ есть). Иначе сразу Gemini.
 */
export async function dispatchChat(
  systemPrompt: string,
  userMessage: string,
  history: DispatchMessage[] = [],
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  if (useGroqFirst()) {
    try {
      return await chatViaGroq({ systemPrompt, userMessage, history, options });
    } catch (err) {
      if (err instanceof AIRateLimitError && hasGeminiFallback()) {
        console.warn("[dispatch] Groq rate-limited, falling back to Gemini");
        return await chatViaGemini({ systemPrompt, userMessage, history, options });
      }
      // QuotaExceededError из Gemini-ветки прокинется выше — пусть caller обработает
      if (err instanceof QuotaExceededError) throw err;
      throw err;
    }
  }
  return await chatViaGemini({ systemPrompt, userMessage, history, options });
}

export { AIRateLimitError } from "./groq";
