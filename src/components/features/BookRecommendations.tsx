import BookCard from "./BookCard";
import { getMany } from "@/lib/db";

interface Book {
  id: number;
  title: string;
  author: string | null;
  cover_url: string | null;
  genre: string | null;
  age_category: string | null;
  is_available: boolean;
}

interface BookRecommendationsProps {
  locale: string;
  ageGroup?: string;
  limit?: number;
}

/**
 * Server component: тянет рекомендации напрямую из БД.
 * Раньше был "use client" + useEffect/fetch, что приводило к застреванию
 * на skeleton-плейсхолдере, если JS не успевал отработать (например,
 * через Cloudflare quick tunnel с битыми WebSockets).
 */
export default async function BookRecommendations({
  locale,
  ageGroup,
  limit = 8,
}: BookRecommendationsProps) {
  let books: Book[] = [];
  try {
    const sql = ageGroup
      ? `SELECT id, title, author, cover_url, genre, age_category, is_available
           FROM books WHERE is_available = true AND age_category = $1
           ORDER BY RANDOM() LIMIT $2`
      : `SELECT id, title, author, cover_url, genre, age_category, is_available
           FROM books WHERE is_available = true
           ORDER BY RANDOM() LIMIT $1`;
    const params: unknown[] = ageGroup ? [ageGroup, limit] : [limit];
    books = await getMany<Book>(sql, params);
  } catch {
    books = [];
  }

  if (books.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
        {locale === "kk" ? "Кітаптар әлі жүктелген жоқ" : "Книги пока не загружены"}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          id={book.id}
          title={book.title}
          author={book.author ?? ""}
          coverUrl={book.cover_url ?? undefined}
          genre={book.genre ?? undefined}
          ageCategory={book.age_category ?? undefined}
          isAvailable={book.is_available}
          locale={locale}
        />
      ))}
    </div>
  );
}
