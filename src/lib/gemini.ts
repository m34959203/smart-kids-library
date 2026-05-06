/**
 * Public Gemini API для проекта — тонкий обёртка над dispatch'ом, чтобы
 * существующие эндпоинты (10+ файлов под src/app/api/) не пришлось трогать
 * при переключении LLM-провайдера.
 *
 * Все вызовы идут через src/lib/llm/dispatch.ts:
 *   - LLM_PROVIDER=groq → Groq llama-3.3-70b (chat) / openai/gpt-oss-120b (json)
 *   - failover на Gemini при rate-limit (если GEMINI_API_KEY задан)
 *
 * Прямые Gemini-вызовы остались в src/lib/gemini-direct.ts — нужны
 * только для (а) fallback из dispatch, (б) TTS-эндпоинтов и vision,
 * где Groq не применим.
 */
import { dispatchText, dispatchChat, dispatchJSON } from "./llm/dispatch";

export { QuotaExceededError, userKeyFromRequest, assertUserQuota } from "./ai-quota";
export { AiDisabledError } from "./gemini-direct";

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
    model?: string;        // игнорируется dispatch'ем (выбирает по провайдеру)
    endpoint?: string;
  }
): Promise<GeminiResponse> {
  const r = await dispatchText(prompt, {
    systemPrompt: options?.systemPrompt,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    purpose: options?.endpoint ?? "general",
  });
  return { text: r.content, tokensUsed: r.tokensUsed };
}

export async function generateChat(
  messages: Array<{ role: "user" | "model"; content: string }>,
  systemPrompt?: string,
  endpoint?: string
): Promise<GeminiResponse> {
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "model" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
  const lastMessage = messages[messages.length - 1];
  const r = await dispatchChat(systemPrompt ?? "", lastMessage?.content ?? "", history, {
    purpose: endpoint ?? "chat",
    maxTokens: 800,
    temperature: 0.7,
  });
  return { text: r.content, tokensUsed: r.tokensUsed };
}

export async function generateJSON<T = unknown>(
  prompt: string,
  systemPrompt?: string
): Promise<{ data: T; tokensUsed: number }> {
  const r = await dispatchJSON<T>(prompt, {
    systemPrompt,
    purpose: "json",
  });
  return { data: r.data, tokensUsed: r.tokensUsed };
}
