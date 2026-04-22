import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const event = {
    title: validLocale === "kk" ? "Кітап шеберлік сыныбы" : "Мастер-класс по книжному дизайну",
    description: validLocale === "kk"
      ? "Өз кітабыңызды жасауды үйренеміз! Шеберлік сыныбында балалар кітап дизайнының негіздерімен танысады, өз мұқабаларын жасайды және шағын кітапшалар жасауды үйренеді."
      : "Научимся создавать свои книги! На мастер-классе дети познакомятся с основами книжного дизайна, создадут свои обложки и научатся делать маленькие книжки.",
    event_type: "workshop",
    start_date: "2026-04-10T14:00:00",
    end_date: "2026-04-10T16:00:00",
    location: validLocale === "kk" ? "Оқу залы" : "Читальный зал",
    age_group: "10-13",
    max_participants: 20,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/${validLocale}/events`} className="text-purple-500 hover:text-purple-700 text-sm mb-4 inline-block">
        &larr; {t(messages, "common.back")}
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="success" size="md">
            {t(messages, `events.${event.event_type.replace("_", "")}`) || event.event_type}
          </Badge>
          <Badge variant="purple" size="md">{event.age_group}</Badge>
        </div>

        <h1 className="text-3xl font-bold text-purple-900">{event.title}</h1>
        <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t(messages, "events.time")}</p>
              <p className="font-medium text-purple-900">{formatDate(event.start_date, validLocale)}</p>
              <p className="text-sm text-gray-600">{formatTime(event.start_date)} - {formatTime(event.end_date)}</p>
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
              <p className="font-medium text-purple-900">{event.location}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t(messages, "events.participants")}: {event.max_participants}
          </p>
          <Button size="lg">{t(messages, "events.register")}</Button>
        </div>
      </div>
    </div>
  );
}
