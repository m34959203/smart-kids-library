import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";
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

const AGES = ["6-9", "10-13", "14-17"] as const;
type AgeFilter = typeof AGES[number] | "all";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ age?: string }>;
}) {
  const { locale } = await params;
  const sp = (await searchParams) || {};
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  // Возрастной фильтр: ?age=… > cookie skl_age > все
  const cookieAge = (await cookies()).get("skl_age")?.value;
  const requested = (sp.age || cookieAge || "all") as AgeFilter;
  const age: AgeFilter = (AGES as readonly string[]).includes(requested) ? (requested as AgeFilter) : "all";

  let books: BookRow[] = [];
  try {
    const where = age === "all" ? "" : "WHERE age_category = $1";
    const params: unknown[] = age === "all" ? [] : [age];
    books = await getMany<BookRow>(
      `SELECT id, title, author, cover_url, genre, age_category, is_available
       FROM books ${where}
       ORDER BY created_at DESC
       LIMIT 36`,
      params
    );
  } catch {
    /* ignore */
  }

  const ageLabels: Record<string, string> = kk
    ? { "6-9": "6–9", "10-13": "10–13", "14-17": "14–17", all: "Барлығы" }
    : { "6-9": "6–9", "10-13": "10–13", "14-17": "14–17", all: "Все возрасты" };

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

      <div className="mb-6">
        <SmartSearch locale={validLocale} />
      </div>

      {/* Возрастные фильтры */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
          {kk ? "Жасы:" : "Возраст:"}
        </span>
        {(["all", ...AGES] as const).map((a) => {
          const active = age === a;
          const href = `/${validLocale}/catalog${a === "all" ? "" : `?age=${a}`}`;
          return (
            <Link
              key={a}
              href={href}
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all"
              style={{
                background: active ? "var(--primary)" : "var(--muted)",
                color: active ? "white" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {ageLabels[a]}
            </Link>
          );
        })}
      </div>

      {books.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          {kk ? "Бұл жасқа сай кітаптар табылмады." : "Книг для этого возраста пока нет."}
        </p>
      ) : (
        <section className="mb-12">
          <div className="section-eyebrow mb-4 flex items-center gap-3">
            <span className="inline-block w-8 h-px bg-current" aria-hidden />
            {age === "all" ? (kk ? "Жинақтан" : "Из коллекции") : `${ageLabels[age]} · ${books.length} ${kk ? "кітап" : "книг"}`}
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
