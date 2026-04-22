"use client";

import Link from "next/link";
import { useState } from "react";
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

const FALLBACK_COVERS = [
  "/covers/cover-01.jpg",
  "/covers/cover-02.jpg",
  "/covers/cover-03.jpg",
  "/covers/cover-04.jpg",
  "/covers/cover-05.jpg",
  "/covers/cover-06.jpg",
  "/covers/cover-07.jpg",
  "/covers/cover-08.jpg",
];

/**
 * Детерминированный выбор fallback-обложки на основе id и названия.
 * Одна и та же книга всегда будет получать одну и ту же обложку.
 */
function pickFallbackCover(id: number, title: string): string {
  const seed = `${id}-${title}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % FALLBACK_COVERS.length;
  return FALLBACK_COVERS[index];
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
  const fallbackCover = pickFallbackCover(id, title);
  const providedCover = coverUrl && coverUrl.trim() ? coverUrl : null;

  // Если внешняя обложка (OpenLibrary и т.п.) не загрузилась —
  // переключаемся на локальную сгенерированную.
  const [imgFailed, setImgFailed] = useState(false);
  const hasRealCover = Boolean(providedCover) && !imgFailed;
  const finalCover = hasRealCover ? providedCover! : fallbackCover;

  return (
    <Link href={`/${locale}/catalog/${id}`} className="group block">
      <article
        className="h-full rounded-2xl overflow-hidden transition-all group-hover:-translate-y-0.5"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="aspect-[3/4] relative overflow-hidden"
          style={{ backgroundColor: "var(--muted)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={finalCover}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => {
              if (!imgFailed) setImgFailed(true);
            }}
          />

          {/* Для fallback-обложек — накладываем название сверху, чтобы обложка была «персонализированной» */}
          {!hasRealCover && (
            <>
              <div
                className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(26,23,18,0.55) 0%, rgba(26,23,18,0) 100%)",
                }}
                aria-hidden
              />
              <div className="absolute inset-x-0 top-0 p-4">
                <div className="text-[9px] tracking-[0.3em] uppercase font-mono text-white/75 mb-1.5">
                  Smart Kids Library
                </div>
                <h3 className="font-display text-[15px] font-semibold leading-tight text-white line-clamp-3 text-balance">
                  {title}
                </h3>
              </div>
            </>
          )}

          {ageCategory && (
            <div className="absolute top-3 right-3">
              <span
                className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full backdrop-blur-sm"
                style={{
                  backgroundColor: "rgba(255,255,255,0.92)",
                  color: "var(--primary-dark)",
                }}
              >
                {ageCategory}
              </span>
            </div>
          )}

          {!isAvailable && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(26, 23, 18, 0.55)" }}
            >
              <Badge variant="danger" size="md">
                {locale === "kk" ? "Қол жетімсіз" : "Недоступна"}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-display text-[15px] font-semibold text-foreground line-clamp-2 leading-snug mb-1.5">
            {title}
          </h3>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
            {author}
          </p>
          {genre && (
            <span
              className="inline-block text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{
                color: "var(--primary)",
                backgroundColor: "var(--primary-light)",
              }}
            >
              {genre}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
