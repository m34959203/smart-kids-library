/**
 * Клиентский помощник для озвучки через /api/stories/tts.
 *
 * Зачем: бэкенд исправно отдаёт audio/* (проверено), но клиентский fetch
 * без таймаута может «зависнуть» (медленный туннель/сеть) — кнопка тогда
 * вечно показывает «Готовлю…». Здесь — AbortController с таймаутом и
 * корректная проверка Content-Type (audio vs JSON-ошибка).
 */

export type TtsResult =
  | { ok: true; url: string }
  | { ok: false; reason: "timeout" | "http" | "empty" | "network" };

export async function fetchTtsAudio(
  text: string,
  language: "ru" | "kk",
  opts: { timeoutMs?: number; maxChars?: number } = {}
): Promise<TtsResult> {
  const { timeoutMs = 15000, maxChars = 4000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch("/api/stories/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.substring(0, maxChars), language }),
      signal: controller.signal,
    });

    if (!r.ok) return { ok: false, reason: "http" };

    const ct = r.headers.get("content-type") ?? "";
    // Сервер при ошибке может вернуть JSON вместо audio — это не аудио.
    if (!ct.startsWith("audio/")) return { ok: false, reason: "http" };

    const blob = await r.blob();
    if (blob.size === 0) return { ok: false, reason: "empty" };

    return { ok: true, url: URL.createObjectURL(blob) };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}
