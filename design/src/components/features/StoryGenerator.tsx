"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import StoryPlayer from "./StoryPlayer";

interface StoryGeneratorProps {
  locale: string;
}

interface StoryChoice {
  text: string;
  nextPrompt: string;
}

interface GeneratedStory {
  content: string;
  choices?: StoryChoice[];
}

export default function StoryGenerator({ locale }: StoryGeneratorProps) {
  const [childName, setChildName] = useState("");
  const [theme, setTheme] = useState("adventure");
  const [character, setCharacter] = useState("");
  const [ageLevel, setAgeLevel] = useState("7-10");
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);

  const labels = locale === "kk"
    ? {
        title: "Ертегі генераторы",
        name: "Кейіпкер аты",
        theme: "Тақырып",
        character: "Басты кейіпкер",
        age: "Жас",
        generate: "Ертегі жасау!",
        generating: "Сиқырлы оқиға жасалуда...",
        save: "Сақтау",
        chooseNext: "Әрі қарай не болады?",
      }
    : {
        title: "Генератор сказок",
        name: "Имя героя",
        theme: "Тема",
        character: "Главный персонаж",
        age: "Возраст",
        generate: "Создать сказку!",
        generating: "Создаю волшебную историю...",
        save: "Сохранить",
        chooseNext: "Что будет дальше?",
      };

  const themes = [
    { value: "adventure", label: locale === "kk" ? "Шытырман оқиға" : "Приключение" },
    { value: "friendship", label: locale === "kk" ? "Достық" : "Дружба" },
    { value: "magic", label: locale === "kk" ? "Сиқыр" : "Волшебство" },
    { value: "nature", label: locale === "kk" ? "Табиғат" : "Природа" },
    { value: "space", label: locale === "kk" ? "Ғарыш" : "Космос" },
    { value: "animals", label: locale === "kk" ? "Жануарлар" : "Животные" },
  ];

  const generate = async (continuation?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: childName || (locale === "kk" ? "Бала" : "Малыш"),
          theme,
          character: character || (locale === "kk" ? "Кішкентай арыстан" : "Маленький лев"),
          ageLevel,
          language: locale,
          continuation,
          previousStory: storyHistory.join("\n\n"),
        }),
      });
      const data = await response.json();
      if (data.story) {
        setStory(data.story);
        setStoryHistory((prev) => [...prev, data.story.content]);
      }
    } catch {
      // Error handled silently
    }
    setLoading(false);
  };

  const saveStory = async () => {
    try {
      await fetch("/api/stories/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          theme,
          character,
          language: locale,
          content: storyHistory.join("\n\n"),
          ageLevel,
        }),
      });
    } catch {
      // Silent
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-purple-900 text-center">{labels.title}</h2>

      {!story ? (
        <Card className="p-6 space-y-4">
          <Input
            label={labels.name}
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={locale === "kk" ? "Мысалы: Арман" : "Например: Алиса"}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{labels.theme}</label>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    theme === t.value
                      ? "bg-purple-500 text-white shadow-md"
                      : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={labels.character}
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder={locale === "kk" ? "Мысалы: Кішкентай арыстан" : "Например: Маленький лев"}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{labels.age}</label>
            <div className="flex gap-2">
              {["3-6", "7-10", "11-14"].map((age) => (
                <button
                  key={age}
                  onClick={() => setAgeLevel(age)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    ageLevel === age
                      ? "bg-pink-500 text-white shadow-md"
                      : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => generate()} loading={loading} size="lg" className="w-full">
            {loading ? labels.generating : labels.generate}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
              {story.content}
            </div>
          </Card>

          <StoryPlayer text={story.content} locale={locale} />

          {story.choices && story.choices.length > 0 && (
            <Card className="p-4">
              <h3 className="font-bold text-purple-900 mb-3">{labels.chooseNext}</h3>
              <div className="space-y-2">
                {story.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => generate(choice.nextPrompt)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all text-sm font-medium text-purple-700 disabled:opacity-50"
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={saveStory} variant="outline" className="flex-1">{labels.save}</Button>
            <Button onClick={() => { setStory(null); setStoryHistory([]); }} variant="ghost" className="flex-1">
              {locale === "kk" ? "Жаңа ертегі" : "Новая сказка"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
