"use client";

import { useState } from "react";
import Link from "next/link";
import AgeProfileSwitcher from "./AgeProfileSwitcher";
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
    <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
              <BookIcon className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-purple-900 text-sm leading-tight">Smart Kids</div>
              <div className="text-xs text-purple-500 leading-tight">Library Satpayev</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <AgeProfileSwitcher locale={locale} />

            {/* Language switcher */}
            <Link
              href={`/${altLocale}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              {altLocale === "kk" ? "KZ" : "RU"}
            </Link>

            {/* Profile */}
            <Link
              href={`/${locale}/profile`}
              className="p-2 rounded-xl hover:bg-purple-50 transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-purple-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-purple-100 animate-slide-up">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/services`}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
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
