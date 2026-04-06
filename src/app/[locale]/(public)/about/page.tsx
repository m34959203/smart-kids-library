import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-900 mb-6">{t(messages, "about.title")}</h1>

      <div className="space-y-6">
        <Card className="p-6 md:p-8">
          <p className="text-lg text-gray-700 leading-relaxed">{t(messages, "about.description")}</p>
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-purple-900 mb-3">{t(messages, "about.mission")}</h2>
          <p className="text-gray-700 leading-relaxed">{t(messages, "about.missionText")}</p>
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-purple-900 mb-3">{t(messages, "about.hours")}</h2>
          <p className="text-gray-700">{t(messages, "about.hoursText")}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="font-medium text-purple-900">{validLocale === "kk" ? "Дс-Жм" : "Пн-Пт"}</p>
              <p className="text-purple-600">9:00 - 18:00</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="font-medium text-purple-900">{validLocale === "kk" ? "Сб" : "Сб"}</p>
              <p className="text-purple-600">10:00 - 16:00</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-purple-900 mb-3">{t(messages, "about.history")}</h2>
          <p className="text-gray-700 leading-relaxed">
            {validLocale === "kk"
              ? "Сатпаев қаласының балалар кітапханасы 1970 жылы құрылған. Жылдар бойы кітапхана мыңдаған балалар мен жасөспірімдерге қызмет көрсетіп, оқуға деген сүйіспеншілікті қалыптастыруда. 2024 жылы кітапхана Smart Kids Library жобасы аясында цифрлық трансформациядан өтті."
              : "Детская библиотека города Сатпаев была основана в 1970 году. На протяжении десятилетий библиотека служит тысячам детей и подростков, прививая любовь к чтению. В 2024 году библиотека прошла цифровую трансформацию в рамках проекта Smart Kids Library."}
          </p>
        </Card>
      </div>
    </div>
  );
}
