"use client";

import Link from "next/link";
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
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center relative"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                color: "white",
              }}
            >
              <div className="absolute inset-4 border border-white/25 rounded-xl" aria-hidden />
              <div className="text-center px-4 relative">
                <div className="text-[10px] tracking-[0.25em] uppercase opacity-70 mb-3">Book</div>
                <div className="font-display text-lg leading-tight line-clamp-4">{title}</div>
              </div>
            </div>
          )}

          {ageCategory && (
            <div className="absolute top-3 left-3">
              <span
                className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "var(--primary-dark)" }}
              >
                {ageCategory}
              </span>
            </div>
          )}
          {!isAvailable && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(26, 23, 18, 0.5)" }}
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
