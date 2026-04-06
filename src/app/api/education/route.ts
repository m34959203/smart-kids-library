import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, mode, action, text, topic, grade, language = "ru" } = body;

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ error: "AI limit reached" }, { status: 429 });
  }

  let prompt = "";
  let systemPrompt = "";

  if (type === "workshop") {
    systemPrompt = language === "kk"
      ? "Сен балаларға шығармашылық жазуға көмектесетін көмекшісің. Мейірімді, шабыттандырушы стильде жауап бер."
      : "Ты помощник для творческого письма детей. Отвечай дружелюбно и вдохновляюще.";

    if (action === "continue") {
      prompt = language === "kk"
        ? `Баланың ${mode === "poem" ? "өлеңін" : "әңгімесін"} жалғастыр:\n\n${text}\n\nТағы 2-3 сөйлем жаз.`
        : `Продолжи ${mode === "poem" ? "стихотворение" : "рассказ"} ребенка:\n\n${text}\n\nНапиши ещё 2-3 предложения.`;
    } else if (action === "rhyme") {
      prompt = language === "kk"
        ? `Баланың өлеңіне ұйқас ұсын:\n\n${text}\n\nСоңғы жолға ұйқас жолдар ұсын.`
        : `Подскажи рифму для стихотворения ребенка:\n\n${text}\n\nПредложи рифмы к последней строке.`;
    } else {
      prompt = language === "kk"
        ? `Баланың ${mode === "poem" ? "өлеңін" : "әңгімесін"} жақсартуға кеңес бер:\n\n${text}`
        : `Дай советы по улучшению ${mode === "poem" ? "стихотворения" : "рассказа"} ребенка:\n\n${text}`;
    }
  } else if (type === "literature") {
    systemPrompt = language === "kk"
      ? `Сен мектеп оқушыларына арналған әдебиет бойынша көмекшісің. ${grade ? grade + "-сынып деңгейінде" : ""} түсіндір.`
      : `Ты помощник по литературе для школьников. ${grade ? `Объясняй на уровне ${grade} класса.` : ""}`;
    prompt = language === "kk"
      ? `Тақырып: ${topic}\n\n${text ?? "Осы тақырып туралы қысқаша түсіндір."}`
      : `Тема: ${topic}\n\n${text ?? "Объясни эту тему кратко."}`;
  } else if (type === "essay") {
    systemPrompt = language === "kk"
      ? "Сен мектеп оқушыларына шығарма жазуға көмектесетін көмекшісің."
      : "Ты помощник для написания школьных сочинений.";
    prompt = language === "kk"
      ? `Шығарма тақырыбы: ${topic}\n\nЖоспар жаса және негізгі ойларды ұсын.`
      : `Тема сочинения: ${topic}\n\nСоставь план и предложи основные тезисы.`;
  } else {
    prompt = text ?? topic ?? "";
    systemPrompt = language === "kk"
      ? "Сен балаларға арналған білім беру көмекшісісің."
      : "Ты образовательный помощник для детей.";
  }

  try {
    const result = await generateText(prompt, {
      systemPrompt,
      endpoint: "education",
      temperature: 0.7,
    });

    return NextResponse.json({ suggestion: result.text, tokensUsed: result.tokensUsed });
  } catch (error) {
    console.error("Education API error:", error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
