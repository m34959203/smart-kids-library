"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface CreativeWorkshopProps {
  locale: string;
}

export default function CreativeWorkshop({ locale }: CreativeWorkshopProps) {
  const [mode, setMode] = useState<"story" | "poem">("story");
  const [text, setText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const labels = locale === "kk"
    ? { title: "Шығармашылық шеберхана", story: "Әңгіме", poem: "Өлең", placeholder: "Жаза бастаңыз...", getHelp: "ЖИ көмегі", suggestRhyme: "Ұйқас ұсыну", continue: "Жалғастыру" }
    : { title: "Творческая мастерская", story: "Рассказ", poem: "Стихотворение", placeholder: "Начните писать...", getHelp: "Помощь ИИ", suggestRhyme: "Подсказать рифму", continue: "Продолжить" };

  const getAIHelp = async (type: "continue" | "rhyme" | "improve") => {
    setLoading(true);
    try {
      const response = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "workshop",
          mode,
          action: type,
          text,
          language: locale,
        }),
      });
      const data = await response.json();
      setAiSuggestion(data.suggestion ?? "");
    } catch {
      // Silent
    }
    setLoading(false);
  };

  const applySuggestion = () => {
    setText((prev) => prev + "\n" + aiSuggestion);
    setAiSuggestion("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-purple-900 text-center">{labels.title}</h2>

      <div className="flex gap-2 justify-center">
        {(["story", "poem"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              mode === m ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-600 hover:bg-purple-100"
            }`}
          >
            {labels[m]}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={labels.placeholder}
          className="w-full h-64 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none resize-none text-gray-800 leading-relaxed"
        />

        <div className="flex gap-2 mt-3 flex-wrap">
          <Button onClick={() => getAIHelp("continue")} variant="outline" size="sm" loading={loading}>
            {labels.continue}
          </Button>
          {mode === "poem" && (
            <Button onClick={() => getAIHelp("rhyme")} variant="outline" size="sm" loading={loading}>
              {labels.suggestRhyme}
            </Button>
          )}
          <Button onClick={() => getAIHelp("improve")} variant="ghost" size="sm" loading={loading}>
            {labels.getHelp}
          </Button>
        </div>
      </Card>

      {aiSuggestion && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
          <p className="text-sm text-purple-700 whitespace-pre-wrap mb-3">{aiSuggestion}</p>
          <div className="flex gap-2">
            <Button onClick={applySuggestion} size="sm" variant="primary">
              {locale === "kk" ? "Қосу" : "Добавить"}
            </Button>
            <Button onClick={() => setAiSuggestion("")} size="sm" variant="ghost">
              {locale === "kk" ? "Жабу" : "Закрыть"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
