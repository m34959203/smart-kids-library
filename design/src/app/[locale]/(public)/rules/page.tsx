import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";

export default async function RulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const rules = validLocale === "kk"
    ? [
        "Кітапханаға кіру тегін.",
        "Кітаптарды абайлап ұстаңыз.",
        "Кітаптарды уақытында қайтарыңыз (14 күн ішінде).",
        "Оқу залында тыныштық сақтаңыз.",
        "Электрондық ресурстарды тек кітапхана шеңберінде пайдаланыңыз.",
        "Кітапханашылардың нұсқауларын орындаңыз.",
        "Басқа оқырмандарды құрметтеңіз.",
      ]
    : [
        "Вход в библиотеку бесплатный.",
        "Обращайтесь с книгами бережно.",
        "Возвращайте книги в срок (14 дней).",
        "Соблюдайте тишину в читальном зале.",
        "Используйте электронные ресурсы в рамках библиотеки.",
        "Выполняйте указания библиотекарей.",
        "Уважайте других читателей.",
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">{t(messages, "rules.title")}</h1>
      <Card className="p-6 md:p-8">
        <ol className="space-y-4">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </span>
              <p className="text-gray-700 pt-1">{rule}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
