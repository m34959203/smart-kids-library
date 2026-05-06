/**
 * Универсальный JSON-ответ для случаев когда AI-endpoint упёрся в лимит.
 * Покрывает:
 *  - QuotaExceededError (наш гард в src/lib/ai-quota.ts) — сработал ДО запроса
 *  - AIRateLimitError (Groq 429) — провайдер вернул 429 при отсутствии Gemini-fallback
 *
 * Возвращает 429 с body: { error, source:"rate_limit", scope, retryAfterSec, retryAt, retryHuman }
 * Эндпоинты должны просто `if (errorRes = formatQuotaError(err, lang)) return errorRes;`
 */
import { NextResponse } from "next/server";
import { QuotaExceededError, type QuotaScope } from "../ai-quota";
import { AIRateLimitError } from "./groq";

type Lang = "ru" | "kk";

const SCOPE_RU: Record<QuotaScope, string> = {
  rpm: "лимит запросов в минуту",
  rpd: "дневной лимит запросов",
  tpm: "лимит токенов в минуту",
  usd_daily: "дневной лимит расходов",
  usd_total: "общий лимит расходов",
  user_rpm: "ваш лимит запросов в минуту",
  user_rpd: "ваш дневной лимит",
  user_usd_daily: "ваш дневной USD-лимит",
  anon_rpm: "лимит для анонимов в минуту",
  anon_rpd: "дневной лимит для анонимов",
};

const SCOPE_KK: Record<QuotaScope, string> = {
  rpm: "минуттық сұрау лимиті",
  rpd: "тәуліктік сұрау лимиті",
  tpm: "минуттық токен лимиті",
  usd_daily: "тәуліктік шығын лимиті",
  usd_total: "жалпы шығын лимиті",
  user_rpm: "сіздің минуттық лимитіңіз",
  user_rpd: "сіздің тәуліктік лимитіңіз",
  user_usd_daily: "сіздің тәуліктік USD-лимитіңіз",
  anon_rpm: "анонимдер үшін минуттық лимит",
  anon_rpd: "анонимдер үшін тәуліктік лимит",
};

function humanRetry(seconds: number, lang: Lang): string {
  if (seconds < 60) {
    return lang === "kk"
      ? `${Math.max(1, seconds)} секундтан кейін`
      : `через ${Math.max(1, seconds)} сек`;
  }
  if (seconds < 3600) {
    const m = Math.ceil(seconds / 60);
    return lang === "kk" ? `${m} минуттан кейін` : `через ${m} мин`;
  }
  if (seconds < 86_400) {
    const h = Math.ceil(seconds / 3600);
    return lang === "kk" ? `${h} сағаттан кейін` : `через ${h} ч`;
  }
  const d = Math.ceil(seconds / 86_400);
  return lang === "kk" ? `${d} тәуліктен кейін` : `через ${d} дн`;
}

interface FormattedQuota {
  error: string;
  source: "rate_limit";
  scope: string;
  retryAfterSec: number;
  retryAt: string;        // ISO
  retryHuman: string;     // "через 12 мин"
  hint?: string;
}

/**
 * Если err — QuotaExceededError или AIRateLimitError, вернуть готовый
 * NextResponse 429 с понятным JSON. Иначе вернуть null (caller продолжает обычную обработку ошибки).
 */
export function quotaErrorResponse(err: unknown, lang: Lang = "ru"): NextResponse | null {
  // Наш per-process / per-user / USD-cap гард
  if (err instanceof QuotaExceededError) {
    const retrySec = err.retryAfterSec || 60;
    const scopeLabel = (lang === "kk" ? SCOPE_KK : SCOPE_RU)[err.scope] ?? err.scope;
    const message = lang === "kk"
      ? `Кешіріңіз, ${scopeLabel} асты. Қайталап көріңіз ${humanRetry(retrySec, "kk")}.`
      : `Извините, превышен ${scopeLabel}. Попробуйте ${humanRetry(retrySec, "ru")}.`;
    const body: FormattedQuota = {
      error: message,
      source: "rate_limit",
      scope: err.scope,
      retryAfterSec: retrySec,
      retryAt: new Date(Date.now() + retrySec * 1000).toISOString(),
      retryHuman: humanRetry(retrySec, lang),
    };
    if (err.scope.startsWith("anon_")) {
      body.hint = lang === "kk"
        ? "Тіркеліп көріңіз — авторизацияланған пайдаланушыларға лимит үлкен."
        : "Зарегистрируйтесь — авторизованным пользователям лимит больше.";
    }
    return NextResponse.json(body, {
      status: 429,
      headers: { "Retry-After": String(retrySec) },
    });
  }

  // Groq 429 (если Gemini-fallback недоступен)
  if (err instanceof AIRateLimitError) {
    const retrySec = err.retryAfter || 60;
    const message = lang === "kk"
      ? `AI провайдерінің лимиті асты. Қайталап көріңіз ${humanRetry(retrySec, "kk")}.`
      : `Лимит AI-провайдера превышен. Попробуйте ${humanRetry(retrySec, "ru")}.`;
    const body: FormattedQuota = {
      error: message,
      source: "rate_limit",
      scope: `provider_${err.scope ?? "unknown"}`,
      retryAfterSec: retrySec,
      retryAt: new Date(Date.now() + retrySec * 1000).toISOString(),
      retryHuman: humanRetry(retrySec, lang),
    };
    return NextResponse.json(body, {
      status: 429,
      headers: { "Retry-After": String(retrySec) },
    });
  }

  return null;
}
