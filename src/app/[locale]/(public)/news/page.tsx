import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import NewsCard from "@/components/features/NewsCard";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const sampleNews = [
    {
      slug: "new-books-arrived",
      title: validLocale === "kk" ? "Жаңа кітаптар келді!" : "Новые книги поступили!",
      excerpt: validLocale === "kk" ? "200-ден астам жаңа кітап кітапхана қорына қосылды." : "Более 200 новых книг пополнили фонд библиотеки.",
      category: validLocale === "kk" ? "Жаңалық" : "Новость",
      publishedAt: "2026-04-01",
    },
    {
      slug: "reading-marathon",
      title: validLocale === "kk" ? "Оқу марафоны басталды" : "Стартовал читательский марафон",
      excerpt: validLocale === "kk" ? "Қатысыңыз және жүлделер ұтып алыңыз!" : "Участвуйте и выигрывайте призы!",
      category: validLocale === "kk" ? "Конкурс" : "Конкурс",
      publishedAt: "2026-03-28",
    },
    {
      slug: "ai-assistant-launch",
      title: validLocale === "kk" ? "ЖИ-көмекші іске қосылды" : "Запущен ИИ-помощник",
      excerpt: validLocale === "kk" ? "Кітапхан — жаңа цифрлық кітапханашы қол жетімді!" : "Кітапхан — новый цифровой библиотекарь доступен!",
      category: validLocale === "kk" ? "Технология" : "Технологии",
      publishedAt: "2026-03-25",
    },
    {
      slug: "summer-program",
      title: validLocale === "kk" ? "Жазғы бағдарлама" : "Летняя программа",
      excerpt: validLocale === "kk" ? "Жазғы каникулдағы іс-шаралар бағдарламасы." : "Программа мероприятий на летние каникулы.",
      category: validLocale === "kk" ? "Бағдарлама" : "Программа",
      publishedAt: "2026-03-20",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">{t(messages, "nav.news")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleNews.map((news) => (
          <NewsCard key={news.slug} locale={validLocale} {...news} />
        ))}
      </div>
    </div>
  );
}
