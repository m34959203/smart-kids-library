export const locales = ["ru", "kk"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

type Messages = Record<string, string | Record<string, string | Record<string, string>>>;
const messageCache: Record<string, Messages> = {};

export async function getMessages(locale: Locale): Promise<Messages> {
  if (messageCache[locale]) return messageCache[locale];
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    messageCache[locale] = messages;
    return messages;
  } catch {
    const messages = (await import(`@/messages/ru.json`)).default;
    messageCache[locale] = messages;
    return messages;
  }
}

export function t(messages: Messages, key: string): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === "string" ? current : key;
}

export function getDirection(_locale: Locale): "ltr" | "rtl" {
  return "ltr";
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "ru" ? "kk" : "ru";
}
