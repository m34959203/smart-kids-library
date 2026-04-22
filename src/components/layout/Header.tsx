"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AgeProfileSwitcher from "./AgeProfileSwitcher";
import AgeMenu from "./AgeMenu";
import GlobalSearch from "@/components/features/GlobalSearch";

interface HeaderProps {
  locale: string;
  messages: Record<string, Record<string, string>>;
}

export default function Header({ locale, messages }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const nav = messages.nav ?? {};
  const altLocale = locale === "ru" ? "kk" : "ru";

  const navLinks = [
    { href: `/${locale}`, label: nav.home ?? "Home" },
    { href: `/${locale}/catalog`, label: nav.catalog ?? "Catalog" },
    { href: `/${locale}/kids`, label: nav.kids ?? "Kids" },
    { href: `/${locale}/events`, label: nav.events ?? "Events" },
    { href: `/${locale}/news`, label: nav.news ?? "News" },
    { href: `/${locale}/about`, label: nav.about ?? "About" },
    { href: `/${locale}/contacts`, label: nav.contacts ?? "Contacts" },
  ];

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(250, 245, 234, 0.82)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип — editorial wordmark */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div
              className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <Image
                src="/illustrations/ai-helper.jpg"
                alt="Smart Kids Library"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display font-semibold text-[15px] tracking-tight text-foreground">
                Smart Kids Library
              </span>
              <span className="text-[11px] tracking-[0.18em] uppercase mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                Satpayev · с 2006
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main">
            <AgeMenu locale={locale} fallback={navLinks} />
          </nav>

          {/* Глобальный поиск (desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <GlobalSearch locale={locale} />
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-2">
            {/* Live-голосовой диалог с ИИ */}
            <Link
              href={`/${locale}/live`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-colors"
              style={{ background: "var(--primary)", color: "white" }}
              title={locale === "kk" ? "Тірі дауыстық диалог" : "Живой голосовой диалог с ИИ"}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m14 0v3m-7 7v-3m-7-7v3m7 0a3 3 0 003-3V8a3 3 0 00-6 0v3a3 3 0 003 3z" />
              </svg>
              Live
            </Link>
            <AgeProfileSwitcher locale={locale} />

            {/* Переключатель языка */}
            <Link
              href={`/${altLocale}`}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-widest uppercase border transition-colors"
              style={{
                color: "var(--foreground)",
                borderColor: "var(--border)",
                backgroundColor: "transparent",
              }}
            >
              {altLocale === "kk" ? "KZ" : "RU"}
            </Link>

            {/* Профиль */}
            <Link
              href={`/${locale}/profile`}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--foreground-muted)" }}
              aria-label="Profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Мобильное меню */}
            <button
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--foreground)" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden animate-slide-up"
          style={{
            backgroundColor: "var(--surface)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-2" aria-label="Mobile">
            <div>
              <GlobalSearch locale={locale} />
            </div>

            {/* Live — на мобиле выделенной кнопкой */}
            <Link
              href={`/${locale}/live`}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: "var(--primary)", color: "white" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m14 0v3m-7 7v-3m-7-7v3m7 0a3 3 0 003-3V8a3 3 0 00-6 0v3a3 3 0 003 3z" />
              </svg>
              {locale === "kk" ? "Тірі дауыстық диалог" : "Живой голосовой диалог"}
            </Link>

            <div className="pt-2 pb-1 px-4 text-[10px] uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
              {locale === "kk" ? "Бөлімдер" : "Разделы"}
            </div>
            <AgeMenu locale={locale} fallback={navLinks} variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />

            <div className="pt-2 pb-1 px-4 text-[10px] uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>
              {locale === "kk" ? "Кітапхана" : "Библиотека"}
            </div>
            {[
              { href: `/${locale}/about`, label: nav.about ?? "О библиотеке" },
              { href: `/${locale}/rules`, label: nav.rules ?? "Правила" },
              { href: `/${locale}/services`, label: nav.services ?? "Услуги" },
              { href: `/${locale}/contacts`, label: nav.contacts ?? "Контакты" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-all"
                style={{ color: "var(--foreground-muted)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
