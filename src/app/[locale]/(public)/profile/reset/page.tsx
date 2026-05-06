"use client";

import { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ResetPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const kk = locale === "kk";
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <p className="text-red-600">
          {kk ? "Токен жоқ. /profile/recover арқылы жаңасын сұраңыз." : "Токен отсутствует. Запросите новый через /profile/recover."}
        </p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(kk ? "Құпиясөздер сәйкес келмейді" : "Пароли не совпадают");
      return;
    }
    if (password.length < 8) {
      setError(kk ? "Кемінде 8 таңба" : "Минимум 8 символов");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось");
        setLoading(false);
        return;
      }
      router.push(`/${locale}/profile?reset=1`);
    } catch {
      setError(kk ? "Қате орын алды" : "Произошла ошибка");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">
        {kk ? "Жаңа құпиясөз" : "Новый пароль"}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required minLength={8}
          placeholder={kk ? "Жаңа құпиясөз" : "Новый пароль"}
          className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required minLength={8}
          placeholder={kk ? "Тағы бір рет" : "Повторите"}
          className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
        />
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "..." : kk ? "Сақтау" : "Сохранить"}
        </button>
        <div className="text-center">
          <Link href={`/${locale}/profile`} className="text-purple-600 hover:underline text-sm">
            {kk ? "Кіру бетіне" : "К странице входа"}
          </Link>
        </div>
      </form>
    </div>
  );
}
