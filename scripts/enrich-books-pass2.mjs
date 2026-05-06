#!/usr/bin/env node
/**
 * Pass 2 enrichment: для книг с реальным content_text (PDF/DOCX) извлекает
 * автор/описание/жанр/year/age_category через Groq (gpt-oss-120b, free-tier).
 * Идемпотентен — трогает только записи с пустыми полями.
 *
 * Запуск:
 *   docker compose exec -T -e GROQ_API_KEY=... app node /app/scripts/enrich-books-pass2.mjs
 */
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GROQ_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL_JSON || "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `Ты — библиотекарь-каталогизатор. Тебе дают
фрагмент текста книги (первые 2-4 тыс символов). Извлеки метаданные
и верни СТРОГО JSON следующего вида (русский язык для значений):
{
  "author": "Фамилия И.О. или null если в тексте автор не упомянут",
  "description": "1-2 предложения про сюжет/тему книги, ≤ 280 символов",
  "genre": "одно из: проза | поэзия | публицистика | краеведение | биография | сказка | мемуары | статья | интервью",
  "age_category": "одно из: 6-9 | 10-13 | 14-17 | all",
  "year": 2024 (число) или null
}
Никакого markdown, никаких пояснений — только JSON.`;

async function extract(text, fallbackTitle) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Заголовок (если поможет): ${fallbackTitle}\n\nТЕКСТ:\n${text.slice(0, 3500)}` },
      ],
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) {
    const ra = parseInt(res.headers.get("retry-after") || "30", 10);
    const err = new Error("rate-limit");
    err.status = 429;
    err.retryAfter = ra;
    throw err;
  }
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  try { return JSON.parse(raw); } catch { return null; }
}

async function main() {
  // Берём книги где есть осмысленный текст и пустые ключевые поля
  const { rows } = await pool.query(`
    SELECT id, title, content_text
      FROM books
     WHERE LENGTH(content_text) > 300
       AND (author IS NULL OR author = '')
     ORDER BY id ASC
  `);
  console.log(`Need enrichment for ${rows.length} books with real text`);

  const VALID_AGES = new Set(["6-9", "10-13", "14-17", "all"]);
  const VALID_AGE = (a) => (typeof a === "string" && VALID_AGES.has(a)) ? a : null;

  let ok = 0, skipped = 0, failed = 0;
  for (const b of rows) {
    try {
      const meta = await extract(b.content_text, b.title);
      if (!meta) { skipped++; continue; }
      await pool.query(
        `UPDATE books SET
            author = COALESCE(NULLIF($1, ''), author),
            description = COALESCE(NULLIF($2, ''), description),
            description_ru = COALESCE(description_ru, NULLIF($2, '')),
            genre = COALESCE(NULLIF($3, ''), genre),
            age_category = COALESCE($4, age_category),
            year = CASE WHEN $5::int IS NOT NULL THEN $5::int ELSE year END
         WHERE id = $6`,
        [
          (typeof meta.author === "string" && meta.author.trim()) ? meta.author.trim() : null,
          (typeof meta.description === "string" && meta.description.trim()) ? meta.description.trim() : null,
          (typeof meta.genre === "string" && meta.genre.trim()) ? meta.genre.trim() : null,
          VALID_AGE(meta.age_category),
          (typeof meta.year === "number" && meta.year >= 1900 && meta.year <= 2100) ? meta.year : null,
          b.id,
        ],
      );
      ok++;
      if (ok % 5 === 0) console.log(`  ${ok}/${rows.length}…`);
    } catch (e) {
      console.error(`[fail] id=${b.id}: ${e.message}`);
      failed++;
      if (e.status === 429) {
        const wait = Math.max((e.retryAfter || 30), 5) * 1000;
        console.log(`Rate limit, waiting ${wait/1000}s…`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    // Throttle между запросами: Groq gpt-oss-120b free-tier ≈ 30 RPM, ставим запас 2 сек.
    await new Promise((r) => setTimeout(r, 2200));
  }
  console.log(`\nDone: ok=${ok}, skipped=${skipped}, failed=${failed}, total=${rows.length}`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
