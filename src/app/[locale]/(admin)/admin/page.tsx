import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import { getOne, getMany } from "@/lib/db";

// Реальные данные дашборда. Каждый запрос обёрнут в safe(): при отсутствии
// таблицы/ошибке возвращаем дефолт, чтобы дашборд не падал на свежей БД.
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function formatNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "kk" ? "kk-KZ" : "ru-RU").format(n);
}

function timeAgo(iso: string | Date, kk: boolean): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return kk ? "жаңа ғана" : "только что";
  const min = Math.floor(sec / 60);
  if (min < 60) return kk ? `${min} мин бұрын` : `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return kk ? `${hr} сағ бұрын` : `${hr} ч назад`;
  const day = Math.floor(hr / 24);
  return kk ? `${day} күн бұрын` : `${day} дн назад`;
}

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  // --- Метрики (реальные) ---
  const [booksRow, visitsRow, aiRow, costRow] = await Promise.all([
    safe(getOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM books"), null),
    // visits — одна строка на визит (нет колонки count), считаем COUNT(*)
    safe(
      getOne<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM visits WHERE date >= CURRENT_DATE - 30"
      ),
      null
    ),
    safe(
      getOne<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM ai_generations WHERE created_at >= NOW() - INTERVAL '30 days'"
      ),
      null
    ),
    safe(
      getOne<{ sum: string }>(
        "SELECT COALESCE(SUM(cost_usd),0)::text AS sum FROM ai_generations WHERE created_at >= CURRENT_DATE"
      ),
      null
    ),
  ]);

  const booksCount = parseInt(booksRow?.count ?? "0", 10) || 0;
  const visits30 = parseInt(visitsRow?.count ?? "0", 10) || 0;
  const ai30 = parseInt(aiRow?.count ?? "0", 10) || 0;
  const costToday = parseFloat(costRow?.sum ?? "0") || 0;

  const stats = [
    {
      label: kk ? "Каталогтағы кітаптар" : "Книг в каталоге",
      value: formatNumber(booksCount, validLocale),
      icon: "📚",
      color: "from-blue-400 to-blue-600",
    },
    {
      label: kk ? "Кірулер (30 күн)" : "Посещений (30 дн)",
      value: formatNumber(visits30, validLocale),
      icon: "👥",
      color: "from-purple-400 to-purple-600",
    },
    {
      label: kk ? "ЖИ сұраулар (30 күн)" : "AI-запросов (30 дн)",
      value: formatNumber(ai30, validLocale),
      icon: "🤖",
      color: "from-pink-400 to-pink-600",
    },
    {
      label: kk ? "ЖИ шығыны (бүгін)" : "Расход ИИ (сегодня)",
      value: `$${costToday.toFixed(2)}`,
      icon: "💸",
      color: "from-green-400 to-green-600",
    },
  ];

  // --- Последние AI-запросы (реальные, из chatbot_logs) ---
  const recentChats = await safe(
    getMany<{ user_message: string; created_at: string | Date }>(
      `SELECT user_message, created_at FROM chatbot_logs
       ORDER BY created_at DESC LIMIT 5`
    ),
    []
  );

  // --- Популярные книги (реальные, по прогрессу чтения) ---
  const popularBooks = await safe(
    getMany<{ title: string; reads: string }>(
      `SELECT COALESCE(b.title_ru, b.title_kk, b.title) AS title,
              COUNT(*)::text AS reads
       FROM reading_progress rp
       JOIN books b ON b.id = rp.book_id
       GROUP BY b.id, b.title_ru, b.title_kk, b.title
       ORDER BY COUNT(*) DESC LIMIT 5`
    ),
    []
  );

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
            {kk ? "Соңғы ЖИ сұраулар" : "Последние AI-запросы"}
          </h2>
          {recentChats.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              {kk ? "Әзірге сұраулар жоқ" : "Запросов пока нет"}
            </p>
          ) : (
            <div className="space-y-3">
              {recentChats.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 bg-purple-50 rounded-xl">
                  <span className="text-sm text-purple-700 truncate">{item.user_message}</span>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.created_at, kk)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-4">
            {kk ? "Танымал кітаптар" : "Популярные книги"}
          </h2>
          {popularBooks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              {kk ? "Оқу статистикасы әзірге жоқ" : "Статистики чтения пока нет"}
            </p>
          ) : (
            <div className="space-y-3">
              {popularBooks.map((book, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 bg-purple-50 rounded-xl">
                  <span className="text-sm text-purple-700 truncate">{book.title}</span>
                  <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                    {book.reads}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
