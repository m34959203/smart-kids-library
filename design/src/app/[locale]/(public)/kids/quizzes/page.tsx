import { isValidLocale, type Locale } from "@/lib/i18n";
import QuizGame from "@/components/features/QuizGame";

export default async function QuizzesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <QuizGame locale={validLocale} />
    </div>
  );
}
