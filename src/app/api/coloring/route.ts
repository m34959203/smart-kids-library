import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { theme, language = "ru" } = body;

  if (!theme) {
    return NextResponse.json({ error: "Theme is required" }, { status: 400 });
  }

  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ error: "AI limit reached" }, { status: 429 });
  }

  const prompt = `Generate a simple SVG coloring page for children with the theme: "${theme}".
Requirements:
- SVG format, viewBox="0 0 400 400"
- Simple line art suitable for coloring (no filled shapes, just outlines)
- Stroke width 2-3px, black strokes (#000)
- No text elements
- Kid-friendly design
- Return ONLY the SVG code, nothing else`;

  try {
    const result = await generateText(prompt, {
      temperature: 0.8,
      maxTokens: 2048,
      endpoint: "coloring",
    });

    // Extract SVG from response
    let svg = result.text;
    const svgMatch = svg.match(/<svg[\s\S]*?<\/svg>/);
    if (svgMatch) {
      svg = svgMatch[0];
    }

    return NextResponse.json({ svg });
  } catch (error) {
    console.error("Coloring generation error:", error);
    // Fallback simple SVG
    const fallbackSvg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="150" r="60" fill="none" stroke="#000" stroke-width="3"/>
      <circle cx="180" cy="135" r="8" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="220" cy="135" r="8" fill="none" stroke="#000" stroke-width="2"/>
      <path d="M185 165 Q200 180 215 165" fill="none" stroke="#000" stroke-width="2"/>
      <ellipse cx="200" cy="280" rx="80" ry="100" fill="none" stroke="#000" stroke-width="3"/>
      <line x1="120" y1="250" x2="80" y2="300" stroke="#000" stroke-width="3"/>
      <line x1="280" y1="250" x2="320" y2="300" stroke="#000" stroke-width="3"/>
    </svg>`;
    return NextResponse.json({ svg: fallbackSvg });
  }
}
