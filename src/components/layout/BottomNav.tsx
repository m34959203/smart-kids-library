"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  locale: string;
}

export default function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    {
      href: `/${locale}`,
      label: locale === "kk" ? "Басты" : "Главная",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
        </svg>
      ),
    },
    {
      href: `/${locale}/catalog`,
      label: locale === "kk" ? "Каталог" : "Каталог",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h4v14H4zM10 5h4v14h-4zM16 8l3-1 2 14-3 1z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/kids`,
      label: locale === "kk" ? "Балалар" : "Детям",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="9" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
          <path strokeLinecap="round" d="M9 4l-1-1M15 4l1-1" />
        </svg>
      ),
    },
    {
      href: `/${locale}/events`,
      label: locale === "kk" ? "Оқиғалар" : "События",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3m8-3v3M4 8h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/live`,
      label: locale === "kk" ? "Дауыс" : "Голос",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m14 0v3m-7 7v-3m-7-7v3m7 0a3 3 0 003-3V8a3 3 0 00-6 0v3a3 3 0 003 3z" />
        </svg>
      ),
      highlight: true,
    },
    {
      href: `/${locale}/profile`,
      label: locale === "kk" ? "Профиль" : "Профиль",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 21a7 7 0 0114 0" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        backgroundColor: "rgba(250, 245, 234, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));
          const highlight = "highlight" in item && item.highlight;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              )}
              style={{
                color: highlight ? "var(--primary)" : isActive ? "var(--primary)" : "var(--foreground-muted)",
              }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-b"
                  style={{ backgroundColor: "var(--primary)" }}
                />
              )}
              {item.icon}
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
