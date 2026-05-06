"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const kk = locale === "kk";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [ageGroup, setAgeGroup] = useState<"6-9" | "10-13" | "14-17" | "all">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, ageGroup }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось зарегистрироваться");
        setLoading(false);
        return;
      }
      // Сразу на /profile — там стандартный NextAuth-логин
      router.push(`/${locale}/profile?registered=1&email=${encodeURIComponent(email)}`);
    } catch {
      setError(kk ? "Қате орын алды" : "Произошла ошибка");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">
        {kk ? "Тіркелу" : "Регистрация"}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={kk ? "Аты" : "Имя"} required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
            maxLength={120}
            className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
          />
        </Field>
        <Field label={kk ? "Құпиясөз (≥ 8 таңба)" : "Пароль (≥ 8 символов)"} required>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={200}
            className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
          />
        </Field>
        <Field label={kk ? "Жасы" : "Возраст"}>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value as typeof ageGroup)}
            className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none"
          >
            <option value="all">{kk ? "Көрсетпеу" : "Не указывать"}</option>
            <option value="6-9">6–9</option>
            <option value="10-13">10–13</option>
            <option value="14-17">14–17</option>
          </select>
        </Field>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? (kk ? "Тіркелуде..." : "Регистрация...") : (kk ? "Тіркелу" : "Зарегистрироваться")}
        </button>

        <div className="text-center text-sm text-gray-600 mt-4">
          <Link href={`/${locale}/profile`} className="text-purple-600 hover:underline">
            {kk ? "Қазірдің өзінде есепшотыңыз бар ма? Кіру" : "Уже есть аккаунт? Войти"}
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
