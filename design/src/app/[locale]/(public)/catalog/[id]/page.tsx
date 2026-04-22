import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  // Sample book data (in production, fetched from API/DB)
  const book = {
    id: parseInt(id),
    title: validLocale === "kk" ? "Кішкентай ханзада" : "Маленький принц",
    author: validLocale === "kk" ? "Антуан де Сент-Экзюпери" : "Антуан де Сент-Экзюпери",
    description: validLocale === "kk"
      ? "Әлемге белгілі повесть-ертегі дос, махаббат және жауапкершілік туралы."
      : "Всемирно известная повесть-сказка о дружбе, любви и ответственности.",
    genre: validLocale === "kk" ? "Повесть" : "Повесть",
    age_category: "10-13",
    year: 1943,
    language: validLocale === "kk" ? "Қазақша" : "Русский",
    page_count: 96,
    is_available: true,
    isbn: "978-5-699-12014-7",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href={`/${validLocale}/catalog`} className="text-purple-500 hover:text-purple-700 text-sm mb-4 inline-block">
        &larr; {t(messages, "common.back")}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="aspect-[3/4] bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-24 h-24 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold text-purple-900">{book.title}</h1>
          <p className="text-lg text-gray-600">{book.author}</p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="purple">{book.genre}</Badge>
            <Badge variant="info">{book.age_category}</Badge>
            <Badge variant={book.is_available ? "success" : "danger"}>
              {book.is_available ? t(messages, "catalog.available") : t(messages, "catalog.unavailable")}
            </Badge>
          </div>

          <p className="text-gray-700 leading-relaxed">{book.description}</p>

          <div className="grid grid-cols-2 gap-4 bg-purple-50 rounded-2xl p-4">
            <div>
              <span className="text-xs text-gray-500">{t(messages, "catalog.year")}</span>
              <p className="font-medium text-purple-900">{book.year}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t(messages, "catalog.language")}</span>
              <p className="font-medium text-purple-900">{book.language}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t(messages, "catalog.pages")}</span>
              <p className="font-medium text-purple-900">{book.page_count}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">ISBN</span>
              <p className="font-medium text-purple-900">{book.isbn}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {book.is_available && (
              <Link href={`/${validLocale}/catalog/read/${book.id}`}>
                <Button size="lg">{t(messages, "catalog.readOnline")}</Button>
              </Link>
            )}
            <Button variant="outline" size="lg">{t(messages, "catalog.addFavorite")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
