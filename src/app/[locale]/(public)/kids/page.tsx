import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import Card from "@/components/ui/Card";
import ContextualHints from "@/components/features/ContextualHints";

export default async function KidsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const sections = [
    {
      href: `/${validLocale}/kids/stories`,
      icon: "📖",
      title: t(messages, "kids.stories"),
      desc: t(messages, "kids.storiesDesc"),
      gradient: "from-purple-400 to-indigo-400",
    },
    {
      href: `/${validLocale}/kids/quizzes`,
      icon: "🧠",
      title: t(messages, "kids.quizzes"),
      desc: t(messages, "kids.quizzesDesc"),
      gradient: "from-blue-400 to-cyan-400",
    },
    {
      href: `/${validLocale}/kids/workshop`,
      icon: "✍️",
      title: t(messages, "kids.workshop"),
      desc: t(messages, "kids.workshopDesc"),
      gradient: "from-pink-400 to-rose-400",
    },
    {
      href: `/${validLocale}/kids/coloring`,
      icon: "🎨",
      title: t(messages, "kids.coloring"),
      desc: t(messages, "kids.coloringDesc"),
      gradient: "from-orange-400 to-yellow-400",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-purple-900 mb-2">{t(messages, "kids.title")}</h1>
        <p className="text-gray-500 text-lg">
          {validLocale === "kk" ? "Ойна, оқы, жаса!" : "Играй, читай, создавай!"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card hoverable className="h-full">
              <div className={`bg-gradient-to-br ${section.gradient} p-8 text-white text-center`}>
                <span className="text-6xl">{section.icon}</span>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-purple-900 mb-2">{section.title}</h2>
                <p className="text-gray-500">{section.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <ContextualHints page="kids" locale={validLocale} />
    </div>
  );
}
