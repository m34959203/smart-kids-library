import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  text: v.string({ min: 1, max: 6000 }),
  level: v.enum(["6-9", "10-13", "14-17"] as const),
  language: v.optional(v.enum(["ru", "kk"] as const)),
});

interface SimplifyBody {
  text: string;
  level: "6-9" | "10-13" | "14-17";
  language?: "ru" | "kk";
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "simplify", max: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<SimplifyBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const { text, level, language = "ru" } = parsed.data;

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ error: "AI limit reached" }, { status: 429 });
  }

  const guide: Record<string, Record<string, string>> = {
    "6-9": {
      ru: "Перепиши текст очень простыми словами для ребёнка 6-9 лет: короткие предложения, знакомые слова, дружелюбный тон.",
      kk: "Мәтінді 6-9 жастағы балаға арналған өте қарапайым сөздермен қайта жаз: қысқа сөйлемдер, таныс сөздер, мейірімді үн.",
    },
    "10-13": {
      ru: "Перепиши текст для подростка 10-13 лет: ясный язык, объясни сложные термины, сохрани смысл.",
      kk: "Мәтінді 10-13 жастағы жасөспірімге қайта жаз: түсінікті тіл, күрделі терминдерді түсіндір, мағынасын сақта.",
    },
    "14-17": {
      ru: "Перепиши текст для старшеклассника 14-17 лет: понятно, структурно, с сохранением деталей.",
      kk: "Мәтінді 14-17 жастағы жоғары сынып оқушысына қайта жаз: түсінікті, құрылымды, маңызды бөлшектерді сақта.",
    },
  };

  const systemPrompt = guide[level][language];

  try {
    const r = await generateText(
      `ТЕКСТ:\n${text}\n\n${language === "kk" ? "Қарапайым нұсқаны жаз." : "Напиши упрощённую версию."}`,
      { systemPrompt, endpoint: "simplify", temperature: 0.4, maxTokens: 2048 }
    );
    return NextResponse.json({ simplified: r.text.trim(), level, language, tokensUsed: r.tokensUsed });
  } catch (e) {
    console.error("simplify error", e);
    return NextResponse.json({ error: "Simplify failed" }, { status: 500 });
  }
}
