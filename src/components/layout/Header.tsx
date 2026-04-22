"use client";

import { useState } from "react";
import Link from "next/link";
import AgeProfileSwitcher from "./AgeProfileSwitcher";
import AgeMenu from "./AgeMenu";
import GlobalSearch from "@/components/features/GlobalSearch";
import { BookIcon } from "@/components/icons/age-icons";

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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <BookIcon className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display font-semibold text-[15px] tracking-tight text-foreground">
                Smart Kids Library
              </span>
              <span className="text-[11px] tracking-[0.18em] uppercase mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                Satpayev · с 1970
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
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-3" aria-label="Mobile">
            <div className="md:hidden">
              <GlobalSearch locale={locale} />
            </div>
            <AgeMenu locale={locale} fallback={navLinks} variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
            <Link
              href={`/${locale}/services`}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-all"
              style={{ color: "var(--foreground-muted)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {nav.services ?? "Services"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
