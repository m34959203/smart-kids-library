import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";
import { getDemoEvent, isEventPast, localizeEvent } from "@/lib/events-data";

const TYPE_KEY: Record<string, string> = {
  reading: "readingType",
  workshop: "workshopType",
  author_meeting: "authorMeetingType",
  contest: "contestType",
  exhibition: "exhibitionType",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const numericId = Number.parseInt(id, 10);
  const event = Number.isNaN(numericId) ? null : getDemoEvent(numericId);
  if (!event) notFound();

  const { title, description, location } = localizeEvent(event, validLocale);
  const past = isEventPast(event);
  const startIso = `${event.date}T${event.time}:00`;
  const endIso = event.endTime ? `${event.date}T${event.endTime}:00` : null;

  const kk = validLocale === "kk";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/${validLocale}/events`} className="text-purple-500 hover:text-purple-700 text-sm mb-4 inline-block">
        &larr; {t(messages, "common.back")}
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="success" size="md">
            {t(messages, `events.${TYPE_KEY[event.type] ?? "readingType"}`) || event.type}
          </Badge>
          <Badge variant="purple" size="md">{event.age}</Badge>
          {past && (
            <Badge variant="default" size="md">{kk ? "Өткен" : "Прошло"}</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold text-purple-900">{title}</h1>
        <p className="text-gray-700 leading-relaxed text-lg">{description}</p>

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
                {formatTime(startIso)}{endIso ? ` - ${formatTime(endIso)}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t(messages, "events.location")}</p>
              <p className="font-medium text-purple-900">{location}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-500">
            {t(messages, "events.participants")}: {event.maxParticipants ?? "—"}
          </p>
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
