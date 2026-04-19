"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, { ru: string; kk: string }> = {
  catalog: { ru: "Каталог", kk: "Каталог" },
  kids: { ru: "Детям", kk: "Балаларға" },
  stories: { ru: "Сказки", kk: "Ертегілер" },
  quizzes: { ru: "Викторины", kk: "Викториналар" },
  workshop: { ru: "Мастерская", kk: "Шеберхана" },
  coloring: { ru: "Раскраски", kk: "Бояулар" },
  events: { ru: "События", kk: "Оқиғалар" },
  news: { ru: "Новости", kk: "Жаңалықтар" },
  about: { ru: "О библиотеке", kk: "Кітапхана туралы" },
  contacts: { ru: "Контакты", kk: "Байланыстар" },
  rules: { ru: "Правила", kk: "Ережелер" },
  services: { ru: "Услуги", kk: "Қызметтер" },
  resources: { ru: "Ресурсы", kk: "Ресурстар" },
  profile: { ru: "Профиль", kk: "Профиль" },
  read: { ru: "Чтение", kk: "Оқу" },
};

export default function Breadcrumbs() {
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) return null;

  const locale = parts[0] === "ru" || parts[0] === "kk" ? parts[0] : "ru";
  const kk = locale === "kk";
  const segments = parts.slice(1);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = `/${locale}/${segments.slice(0, i + 1).join("/")}`;
    const base = LABELS[seg];
    // If segment is numeric id or slug, try to beautify
    const label = base ? base[kk ? "kk" : "ru"] : decodeURIComponent(seg).replace(/-/g, " ");
    return { href, label, isLast: i === segments.length - 1 };
  });

  const homeLabel = kk ? "Басты" : "Главная";

  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 pt-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <li>
          <Link href={`/${locale}`} className="hover:text-purple-700">{homeLabel}</Link>
        </li>
        {crumbs.map((c) => (
          <li key={c.href} className="flex items-center gap-1">
            <span aria-hidden="true">›</span>
            {c.isLast ? (
              <span className="text-purple-700 font-medium truncate max-w-[180px]" aria-current="page">{c.label}</span>
            ) : (
              <Link href={c.href} className="hover:text-purple-700 truncate max-w-[140px]">{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
