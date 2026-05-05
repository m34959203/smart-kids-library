/**
 * AI Quota Guard — гарантирует, что Smart Kids Library НЕ выходит в платный
 * тариф Gemini API. Адаптация из til-kural.
 *
 *   1. assertQuota(model) — глобальные RPM/RPD/TPM × SAFETY_RATIO + USD-cap.
 *   2. assertUserQuota(userKey) — per-user/per-IP лимиты.
 *   3. Внутрипроцессный rpmBucket защищает от бурстов до записи в БД.
 *   4. Для НЕИЗВЕСТНЫХ моделей — UNKNOWN_MODEL_LIMITS (fail-safe).
 */
import { query, getMany } from "./db";

export const FREE_TIER = {
  "gemini-2.5-flash": { rpm: 10, rpd: 250, tpm: 250_000 },
  "gemini-2.5-flash-lite": { rpm: 15, rpd: 1000, tpm: 250_000 },
  "gemini-2.5-pro": { rpm: 5, rpd: 100, tpm: 250_000 },
  "gemini-2.0-flash": { rpm: 15, rpd: 200, tpm: 1_000_000 },
  "gemini-3.1-flash-tts-preview": { rpm: 8, rpd: 150, tpm: 250_000 },
  "gemini-2.5-flash-native-audio-preview-12-2025": { rpm: 3, rpd: 25, tpm: 250_000 },
} as const;

const UNKNOWN_MODEL_LIMITS = { rpm: 3, rpd: 50, tpm: 250_000 };
export const SAFETY_RATIO = 0.85;
const SOFT_RPM_CAP = 8;

const USD_CAP_DAILY = Number(process.env.AI_USD_CAP_DAILY ?? "0.50");
const USD_CAP_TOTAL = Number(process.env.AI_USD_CAP_TOTAL ?? "4.50");
const USD_PERIOD_START = process.env.AI_USD_CAP_PERIOD_START ?? "2026-04-30";
const USD_SAFETY_RATIO = 0.9;

const USER_RPD = Number(process.env.AI_USER_RPD ?? "40");
const USER_RPM = Number(process.env.AI_USER_RPM ?? "5");
const USER_USD_DAILY = Number(process.env.AI_USER_USD_DAILY ?? "0.05");
const ANON_RPD = Number(process.env.AI_ANON_RPD ?? "12");
const ANON_RPM = Number(process.env.AI_ANON_RPM ?? "3");

export type QuotaScope =
  | "rpm" | "rpd" | "tpm" | "usd_daily" | "usd_total"
  | "user_rpm" | "user_rpd" | "user_usd_daily"
  | "anon_rpm" | "anon_rpd";

export class QuotaExceededError extends Error {
  readonly scope: QuotaScope;
  readonly retryAfterSec: number;
  constructor(message: string, scope: QuotaScope, retryAfterSec: number) {
    super(message);
    this.name = "QuotaExceededError";
    this.scope = scope;
    this.retryAfterSec = retryAfterSec;
  }
}

interface RecentRow {
  created_at: string | Date;
  prompt_tokens: number;
  completion_tokens: number;
  model?: string;
}

const rpmBucket: { ts: number[] } = { ts: [] };

async function loadRecent(model: string | null, since: Date): Promise<RecentRow[]> {
  const sql = model
    ? `SELECT created_at, prompt_tokens, completion_tokens, model
       FROM ai_generations
       WHERE provider = 'gemini' AND model = $1 AND created_at >= $2`
    : `SELECT created_at, prompt_tokens, completion_tokens, model
       FROM ai_generations
       WHERE provider = 'gemini' AND created_at >= $1`;
  const params = model ? [model, since] : [since];
  return getMany<RecentRow>(sql, params);
}

