import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import Link from "next/link";
import BookRecommendations from "@/components/features/BookRecommendations";
import ContextualHints from "@/components/features/ContextualHints";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const ageGroups = [
    {
      group: "6-9",
      emoji: "🌈",
      color: "from-orange-400 to-yellow-400",
      label: validLocale === "kk" ? "6-9 жас" : "6-9 лет",
      desc: validLocale === "kk" ? "Ертегілер, бояулар, ойындар" : "Сказки, раскраски, игры",
    },
    {
      group: "10-13",
      emoji: "🚀",
      color: "from-blue-400 to-cyan-400",
      label: validLocale === "kk" ? "10-13 жас" : "10-13 лет",
      desc: validLocale === "kk" ? "Каталог, викториналар, шеберхана" : "Каталог, викторины, мастерская",
    },
    {
      group: "14-17",
      emoji: "🎓",
      color: "from-purple-500 to-pink-500",
      label: validLocale === "kk" ? "14-17 жас" : "14-17 лет",
      desc: validLocale === "kk" ? "Емтиханға дайындық, шығармалар" : "Подготовка к экзаменам, сочинения",
    },
  ];

  const quickLinks = [
    { href: `/${validLocale}/kids/stories`, icon: "📖", label: validLocale === "kk" ? "Ертегілер" : "Сказки" },
    { href: `/${validLocale}/kids/quizzes`, icon: "🧠", label: validLocale === "kk" ? "Викторина" : "Викторины" },
    { href: `/${validLocale}/kids/workshop`, icon: "✍️", label: validLocale === "kk" ? "Шеберхана" : "Мастерская" },
    { href: `/${validLocale}/kids/coloring`, icon: "🎨", label: validLocale === "kk" ? "Бояулар" : "Раскраски" },
    { href: `/${validLocale}/catalog`, icon: "📚", label: validLocale === "kk" ? "Каталог" : "Каталог" },
    { href: `/${validLocale}/events`, icon: "📅", label: validLocale === "kk" ? "Оқиғалар" : "События" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-float" />
          <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-white rounded-full animate-float" style={{ animationDelay: "2s" }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              {t(messages, "home.hero")}
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8">
              {t(messages, "home.heroSubtitle")}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href={`/${validLocale}/catalog`}
                className="px-6 py-3 bg-white text-purple-600 rounded-2xl font-bold hover:shadow-xl transition-all"
              >
                {t(messages, "home.startReading")}
              </Link>
              <Link
                href={`/${validLocale}/about`}
                className="px-6 py-3 bg-white/20 text-white rounded-2xl font-bold hover:bg-white/30 transition-all"
              >
                {t(messages, "home.exploreMore")}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fefce8] to-transparent" />
      </section>

      {/* Age Group Selection */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <h2 className="text-center text-lg font-bold text-purple-900 mb-4">
          {t(messages, "home.selectAge")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ageGroups.map((ag) => (
            <Link key={ag.group} href={`/${validLocale}/catalog?age=${ag.group}`}>
              <div className={`bg-gradient-to-br ${ag.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all`}>
                <span className="text-4xl">{ag.emoji}</span>
                <h3 className="text-xl font-bold mt-2">{ag.label}</h3>
                <p className="text-sm text-white/80 mt-1">{ag.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <span className="text-3xl">{link.icon}</span>
                <p className="text-xs font-medium text-purple-700 mt-2">{link.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Book Recommendations */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-purple-900">
            {t(messages, "home.popularBooks")}
          </h2>
          <Link href={`/${validLocale}/catalog`} className="text-sm text-purple-500 hover:text-purple-700 font-medium">
            {t(messages, "common.viewAll")} &rarr;
          </Link>
        </div>
        <BookRecommendations locale={validLocale} />
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 mt-12 mb-12">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mb-4">
            {validLocale === "kk" ? "Цифрлық кітапханашыңызбен сөйлесіңіз!" : "Поговорите с цифровым библиотекарем!"}
          </h2>
          <p className="text-purple-600 mb-6 max-w-xl mx-auto">
            {validLocale === "kk"
              ? "Кітапхан - біздің ЖИ-көмекші, кітап іздеуге, оқуға және шығармашылыққа көмектеседі."
              : "Кітапхан — наш ИИ-помощник, который поможет найти книгу, подготовиться к уроку и развить творчество."
            }
          </p>
          <p className="text-sm text-purple-400">
            {validLocale === "kk" ? "Төменгі оң жақтағы батырманы басыңыз" : "Нажмите на кнопку в правом нижнем углу"}
          </p>
        </div>
      </section>

      <ContextualHints page="home" locale={validLocale} />
    </div>
  );
}
