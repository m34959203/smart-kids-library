import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import BookReader from "@/components/features/BookReader";
import { getOne } from "@/lib/db";

interface Book {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  page_count: number | null;
  language: string | null;
  file_url: string | null;
  is_available: boolean;
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";

  const bookId = parseInt(id, 10);
  if (!bookId) notFound();

  const book = await getOne<Book>(
    "SELECT id, title, author, description, page_count, language, file_url, is_available FROM books WHERE id = $1",
    [bookId]
  );
  if (!book) notFound();

  const kk = validLocale === "kk";
  const noticeRu = `\n\n———\n\nЭто аннотация книги — полный текст доступен в бумажном виде в библиотеке (адрес: ул. Кусаинова, 31-1) или попросите библиотекаря отсканировать главы.${book.file_url ? `\n\nПрямая ссылка: ${book.file_url}` : ""}`;
  const noticeKk = `\n\n———\n\nБұл — кітаптың аннотациясы. Толық мәтінді кітапханадан (Қусайынов к-сі, 31-1) алуға немесе кітапханашыдан тарауларды сұрауға болады.${book.file_url ? `\n\nТікелей сілтеме: ${book.file_url}` : ""}`;

  const content = (book.description || (kk ? "Сипаттама әлі жоқ." : "Описание пока отсутствует.")) + (kk ? noticeKk : noticeRu);

  return (
    <div className="min-h-screen">
      <BookReader
        bookId={book.id}
        title={book.title}
        content={content}
        totalPages={Math.max(1, book.page_count ?? 1)}
        initialPage={1}
        locale={validLocale}
      />
    </div>
  );
}
