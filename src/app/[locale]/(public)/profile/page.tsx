"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Tabs from "@/components/ui/Tabs";
import Avatar from "@/components/ui/Avatar";
import GamificationPanel from "@/components/features/GamificationPanel";
import { useAgeProfile } from "@/lib/age-profile";
import type { AgeGroup } from "@/lib/utils";

interface ProgressRow {
  id: number;
  title: string;
  current_page: number;
  total_pages: number;
  last_read_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ru";
  const { data: session, status } = useSession();
  const { ageGroup, setAgeGroup } = useAgeProfile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressRow[]>([]);

  const labels = locale === "kk"
    ? { title: "Жеке кабинет", login: "Кіру", email: "Email", password: "Құпия сөз", register: "Тіркелу", history: "Оқу тарихы", favorites: "Таңдаулылар", gamification: "Жетістіктер", settings: "Баптаулар", noHistory: "Оқу тарихы бос", invalid: "Қате email немесе құпия сөз", age: "Жас тобы" }
    : { title: "Личный кабинет", login: "Войти", email: "Email", password: "Пароль", register: "Регистрация", history: "История чтения", favorites: "Избранное", gamification: "Достижения", settings: "Настройки", noHistory: "История чтения пуста", invalid: "Неверный email или пароль", age: "Возрастная группа" };

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/catalog/progress/list")
        .then((r) => (r.ok ? r.json() : { rows: [] }))
        .then((data) => setProgress(data.rows ?? []))
        .catch(() => undefined);
    }
  }, [status]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) setError(labels.invalid);
  };

  if (status === "loading") {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-gray-500">…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="p-6 space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-purple-900">{labels.title}</h1>
          </div>
          <form onSubmit={onLogin} className="space-y-4">
            <Input label={labels.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label={labels.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {labels.login}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;

  const tabs = [
    {
      id: "gamification",
      label: labels.gamification,
      content: <GamificationPanel locale={locale} />,
    },
    {
      id: "history",
      label: labels.history,
      content: progress.length === 0 ? (
        <div className="text-center py-8 text-gray-400">{labels.noHistory}</div>
      ) : (
        <ul className="space-y-2">
          {progress.map((p) => (
            <li key={p.id} className="bg-white rounded-xl p-3 border border-purple-100 flex justify-between">
              <span className="truncate">{p.title}</span>
              <span className="text-sm text-purple-600 font-bold">
                {p.total_pages > 0 ? Math.round((p.current_page / p.total_pages) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "settings",
      label: labels.settings,
      content: (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-bold text-purple-900 mb-2">{labels.age}</div>
            <div className="flex gap-2 flex-wrap">
              {(["6-9", "10-13", "14-17"] as AgeGroup[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setAgeGroup(ageGroup === g ? null : g)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    ageGroup === g ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? user?.email ?? "User"} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-purple-900">{user?.name ?? user?.email}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.role && user.role !== "reader" && (
              <span className="inline-block mt-1 text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {user.role}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => signOut({ callbackUrl: `/${locale}` })}>
            {locale === "kk" ? "Шығу" : "Выйти"}
          </Button>
        </div>
      </Card>
      <Tabs tabs={tabs} />
    </div>
  );
}
