"use client";

import { useEffect, useState } from "react";

interface Achievement {
  code: string;
  title_ru: string;
  title_kk: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlocked_at: string;
}

interface RecentPoint {
  kind: string;
  points: number;
  created_at: string;
  note: string | null;
}

interface Summary {
  total: number;
  streak: { current: number; longest: number };
  recent: RecentPoint[];
  unlocked: Achievement[];
}

interface LeaderRow {
  rank: number;
  userId: number;
  name: string;
  ageGroup: string | null;
  points: number;
}

const TIER_COLOR: Record<string, string> = {
  bronze: "from-amber-500 to-orange-500",
  silver: "from-slate-400 to-slate-500",
  gold: "from-yellow-400 to-amber-600",
  platinum: "from-sky-400 to-indigo-500",
};

const KIND_LABEL: Record<string, { ru: string; kk: string }> = {
  checkin: { ru: "Ежедневный визит", kk: "Күнделікті келу" },
  book_finished: { ru: "Прочитанная книга", kk: "Оқылған кітап" },
  book_progress: { ru: "Прогресс чтения", kk: "Оқу барысы" },
  quiz_passed: { ru: "Викторина", kk: "Викторина" },
  story_created: { ru: "Создана сказка", kk: "Жасалған ертегі" },
  review_written: { ru: "Отзыв", kk: "Пікір" },
  event_attended: { ru: "Посещено событие", kk: "Қатысылған оқиға" },
  request_made: { ru: "Вопрос помощнику", kk: "Көмекшіге сұрақ" },
  workshop_submitted: { ru: "Работа в мастерской", kk: "Шеберханадағы жұмыс" },
  admin_award: { ru: "Награда от библиотеки", kk: "Кітапхана сыйы" },
};

export default function GamificationPanel({ locale }: { locale: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, lbRes] = await Promise.all([
          fetch("/api/gamification?view=me"),
          fetch("/api/gamification?view=leaderboard&limit=10"),
        ]);
        if (meRes.ok) setSummary(await meRes.json());
        else if (meRes.status === 401) setError("signin");
        if (lbRes.ok) {
          const data = await lbRes.json();
          setLeaders(data.leaderboard ?? []);
        }
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const l = locale === "kk";

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 animate-pulse">
        <div className="h-4 w-32 bg-purple-100 rounded mb-4" />
        <div className="h-20 bg-purple-50 rounded" />
      </div>
    );
  }

  if (error === "signin" || !summary) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
        <p className="text-sm text-gray-600">
          {l
            ? "Ұпай жинау және жетістіктер ашу үшін жүйеге кіріңіз."
            : "Войдите, чтобы копить баллы и открывать достижения."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase opacity-80 tracking-wider">{l ? "Сіздің ұпайларыңыз" : "Ваши баллы"}</div>
            <div className="text-5xl font-black mt-1">{summary.total}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase opacity-80 tracking-wider">{l ? "Серия" : "Серия"}</div>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-4xl font-black">{summary.streak.current}</span>
              <span className="text-xl">🔥</span>
            </div>
            <div className="text-xs opacity-80">{l ? `рекорд ${summary.streak.longest}` : `рекорд ${summary.streak.longest}`}</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
        <h3 className="font-bold text-purple-900 mb-3">{l ? "Жетістіктер" : "Достижения"}</h3>
        {summary.unlocked.length === 0 ? (
          <p className="text-sm text-gray-500">
            {l ? "Әзірге жетістіктер жоқ. Оқыңыз, іс-шараларға қатысыңыз!" : "Пока достижений нет. Читай, приходи, участвуй!"}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {summary.unlocked.map((a) => (
              <div
                key={a.code}
                className={`bg-gradient-to-br ${TIER_COLOR[a.tier] ?? TIER_COLOR.bronze} text-white rounded-xl p-3 text-center shadow`}
                title={new Date(a.unlocked_at).toLocaleDateString(l ? "kk-KZ" : "ru-RU")}
              >
                <div className="text-2xl mb-1" aria-hidden="true">🏆</div>
                <div className="text-xs font-bold leading-tight">{l ? a.title_kk : a.title_ru}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
        <h3 className="font-bold text-purple-900 mb-3">{l ? "Соңғы белсенділік" : "Последняя активность"}</h3>
        {summary.recent.length === 0 ? (
          <p className="text-sm text-gray-500">{l ? "Белсенділік жоқ" : "Пока пусто"}</p>
        ) : (
          <ul className="space-y-2">
            {summary.recent.slice(0, 8).map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                <span className="text-gray-700">{KIND_LABEL[r.kind]?.[l ? "kk" : "ru"] ?? r.kind}</span>
                <span className="font-bold text-purple-600">+{r.points}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leaderboard */}
      {leaders.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
          <h3 className="font-bold text-purple-900 mb-3">{l ? "Көшбасшылар" : "Лидеры"}</h3>
          <ol className="space-y-1">
            {leaders.map((r) => (
              <li
                key={r.userId}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg odd:bg-purple-50/40"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0">
                    {r.rank}
                  </span>
                  <span className="truncate">{r.name}</span>
                  {r.ageGroup && <span className="text-[10px] text-gray-400">({r.ageGroup})</span>}
                </span>
                <span className="font-bold text-purple-600 shrink-0">{r.points}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
