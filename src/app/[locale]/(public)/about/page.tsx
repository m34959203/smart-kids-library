import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import CmsBlock from "@/components/features/CmsBlock";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const kk = validLocale === "kk";

  const sections = [
    { title: t(messages, "about.mission"), text: t(messages, "about.missionText"), tag: "01" },
    {
      title: t(messages, "about.history"),
      text: kk
        ? "Сатпаев қаласының балалар кітапханасы 1970 жылы құрылған. Жылдар бойы кітапхана мыңдаған балалар мен жасөспірімдерге қызмет көрсетіп, оқуға деген сүйіспеншілікті қалыптастыруда. 2024 жылы кітапхана Smart Kids Library жобасы аясында цифрлық трансформациядан өтті."
        : "Детская библиотека города Сатпаев была основана в 1970 году. На протяжении десятилетий библиотека служит тысячам детей и подростков, прививая любовь к чтению. В 2024 году библиотека прошла цифровую трансформацию в рамках проекта Smart Kids Library.",
      tag: "02",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {/* Hero */}
      <header className="mb-14 md:mb-20">
        <div className="section-eyebrow mb-4 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-current" aria-hidden />
          {kk ? "Кітапхана туралы" : "О библиотеке"}
        </div>
        <h1 className="display-hero text-[44px] md:text-[64px] leading-[1.02] text-foreground mb-6">
          {t(messages, "about.title")}
        </h1>
        <p className="text-lg md:text-xl max-w-2xl" style={{ color: "var(--foreground-muted)", lineHeight: 1.55 }}>
          {t(messages, "about.description")}
        </p>
      </header>

      {/* CMS-перекрытие из админки (если задано) */}
      <div className="mb-10"><CmsBlock slug="about" locale={validLocale} /></div>

      {/* Секции — editorial */}
      <div className="space-y-14">
        {sections.map((s) => (
          <section key={s.tag}>
            <div className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--primary)" }}>
              {s.tag} / {String(sections.length).padStart(2, "0")}
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">{s.title}</h2>
            <p className="text-[17px] leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
              {s.text}
            </p>
          </section>
        ))}

        {/* Часы */}
        <section>
          <div className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--primary)" }}>
            03 / 03
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">{t(messages, "about.hours")}</h2>
          <p className="text-[17px] mb-6" style={{ color: "var(--foreground-muted)" }}>
            {t(messages, "about.hoursText")}
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-[11px] tracking-widest uppercase font-semibold" style={{ color: "var(--foreground-muted)" }}>
                {kk ? "Дс–Жм" : "Пн–Пт"}
              </p>
              <p className="font-display text-2xl font-semibold mt-2" style={{ color: "var(--primary)" }}>
                9:00 — 18:00
              </p>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-[11px] tracking-widest uppercase font-semibold" style={{ color: "var(--foreground-muted)" }}>
                {kk ? "Сб" : "Сб"}
              </p>
              <p className="font-display text-2xl font-semibold mt-2" style={{ color: "var(--primary)" }}>
                10:00 — 16:00
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
