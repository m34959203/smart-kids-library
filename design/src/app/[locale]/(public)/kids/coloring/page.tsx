import { isValidLocale, type Locale } from "@/lib/i18n";
import ColoringGenerator from "@/components/features/ColoringGenerator";

export default async function ColoringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ColoringGenerator locale={validLocale} />
    </div>
  );
}
