import { redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";

export default async function LocalLoreRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  redirect(`/${validLocale}/catalog?section=lore`);
}
