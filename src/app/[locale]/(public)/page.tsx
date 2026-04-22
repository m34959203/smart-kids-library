import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
import BookRecommendations from "@/components/features/BookRecommendations";
import ContextualHints from "@/components/features/ContextualHints";
import UpcomingEventsWidget from "@/components/features/UpcomingEventsWidget";
import { getOne } from "@/lib/db";

/**
 * Цифры для hero-блока: реальные счётчики из БД + редактируемые
 * через site_settings (library_books_total, library_readers_total)
 * на случай если заказчик хочет показывать оценку фонда (а не только
 * то что уже импортировано в catalog), либо дашборд активных читателей
 * которые ходят в библиотеку, а не только зарегистрированных в системе.
 */
async function getHomeStats(): Promise<{ books: string; readers: string; years: string }> {
  let booksCount = 0;
  let usersCount = 0;
  let founded = 2006;
  let manualBooks: string | null = null;
  let manualReaders: string | null = null;

  try {
    const [b, u, f, mb, mr] = await Promise.all([
      getOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM books"),
      getOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role IN ('reader','user') OR role IS NULL"),
      getOne<{ value: string }>("SELECT value FROM site_settings WHERE key='library_founded'"),
      getOne<{ value: string }>("SELECT value FROM site_settings WHERE key='library_books_total'"),
      getOne<{ value: string }>("SELECT value FROM site_settings WHERE key='library_readers_total'"),
    ]);
    booksCount = parseInt(b?.count ?? "0", 10);
    usersCount = parseInt(u?.count ?? "0", 10);
    if (f?.value) founded = parseInt(f.value, 10) || 2006;
    manualBooks = mb?.value || null;
    manualReaders = mr?.value || null;
  } catch {
    /* fall through to defaults */
  }

  // Если админ задал «manual» в site_settings — показываем его.
  // Иначе — реальный COUNT, но если 0 — прочерк, чтобы не выглядело сиротливо.
  const fmt = (n: number) => (n > 0 ? n.toLocaleString("ru-RU") : "—");
  const books = manualBooks?.trim() || fmt(booksCount);
  const readers = manualReaders?.trim() || fmt(usersCount);
  const years = String(Math.max(0, new Date().getFullYear() - founded));
  return { books, readers, years };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";
  const stats = await getHomeStats();

  const ageGroups = [
    {
      group: "6-9",
      label: kk ? "6–9 жас" : "6–9 лет",
      title: kk ? "Ашылулар" : "Первые открытия",
      desc: kk ? "Ертегілер, бояулар, дыбыстық оқу" : "Сказки, раскраски, аудиокниги",
      accent: "var(--accent)",
      swatch: "#fce3d1",
    },
    {
      group: "10-13",
      label: kk ? "10–13 жас" : "10–13 лет",
      title: kk ? "Зерттеу" : "Исследование",
      desc: kk ? "Каталог, викториналар, шеберхана" : "Каталог, викторины, мастерская",
      accent: "var(--primary)",
      swatch: "#d9ebe4",
    },
    {
      group: "14-17",
      label: kk ? "14–17 жас" : "14–17 лет",
      title: kk ? "Еркіндік" : "Автономия",
      desc: kk ? "Емтиханға дайындық, эссе, кеңес" : "Подготовка к экзаменам, эссе, советы",
      accent: "#1c3a31",
      swatch: "#e4d9c2",
    },
  ];

  const quickLinks = [
    { href: `/${validLocale}/kids/stories`,   label: kk ? "Ертегілер" : "Сказки",     icon: "book" },
    { href: `/${validLocale}/kids/quizzes`,   label: kk ? "Викторина" : "Викторины",  icon: "puzzle" },
    { href: `/${validLocale}/kids/workshop`,  label: kk ? "Шеберхана" : "Мастерская", icon: "pen" },
    { href: `/${validLocale}/kids/coloring`,  label: kk ? "Бояулар"   : "Раскраски",  icon: "palette" },
    { href: `/${validLocale}/catalog`,        label: kk ? "Каталог"   : "Каталог",    icon: "shelf" },
    { href: `/${validLocale}/events`,         label: kk ? "Оқиғалар"  : "События",    icon: "calendar" },
  ];

  const features = [
    {
      title: kk ? "ИИ-кеңесші Кітапхан" : "ИИ-консультант Кітапхан",
      text: kk
        ? "Сұрақ қойыңыз — кітап ұсынамыз, үй тапсырмасын түсіндіреміз."
        : "Задайте вопрос — порекомендуем книгу, объясним домашку, поможем выбрать жанр.",
    },
    {
      title: kk ? "Дауыстық оқу" : "Озвучка сказок",
      text: kk
        ? "Кез келген кітапты тыңдауға болады: екі тілде, ыңғайлы жылдамдықта."
        : "Любую книгу можно послушать: два языка, удобный темп, детский голос.",
    },
    {
      title: kk ? "Оқу марафоны" : "Марафон чтения",
      text: kk
        ? "Жетістіктер, күнделік, жүлделер — оқу әдетке айналсын."
        : "Достижения, дневник читателя и призы — чтобы чтение стало привычкой.",
    },
  ];

  return (
    <div>
      {/* =========================================================
          HERO — editorial, без «диско-градиента»
          ========================================================= */}
      <section className="relative overflow-hidden bg-paper">
        <div className="max-w-7xl mx-auto px-4 pt-14 pb-20 md:pt-20 md:pb-28 relative">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-7">
              <div className="section-eyebrow mb-6 flex items-center gap-3">
                <span className="inline-block w-8 h-px bg-current" aria-hidden />
                {kk ? "Сәтбаев қаласы · 1970" : "Город Сатпаев · с 1970"}
              </div>
              <h1 className="display-hero text-[44px] md:text-[72px] leading-[1.02] text-foreground">
                {kk ? "Оқу әлеміне" : "Библиотека,"}
                <br />
                <span style={{ color: "var(--primary)" }}>
                  {kk ? "қош келдіңіз" : "которую"}
                </span>{" "}
                <em className="font-display italic font-normal" style={{ color: "var(--accent)" }}>
                  {kk ? "." : "любят дети."}
                </em>
              </h1>
              <p className="mt-7 text-lg md:text-xl max-w-xl" style={{ color: "var(--foreground-muted)", lineHeight: 1.55 }}>
                {kk
                  ? "Онлайн-каталог, ИИ-консультант, дауыстық көмекші, ертегілер мен викториналар — барлығы бір жерде, балалар үшін."
                  : "Онлайн-каталог, ИИ-консультант, голосовой помощник, сказки и викторины — всё в одном месте, с любовью к читателям от 6 до 17 лет."}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={`/${validLocale}/catalog`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {t(messages, "home.startReading")}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href={`/${validLocale}/about`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold border transition-all hover:bg-muted"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {t(messages, "home.exploreMore")}
                </Link>
              </div>

              {/* Метрики — в стиле газеты. Цифры тянутся из БД и site_settings:
                  library_books_total / library_readers_total можно вручную задать
                  через /admin/knowledge → tab Tone (или напрямую settings),
                  иначе показываются реальные COUNT(*). */}
              <dl className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
                {[
                  { k: stats.books, v: kk ? "кітап қорда" : "книг в фонде" },
                  { k: stats.readers, v: kk ? "белсенді оқырман" : "активных читателей" },
                  { k: stats.years, v: kk ? "жылдық тарих" : "лет истории" },
                ].map((m) => (
                  <div key={m.v}>
                    <dt className="font-display text-3xl md:text-4xl font-semibold" style={{ color: "var(--primary)" }}>{m.k}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>{m.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Правая колонка — иллюстрация + «печать» */}
            <div className="md:col-span-5 relative hidden md:block">
              <HeroIllustration kk={kk} />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          Возрастные группы — editorial index
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div
          className="rounded-[28px] p-6 md:p-8 border"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <div className="section-eyebrow mb-2">01 · {kk ? "Аудитория" : "Аудитория"}</div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold">
                {t(messages, "home.selectAge")}
              </h2>
            </div>
            <p className="text-sm max-w-sm" style={{ color: "var(--foreground-muted)" }}>
              {kk
                ? "Жасыңызды таңдаңыз — жеке каталог пен мазмұнды көрсетеміз."
                : "Выберите возраст — подберём каталог и активности под уровень читателя."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ageGroups.map((ag, i) => (
              <Link key={ag.group} href={`/${validLocale}/catalog?age=${ag.group}`} className="group block">
                <article
                  className="h-full rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: ag.swatch,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-widest" style={{ color: "var(--foreground-muted)" }}>
                      №0{i + 1}
                    </span>
                    <span
                      className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                      style={{ color: ag.accent, backgroundColor: "rgba(255,255,255,0.6)" }}
                    >
                      {ag.label}
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-2xl font-semibold text-foreground">
                    {ag.title}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--foreground-muted)" }}>
                    {ag.desc}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium" style={{ color: ag.accent }}>
                    {kk ? "Көру" : "Смотреть"}
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          Быстрые ссылки
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="section-eyebrow mb-2">02 · {kk ? "Тез өту" : "Быстрый доступ"}</div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold">
              {kk ? "Нені іздейсіз?" : "Что вам нужно сегодня?"}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <div
                className="h-full rounded-2xl p-5 text-center transition-all group-hover:-translate-y-0.5 group-hover:shadow-md"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors"
                  style={{ backgroundColor: "var(--muted)", color: "var(--primary)" }}
                >
                  <QuickLinkIcon name={link.icon} />
                </div>
                <p className="text-sm font-medium text-foreground">{link.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================
          Ближайшие события
          ========================================================= */}
      <UpcomingEventsWidget locale={validLocale} />

      {/* =========================================================
          Рекомендации книг
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="section-eyebrow mb-2">03 · {kk ? "Ұсыныс" : "Рекомендуем"}</div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold">
              {t(messages, "home.popularBooks")}
            </h2>
          </div>
          <Link
            href={`/${validLocale}/catalog`}
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
            style={{ color: "var(--primary)" }}
          >
            {t(messages, "common.viewAll")}
            <span aria-hidden>→</span>
          </Link>
        </div>
        <BookRecommendations locale={validLocale} />
      </section>

      {/* =========================================================
          Фичи — editorial trio
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 border-t" style={{ borderColor: "var(--border)" }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="p-6 md:p-8 md:border-r last:border-r-0 border-b md:border-b-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="font-mono text-xs tracking-widest mb-4"
                style={{ color: "var(--foreground-muted)" }}
              >
                {String(i + 1).padStart(2, "0")} / 03
              </div>
              <h3 className="font-display text-xl md:text-2xl font-semibold mb-3 text-foreground">
                {f.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)", lineHeight: 1.65 }}>
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          CTA — «поговорите с библиотекарем»
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 mt-16 mb-20">
        <div
          className="rounded-[28px] p-8 md:p-14 relative overflow-hidden"
          style={{ backgroundColor: "var(--primary-dark)" }}
        >
          <div className="absolute inset-0 opacity-[0.06]" aria-hidden>
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-20 left-10 w-64 h-64 rounded-full" style={{ backgroundColor: "var(--accent)", filter: "blur(80px)" }} />
          </div>

          <div className="relative grid md:grid-cols-[1fr_auto] gap-10 md:gap-8 items-center">
            <div className="max-w-2xl">
              <div className="section-eyebrow mb-5 text-white/70">
                {kk ? "ИИ-көмекші" : "ИИ-помощник"}
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-semibold text-white leading-[1.1]">
                {kk
                  ? "Кітапхан — сіздің цифрлық кітапханашыңыз."
                  : "Кітапхан — ваш цифровой библиотекарь."}
              </h2>
              <p className="mt-5 text-white/75 text-lg max-w-xl">
                {kk
                  ? "Кітапты табу, сабаққа дайындалу немесе ертегі ойлап табу — тек сұрақ қойыңыз."
                  : "Найти книгу, подготовиться к уроку или придумать сказку — просто задайте вопрос."}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span
                  className="inline-flex items-center gap-2 text-sm text-white/80 px-4 py-2 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
                  {kk ? "Төменгі оң жақтағы батырма" : "Кнопка в правом нижнем углу"}
                </span>
              </div>
            </div>

            {/* Иллюстрация совы-библиотекаря */}
            <div className="hidden md:block relative w-64 h-64 shrink-0">
              <div
                className="absolute inset-0 rounded-full overflow-hidden ring-4"
                style={{
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  // @ts-expect-error custom property
                  "--tw-ring-color": "rgba(255,255,255,0.14)",
                }}
              >
                <Image
                  src="/illustrations/ai-helper.jpg"
                  alt={kk ? "ИИ-көмекші үкі" : "ИИ-помощник в виде совы"}
                  fill
                  sizes="256px"
                  className="object-cover"
                />
              </div>
              <div
                className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase rotate-[8deg]"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                AI
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContextualHints page="home" locale={validLocale} />
    </div>
  );
}

/* =========================================================
   HERO ILLUSTRATION — детская иллюстрация + декор
   ========================================================= */
function HeroIllustration({ kk }: { kk: boolean }) {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* бумажная подложка */}
      <div
        className="absolute inset-3 rounded-[32px] rotate-[3deg]"
        style={{ backgroundColor: "#e4d9c2", border: "1px solid var(--border)" }}
        aria-hidden
      />

      {/* основная иллюстрация */}
      <div
        className="absolute inset-0 rounded-[32px] overflow-hidden -rotate-[2deg]"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <Image
          src="/illustrations/hero-reading.jpg"
          alt={kk ? "Балалар кітап оқып отыр" : "Дети читают книгу вместе"}
          fill
          sizes="(max-width: 768px) 90vw, 480px"
          className="object-cover"
          priority
        />
      </div>

      {/* круглая «печать» */}
      <div
        className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full flex items-center justify-center text-center animate-float"
        style={{
          backgroundColor: "var(--accent)",
          color: "white",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="leading-tight">
          <div className="font-display text-2xl font-semibold">55</div>
          <div className="text-[9px] tracking-widest uppercase">
            {kk ? "жыл" : "лет"}
          </div>
        </div>
      </div>

      {/* декоративный лейбл */}
      <div
        className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase rotate-[6deg] z-10"
        style={{ backgroundColor: "var(--surface)", color: "var(--primary)", border: "1px solid var(--border)" }}
      >
        {kk ? "Жаңа басылым" : "Новое издание"}
      </div>
    </div>
  );
}

/* =========================================================
   Мини-иконки для быстрых ссылок
   ========================================================= */
function QuickLinkIcon({ name }: { name: string }) {
  const common = { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;
  switch (name) {
    case "book":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case "puzzle":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a2 2 0 00-2 2v2H6a2 2 0 00-2 2v3h2a2 2 0 110 4H4v3a2 2 0 002 2h3v-2a2 2 0 114 0v2h3a2 2 0 002-2v-3h2a2 2 0 110-4h-2V9a2 2 0 00-2-2h-4V5a2 2 0 00-2-2z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.2 5.6l3.2 3.2M4 20l3.8-.8L19.5 7.5a2 2 0 000-2.8l-.4-.4a2 2 0 00-2.8 0L4.8 16.2 4 20z" />
        </svg>
      );
    case "palette":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 000 18 3 3 0 003-3 1.5 1.5 0 011.5-1.5H18A3 3 0 0021 13.5 9 9 0 0012 3z" />
          <circle cx="7.5" cy="10.5" r="1" />
          <circle cx="10.5" cy="7.5" r="1" />
          <circle cx="14.5" cy="7.5" r="1" />
          <circle cx="17" cy="10.5" r="1" />
        </svg>
      );
    case "shelf":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h4v14H4zM10 5h4v14h-4zM16 8l3-1 2 14-3 1z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3m8-3v3M4 8h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      );
    default:
      return null;
  }
}
