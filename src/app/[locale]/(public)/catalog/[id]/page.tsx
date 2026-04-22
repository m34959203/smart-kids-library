import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import BookTTS from "@/components/features/BookTTS";
import { getOne } from "@/lib/db";

interface Book {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  age_category: string | null;
  year: number | null;
  language: string | null;
  page_count: number | null;
  is_available: boolean;
  isbn: string | null;
  file_url: string | null;
}

const FALLBACK_COVERS = [
  "/covers/cover-01.jpg", "/covers/cover-02.jpg", "/covers/cover-03.jpg", "/covers/cover-04.jpg",
  "/covers/cover-05.jpg", "/covers/cover-06.jpg", "/covers/cover-07.jpg", "/covers/cover-08.jpg",
];
function pickCover(id: number, title: string): string {
  const seed = `${id}-${title}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return FALLBACK_COVERS[Math.abs(h) % FALLBACK_COVERS.length];
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  const bookId = parseInt(id, 10);
  if (!bookId) notFound();

  const book = await getOne<Book>("SELECT * FROM books WHERE id = $1", [bookId]);
  if (!book) notFound();

  const ttsLang: "ru" | "kk" = (book.language === "kk" ? "kk" : "ru");
  const ttsText = `${book.title}. ${book.author ? "Автор: " + book.author + ". " : ""}${book.description ?? ""}`.trim();
  const cover = book.cover_url || pickCover(book.id, book.title);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
      <Link href={`/${validLocale}/catalog`} className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>
        ← {t(messages, "common.back")}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        <div className="md:col-span-1">
          <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-lg" style={{ background: "var(--muted)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={book.title} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {book.title}
            </h1>
            {book.author && <p className="text-lg mt-2" style={{ color: "var(--foreground-muted)" }}>{book.author}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {book.genre && <Badge variant="purple">{book.genre}</Badge>}
            {book.age_category && <Badge variant="info">{book.age_category}</Badge>}
            <Badge variant={book.is_available ? "success" : "danger"}>
              {book.is_available ? t(messages, "catalog.available") : t(messages, "catalog.unavailable")}
            </Badge>
          </div>

          {book.description && (
            <div className="space-y-3">
              <p className="leading-relaxed" style={{ color: "var(--foreground)" }}>
                {book.description}
              </p>
              <BookTTS
                text={ttsText}
                language={ttsLang}
                label={kk ? "Аннотацияны тыңдау" : "Послушать аннотацию"}
                size="md"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 rounded-2xl p-4" style={{ background: "var(--muted)" }}>
            {book.year && (
              <Info label={t(messages, "catalog.year")} value={String(book.year)} />
            )}
            {book.language && (
              <Info label={t(messages, "catalog.language")} value={book.language === "kk" ? "Қазақша" : book.language === "ru" ? "Русский" : book.language} />
            )}
            {book.page_count && (
              <Info label={t(messages, "catalog.pages")} value={String(book.page_count)} />
            )}
            {book.isbn && (
              <Info label="ISBN" value={book.isbn} />
            )}
          </div>

          <div className="flex flex-wrap gap-3">
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>{label}</span>
      <p className="font-medium mt-1" style={{ color: "var(--foreground)" }}>{value}</p>
    </div>
  );
}
