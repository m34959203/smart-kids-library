import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { requireStaff } from "@/lib/auth-guard";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  title: v.string({ min: 1, max: 200 }),
  description: v.optional(v.string({ max: 2000 })),
  date: v.optional(v.string({ max: 100 })),
  style: v.optional(v.enum(["bright", "pastel", "dark", "retro"] as const)),
  language: v.optional(v.enum(["ru", "kk"] as const)),
});

interface PosterBody {
  title: string;
  description?: string;
  date?: string;
  style?: "bright" | "pastel" | "dark" | "retro";
  language?: "ru" | "kk";
}

/**
 * Posters here are SVG-vector banners produced by Gemini 2.0 Flash, which is
 * text-only on the free tier. We generate stylised SVG with decorative shapes,
 * typography, and the event metadata — editable in the admin afterwards.
 */
export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const parsed = validate<PosterBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const { title, description = "", date = "", style = "bright", language = "ru" } = parsed.data;

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ error: "AI limit reached" }, { status: 429 });
  }

  const palette: Record<string, string[]> = {
    bright: ["#a855f7", "#ec4899", "#fbbf24", "#ffffff"],
    pastel: ["#c4b5fd", "#f9a8d4", "#fde68a", "#fef3c7"],
    dark: ["#1f2937", "#6366f1", "#f59e0b", "#f9fafb"],
    retro: ["#b45309", "#be185d", "#047857", "#fef3c7"],
  };

  const prompt = `Generate a single decorative SVG poster for a library event.
- viewBox="0 0 1080 1350" (Instagram portrait)
- Style: ${style}, palette: ${palette[style].join(", ")}
- Decorative abstract shapes (bubbles, stars, books, ribbons) — no text imagery/photos
- Include <text> elements:
  • TITLE (large, bold): ${title}
  • DATE (medium): ${date}
  • SUBTITLE (small): ${description.slice(0, 120)}
  • LIBRARY: ${language === "kk" ? "Сатпаев балалар кітапханасы" : "Детская библиотека г. Сатпаев"}
- Sans-serif fonts; high contrast; child-friendly
- Return ONLY the <svg>...</svg>, no markdown fences, no explanation.`;

  try {
    const r = await generateText(prompt, { endpoint: "posters", temperature: 0.8, maxTokens: 3000 });
    const match = r.text.match(/<svg[\s\S]*?<\/svg>/i);
    const svg = match ? match[0] : fallbackPoster(title, date, palette[style]);
    return NextResponse.json({ svg, tokensUsed: r.tokensUsed });
  } catch (e) {
    console.error("poster error", e);
    return NextResponse.json({ svg: fallbackPoster(title, date, palette[style]) });
  }
}

function fallbackPoster(title: string, date: string, colors: string[]): string {
  const [c1, c2, c3, c4] = colors;
  const safeTitle = title.replace(/[<>&]/g, "");
  const safeDate = date.replace(/[<>&]/g, "");
  return `<svg viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>
</defs>
<rect width="1080" height="1350" fill="url(#bg)"/>
<circle cx="200" cy="200" r="120" fill="${c3}" opacity="0.7"/>
<circle cx="900" cy="400" r="180" fill="${c4}" opacity="0.4"/>
<circle cx="150" cy="1100" r="100" fill="${c4}" opacity="0.5"/>
<text x="540" y="650" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="800" fill="${c4}">${safeTitle}</text>
<text x="540" y="750" text-anchor="middle" font-family="sans-serif" font-size="42" fill="${c4}">${safeDate}</text>
<text x="540" y="1280" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${c4}" opacity="0.9">Smart Kids Library · Satpayev</text>
</svg>`;
}
