import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const stats = [
    { label: t(messages, "admin.totalVisits"), value: "12,547", icon: "👥", color: "from-blue-400 to-blue-600" },
    { label: t(messages, "admin.aiUsage"), value: "3,891", icon: "🤖", color: "from-purple-400 to-purple-600" },
    { label: t(messages, "admin.popularBooks"), value: "156", icon: "📚", color: "from-pink-400 to-pink-600" },
    { label: t(messages, "admin.tokensUsed"), value: "847K", icon: "🔤", color: "from-green-400 to-green-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.dashboard")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-4">
            {validLocale === "kk" ? "Соңғы ЖИ сұраулар" : "Последние AI-запросы"}
          </h2>
          <div className="space-y-3">
            {[
              { q: "Как найти книгу про космос?", time: "2 мин назад" },
              { q: "Сказка про дракона", time: "5 мин назад" },
              { q: "Подготовка к ЕНТ по литературе", time: "12 мин назад" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <span className="text-sm text-purple-700">{item.q}</span>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-4">
            {validLocale === "kk" ? "Танымал кітаптар" : "Популярные книги"}
          </h2>
          <div className="space-y-3">
            {[
              { title: "Маленький принц", reads: 234 },
              { title: "Гарри Поттер", reads: 198 },
              { title: "Абай жолы", reads: 167 },
            ].map((book, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <span className="text-sm text-purple-700">{book.title}</span>
                <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">{book.reads}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
