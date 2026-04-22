"use client";

import { useState } from "react";
import Calendar from "@/components/ui/Calendar";
import EventCard from "./EventCard";

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location: string;
  age_group: string;
  image_url?: string;
}

interface EventCalendarProps {
  events: Event[];
  locale: string;
}

export default function EventCalendar({ events, locale }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterAge, setFilterAge] = useState<string>("");

  const calendarEvents = events.map((e) => ({
    date: e.start_date,
    type: e.event_type,
    title: e.title,
  }));

  const filteredEvents = events.filter((e) => {
    if (filterType && e.event_type !== filterType) return false;
    if (filterAge && e.age_group !== filterAge) return false;
    if (selectedDate) {
      const eventDate = new Date(e.start_date).toDateString();
      if (eventDate !== selectedDate.toDateString()) return false;
    }
    return true;
  });

  const eventTypes = [
    { value: "workshop", label: locale === "kk" ? "Шеберлік сыныбы" : "Мастер-класс", color: "bg-green-100 text-green-700" },
    { value: "author_meeting", label: locale === "kk" ? "Автормен кездесу" : "Встреча с автором", color: "bg-blue-100 text-blue-700" },
    { value: "contest", label: locale === "kk" ? "Конкурс" : "Конкурс", color: "bg-orange-100 text-orange-700" },
    { value: "exhibition", label: locale === "kk" ? "Көрме" : "Выставка", color: "bg-purple-100 text-purple-700" },
    { value: "reading", label: locale === "kk" ? "Оқу" : "Чтение", color: "bg-pink-100 text-pink-700" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Calendar
          events={calendarEvents}
          onDateSelect={(d) => setSelectedDate(selectedDate?.toDateString() === d.toDateString() ? null : d)}
          locale={locale}
        />

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 space-y-3">
          <h3 className="font-bold text-purple-900 text-sm">
            {locale === "kk" ? "Сүзгілер" : "Фильтры"}
          </h3>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">{locale === "kk" ? "Түр бойынша" : "По типу"}</p>
            <div className="flex flex-wrap gap-1">
              {eventTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilterType(filterType === t.value ? "" : t.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterType === t.value ? t.color + " ring-2 ring-offset-1" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">{locale === "kk" ? "Жас бойынша" : "По возрасту"}</p>
            <div className="flex gap-1">
              {["6-9", "10-13", "14-17"].map((age) => (
                <button
                  key={age}
                  onClick={() => setFilterAge(filterAge === age ? "" : age)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterAge === age ? "bg-purple-100 text-purple-700 ring-2 ring-offset-1" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selectedDate && (
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <span>
              {selectedDate.toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </span>
            <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">
              &times;
            </button>
          </div>
        )}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {locale === "kk" ? "Оқиғалар табылмады" : "События не найдены"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
