"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function RecoverPage() {
  const { locale } = useParams<{ locale: string }>();
  const kk = locale === "kk";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setDone(true);
      // На dev сервер возвращает прямую ссылку — показываем её пользователю.
      // В проде RECOVER_TOKEN_IN_RESPONSE=0 → ссылка не вернётся, и юзер ждёт email.
      if (data.resetUrl) {
        setResetUrl(`/${locale}${data.resetUrl.replace(/^\/ru/, "")}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-4">
        <h1 className="text-3xl font-bold text-purple-900">
          {kk ? "Сұранысы жіберілді" : "Запрос отправлен"}
        </h1>
        <p className="text-gray-600">
          {kk
            ? "Егер мұндай email тіркелген болса, онда қалпына келтіру сілтемесі жіберіледі (1 сағат бойы жарамды). Егер email инфрақұрылымы қосылмаған болса — сілтемені кітапханашы береді."
            : "Если такой email зарегистрирован, на него будет отправлена ссылка для восстановления (валидна 1 час). Если email-инфраструктура ещё не подключена, библиотекарь передаст ссылку лично."}
        </p>

        {resetUrl && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
            <div className="font-semibold text-amber-900 mb-2">
              {kk ? "Дев-режим: тікелей сілтеме" : "Dev-режим: прямая ссылка"}
            </div>
            <Link href={resetUrl} className="text-purple-600 underline break-all">
              {resetUrl}
            </Link>
          </div>
        )}

        <Link href={`/${locale}/profile`} className="inline-block text-purple-600 hover:underline">
          {kk ? "Кіру бетіне" : "К странице входа"}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-purple-900 mb-2">
        {kk ? "Құпиясөзді қалпына келтіру" : "Восстановление пароля"}
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        {kk ? "Email-ды енгізіңіз, біз қалпына келтіру сілтемесін жібереміз." : "Введите email, мы отправим ссылку для сброса пароля."}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@example.com"
          className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "..." : kk ? "Жіберу" : "Отправить"}
        </button>
        <div className="text-center">
          <Link href={`/${locale}/profile`} className="text-purple-600 hover:underline text-sm">
            {kk ? "Кіру" : "Войти"}
          </Link>
        </div>
      </form>
    </div>
  );
}
