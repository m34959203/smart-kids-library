import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { query } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth-guard";

const genSchema = v.object({
  childName: v.optional(v.string({ max: 60 })),
  theme: v.string({ min: 1, max: 120 }),
  character: v.optional(v.string({ max: 120 })),
  ageLevel: v.optional(v.enum(["3-6", "7-10", "11-14"] as const)),
  language: v.optional(v.enum(["ru", "kk"] as const)),
  continuation: v.optional(v.string({ max: 400 })),
  previousStory: v.optional(v.string({ max: 4000 })),
});

interface GenBody {
  childName?: string;
  theme: string;
  character?: string;
  ageLevel?: "3-6" | "7-10" | "11-14";
  language?: "ru" | "kk";
  continuation?: string;
  previousStory?: string;
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "stories-generate", max: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<GenBody>(await readJson(request), genSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const { childName, theme, character, ageLevel = "7-10", language = "ru", continuation, previousStory } = parsed.data;

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ error: "AI limit reached" }, { status: 429 });
  }

  const ageLevelGuide: Record<string, string> = {
    "3-6": language === "kk" ? "Өте қарапайым сөздер, қысқа сөйлемдер, 3-6 жас" : "Очень простые слова, короткие предложения, 3-6 лет",
    "7-10": language === "kk" ? "Орташа күрделілік, 7-10 жас" : "Средняя сложность, 7-10 лет",
    "11-14": language === "kk" ? "Күрделірек сюжет, 11-14 жас" : "Более сложный сюжет, 11-14 лет",
  };

  const prompt = language === "kk"
    ? `Балалар ертегісін жаз.
Кейіпкер аты: ${childName || "Бала"}
Тақырып: ${theme}
Басты кейіпкер: ${character || "Кішкентай батыр"}
Деңгей: ${ageLevelGuide[ageLevel]}
${continuation ? `Жалғасы: ${continuation}` : ""}
${previousStory ? `Алдыңғы бөлім: ${previousStory.substring(0, 500)}` : ""}

JSON қайтар: { "content": "ертегі мәтіні (200-400 сөз)", "choices": [{"text": "таңдау мәтіні", "nextPrompt": "жалғасу бағыты"}] (2-3 таңдау) }`
    : `Напиши детскую сказку.
Имя героя: ${childName || "Малыш"}
Тема: ${theme}
Главный персонаж: ${character || "Маленький лев"}
Уровень: ${ageLevelGuide[ageLevel]}
${continuation ? `Продолжение по выбору: ${continuation}` : ""}
${previousStory ? `Предыдущая часть: ${previousStory.substring(0, 500)}` : ""}

Верни JSON: { "content": "текст сказки (200-400 слов)", "choices": [{"text": "текст выбора", "nextPrompt": "направление продолжения"}] (2-3 варианта) }`;

  try {
    const { data } = await generateJSON<{
      content: string;
      choices: Array<{ text: string; nextPrompt: string }>;
    }>(prompt);

    return NextResponse.json({ story: data });
  } catch (error) {
    console.error("Story generation error:", error);
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 });
  }
}

const saveSchema = v.object({
  childName: v.optional(v.string({ max: 60 })),
  theme: v.string({ min: 1, max: 120 }),
  character: v.optional(v.string({ max: 120 })),
  language: v.enum(["ru", "kk"] as const),
  content: v.string({ min: 1, max: 20_000 }),
  ageLevel: v.enum(["3-6", "7-10", "11-14"] as const),
  choices: v.optional(v.array(v.object({ text: v.string(), nextPrompt: v.string() }), { max: 5 })),
});

interface SaveBody {
  childName?: string;
  theme: string;
  character?: string;
  language: "ru" | "kk";
  content: string;
  ageLevel: "3-6" | "7-10" | "11-14";
  choices?: Array<{ text: string; nextPrompt: string }>;
}

export async function PUT(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "stories-save", max: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<SaveBody>(await readJson(request), saveSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const { childName, theme, character, language, content, ageLevel, choices } = parsed.data;

  const user = await getCurrentUser();
  const userId = user?.id ? Number(user.id) : null;

  try {
    const inserted = await query<{ id: number }>(
      `INSERT INTO stories (user_id, child_name, theme, character, language, content, age_level, choices_json, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'pending')
       RETURNING id`,
      [userId, childName ?? null, theme, character ?? null, language, content, ageLevel, JSON.stringify(choices ?? [])]
    );
    const storyId = inserted.rows[0]?.id ?? null;

    if (storyId) {
      await query(
        `INSERT INTO moderation_items (kind, ref_id, payload, status)
         VALUES ('story', $1, $2::jsonb, 'pending')
         ON CONFLICT DO NOTHING`,
        [storyId, JSON.stringify({ title: theme, preview: content.slice(0, 300), language, ageLevel })]
      );
    }

    return NextResponse.json({ success: true, id: storyId });
  } catch (error) {
    console.error("Save story error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
