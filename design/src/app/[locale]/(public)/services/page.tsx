import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const services = [
    { icon: "📖", title: validLocale === "kk" ? "Онлайн оқу" : "Онлайн чтение", desc: validLocale === "kk" ? "Кітаптарды браузерден оқыңыз" : "Читайте книги прямо в браузере", href: `/${validLocale}/catalog` },
    { icon: "🤖", title: validLocale === "kk" ? "ЖИ-көмекші" : "ИИ-помощник", desc: validLocale === "kk" ? "24/7 цифрлық кітапханашы" : "Цифровой библиотекарь 24/7", href: "#" },
    { icon: "📝", title: validLocale === "kk" ? "Оқуға көмек" : "Помощь в учебе", desc: validLocale === "kk" ? "Шығармалар, конспектілер, рефераттар" : "Сочинения, конспекты, рефераты", href: "#" },
    { icon: "📖", title: validLocale === "kk" ? "Ертегі генераторы" : "Генератор сказок", desc: validLocale === "kk" ? "Жеке ертегілер жасау" : "Создание персональных сказок", href: `/${validLocale}/kids/stories` },
    { icon: "📅", title: validLocale === "kk" ? "Іс-шараларға жазылу" : "Запись на мероприятия", desc: validLocale === "kk" ? "Онлайн тіркелу" : "Онлайн регистрация", href: `/${validLocale}/events` },
    { icon: "💬", title: validLocale === "kk" ? "Кері байланыс" : "Обратная связь", desc: validLocale === "kk" ? "Ұсыныстар мен тілектер" : "Предложения и пожелания", href: `/${validLocale}/contacts` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">{t(messages, "services.title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <Link key={s.title} href={s.href}>
            <Card hoverable className="p-6 h-full">
              <span className="text-3xl">{s.icon}</span>
              <h3 className="font-bold text-purple-900 mt-3 mb-1">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
