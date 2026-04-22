import { NextRequest, NextResponse } from "next/server";
import { getMany } from "@/lib/db";
import { generateJSON } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJson, v, validate } from "@/lib/validate";

const schema = v.object({
  query: v.string({ max: 200 }),
  language: v.optional(v.enum(["ru", "kk"] as const)),
});

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "catalog-search", max: 40, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = validate<{ query: string; language?: "ru" | "kk" }>(await readJson(request), schema);
  if (!parsed.ok) {
    return NextResponse.json({ books: [], suggestedFilters: [] });
  }
  const { query: searchQuery, language = "ru" } = parsed.data;

  if (!searchQuery.trim()) {
    return NextResponse.json({ books: [], suggestedFilters: [] });
  }

  // First: try direct DB search
  const directResults = await getMany(
    `SELECT * FROM books
     WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1 OR genre ILIKE $1
     ORDER BY created_at DESC LIMIT 20`,
    [`%${searchQuery}%`]
  );

  if (directResults.length > 0) {
    return NextResponse.json({ books: directResults, suggestedFilters: [] });
  }

  // If no direct results and within token limit, use AI
  const withinLimit = await isWithinTokenLimit();
  if (!withinLimit) {
    return NextResponse.json({ books: [], suggestedFilters: [] });
  }

  try {
    const prompt = language === "kk"
      ? `Пайдаланушы кітап іздейді: "${searchQuery}". Іздеуді SQL ILIKE шарттарына түрлендіріңіз. JSON форматында қайтарыңыз: { "keywords": ["keyword1", "keyword2"], "genre": "жанр немесе null", "ageGroup": "жас тобы немесе null", "suggestedFilters": ["сүзгі1", "сүзгі2"] }`
      : `Пользователь ищет книгу: "${searchQuery}". Преобразуйте в поисковые термины SQL ILIKE. Верните JSON: { "keywords": ["keyword1", "keyword2"], "genre": "жанр или null", "ageGroup": "возрастная группа или null", "suggestedFilters": ["фильтр1", "фильтр2"] }`;

    const { data } = await generateJSON<{
      keywords: string[];
      genre: string | null;
      ageGroup: string | null;
      suggestedFilters: string[];
    }>(prompt);

    let sql = "SELECT * FROM books WHERE (1=0";
    const params: unknown[] = [];
    let idx = 0;

    for (const kw of data.keywords ?? []) {
      idx++;
      sql += ` OR title ILIKE $${idx} OR author ILIKE $${idx} OR description ILIKE $${idx}`;
      params.push(`%${kw}%`);
    }
    sql += ")";

    if (data.genre) {
      idx++;
      sql += ` AND genre ILIKE $${idx}`;
      params.push(`%${data.genre}%`);
    }
    if (data.ageGroup) {
      idx++;
      sql += ` AND age_category = $${idx}`;
      params.push(data.ageGroup);
    }

    sql += " ORDER BY created_at DESC LIMIT 20";

    const aiResults = await getMany(sql, params);

    return NextResponse.json({
      books: aiResults,
      suggestedFilters: data.suggestedFilters ?? [],
    });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json({ books: [], suggestedFilters: [] });
  }
}
