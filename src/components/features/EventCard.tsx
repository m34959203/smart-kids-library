"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { cn, getEventTypeColor } from "@/lib/utils";

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

interface EventCardProps {
  event: Event;
  locale: string;
  compact?: boolean;
}

export default function EventCard({ event, locale, compact = false }: EventCardProps) {
  const date = new Date(event.start_date);
  const day = date.getDate();
  const month = date.toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU", { month: "short" });
  const time = date.toLocaleTimeString(locale === "kk" ? "kk-KZ" : "ru-RU", { hour: "2-digit", minute: "2-digit" });

  const [daysLeft, setDaysLeft] = useState(0);
  useEffect(() => {
    setDaysLeft(Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [date]);

  const typeLabels: Record<string, Record<string, string>> = {
    workshop: { ru: "Мастер-класс", kk: "Шеберлік сыныбы" },
    author_meeting: { ru: "Встреча с автором", kk: "Автормен кездесу" },
    contest: { ru: "Конкурс", kk: "Конкурс" },
    exhibition: { ru: "Выставка", kk: "Көрме" },
    reading: { ru: "Чтение", kk: "Оқу" },
  };

  const typeBadgeVariants: Record<string, "success" | "info" | "warning" | "purple" | "pink"> = {
    workshop: "success",
    author_meeting: "info",
    contest: "warning",
    exhibition: "purple",
    reading: "pink",
  };

  if (compact) {
    return (
      <Link href={`/${locale}/events/${event.id}`}>
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 transition-colors">
          <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold", getEventTypeColor(event.event_type))}>
            <span className="text-lg leading-none">{day}</span>
            <span className="uppercase text-[9px]">{month}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-purple-900 truncate">{event.title}</p>
            <p className="text-xs text-gray-500">{time} | {event.location}</p>
          </div>
          {daysLeft > 0 && daysLeft <= 7 && (
            <span className="text-xs text-orange-500 font-medium whitespace-nowrap">
              {daysLeft} {locale === "kk" ? "күн" : "дн."}
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/${locale}/events/${event.id}`}>
      <Card hoverable className="flex gap-4 p-4">
        <div className={cn("w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold shrink-0", getEventTypeColor(event.event_type))}>
          <span className="text-2xl leading-none">{day}</span>
          <span className="uppercase text-xs">{month}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-purple-900">{event.title}</h3>
            {daysLeft > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                {daysLeft} {locale === "kk" ? "күн қалды" : "дн. осталось"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={typeBadgeVariants[event.event_type] ?? "default"} size="sm">
              {typeLabels[event.event_type]?.[locale] ?? event.event_type}
            </Badge>
            <span className="text-xs text-gray-400">{time}</span>
            <span className="text-xs text-gray-400">{event.location}</span>
            {event.age_group && (
              <Badge variant="purple" size="sm">{event.age_group}</Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
