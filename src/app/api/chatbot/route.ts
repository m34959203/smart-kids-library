import { NextRequest, NextResponse } from "next/server";
import { generateChat } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { getMany, query } from "@/lib/db";
import { v4 as uuid } from "uuid";

const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  general: {
    ru: `Ты — дружелюбный цифровой библиотекарь детской библиотеки города Сатпаев, Казахстан.
Твое имя — Кітапхан. Ты помогаешь детям и подросткам 6-17 лет.
- Отвечай кратко, дружелюбно и по-детски понятно
- Помогай найти книги, расскажи о событиях библиотеки
- Помогай с учебой по литературе
- Если не знаешь ответ — предложи связаться с библиотекарем
- Никогда не генерируй неподходящий контент для детей`,
    kk: `Сен — Сатпаев қаласының балалар кітапханасының мейірімді цифрлық кітапханашысысың.
Сенің атың — Кітапхан. Сен 6-17 жас аралығындағы балалар мен жасөспірімдерге көмектесесің.
- Қысқа, мейірімді және балаларға түсінікті жауап бер
- Кітап іздеуге, кітапхана оқиғалары туралы айтуға көмектес
- Әдебиет бойынша оқуға көмектес
- Жауапты білмесең — кітапханашымен байланысуды ұсын
- Балаларға жарамсыз мазмұн жасамаңыз`,
  },
  search: {
    ru: `Ты — помощник по поиску книг в детской библиотеке Сатпаев. Помогай найти книги по описанию, жанру, автору или теме. Предлагай похожие книги.`,
    kk: `Сен — Сатпаев балалар кітапханасындағы кітап іздеу көмекшісісің. Сипаттамасы, жанры, авторы немесе тақырыбы бойынша кітап табуға көмектес.`,
  },
  education: {
    ru: `Ты — образовательный помощник для школьников. Помогай с литературой, пересказами, сочинениями, подбором источников. Объясняй на уровне школьника.`,
    kk: `Сен — оқушыларға арналған білім беру көмекшісісің. Әдебиетпен, мазмұндамалармен, шығармалармен, дереккөздерді таңдаумен көмектес.`,
  },
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, mode = "general", language = "ru", history = [] } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const sessionId = uuid();

  // Check token limit
  const withinLimit = await isWithinTokenLimit();

  if (!withinLimit) {
    // Fallback to FAQ/knowledge base
    const faqResults = await getMany(
      `SELECT question, answer FROM chatbot_knowledge
       WHERE language = $1 AND (question ILIKE $2 OR category ILIKE $2)
       LIMIT 3`,
      [language, `%${message.split(" ").slice(0, 3).join("%")}%`]
    );

    if (faqResults.length > 0) {
      const answers = (faqResults as Array<{ answer: string }>).map((r) => r.answer).join("\n\n");
      return NextResponse.json({ response: answers, source: "faq" });
    }

    const fallback = language === "kk"
      ? "Кешіріңіз, қазір ЖИ көмекшісі қол жетімсіз. Кітапханашымен байланысыңыз: +7 (710) 63-1-23-45"
      : "Извините, ИИ-помощник сейчас недоступен. Свяжитесь с библиотекарем: +7 (710) 63-1-23-45";
    return NextResponse.json({ response: fallback, source: "fallback" });
  }

  try {
    const systemPrompt = SYSTEM_PROMPTS[mode]?.[language] ?? SYSTEM_PROMPTS.general.ru;

    const chatHistory = history.map((h: { role: string; content: string }) => ({
      role: h.role === "user" ? "user" as const : "model" as const,
      content: h.content,
    }));
    chatHistory.push({ role: "user" as const, content: message });

    const result = await generateChat(chatHistory, systemPrompt, "chatbot");

    // Log the interaction
    try {
      await query(
        `INSERT INTO chatbot_logs (session_id, user_message, bot_response, language, tokens_used)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, message, result.text, language, result.tokensUsed]
      );
    } catch {
      // Silent fail on logging
    }

    return NextResponse.json({
      response: result.text,
      tokensUsed: result.tokensUsed,
      source: "ai",
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    const errorMsg = language === "kk"
      ? "Кешіріңіз, қате орын алды. Қайталап көріңіз."
      : "Извините, произошла ошибка. Попробуйте ещё раз.";
    return NextResponse.json({ response: errorMsg, source: "error" });
  }
}
