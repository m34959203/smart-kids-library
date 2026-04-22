import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import { query } from "@/lib/db";
import { generateJSON } from "@/lib/gemini";
import { isWithinTokenLimit } from "@/lib/token-tracker";

// Динамический импорт pdf-parse — он использует CommonJS, не любит prerender
async function loadPdfParse() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = (await import("pdf-parse")) as unknown as { default: (b: Buffer) => Promise<{ text: string; info: Record<string, unknown>; numpages: number }> };
  return mod.default;
}

interface ParsedBook {
  title: string;
  author?: string;
  description?: string;
  genre?: string;
  age_category?: string;
  year?: number;
  pages?: number;
}

const MAX = 10 * 1024 * 1024; // 10 MB на файл

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const blocked = enforceRateLimit(request, { bucket: "pdf-import", max: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const formData = await request.formData();
  const files = formData.getAll("files");
  const persist = formData.get("persist") === "true";

  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const pdfParse = await loadPdfParse();
  const aiAvailable = await isWithinTokenLimit();
  const results: Array<{ filename: string; book?: ParsedBook; saved?: boolean; error?: string }> = [];

  for (const f of files) {
    if (!(f instanceof File)) continue;
    if (f.size > MAX) {
      results.push({ filename: f.name, error: "too_large" });
      continue;
    }
    try {
      const buf = Buffer.from(await f.arrayBuffer());
      const parsed = await pdfParse(buf);
      const head = parsed.text.slice(0, 4000).trim();
      const info = parsed.info as Record<string, string | undefined>;

      // Базовые метаданные из самого PDF
      const baseTitle = info.Title?.trim() || f.name.replace(/\.[^.]+$/, "");
      const baseAuthor = info.Author?.trim();

      const book: ParsedBook = {
        title: baseTitle,
        author: baseAuthor,
        pages: parsed.numpages,
      };

      // Дополнительный AI-парсинг (жанр/возраст/описание из первых страниц), только если есть бюджет
      if (aiAvailable && head.length > 200) {
        try {
          const prompt = `Извлеки метаданные книги из текста первых страниц PDF и верни строго JSON:
{ "title": "...", "author": "...", "description": "1-2 предложения", "genre": "...", "age_category": "6-9 | 10-13 | 14-17", "year": 2024 }
Если что-то неизвестно — null. Текст:
"""${head}"""`;
          const { data } = await generateJSON<Partial<ParsedBook>>(prompt);
          Object.assign(book, {
            title: data.title || book.title,
            author: data.author || book.author,
            description: data.description,
            genre: data.genre,
            age_category: data.age_category,
            year: data.year,
          });
        } catch {
          /* fallback: только базовые поля */
        }
      }

      let saved = false;
      if (persist && book.title) {
        try {
          await query(
            `INSERT INTO books (title, author, description, genre, age_category, year)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [book.title, book.author ?? null, book.description ?? null, book.genre ?? null, book.age_category ?? null, book.year ?? null]
          );
          saved = true;
        } catch (e) {
          results.push({ filename: f.name, book, error: `db: ${(e as Error).message}` });
          continue;
        }
      }
      results.push({ filename: f.name, book, saved });
    } catch (e) {
      results.push({ filename: f.name, error: (e as Error).message });
    }
  }

  return NextResponse.json({ count: results.length, results });
}
