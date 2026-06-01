import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";
import { getOne } from "@/lib/db";

interface EventRow {
  id: number;
  title_ru: string | null;
  title_kk: string | null;
  description_ru: string | null;
  description_kk: string | null;
  event_type: string;
  start_date: string | Date;
  end_date: string | Date | null;
  location: string | null;
  age_group: string | null;
  max_participants: number | null;
}

const TYPE_KEY: Record<string, string> = {
  reading: "readingType",
  workshop: "workshopType",
  author_meeting: "authorMeetingType",
  contest: "contestType",
  exhibition: "exhibitionType",
};

const toIso = (d: string | Date | null): string =>
  d instanceof Date ? d.toISOString() : typeof d === "string" ? d : "";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  const numericId = Number.parseInt(id, 10);
  const event = Number.isNaN(numericId)
    ? null
    : await getOne<EventRow>(
        `SELECT id, title_ru, title_kk, description_ru, description_kk,
                event_type, start_date, end_date, location, age_group, max_participants
           FROM events
          WHERE id = $1 AND status = 'active'`,
        [numericId]
      );
  if (!event) notFound();

  const title = (kk ? event.title_kk : event.title_ru) || event.title_ru || event.title_kk || "";
  const description =
    (kk ? event.description_kk : event.description_ru) || event.description_ru || event.description_kk || "";
  const startIso = toIso(event.start_date);
  const endIso = event.end_date ? toIso(event.end_date) : null;
  const past = new Date(endIso || startIso) < new Date();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/${validLocale}/events`} className="text-purple-500 hover:text-purple-700 text-sm mb-4 inline-block">
        &larr; {t(messages, "common.back")}
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="success" size="md">
            {t(messages, `events.${TYPE_KEY[event.event_type] ?? "readingType"}`) || event.event_type}
          </Badge>
          {event.age_group && <Badge variant="purple" size="md">{event.age_group}</Badge>}
          {past && <Badge variant="default" size="md">{kk ? "Өткен" : "Прошло"}</Badge>}
        </div>

        <h1 className="text-3xl font-bold text-purple-900">{title}</h1>
        {description && (
          <div
            className="prose max-w-none text-gray-700 leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t(messages, "events.time")}</p>
              <p className="font-medium text-purple-900">{formatDate(startIso, validLocale)}</p>
              <p className="text-sm text-gray-600">
                {formatTime(startIso, validLocale)}{endIso ? ` - ${formatTime(endIso, validLocale)}` : ""}
              </p>
            </div>
          </div>
          {event.location && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t(messages, "events.location")}</p>
                <p className="font-medium text-purple-900">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          {event.max_participants != null && (
            <p className="text-sm text-gray-500">
              {t(messages, "events.participants")}: {event.max_participants}
            </p>
          )}
          {past ? (
            <p className="text-sm font-medium text-gray-500">
              {kk ? "Бұл оқиғаға тіркелу аяқталды" : "Регистрация на это событие завершена"}
            </p>
          ) : (
            <Button size="lg">{t(messages, "events.register")}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
