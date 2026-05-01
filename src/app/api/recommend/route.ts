import { NextRequest, NextResponse } from "next/server";
import { getMany } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth-guard";

/**
 * Hybrid-рекомендации без ML.
 * Скоринг по факторам:
 *   +12  совпадение возрастной группы пользователя/запроса
 *   +6   язык каталога совпал с локалью
 *   +5   жанр уже встречался в reading_progress пользователя
 *   +4   автор уже встречался в reading_progress
 *   +3   книга добавлена недавно (за 60 дней)
 *   +2   доступна (is_available)
 *  rand 0..1 — лёгкий шум, чтобы порядок не был детерминированным
 *
 * Исключаем книги, которые пользователь уже дочитал (current_page == total_pages).
 */
export async function GET(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "recommend", max: 60, windowMs: 60_000 });
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const ageGroup = searchParams.get("ageGroup");
  const locale = searchParams.get("locale") === "kk" ? "kk" : "ru";
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") ?? "8", 10) || 8));

  const user = await getCurrentUser();
  const userId = user?.id ? Number(user.id) : null;

  try {
    const sql = `
      WITH user_history AS (
        SELECT b.genre, b.author
          FROM reading_progress rp
          JOIN books b ON b.id = rp.book_id
         WHERE rp.user_id = $1
      ),
      finished AS (
        SELECT book_id FROM reading_progress
         WHERE user_id = $1
           AND total_pages > 0
           AND current_page >= total_pages
      )
      SELECT b.*,
        (
          (CASE WHEN $2::text IS NOT NULL AND b.age_category = $2 THEN 12 ELSE 0 END)
        + (CASE WHEN b.language = $3 THEN 6 ELSE 0 END)
        + (CASE WHEN EXISTS (SELECT 1 FROM user_history h WHERE h.genre = b.genre) THEN 5 ELSE 0 END)
        + (CASE WHEN EXISTS (SELECT 1 FROM user_history h WHERE h.author = b.author) THEN 4 ELSE 0 END)
        + (CASE WHEN b.created_at > NOW() - INTERVAL '60 days' THEN 3 ELSE 0 END)
        + (CASE WHEN b.is_available THEN 2 ELSE 0 END)
        + RANDOM()
        ) AS score
      FROM books b
      WHERE b.is_available = true
        AND ($2::text IS NULL OR b.age_category = $2)
        AND b.id NOT IN (SELECT book_id FROM finished)
      ORDER BY score DESC
      LIMIT $4`;

    const books = await getMany(sql, [userId, ageGroup, locale, limit]);
    return NextResponse.json({ books, locale, personalized: Boolean(userId) });
  } catch {
    const sampleBooks = [
      { id: 1, title: locale === "kk" ? "Алтын сақа" : "Золотой ключик", author: "А. Толстой", genre: "Сказка", age_category: "6-9" },
      { id: 2, title: locale === "kk" ? "Кішкентай ханзада" : "Маленький принц", author: "А. де Сент-Экзюпери", genre: "Повесть", age_category: "10-13" },
      { id: 3, title: "Гарри Поттер", author: "Дж. Роулинг", genre: "Фэнтези", age_category: "10-13" },
      { id: 4, title: locale === "kk" ? "Абай жолы" : "Путь Абая", author: "М. Ауэзов", genre: "Роман", age_category: "14-17" },
    ];
    return NextResponse.json({ books: sampleBooks, personalized: false });
  }
}
