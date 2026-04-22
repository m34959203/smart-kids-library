import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

/**
 * Ephemeral-токен для Gemini Live (native-audio).
 * Поддерживает kk-KZ через native-audio модель.
 * Токен: 30 минут жизни, 1 connect, 1 минута на подключение.
 */
const MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

// Голоса Gemini Live (мужские/женские, prebuilt).
// Кітапхан — мужской дружелюбный → Puck (игривый, тёплый, мужской).
// Альтернативы: Charon (низкий, серьёзный), Fenrir (хриплый), Orus (нейтральный).
const VOICES = {
  librarian: "Puck",   // мужской, дружелюбный, тёплый — ДЕФОЛТ для Кітапхана
  narrator: "Charon",  // мужской, низкий, серьёзный — для повествования
  child: "Puck",       // тот же — для детских режимов
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  let body: { language?: "ru" | "kk"; mode?: "librarian" | "narrator" | "child"; topic?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* defaults */
  }
  const language: "ru" | "kk" = body.language === "kk" ? "kk" : "ru";
  const mode = body.mode || "librarian";
  const voice = VOICES[mode] || VOICES.librarian;

  const systemPromptRu = `Ты — Кітапхан, дружелюбный цифровой библиотекарь Детско-юношеской библиотеки города Сатпаев.
ПРАВИЛА ЖИВОГО ГОЛОСОВОГО ДИАЛОГА:
1. Говори ТОЛЬКО на русском языке.
2. Короткие, естественные фразы — это голос, не текст.
3. Тон тёплый, дружелюбный, без снисхождения. Аудитория — дети и подростки 6-17.
4. Помогай с книгами из каталога библиотеки, мероприятиями, школьными темами.
5. Запрещено: политика, религия, 18+, насилие. Если попросят — вежливо смени тему.
${body.topic ? `6. Тема разговора: ${body.topic}` : ""}`;

  const systemPromptKk = `Сен — Кітапхан, Сәтбаев қаласы Балалар-жасөспірімдер кітапханасының достық цифрлық кітапханашысы.
ТІРІ ДАУЫСТЫ ДИАЛОГ ЕРЕЖЕЛЕРІ:
1. ТЕК қазақ тілінде сөйле.
2. Қысқа, табиғи сөйлемдер — бұл дауыс, мәтін емес.
3. Жылы, достық тон. Аудитория — 6-17 жас балалар мен жасөспірімдер.
4. Кітаптар, іс-шаралар, мектеп тақырыптары туралы көмектес.
5. Тыйым салынған: саясат, дін, 18+, зорлық-зомбылық.
${body.topic ? `6. Әңгіме тақырыбы: ${body.topic}` : ""}`;

  const systemPrompt = language === "kk" ? systemPromptKk : systemPromptRu;

  try {
    const client = new GoogleGenAI({ apiKey });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: { parts: [{ text: systemPrompt }] },
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return NextResponse.json({
      token: token.name,
      model: MODEL,
      voice,
      language,
    });
  } catch (err) {
    console.error("[live-token] failed", err);
    return NextResponse.json({ error: "Failed to create live token", details: String(err) }, { status: 500 });
  }
}
