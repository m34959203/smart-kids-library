"use client";

import { useState, useEffect } from "react";

interface ContextualHintsProps {
  page: string;
  locale: string;
}

const hints: Record<string, Record<string, string>> = {
  catalog: {
    ru: "Попробуйте умный поиск! Опишите книгу своими словами, и ИИ поможет найти.",
    kk: "Ақылды іздеуді қолданып көріңіз! Кітапты өз сөзіңізбен сипаттаңыз.",
  },
  events: {
    ru: "Нажмите на дату в календаре, чтобы увидеть события этого дня!",
    kk: "Сол күннің оқиғаларын көру үшін күнтізбедегі күнді басыңыз!",
  },
  kids: {
    ru: "Здесь можно создать свою сказку, пройти викторину или раскрасить картинку!",
    kk: "Мұнда өз ертегіңізді жасауға, викторинадан өтуге немесе суретті бояуға болады!",
  },
  home: {
    ru: "Выберите возрастную группу, чтобы увидеть подходящий контент!",
    kk: "Сәйкес мазмұнды көру үшін жас тобын таңдаңыз!",
  },
};

export default function ContextualHints({ page, locale }: ContextualHintsProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `hint-dismissed-${page}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [page]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`hint-dismissed-${page}`, "true");
    }
  };

  const hint = hints[page]?.[locale];
  if (!hint || !visible || dismissed) return null;

  return (
    <div className="fixed bottom-36 lg:bottom-24 left-4 z-30 max-w-xs animate-slide-up">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-4 shadow-xl relative">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 text-white/70 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-start gap-2">
          <span className="text-xl shrink-0">💡</span>
          <p className="text-sm">{hint}</p>
        </div>
      </div>
    </div>
  );
}
