import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import { getMany } from "@/lib/db";

const KEYS = [
  "library_address", "library_address_kk",
  "library_phone", "library_phone_secondary",
  "library_whatsapp", "social_whatsapp_url",
  "library_email", "library_hours",
  "social_instagram_url", "social_telegram_url",
  "social_facebook_url", "social_youtube_url",
] as const;

async function getContacts(): Promise<Record<string, string>> {
  try {
    const rows = await getMany<{ key: string; value: string | null }>(
      `SELECT key, value FROM site_settings WHERE key = ANY($1)`,
      [KEYS as unknown as string[]]
    );
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.value && r.value.trim()) map[r.key] = r.value.trim();
    }
    return map;
  } catch {
    return {};
  }
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const c = await getContacts();
  const kk = validLocale === "kk";

  const address = (kk ? c.library_address_kk : c.library_address) || c.library_address || c.library_address_kk;
  const whatsappTel = (c.library_whatsapp || "").replace(/[^\d+]/g, "");
  const whatsappLink = c.social_whatsapp_url || (whatsappTel ? `https://wa.me/${whatsappTel.replace(/\D/g, "")}` : null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">{t(messages, "contacts.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            {address && (
              <Row icon="📍" title={t(messages, "contacts.address")}>{address}</Row>
            )}
            {c.library_phone && (
              <Row icon="📞" title={t(messages, "contacts.phone")}>
                <a href={`tel:${c.library_phone.replace(/\s/g, "")}`} className="hover:underline">{c.library_phone}</a>
                {c.library_phone_secondary && (
                  <>
                    <span className="text-gray-400 mx-2">·</span>
                    <a href={`tel:${c.library_phone_secondary.replace(/\s/g, "")}`} className="hover:underline">
                      {c.library_phone_secondary}
                    </a>
                  </>
                )}
              </Row>
            )}
            {whatsappLink && c.library_whatsapp && (
              <Row icon="💬" title="WhatsApp">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="hover:underline">
                  {c.library_whatsapp}
                </a>
              </Row>
            )}
            {c.library_email && (
              <Row icon="✉" title={t(messages, "contacts.email")}>
                <a href={`mailto:${c.library_email}`} className="hover:underline">{c.library_email}</a>
              </Row>
            )}
            {c.library_hours && (
              <Row icon="🕐" title={kk ? "Жұмыс уақыты" : "Часы работы"}>{c.library_hours}</Row>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-purple-900 mb-4">{t(messages, "contacts.socialMedia")}</h3>
          <div className="space-y-3">
            {c.social_instagram_url && (
              <SocialLink href={c.social_instagram_url} bg="from-pink-50 to-purple-50">
                Instagram
              </SocialLink>
            )}
            {c.social_telegram_url && (
              <SocialLink href={c.social_telegram_url} bg="from-blue-50 to-cyan-50">
                Telegram
              </SocialLink>
            )}
            {c.social_facebook_url && (
              <SocialLink href={c.social_facebook_url} bg="from-blue-50 to-indigo-50">
                Facebook
              </SocialLink>
            )}
            {c.social_youtube_url && (
              <SocialLink href={c.social_youtube_url} bg="from-red-50 to-orange-50">
                YouTube
              </SocialLink>
            )}
            {!c.social_instagram_url && !c.social_telegram_url && !c.social_facebook_url && !c.social_youtube_url && (
              <p className="text-sm text-gray-500">
                {kk ? "Әлеуметтік желілер әлі қосылмаған." : "Социальные сети пока не подключены."}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0 text-xl" aria-hidden>
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-purple-900">{title}</h3>
        <div className="text-gray-600 break-words">{children}</div>
      </div>
    </div>
  );
}

function SocialLink({ href, bg, children }: { href: string; bg: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${bg} hover:brightness-95 transition-colors`}
    >
      <span className="text-base font-medium">{children}</span>
      <span className="text-gray-500 text-sm truncate">{new URL(href).hostname.replace(/^www\./, "")}</span>
    </a>
  );
}
