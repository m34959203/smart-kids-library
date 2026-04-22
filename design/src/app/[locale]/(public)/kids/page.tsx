import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
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
      image: "/illustrations/stories.jpg",
      alt: kk ? "Ертегілер — ашық кітап және құлпытас" : "Иллюстрация: сказочная открытая книга",
    },
    {
      href: `/${validLocale}/kids/quizzes`,
      title: t(messages, "kids.quizzes"),
      desc: t(messages, "kids.quizzesDesc"),
      tag: "02",
      accent: "var(--accent)",
      bg: "#fce3d1",
      image: "/illustrations/quizzes.jpg",
      alt: kk ? "Викторина — сұрақ белгісі мен лампочка" : "Иллюстрация: викторины и идеи",
    },
    {
      href: `/${validLocale}/kids/workshop`,
      title: t(messages, "kids.workshop"),
      desc: t(messages, "kids.workshopDesc"),
      tag: "03",
      accent: "#1c3a31",
      bg: "#e4d9c2",
      image: "/illustrations/workshop.jpg",
      alt: kk ? "Шеберхана — қалам және қайшы" : "Иллюстрация: мастерская творчества",
    },
    {
      href: `/${validLocale}/kids/coloring`,
      title: t(messages, "kids.coloring"),
      desc: t(messages, "kids.coloringDesc"),
      tag: "04",
      accent: "var(--primary-dark)",
      bg: "#f3ecdb",
      image: "/illustrations/coloring.jpg",
      alt: kk ? "Бояулар — қарындаштар және гүлдер" : "Иллюстрация: раскраски и карандаши",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
      {/* =========================================================
          Hero — детская иллюстрация + заголовок
          ========================================================= */}
      <header className="mb-14 md:mb-20 grid md:grid-cols-12 gap-8 md:gap-10 items-center">
        <div className="md:col-span-7 order-2 md:order-1">
          <div className="section-eyebrow mb-4 flex items-center gap-3">
            <span className="inline-block w-8 h-px bg-current" aria-hidden />
            {kk ? "Балаларға арналған" : "Для читателей"}
          </div>
          <h1 className="display-hero text-[40px] md:text-[64px] leading-[1.02] text-foreground">
            {t(messages, "kids.title")}
            <br />
            <em className="not-italic font-display" style={{ color: "var(--primary)" }}>
              {kk ? "ойна, оқы, жаса." : "играй, читай, создавай."}
            </em>
          </h1>
          <p className="mt-5 max-w-xl text-base md:text-lg" style={{ color: "var(--foreground-muted)" }}>
            {kk
              ? "Кітаптар, ертегілер, викториналар мен шығармашылыққа арналған бөлім. Барлығы — балалар үшін."
              : "Интерактивные сказки, викторины, мастерская и раскраски — всё в одном месте, специально для детей."}
          </p>
        </div>

        <div className="md:col-span-5 order-1 md:order-2">
          <div className="relative w-full aspect-square max-w-sm mx-auto">
            <div
              className="absolute inset-2 rounded-[28px] rotate-[3deg]"
              style={{ backgroundColor: "#fce3d1", border: "1px solid var(--border)" }}
              aria-hidden
            />
            <div
              className="absolute inset-0 rounded-[28px] overflow-hidden -rotate-[2deg]"
              style={{
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <Image
                src="/illustrations/kids-hero.jpg"
                alt={kk ? "Балалардың кітапханаға саяхаты" : "Дети в путешествии по библиотеке"}
                fill
                sizes="(max-width: 768px) 80vw, 400px"
                className="object-cover"
                priority
              />
            </div>
            <div
              className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full flex items-center justify-center text-center rotate-[-8deg] animate-float"
              style={{
                backgroundColor: "var(--accent)",
                color: "white",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div className="leading-tight">
                <div className="font-display text-xl font-semibold">6+</div>
                <div className="text-[9px] tracking-widest uppercase">{kk ? "жас" : "лет"}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          Секции — «журнальная сетка» с иллюстрациями
          ========================================================= */}
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
              {/* Иллюстрация */}
              <div className="relative w-full aspect-[16/10] overflow-hidden">
                <Image
                  src={s.image}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span
                  className="absolute top-4 left-4 font-mono text-[10px] tracking-widest px-2 py-1 rounded-full font-semibold"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.85)",
                    color: s.accent,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  N°{s.tag}
                </span>
              </div>

              {/* Текст */}
              <div className="px-6 md:px-8 py-7 md:py-8">
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-3 leading-tight">
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
