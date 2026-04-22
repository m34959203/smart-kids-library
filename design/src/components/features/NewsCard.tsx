"use client";

import Link from "next/link";
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
    <Link href={`/${locale}/news/${slug}`} className="group block h-full">
      <article
        className="h-full rounded-[22px] overflow-hidden flex flex-col transition-all group-hover:-translate-y-0.5"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="aspect-[16/10] relative overflow-hidden"
          style={{ backgroundColor: "var(--muted)" }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div
              className="w-full h-full flex items-end p-5"
              style={{ background: "linear-gradient(160deg, var(--primary) 0%, var(--primary-dark) 100%)" }}
            >
              <div className="font-display text-white text-xl leading-tight line-clamp-3 max-w-[80%]">
                {title}
              </div>
            </div>
          )}
          {category && (
            <div className="absolute top-3 left-3">
              <span
                className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "var(--primary-dark)" }}
              >
                {category}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <p className="font-mono text-[11px] tracking-widest mb-3" style={{ color: "var(--foreground-muted)" }}>
            {formatDate(publishedAt, locale)}
          </p>
          <h3 className="font-display text-lg font-semibold leading-snug line-clamp-2 mb-2 text-foreground group-hover:text-[color:var(--primary)] transition-colors">
            {title}
          </h3>
          <p className="text-sm line-clamp-3 flex-1" style={{ color: "var(--foreground-muted)", lineHeight: 1.55 }}>
            {excerpt}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide" style={{ color: "var(--primary)" }}>
            {locale === "kk" ? "Оқу" : "Читать"}
            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