export async function assertUsdBudget(): Promise<void> {
  const now = new Date();
  const utcDayStart = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
  ));
  const periodStart = new Date(USD_PERIOD_START + "T00:00:00Z");

  const spendSince = async (since: Date): Promise<number> => {
    const rows = await getMany<{ usd: string | number }>(
      `SELECT COALESCE(SUM(cost_usd), 0)::float8 AS usd
       FROM ai_generations WHERE created_at >= $1`,
      [since]
    );
    return Number(rows[0]?.usd) || 0;
  };

  const [daySpent, periodSpent] = await Promise.all([
    spendSince(utcDayStart),
    spendSince(periodStart),
  ]);

  if (daySpent >= USD_CAP_DAILY * USD_SAFETY_RATIO) {
    const utcMidnight = new Date(utcDayStart.getTime() + 24 * 3600_000);
    const retryAfter = Math.max(60, Math.floor((utcMidnight.getTime() - now.getTime()) / 1000));
    throw new QuotaExceededError(
      `Дневной USD-cap: $${daySpent.toFixed(4)}/$${USD_CAP_DAILY}. Сброс в 00:00 UTC.`,
      "usd_daily", retryAfter,
    );
  }
  if (periodSpent >= USD_CAP_TOTAL * USD_SAFETY_RATIO) {
    throw new QuotaExceededError(
      `Период USD-cap: $${periodSpent.toFixed(4)}/$${USD_CAP_TOTAL} с ${USD_PERIOD_START}.`,
      "usd_total", 24 * 3600,
    );
  }
}

export async function assertQuota(model: string): Promise<void> {
  const known = FREE_TIER[model as keyof typeof FREE_TIER];
  const limits = known ?? UNKNOWN_MODEL_LIMITS;

  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60_000);
  const oneDayAgo = new Date(now.getTime() - 24 * 3600_000);
  const nowMs = now.getTime();

  rpmBucket.ts = rpmBucket.ts.filter((t) => t > nowMs - 60_000);
  if (rpmBucket.ts.length >= SOFT_RPM_CAP) {
    throw new QuotaExceededError(
      `Burst guard: ${rpmBucket.ts.length}/${SOFT_RPM_CAP} вызовов за минуту в этом процессе.`,
      "rpm", 30,
    );
  }

  const recent = await loadRecent(model, oneDayAgo);
  const rpm = recent.filter((r) => new Date(r.created_at) >= oneMinAgo).length;
  const rpd = recent.length;
  const tpm = recent
    .filter((r) => new Date(r.created_at) >= oneMinAgo)
    .reduce((a, r) => a + (r.prompt_tokens || 0) + (r.completion_tokens || 0), 0);

  const safe = (n: number) => Math.floor(n * SAFETY_RATIO);

  rpmBucket.ts.push(nowMs);

  if (rpm >= safe(limits.rpm)) {
    throw new QuotaExceededError(
      `Лимит RPM (${rpm}/${limits.rpm}, модель ${model}). Попробуйте через минуту.`,
      "rpm", 60,
    );
  }
  if (rpd >= safe(limits.rpd)) {
    const ptNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const ptMidnight = new Date(ptNow);
    ptMidnight.setDate(ptMidnight.getDate() + 1);
    ptMidnight.setHours(0, 0, 0, 0);
    const retryAfter = Math.max(60, Math.floor((ptMidnight.getTime() - ptNow.getTime()) / 1000));
    throw new QuotaExceededError(
      `Дневной лимит (${rpd}/${limits.rpd}, модель ${model}). Сброс в 00:00 PT (~10:00 МСК).`,
      "rpd", retryAfter,
    );
  }
  if (tpm >= safe(limits.tpm)) {
    throw new QuotaExceededError(
      `Лимит токенов/мин (${tpm}/${limits.tpm}, модель ${model}).`,
      "tpm", 60,
    );
  }

  await assertUsdBudget();
}

interface AnonCounter {
  day: { count: number; resetAt: number };
  min: number[];
}
const anonCounters = new Map<string, AnonCounter>();

