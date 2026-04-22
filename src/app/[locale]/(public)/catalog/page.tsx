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
  const kk = validLocale === "kk";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <header className="mb-10 md:mb-12 max-w-3xl">
        <div className="section-eyebrow mb-4 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "Каталог" : "Каталог"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[60px] leading-[1.02] text-foreground">
          {t(messages, "catalog.title")}
        </h1>
        <p className="mt-5 text-lg" style={{ color: "var(--foreground-muted)" }}>
          {t(messages, "catalog.smartSearch")}
        </p>
      </header>

      <SmartSearch locale={validLocale} />
      <ContextualHints page="catalog" locale={validLocale} />
    </div>
  );
}
