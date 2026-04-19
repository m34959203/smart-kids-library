import { NextRequest, NextResponse } from "next/server";
import { generateSpeech } from "@/lib/tts";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  text: v.string({ min: 1, max: 4000 }),
  language: v.optional(v.enum(["ru", "kk"] as const)),
});

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "tts", max: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<{ text: string; language?: "ru" | "kk" }>(await readJson(request), schema);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  }
  const { text, language = "ru" } = parsed.data;

  try {
    const audioBuffer = await generateSpeech({
      text: text.substring(0, 1000),
      language: language as "ru" | "kk",
    });

    if (!audioBuffer) {
      return NextResponse.json({ error: "TTS unavailable, use browser TTS" }, { status: 503 });
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
