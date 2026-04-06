import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const resources = [
    { icon: "📚", title: validLocale === "kk" ? "Электронды кітапхана" : "Электронная библиотека", desc: validLocale === "kk" ? "15 000+ кітап онлайн" : "15 000+ книг онлайн", href: `/${validLocale}/catalog` },
    { icon: "🎓", title: validLocale === "kk" ? "Оқу материалдары" : "Учебные материалы", desc: validLocale === "kk" ? "Мектеп бағдарламасы бойынша" : "По школьной программе", href: "#" },
    { icon: "🤖", title: validLocale === "kk" ? "ЖИ-көмекші" : "ИИ-помощник", desc: validLocale === "kk" ? "Оқу мен шығармашылыққа көмек" : "Помощь в учебе и творчестве", href: "#" },
    { icon: "📰", title: validLocale === "kk" ? "Ғылыми журналдар" : "Научные журналы", desc: validLocale === "kk" ? "Балаларға арналған ғылыми басылымдар" : "Научные издания для детей", href: "#" },
    { icon: "🎧", title: validLocale === "kk" ? "Аудио кітаптар" : "Аудиокниги", desc: validLocale === "kk" ? "Тыңдауға болатын кітаптар" : "Книги для прослушивания", href: "#" },
    { icon: "🌐", title: validLocale === "kk" ? "Сыртқы ресурстар" : "Внешние ресурсы", desc: validLocale === "kk" ? "Пайдалы сілтемелер" : "Полезные ссылки", href: "#" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">{t(messages, "resources.title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((r) => (
          <Link key={r.title} href={r.href}>
            <Card hoverable className="p-6 h-full text-center">
              <span className="text-4xl">{r.icon}</span>
              <h3 className="font-bold text-purple-900 mt-3 mb-1">{r.title}</h3>
              <p className="text-sm text-gray-500">{r.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
