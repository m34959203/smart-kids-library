"use client";

import Link from "next/link";

interface FooterProps {
  locale: string;
  messages: Record<string, Record<string, string>>;
}

export default function Footer({ locale, messages }: FooterProps) {
  const footer = messages.footer ?? {};
  const nav = messages.nav ?? {};
  const contacts = messages.contacts ?? {};
  const kk = locale === "kk";

  return (
    <footer className="mt-auto" style={{ backgroundColor: "var(--foreground)", color: "#ece6d6" }}>
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Верхний блок: бренд + ссылки */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Бренд */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg font-semibold text-white">Smart Kids Library</div>
                <div className="text-[11px] tracking-[0.2em] uppercase opacity-60 mt-0.5">Satpayev · с 1970</div>
              </div>
            </div>
            <p className="text-sm opacity-70 max-w-sm leading-relaxed">
              {kk
                ? "Сәтбаев қаласының балалар мен жасөспірімдер кітапханасы. Барлығы — кітаптар мен технологиялар арқылы балалардың дамуы үшін."
                : "Детская и юношеская библиотека города Сатпаев. Всё для развития ребёнка через книги и технологии."}
            </p>
            <p className="text-xs mt-4 opacity-55">{footer.address}</p>
          </div>

          {/* Навигация */}
          <div className="md:col-span-2">
            <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold opacity-50 mb-4">
              {kk ? "Навигация" : "Навигация"}
            </h3>
            <div className="space-y-2.5">
              <FLink href={`/${locale}/catalog`}>{nav.catalog}</FLink>
              <FLink href={`/${locale}/events`}>{nav.events}</FLink>
              <FLink href={`/${locale}/news`}>{nav.news}</FLink>
              <FLink href={`/${locale}/kids`}>{nav.kids}</FLink>
            </div>
          </div>

          {/* Инфо */}
          <div className="md:col-span-2">
            <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold opacity-50 mb-4">
              {kk ? "Кітапхана" : "Библиотека"}
            </h3>
            <div className="space-y-2.5">
              <FLink href={`/${locale}/about`}>{nav.about}</FLink>
              <FLink href={`/${locale}/rules`}>{nav.rules}</FLink>
              <FLink href={`/${locale}/resources`}>{nav.resources}</FLink>
              <FLink href={`/${locale}/services`}>{nav.services}</FLink>
            </div>
          </div>

          {/* Контакты */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold opacity-50 mb-4">
              {contacts.title ?? "Контакты"}
            </h3>
            <div className="space-y-2 text-sm opacity-80">
              <p>{contacts.addressText}</p>
              <p>
                <a href="tel:+77106312345" className="hover:text-white transition-colors">
                  +7 (710) 63-1-23-45
                </a>
              </p>
              <p>
                <a href="mailto:library@satpaev.kz" className="hover:text-white transition-colors">
                  library@satpaev.kz
                </a>
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <SocialBtn href="#" label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </SocialBtn>
              <SocialBtn href="#" label="Telegram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 1 0 24 12.056A12.013 12.013 0 0 0 11.944 0Zm4.962 7.166c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.492-1.302.48-.428-.012-1.252-.242-1.865-.442-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z"/></svg>
              </SocialBtn>
            </div>
          </div>
        </div>

        {/* Низ */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs opacity-55"
          style={{ borderTop: "1px solid rgba(236, 230, 214, 0.12)" }}
        >
          <p>&copy; 2024–2026 {footer.copyright}. {footer.rights}.</p>
          <p className="font-mono tracking-widest">v2.0 · Redesigned 2026</p>
        </div>
      </div>
    </footer>
  );
}

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-sm opacity-75 hover:opacity-100 hover:text-white transition-all">
      {children}
    </Link>
  );
}

function SocialBtn({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
      style={{
        backgroundColor: "rgba(236, 230, 214, 0.06)",
        border: "1px solid rgba(236, 230, 214, 0.12)",
      }}
    >
      {children}
    </a>
  );
}
