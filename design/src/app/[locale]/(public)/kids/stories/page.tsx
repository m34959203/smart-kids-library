import { isValidLocale, type Locale } from "@/lib/i18n";
import StoryGenerator from "@/components/features/StoryGenerator";

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <StoryGenerator locale={validLocale} />
    </div>
  );
}
