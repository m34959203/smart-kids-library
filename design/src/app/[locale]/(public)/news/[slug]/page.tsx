import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const article = {
    title: validLocale === "kk" ? "Жаңа кітаптар келді!" : "Новые книги поступили!",
    content: validLocale === "kk"
      ? "Біздің кітапханаға 200-ден астам жаңа кітап келді! Ертегілерден бастап ғылыми-танымдық кітаптарға дейін барлық жас тобына арналған кітаптар бар. Каталогтан іздеп, сүйікті кітаптарыңызды табыңыз."
      : "В нашу библиотеку поступило более 200 новых книг! От сказок до научно-познавательной литературы — книги для всех возрастных групп. Ищите в каталоге и находите свои любимые книги.",
    publishedAt: "2026-04-01",
    category: validLocale === "kk" ? "Жаңалық" : "Новость",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/${validLocale}/news`} className="text-purple-500 hover:text-purple-700 text-sm mb-4 inline-block">
        &larr; {t(messages, "common.back")}
      </Link>

      <article>
        <div className="mb-4">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{article.category}</span>
          <span className="text-xs text-gray-400 ml-2">{formatDate(article.publishedAt, validLocale)}</span>
        </div>
        <h1 className="text-3xl font-bold text-purple-900 mb-6">{article.title}</h1>
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-6 flex items-center justify-center">
          <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <div className="prose max-w-none text-gray-700 leading-relaxed text-lg">
          <p>{article.content}</p>
        </div>
      </article>
    </div>
  );
}
