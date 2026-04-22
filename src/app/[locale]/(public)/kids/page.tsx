import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import ContextualHints from "@/components/features/ContextualHints";

export default async function KidsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  const sections = [
    {
      href: `/${validLocale}/kids/stories`,
      title: t(messages, "kids.stories"),
      desc: t(messages, "kids.storiesDesc"),
      tag: "01",
      accent: "var(--primary)",
      bg: "#d9ebe4",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
          <path d="M4 5a2 2 0 012-2h10v16H6a2 2 0 00-2 2V5z" />
          <path d="M8 7h6M8 11h6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: `/${validLocale}/kids/quizzes`,
      title: t(messages, "kids.quizzes"),
      desc: t(messages, "kids.quizzesDesc"),
      tag: "02",
      accent: "var(--accent)",
      bg: "#fce3d1",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M9.5 9.5a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
        </svg>
      ),
    },
    {
      href: `/${validLocale}/kids/workshop`,
      title: t(messages, "kids.workshop"),
      desc: t(messages, "kids.workshopDesc"),
      tag: "03",
      accent: "#1c3a31",
      bg: "#e4d9c2",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
          <path d="M15.2 5.6l3.2 3.2M4 20l3.8-.8L19.5 7.5a2 2 0 000-2.8l-.4-.4a2 2 0 00-2.8 0L4.8 16.2 4 20z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: `/${validLocale}/kids/coloring`,
      title: t(messages, "kids.coloring"),
      desc: t(messages, "kids.coloringDesc"),
      tag: "04",
      accent: "var(--primary-dark)",
      bg: "#f3ecdb",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
          <path d="M12 3a9 9 0 000 18 3 3 0 003-3 1.5 1.5 0 011.5-1.5H18A3 3 0 0021 13.5 9 9 0 0012 3z" />
          <circle cx="7.5" cy="10.5" r="1" />
          <circle cx="10.5" cy="7.5" r="1" />
          <circle cx="14.5" cy="7.5" r="1" />
          <circle cx="17" cy="10.5" r="1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
      {/* Заголовок */}
      <header className="mb-12 md:mb-16">
        <div className="section-eyebrow mb-4 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "Балаларға арналған" : "Для читателей"}
        </div>
        <h1 className="display-hero text-[44px] md:text-[68px] leading-[1.02] text-foreground max-w-3xl">
          {t(messages, "kids.title")}
          <br />
          <em className="not-italic font-display" style={{ color: "var(--primary)" }}>
            {kk ? "ойна, оқы, жаса." : "играй, читай, создавай."}
          </em>
        </h1>
        <p className="mt-6 max-w-xl text-lg" style={{ color: "var(--foreground-muted)" }}>
          {kk
            ? "Кітаптар, ертегілер, викториналар мен шығармашылыққа арналған бөлім. Барлығы — балалар үшін."
            : "Интерактивные сказки, викторины, мастерская и раскраски — всё в одном месте, специально для детей."}
        </p>
      </header>

      {/* Секции — «журнальная сетка» */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <article
              className="relative rounded-[24px] overflow-hidden transition-all group-hover:-translate-y-0.5 h-full"
              style={{
                backgroundColor: s.bg,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-start justify-between p-6 md:p-8">
                <span
                  className="font-mono text-xs tracking-widest"
                  style={{ color: s.accent, opacity: 0.7 }}
                >
                  N°{s.tag}
                </span>
                <div className="w-14 h-14 md:w-16 md:h-16" style={{ color: s.accent }}>
                  {s.icon}
                </div>
              </div>

              <div className="px-6 md:px-8 pb-8 md:pb-10">
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3 leading-tight">
                  {s.title}
                </h2>
                <p className="text-[15px]" style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
                  {s.desc}
                </p>
                <div
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold tracking-wide"
                  style={{ color: s.accent }}
                >
                  {kk ? "Кіру" : "Открыть"}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      <ContextualHints page="kids" locale={validLocale} />
    </div>
  );
}
