"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface NewsCardProps {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  category?: string;
  publishedAt: string;
  locale: string;
}

export default function NewsCard({ slug, title, excerpt, imageUrl, category, publishedAt, locale }: NewsCardProps) {
  return (
    <Link href={`/${locale}/news/${slug}`}>
      <Card hoverable className="h-full flex flex-col">
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          )}
          {category && (
            <div className="absolute top-2 left-2">
              <Badge variant="purple">{category}</Badge>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-purple-900 line-clamp-2 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 line-clamp-3 flex-1">{excerpt}</p>
          <p className="text-xs text-gray-400 mt-3">{formatDate(publishedAt, locale)}</p>
        </div>
      </Card>
    </Link>
  );
}
