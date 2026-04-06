"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Tabs from "@/components/ui/Tabs";
import Avatar from "@/components/ui/Avatar";
import { useParams } from "next/navigation";

export default function ProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ru";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const labels = locale === "kk"
    ? { title: "Жеке кабинет", login: "Кіру", email: "Email", password: "Құпия сөз", register: "Тіркелу", history: "Оқу тарихы", favorites: "Таңдаулылар", quizzes: "Викторина нәтижелері", stories: "Менің оқиғаларым", settings: "Баптаулар", noHistory: "Оқу тарихы бос" }
    : { title: "Личный кабинет", login: "Войти", email: "Email", password: "Пароль", register: "Регистрация", history: "История чтения", favorites: "Избранное", quizzes: "Результаты викторин", stories: "Мои истории", settings: "Настройки", noHistory: "История чтения пуста" };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="p-6 space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-purple-900">{labels.title}</h1>
          </div>
          <Input label={labels.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label={labels.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button onClick={() => setIsLoggedIn(true)} className="w-full" size="lg">{labels.login}</Button>
          <Button variant="ghost" className="w-full">{labels.register}</Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    {
      id: "history",
      label: labels.history,
      content: (
        <div className="text-center py-8 text-gray-400">{labels.noHistory}</div>
      ),
    },
    {
      id: "favorites",
      label: labels.favorites,
      content: (
        <div className="text-center py-8 text-gray-400">
          {locale === "kk" ? "Таңдаулылар бос" : "Избранное пусто"}
        </div>
      ),
    },
    {
      id: "quizzes",
      label: labels.quizzes,
      content: (
        <div className="text-center py-8 text-gray-400">
          {locale === "kk" ? "Нәтижелер жоқ" : "Нет результатов"}
        </div>
      ),
    },
    {
      id: "stories",
      label: labels.stories,
      content: (
        <div className="text-center py-8 text-gray-400">
          {locale === "kk" ? "Оқиғалар жоқ" : "Нет историй"}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name="User" size="lg" />
          <div>
            <h1 className="text-xl font-bold text-purple-900">User</h1>
            <p className="text-sm text-gray-500">{email || "user@example.com"}</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setIsLoggedIn(false)}>
            {locale === "kk" ? "Шығу" : "Выйти"}
          </Button>
        </div>
      </Card>
      <Tabs tabs={tabs} />
    </div>
  );
}
