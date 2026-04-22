export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(date: string | Date, locale: string = "ru"): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: string | Date, locale: string = "ru"): string {
  const d = new Date(date);
  return d.toLocaleTimeString(locale === "kk" ? "kk-KZ" : "ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type AgeGroup = "6-9" | "10-13" | "14-17";

export function getAgeGroupLabel(group: AgeGroup, locale: string): string {
  const labels: Record<AgeGroup, Record<string, string>> = {
    "6-9": { ru: "6-9 лет", kk: "6-9 жас" },
    "10-13": { ru: "10-13 лет", kk: "10-13 жас" },
    "14-17": { ru: "14-17 лет", kk: "14-17 жас" },
  };
  return labels[group]?.[locale] ?? labels[group]?.ru ?? group;
}

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    workshop: "bg-green-500",
    author_meeting: "bg-blue-500",
    contest: "bg-orange-500",
    exhibition: "bg-purple-500",
    reading: "bg-pink-500",
    default: "bg-gray-500",
  };
  return colors[type] ?? colors.default;
}

export function getEventTypeBorder(type: string): string {
  const colors: Record<string, string> = {
    workshop: "border-green-500",
    author_meeting: "border-blue-500",
    contest: "border-orange-500",
    exhibition: "border-purple-500",
    reading: "border-pink-500",
    default: "border-gray-500",
  };
  return colors[type] ?? colors.default;
}
