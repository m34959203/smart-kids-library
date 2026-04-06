"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ColoringGeneratorProps {
  locale: string;
}

export default function ColoringGenerator({ locale }: ColoringGeneratorProps) {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState("");

  const labels = locale === "kk"
    ? { title: "Бояулар генераторы", placeholder: "Тақырыпты теріңіз (мысалы: арыстан, құс)", generate: "Бояу жасау!", generating: "Жасалуда..." }
    : { title: "Генератор раскрасок", placeholder: "Введите тему (например: лев, птица)", generate: "Создать раскраску!", generating: "Создаю..." };

  const themes = [
    { icon: "🦁", label: locale === "kk" ? "Арыстан" : "Лев" },
    { icon: "🦋", label: locale === "kk" ? "Көбелек" : "Бабочка" },
    { icon: "🏰", label: locale === "kk" ? "Сарай" : "Замок" },
    { icon: "🚀", label: locale === "kk" ? "Зымыран" : "Ракета" },
    { icon: "🌸", label: locale === "kk" ? "Гүл" : "Цветок" },
    { icon: "🐱", label: locale === "kk" ? "Мысық" : "Кошка" },
  ];

  const generateColoring = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/coloring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, language: locale }),
      });
      const data = await response.json();
      if (data.svg) {
        setSvgContent(data.svg);
      }
    } catch {
      // Silent
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-purple-900 text-center">{labels.title}</h2>

      <div className="flex flex-wrap gap-2 justify-center">
        {themes.map((t) => (
          <button
            key={t.label}
            onClick={() => setTheme(t.label)}
            className={`px-4 py-3 rounded-2xl text-lg transition-all ${
              theme === t.label
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white shadow-sm hover:shadow-md"
            }`}
          >
            <span className="mr-1">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={labels.placeholder}
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 outline-none"
        />
        <Button onClick={generateColoring} loading={loading} size="lg">
          {loading ? labels.generating : labels.generate}
        </Button>
      </div>

      {svgContent && (
        <Card className="p-6 text-center">
          <div
            className="inline-block max-w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([svgContent], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `coloring-${theme}.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {locale === "kk" ? "Жүктеу" : "Скачать"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
