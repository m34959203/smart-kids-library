import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function AdminKnowledgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const entries = [
    { id: 1, category: "general", question: "Как записаться в библиотеку?", language: "ru" },
    { id: 2, category: "general", question: "Кітапханаға қалай жазылуға болады?", language: "kk" },
    { id: 3, category: "services", question: "Как продлить книгу?", language: "ru" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.knowledge")}</h1>
        <Button>{validLocale === "kk" ? "Жазба қосу" : "Добавить запись"}</Button>
      </div>
      <p className="text-gray-500 text-sm">
        {validLocale === "kk" ? "ЖИ-көмекшінің білім базасын басқару. Бұл жауаптар токен лимиті аяқталғанда пайдаланылады." : "Управление базой знаний ИИ-помощника. Эти ответы используются при исчерпании лимита токенов."}
      </p>
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mr-2">{entry.category}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mr-2">{entry.language.toUpperCase()}</span>
              <p className="font-medium text-purple-900 mt-1">{entry.question}</p>
            </div>
            <Button variant="ghost" size="sm">{validLocale === "kk" ? "Өңдеу" : "Редактировать"}</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
