/**
 * Groq client wrapper, OpenAI-compatible. Используем разные модели:
 *  - текст / chat / RAG: llama-3.3-70b-versatile (быстро, поддерживает только json_object)
 *  - structured JSON (упражнения, writing-check): openai/gpt-oss-120b (json_schema, function calling)
 *
 * AIRateLimitError — унифицированная ошибка 429, по которой dispatcher делает
 * failover на Gemini (если GEMINI_API_KEY задан).
 */
import Groq from 'groq-sdk';

export class AIRateLimitError extends Error {
  provider: string;
  retryAfter?: number;
  scope?: 'tpm' | 'tpd' | 'rpm' | 'rpd' | 'unknown';
  constructor(provider: string, retryAfter?: number, scope: AIRateLimitError['scope'] = 'unknown') {
    super(`[${provider}] rate limit hit (scope=${scope}, retryAfter=${retryAfter ?? '?'}s)`);
    this.name = 'AIRateLimitError';
    this.provider = provider;
    this.retryAfter = retryAfter;
    this.scope = scope;
  }
}

function parseRetryAfterSec(headers: unknown): number | undefined {
  if (!headers || typeof headers !== 'object') return undefined;
  const h = headers as Record<string, string | undefined>;
  const ra = h['retry-after'] || h['Retry-After'];
  if (!ra) return undefined;
  const n = parseInt(ra, 10);
  return Number.isFinite(n) ? n : undefined;
}

function deriveScope(msg: string): AIRateLimitError['scope'] {
  const m = msg.toLowerCase();
  if (m.includes('tokens per minute') || m.includes('tpm')) return 'tpm';
  if (m.includes('tokens per day') || m.includes('tpd')) return 'tpd';
  if (m.includes('requests per minute') || m.includes('rpm')) return 'rpm';
  if (m.includes('requests per day') || m.includes('rpd')) return 'rpd';
  return 'unknown';
}

let client: Groq | null = null;
function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');
    client = new Groq({ apiKey });
  }
  return client;
}

export const GROQ_MODELS = {
  text: process.env.GROQ_MODEL_TEXT || 'llama-3.3-70b-versatile',
  json: process.env.GROQ_MODEL_JSON || 'openai/gpt-oss-120b',
} as const;

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface GroqResponseFormat {
  type: 'json_object' | 'json_schema' | 'text';
  json_schema?: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
}

export interface GroqUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface GroqChatResult {
  content: string;
  finish_reason: string;
  usage?: GroqUsage;
}

export async function groqChat(opts: {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: GroqResponseFormat;
}): Promise<GroqChatResult> {
  const c = getClient();
  const model = opts.model || (opts.responseFormat ? GROQ_MODELS.json : GROQ_MODELS.text);
  const params: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.maxTokens) params.max_tokens = opts.maxTokens;
  if (opts.responseFormat) params.response_format = opts.responseFormat;

  let res;
  try {
    res = (await c.chat.completions.create(
      params as unknown as Parameters<typeof c.chat.completions.create>[0],
    )) as {
      choices: Array<{ message: { content?: string }; finish_reason?: string }>;
      usage?: GroqUsage;
    };
  } catch (e) {
    const err = e as {
      status?: number;
      headers?: Record<string, string>;
      error?: { error?: { message?: string } };
      message?: string;
    };
    if (err.status === 429) {
      const retryAfter = parseRetryAfterSec(err.headers);
      const innerMsg = err.error?.error?.message || err.message || '';
      throw new AIRateLimitError('groq', retryAfter, deriveScope(innerMsg));
    }
    throw e;
  }
  const choice = res.choices?.[0];
  return {
    content: choice?.message?.content || '',
    finish_reason: choice?.finish_reason || 'stop',
    usage: res.usage,
  };
}
