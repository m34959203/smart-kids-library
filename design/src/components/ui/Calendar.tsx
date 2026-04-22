"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  date: string;
  type: string;
  title: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  locale?: string;
}

const eventColors: Record<string, string> = {
  workshop: "bg-green-400",
  author_meeting: "bg-blue-400",
  contest: "bg-orange-400",
  exhibition: "bg-purple-400",
  reading: "bg-pink-400",
};

export default function Calendar({ events = [], onDateSelect, locale = "ru" }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const monthName = currentDate.toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU", {
    month: "long",
    year: "numeric",
  });

  const dayNames = locale === "kk"
    ? ["Дс", "Сс", "Ср", "Бс", "Жм", "Сн", "Жс"]
    : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date.startsWith(dateStr));
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-12" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    days.push(
      <button
        key={day}
        onClick={() => onDateSelect?.(new Date(year, month, day))}
        className={cn(
          "h-12 rounded-xl flex flex-col items-center justify-center relative transition-all",
          "hover:bg-purple-50",
          isToday(day) && "bg-purple-500 text-white hover:bg-purple-600 font-bold"
        )}
      >
        <span className="text-sm">{day}</span>
        {dayEvents.length > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {dayEvents.slice(0, 3).map((e, i) => (
              <div
                key={i}
                className={cn("w-1.5 h-1.5 rounded-full", eventColors[e.type] ?? "bg-gray-400")}
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-purple-50 rounded-xl transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="font-bold text-purple-900 capitalize">{monthName}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-purple-50 rounded-xl transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-gray-500 py-1">
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{days}</div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {Object.entries(eventColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", color)} />
            <span className="text-gray-600 capitalize">{type.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
