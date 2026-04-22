"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

interface EduResponse {
  suggestion?: string;
  source?: string;
}

/**
 * «Рефераты» — для 14-17 лет.
 * Тема → ИИ генерирует план + список литературы из каталога/curriculum.
 */
export default function EssayPage() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as string) || "ru";
  const kk = locale === "kk";

  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [source, setSource] = useState<string>("");

  const submit = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult("");
    setSource("");
    try {
      // Шаг 1: список литературы из БД (school_curriculum)
      const litRes = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "literature", topic, grade, language: locale }),
      });
      const litData = (await litRes.json()) as EduResponse;

      // Шаг 2: AI-план реферата
      const essayRes = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "essay", topic, grade, language: locale }),
      });
      const essayData = (await essayRes.json()) as EduResponse;

      const out = [
        litData.suggestion ? `📚 ${kk ? "Әдебиет тізімі" : "Список литературы"}\n\n${litData.suggestion}` : "",
        essayData.suggestion ? `📝 ${kk ? "Реферат жоспары" : "План реферата"}\n\n${essayData.suggestion}` : "",
      ]
        .filter(Boolean)
        .join("\n\n────────\n\n");
      setResult(out);
      setSource(litData.source ?? "ai");
    } catch {
      setResult(kk ? "Қате орын алды, кейінірек көріңіз." : "Произошла ошибка, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-8">
      <header>
        <div className="section-eyebrow mb-3 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "14–17 жас · Рефераттар" : "14–17 лет · Рефераты и доклады"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[52px] leading-[1.05]">
          {kk ? "Реферат тақырыбыңды жаз — ЖИ көмектеседі" : "Введи тему — ИИ подберёт литературу и план"}
        </h1>
        <p className="mt-5 text-lg max-w-2xl" style={{ color: "var(--foreground-muted)" }}>
          {kk
            ? "ЖИ кітапхана каталогынан тиісті дереккөздерді табады, реферат жоспарын ұсынады. Сыныбыңды көрсет — мектеп бағдарламасына сай ұсынады."
            : "ИИ найдёт подходящие книги из каталога и школьной программы РК, составит план реферата с тезисами. Укажи класс — рекомендации будут адаптированы."}
        </p>
      </header>

      <div className="space-y-3 p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <label className="block">
          <span className="text-sm font-medium">{kk ? "Тақырып" : "Тема"}</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={kk ? "Мысалы: Абайдың шығармашылығы" : "Например: Творчество Абая Кунанбаева"}
            className="mt-1 w-full px-4 py-3 rounded-xl text-base"
            style={{ border: "1px solid var(--border)", background: "var(--background)" }}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{kk ? "Сыныбың" : "Твой класс"}</span>
          <select
            value={grade}
            onChange={(e) => setGrade(parseInt(e.target.value, 10))}
            className="mt-1 w-32 px-3 py-2 rounded-lg"
            style={{ border: "1px solid var(--border)", background: "var(--background)" }}
          >
            {[8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={submit}
          disabled={loading || !topic.trim()}
          className="px-6 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: "var(--primary)", color: "white" }}
        >
          {loading
            ? kk ? "Дайындалуда..." : "Готовим..."
            : kk ? "Реферат жасау" : "Подобрать литературу + план"}
        </button>
      </div>

      {result && (
        <article
          className="p-6 rounded-2xl whitespace-pre-wrap leading-relaxed"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          {result}
          {source === "curriculum" && (
            <p className="mt-4 text-xs" style={{ color: "var(--foreground-muted)" }}>
              {kk ? "Дереккөз: РК мектеп бағдарламасы" : "Источник: школьная программа РК"}
            </p>
          )}
        </article>
      )}
    </div>
  );
}
