import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default async function AdminModerationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const items = [
    { id: 1, type: "story", content: "Сказка про космического кота...", user: "Алиса, 10 лет", status: "pending" },
    { id: 2, type: "chat", content: "Помогите найти книгу про роботов", user: "Анонимный", status: "approved" },
    { id: 3, type: "workshop", content: "Стихотворение о весне...", user: "Арман, 12 лет", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.moderation")}</h1>
      <p className="text-gray-500 text-sm">
        {validLocale === "kk" ? "ЖИ жасаған мазмұнды қарау және модерациялау" : "Просмотр и модерация контента, созданного ИИ"}
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{item.type}</Badge>
                  <Badge variant={item.status === "approved" ? "success" : "warning"}>
                    {item.status === "approved" ? (validLocale === "kk" ? "Мақұлданды" : "Одобрено") : (validLocale === "kk" ? "Күтуде" : "На проверке")}
                  </Badge>
                  <span className="text-xs text-gray-400">{item.user}</span>
                </div>
                <p className="text-sm text-gray-700">{item.content}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="primary" size="sm">{validLocale === "kk" ? "Мақұлдау" : "Одобрить"}</Button>
                <Button variant="danger" size="sm">{validLocale === "kk" ? "Қабылдамау" : "Отклонить"}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
