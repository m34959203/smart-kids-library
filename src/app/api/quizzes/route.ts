import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { difficulty = "medium", language = "ru", count = 5 } = body;

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ error: "AI limit reached" }, { status: 429 });
  }

  const difficultyGuide: Record<string, Record<string, string>> = {
    easy: {
      ru: "простые вопросы для детей 6-9 лет по детским сказкам и простым книгам",
      kk: "6-9 жас балаларға арналған балалар ертегілері мен қарапайым кітаптар бойынша оңай сұрақтар",
    },
    medium: {
      ru: "вопросы средней сложности для детей 10-13 лет по классической детской литературе",
      kk: "10-13 жас балаларға арналған классикалық балалар әдебиеті бойынша орташа сұрақтар",
    },
    hard: {
      ru: "сложные вопросы для подростков 14-17 лет по мировой и русской/казахской классике",
      kk: "14-17 жас жасөспірімдерге арналған әлем және қазақ/орыс классикасы бойынша қиын сұрақтар",
    },
  };

  const prompt = language === "kk"
    ? `${count} әдеби викторина сұрағын жаса. ${difficultyGuide[difficulty]?.kk ?? difficultyGuide.medium.kk}.
JSON қайтар: { "questions": [{ "question": "сұрақ мәтіні", "options": ["жауап1", "жауап2", "жауап3", "жауап4"], "correct": 0, "explanation": "түсіндірме" }] }`
    : `Создай ${count} вопросов для литературной викторины. ${difficultyGuide[difficulty]?.ru ?? difficultyGuide.medium.ru}.
Верни JSON: { "questions": [{ "question": "текст вопроса", "options": ["ответ1", "ответ2", "ответ3", "ответ4"], "correct": 0, "explanation": "объяснение" }] }`;

  try {
    const { data } = await generateJSON<{
      questions: Array<{
        question: string;
        options: string[];
        correct: number;
        explanation: string;
      }>;
    }>(prompt);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
