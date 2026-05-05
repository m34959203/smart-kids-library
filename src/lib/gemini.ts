import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { trackTokenUsage } from "./token-tracker";
import { assertQuota } from "./ai-quota";
import { logGeneration } from "./ai-log";

export { QuotaExceededError, userKeyFromRequest, assertUserQuota } from "./ai-quota";

let genAI: GoogleGenerativeAI | null = null;

// Модели:
// - flash       — баланс качества/скорости, для длинных ответов (essay, story)
// - flash-lite  — быстрая, для коротких чатов (SLA ≤3с) и поиска
const MODEL_DEFAULT = "gemini-2.5-flash";
const MODEL_LITE = "gemini-2.5-flash-lite";

/**
 * Kill-switch: AI_DISABLED=1 заставляет каждый AI-вызов кидать ошибку,
 * которая в caller'е должна fallback'нуться на FAQ / static content.
 * Используется для T1 (утечка ключа) и экономии trial credit.
 */
export class AiDisabledError extends Error {
  constructor() {
    super("AI is disabled via AI_DISABLED=1 env flag");
    this.name = "AiDisabledError";
  }
}

function getClient(): GoogleGenerativeAI {
  if (process.env.AI_DISABLED === "1") {
    throw new AiDisabledError();
  }
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getModel(modelName: string = MODEL_DEFAULT): GenerativeModel {
  return getClient().getGenerativeModel({ model: modelName });
}

export interface GeminiResponse {
  text: string;
  tokensUsed: number;
}

export async function generateText(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
    endpoint?: string;
  }
): Promise<GeminiResponse> {
  const modelName = options?.model ?? MODEL_DEFAULT;
  await assertQuota(modelName);
  const model = getModel(modelName);

  const parts = [];
  if (options?.systemPrompt) {
    parts.push({ text: `System: ${options.systemPrompt}\n\nUser: ${prompt}` });
  } else {
    parts.push({ text: prompt });
  }

  const startedAt = Date.now();
  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    },
  });

  const response = result.response;
  const text = response.text();
  const usage = response.usageMetadata;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? 0;
  const tokensUsed = usage?.totalTokenCount ?? promptTokens + completionTokens;
  const durationMs = Date.now() - startedAt;

  await trackTokenUsage(tokensUsed, modelName, options?.endpoint ?? "general");
  await logGeneration({
    provider: "gemini",
    model: modelName,
    purpose: options?.endpoint ?? "general",
    promptTokens, completionTokens, durationMs,
  });

  return { text, tokensUsed };
}

/**
 * Чат — короткие ответы, SLA ≤3с. Используем lite-модель.
 */
export async function generateChat(
  messages: Array<{ role: "user" | "model"; content: string }>,
  systemPrompt?: string,
  endpoint?: string
): Promise<GeminiResponse> {
  const modelName = MODEL_LITE;
  await assertQuota(modelName);
  const model = getModel(modelName);

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history,
    systemInstruction: systemPrompt
      ? { role: "system", parts: [{ text: systemPrompt }] }
      : undefined,
    generationConfig: {
      maxOutputTokens: 800,
      temperature: 0.7,
    },
  });

  const startedAt = Date.now();
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;
  const text = response.text();
  const usage = response.usageMetadata;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? 0;
  const tokensUsed = usage?.totalTokenCount ?? promptTokens + completionTokens;
  const durationMs = Date.now() - startedAt;

  await trackTokenUsage(tokensUsed, modelName, endpoint ?? "chat");
  await logGeneration({
    provider: "gemini",
    model: modelName,
    purpose: endpoint ?? "chat",
    promptTokens, completionTokens, durationMs,
  });

  return { text, tokensUsed };
}

/**
 * JSON-mode: гарантированный JSON через Gemini responseMimeType.
 * Если parse не удался — повторная попытка с более жёстким system-prompt.
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  systemPrompt?: string
): Promise<{ data: T; tokensUsed: number }> {
  const modelName = MODEL_DEFAULT;
  await assertQuota(modelName);
  const model = getModel(modelName);

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const startedAt = Date.now();

  const attempt = async (extraStrict: boolean) => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: extraStrict ? `${fullPrompt}\n\nВажно: верни ТОЛЬКО валидный JSON, без markdown-фенсов и пояснений.` : fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });
    return result.response;
  };

  let response = await attempt(false);
  let raw = response.text();
  let tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

  const tryParse = (s: string): T | null => {
    try {
      // на всякий случай чистим markdown-фенсы (если responseMimeType проигнорирован)
      const cleaned = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      return JSON.parse(cleaned) as T;
    } catch {
      return null;
    }
  };

  let data = tryParse(raw);
  if (data === null) {
    // вторая попытка
    response = await attempt(true);
    raw = response.text();
    tokensUsed += response.usageMetadata?.totalTokenCount ?? 0;
    data = tryParse(raw);
    if (data === null) {
      await trackTokenUsage(tokensUsed, modelName, "json-failed");
      await logGeneration({
        provider: "gemini", model: modelName, purpose: "json-failed",
        promptTokens: 0, completionTokens: tokensUsed, durationMs: Date.now() - startedAt,
      });
      throw new Error(`Gemini JSON parse failed: ${raw.slice(0, 200)}`);
    }
  }

  await trackTokenUsage(tokensUsed, modelName, "json");
  await logGeneration({
    provider: "gemini", model: modelName, purpose: "json",
    promptTokens: 0, completionTokens: tokensUsed, durationMs: Date.now() - startedAt,
  });
  return { data, tokensUsed };
}
