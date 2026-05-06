import { NextRequest, NextResponse } from "next/server";
import { generateText, generateJSON } from "@/lib/gemini";
import { quotaErrorResponse } from "@/lib/llm/quota-error-response";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  theme: v.string({ min: 1, max: 200 }),
  language: v.optional(v.enum(["ru", "kk"] as const)),
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FALLBACK_SVG = (theme: string) => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <title>${escapeXml(theme)}</title>
  <g stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="200" cy="140" r="65"/>
    <circle cx="180" cy="130" r="6"/>
    <circle cx="220" cy="130" r="6"/>
    <path d="M180 165 Q200 185 220 165"/>
    <ellipse cx="200" cy="280" rx="85" ry="100"/>
    <line x1="120" y1="245" x2="80" y2="305"/>
    <line x1="280" y1="245" x2="320" y2="305"/>
    <path d="M150 350 Q200 380 250 350"/>
  </g>
</svg>`;

/**
 * Чистит markdown-фенсы и пытается вытащить корректный <svg>...</svg>.
 * Возвращает null если не удалось получить валидный SVG.
 */
function extractSvg(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();
  // Снимаем ```svg / ```xml / ```html / ``` фенсы
  s = s.replace(/^```(?:svg|xml|html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // Берём первый <svg...>...</svg> блок
  const m = s.match(/<svg[\s\S]*?<\/svg>/i);
  if (!m) return null;
  const svg = m[0];
  // Базовая валидация
  const dquotes = (svg.match(/"/g) || []).length;
  if (dquotes % 2 !== 0) return null;
  if (!svg.includes("xmlns")) return null;
  // Запрет опасных тегов
  if (/<script|<foreignObject|<image|onload\s*=|onerror\s*=/i.test(svg)) return null;
  return svg;
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "coloring", max: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<{ theme: string; language?: "ru" | "kk" }>(await readJson(request), schema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const { theme } = parsed.data;

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ svg: FALLBACK_SVG(theme), source: "limit-fallback" });
  }

  // Попытка 1: structured JSON через responseMimeType (Gemini надёжнее, чем
  // голый текст — не ставит markdown-фенсы, не вставляет «Here is...»).
  try {
    const { data } = await generateJSON<{ svg: string }>(
      `Создай раскраску-контур для детей. Тема: "${theme}".
Требования:
- viewBox="0 0 400 400", xmlns="http://www.w3.org/2000/svg"
- Outline-only line art: fill="none", stroke="#000", stroke-width 2-3
- Оборачивай фигуры в <g stroke="#000" stroke-width="3" fill="none">
- Запрещены: <text>, <image>, <foreignObject>, <script>, on*-handlers
- Закрывай все теги, двойные кавычки в атрибутах
- Длина SVG ≤ 3000 символов`,
      `Ты — генератор детских раскрасок. Возвращай ровно JSON {"svg":"<svg>...</svg>"}, без пояснений.`
    );
    const svg = extractSvg(data?.svg ?? "");
    if (svg) return NextResponse.json({ svg, source: "ai" });
  } catch (error) {
    const q = quotaErrorResponse(error, parsed.data.language ?? "ru");
    if (q) return q;
    console.error("Coloring JSON-mode failed:", error);
  }

  // Попытка 2: голый текст с очень жёстким префиксом (на случай если JSON-mode упал)
  try {
    const result = await generateText(
      `Output ONLY raw SVG markup, no fences, no prose, no quotes around the SVG. Start with "<svg" and end with "</svg>".
Theme: "${theme}".
viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" + outline-only line art (fill="none", stroke="#000", stroke-width 2-3).
Forbidden: <text>, <image>, <foreignObject>, <script>, on*-handlers. Total ≤ 3000 chars.`,
      { temperature: 0.4, maxTokens: 4096, endpoint: "coloring-fallback" }
    );
    const svg = extractSvg(result.text);
    if (svg) return NextResponse.json({ svg, source: "ai-retry" });
    console.error("Coloring text-mode raw output (truncated):", result.text.slice(0, 300));
  } catch (error) {
    const q = quotaErrorResponse(error, parsed.data.language ?? "ru");
    if (q) return q;
    console.error("Coloring text-mode failed:", error);
  }

  return NextResponse.json({ svg: FALLBACK_SVG(theme), source: "fallback" });
}
