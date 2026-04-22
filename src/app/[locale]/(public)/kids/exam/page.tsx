"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

interface EduResponse {
  suggestion?: string;
}

const SUBJECTS = ["История Казахстана", "Литература", "Математика", "Физика", "Химия", "Биология", "География", "Английский язык", "Информатика"];

/**
 * «Подготовка к экзаменам» — для 14-17 лет.
 * Класс + предмет + тема → ИИ объясняет с примерами, рекомендует литературу.
 */
export default function ExamPage() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as string) || "ru";
  const kk = locale === "kk";

  const [grade, setGrade] = useState(11);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");

  const ask = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setExplanation("");
    try {
      const r = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "literature",
          topic: `${subject}: ${topic}`,
          grade,
          text: kk ? "Емтиханға дайындық. Қысқа түсіндір, мысалдар келтір, ұқсатулар қолдан." : "Подготовка к экзамену. Объясни кратко, с примерами и аналогиями для школьника.",
          language: locale,
        }),
      });
      const data = (await r.json()) as EduResponse;
      setExplanation(data.suggestion ?? "");
    } catch {
      setExplanation(kk ? "Қате орын алды." : "Произошла ошибка.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-8">
      <header>
        <div className="section-eyebrow mb-3 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "14–17 жас · Емтиханға дайындық" : "14–17 лет · Подготовка к экзаменам"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[52px] leading-[1.05]">
          {kk ? "ҰБТ мен мектеп емтихандарына дайындық" : "Подготовка к ЕНТ и школьным экзаменам"}
        </h1>
        <p className="mt-5 text-lg max-w-2xl" style={{ color: "var(--foreground-muted)" }}>
          {kk
            ? "Сұрақ қой — ЖИ түсіндіреді, мысалдар келтіреді, оқу үшін кітаптар ұсынады."
            : "Задай вопрос по теме — ИИ объяснит на уровне твоего класса, приведёт примеры и порекомендует литературу для углублённого изучения."}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <label className="block">
          <span className="text-sm font-medium">{kk ? "Сынып" : "Класс"}</span>
          <select value={grade} onChange={(e) => setGrade(parseInt(e.target.value, 10))} className="mt-1 w-full px-3 py-2 rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
            {[8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">{kk ? "Пән" : "Предмет"}</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">{kk ? "Тақырып" : "Тема / вопрос"}</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={kk ? "Мысалы: Қазақ хандығының құрылуы" : "Напр.: Возникновение Казахского ханства"}
            className="mt-1 w-full px-3 py-2 rounded-lg"
            style={{ border: "1px solid var(--border)", background: "var(--background)" }}
          />
        </label>
      </div>

      <button
        onClick={ask}
        disabled={loading || !topic.trim()}
        className="px-6 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
        style={{ background: "var(--primary)", color: "white" }}
      >
        {loading
          ? kk ? "Жауап дайындалуда..." : "Готовлю объяснение..."
          : kk ? "Түсіндір" : "Объяснить + источники"}
      </button>

      {explanation && (
        <article className="p-6 rounded-2xl whitespace-pre-wrap leading-relaxed" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          {explanation}
        </article>
      )}
    </div>
  );
}
