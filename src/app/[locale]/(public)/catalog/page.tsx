import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import SmartSearch from "@/components/features/SmartSearch";
import ContextualHints from "@/components/features/ContextualHints";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-900 mb-2">{t(messages, "catalog.title")}</h1>
      <p className="text-gray-500 mb-6">{t(messages, "catalog.smartSearch")}</p>
      <SmartSearch locale={validLocale} />
      <ContextualHints page="catalog" locale={validLocale} />
    </div>
  );
}
