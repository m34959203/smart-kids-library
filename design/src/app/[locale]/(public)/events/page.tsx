import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import EventCalendar from "@/components/features/EventCalendar";
import ContextualHints from "@/components/features/ContextualHints";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  const sampleEvents = [
    {
      id: 1,
      title: kk ? "Кітап шеберлік сыныбы" : "Мастер-класс по книжному дизайну",
      description: kk ? "Өз кітабыңызды жасауды үйренеміз!" : "Научимся создавать свои книги!",
      event_type: "workshop",
      start_date: "2026-04-10T14:00:00",
      location: kk ? "Оқу залы" : "Читальный зал",
      age_group: "10-13",
    },
    {
      id: 2,
      title: kk ? "Жазушымен кездесу" : "Встреча с детским писателем",
      description: kk ? "Танымал балалар жазушысымен кездесу." : "Встреча с популярным детским автором.",
      event_type: "author_meeting",
      start_date: "2026-04-15T16:00:00",
      location: kk ? "Конференц-зал" : "Конференц-зал",
      age_group: "all",
    },
    {
      id: 3,
      title: kk ? "Оқу конкурсы" : "Конкурс чтецов",
      description: kk ? "Ең жақсы оқырман атағы үшін жарысыңыз!" : "Соревнуйтесь за звание лучшего чтеца!",
      event_type: "contest",
      start_date: "2026-04-20T15:00:00",
      location: kk ? "Үлкен зал" : "Большой зал",
      age_group: "14-17",
    },
    {
      id: 4,
      title: kk ? "Сурет көрмесі" : "Выставка иллюстраций",
      description: kk ? "Балалардың кітап суреттері көрмесі." : "Выставка детских книжных иллюстраций.",
      event_type: "exhibition",
      start_date: "2026-04-08T10:00:00",
      end_date: "2026-04-25T18:00:00",
      location: kk ? "Көрме залы" : "Выставочный зал",
      age_group: "6-9",
    },
  ];

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

      <EventCalendar events={sampleEvents} locale={validLocale} />
      <ContextualHints page="events" locale={validLocale} />
    </div>
  );
}
