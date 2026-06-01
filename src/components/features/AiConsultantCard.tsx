"use client";

interface AiConsultantCardProps {
  index: number;
  title: string;
  text: string;
  cta: string;
}

/**
 * Карточка «ИИ-консультант Кітапхан» на главной.
 * Кликабельна → открывает текстовый чат-виджет (ChatWidget слушает "open-chat").
 * Раньше была статичным блоком — пользователи (и сам владелец) не находили чат.
 */
export default function AiConsultantCard({ index, title, text, cta }: AiConsultantCardProps) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
      className="group p-6 md:p-8 md:border-r last:border-r-0 border-b md:border-b-0 text-left w-full transition-colors hover:bg-[var(--primary-light)] focus-visible:outline-none focus-visible:ring-2 ring-[var(--accent)]/50"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="font-mono text-xs tracking-widest mb-4"
        style={{ color: "var(--foreground-muted)" }}
      >
        {String(index + 1).padStart(2, "0")} / 03
      </div>
      <h3 className="font-display text-xl md:text-2xl font-semibold mb-3 text-foreground">
        {title}
      </h3>
      <p className="text-sm" style={{ color: "var(--foreground-muted)", lineHeight: 1.65 }}>
        {text}
      </p>
      <span
        className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold transition-colors"
        style={{ color: "var(--primary)" }}
      >
        {cta}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </button>
  );
}
