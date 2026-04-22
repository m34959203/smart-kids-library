import { isValidLocale, type Locale } from "@/lib/i18n";
import BookRecommendations from "@/components/features/BookRecommendations";
import Link from "next/link";

/**
 * «Книжный клуб» — для 10-13 лет.
 * Подборки для обсуждения, рекомендации именно по возрасту, ссылка на викторины.
 */
export default async function ClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const kk = validLocale === "kk";

  const themes = kk
    ? [
        { title: "Шытырман оқиғалар", desc: "Қызықты сюжеттер мен қаhармандар", emoji: "🗺️" },
        { title: "Достық туралы", desc: "Адал достық пен сатқындық туралы", emoji: "🤝" },
        { title: "Қазіргі әлем", desc: "Бүгінгі күннің батырлары", emoji: "🌍" },
        { title: "Қиял-ғажайып", desc: "Сиқыр мен басқа ғаламдар", emoji: "✨" },
      ]
    : [
        { title: "Приключения", desc: "Захватывающие сюжеты и неожиданные повороты", emoji: "🗺️" },
        { title: "О дружбе", desc: "Настоящая дружба, предательство и взросление", emoji: "🤝" },
        { title: "Современный мир", desc: "Герои нашего времени и их выборы", emoji: "🌍" },
        { title: "Фантастика", desc: "Магия, иные миры и невероятные технологии", emoji: "✨" },
      ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-12">
      <header>
        <div className="section-eyebrow mb-3 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "10–13 жас · Кітап клубы" : "10–13 лет · Книжный клуб"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[56px] leading-[1.05]">
          {kk ? "Біз бірге оқимыз и талқылаймыз" : "Читаем и обсуждаем вместе"}
        </h1>
        <p className="mt-5 text-lg max-w-2xl" style={{ color: "var(--foreground-muted)" }}>
          {kk
            ? "Жасөспірімдерге арналған кітаптар, тақырыптық жинақтар, викториналар мен пікірталас."
            : "Подборки для подростков, тематические клубы по интересам, викторины и обсуждения с библиотекарем."}
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl mb-5 font-semibold">
          {kk ? "Тақырыптар" : "Темы клуба"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((t) => (
            <article
              key={t.title}
              className="p-6 rounded-2xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="text-4xl mb-3">{t.emoji}</div>
              <h3 className="font-display text-xl font-semibold mb-1">{t.title}</h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                {t.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl font-semibold">
            {kk ? "Жасыңа сай ұсыныстар" : "Подобрано по возрасту"}
          </h2>
          <Link href={`/${validLocale}/catalog`} className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>
            {kk ? "Бүкіл каталог →" : "Весь каталог →"}
          </Link>
        </div>
        <BookRecommendations locale={validLocale} ageGroup="10-13" limit={8} />
      </section>

      <section
        className="p-8 rounded-2xl text-center"
        style={{ background: "var(--primary-light)", border: "1px solid var(--border)" }}
      >
        <h3 className="font-display text-xl font-semibold mb-2">
          {kk ? "Викторина — оқыған кітабыңды тексер" : "Проверь себя викториной"}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
          {kk
            ? "ЖИ-генерацияланған викториналар прочитанные кітаптар бойынша."
            : "ИИ-сгенерированные викторины по прочитанным книгам с подсчётом очков."}
        </p>
        <Link
          href={`/${validLocale}/kids/quizzes`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "var(--primary)", color: "white" }}
        >
          {kk ? "Викторинаға өту" : "К викторинам"} →
        </Link>
      </section>
    </div>
  );
}
