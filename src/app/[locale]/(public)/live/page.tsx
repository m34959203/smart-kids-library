import { isValidLocale, type Locale } from "@/lib/i18n";
import LiveVoiceDialog from "@/components/features/LiveVoiceDialog";

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const kk = validLocale === "kk";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14 space-y-8">
      <header>
        <div className="section-eyebrow mb-3 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "ЖИ · Тірі диалог" : "ИИ · Живой диалог"}
        </div>
        <h1 className="display-hero text-[40px] md:text-[52px] leading-[1.05]">
          {kk ? "Кітапханмен сөйлес" : "Поговори с Кітапханом голосом"}
        </h1>
        <p className="mt-5 text-lg" style={{ color: "var(--foreground-muted)" }}>
          {kk
            ? "Gemini Live native-audio · қазақ және орыс тілдерінде. Микрофон қажет."
            : "Gemini Live native-audio · казахский и русский языки. Нужен доступ к микрофону."}
        </p>
      </header>

      <LiveVoiceDialog locale={validLocale} />

      <aside
        className="rounded-2xl p-5 text-sm"
        style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
      >
        <p className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          {kk ? "Не сұрауға болады?" : "О чём можно спросить?"}
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{kk ? "Кітапхана мекен-жайы мен жұмыс уақыты" : "Адрес и часы работы библиотеки"}</li>
          <li>{kk ? "Жасыңа сай кітап ұсыныстары" : "Какую книгу почитать по возрасту"}</li>
          <li>{kk ? "Жақын арада өтетін іс-шаралар" : "Ближайшие мероприятия"}</li>
          <li>{kk ? "Үй жұмысы, реферат тақырыптары" : "Помощь со школьным заданием или рефератом"}</li>
        </ul>
      </aside>
    </div>
  );
}
