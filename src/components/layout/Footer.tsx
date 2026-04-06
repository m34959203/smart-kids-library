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

  return (
    <footer className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-sm">Smart Kids Library</div>
                <div className="text-xs text-purple-300">Satpayev</div>
              </div>
            </div>
            <p className="text-sm text-purple-200">{footer.address}</p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold mb-4 text-purple-200">{nav.home}</h3>
            <div className="space-y-2">
              <Link href={`/${locale}/catalog`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.catalog}</Link>
              <Link href={`/${locale}/events`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.events}</Link>
              <Link href={`/${locale}/news`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.news}</Link>
              <Link href={`/${locale}/kids`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.kids}</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold mb-4 text-purple-200">{nav.about}</h3>
            <div className="space-y-2">
              <Link href={`/${locale}/about`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.about}</Link>
              <Link href={`/${locale}/rules`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.rules}</Link>
              <Link href={`/${locale}/resources`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.resources}</Link>
              <Link href={`/${locale}/services`} className="block text-sm text-purple-300 hover:text-white transition-colors">{nav.services}</Link>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="font-bold mb-4 text-purple-200">{contacts.title}</h3>
            <div className="space-y-2 text-sm text-purple-300">
              <p>{contacts.addressText}</p>
              <p>+7 (710) 63-1-23-45</p>
              <p>library@satpaev.kz</p>
            </div>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Telegram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 1 0 24 12.056A12.013 12.013 0 0 0 11.944 0Zm4.962 7.166c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.492-1.302.48-.428-.012-1.252-.242-1.865-.442-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-purple-800 text-center text-sm text-purple-400">
          <p>&copy; 2024-2026 {footer.copyright}. {footer.rights}.</p>
        </div>
      </div>
    </footer>
  );
}
