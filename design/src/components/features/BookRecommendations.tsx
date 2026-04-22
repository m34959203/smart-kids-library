"use client";

import { useState, useEffect } from "react";
import BookCard from "./BookCard";
import { BookCardSkeleton } from "@/components/ui/Skeleton";

interface Book {
  id: number;
  title: string;
  author: string;
  cover_url?: string;
  genre?: string;
  age_category?: string;
}

interface BookRecommendationsProps {
  locale: string;
  ageGroup?: string;
}

export default function BookRecommendations({ locale, ageGroup }: BookRecommendationsProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const params = new URLSearchParams();
        if (ageGroup) params.set("ageGroup", ageGroup);
        params.set("locale", locale);

        const response = await fetch(`/api/recommend?${params}`);
        const data = await response.json();
        setBooks(data.books ?? []);
      } catch {
        setBooks([]);
      }
      setLoading(false);
    };
    fetchRecommendations();
  }, [locale, ageGroup]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          id={book.id}
          title={book.title}
          author={book.author}
          coverUrl={book.cover_url}
          genre={book.genre}
          ageCategory={book.age_category}
          locale={locale}
        />
      ))}
    </div>
  );
}
