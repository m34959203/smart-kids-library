import { NextRequest, NextResponse } from "next/server";
import { dispatchChat } from "@/lib/llm/dispatch";
import { quotaErrorResponse } from "@/lib/llm/quota-error-response";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { getMany, query } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";
import { detectLanguage } from "@/lib/lang-detect";

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

const BLOCKED_PATTERNS = [
  // 18+ / NSFW
  /(?:секс|порно|18\+|nude|nsfw|эрот)/i,
  // Self-harm
  /(?:суицид|самоубий|убей\s+себя|kill\s+yourself|self[-\s]?harm)/i,
  // Drugs
  /(?:наркот|drugs|cocaine|марихуан|героин|amphetamin)/i,
  // Weapons / explosives
  /(?:взрывчат|бомб[уы]|explosive|how\s+to\s+make\s+(?:bomb|weapon|gun)|изготови[ьть]+\s+оруж)/i,
  // Jailbreak / prompt-injection
  /(?:ignore\s+(?:all\s+)?previous\s+(?:instructions|prompts)|disregard\s+(?:above|previous)|jailbreak|DAN\s+mode|роль\s+(?:разработчика|admin)|pretend\s+(?:to\s+be|you\s+are))/i,
  /(?:забудь\s+(?:все\s+)?(?:предыдущ|инструкци|правил)|игнорируй\s+(?:инструкци|правил|систем))/i,
  // Hate / extremism
  /(?:терроризм|nazi|нацист|hate\s+speech|расизм)/i,
];

const schema = v.object({
  message: v.string({ min: 1, max: 2000, trim: true }),
  mode: v.optional(v.enum(["general", "search", "education"] as const)),
  language: v.optional(v.enum(["ru", "kk"] as const)),
  history: v.optional(
    v.array(
      v.object({
        role: v.enum(["user", "model", "assistant"] as const),
        content: v.string({ min: 1, max: 4000 }),
      }),
      { max: 20 }
    )
  ),
  sessionId: v.optional(v.string({ max: 100 })),
});

