import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { childName, theme, character, ageLevel, language = "ru", continuation, previousStory } = body;

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
Деңгей: ${ageLevelGuide[ageLevel] ?? ageLevelGuide["7-10"]}
${continuation ? `Жалғасы: ${continuation}` : ""}
${previousStory ? `Алдыңғы бөлім: ${previousStory.substring(0, 500)}` : ""}

JSON қайтар: { "content": "ертегі мәтіні (200-400 сөз)", "choices": [{"text": "таңдау мәтіні", "nextPrompt": "жалғасу бағыты"}] (2-3 таңдау) }`
    : `Напиши детскую сказку.
Имя героя: ${childName || "Малыш"}
Тема: ${theme}
Главный персонаж: ${character || "Маленький лев"}
Уровень: ${ageLevelGuide[ageLevel] ?? ageLevelGuide["7-10"]}
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

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { childName, theme, character, language, content, ageLevel } = body;

  try {
    await query(
      `INSERT INTO stories (user_id, child_name, theme, character, language, content, age_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [1, childName, theme, character, language, content, ageLevel]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save story error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
