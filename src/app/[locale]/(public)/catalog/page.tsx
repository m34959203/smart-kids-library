import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import SmartSearch from "@/components/features/SmartSearch";
import ContextualHints from "@/components/features/ContextualHints";
import BookCard from "@/components/features/BookCard";
import { getMany } from "@/lib/db";

interface BookRow {
  id: number;
  title: string;
  author: string | null;
  cover_url: string | null;
  genre: string | null;
  age_category: string | null;
  is_available: boolean;
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  let books: BookRow[] = [];
  try {
    books = await getMany<BookRow>(
      `SELECT id, title, author, cover_url, genre, age_category, is_available
       FROM books
       ORDER BY created_at DESC
       LIMIT 24`
    );
  } catch {
    /* ignore — пустой каталог */
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <header className="mb-10 md:mb-12 max-w-3xl">
        <div className="section-eyebrow mb-4 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "Каталог" : "Каталог"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[60px] leading-[1.02] text-foreground">
          {t(messages, "catalog.title")}
        </h1>
        <p className="mt-5 text-lg" style={{ color: "var(--foreground-muted)" }}>
          {t(messages, "catalog.smartSearch")}
        </p>
      </header>

      <div className="mb-10">
        <SmartSearch locale={validLocale} />
      </div>

      {books.length > 0 && (
        <section className="mb-12">
          <div className="section-eyebrow mb-4 flex items-center gap-3">
            <span className="inline-block w-8 h-px bg-current" aria-hidden />
            {kk ? "Жинақтан" : "Из коллекции"}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 md:gap-7">
            {books.map((b) => (
              <BookCard
                key={b.id}
                id={b.id}
                title={b.title}
                author={b.author ?? ""}
                coverUrl={b.cover_url ?? undefined}
                genre={b.genre ?? undefined}
                ageCategory={b.age_category ?? undefined}
                isAvailable={b.is_available}
                locale={validLocale}
              />
            ))}
          </div>
        </section>
      )}

      <ContextualHints page="catalog" locale={validLocale} />
    </div>
  );
}
