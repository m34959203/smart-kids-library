/**
 * Vertex AI провайдер (свежий $300-trial проект zhezu-052026).
 *
 * Зачем: AI-Studio-ключ (GEMINI_API_KEY) выжжен по бюджету → Gemini-fallback
 * и TTS падали с usd_daily/503, утягивая за собой бесплатный Groq.
 * Vertex даёт реальный бюджет + работает с серверной из Hoster.kz (в обход
 * geo-block AI Studio, см. [[feedback_hoster_kz_gemini_block]]).
 *
 * Включается флагом VERTEX_AI=1 + GOOGLE_CLOUD_PROJECT + GOOGLE_APPLICATION_CREDENTIALS
 * (путь к SA-json). Без флага модуль не активен — поведение проекта прежнее.
 *
 * Аутентификация — Service Account через google-auth-library (ADC). Токен
 * кешируется в процессе (~50 мин), REST-вызов на {location}-aiplatform.
 */
import { GoogleAuth } from "google-auth-library";

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

export function vertexEnabled(): boolean {
  return process.env.VERTEX_AI === "1" && !!PROJECT;
}

let auth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (!auth) {
    // GOOGLE_APPLICATION_CREDENTIALS (путь к SA-json) подхватывается автоматически.
    auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  }
  return auth;
}

let cachedToken: { token: string; exp: number } | null = null;
async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.exp > now) return cachedToken.token;
  const client = await getAuth().getClient();
  const res = await client.getAccessToken();
  const token = res.token || "";
  // access-token живёт ~1ч; кешируем 50 мин
  cachedToken = { token, exp: now + 50 * 60_000 };
  return token;
}

export interface VertexError extends Error { status?: number }

/** Низкоуровневый generateContent через Vertex REST. Бросает с .status при !ok. */
export async function vertexGenerateContent(
  model: string,
  body: Record<string, unknown>,
): Promise<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }> {
  const token = await getToken();
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err: VertexError = new Error(`Vertex ${model} HTTP ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Текстовая генерация: возвращает {text, promptTokens, completionTokens}. */
export async function vertexGenerateText(
  model: string,
  opts: { systemPrompt?: string; userText: string; history?: Array<{ role: "user" | "model"; text: string }>; temperature?: number; maxTokens?: number; responseJson?: boolean },
): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const h of opts.history ?? []) contents.push({ role: h.role, parts: [{ text: h.text }] });
  contents.push({ role: "user", parts: [{ text: opts.userText }] });

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 1024,
      ...(opts.responseJson ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.systemPrompt) {
    body.systemInstruction = { role: "user", parts: [{ text: opts.systemPrompt }] };
  }

  const data = await vertexGenerateContent(model, body);
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  return {
    text,
    promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
