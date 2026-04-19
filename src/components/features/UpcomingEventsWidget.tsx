import Link from "next/link";
import { getMany } from "@/lib/db";
import { getEventTypeColor } from "@/lib/utils";

interface EventRow {
  id: number;
  title_ru: string;
  title_kk: string | null;
  event_type: string;
  start_date: string;
  location: string | null;
  age_group: string;
}

/**
 * Server component: fetches next upcoming events and renders them as a
 * compact widget with countdown. Safe to embed on the home page.
 */
export default async function UpcomingEventsWidget({
  locale,
  limit = 4,
}: {
  locale: string;
  limit?: number;
}) {
  const kk = locale === "kk";
  let events: EventRow[] = [];
  try {
    events = await getMany<EventRow>(
      `SELECT id, title_ru, title_kk, event_type, start_date, location, age_group
       FROM events
       WHERE status = 'active' AND start_date >= NOW()
       ORDER BY start_date ASC
       LIMIT $1`,
      [limit]
    );
  } catch {
    events = [];
  }

  if (events.length === 0) return null;

  // Server component: Date.now() is evaluated once per request, not during re-render.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const typeLabel: Record<string, { ru: string; kk: string }> = {
    workshop: { ru: "Мастер-класс", kk: "Шеберлік" },
    author_meeting: { ru: "Встреча", kk: "Кездесу" },
    contest: { ru: "Конкурс", kk: "Конкурс" },
    exhibition: { ru: "Выставка", kk: "Көрме" },
    reading: { ru: "Чтение", kk: "Оқу" },
  };

  return (
    <section className="max-w-7xl mx-auto px-4 mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-purple-900">
          {kk ? "Жақын іс-шаралар" : "Ближайшие события"}
        </h2>
        <Link href={`/${locale}/events`} className="text-sm text-purple-500 hover:text-purple-700 font-medium">
          {kk ? "Барлығы" : "Все события"} →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {events.map((ev) => {
          const date = new Date(ev.start_date);
          const title = kk && ev.title_kk ? ev.title_kk : ev.title_ru;
          const dayFmt = date.toLocaleDateString(kk ? "kk-KZ" : "ru-RU", {
            day: "numeric",
            month: "short",
          });
          const timeFmt = date.toLocaleTimeString(kk ? "kk-KZ" : "ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const msLeft = date.getTime() - now;
          const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

          return (
            <Link
              key={ev.id}
              href={`/${locale}/events/${ev.id}`}
              className="group"
            >
              <article className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-purple-50 p-4 h-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold text-white rounded-full ${getEventTypeColor(ev.event_type)}`}
                  >
                    {typeLabel[ev.event_type]?.[kk ? "kk" : "ru"] ?? ev.event_type}
                  </span>
                  {daysLeft <= 14 && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      {daysLeft === 0
                        ? kk ? "Бүгін" : "Сегодня"
                        : daysLeft === 1
                        ? kk ? "Ертең" : "Завтра"
                        : kk
                        ? `${daysLeft} күн қалды`
                        : `через ${daysLeft} дн.`}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-purple-900 text-sm line-clamp-2 group-hover:text-purple-700">{title}</h3>
                <p className="text-xs text-gray-500 mt-2">
                  {dayFmt} · {timeFmt}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
                {ev.age_group && ev.age_group !== "all" && (
                  <span className="inline-block mt-2 text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                    {ev.age_group}
                  </span>
                )}
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
