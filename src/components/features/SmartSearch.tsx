"use client";

import { useState } from "react";
import SearchBar from "@/components/ui/SearchBar";
import Badge from "@/components/ui/Badge";
import BookCard from "./BookCard";

interface Book {
  id: number;
  title: string;
  author: string;
  cover_url?: string;
  genre?: string;
  age_category?: string;
  is_available?: boolean;
}

interface SmartSearchProps {
  locale: string;
}

export default function SmartSearch({ locale }: SmartSearchProps) {
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiFilters, setAiFilters] = useState<string[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const suggestions = locale === "kk"
    ? ["Балаларға арналған ертегілер", "Ғылыми-фантастика", "Мектеп оқулықтары", "Қазақ әдебиеті"]
    : ["Сказки для детей", "Научная фантастика", "Школьная программа", "Приключения для подростков"];

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    setSearchPerformed(true);
    try {
      const response = await fetch("/api/catalog/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, language: locale }),
      });
      const data = await response.json();
      setResults(data.books ?? []);
      setAiFilters(data.suggestedFilters ?? []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <SearchBar
        placeholder={locale === "kk" ? "Кітап іздеу: жанр, тақырып, автор..." : "Поиск: жанр, тема, автор..."}
        onSearch={handleSearch}
        suggestions={suggestions}
      />

      {aiFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {aiFilters.map((filter, i) => (
            <button key={i} onClick={() => handleSearch(filter)}>
              <Badge variant="purple" size="md">{filter}</Badge>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-purple-200 border-t-purple-500 rounded-full mx-auto" />
        </div>
      )}

      {!loading && searchPerformed && results.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {locale === "kk" ? "Ештеңе табылмады" : "Ничего не найдено"}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author}
              coverUrl={book.cover_url}
              genre={book.genre}
              ageCategory={book.age_category}
              isAvailable={book.is_available}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
