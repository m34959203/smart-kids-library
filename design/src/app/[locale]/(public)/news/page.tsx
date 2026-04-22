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
  const kk = validLocale === "kk";

  const sampleNews = [
    {
      slug: "new-books-arrived",
      title: kk ? "Жаңа кітаптар келді!" : "Новые книги поступили!",
      excerpt: kk ? "200-ден астам жаңа кітап кітапхана қорына қосылды." : "Более 200 новых книг пополнили фонд библиотеки.",
      category: kk ? "Жаңалық" : "Новость",
      publishedAt: "2026-04-01",
    },
    {
      slug: "reading-marathon",
      title: kk ? "Оқу марафоны басталды" : "Стартовал читательский марафон",
      excerpt: kk ? "Қатысыңыз және жүлделер ұтып алыңыз!" : "Участвуйте и выигрывайте призы!",
      category: kk ? "Конкурс" : "Конкурс",
      publishedAt: "2026-03-28",
    },
    {
      slug: "ai-assistant-launch",
      title: kk ? "ЖИ-көмекші іске қосылды" : "Запущен ИИ-помощник",
      excerpt: kk ? "Кітапхан — жаңа цифрлық кітапханашы қол жетімді!" : "Кітапхан — новый цифровой библиотекарь доступен!",
      category: kk ? "Технология" : "Технологии",
      publishedAt: "2026-03-25",
    },
    {
      slug: "summer-program",
      title: kk ? "Жазғы бағдарлама" : "Летняя программа",
      excerpt: kk ? "Жазғы каникулдағы іс-шаралар бағдарламасы." : "Программа мероприятий на летние каникулы.",
      category: kk ? "Бағдарлама" : "Программа",
      publishedAt: "2026-03-20",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-14">
      <header className="mb-10 md:mb-12">
        <div className="section-eyebrow mb-4 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "Хроника" : "Хроника"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[60px] leading-[1.02]">
          {t(messages, "nav.news")}
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleNews.map((news) => (
          <NewsCard key={news.slug} locale={validLocale} {...news} />
        ))}
      </div>
    </div>
  );
}
