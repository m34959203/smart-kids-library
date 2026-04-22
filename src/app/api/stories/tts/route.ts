import { NextRequest, NextResponse } from "next/server";
import { generateSpeech, parseStoryVoices, pickVoice } from "@/lib/tts";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  text: v.string({ min: 1, max: 4000 }),
  language: v.optional(v.enum(["ru", "kk"] as const)),
  voice: v.optional(v.string({ max: 50 })),
  multiVoice: v.optional(v.string({ max: 10 })),
});

interface Body { text: string; language?: "ru" | "kk"; voice?: string; multiVoice?: string }

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "tts", max: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<Body>(await readJson(request), schema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const { text, language = "ru", voice, multiVoice } = parsed.data;

  // Multi-voice режим: парсим [voice:role] метки и возвращаем JSON-массив сегментов с base64-аудио.
  // Клиент проигрывает по очереди (StoryPlayer)
  if (multiVoice === "true" || multiVoice === "1") {
    const segments = parseStoryVoices(text);
    const provider: "gemini" | "eleven" = language === "kk" ? "gemini" : "eleven";
    const out: Array<{ role: string; mimeType: string; audioBase64: string }> = [];
    for (const seg of segments) {
      const v = pickVoice(seg.role, provider);
      const audio = await generateSpeech({ text: seg.text.substring(0, 1000), language, voice: v });
      if (audio) {
        const b64 = Buffer.from(audio).toString("base64");
        out.push({ role: seg.role, mimeType: language === "kk" ? "audio/wav" : "audio/mpeg", audioBase64: b64 });
      }
    }
    if (out.length === 0) return NextResponse.json({ error: "TTS unavailable" }, { status: 503 });
    return NextResponse.json({ segments: out });
  }

  // Одиночный режим (back-compat)
  try {
    const audioBuffer = await generateSpeech({
      text: text.substring(0, 1000),
      language,
      voice,
    });
    if (!audioBuffer) {
      return NextResponse.json({ error: "TTS unavailable, use browser TTS" }, { status: 503 });
    }
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": language === "kk" ? "audio/wav" : "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
