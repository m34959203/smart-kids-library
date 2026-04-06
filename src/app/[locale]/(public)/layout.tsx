import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import ChatWidget from "@/components/features/ChatWidget";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  return (
    <>
      <Header locale={validLocale} messages={messages as Record<string, Record<string, string>>} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer locale={validLocale} messages={messages as Record<string, Record<string, string>>} />
      <BottomNav locale={validLocale} />
      <ChatWidget locale={validLocale} />
    </>
  );
}
