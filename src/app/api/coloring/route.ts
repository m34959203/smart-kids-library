import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
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

  const prompt = `Generate ONLY a single self-contained SVG coloring page for children — theme: "${theme}".
Hard requirements:
- Output starts with <svg and ends with </svg>. No markdown fences, no prose, no explanations.
- viewBox="0 0 400 400", xmlns="http://www.w3.org/2000/svg".
- Outline-only line art (fill="none"), stroke="#000", stroke-width 2-3.
- Wrap shapes in <g stroke="#000" stroke-width="3" fill="none">.
- No <text>, no <image>, no <foreignObject>, no <script>, no event handlers.
- Close every tag. Use double quotes for attributes.
- Total output must be under 3000 characters.`;

  // До 2 попыток: при первом fail повторяем с более жёстким system-промптом
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generateText(prompt, {
        temperature: attempt === 0 ? 0.7 : 0.4,
        maxTokens: 4096,
        endpoint: "coloring",
      });
      const svg = extractSvg(result.text);
      if (svg) {
        return NextResponse.json({ svg, source: attempt === 0 ? "ai" : "ai-retry" });
      }
    } catch (error) {
      console.error(`Coloring attempt ${attempt + 1} error:`, error);
    }
  }

  return NextResponse.json({ svg: FALLBACK_SVG(theme), source: "fallback" });
}
