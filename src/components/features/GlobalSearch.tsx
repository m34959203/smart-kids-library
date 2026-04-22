"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface SearchResults {
  books: Array<{ id: number; title: string; author?: string; cover_url?: string }>;
  events: Array<{ id: number; title_ru: string; title_kk?: string; start_date: string }>;
  news: Array<{ id: number; slug: string; title_ru: string; title_kk?: string }>;
  sections: Array<{ title: string; href: string }>;
}

const empty: SearchResults = { books: [], events: [], news: [], sections: [] };

export default function GlobalSearch({ locale }: { locale: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchResults>(empty);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setData(empty);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search/global?q=${encodeURIComponent(q)}&locale=${locale}`);
        if (r.ok) setData(await r.json());
      } catch {
        /* noop */
      }
    }, 200);
  }, [q, locale]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const placeholder = locale === "kk" ? "Іздеу: кітаптар, іс-шаралар, бөлімдер…" : "Поиск: книги, события, разделы…";
  const hasAny = data.books.length + data.events.length + data.news.length + data.sections.length > 0;
  const isKk = locale === "kk";

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-full border border-purple-200 focus:border-purple-500 focus:outline-none text-sm"
        aria-label={placeholder}
      />
      {open && q.length >= 2 && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-purple-100 max-h-[70vh] overflow-y-auto">
          {!hasAny && (
            <div className="p-4 text-sm text-gray-400">{isKk ? "Ештеңе табылмады" : "Ничего не найдено"}</div>
          )}
          {data.sections.length > 0 && (
            <Section title={isKk ? "Бөлімдер" : "Разделы"}>
              {data.sections.map((s) => (
                <Link key={s.href} href={s.href} className="block px-4 py-2 text-sm hover:bg-purple-50" onClick={() => setOpen(false)}>
                  {s.title}
                </Link>
              ))}
            </Section>
          )}
          {data.books.length > 0 && (
            <Section title={isKk ? "Кітаптар" : "Книги"}>
              {data.books.map((b) => (
                <Link
                  key={b.id}
                  href={`/${locale}/catalog/${b.id}`}
                  className="block px-4 py-2 text-sm hover:bg-purple-50"
                  onClick={() => setOpen(false)}
                >
                  <div className="font-medium">{b.title}</div>
                  {b.author && <div className="text-xs text-gray-500">{b.author}</div>}
                </Link>
              ))}
            </Section>
          )}
          {data.events.length > 0 && (
            <Section title={isKk ? "Іс-шаралар" : "Мероприятия"}>
              {data.events.map((e) => (
                <Link
                  key={e.id}
                  href={`/${locale}/events/${e.id}`}
                  className="block px-4 py-2 text-sm hover:bg-purple-50"
                  onClick={() => setOpen(false)}
                >
                  <div className="font-medium">{isKk ? e.title_kk || e.title_ru : e.title_ru}</div>
                  <div className="text-xs text-gray-500">{new Date(e.start_date).toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU")}</div>
                </Link>
              ))}
            </Section>
          )}
          {data.news.length > 0 && (
            <Section title={isKk ? "Жаңалықтар" : "Новости"}>
              {data.news.map((n) => (
                <Link
                  key={n.id}
                  href={`/${locale}/news/${n.slug}`}
                  className="block px-4 py-2 text-sm hover:bg-purple-50"
                  onClick={() => setOpen(false)}
                >
                  {isKk ? n.title_kk || n.title_ru : n.title_ru}
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-purple-700 font-bold">{title}</div>
      <div>{children}</div>
    </div>
  );
}
