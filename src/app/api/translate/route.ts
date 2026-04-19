import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  text: v.string({ min: 1, max: 6000 }),
  from: v.enum(["ru", "kk", "auto"] as const),
  to: v.enum(["ru", "kk"] as const),
});

interface TranslateBody {
  text: string;
  from: "ru" | "kk" | "auto";
  to: "ru" | "kk";
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "translate", max: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<TranslateBody>(await readJson(request), schema);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid body", issues: parsed.issues }, { status: 400 });
  const { text, from, to } = parsed.data;

  if (from !== "auto" && from === to) {
    return NextResponse.json({ translated: text, from, to });
  }

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ error: "AI limit reached" }, { status: 429 });
  }

  const systemPrompt = `You are a faithful translator between Russian (ru) and Kazakh (kk).
Preserve meaning, tone, and named entities. Return ONLY the translation, no explanations.`;
  const langName = { ru: "Russian", kk: "Kazakh" };
  const prompt = from === "auto"
    ? `Translate the text to ${langName[to]}. Detect source language automatically.\n\nTEXT:\n${text}`
    : `Translate from ${langName[from]} to ${langName[to]}.\n\nTEXT:\n${text}`;

  try {
    const r = await generateText(prompt, { systemPrompt, endpoint: "translate", temperature: 0.2, maxTokens: 2048 });
    return NextResponse.json({ translated: r.text.trim(), from, to, tokensUsed: r.tokensUsed });
  } catch (e) {
    console.error("translate error", e);
    return NextResponse.json({ error: "Translate failed" }, { status: 500 });
  }
}
