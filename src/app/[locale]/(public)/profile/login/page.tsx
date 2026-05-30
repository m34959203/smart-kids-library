import { redirect } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";

/**
 * Шим для P2-3: форма входа живёт на `/profile`, но прямые ссылки/закладки
 * на `/profile/login` давали 404. Редиректим на `/profile`, сохраняя `next`.
 */
export default async function ProfileLoginRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const validLocale = isValidLocale(locale) ? locale : "ru";
  const nextRaw = sp.next;
  const next = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  const qs = next ? `?next=${encodeURIComponent(next)}` : "";
  redirect(`/${validLocale}/profile${qs}`);
}
