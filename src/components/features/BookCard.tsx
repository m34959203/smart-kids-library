"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface BookCardProps {
  id: number;
  title: string;
  author: string;
  coverUrl?: string;
  genre?: string;
  ageCategory?: string;
  isAvailable?: boolean;
  locale: string;
}

export default function BookCard({
  id,
  title,
  author,
  coverUrl,
  genre,
  ageCategory,
  isAvailable = true,
  locale,
}: BookCardProps) {
  return (
    <Link href={`/${locale}/catalog/${id}`}>
      <Card hoverable className="h-full">
        <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          {ageCategory && (
            <div className="absolute top-2 left-2">
              <Badge variant="purple" size="sm">{ageCategory}</Badge>
            </div>
          )}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Badge variant="danger" size="md">
                {locale === "kk" ? "Қол жетімсіз" : "Недоступна"}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm text-purple-900 line-clamp-2 mb-1">{title}</h3>
          <p className="text-xs text-gray-500 mb-2">{author}</p>
          {genre && (
            <Badge variant="info" size="sm">{genre}</Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
