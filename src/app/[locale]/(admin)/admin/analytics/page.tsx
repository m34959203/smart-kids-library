"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";

interface Analytics {
  usage: {
    limitDaily: number;
    usedToday: number;
    remainingToday: number;
    percentToday: number;
    avgDaily7d: number;
    alert: "ok" | "warning" | "critical";
  };
  series: {
    tokensByDay: Array<{ date: string; tokens: number; requests: number }>;
    tokensByEndpoint: Array<{ endpoint: string; tokens: number; requests: number }>;
  };
  chat: { total: number; byLanguage: Array<{ language: string; count: number }>; empty: number };
  visits: { total: number; topPaths: Array<{ path: string; count: number }> };
  overview: { books: number; stories: number; upcomingEvents: number; moderationPending: number };
}

export default function AdminAnalyticsPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ru";
  const kk = locale === "kk";
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics?days=30")
      .then((r) => (r.ok ? r.json() : Promise.reject("forbidden")))
      .then(setData)
      .catch(() => setErr("forbidden"));
  }, []);

  if (err) return <p className="text-red-600">{kk ? "Қол жетімсіз" : "Нет доступа"}</p>;
  if (!data) return <p className="text-gray-500">{kk ? "Жүктелуде…" : "Загрузка…"}</p>;

  const maxDay = Math.max(1, ...data.series.tokensByDay.map((d) => d.tokens));

  const alertColor = data.usage.alert === "critical" ? "bg-red-100 text-red-700" : data.usage.alert === "warning" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-purple-900">{kk ? "Аналитика" : "Аналитика"}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase text-gray-500">{kk ? "Кітаптар" : "Книги"}</p>
          <p className="text-2xl font-bold text-purple-900">{data.overview.books}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-gray-500">{kk ? "Ертегілер" : "Сказки"}</p>
          <p className="text-2xl font-bold text-purple-900">{data.overview.stories}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-gray-500">{kk ? "Алдағы оқиғалар" : "Предстоящие события"}</p>
          <p className="text-2xl font-bold text-purple-900">{data.overview.upcomingEvents}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-gray-500">{kk ? "Модерацияда" : "На модерации"}</p>
          <p className="text-2xl font-bold text-purple-900">{data.overview.moderationPending}</p>
        </Card>
      </div>

      {/* Token usage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-purple-900">{kk ? "ЖИ токендер" : "Токены AI"}</h2>
          <span className={`text-xs px-2 py-1 rounded-full font-bold ${alertColor}`}>
            {data.usage.percentToday}% · {data.usage.usedToday.toLocaleString()} / {data.usage.limitDaily.toLocaleString()}
          </span>
        </div>
        <div className="h-3 rounded-full bg-purple-100 overflow-hidden mb-4">
          <div
            className={`h-full ${
              data.usage.alert === "critical"
                ? "bg-red-500"
                : data.usage.alert === "warning"
                ? "bg-amber-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(100, data.usage.percentToday)}%` }}
          />
        </div>
        <div className="flex items-end gap-1 h-40">
          {data.series.tokensByDay.slice(-21).map((d) => (
            <div key={d.date} className="flex-1 min-w-0 flex flex-col items-center gap-1" title={`${d.date}: ${d.tokens}`}>
              <div className="w-full bg-purple-400 rounded-t" style={{ height: `${(d.tokens / maxDay) * 100}%` }} />
              <span className="text-[10px] text-gray-400 truncate">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {kk ? "7 күндік орта" : "Среднее за 7 дней"}: {data.usage.avgDaily7d.toLocaleString()}
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-3">{kk ? "Эндпоинттер (7 күн)" : "По эндпоинтам (7 дней)"}</h2>
          <table className="w-full text-sm">
            <tbody>
              {data.series.tokensByEndpoint.map((e) => (
                <tr key={e.endpoint} className="border-t border-gray-100">
                  <td className="py-2">{e.endpoint}</td>
                  <td className="py-2 text-right font-bold text-purple-700">{e.tokens.toLocaleString()}</td>
                  <td className="py-2 text-right text-gray-500">{e.requests}</td>
                </tr>
              ))}
              {data.series.tokensByEndpoint.length === 0 && (
                <tr><td className="py-4 text-gray-400 text-center" colSpan={3}>—</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-3">{kk ? "Чат" : "Чат"}</h2>
          <div className="text-sm space-y-2">
            <p>{kk ? "Барлық диалогтер" : "Всего диалогов"}: <b>{data.chat.total}</b></p>
            <p>{kk ? "Жауапсыз" : "Без ответа"}: <b>{data.chat.empty}</b></p>
            <p>
              {kk ? "Тіл" : "По языку"}:{" "}
              {data.chat.byLanguage.map((l) => `${l.language.toUpperCase()}: ${l.count}`).join(", ") || "—"}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-purple-900 mb-3">
          {kk ? "Танымал беттер" : "Популярные страницы"} ({data.visits.total} {kk ? "кіру" : "визитов"})
        </h2>
        <ul className="text-sm space-y-1">
          {data.visits.topPaths.map((p) => (
            <li key={p.path} className="flex justify-between border-b border-gray-50 py-1">
              <span className="truncate">{p.path}</span>
              <span className="font-bold text-purple-700">{p.count}</span>
            </li>
          ))}
          {data.visits.topPaths.length === 0 && <li className="text-gray-400">—</li>}
        </ul>
      </Card>
    </div>
  );
}
