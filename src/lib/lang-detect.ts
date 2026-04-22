/**
 * Простой детектор языка RU/KK по тексту.
 * KK-специфичные буквы: ә ғ қ ң ө ұ ү һ і (ASCII в верхнем регистре тоже учтены).
 * Стратегия: если в тексте найдена хотя бы одна kk-буква → "kk", иначе "ru".
 * Транслит/латиница не определяем — тексты от пользователей в RU/KK обычно кириллические.
 */
const KK_CHARS = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;

export type DetectedLang = "ru" | "kk";

export function detectLanguage(text: string, fallback: DetectedLang = "ru"): DetectedLang {
  if (!text) return fallback;
  return KK_CHARS.test(text) ? "kk" : fallback;
}