export async function assertUserQuota(userKey: string): Promise<void> {
  if (!userKey) return;
  const isAnon = userKey.startsWith("ip:");
  const now = Date.now();

  if (isAnon) {
    const counter = anonCounters.get(userKey) || { day: { count: 0, resetAt: now + 86_400_000 }, min: [] };
    if (now >= counter.day.resetAt) counter.day = { count: 0, resetAt: now + 86_400_000 };
    counter.min = counter.min.filter((t) => t > now - 60_000);

    if (counter.min.length >= ANON_RPM) {
      throw new QuotaExceededError(
        `Anon RPM cap (${counter.min.length}/${ANON_RPM}). Зарегистрируйтесь чтобы получить больше квоты.`,
        "anon_rpm", 60,
      );
    }
    if (counter.day.count >= ANON_RPD) {
      const retry = Math.max(60, Math.floor((counter.day.resetAt - now) / 1000));
      throw new QuotaExceededError(
        `Anon дневной лимит (${counter.day.count}/${ANON_RPD}). Зарегистрируйтесь для расширенной квоты.`,
        "anon_rpd", retry,
      );
    }
    counter.min.push(now);
    counter.day.count += 1;
    anonCounters.set(userKey, counter);
    return;
  }

  // Authenticated user — query DB.
  const oneMinAgo = new Date(now - 60_000);
  const oneDayAgo = new Date(now - 24 * 3600_000);

  const sumWhereUser = async (since: Date): Promise<{ count: number; usd: number }> => {
    const rows = await getMany<{ cnt: number | string; usd: number | string }>(
      `SELECT COUNT(*)::int AS cnt, COALESCE(SUM(cost_usd), 0)::float8 AS usd
       FROM ai_generations WHERE user_id = $1 AND created_at >= $2`,
      [Number(userKey), since],
    );
    const r = rows[0] || { cnt: 0, usd: 0 };
    return { count: Number(r.cnt) || 0, usd: Number(r.usd) || 0 };
  };

  const [day, minute] = await Promise.all([
    sumWhereUser(oneDayAgo),
    sumWhereUser(oneMinAgo),
  ]);

  if (minute.count >= USER_RPM) {
    throw new QuotaExceededError(
      `Лимит запросов в минуту (${minute.count}/${USER_RPM}). Подождите 1 минуту.`,
      "user_rpm", 60,
    );
  }
  if (day.count >= USER_RPD) {
    throw new QuotaExceededError(
      `Дневной лимит AI-запросов (${day.count}/${USER_RPD}). Сброс через 24 часа.`,
      "user_rpd", 86_400,
    );
  }
  if (day.usd >= USER_USD_DAILY) {
    throw new QuotaExceededError(
      `Дневной USD-лимит ($${day.usd.toFixed(4)}/$${USER_USD_DAILY}). Сброс через 24 часа.`,
      "user_usd_daily", 86_400,
    );
  }
}

if (typeof setInterval !== "undefined" && process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, c] of anonCounters) {
      if (c.day.resetAt < now - 2 * 3600_000 && c.min.length === 0) {
        anonCounters.delete(k);
      }
    }
  }, 30 * 60_000).unref?.();
}

export function userKeyFromRequest(request: Request, userId: number | string | null | undefined): string {
  if (userId) return String(userId);
  const fwd = request.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}

export type QuotaStatus = "ok" | "warn" | "crit";

export interface SpendSnapshot {
  last24hUsd: number;
  last7dUsd: number;
  thisMonthUsd: number;
  thisMonthTokens: number;
  projectedMonthUsd: number;
  budgetUsd: number;
  budgetRemainingUsd: number;
  budgetPctUsed: number;
}

export async function getSpendSnapshot(): Promise<SpendSnapshot> {
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 3600_000);
  const week = new Date(now.getTime() - 7 * 24 * 3600_000);
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysIntoMonth = Math.max(1, Math.ceil((now.getTime() - month.getTime()) / (24 * 3600_000)));
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const sumSince = async (since: Date): Promise<{ usd: number; promptTok: number; complTok: number }> => {
    const rows = await getMany<{ usd: string | number; pt: number | string; ct: number | string }>(
      `SELECT COALESCE(SUM(cost_usd), 0)::float8 AS usd,
              COALESCE(SUM(prompt_tokens), 0)::int AS pt,
              COALESCE(SUM(completion_tokens), 0)::int AS ct
       FROM ai_generations WHERE created_at >= $1`,
      [since],
    );
    const r = rows[0] || { usd: 0, pt: 0, ct: 0 };
    return { usd: Number(r.usd) || 0, promptTok: Number(r.pt) || 0, complTok: Number(r.ct) || 0 };
  };

  const [d1, d7, dMonth] = await Promise.all([sumSince(day), sumSince(week), sumSince(month)]);
  const projectedMonthUsd = (dMonth.usd / daysIntoMonth) * daysInMonth;
  const periodStart = new Date(USD_PERIOD_START + "T00:00:00Z");
  const periodSpend = await sumSince(periodStart);
  const BUDGET = USD_CAP_TOTAL;

  return {
    last24hUsd: d1.usd,
    last7dUsd: d7.usd,
    thisMonthUsd: dMonth.usd,
    thisMonthTokens: dMonth.promptTok + dMonth.complTok,
    projectedMonthUsd,
    budgetUsd: BUDGET,
    budgetRemainingUsd: Math.max(0, BUDGET - periodSpend.usd),
    budgetPctUsed: BUDGET > 0 ? Math.min(100, (periodSpend.usd / BUDGET) * 100) : 0,
  };
}
