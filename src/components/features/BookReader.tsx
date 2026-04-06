"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";

interface BookReaderProps {
  bookId: number;
  title: string;
  content: string;
  totalPages: number;
  initialPage?: number;
  locale: string;
}

export default function BookReader({ bookId, title, content, totalPages, initialPage = 1, locale }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");
  const [bookmarked, setBookmarked] = useState(false);

  const themes = {
    light: { bg: "bg-white", text: "text-gray-900" },
    sepia: { bg: "bg-amber-50", text: "text-amber-900" },
    dark: { bg: "bg-gray-900", text: "text-gray-100" },
  };

  const progress = Math.round((currentPage / totalPages) * 100);

  const saveProgress = useCallback(async () => {
    try {
      await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, currentPage, totalPages }),
      });
    } catch {
      // Silent fail
    }
  }, [bookId, currentPage, totalPages]);

  useEffect(() => {
    const timer = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timer);
  }, [currentPage, saveProgress]);

  const pageLabels = {
    ru: { page: "Страница", of: "из", bookmark: "Закладка", fontSize: "Шрифт", theme: "Тема" },
    kk: { page: "Бет", of: "ішінен", bookmark: "Бетбелгі", fontSize: "Қаріп", theme: "Тақырып" },
  };
  const labels = pageLabels[locale as keyof typeof pageLabels] ?? pageLabels.ru;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Controls bar */}
      <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-md border-b border-purple-100 p-3 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-bold text-purple-900 text-sm truncate max-w-[200px]">{title}</h2>
        <div className="flex items-center gap-2">
          {/* Font size */}
          <div className="flex items-center gap-1 bg-purple-50 rounded-xl px-2 py-1">
            <button onClick={() => setFontSize((s) => Math.max(12, s - 2))} className="text-purple-600 font-bold text-sm px-1">A-</button>
            <span className="text-xs text-gray-500">{fontSize}</span>
            <button onClick={() => setFontSize((s) => Math.min(28, s + 2))} className="text-purple-600 font-bold text-lg px-1">A+</button>
          </div>

          {/* Theme */}
          <div className="flex gap-1">
            {(["light", "sepia", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-6 h-6 rounded-full border-2 ${
                  theme === t ? "border-purple-500" : "border-gray-300"
                } ${t === "light" ? "bg-white" : t === "sepia" ? "bg-amber-100" : "bg-gray-800"}`}
              />
            ))}
          </div>

          {/* Bookmark */}
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-1.5 rounded-xl transition-colors ${bookmarked ? "text-yellow-500 bg-yellow-50" : "text-gray-400 hover:text-yellow-500"}`}
            title={labels.bookmark}
          >
            <svg className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-purple-100">
        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className={`${themes[theme].bg} ${themes[theme].text} min-h-[60vh] p-6 md:p-10`}>
        <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }} className="whitespace-pre-wrap">
          {content || (locale === "kk" ? "Мазмұн жүктелуде..." : "Содержание загружается...")}
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-16 lg:bottom-0 bg-white/95 backdrop-blur-md border-t border-purple-100 p-3 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          &larr; {locale === "kk" ? "Алдыңғы" : "Назад"}
        </Button>

        <span className="text-sm text-gray-500">
          {labels.page} {currentPage} {labels.of} {totalPages} ({progress}%)
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          {locale === "kk" ? "Келесі" : "Далее"} &rarr;
        </Button>
      </div>
    </div>
  );
}
