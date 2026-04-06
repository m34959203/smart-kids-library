import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default async function AdminEventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const events = [
    { id: 1, title: "Мастер-класс по дизайну", type: "workshop", date: "10.04.2026", status: "active" },
    { id: 2, title: "Встреча с писателем", type: "author_meeting", date: "15.04.2026", status: "active" },
    { id: 3, title: "Конкурс чтецов", type: "contest", date: "20.04.2026", status: "active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.events")}</h1>
        <Button>{validLocale === "kk" ? "Оқиға қосу" : "Добавить событие"}</Button>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-medium text-purple-900">{event.title}</h3>
                <p className="text-sm text-gray-400">{event.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">{event.type}</Badge>
              <Button variant="ghost" size="sm">{validLocale === "kk" ? "Өңдеу" : "Редактировать"}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
