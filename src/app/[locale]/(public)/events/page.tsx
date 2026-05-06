import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import EventCalendar from "@/components/features/EventCalendar";
import ContextualHints from "@/components/features/ContextualHints";
import { getMany } from "@/lib/db";

interface EventRow {
  id: number;
  title_ru: string;
  title_kk: string | null;
  description_ru: string | null;
  description_kk: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  age_group: string | null;
}

async function loadEvents(): Promise<EventRow[]> {
  try {
    return await getMany<EventRow>(
      `SELECT id, title_ru, title_kk, description_ru, description_kk,
              event_type, start_date, end_date, location, age_group
         FROM events
        WHERE status = 'active' AND start_date >= NOW() - INTERVAL '60 days'
        ORDER BY start_date ASC
        LIMIT 200`
    );
  } catch {
    return [];
  }
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  const rows = await loadEvents();
  // pg-driver возвращает TIMESTAMPTZ как Date object. Нужно явно
  // сериализовать в ISO-строку, иначе в client-component Calendar
  // упадёт `e.date.startsWith is not a function` (Date object не имеет
  // startsWith). RSC props НЕ всегда сериализуются для cousin-client-компонентов.
  const toIso = (d: unknown): string =>
    d instanceof Date ? d.toISOString() : (typeof d === "string" ? d : "");
  const events = rows.map((r) => ({
    id: r.id,
    title: (kk ? r.title_kk : r.title_ru) || r.title_ru || r.title_kk || "",
    description: (kk ? r.description_kk : r.description_ru) || r.description_ru || r.description_kk || "",
    event_type: r.event_type,
    start_date: toIso(r.start_date),
    end_date: r.end_date ? toIso(r.end_date) : undefined,
    location: r.location ?? "",
    age_group: r.age_group ?? "all",
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-14">
      <header className="mb-10 md:mb-12">
        <div className="section-eyebrow mb-4 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "Күнтізбе" : "Афиша"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[60px] leading-[1.02]">
          {t(messages, "events.title")}
        </h1>
      </header>

      {events.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          {kk ? "Жоспарланған шаралар әзірге жоқ." : "Запланированных событий пока нет."}
        </p>
      ) : (
        <EventCalendar events={events} locale={validLocale} />
      )}
      <ContextualHints page="events" locale={validLocale} />
    </div>
  );
}
