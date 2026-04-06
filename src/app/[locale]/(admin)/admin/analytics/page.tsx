import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";

export default async function AdminAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const metrics = [
    { label: validLocale === "kk" ? "Бүгінгі кірулер" : "Посещений сегодня", value: "342" },
    { label: validLocale === "kk" ? "Белсенді оқырмандар" : "Активных читателей", value: "89" },
    { label: validLocale === "kk" ? "ЖИ сұраулар (бүгін)" : "AI-запросов (сегодня)", value: "127" },
    { label: validLocale === "kk" ? "Токендер (бүгін)" : "Токенов (сегодня)", value: "45,230" },
  ];

  const dailyStats = [
    { day: validLocale === "kk" ? "Дс" : "Пн", visits: 280, ai: 95 },
    { day: validLocale === "kk" ? "Сс" : "Вт", visits: 310, ai: 112 },
    { day: validLocale === "kk" ? "Ср" : "Ср", visits: 295, ai: 98 },
    { day: validLocale === "kk" ? "Бс" : "Чт", visits: 340, ai: 130 },
    { day: validLocale === "kk" ? "Жм" : "Пт", visits: 380, ai: 145 },
    { day: validLocale === "kk" ? "Сн" : "Сб", visits: 220, ai: 78 },
    { day: validLocale === "kk" ? "Жс" : "Вс", visits: 180, ai: 60 },
  ];

  const maxVisits = Math.max(...dailyStats.map((d) => d.visits));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.analytics")}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4 text-center">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{m.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-purple-900 mb-4">
          {validLocale === "kk" ? "Апталық статистика" : "Статистика за неделю"}
        </h2>
        <div className="flex items-end gap-2 h-48">
          {dailyStats.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5" style={{ height: `${(d.visits / maxVisits) * 100}%` }}>
                <div className="flex-1 bg-purple-400 rounded-t-lg" />
                <div style={{ height: `${(d.ai / d.visits) * 100}%` }} className="bg-pink-400 rounded-b-lg" />
              </div>
              <span className="text-xs text-gray-500">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-400 rounded" />{validLocale === "kk" ? "Кірулер" : "Посещения"}</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-pink-400 rounded" />{validLocale === "kk" ? "ЖИ сұраулар" : "AI-запросы"}</div>
        </div>
      </Card>
    </div>
  );
}
