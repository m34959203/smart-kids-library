import { NextRequest, NextResponse } from "next/server";
import { getMany } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

const SECTIONS_RU = [
  { title: "Каталог книг", href: "/ru/catalog", keywords: ["каталог", "книги", "поиск"] },
  { title: "Мероприятия", href: "/ru/events", keywords: ["мероприятия", "события", "календарь"] },
  { title: "Новости", href: "/ru/news", keywords: ["новости", "статьи"] },
  { title: "Детский раздел", href: "/ru/kids", keywords: ["дети", "сказки", "викторины", "раскраски"] },
  { title: "О библиотеке", href: "/ru/about", keywords: ["о нас", "история"] },
  { title: "Правила", href: "/ru/rules", keywords: ["правила", "запись", "продление"] },
  { title: "Контакты", href: "/ru/contacts", keywords: ["контакты", "адрес", "телефон"] },
  { title: "Электронные ресурсы", href: "/ru/resources", keywords: ["ресурсы", "электронные"] },
];
const SECTIONS_KK = [
  { title: "Кітаптар каталогы", href: "/kk/catalog", keywords: ["каталог", "кітап"] },
  { title: "Іс-шаралар", href: "/kk/events", keywords: ["іс-шара", "оқиға"] },
  { title: "Жаңалықтар", href: "/kk/news", keywords: ["жаңалық"] },
  { title: "Балалар бөлімі", href: "/kk/kids", keywords: ["бала", "ертегі"] },
  { title: "Кітапхана туралы", href: "/kk/about", keywords: ["туралы", "тарих"] },
  { title: "Ережелер", href: "/kk/rules", keywords: ["ереже"] },
  { title: "Байланыс", href: "/kk/contacts", keywords: ["байланыс", "мекенжай"] },
  { title: "Электронды ресурстар", href: "/kk/resources", keywords: ["ресурс"] },
];

export async function GET(request: NextRequest) {
  const blocked = enforceRateLimit(request, { bucket: "global-search", max: 60, windowMs: 60_000 });
  if (blocked) return blocked;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const locale = url.searchParams.get("locale") === "kk" ? "kk" : "ru";
  if (q.length < 2) {
    return NextResponse.json({ books: [], events: [], news: [], sections: [] });
  }
  const like = `%${q}%`;

  const [books, events, news] = await Promise.all([
    getMany(
      `SELECT id, title, author, cover_url FROM books
       WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1
       ORDER BY created_at DESC LIMIT 5`,
      [like]
    ),
    getMany(
      `SELECT id, title_ru, title_kk, start_date FROM events
       WHERE title_ru ILIKE $1 OR title_kk ILIKE $1 OR description_ru ILIKE $1
       ORDER BY start_date DESC LIMIT 5`,
      [like]
    ),
    getMany(
      `SELECT id, slug, title_ru, title_kk FROM news
       WHERE status='published' AND (title_ru ILIKE $1 OR title_kk ILIKE $1 OR content_ru ILIKE $1)
       ORDER BY published_at DESC NULLS LAST LIMIT 5`,
      [like]
    ),
  ]);

  const sections = (locale === "kk" ? SECTIONS_KK : SECTIONS_RU)
    .filter((s) => {
      const hay = (s.title + " " + s.keywords.join(" ")).toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .slice(0, 5);

  return NextResponse.json({ books, events, news, sections });
}
