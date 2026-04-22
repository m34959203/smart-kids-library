import Link from "next/link";
import { getOne } from "@/lib/db";

interface FooterProps {
  locale: string;
  messages: Record<string, Record<string, string>>;
}

interface SiteInfo {
  name: string;
  phone: string;
  phoneSecondary?: string;
  whatsapp?: string;
  email: string;
  address: string;
  founded: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
  whatsappUrl?: string;
}

async function fetchSite(locale: string): Promise<SiteInfo> {
  const keys = [
    "library_name",
    "library_name_kk",
    "library_phone",
    "library_phone_secondary",
    "library_whatsapp",
    "library_email",
    "library_address_ru",
    "library_address_kk",
    "library_founded",
    "social_instagram_url",
    "social_youtube_url",
    "social_facebook_url",
    "social_whatsapp_url",
  ];
  const rows = await Promise.all(
    keys.map((k) => getOne<{ value: string }>("SELECT value FROM site_settings WHERE key=$1", [k]).catch(() => null))
  );
  const m: Record<string, string> = {};
  keys.forEach((k, i) => {
    m[k] = rows[i]?.value || "";
  });
  return {
    name: locale === "kk" ? m.library_name_kk || m.library_name : m.library_name,
    phone: m.library_phone,
    phoneSecondary: m.library_phone_secondary,
    whatsapp: m.library_whatsapp,
    email: m.library_email,
    address: locale === "kk" ? m.library_address_kk || m.library_address_ru : m.library_address_ru,
    founded: m.library_founded || "2006",
    instagram: m.social_instagram_url,
    youtube: m.social_youtube_url,
    facebook: m.social_facebook_url,
    whatsappUrl: m.social_whatsapp_url,
  };
}

export default async function Footer({ locale, messages }: FooterProps) {
  const nav = messages.nav ?? {};
  const kk = locale === "kk";
  const site = await fetchSite(locale);
  const phoneTel = (site.phone || "").replace(/[^\d+]/g, "");
  const whatsappTel = (site.whatsapp || "").replace(/[^\d+]/g, "");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto" style={{ backgroundColor: "var(--foreground)", color: "#ece6d6" }}>
      <div className="max-w-7xl mx-auto px-4 py-16">
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
                <div className="text-[11px] tracking-[0.2em] uppercase opacity-60 mt-0.5">
                  Satpayev · с {site.founded}
                </div>
              </div>
            </div>
            <p className="text-sm opacity-70 max-w-sm leading-relaxed">
              {kk
                ? "Сәтбаев қаласының балалар мен жасөспірімдер кітапханасы — кітаптар, ЖИ-көмекші, дауыстық диалог, ертегілер мен викториналар."
                : "Детская и юношеская библиотека города Сатпаев — каталог, ИИ-консультант, голосовой диалог, сказки и викторины."}
            </p>
            <p className="text-xs mt-4 opacity-55">{site.name}</p>
          </div>

          {/* Навигация */}
          <div className="md:col-span-2">
            <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold opacity-50 mb-4">
              {kk ? "Бөлімдер" : "Разделы"}
            </h3>
            <div className="space-y-2.5">
              <FLink href={`/${locale}/catalog`}>{nav.catalog ?? "Каталог"}</FLink>
              <FLink href={`/${locale}/events`}>{nav.events ?? "События"}</FLink>
              <FLink href={`/${locale}/news`}>{nav.news ?? "Новости"}</FLink>
              <FLink href={`/${locale}/kids`}>{nav.kids ?? "Детям"}</FLink>
              <FLink href={`/${locale}/live`}>🎙 {kk ? "Тірі диалог" : "Live диалог"}</FLink>
            </div>
          </div>

          {/* О библиотеке */}
          <div className="md:col-span-2">
            <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold opacity-50 mb-4">
              {kk ? "Кітапхана" : "Библиотека"}
            </h3>
            <div className="space-y-2.5">
              <FLink href={`/${locale}/about`}>{nav.about ?? "О библиотеке"}</FLink>
              <FLink href={`/${locale}/rules`}>{nav.rules ?? "Правила"}</FLink>
              <FLink href={`/${locale}/resources`}>{nav.resources ?? "Ресурсы"}</FLink>
              <FLink href={`/${locale}/services`}>{nav.services ?? "Услуги"}</FLink>
              <FLink href={`/${locale}/contacts`}>{nav.contacts ?? "Контакты"}</FLink>
            </div>
          </div>

          {/* Контакты — реальные данные из site_settings */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold opacity-50 mb-4">
              {kk ? "Байланыс" : "Контакты"}
            </h3>
            <div className="space-y-2 text-sm opacity-80">
              {site.address && <p>{site.address}</p>}
              {site.phone && (
                <p>
                  <a href={`tel:${phoneTel}`} className="hover:text-white transition-colors">
                    {site.phone}
                  </a>
                  {site.phoneSecondary && (
                    <>
                      {" · "}
                      <a href={`tel:${site.phoneSecondary.replace(/[^\d+]/g, "")}`} className="hover:text-white transition-colors">
                        {site.phoneSecondary}
                      </a>
                    </>
                  )}
                </p>
              )}
              {site.whatsapp && (
                <p>
                  <a
                    href={site.whatsappUrl || `https://wa.me/${whatsappTel}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    WhatsApp: {site.whatsapp}
                  </a>
                </p>
              )}
              {site.email && (
                <p>
                  <a href={`mailto:${site.email}`} className="hover:text-white transition-colors">
                    {site.email}
                  </a>
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              {site.instagram && (
                <SocialBtn href={site.instagram} label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </SocialBtn>
              )}
              {site.youtube && (
                <SocialBtn href={site.youtube} label="YouTube">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </SocialBtn>
              )}
              {site.facebook && (
                <SocialBtn href={site.facebook} label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </SocialBtn>
              )}
            </div>
          </div>
        </div>

        {/* Низ */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs opacity-55"
          style={{ borderTop: "1px solid rgba(236, 230, 214, 0.12)" }}
        >
          <p>
            &copy; {site.founded}–{currentYear} {site.name || "Smart Kids Library Satpayev"}.{" "}
            {kk ? "Барлық құқықтар қорғалған." : "Все права защищены."}
          </p>
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
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
      style={{
        backgroundColor: "rgba(236, 230, 214, 0.06)",
        border: "1px solid rgba(236, 230, 214, 0.12)",
      }}
    >
      {children}
    </a>
  );
}
