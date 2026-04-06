import { NextRequest, NextResponse } from "next/server";
import { generateSpeech } from "@/lib/tts";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, language = "ru" } = body;

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

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
