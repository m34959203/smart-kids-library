"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizGameProps {
  locale: string;
}

export default function QuizGame({ locale }: QuizGameProps) {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const labels = locale === "kk"
    ? { title: "Әдеби викторина", start: "Бастау", easy: "Оңай", medium: "Орташа", hard: "Қиын", question: "Сұрақ", score: "Ұпай", correct: "Дұрыс!", incorrect: "Дұрыс емес!", next: "Келесі", results: "Нәтижелер", tryAgain: "Қайта байқап көру", of: "ішінен" }
    : { title: "Литературная викторина", start: "Начать", easy: "Легко", medium: "Средне", hard: "Сложно", question: "Вопрос", score: "Счет", correct: "Правильно!", incorrect: "Неправильно!", next: "Далее", results: "Результаты", tryAgain: "Попробовать снова", of: "из" };

  const startQuiz = async (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    setLoading(true);
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: diff, language: locale, count: 5 }),
      });
      const data = await response.json();
      if (data.questions) {
        setQuestions(data.questions);
        setCurrentQ(0);
        setScore(0);
        setFinished(false);
        setSelected(null);
      }
    } catch {
      // fallback
    }
    setLoading(false);
  };

  const handleAnswer = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setShowExplanation(true);
    if (index === questions[currentQ].correct) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const reset = () => {
    setDifficulty(null);
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setFinished(false);
    setSelected(null);
    setShowExplanation(false);
  };

  // Select difficulty
  if (!difficulty) {
    return (
      <div className="max-w-md mx-auto space-y-6 text-center">
        <h2 className="text-2xl font-bold text-purple-900">{labels.title}</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => startQuiz(d)}
              className={cn(
                "p-6 rounded-2xl font-bold text-lg transition-all hover:shadow-lg",
                d === "easy" && "bg-green-100 text-green-700 hover:bg-green-200",
                d === "medium" && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                d === "hard" && "bg-red-100 text-red-700 hover:bg-red-200"
              )}
            >
              {labels[d]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full mx-auto mb-4" />
        <p className="text-purple-500">{locale === "kk" ? "Сұрақтар дайындалуда..." : "Подготовка вопросов..."}</p>
      </div>
    );
  }

  // Results
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card className="max-w-md mx-auto p-8 text-center space-y-4">
        <div className={cn("text-6xl mb-4", percentage >= 80 ? "" : percentage >= 50 ? "" : "")}>
          {percentage >= 80 ? "🏆" : percentage >= 50 ? "👏" : "📚"}
        </div>
        <h2 className="text-2xl font-bold text-purple-900">{labels.results}</h2>
        <p className="text-4xl font-bold text-purple-600">
          {score} {labels.of} {questions.length}
        </p>
        <p className="text-gray-500">{percentage}%</p>
        <Button onClick={reset} size="lg">{labels.tryAgain}</Button>
      </Card>
    );
  }

  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{labels.question} {currentQ + 1} {labels.of} {questions.length}</span>
        <span>{labels.score}: {score}</span>
      </div>
      <div className="h-2 bg-purple-100 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-purple-900 mb-4">{q.question}</h3>
        <div className="space-y-2">
          {q.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all text-sm font-medium",
                selected === null && "bg-purple-50 hover:bg-purple-100 text-purple-700",
                selected !== null && i === q.correct && "bg-green-100 text-green-700 border-2 border-green-300",
                selected === i && i !== q.correct && "bg-red-100 text-red-700 border-2 border-red-300",
                selected !== null && i !== q.correct && i !== selected && "bg-gray-50 text-gray-400"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {showExplanation && (
          <div className={cn("mt-4 p-3 rounded-xl text-sm", selected === q.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            <p className="font-bold">{selected === q.correct ? labels.correct : labels.incorrect}</p>
            <p className="mt-1">{q.explanation}</p>
          </div>
        )}
      </Card>

      {selected !== null && (
        <Button onClick={nextQuestion} size="lg" className="w-full">
          {currentQ + 1 >= questions.length ? labels.results : labels.next}
        </Button>
      )}
    </div>
  );
}
