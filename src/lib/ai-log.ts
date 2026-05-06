/**
 * Журнал AI-вызовов в ai_generations. Адаптация из til-kural.
 * Ставится ПОСЛЕ каждого вызова Gemini/Groq, в паре с assertQuota() ДО.
 * Стоимость = реальное PAID-pricing (Google AI 2026-04 + Groq paid-tier on-demand).
 * Free-tier даст cost_usd=0; если кто-то включит paid project — getSpendSnapshot()
 * сразу покажет реальный расход.
 */
import { query } from "./db";

export type Provider = "gemini" | "groq";

export interface LogParams {
  provider: Provider;
  model: string;
  purpose: string;
  promptTokens?: number;
  completionTokens?: number;
  durationMs?: number;
  userId?: number | null;
}

const AUDIO_SAMPLE_RATE_HZ = 24_000; // Gemini PCM-output sample rate

const PRICING_PAID: Record<string, {
  input: number;
  output: number;
  audioOutput?: boolean;
  audioOutputPerSec?: number;
}> = {
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  "gemini-2.5-pro": { input: 1.25, output: 10.00 },
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
  "gemini-3.1-flash-tts-preview": {
    input: 0.50, output: 0, audioOutput: true, audioOutputPerSec: 0.005,
  },
  "gemini-2.5-flash-native-audio-preview-12-2025": {
    input: 0.50, output: 0, audioOutput: true, audioOutputPerSec: 0.005,
  },
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "openai/gpt-oss-120b": { input: 0.15, output: 0.75 },
};

function estimateCostUsd(provider: Provider, model: string, promptTok: number, complTok: number): number {
  // Groq на free-tier стоит $0; считаем как 0, иначе USD-cap некорректно блокирует чат.
  // Если в будущем подключат paid Groq — поставить GROQ_PAID_TIER=1 в env.
  if (provider === "groq" && process.env.GROQ_PAID_TIER !== "1") return 0;
  const p = PRICING_PAID[model];
  if (!p) return 0;
  const inputCost = (promptTok * p.input) / 1_000_000;
  let outputCost = 0;
  if (p.audioOutput && p.audioOutputPerSec) {
    const audioSeconds = complTok / AUDIO_SAMPLE_RATE_HZ;
    outputCost = audioSeconds * p.audioOutputPerSec;
  } else {
    outputCost = (complTok * p.output) / 1_000_000;
  }
  return inputCost + outputCost;
}

export async function logGeneration(params: LogParams): Promise<void> {
  const promptTokens = Math.max(0, Math.floor(params.promptTokens ?? 0));
  const completionTokens = Math.max(0, Math.floor(params.completionTokens ?? 0));
  const durationMs = Math.max(0, Math.floor(params.durationMs ?? 0));
  const costUsd = estimateCostUsd(params.provider, params.model, promptTokens, completionTokens);

  try {
    await query(
      `INSERT INTO ai_generations
       (provider, model, purpose, prompt_tokens, completion_tokens, cost_usd, duration_ms, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.provider, params.model, params.purpose,
        promptTokens, completionTokens, costUsd, durationMs,
        params.userId ?? null,
      ]
    );
  } catch (err) {
    console.warn("[ai-log] insert failed:", err);
  }
}

/** Грубая оценка числа токенов (≈4 символа на токен в смешанной кириллице/латинице). */
export function approxTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
