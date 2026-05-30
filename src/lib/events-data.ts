/**
 * Демо-события афиши. Таблица `events` в БД сейчас пустая (count=0), поэтому
 * витрина работает на этом общем источнике — и список (EventCalendar), и
 * детальная страница читают отсюда, чтобы данные совпадали.
 *
 * TODO (follow-up): засидить таблицу `events` и переключить чтение на БД
 * (`getMany`/`getOne`, GET /api/events уже умеет ?id= и ?upcoming=true).
 */

export interface LibEvent {
  id: number;
  type: "reading" | "contest" | "author_meeting" | "workshop" | "exhibition";
  /** Дата начала, YYYY-MM-DD */
  date: string;
  /** Время начала, HH:MM */
  time: string;
  /** Время окончания, HH:MM (опционально) */
  endTime?: string;
  age: "6-9" | "10-13" | "14-17" | "all";
  maxParticipants?: number;
  title_ru: string;
  title_kk: string;
  location_ru: string;
  location_kk: string;
  description_ru: string;
  description_kk: string;
}

export const DEMO_EVENTS: LibEvent[] = [
  {
    id: 1,
    type: "reading",
    date: "2026-05-09",
    time: "11:00",
    endTime: "12:00",
    age: "6-9",
    maxParticipants: 25,
    title_ru: "Час сказок",
    title_kk: "Ертегілер сағаты",
    location_ru: "Читальный зал",
    location_kk: "Оқу залы",
    description_ru:
      "Громкое чтение любимых сказок для самых маленьких. Слушаем, обсуждаем и рисуем героев вместе с библиотекарем.",
    description_kk:
      "Кішкентайларға арналған сүйікті ертегілерді дауыстап оқу. Кітапханашымен бірге кейіпкерлерді талқылап, суретін саламыз.",
  },
  {
    id: 2,
    type: "contest",
    date: "2026-05-14",
    time: "14:00",
    endTime: "16:00",
    age: "10-13",
    maxParticipants: 30,
    title_ru: "Конкурс чтецов",
    title_kk: "Кітап байқауы",
    location_ru: "Актовый зал",
    location_kk: "Акт залы",
    description_ru:
      "Конкурс выразительного чтения стихов и прозы. Победителей ждут призы и грамоты от библиотеки.",
    description_kk:
      "Өлең мен прозаны мәнерлеп оқу байқауы. Жеңімпаздарды кітапхананың сыйлықтары мен грамоталары күтеді.",
  },
  {
    id: 3,
    type: "author_meeting",
    date: "2026-05-18",
    time: "15:00",
    endTime: "16:30",
    age: "14-17",
    maxParticipants: 40,
    title_ru: "Встреча с писателем",
    title_kk: "Жазушымен кездесу",
    location_ru: "Конференц-зал",
    location_kk: "Конференц-зал",
    description_ru:
      "Живая встреча с современным казахстанским писателем: вопросы, автографы и разговор о том, как рождаются книги.",
    description_kk:
      "Қазіргі қазақстандық жазушымен тірі кездесу: сұрақтар, автографтар және кітаптардың қалай дүниеге келетіні туралы әңгіме.",
  },
  {
    id: 4,
    type: "workshop",
    date: "2026-05-22",
    time: "13:00",
    endTime: "15:00",
    age: "6-9",
    maxParticipants: 20,
    title_ru: "Мастерская рисунка",
    title_kk: "Сурет шеберханасы",
    location_ru: "Творческая студия",
    location_kk: "Шығармашылық студия",
    description_ru:
      "Иллюстрируем любимые книги! Дети научатся создавать персонажей и оформлять собственные мини-книжки.",
    description_kk:
      "Сүйікті кітаптарды суреттейміз! Балалар кейіпкерлер жасап, өз шағын кітапшаларын безендіруді үйренеді.",
  },
  {
    id: 5,
    type: "exhibition",
    date: "2026-05-31",
    time: "10:00",
    endTime: "18:00",
    age: "all",
    maxParticipants: 100,
    title_ru: "Книжная выставка",
    title_kk: "Кітап көрмесі",
    location_ru: "Главный холл",
    location_kk: "Басты холл",
    description_ru:
      "Большая выставка новинок и редких изданий из фонда библиотеки. Вход свободный для всех возрастов.",
    description_kk:
      "Кітапхана қорынан жаңа және сирек басылымдардың үлкен көрмесі. Кіру барлық жасқа тегін.",
  },
];

/** Событие прошло, если его дата окончания (или начала) раньше «сейчас». */
export function isEventPast(e: LibEvent, now: Date = new Date()): boolean {
  const end = e.endTime ?? e.time;
  return new Date(`${e.date}T${end}:00`) < now;
}

export function getDemoEvent(id: number): LibEvent | null {
  return DEMO_EVENTS.find((e) => e.id === id) ?? null;
}

/** Локализованный заголовок/описание/место по локали с каскадом на ru. */
export function localizeEvent(e: LibEvent, locale: string) {
  const kk = locale === "kk";
  return {
    title: (kk ? e.title_kk : e.title_ru) || e.title_ru,
    description: (kk ? e.description_kk : e.description_ru) || e.description_ru,
    location: (kk ? e.location_kk : e.location_ru) || e.location_ru,
  };
}