interface ChatBody {
  message: string;
  mode?: "general" | "search" | "education";
  language?: "ru" | "kk";
  history?: Array<{ role: "user" | "model" | "assistant"; content: string }>;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "chatbot", max: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await readJson(request);
  const parsed = validate<ChatBody>(body, schema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const { message, mode = "general", language: explicitLang, history = [], sessionId: incomingSession } = parsed.data;
  // Авто-определение языка по тексту запроса (если параметр не задан явно)
  const language: "ru" | "kk" = explicitLang ?? detectLanguage(message);

  if (BLOCKED_PATTERNS.some((re) => re.test(message))) {
    const polite = language === "kk"
      ? "Кешіріңіз, мен бұл тақырыпта сөйлесе алмаймын. Кітаптар, кітапхана немесе үй жұмыстары туралы сұраңыз."
      : "Извини, я не могу говорить на эту тему. Спроси меня о книгах, библиотеке или школьных заданиях.";
    return NextResponse.json({ response: polite, source: "policy" });
  }

  const sessionId = incomingSession ?? uuid();

  const withinLimit = await isWithinTokenLimit();

  if (!withinLimit) {
    const faqResults = await getMany(
      `SELECT question, answer FROM chatbot_knowledge
       WHERE language = $1 AND (question ILIKE $2 OR category ILIKE $2)
       LIMIT 3`,
      [language, `%${message.split(" ").slice(0, 3).join("%")}%`]
    );

    if (faqResults.length > 0) {
      const answers = (faqResults as Array<{ answer: string }>).map((r) => r.answer).join("\n\n");
      return NextResponse.json({ response: answers, source: "faq", sessionId });
    }

    const fallback = language === "kk"
      ? "Кешіріңіз, қазір ЖИ көмекшісі қол жетімсіз. Кітапханашымен байланысыңыз: +7 (71063) 7-49-62"
      : "Извините, ИИ-помощник сейчас недоступен. Свяжитесь с библиотекарем: +7 (71063) 7-49-62";
    return NextResponse.json({ response: fallback, source: "fallback", sessionId });
  }

  try {
    let systemPrompt = SYSTEM_PROMPTS[mode]?.[language] ?? SYSTEM_PROMPTS.general.ru;

    // P1-1: заземление на реальный каталог. Без этого модель выдумывает
    // несуществующие книги. Для general/search подмешиваем результаты FTS
    // по `books` и запрещаем называть книги вне выдачи.
    let groundedCount = 0;
    if (mode === "general" || mode === "search") {
      try {
        // Вопрос — это предложение. plainto_tsquery('russian', …) стеммит
        // русские словоформы (Сатпаева→сатпаев) и выкидывает стоп-слова, но
        // склеивает термы через AND — по полному предложению это даёт 0.
        // Поэтому меняем '&' → '|' (OR). NULLIF → пустой запрос (одни
        // стоп-слова) даёт NULL и просто 0 строк, без ошибки. KK-слова
        // матчатся по точной форме (russian-конфиг их не стеммит) — приемлемо.
        const FIELDS = `COALESCE(title_ru,'') || ' ' || COALESCE(title_kk,'') || ' ' ||
                        COALESCE(title,'') || ' ' || COALESCE(author,'') || ' ' ||
                        COALESCE(description,'')`;
        // ts_rank сортирует по релевантности: книга, совпавшая по редкому
        // терму («сатпаев»), выше совпавшей лишь по частому («книг»).
        const hits = await getMany<{ title: string; author: string | null }>(
          `WITH q AS (
             SELECT to_tsquery('russian',
               NULLIF(replace(plainto_tsquery('russian', $1)::text, ' & ', ' | '), '')) AS query
           )
           SELECT COALESCE(title_ru, title_kk, title) AS title, author
             FROM books, q
            WHERE q.query IS NOT NULL
              AND to_tsvector('russian', ${FIELDS}) @@ q.query
            ORDER BY ts_rank(to_tsvector('russian', ${FIELDS}), q.query) DESC
            LIMIT 8`,
          [message]
        );
        groundedCount = hits.length;
        if (hits.length > 0) {
          const list = hits
            .map((b) => `- «${b.title}»${b.author ? ` — ${b.author}` : ""}`)
            .join("\n");
          systemPrompt +=
            language === "kk"
              ? `\n\nКАТАЛОГТАН ТАБЫЛҒАН КІТАПТАР (тек осыларды атап өт, басқасын ОЙЛАП ТАППА):\n${list}\n\nЕгер сұралған кітап тізімде болмаса — «бұл туралы дәл таппадым, /catalog бөлімінен іздеп көріңіз» деп жаз. Тізімде жоқ кітаптарды ешқашан атама.`
              : `\n\nНАЙДЕНО В КАТАЛОГЕ (упоминай ТОЛЬКО эти книги, остальные НЕ ВЫДУМЫВАЙ):\n${list}\n\nЕсли нужной книги нет в списке — ответь «точно такой книги не нашёл, попробуйте поиск в разделе /catalog». Никогда не называй книги, которых нет в списке.`;
        } else {
          systemPrompt +=
            language === "kk"
              ? `\n\nКАТАЛОГТАН бұл сұрау бойынша ештеңе табылмады. Нақты кітап атауларын ОЙЛАП ТАППА — пайдаланушыға /catalog бөлімінен іздеуді ұсын.`
              : `\n\nПо этому запросу в КАТАЛОГЕ ничего не найдено. НЕ ВЫДУМЫВАЙ конкретные названия книг — предложи пользователю поиск в разделе /catalog.`;
        }
      } catch (e) {
        console.error("Catalog grounding failed:", e);
      }
    }

    const chatHistory = history.map((h) => ({
      role: h.role === "user" ? ("user" as const) : ("assistant" as const),
      content: h.content,
    }));

    const result = await dispatchChat(systemPrompt, message, chatHistory, {
      purpose: "chatbot",
      maxTokens: 800,
      temperature: 0.7,
    });

    try {
      await query(
        `INSERT INTO chatbot_logs (session_id, user_message, bot_response, language, tokens_used)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, message, result.content, language, result.tokensUsed]
      );
    } catch {
      // logging is best-effort
    }

    return NextResponse.json({
      response: result.content,
      tokensUsed: result.tokensUsed,
      source: "ai",
      provider: result.provider,
      model: result.model,
      groundedCount,
      sessionId,
    });
  } catch (error) {
    const quotaResp = quotaErrorResponse(error, language);
    if (quotaResp) return quotaResp;
    console.error("Chatbot error:", error);
    const errorMsg = language === "kk"
      ? "Кешіріңіз, қате орын алды. Қайталап көріңіз."
      : "Извините, произошла ошибка. Попробуйте ещё раз.";
    return NextResponse.json({ response: errorMsg, source: "error", sessionId });
  }
}
